// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { afterEach, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import {
    type ConnectorExecutionStatus,
    type ConnectorExecutionSubmitParams,
} from 'nexa-protocol/dataplane/ConnectorExecutionTypes.js';
import { Method } from 'nexa-protocol/gateway/Method.js';
import { methodValidators } from 'nexa-protocol/schema/MethodValidators.js';
import { TestGateway, type Request } from './Support.js';
import { ExecutionLane } from 'nerva-connector-protocol/execution/ExecutionLane.js';
import { ExecutionWorkspaceAccess } from 'nerva-connector-protocol/execution/ExecutionTypes.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    gateway = undefined;
    client = undefined;
});

const original: ConnectorExecutionSubmitParams = {
    environmentId: 'environment',
    workspaceAccess: ExecutionWorkspaceAccess.ReadWrite,
    lane: ExecutionLane.First,
    previousSequence: '9007199254740993',
    request: {
        requestId: 'original',
        policySha256: 'a'.repeat(64),
        programId: 'probe',
        rootId: 'project',
        arguments: ['inspect'],
    },
};

it('the native client reads both named lanes with exact counters through the current RPC catalog', async (): Promise<void> => {
    gateway = new TestGateway();
    const expected: ConnectorExecutionStatus = {
        environmentId: original.environmentId,
        lanes: Object.values(ExecutionLane).map(
            (lane: ExecutionLane): ConnectorExecutionStatus['lanes'][number] => ({
                lane,
                sequence: original.previousSequence,
                acknowledgedSequence: original.previousSequence,
                online: false,
                profile: null,
            }),
        ),
    };
    gateway.handler = (socket: WebSocket, request: Request): void => {
        expect(request.method).toBe(Method.ConnectorsExecution);
        expect(request.params).toEqual({ environmentId: original.environmentId });
        socket.send(JSON.stringify({ id: request.id, ok: true, result: expected }));
    };
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    expect(
        await client.call(Method.ConnectorsExecution, { environmentId: original.environmentId }),
    ).toEqual(expected);
});

it('an unconfirmed mutating command preserves its complete original body and is never automatically resubmitted', async (): Promise<void> => {
    gateway = new TestGateway();
    gateway.handler = (socket: WebSocket, request: Request): void => {
        expect(request.method).toBe(Method.ConnectorsExecutionSubmit);
        expect(request.params).toEqual(original);
        socket.close();
    };
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    await expect(client.call(Method.ConnectorsExecutionSubmit, original)).rejects.toThrow();
    expect(
        gateway.requests.filter(
            (request: Request): boolean =>
                request.method === Method.ConnectorsExecutionSubmit.valueOf(),
        ),
    ).toHaveLength(1);
});

it('execution request schemas refuse unknown lanes, missing access intent and numeric counters', (): void => {
    const validate: (value: unknown) => boolean =
        methodValidators[Method.ConnectorsExecutionSubmit].params;
    expect(validate(original)).toBe(true);
    const { workspaceAccess: _access, ...missingAccess } = original;
    for (const invalid of [
        missingAccess,
        { ...original, lane: 'third' },
        { ...original, previousSequence: 1 },
        { ...original, workspaceAccess: 'admin' },
    ]) {
        expect(validate(invalid)).toBe(false);
    }
});
