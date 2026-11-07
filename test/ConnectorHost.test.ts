// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import {
    Method,
    type ConnectorHostStatus,
    type ConnectorHostSubmitParams,
    type ConnectorHostJobView,
} from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { TestGateway, type Request } from './Support.js';

const original: ConnectorHostSubmitParams = {
    environmentId: 'env-one',
    requestId: 'start-one',
    previousSequence: '9007199254740993',
    request: {
        grantId: 'a'.repeat(64),
        grantRevision: '1',
        toolName: 'process_start',
        argumentsJson: '{"shell":"powershell","command":"Get-Location","timeoutMs":30000}',
    },
};
const status: ConnectorHostStatus = {
    environmentId: original.environmentId,
    sequence: original.previousSequence,
    acknowledgedSequence: original.previousSequence,
    online: true,
    profile: {
        grantId: original.request.grantId,
        grantRevision: original.request.grantRevision,
        enabled: true,
        platform: 'windows',
        directory: 'C:\\Users\\Ada',
        tools: ['process_start', 'desktop_screenshot'],
    },
};
const completed: ConnectorHostJobView = {
    id: 'host-job',
    environmentId: original.environmentId,
    sequence: '9007199254740994',
    phase: 'completed',
    request: original.request,
    response: {
        outcome: 'succeeded',
        errorCode: null,
        resultJson: '{"processId":"process-one","running":true}',
    },
};

it('validates independent host grants, exact permanent counters and bounded native argument/result JSON', (): void => {
    expect(methodValidators[Method.ConnectorsHostStatus].result(status)).toBe(true);
    expect(
        methodValidators[Method.ConnectorsHostStatus].result({
            ...status,
            acknowledgedSequence: '9007199254740994',
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.ConnectorsHostStatus].result({
            ...status,
            profile: { ...status.profile, tools: ['process_start', 'process_start'] },
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.ConnectorsHostStatus].result({
            ...status,
            profile: { ...status.profile, directory: 'relative/path' },
        }),
    ).toBe(false);
    const validate: (raw: unknown) => boolean =
        methodValidators[Method.ConnectorsHostSubmit].params;
    expect(validate(original)).toBe(true);
    for (const addition of [
        { userId: 'foreign' },
        { previousSequence: 1 },
        { previousSequence: '9223372036854775807' },
        { previousSequence: '01' },
    ]) {
        expect(validate({ ...original, ...addition })).toBe(false);
    }
    for (const request of [
        { ...original.request, grantRevision: '9223372036854775808' },
        { ...original.request, argumentsJson: '[]' },
        { ...original.request, argumentsJson: '{"data":"' + '界'.repeat(22000) + '"}' },
        {
            ...original.request,
            argumentsJson: '{"data":' + '['.repeat(40) + '0' + ']'.repeat(40) + '}',
        },
    ]) {
        expect(validate({ ...original, request })).toBe(false);
    }
    expect(methodValidators[Method.ConnectorsHostResult].result(completed)).toBe(true);
    expect(
        methodValidators[Method.ConnectorsHostResult].result({ ...completed, response: null }),
    ).toBe(false);
    expect(
        methodValidators[Method.ConnectorsHostResult].result({
            ...completed,
            response: { outcome: 'succeeded', errorCode: null, resultJson: null },
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.ConnectorsHostResult].result({
            ...completed,
            response: { outcome: 'indeterminate', errorCode: 'interrupted', resultJson: null },
        }),
    ).toBe(true);
    for (const response of [
        { outcome: 'failed', resultJson: null },
        { outcome: 'failed', errorCode: null, resultJson: null },
        { outcome: 'failed', errorCode: 'ENOENT /private/path', resultJson: null },
        { outcome: 'succeeded', errorCode: 'not-found', resultJson: '{}' },
    ]) {
        expect(
            methodValidators[Method.ConnectorsHostResult].result({ ...completed, response }),
        ).toBe(false);
    }
    expect(
        methodValidators[Method.ConnectorsHostResult].result({
            ...completed,
            response: { outcome: 'failed', errorCode: 'not-found', resultJson: null },
        }),
    ).toBe(true);
});

it('the public client uses the existing authenticated connection for host status, original admission and result observation', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    let client: NexaClient | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result:
                    request.method === Method.ConnectorsHostStatus.valueOf() ? status : completed,
            }),
        );
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect(
            await client.call(Method.ConnectorsHostStatus, {
                environmentId: original.environmentId,
            }),
        ).toEqual(status);
        expect(await client.call(Method.ConnectorsHostSubmit, original)).toEqual(completed);
        expect(
            await client.call(Method.ConnectorsHostResult, {
                environmentId: original.environmentId,
                jobId: completed.id,
            }),
        ).toEqual(completed);
        expect(
            gateway.requests.filter(
                (request: Request): boolean =>
                    request.method === Method.ConnectorsHostSubmit.valueOf(),
            ),
        ).toHaveLength(1);
    } finally {
        client?.close();
        await gateway.close();
    }
});
