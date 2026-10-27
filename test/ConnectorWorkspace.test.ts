// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import {
    Method,
    type ConnectorWorkspaceSelectParams,
    type ConnectorWorkspaceSelectionView,
    type WireError,
} from '../src/protocol/Protocol.js';
import { SchemaValidator, type Schema } from '../src/protocol/Schema.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    gateway = undefined;
    client = undefined;
});

const original: ConnectorWorkspaceSelectParams = {
    sessionId: 'owned-session',
    requestId: 'original-selection',
    expectedRevision: 'a'.repeat(64),
    environmentId: 'environment',
    rootId: 'project',
    policySha256: 'b'.repeat(64),
};
const view: ConnectorWorkspaceSelectionView = {
    sessionId: original.sessionId,
    revision: 'c'.repeat(64),
    selection: {
        kind: 'files',
        environmentId: original.environmentId,
        rootId: original.rootId,
        policySha256: original.policySha256,
        mode: 'read-write',
    },
};

it('workspace contracts constrain revisions and reject injected account, host and access authority', (): void => {
    const validate: (value: unknown) => boolean =
        methodValidators[Method.ConnectorsWorkspaceSelect].params;
    expect(validate(original)).toBe(true);
    for (const addition of [
        { userId: 'foreign' },
        { mode: 'read-write' },
        { host: 'localhost' },
        { expectedRevision: 'A'.repeat(64) },
        { policySha256: 'b'.repeat(63) },
        { requestId: 'untrusted space' },
    ]) {
        expect(validate({ ...original, ...addition })).toBe(false);
    }
    expect(methodValidators[Method.ConnectorsWorkspaceCreate].params({ requestId: 'create' })).toBe(
        true,
    );
    expect(
        methodValidators[Method.ConnectorsWorkspaceCreate].params({
            requestId: 'create',
            sessionId: 'chosen',
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.ConnectorsWorkspaceGet].params({ sessionId: original.sessionId }),
    ).toBe(true);
    expect(
        methodValidators[Method.ConnectorsWorkspaceClear].params({
            sessionId: original.sessionId,
            requestId: original.requestId,
            expectedRevision: original.expectedRevision,
        }),
    ).toBe(true);
    expect(methodValidators[Method.ConnectorsWorkspaceGet].result(view)).toBe(true);
    expect(methodValidators[Method.ConnectorsWorkspaceGet].result({ ...view, revision: 1 })).toBe(
        false,
    );
    expect(
        methodValidators[Method.ConnectorsWorkspaceGet].result({
            ...view,
            selection: { ...view.selection, account: 'foreign' },
        }),
    ).toBe(false);
});

it('native SDK returns an owned empty conversation before any model request', async (): Promise<void> => {
    gateway = new TestGateway();
    const created: ConnectorWorkspaceSelectionView = { ...view, selection: null };
    gateway.handler = (socket: WebSocket, request: Request): void => {
        expect(request.method).toBe(Method.ConnectorsWorkspaceCreate);
        expect(request.params).toEqual({ requestId: 'create' });
        socket.send(JSON.stringify({ id: request.id, ok: true, result: created }));
    };
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    expect(await client.call(Method.ConnectorsWorkspaceCreate, { requestId: 'create' })).toEqual(
        created,
    );
});

it('definite revision conflicts retain their typed nonretryable category', async (): Promise<void> => {
    gateway = new TestGateway();
    const conflict: WireError = {
        code: 'conflict',
        message: 'Workspace selection changed',
        retryable: false,
    };
    gateway.handler = (socket: WebSocket, request: Request): void => {
        socket.send(JSON.stringify({ id: request.id, ok: false, error: conflict }));
    };
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    await expect(client.call(Method.ConnectorsWorkspaceSelect, original)).rejects.toMatchObject({
        code: 'remote',
        remote: conflict,
    });
});

it('uncertain selection delivery never automatically submits a new intent', async (): Promise<void> => {
    gateway = new TestGateway();
    gateway.handler = (socket: WebSocket, request: Request): void => {
        expect(request.params).toEqual(original);
        socket.close();
    };
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    await expect(client.call(Method.ConnectorsWorkspaceSelect, original)).rejects.toThrow();
    expect(
        gateway.requests.filter(
            (request: Request): boolean =>
                request.method === Method.ConnectorsWorkspaceSelect.valueOf(),
        ),
    ).toHaveLength(1);
});

it('trusted schema patterns remain strict after repeated validation and malformed patterns fail closed', (): void => {
    const schema: Schema = {
        definitions: {
            id: { type: 'string', pattern: '^[a-f0-9]{64}$' },
            broken: { type: 'string', pattern: '[' },
        },
    };
    const validator: SchemaValidator = new SchemaValidator(schema);
    for (let repeat: number = 0; repeat < 3; repeat += 1) {
        expect(validator.validate('#/definitions/id', 'a'.repeat(64))).toBe(true);
        expect(validator.validate('#/definitions/id', 'A'.repeat(64))).toBe(false);
        expect(validator.validate('#/definitions/broken', 'anything')).toBe(false);
    }
});
