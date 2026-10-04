import { afterEach, expect, it, vi } from 'vitest';
import { CompanyFormats } from '../src/networking/CompanyFormats.js';
import { CompanyChannel } from '../src/networking/CompanyChannel.js';
import { CompanyProtocol } from '../src/company/CompanyProtocol.js';
import { CompanyOp, type CompanyCommand } from '../src/company/CompanyTypes.js';

afterEach(() => vi.useRealTimers());
const command: CompanyCommand = {
    op: CompanyOp.Configure,
    id: 'durable-command',
    revision: 9n,
    name: 'Studio',
};

it('preserves exact command IDs and revisions and correlates binary responses', async () => {
    const channel = new CompanyChannel(CompanyFormats.staffing);
    const send = vi.fn<(bytes: Uint8Array<ArrayBuffer>) => void>();
    const response = channel.request(command, send);
    expect(CompanyProtocol.decode(send.mock.calls[0]?.[0] ?? new Uint8Array())).toEqual(command);
    await expect(channel.request(command, send)).rejects.toThrow('pending');
    const state = { revision: 10n, name: 'Studio', employees: [], departments: [], projects: [] };
    channel.receive({ op: CompanyOp.Snapshot, id: command.id, state });
    expect(await response).toEqual(state);
    expect(send).toHaveBeenCalledTimes(1);
});

it('releases failed and timed-out waits without automatically repeating a mutation', async () => {
    vi.useFakeTimers();
    const channel = new CompanyChannel(CompanyFormats.staffing);
    const send = vi.fn<(bytes: Uint8Array<ArrayBuffer>) => void>();
    const response = channel.request(command, send);
    const rejected = expect(response).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(15001);
    await rejected;
    expect(send).toHaveBeenCalledTimes(1);
    const retry = channel.request(command, send);
    channel.close(new Error('Disconnected'));
    await expect(retry).rejects.toThrow('Disconnected');
    expect(vi.getTimerCount()).toBe(0);
    expect(CompanyProtocol.decode(send.mock.calls[1]?.[0] ?? new Uint8Array())).toEqual(command);
});

it('restores only watches after reconnect, discards sequence gaps, and releases listeners on disposal', async () => {
    const channel = new CompanyChannel(CompanyFormats.staffing);
    const sent: Array<ReturnType<typeof CompanyProtocol.decode>> = [];
    const send = (bytes: Uint8Array<ArrayBuffer>): void => {
        sent.push(CompanyProtocol.decode(bytes));
    };
    const state = { revision: 0n, name: 'Studio', employees: [], departments: [], projects: [] };
    const listener = vi.fn(),
        error = vi.fn<(error: Error) => void>();
    channel.resume(send);
    const leave = channel.watch(listener, error);
    const id = sent[0]?.id ?? '';
    channel.receive({ op: CompanyOp.LiveSnapshot, id, sequence: 0n, state });
    channel.receive({ op: CompanyOp.Update, id, sequence: 1n, state: { ...state, revision: 3n } });
    expect(listener).toHaveBeenCalledTimes(2);
    const result = channel.request(command, send);
    channel.close(new Error('Disconnected'));
    await expect(result).rejects.toThrow('Disconnected');
    channel.resume(send);
    expect(sent.filter((packet) => packet.op === CompanyOp.Configure)).toHaveLength(1);
    expect(sent.filter((packet) => packet.op === CompanyOp.Subscribe)).toHaveLength(2);
    channel.receive({
        op: CompanyOp.LiveSnapshot,
        id,
        sequence: 0n,
        state: { ...state, revision: 8n },
    });
    expect(listener).toHaveBeenCalledTimes(3);
    channel.receive({ op: CompanyOp.Update, id, sequence: 2n, state: { ...state, revision: 9n } });
    expect(error.mock.calls.at(-1)?.[0].message).toContain('sequence');
    expect(sent.at(-1)?.op).toBe(CompanyOp.Unsubscribe);
    channel.receive({ op: CompanyOp.Update, id, sequence: 1n, state: { ...state, revision: 9n } });
    expect(listener).toHaveBeenCalledTimes(3);
    leave();
    channel.clear();
    const count = sent.length;
    channel.resume(send);
    expect(sent).toHaveLength(count);
});

it('bounds subscriptions, expires unanswered snapshots, and rejects regressing company revisions', async () => {
    vi.useFakeTimers();
    const channel = new CompanyChannel(CompanyFormats.staffing);
    const packets: Array<ReturnType<typeof CompanyProtocol.decode>> = [];
    channel.resume((bytes) => {
        packets.push(CompanyProtocol.decode(bytes));
    });
    const errors = vi.fn();
    const listeners = Array.from({ length: 8 }, () => vi.fn());
    for (const listener of listeners) {
        channel.watch(listener, errors);
    }
    expect(() => channel.watch(vi.fn(), errors)).toThrow('too many');
    const id = packets[0]?.id ?? '';
    const state = { revision: 4n, name: 'Studio', employees: [], departments: [], projects: [] };
    channel.receive({ op: CompanyOp.LiveSnapshot, id, sequence: 0n, state });
    channel.receive({ op: CompanyOp.Update, id, sequence: 1n, state: { ...state, revision: 3n } });
    expect(listeners[0]).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(15001);
    expect(errors).toHaveBeenCalledTimes(8);
    expect(vi.getTimerCount()).toBe(0);
    channel.clear();
});

it('renegotiates department snapshots on reconnect without replaying a policy mutation', async () => {
    const channel = new CompanyChannel(CompanyFormats.staffing);
    const sent: Array<ReturnType<typeof CompanyProtocol.decode>> = [];
    const send = (bytes: Uint8Array<ArrayBuffer>): void => {
        sent.push(CompanyProtocol.decode(bytes));
    };
    const listener = vi.fn();
    channel.resume(send, CompanyFormats.departmentTools);
    const leave = channel.watch(listener, vi.fn());
    const id = sent[0]?.id ?? '';
    expect(sent[0]).toEqual({ op: CompanyOp.Subscribe, id, version: 2 });
    const state = {
        revision: 1n,
        name: 'Studio',
        employees: [],
        departments: [{ id: 'team', name: 'Team', instructions: 'Private.', tools: ['read_file'] }],
        projects: [],
    };
    channel.receive({ op: CompanyOp.LiveSnapshot, id, sequence: 0n, state, version: 2 });
    expect(listener).toHaveBeenLastCalledWith(state);
    const policy = {
        op: CompanyOp.DepartmentPolicy,
        id: 'policy',
        revision: 1n,
        departmentId: 'team',
        name: 'Team',
        instructions: 'Private.',
        tools: [],
    } as const;
    const pending = channel.request(policy, send);
    expect(sent.at(-1)).toEqual({ ...policy, version: 2 });
    channel.close(new Error('Disconnected'));
    await expect(pending).rejects.toThrow('Disconnected');
    channel.resume(send, CompanyFormats.staffing);
    expect(sent.at(-1)).toEqual({ op: CompanyOp.Subscribe, id });
    expect(sent.filter((packet) => packet.op === CompanyOp.DepartmentPolicy)).toHaveLength(1);
    leave();
    channel.clear();
});
