import { afterEach, expect, it, vi } from 'vitest';
import { CompanyChannel } from '../src/networking/CompanyChannel.js';
import { CompanyFormats } from '../src/networking/CompanyFormats.js';
import { CompanyProtocol } from '../src/company/CompanyProtocol.js';
import { CompanyOp, type CompanyPacket } from '../src/company/CompanyTypes.js';
import type { CompanyLimits } from '../src/company/CompanyLimitsTypes.js';

afterEach(() => vi.useRealTimers());
const state: CompanyLimits = {
    revision: 1n,
    limit: 9007199254740993n,
    spent: 15n,
    reserved: 25n,
    concurrency: 2,
    running: 1,
};
it('roundtrips exact budget packets and rejects wrapped or malformed numeric fields', () => {
    const packets: CompanyPacket[] = [
        { op: CompanyOp.ReadLimits, id: 'read' },
        {
            op: CompanyOp.SetLimits,
            id: 'approve',
            revision: 1n,
            limit: state.limit ?? 0n,
            concurrency: 2,
        },
        { op: CompanyOp.LimitsSnapshot, id: 'read', sequence: 0n, state },
        { op: CompanyOp.LimitsUpdate, id: 'read', sequence: 1n, state },
        {
            op: CompanyOp.LimitsSnapshot,
            id: 'unset',
            sequence: 0n,
            state: { ...state, revision: 0n, limit: null, concurrency: null },
        },
        { op: CompanyOp.SubscribeLimits, id: 'watch' },
        { op: CompanyOp.UnsubscribeLimits, id: 'watch' },
        { op: CompanyOp.LimitsStopped, id: 'watch' },
        { op: CompanyOp.LimitsError, id: 'failed', message: 'Unavailable' },
    ];
    for (const packet of packets) {
        expect(CompanyProtocol.decode(CompanyProtocol.encode(packet))).toEqual(packet);
    }
    for (const concurrency of [0, 33, 257, 1.5, NaN]) {
        expect(() =>
            CompanyProtocol.encode({
                op: CompanyOp.SetLimits,
                id: 'bad',
                revision: 0n,
                limit: 1n,
                concurrency,
            }),
        ).toThrow();
    }
    for (const limit of [-1n, 9223372036854775808n, 18446744073709551616n]) {
        expect(() =>
            CompanyProtocol.encode({
                op: CompanyOp.SetLimits,
                id: 'bad',
                revision: 0n,
                limit,
                concurrency: 1,
            }),
        ).toThrow();
    }
});
it('streams spending changes at the same policy revision and resumes only reads after disconnect', async () => {
    vi.useFakeTimers();
    const channel = new CompanyChannel(CompanyFormats.limits);
    const sent: CompanyPacket[] = [];
    const send = (bytes: Uint8Array<ArrayBuffer>): void => {
        sent.push(CompanyProtocol.decode(bytes));
    };
    const listener = vi.fn(),
        error = vi.fn<(error: Error) => void>();
    channel.resume(send);
    channel.watch(listener, error);
    const id = sent[0]?.id ?? '';
    channel.receive({ op: CompanyOp.LimitsSnapshot, id, sequence: 0n, state });
    channel.receive({
        op: CompanyOp.LimitsUpdate,
        id,
        sequence: 1n,
        state: { ...state, spent: 20n },
    });
    expect(listener).toHaveBeenCalledTimes(2);
    const command = {
        op: CompanyOp.SetLimits,
        id: 'save',
        revision: 1n,
        limit: 100n,
        concurrency: 1,
    } as const;
    const saved = channel.request(command, send);
    channel.close(new Error('Disconnected'));
    await expect(saved).rejects.toThrow('Disconnected');
    channel.resume(send);
    expect(sent.filter((packet) => packet.op === CompanyOp.SetLimits)).toHaveLength(1);
    channel.receive({
        op: CompanyOp.LimitsSnapshot,
        id,
        sequence: 0n,
        state: { ...state, revision: 2n },
    });
    const retry = channel.request(command, send);
    channel.receive({
        op: CompanyOp.LimitsSnapshot,
        id: command.id,
        sequence: 0n,
        state: { ...state, revision: 2n },
    });
    expect((await retry).revision).toBe(2n);
    channel.receive({ op: CompanyOp.LimitsUpdate, id, sequence: 2n, state });
    expect(error.mock.calls.at(-1)?.[0].message).toContain('sequence');
    expect(sent.at(-1)?.op).toBe(CompanyOp.UnsubscribeLimits);
    channel.clear();
    expect(vi.getTimerCount()).toBe(0);
});
