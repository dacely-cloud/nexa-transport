// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it, vi } from 'vitest';
import { CompanyProjectRequests } from '../src/networking/CompanyProjectRequests.js';
import {
    CompanyProjectOp,
    CompanyProjectProtocol,
    type CompanyProjectFile,
} from '../src/company/CompanyProjectProtocol.js';

it('round-trips management controls, retains exact money, and rejects unsupported or malformed controls', () => {
    const schedule = {
        op: CompanyProjectOp.Command,
        id: 'pause',
        projectId: 'project',
        command: {
            kind: 'schedule' as const,
            id: 'pause',
            revision: 4n,
            paused: true,
            priority: 2,
        },
    };
    const bytes = CompanyProjectProtocol.encode(schedule);
    expect(CompanyProjectProtocol.decode(bytes)).toEqual(schedule);
    expect(() => CompanyProjectProtocol.encode(schedule, 1)).toThrow('v2');
    const badPause = bytes.slice();
    badPause[badPause.length - 2] = 2;
    expect(() => CompanyProjectProtocol.decode(badPause)).toThrow('pause');
    const badPriority = bytes.slice();
    badPriority[badPriority.length - 1] = 3;
    expect(() => CompanyProjectProtocol.decode(badPriority)).toThrow('schedule');
    const allowance = {
        op: CompanyProjectOp.Allowance,
        id: 'allowance',
        projectId: 'project',
        revision: 1n,
        limit: 9007199254740993n,
        concurrency: 8,
    };
    expect(CompanyProjectProtocol.decode(CompanyProjectProtocol.encode(allowance))).toEqual(
        allowance,
    );
    expect(() => CompanyProjectProtocol.encode(allowance, 1)).toThrow('v2');
});

it('negotiates reassignment without sending new commands to older hosts', () => {
    const packet = {
        op: CompanyProjectOp.Command,
        id: 'assign',
        projectId: 'project',
        command: {
            kind: 'assign' as const,
            id: 'assign',
            revision: 9n,
            taskId: 'implementation',
            employeeId: 'linus',
        },
    };
    expect(CompanyProjectProtocol.decode(CompanyProjectProtocol.encode(packet))).toEqual(packet);
    for (const version of [1, 2] as const) {
        expect(() => CompanyProjectProtocol.encode(packet, version)).toThrow('v3');
        const old = { op: CompanyProjectOp.Read, id: 'read', projectId: 'project' };
        expect(CompanyProjectProtocol.decode(CompanyProjectProtocol.encode(old, version))).toEqual({
            ...old,
            version,
        });
    }
});

it('does not accept a file response belonging to another project or offset', async (): Promise<void> => {
    const requests: CompanyProjectRequests = new CompanyProjectRequests();
    const packet: CompanyProjectFile = {
        op: CompanyProjectOp.File,
        id: 'file',
        projectId: 'alice-project',
        attemptId: 'attempt',
        path: 'index.html',
        offset: 0,
        total: 1,
        digest: 'a'.repeat(64),
        bytes: new Uint8Array([42]),
    };
    for (const changes of [
        { projectId: 'bob-project' },
        { offset: 1 },
        { path: 'secret' },
        { attemptId: 'old' },
    ]) {
        const pending: Promise<
            | CompanyProjectFile
            | import('../src/company/CompanyProjectProtocol.js').CompanyProjectSnapshot
            | import('../src/company/CompanyProjectProtocol.js').CompanyEmployeeHistory
            | import('../src/company/CompanyProjectProtocol.js').CompanySpending
        > = requests.request({ ...packet, op: CompanyProjectOp.Artifact }, (): void => {});
        requests.receive({ ...packet, ...changes });
        await expect(pending).rejects.toThrow('Mismatched');
    }
    const pending = requests.request({ ...packet, op: CompanyProjectOp.Artifact }, (): void => {});
    requests.receive(packet);
    expect(await pending).toEqual(packet);
});

it('bounds outstanding requests, expires them, and never resends after a disconnect', async (): Promise<void> => {
    vi.useFakeTimers();
    const requests = new CompanyProjectRequests();
    let sent = 0;
    try {
        const pending = Array.from({ length: 16 }, (_, index) =>
            requests
                .request(
                    { op: CompanyProjectOp.Read, id: String(index), projectId: 'project' },
                    () => {
                        sent += 1;
                    },
                )
                .catch((error: unknown) => error),
        );
        await expect(
            requests.request(
                { op: CompanyProjectOp.Read, id: 'over-limit', projectId: 'project' },
                () => {
                    sent += 1;
                },
            ),
        ).rejects.toThrow('capacity');
        await vi.advanceTimersByTimeAsync(30000);
        for (const result of await Promise.all(pending)) {
            expect(result).toBeInstanceOf(Error);
        }
        expect(sent).toBe(16);
        const closed = requests.request(
            { op: CompanyProjectOp.Read, id: 'again', projectId: 'project' },
            () => {
                sent += 1;
            },
        );
        requests.close(new Error('Disconnected'));
        await expect(closed).rejects.toThrow('Disconnected');
        await vi.advanceTimersByTimeAsync(60000);
        expect(sent).toBe(17);
        expect(vi.getTimerCount()).toBe(0);
    } finally {
        requests.close(new Error('Test finished'));
        vi.useRealTimers();
    }
});

