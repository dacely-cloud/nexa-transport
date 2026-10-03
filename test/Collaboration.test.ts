// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it, vi } from 'vitest';
import { CollaborationRequests } from '../src/networking/CollaborationRequests.js';
import {
    CollaborationOp,
    CompanyCollaborationProtocol,
} from '../src/company/CompanyCollaborationProtocol.js';
import {
    CompanyProjectOp,
    type CompanyProjectFile,
} from '../src/company/CompanyProjectProtocol.js';
import { OfficeGameOp, OfficeProtocol } from '../src/office/OfficeProtocol.js';
import { NexaClient } from '../src/networking/NexaClient.js';
import { TestGateway } from './Support.js';

it('correlates grant, project, attempt, path and offset before exposing a private file', async () => {
    const requests = new CollaborationRequests();
    const file: CompanyProjectFile = {
        op: CompanyProjectOp.File,
        id: 'file',
        projectId: 'project',
        attemptId: 'attempt',
        path: 'index.html',
        offset: 0,
        total: 1,
        digest: 'a'.repeat(64),
        bytes: new Uint8Array([1]),
    };
    for (const wrong of [
        { projectId: 'other' },
        { attemptId: 'other' },
        { path: 'private.txt' },
        { offset: 1 },
    ]) {
        const response = requests.request(
            {
                op: CollaborationOp.Project,
                id: 'file',
                grantId: 'grant',
                request: {
                    op: CompanyProjectOp.Artifact,
                    id: 'file',
                    projectId: 'project',
                    attemptId: 'attempt',
                    path: 'index.html',
                    offset: 0,
                },
            },
            () => {},
        );
        requests.receive({
            op: CollaborationOp.ProjectResult,
            id: 'file',
            grantId: 'grant',
            response: { ...file, ...wrong },
        });
        await expect(response).rejects.toThrow('Mismatched');
    }
    const response = requests.request(
        {
            op: CollaborationOp.Project,
            id: 'file',
            grantId: 'grant',
            request: {
                op: CompanyProjectOp.Artifact,
                id: 'file',
                projectId: 'project',
                attemptId: 'attempt',
                path: 'index.html',
                offset: 0,
            },
        },
        () => {},
    );
    requests.receive({
        op: CollaborationOp.ProjectResult,
        id: 'file',
        grantId: 'another-grant',
        response: file,
    });
    await expect(response).rejects.toThrow('Mismatched');
    const catalog = requests.request(
        { op: CollaborationOp.List, id: 'list', projectId: 'project' },
        () => {},
    );
    requests.receive({
        op: CollaborationOp.Invitations,
        id: 'list',
        projectId: 'other',
        entries: [],
    });
    await expect(catalog).rejects.toThrow('Mismatched');
});

it('releases streams once on timeout, mismatched identities, revocation and explicit leave without replay', async () => {
    vi.useFakeTimers();
    const requests = new CollaborationRequests(),
        listener = vi.fn(),
        failure = vi.fn(),
        send = vi.fn(),
        leave = vi.fn();
    try {
        const close = requests.listen(
            'office',
            'grant',
            'office',
            undefined,
            listener,
            failure,
            send,
            leave,
        );
        requests.receive({
            op: CollaborationOp.Office,
            id: 'office',
            grantId: 'grant',
            frame: OfficeProtocol.control(OfficeGameOp.Ready),
        });
        await vi.advanceTimersByTimeAsync(31000);
        expect(failure).not.toHaveBeenCalled();
        expect(requests.watching('office')).toBe(true);
        requests.receive({
            op: CollaborationOp.Office,
            id: 'office',
            grantId: 'wrong',
            frame: OfficeProtocol.control(OfficeGameOp.Snapshot),
        });
        expect(listener).toHaveBeenCalledTimes(1);
        expect(failure).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Mismatched collaboration update' }),
        );
        expect(requests.watching('office')).toBe(false);
        close();
        expect(leave).toHaveBeenCalledTimes(1);
        requests.listen('timeout', 'grant', 'project', 'project', listener, failure, send, leave);
        await vi.advanceTimersByTimeAsync(30000);
        expect(leave).toHaveBeenCalledTimes(2);
        requests.listen('revoked', 'grant', 'project', 'project', listener, failure, send, leave);
        requests.receive({ op: CollaborationOp.Error, id: 'revoked', message: 'Access revoked' });
        expect(leave).toHaveBeenCalledTimes(3);
        requests.listen(
            'disconnect',
            'grant',
            'project',
            'project',
            listener,
            failure,
            send,
            leave,
        );
        requests.close(new Error('Disconnected'));
        expect(leave).toHaveBeenCalledTimes(3);
        expect(send).toHaveBeenCalledTimes(4);
        expect(vi.getTimerCount()).toBe(0);
    } finally {
        requests.close(new Error('Closed'));
        vi.useRealTimers();
    }
});

