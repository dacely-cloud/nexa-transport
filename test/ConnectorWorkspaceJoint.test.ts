// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import {
    Method,
    ConnectorFileModeValues,
    type ConnectorWorkspaceSelectJointParams,
    type ConnectorWorkspaceSelectionView,
} from '../src/protocol/Protocol.js';
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

const original: ConnectorWorkspaceSelectJointParams = {
    sessionId: 'owned-session',
    requestId: 'original-joint-selection',
    expectedRevision: 'a'.repeat(64),
    target: {
        environmentId: 'environment',
        fileRootId: 'project',
        executionRootId: 'programs',
        filePolicySha256: 'b'.repeat(64),
        executionPolicySha256: 'c'.repeat(64),
        access: ConnectorFileModeValues.Value1,
        bindingRevision: '9007199254740993',
        bindingSha256: 'd'.repeat(64),
        descriptorSha256: 'e'.repeat(64),
    },
};
const view: ConnectorWorkspaceSelectionView = {
    sessionId: original.sessionId,
    revision: 'f'.repeat(64),
    selection: {
        kind: 'joint',
        environmentId: original.target.environmentId,
        rootId: original.target.fileRootId,
        policySha256: original.target.filePolicySha256,
        mode: original.target.access,
        executionRootId: original.target.executionRootId,
        executionPolicySha256: original.target.executionPolicySha256,
        bindingRevision: original.target.bindingRevision,
        jointBindingSha256: original.target.bindingSha256,
        descriptorSha256: original.target.descriptorSha256,
    },
};

it('requires explicit selection kinds and every exact Joint commitment in the generated schema', (): void => {
    expect(methodValidators[Method.ConnectorsWorkspaceSelectJoint].params(original)).toBe(true);
    expect(methodValidators[Method.ConnectorsWorkspaceGet].result(view)).toBe(true);
    for (const replacement of [
        { bindingRevision: 9007199254740992 },
        { bindingRevision: '0' },
        { bindingRevision: '01' },
        { descriptorSha256: 'a'.repeat(63) },
        { executionRootId: '/private/path' },
        { endpoint: 'https://private' },
    ]) {
        expect(
            methodValidators[Method.ConnectorsWorkspaceSelectJoint].params({
                ...original,
                target: { ...original.target, ...replacement },
            }),
        ).toBe(false);
    }
    if (view.selection === null) {
        throw new Error('Joint fixture required');
    }
    const {
        kind: _kind,
        ...missingKind
    }: NonNullable<ConnectorWorkspaceSelectionView['selection']> = view.selection;
    expect(
        methodValidators[Method.ConnectorsWorkspaceGet].result({ ...view, selection: missingKind }),
    ).toBe(false);
    expect(
        methodValidators[Method.ConnectorsWorkspaceGet].result({
            ...view,
            selection: { ...view.selection, kind: 'files' },
        }),
    ).toBe(false);
});

it('caps public catalogs and rejects account, route and private proof injection', (): void => {
    const { environmentId, ...entry }: ConnectorWorkspaceSelectJointParams['target'] =
        original.target;
    const validate: (value: unknown) => boolean =
        methodValidators[Method.ConnectorsWorkspaceCatalog].result;
    expect(
        methodValidators[Method.ConnectorsWorkspaceCatalog].params({
            sessionId: original.sessionId,
            environmentId,
        }),
    ).toBe(true);
    expect(
        methodValidators[Method.ConnectorsWorkspaceCatalog].params({
            sessionId: original.sessionId,
            environmentId,
            userId: 'foreign',
        }),
    ).toBe(false);
    expect(
        validate({
            environmentId,
            entries: Array.from({ length: 128 }, (): typeof entry => entry),
        }),
    ).toBe(true);
    expect(
        validate({
            environmentId,
            entries: Array.from({ length: 129 }, (): typeof entry => entry),
        }),
    ).toBe(false);
    expect(validate({ environmentId, entries: [{ ...entry, signature: 'private-proof' }] })).toBe(
        false,
    );
    expect(validate({ environmentId, entries: [entry], receipt: {} })).toBe(false);
});

it('carries the exact captured target once through the typed native client without automatic reselection', async (): Promise<void> => {
    gateway = new TestGateway();
    gateway.handler = (socket: WebSocket, request: Request): void => {
        expect(request.method).toBe(Method.ConnectorsWorkspaceSelectJoint.valueOf());
        expect(request.params).toEqual(original);
        socket.send(JSON.stringify({ id: request.id, ok: true, result: view }));
    };
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    expect(await client.call(Method.ConnectorsWorkspaceSelectJoint, original)).toEqual(view);
    expect(
        gateway.requests.filter(
            (request: Request): boolean =>
                request.method === Method.ConnectorsWorkspaceSelectJoint.valueOf(),
        ),
    ).toHaveLength(1);
});
