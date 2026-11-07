// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import {
    Method,
    type ConnectorWorkspaceSelectHostParams,
    type ConnectorWorkspaceSelectionView,
} from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { TestGateway, type Request } from './Support.js';

const original: ConnectorWorkspaceSelectHostParams = {
    sessionId: 'owned-session',
    requestId: 'select-owned-host',
    expectedRevision: 'a'.repeat(64),
    environmentId: 'environment',
    grantId: 'b'.repeat(64),
    grantRevision: '9007199254740993',
};
const view: ConnectorWorkspaceSelectionView = {
    sessionId: original.sessionId,
    revision: 'c'.repeat(64),
    selection: {
        kind: 'host',
        environmentId: original.environmentId,
        grantId: original.grantId,
        grantRevision: original.grantRevision,
        platform: 'windows',
        directory: 'C:\\Users\\Owner\\Nexa Tasks',
        mode: 'read-write',
    },
};

it('host selection preserves exact grant revisions and rejects injected account, path and local consent authority', (): void => {
    const params: (raw: unknown) => boolean =
        methodValidators[Method.ConnectorsWorkspaceSelectHost].params;
    const result: (raw: unknown) => boolean =
        methodValidators[Method.ConnectorsWorkspaceGet].result;
    expect(params(original)).toBe(true);
    expect(result(view)).toBe(true);
    for (const replacement of [
        { userId: 'foreign' },
        { directory: 'C:\\private' },
        { enabled: true },
        { grantRevision: '0' },
        { grantRevision: '01' },
        { grantRevision: '9223372036854775808' },
        { grantRevision: 9007199254740992 },
        { grantId: 'b'.repeat(63) },
    ]) {
        expect(params({ ...original, ...replacement })).toBe(false);
    }
    for (const replacement of [
        { directory: 'relative/path' },
        { directory: 'C:\\private\u0000path' },
        { grantRevision: '9223372036854775808' },
        { signature: 'private-proof' },
        { kind: 'files' },
    ]) {
        expect(result({ ...view, selection: { ...view.selection, ...replacement } })).toBe(false);
    }
});

it('the public client sends one captured host selection through the authenticated connection', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    let client: NexaClient | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        expect(request.method).toBe(Method.ConnectorsWorkspaceSelectHost.valueOf());
        expect(request.params).toEqual(original);
        socket.send(JSON.stringify({ id: request.id, ok: true, result: view }));
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect(await client.call(Method.ConnectorsWorkspaceSelectHost, original)).toEqual(view);
        expect(
            gateway.requests.filter(
                (request: Request): boolean =>
                    request.method === Method.ConnectorsWorkspaceSelectHost.valueOf(),
            ),
        ).toHaveLength(1);
    } finally {
        client?.close();
        await gateway.close();
    }
});
