import { afterEach, expect, it, vi } from 'vitest';
import { ProjectChannel } from '../src/networking/ProjectChannel.js';
import {
    ProjectOp,
    type ProjectClientPacket,
    type CompanyProjectState,
} from '../src/company/CompanyProjectTypes.js';
import { CompanyProjectProtocol } from '../src/company/CompanyProjectProtocol.js';

const state: CompanyProjectState = {
    allowance: null,
    work: {
        projectId: 'project',
        revision: 0n,
        phase: 'draft',
        workspaceId: '',
        reviewerId: '',
        plan: '',
        proposedLimit: 0n,
        allowanceId: '',
        allowanceRevision: 0n,
        limit: 0n,
        concurrency: 1,
        maxIterations: 8,
        paused: false,
        priority: 1,
        feedback: '',
        decision: '',
        acceptedAt: 0n,
        tasks: [],
        attempts: [],
    },
};
afterEach(() => vi.useRealTimers());

it('negotiates public labels and rejects older gateways without replaying a lost publication', async () => {
    const channel = new ProjectChannel();
    const packets: ReturnType<typeof CompanyProjectProtocol.decode>[] = [];
    const send = (bytes: Uint8Array): void => {
        packets.push(CompanyProjectProtocol.decode(bytes));
    };
    const publication: ProjectClientPacket = {
        op: ProjectOp.Command,
        id: 'publication',
        project: 'project',
        command: {
            kind: 'showcase',
            id: 'stable-decision',
            revision: 5n,
            published: true,
            name: '<img src=x onerror=alert(1)>',
            description: 'Owner-entered public labels',
        },
    };
    channel.resume(send, 3);
    await expect(channel.state(publication)).rejects.toThrow('version 4');
    expect(packets).toEqual([]);
    channel.resume(send, 4);
    const listener = vi.fn(),
        failed = vi.fn();
    const release = channel.watch('project', listener, failed);
    const watch = packets[0];
    if (!watch) {
        throw new Error('Missing showroom watch');
    }
    const pending = channel.state(publication);
    const lost = expect(pending).rejects.toThrow('Lost acknowledgement');
    expect(packets.at(-1)).toMatchObject({ ...publication, version: 4 });
    channel.disconnect(new Error('Lost acknowledgement'));
    await lost;
    channel.resume(send, 4);
    expect(packets.filter((packet) => packet.op === ProjectOp.Command)).toHaveLength(1);
    expect(packets.at(-1)).toMatchObject({ op: ProjectOp.Subscribe, id: watch.id, version: 4 });
    const published: CompanyProjectState = {
        ...state,
        work: {
            ...state.work,
            revision: 6n,
            phase: 'accepted',
            acceptedAt: 100n,
            showcase: { name: 'Portal', description: 'Public labels', publishedAt: 200n },
        },
    };
    channel.receive(
        CompanyProjectProtocol.decode(
            CompanyProjectProtocol.encode({
                version: 4,
                op: ProjectOp.Snapshot,
                id: watch.id,
                project: 'project',
                sequence: 0n,
                state: published,
            }),
        ),
    );
    expect(listener).toHaveBeenCalledExactlyOnceWith(published);
    release();
    channel.clear();
});

it('restores only subscriptions after disconnect and rejects gaps before invoking the listener', () => {
    const channel = new ProjectChannel();
    const sent: ProjectClientPacket[] = [];
    const send = (bytes: Uint8Array): void => {
        const packet = CompanyProjectProtocol.decode(bytes);
        if (packet.op === ProjectOp.Subscribe || packet.op === ProjectOp.Unsubscribe) {
            sent.push(packet);
        }
    };
    channel.resume(send);
    const listener = vi.fn(),
        onError = vi.fn();
    const release = channel.watch('project', listener, onError);
    const first = sent[0];
    if (!first) {
        throw new Error('Missing subscription');
    }
    channel.receive({
        op: ProjectOp.Snapshot,
        id: first.id,
        project: 'project',
        sequence: 0n,
        state,
    });
    channel.receive({
        op: ProjectOp.Update,
        id: first.id,
        project: 'project',
        sequence: 1n,
        state,
    });
    expect(listener).toHaveBeenCalledTimes(2);
    channel.disconnect(new Error('Offline'));
    channel.resume(send);
    expect(sent).toHaveLength(2);
    expect(sent.every((packet) => packet.op === ProjectOp.Subscribe)).toBe(true);
    channel.receive({
        op: ProjectOp.Snapshot,
        id: first.id,
        project: 'project',
        sequence: 0n,
        state,
    });
    channel.receive({
        op: ProjectOp.Update,
        id: first.id,
        project: 'project',
        sequence: 2n,
        state,
    });
    expect(listener).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledTimes(2);
    expect(sent.at(-1)?.op).toBe(ProjectOp.Unsubscribe);
    release();
    channel.clear();
});

