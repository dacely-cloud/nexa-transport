import { afterEach, expect, it, vi } from 'vitest';
import { EmployeeChannels } from '../src/networking/EmployeeChannels.js';
import { CompanyEmployeeProtocol } from '../src/company/CompanyEmployeeProtocol.js';
import {
    EmployeeOp,
    type CompanyEmployeePacket,
    type CompanyEmployeeResults,
} from '../src/company/CompanyEmployeeTypes.js';

afterEach(() => vi.useRealTimers());

it('negotiates exact private employee costs and downgrades reads after reconnect without replaying work', async () => {
    const channel = new EmployeeChannels();
    const sent: CompanyEmployeePacket[] = [];
    const send = (bytes: Uint8Array<ArrayBuffer>) =>
        sent.push(CompanyEmployeeProtocol.decode(bytes));
    channel.resume(send, 3);
    const read = channel.read('employee');
    expect(sent[0]).toMatchObject({ version: 3, op: EmployeeOp.Read });
    const results: CompanyEmployeeResults = {
        revision: 1n,
        employeeId: 'employee',
        projects: [
            {
                projectId: 'project',
                name: 'Product',
                revision: 2n,
                phase: 'blocked',
                acceptedAt: 0n,
                completed: 0,
                blocked: 1,
                interrupted: 0,
                running: 0,
                acceptedTasks: 0,
                repeatedTasks: 0,
                recordedChecks: 0,
                inputTokens: 0n,
                outputTokens: 0n,
                cost: { spent: 9007199254740993n, reserved: 80n, charges: 2n, unresolved: 1n },
            },
        ],
    };
    const packet = CompanyEmployeeProtocol.decode(
        CompanyEmployeeProtocol.encode({
            version: 3,
            op: EmployeeOp.Snapshot,
            id: sent[0]?.id ?? '',
            employeeId: 'employee',
            sequence: 0n,
            state: results,
        }),
    );
    channel.receive(packet);
    expect((await read).projects[0]?.cost?.spent).toBe(9007199254740993n);
    const leave = channel.watch('employee', vi.fn(), vi.fn());
    channel.close(new Error('Disconnected'));
    channel.resume(send, 2);
    expect(sent.at(-1)).toMatchObject({ op: EmployeeOp.Subscribe, version: 2 });
    expect(
        sent.every((entry) => entry.op === EmployeeOp.Read || entry.op === EmployeeOp.Subscribe),
    ).toBe(true);
    leave();
    channel.clear();
});

it('negotiates verification reads and watches, then downgrades read subscriptions when reconnecting to an older gateway', async () => {
    const channel = new EmployeeChannels();
    const sent: CompanyEmployeePacket[] = [];
    const send = (bytes: Uint8Array<ArrayBuffer>) =>
        sent.push(CompanyEmployeeProtocol.decode(bytes));
    channel.resume(send, 2);
    const listener = vi.fn(),
        error = vi.fn<(error: Error) => void>();
    const leave = channel.watch('employee', listener, error);
    expect(sent[0]).toMatchObject({ version: 2, op: EmployeeOp.Subscribe });
    const read = channel.read('employee');
    expect(sent[1]).toMatchObject({ version: 2, op: EmployeeOp.Read });
    channel.receive({
        version: 2,
        op: EmployeeOp.Snapshot,
        employeeId: 'employee',
        id: sent[1]?.id ?? '',
        sequence: 0n,
        state,
    });
    expect(await read).toEqual(state);
    channel.close(new Error('Disconnected'));
    channel.resume(send);
    expect(sent.at(-1)).toMatchObject({ op: EmployeeOp.Subscribe });
    expect(sent.at(-1)?.version).toBeUndefined();
    leave();
    channel.clear();
    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0]?.[0].message).toBe('Disconnected');
});
const state: CompanyEmployeeResults = { revision: 1n, employeeId: 'employee', projects: [] };

