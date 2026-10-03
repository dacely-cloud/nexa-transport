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
