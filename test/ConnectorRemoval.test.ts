// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { afterEach, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import {
    type ConnectorSubmitParams,
    type ConnectorJob,
} from 'nexa-protocol/dataplane/ConnectorTypes.js';
import { Method } from 'nexa-protocol/gateway/Method.js';
import { methodValidators } from 'nexa-protocol/schema/MethodValidators.js';
import { TestGateway, type Request } from './Support.js';
import { ConnectorFileJobPhase } from 'nerva-connector-protocol/protocol/ConnectorFileJobs.js';
import { ConnectorFileAction } from 'nerva-connector-protocol/protocol/ConnectorFileTypes.js';
import { ConnectorAuthorizationKind } from 'nerva-connector-protocol/protocol/ConnectorAuthorization.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    gateway = undefined;
    client = undefined;
});

const original: ConnectorSubmitParams = {
    environmentId: 'environment',
    previousSequence: '9007199254740993',
    request: {
        action: ConnectorFileAction.Remove,
        requestId: 'original-remove',
        policySha256: 'a'.repeat(64),
        rootId: 'project',
        path: 'tree',
        recursive: true,
    },
};

it('current file contracts require explicit recursive intent and refuse additional authority', (): void => {
    const validate: (value: unknown) => boolean =
        methodValidators[Method.ConnectorsFilesSubmit].params;
    expect(validate(original)).toBe(true);
    for (const change of [
        { recursive: undefined },
        { recursive: 'true' },
        { stagingId: 'a'.repeat(64) },
        { mode: 'replace' },
    ]) {
        expect(validate({ ...original, request: { ...original.request, ...change } })).toBe(false);
    }
});

it('the native SDK carries original removal and typed retained results through the existing account RPC', async (): Promise<void> => {
    gateway = new TestGateway();
    const expected: ConnectorJob = {
        authorization: { kind: ConnectorAuthorizationKind.Independent },
        admissionHash: 'b'.repeat(64),
        id: 'original-job',
        environmentId: original.environmentId,
        sequence: '9007199254740994',
        phase: ConnectorFileJobPhase.Completed,
        request: original.request,
        response: {
            ok: true,
            result: {
                action: ConnectorFileAction.Remove,
                requestId: 'original-remove',
                entriesRemoved: '4',
            },
        },
    };
    gateway.handler = (socket: WebSocket, request: Request): void => {
        expect(request.method).toBe(Method.ConnectorsFilesSubmit);
        expect(request.params).toEqual(original);
        socket.send(JSON.stringify({ id: request.id, ok: true, result: expected }));
    };
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    expect(await client.call(Method.ConnectorsFilesSubmit, original)).toEqual(expected);
    const validate: (value: unknown) => boolean =
        methodValidators[Method.ConnectorsFilesGet].result;
    expect(validate(expected)).toBe(true);
    expect(
        validate({
            ...expected,
            response: {
                ok: true,
                result: { action: 'remove', requestId: 'original-remove', entriesRemoved: 4 },
            },
        }),
    ).toBe(false);
    expect(
        validate({
            ...expected,
            response: { ok: true, result: { action: 'remove', requestId: 'original-remove' } },
        }),
    ).toBe(false);
});

it('directory creation and completion have one strict contract without recursive or mode authority', (): void => {
    const validate: (value: unknown) => boolean =
        methodValidators[Method.ConnectorsFilesSubmit].params;
    const input: ConnectorSubmitParams = {
        environmentId: original.environmentId,
        previousSequence: original.previousSequence,
        request: {
            action: ConnectorFileAction.Mkdir,
            requestId: 'directory',
            policySha256: 'a'.repeat(64),
            rootId: 'project',
            path: 'new-directory',
        },
    };
    expect(validate(input)).toBe(true);
    for (const addition of [{ recursive: true }, { mode: 511 }, { stagingId: 'a'.repeat(64) }]) {
        expect(validate({ ...input, request: { ...input.request, ...addition } })).toBe(false);
    }
    const completed: ConnectorJob = {
        authorization: { kind: ConnectorAuthorizationKind.Independent },
        admissionHash: 'b'.repeat(64),
        id: 'directory-job',
        environmentId: input.environmentId,
        sequence: '1',
        phase: ConnectorFileJobPhase.Completed,
        request: input.request,
        response: {
            ok: true,
            result: { action: ConnectorFileAction.Mkdir, requestId: 'directory' },
        },
    };
    const result: (value: unknown) => boolean = methodValidators[Method.ConnectorsFilesGet].result;
    expect(result(completed)).toBe(true);
    expect(
        result({
            ...completed,
            response: {
                ok: true,
                result: {
                    action: 'mkdir',
                    requestId: 'directory',
                    mode: 511,
                },
            },
        }),
    ).toBe(false);
});