it('correlates binary reads by employee and releases completed references', async () => {
    const channel = new EmployeeChannels();
    const sent: CompanyEmployeePacket[] = [];
    channel.resume((bytes) => sent.push(CompanyEmployeeProtocol.decode(bytes)));
    for (let index = 0; index < 20; index++) {
        const employeeId = `employee-${index}`;
        const reading = channel.read(employeeId);
        const id = sent.at(-1)?.id ?? '';
        channel.receive({
            op: EmployeeOp.Snapshot,
            id,
            employeeId: 'unrelated',
            sequence: 0n,
            state: { ...state, employeeId: 'unrelated' },
        });
        channel.receive({
            op: EmployeeOp.Snapshot,
            id,
            employeeId,
            sequence: 0n,
            state: { ...state, employeeId },
        });
        expect((await reading).employeeId).toBe(employeeId);
    }
    expect(sent.every((packet) => packet.op === EmployeeOp.Read)).toBe(true);
    channel.clear();
});

it('accepts operational updates at unchanged company revisions, detects gaps, and restores only watches', async () => {
    const channel = new EmployeeChannels();
    const sent: CompanyEmployeePacket[] = [];
    const listener = vi.fn(),
        error = vi.fn<(error: Error) => void>();
    channel.resume((bytes) => sent.push(CompanyEmployeeProtocol.decode(bytes)));
    const leave = channel.watch('employee', listener, error);
    const id = sent[0]?.id ?? '';
    channel.receive({ op: EmployeeOp.Snapshot, id, employeeId: 'employee', sequence: 0n, state });
    channel.receive({ op: EmployeeOp.Update, id, employeeId: 'employee', sequence: 1n, state });
    expect(listener).toHaveBeenCalledTimes(2);
    const reading = channel.read('employee');
    channel.close(new Error('Disconnected'));
    await expect(reading).rejects.toThrow('Disconnected');
    channel.resume((bytes) => sent.push(CompanyEmployeeProtocol.decode(bytes)));
    expect(sent.filter((packet) => packet.op === EmployeeOp.Read)).toHaveLength(1);
    expect(sent.filter((packet) => packet.op === EmployeeOp.Subscribe)).toHaveLength(2);
    channel.receive({ op: EmployeeOp.Snapshot, id, employeeId: 'employee', sequence: 0n, state });
    channel.receive({ op: EmployeeOp.Update, id, employeeId: 'employee', sequence: 2n, state });
    expect(error.mock.calls.at(-1)?.[0].message).toContain('sequence');
    expect(sent.at(-1)?.op).toBe(EmployeeOp.Unsubscribe);
    const count = sent.length;
    leave();
    leave();
    channel.clear();
    channel.resume((bytes) => sent.push(CompanyEmployeeProtocol.decode(bytes)));
    expect(sent).toHaveLength(count);
});

it('bounds total reads and watches, and disposal releases pending waits and timers', async () => {
    vi.useFakeTimers();
    const channel = new EmployeeChannels();
    channel.resume(vi.fn());
    const pending: Promise<CompanyEmployeeResults>[] = Array.from({ length: 8 }, (_, index) =>
        channel.read(`employee-${index}`),
    );
    const rejected = Promise.allSettled(pending);
    await expect(channel.read('ninth')).rejects.toThrow('busy');
    expect(() => channel.watch('ninth', vi.fn(), vi.fn())).toThrow('busy');
    channel.clear();
    expect((await rejected).every((result) => result.status === 'rejected')).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    channel.resume(vi.fn());
    const release = channel.watch('next', vi.fn(), vi.fn());
    release();
    channel.clear();
});

it('times out an unanswered read without replaying or retaining the slot', async () => {
    vi.useFakeTimers();
    const channel = new EmployeeChannels();
    const send = vi.fn();
    channel.resume(send);
    const reading = channel.read('employee');
    const rejected = expect(reading).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(15001);
    await rejected;
    expect(send).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    channel.clear();
});