it('rejects excessive chunks and malformed wire data before allocating file content', (): void => {
    const file: CompanyProjectFile = {
        op: CompanyProjectOp.File,
        id: 'file',
        projectId: 'project',
        attemptId: 'attempt',
        path: 'index.html',
        offset: 0,
        total: 65537,
        digest: 'a'.repeat(64),
        bytes: new Uint8Array(65537),
    };
    expect(() => CompanyProjectProtocol.encode(file)).toThrow('Invalid project file');
    const bytes = CompanyProjectProtocol.encode({
        op: CompanyProjectOp.Read,
        id: 'read',
        projectId: 'project',
    });
    for (let length = 0; length < bytes.length; length += 1) {
        expect(() => CompanyProjectProtocol.decode(bytes.slice(0, length))).toThrow();
    }
    const invalid = bytes.slice();
    invalid[12] = 255;
    expect(() => CompanyProjectProtocol.decode(invalid)).toThrow();
    const unknown = bytes.slice();
    unknown[5] = 127;
    expect(() => CompanyProjectProtocol.decode(unknown)).toThrow('Unknown');
});

it('keeps exact employee totals, bounds history, and correlates employee responses', async () => {
    const packet = {
        op: CompanyProjectOp.History,
        id: 'history',
        employeeId: 'ada',
        asOf: 100n,
        attempts: 2,
        completed: 1,
        blocked: 1,
        running: 0,
        reviews: 0,
        repeats: 1,
        accepted: 0,
        inputTokens: (1n << 65n) + 1n,
        outputTokens: 3n,
        recent: [],
    };
    expect(CompanyProjectProtocol.decode(CompanyProjectProtocol.encode(packet))).toEqual(packet);
    for (const version of [1, 2] as const) {
        expect(() => CompanyProjectProtocol.encode(packet, version)).toThrow('v3');
        expect(() =>
            CompanyProjectProtocol.encode(
                { op: CompanyProjectOp.Employee, id: 'history', employeeId: 'ada' },
                version,
            ),
        ).toThrow('v3');
    }
    const invalid = CompanyProjectProtocol.encode(packet);
    invalid[invalid.length - 1] = 21;
    expect(() => CompanyProjectProtocol.decode(invalid)).toThrow('limits');
    const requests = new CompanyProjectRequests();
    const pending = requests.request(
        { op: CompanyProjectOp.Employee, id: 'history', employeeId: 'grace' },
        () => {},
    );
    requests.receive(packet);
    await expect(pending).rejects.toThrow('Mismatched');
    const own = requests.request(
        { op: CompanyProjectOp.Employee, id: 'history', employeeId: 'ada' },
        () => {},
    );
    requests.receive(packet);
    expect(await own).toEqual(packet);
});

it('bounds private spending pages, preserves exact receipts and correlates recovery replies', async () => {
    const ledger = {
        op: CompanyProjectOp.Spending,
        id: 'ledger',
        projectId: 'alice-project',
        next: 1n,
        charges: [
            {
                sequence: 2n,
                id: 'charge',
                attemptId: 'attempt',
                maximum: 9007199254740993n,
                amount: null,
                state: 'dispatched' as const,
                provider: 'provider',
                model: 'model',
                receipt: 'provider-request',
            },
        ],
        attempts: [
            {
                attemptId: 'attempt',
                employeeId: 'ada',
                title: '<img src=x onerror=alert(1)>',
                status: 'interrupted' as const,
                pending: true,
                evidence: '',
                at: 0n,
            },
        ],
    };
    expect(CompanyProjectProtocol.decode(CompanyProjectProtocol.encode(ledger))).toEqual(ledger);
    for (const version of [1, 2, 3] as const) {
        expect(() => CompanyProjectProtocol.encode(ledger, version)).toThrow('v4');
    }
    expect(() =>
        CompanyProjectProtocol.encode({
            ...ledger,
            charges: Array.from({ length: 51 }).flatMap(() => ledger.charges),
        }),
    ).toThrow('limits');
    const requests = new CompanyProjectRequests();
    const request = {
        op: CompanyProjectOp.Ledger,
        id: 'ledger',
        projectId: 'alice-project',
        before: 0n,
    };
    const wrong = requests.request(request, () => {});
    requests.receive({ ...ledger, projectId: 'bob-project' });
    await expect(wrong).rejects.toThrow('Mismatched');
    const right = requests.request(request, () => {});
    requests.receive(ledger);
    expect(await right).toEqual(ledger);
    const recovery = {
        op: CompanyProjectOp.Recover,
        id: 'ledger',
        projectId: 'alice-project',
        attemptId: 'attempt',
        revision: 4n,
        evidence: 'Checked workspace and provider records.',
    };
    expect(CompanyProjectProtocol.decode(CompanyProjectProtocol.encode(recovery))).toEqual(
        recovery,
    );
    expect(() => CompanyProjectProtocol.encode({ ...recovery, evidence: ' ' })).toThrow('evidence');
    const recovered = requests.request(recovery, () => {});
    requests.receive(ledger);
    expect(await recovered).toEqual(ledger);
});
