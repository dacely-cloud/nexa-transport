import { afterEach, expect, it, vi } from 'vitest';
import { CompanyHostProtocol } from '../src/company/CompanyHostProtocol.js';
import {
    HostOp,
    type CompanyHostPacket,
    type CompanyHostState,
} from '../src/company/CompanyHostTypes.js';
import { CompanyHostFormat } from '../src/networking/CompanyHostFormat.js';
import { CompanyChannel } from '../src/networking/CompanyChannel.js';
import { NexaClient } from '../src/networking/NexaClient.js';
import { TestGateway } from './Support.js';

afterEach(() => vi.useRealTimers());
const state: CompanyHostState = {
    revision: 1n,
    sampledAt: 1000n,
    status: 'connected',
    parallelism: 8,
    memory: 9007199254740993n,
    commands: 2,
};

it('roundtrips exact resources and rejects truncation, trailing bytes, invalid capacity and wrapped fields', () => {
    const packets: CompanyHostPacket[] = [
        { op: HostOp.Read, id: 'read' },
        { op: HostOp.Subscribe, id: 'watch' },
        { op: HostOp.Unsubscribe, id: 'watch' },
        { op: HostOp.Snapshot, id: 'read', sequence: 0n, state },
        { op: HostOp.Update, id: 'watch', sequence: 1n, state },
        { op: HostOp.Error, id: 'error', message: 'Unavailable' },
        { op: HostOp.Stopped, id: 'watch', message: '' },
        ...(['local', 'disconnected', 'unassigned', 'unsupported', 'unavailable'] as const).map(
            (status) => ({
                op: HostOp.Snapshot,
                id: status,
                sequence: 0n,
                state:
                    status === 'local'
                        ? { revision: 0n, sampledAt: 1n, status, parallelism: 1, memory: 100n }
                        : { revision: 0n, sampledAt: 1n, status },
            }),
        ),
    ];
    for (const packet of packets) {
        const bytes = CompanyHostProtocol.encode(packet);
        expect(CompanyHostProtocol.decode(bytes)).toEqual(packet);
        expect(() => CompanyHostProtocol.decode(bytes.slice(0, -1))).toThrow();
        expect(() => CompanyHostProtocol.decode(Uint8Array.from([...bytes, 0]))).toThrow();
    }
    for (const patch of [
        { parallelism: 0 },
        { parallelism: 1.5 },
        { parallelism: 4294967297 },
        { memory: 0n },
        { memory: 18446744073709551616n },
        { commands: -1 },
        { commands: NaN },
        { revision: -1n },
        { sampledAt: 0n },
        { status: 'unavailable' as const },
    ]) {
        expect(() =>
            CompanyHostProtocol.encode({
                op: HostOp.Snapshot,
                id: 'bad',
                sequence: 0n,
                state: { ...state, ...patch },
            }),
        ).toThrow();
    }
    expect(() =>
        CompanyHostProtocol.encode({
            op: HostOp.Snapshot,
            id: 'local',
            sequence: 0n,
            state: { ...state, status: 'local' },
        }),
    ).toThrow();
    expect(() => CompanyHostProtocol.encode({ op: HostOp.Read, id: 'a'.repeat(65) })).toThrow();
});

it('correlates reads, restores only watches and rejects out-of-order updates at the same configuration revision', async () => {
    vi.useFakeTimers();
    const channel = new CompanyChannel(CompanyHostFormat.format);
    const sent: CompanyHostPacket[] = [];
    const send = (bytes: Uint8Array<ArrayBuffer>): void => {
        sent.push(CompanyHostProtocol.decode(bytes));
    };
    const listener = vi.fn(),
        error = vi.fn<(error: Error) => void>();
    channel.resume(send);
    const release = channel.watch(listener, error);
    const id: string = sent[0]?.id ?? '';
    channel.receive({ op: HostOp.Snapshot, id, sequence: 0n, state });
    channel.receive({ op: HostOp.Update, id, sequence: 1n, state: { ...state, commands: 3 } });
    expect(listener).toHaveBeenCalledTimes(2);
    const read = channel.request({ op: HostOp.Read, id: 'read' }, send);
    channel.receive({ op: HostOp.Snapshot, id: 'read', sequence: 0n, state });
    expect(await read).toEqual(state);
    const interrupted = channel.request({ op: HostOp.Read, id: 'interrupted' }, send);
    channel.close(new Error('Disconnected'));
    await expect(interrupted).rejects.toThrow('Disconnected');
    channel.resume(send);
    expect(sent.filter((packet) => packet.op === HostOp.Read)).toHaveLength(2);
    expect(sent.filter((packet) => packet.op === HostOp.Subscribe)).toHaveLength(2);
    channel.receive({ op: HostOp.Snapshot, id, sequence: 0n, state });
    channel.receive({ op: HostOp.Update, id, sequence: 2n, state });
    expect(error.mock.calls.at(-1)?.[0].message).toContain('sequence');
    expect(sent.at(-1)?.op).toBe(HostOp.Unsubscribe);
    release();
    channel.clear();
    expect(vi.getTimerCount()).toBe(0);
});

it('refuses host reads and watches on gateways without the capability before sending anything', async () => {
    const gateway = new TestGateway();
    const client = await NexaClient.connect({
        url: await gateway.url(),
        apiKey: 'test',
        reconnect: false,
    });
    try {
        expect(client.supportsExecutionHosts).toBe(false);
        await expect(client.executionHost()).rejects.toThrow('updated NEXA');
        expect(() => client.subscribeExecutionHost(vi.fn(), vi.fn())).toThrow('updated NEXA');
        expect(gateway.requests).toHaveLength(1);
    } finally {
        client.close();
        await gateway.close();
    }
});