it('releases timed out decisions without automatically replaying spending commands', async () => {
    vi.useFakeTimers();
    const channel = new ProjectChannel();
    const send = vi.fn<(bytes: Uint8Array<ArrayBuffer>) => void>();
    channel.resume(send);
    const packet: ProjectClientPacket = {
        op: ProjectOp.Command,
        id: 'decision',
        project: 'project',
        command: {
            kind: 'approve',
            id: 'decision',
            revision: 1n,
            allowanceRevision: 2n,
            limit: 12345678901234567n,
            concurrency: 2,
            maxIterations: 8,
        },
    };
    const result = channel.state(packet);
    const rejected = expect(result).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(15001);
    await rejected;
    channel.disconnect(new Error('Offline'));
    channel.resume(send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(CompanyProjectProtocol.decode(send.mock.calls[0]?.[0] ?? new Uint8Array())).toEqual(
        packet,
    );
    expect(vi.getTimerCount()).toBe(0);
});

it('assembles only contiguous matching delivery chunks and releases malformed transfers', async () => {
    const channel = new ProjectChannel();
    let id = '';
    channel.resume((bytes): void => {
        id = CompanyProjectProtocol.decode(bytes).id;
    });
    const result = channel.file('project', 'attempt', 'report.bin');
    channel.receive({
        op: ProjectOp.Chunk,
        id,
        project: 'project',
        offset: 0,
        total: 4,
        bytes: new Uint8Array([1, 2]),
    });
    channel.receive({
        op: ProjectOp.Chunk,
        id,
        project: 'project',
        offset: 2,
        total: 4,
        bytes: new Uint8Array([3, 4]),
    });
    expect(await result).toEqual(new Uint8Array([1, 2, 3, 4]));
    const gap = channel.file('project', 'attempt', 'report.bin');
    channel.receive({
        op: ProjectOp.Chunk,
        id,
        project: 'project',
        offset: 2,
        total: 4,
        bytes: new Uint8Array([3, 4]),
    });
    await expect(gap).rejects.toThrow('out-of-order');
    const wrong = channel.file('project', 'attempt', 'report.bin');
    channel.receive({
        op: ProjectOp.Chunk,
        id,
        project: 'another-project',
        offset: 0,
        total: 0,
        bytes: new Uint8Array(),
    });
    await expect(wrong).rejects.toThrow('identity');
    channel.disconnect(new Error('Finished'));
});

it('negotiates baseline state and restores versioned subscriptions without replaying its command', async () => {
    const channel = new ProjectChannel();
    const packets: ReturnType<typeof CompanyProjectProtocol.decode>[] = [];
    const send = (bytes: Uint8Array): void => {
        packets.push(CompanyProjectProtocol.decode(bytes));
    };
    const packet: ProjectClientPacket = {
        op: ProjectOp.Command,
        id: 'baseline',
        project: 'project',
        command: {
            kind: 'baseline',
            id: 'base-choice',
            revision: 0n,
            sourceProject: 'source',
            sourceRevision: 5n,
        },
    };
    channel.resume(send);
    await expect(channel.state(packet)).rejects.toThrow('version 2');
    expect(packets).toEqual([]);
    channel.resume(send, 2);
    const listener = vi.fn(),
        failed = vi.fn();
    const release = channel.watch('project', listener, failed);
    const watch = packets[0];
    if (!watch) {
        throw new Error('Missing watch');
    }
    expect(watch.version).toBe(2);
    const pending = channel.state(packet);
    const selected: CompanyProjectState = {
        ...state,
        work: {
            ...state.work,
            revision: 1n,
            baseline: {
                projectId: 'source',
                revision: 5n,
                acceptedAt: 123n,
                files: [{ path: 'portal.html', bytes: 12n, digest: 'a'.repeat(64) }],
            },
        },
    };
    const answer = {
        op: ProjectOp.Snapshot,
        version: 2,
        id: 'baseline',
        project: 'project',
        sequence: 0n,
        state: selected,
    } as const;
    channel.receive(CompanyProjectProtocol.decode(CompanyProjectProtocol.encode(answer)));
    await expect(pending).resolves.toEqual(selected);
    channel.receive({ ...answer, id: watch.id });
    expect(listener).toHaveBeenCalledWith(selected);
    channel.disconnect(new Error('Offline'));
    channel.resume(send, 2);
    expect(packets.filter((entry) => entry.op === ProjectOp.Command)).toHaveLength(1);
    expect(packets.at(-1)).toMatchObject({ op: ProjectOp.Subscribe, version: 2, id: watch.id });
    release();
    channel.clear();
});

it('negotiates owner interruption reviews and resumes only reads after connection loss', async () => {
    const channel = new ProjectChannel();
    const packets: ReturnType<typeof CompanyProjectProtocol.decode>[] = [];
    const send = (bytes: Uint8Array): void => {
        packets.push(CompanyProjectProtocol.decode(bytes));
    };
    const request: ProjectClientPacket = {
        op: ProjectOp.Command,
        id: 'owner-recovery',
        project: 'project',
        command: {
            kind: 'review-interruption',
            id: 'owner-recovery',
            revision: 8n,
            attemptId: 'interrupted-attempt',
            evidence: 'Checked the external outcome; no action needs repeating.',
        },
    };
    channel.resume(send, 4);
    await expect(channel.state(request)).rejects.toThrow('version 5');
    expect(packets).toEqual([]);
    channel.resume(send, 5);
    const listener = vi.fn(),
        error = vi.fn();
    const release = channel.watch('project', listener, error);
    const watch = packets[0];
    if (!watch) {
        throw new Error('Missing watch');
    }
    const pending = channel.state(request);
    const failed = expect(pending).rejects.toThrow('Connection interrupted');
    expect(packets[1]).toMatchObject({
        version: 5,
        op: ProjectOp.Command,
        command: request.command,
    });
    channel.disconnect(new Error('Connection interrupted'));
    await failed;
    channel.resume(send, 5);
    expect(packets.filter((packet) => packet.op === ProjectOp.Command)).toHaveLength(1);
    expect(packets.at(-1)).toMatchObject({ op: ProjectOp.Subscribe, version: 5, id: watch.id });
    const resumed = {
        ...state,
        work: {
            ...state.work,
            phase: 'blocked',
            revision: 9n,
            attempts: [
                {
                    id: 'interrupted-attempt',
                    taskId: 'work',
                    employeeId: 'dev',
                    holder: 'private-host',
                    expires: 9n,
                    started: 1n,
                    finished: 10n,
                    status: 'blocked',
                    summary: 'Host stopped',
                    sessionId: 'session',
                    inputTokens: 12n,
                    outputTokens: 3n,
                    artifacts: [],
                    evidence: [],
                    interruptionReview: {
                        id: 'owner-recovery',
                        at: 10n,
                        evidence: 'Checked the external outcome; no action needs repeating.',
                    },
                },
            ],
        },
    } as const;
    channel.receive(
        CompanyProjectProtocol.decode(
            CompanyProjectProtocol.encode({
                version: 5,
                op: ProjectOp.Snapshot,
                id: watch.id,
                project: 'project',
                sequence: 0n,
                state: resumed,
            }),
        ),
    );
    expect(listener).toHaveBeenLastCalledWith(resumed);
    const legacy = CompanyProjectProtocol.decode(
        CompanyProjectProtocol.encode({
            version: 4,
            op: ProjectOp.Snapshot,
            id: 'legacy',
            project: 'project',
            sequence: 0n,
            state: resumed,
        }),
    );
    expect(
        legacy.op === ProjectOp.Snapshot && legacy.state.work.attempts[0]?.interruptionReview,
    ).toBeUndefined();
    release();
    channel.clear();
});

it('sends exact permission decisions only after negotiation and never replays them on reconnect', async () => {
    const channel = new ProjectChannel();
    const packets: ReturnType<typeof CompanyProjectProtocol.decode>[] = [];
    const send = (bytes: Uint8Array): void => {
        packets.push(CompanyProjectProtocol.decode(bytes));
    };
    const request: ProjectClientPacket = {
        op: ProjectOp.Command,
        id: 'owner-permission',
        project: 'project',
        command: {
            kind: 'permission',
            id: 'decide-exact-call',
            revision: 8n,
            attemptId: 'attempt',
            permissionId: 'permission',
            fingerprint: 'a'.repeat(64),
            approved: true,
        },
    };
    channel.resume(send, 5);
    await expect(channel.state(request)).rejects.toThrow('version 6');
    expect(packets).toEqual([]);
    channel.resume(send, 6);
    const release = channel.watch('project', vi.fn(), vi.fn());
    const pending = channel.state(request);
    const failed = expect(pending).rejects.toThrow('Connection interrupted');
    expect(packets[1]).toMatchObject({
        version: 6,
        op: ProjectOp.Command,
        command: request.command,
    });
    channel.disconnect(new Error('Connection interrupted'));
    await failed;
    channel.resume(send, 6);
    expect(packets.filter((packet) => packet.op === ProjectOp.Command)).toHaveLength(1);
    expect(packets.at(-1)).toMatchObject({ op: ProjectOp.Subscribe, version: 6 });
    release();
    channel.clear();
});