it('bounds requests and preserves explicit retry IDs, with no retry after timeout or close', async () => {
    vi.useFakeTimers();
    const requests = new CollaborationRequests(),
        send = vi.fn();
    try {
        const pending = Array.from({ length: 16 }, (_, index) =>
            requests.request({ op: CollaborationOp.Code, id: String(index) }, send),
        );
        await expect(
            requests.request({ op: CollaborationOp.Code, id: '17' }, send),
        ).rejects.toThrow('capacity');
        const closed = Promise.all(
            pending.map((promise) => expect(promise).rejects.toThrow('Closed')),
        );
        requests.close(new Error('Closed'));
        await closed;
        const timeout = requests.request({ op: CollaborationOp.Code, id: 'timeout' }, send);
        const rejected = expect(timeout).rejects.toThrow('timed out');
        await vi.advanceTimersByTimeAsync(30000);
        await rejected;
        expect(send).toHaveBeenCalledTimes(17);
        const retried = requests.request({ op: CollaborationOp.Code, id: 'timeout' }, send);
        requests.receive({
            op: CollaborationOp.CodeResult,
            id: 'timeout',
            code: 'a'.repeat(32),
            expiresAt: 9007199254740993n,
        });
        await expect(retried).resolves.toMatchObject({ expiresAt: 9007199254740993n });
        expect(vi.getTimerCount()).toBe(0);
    } finally {
        requests.close(new Error('Closed'));
        vi.useRealTimers();
    }
});

it('does not send collaboration packets to hosts without the capability', async () => {
    const gateway = new TestGateway();
    const client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    try {
        await expect(
            client.collaboration({ op: CollaborationOp.Code, id: 'code' }),
        ).rejects.toThrow('unavailable');
        const fail = vi.fn();
        client.subscribeCollaborationProject('grant', 'project', () => {}, fail);
        expect(fail).toHaveBeenCalled();
        expect(gateway.requests).toHaveLength(1);
    } finally {
        client.close();
        await gateway.close();
    }
});

it('uses a bounded binary contract and rejects mismatched nested request identifiers', () => {
    const packet = {
        op: CollaborationOp.Project,
        id: 'read',
        grantId: 'grant',
        request: { op: CompanyProjectOp.Read, id: 'read', projectId: 'project' },
    } as const;
    const bytes = CompanyCollaborationProtocol.encode(packet);
    expect(CompanyCollaborationProtocol.decode(bytes)).toEqual(packet);
    expect(() =>
        CompanyCollaborationProtocol.encode({
            ...packet,
            request: { ...packet.request, id: 'wrong' },
        }),
    ).toThrow('Invalid delegated project request');
    expect(() => CompanyCollaborationProtocol.decode(bytes.subarray(0, -1))).toThrow();
    const extra = new Uint8Array(bytes.length + 1);
    extra.set(bytes);
    expect(() => CompanyCollaborationProtocol.decode(extra)).toThrow();
});
