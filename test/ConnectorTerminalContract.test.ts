// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import {
    ConnectorHostResponseerrorCodeVariant0Values,
    ConnectorHostToolValues,
    Method,
    type ConnectorHostJobView,
    type ConnectorHostStatus,
    type ConnectorHostSubmitParams,
    type ConnectorHostTool,
} from '../src/protocol/Protocol.js';
import { schema } from '../src/protocol/SchemaData.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { TestGateway, type Request } from './Support.js';

/** Published generated keys retain their existing meanings when a native capability is added. */
const publishedHostToolValues: Readonly<Record<string, ConnectorHostTool>> = {
    Value0: 'computer_info',
    Value1: 'file_read',
    Value2: 'file_digest',
    Value3: 'file_write',
    Value4: 'file_stat',
    Value5: 'file_rename',
    Value6: 'file_publish',
    Value7: 'file_chmod',
    Value8: 'directory_list',
    Value9: 'directory_create',
    Value10: 'file_remove',
    Value11: 'process_start',
    Value12: 'process_read',
    Value13: 'process_write',
    Value14: 'process_stop',
    Value15: 'process_release',
    Value16: 'desktop_info',
    Value17: 'desktop_screenshot',
    Value18: 'desktop_pointer',
    Value19: 'desktop_key',
    Value20: 'desktop_text',
};

/** These controls remain distinct from ordinary piped process operations. */
const terminalTools: readonly ConnectorHostTool[] = [
    'terminal_start',
    'terminal_read',
    'terminal_write',
    'terminal_resize',
    'terminal_stop',
    'terminal_release',
];

/** A complete profile exercises the finite bound as well as the newly admitted tool names. */
const status: ConnectorHostStatus = {
    environmentId: 'terminal-environment',
    sequence: '9007199254740993',
    acknowledgedSequence: '9007199254740993',
    online: true,
    profile: {
        grantId: 'a'.repeat(64),
        grantRevision: '1',
        enabled: true,
        platform: 'windows',
        directory: 'C:\\Nexa Tasks',
        tools: Object.values(ConnectorHostToolValues),
    },
};

/** Only envelope transport is exercised here; native argument validation belongs to the operation owner. */
function original(toolName: ConnectorHostTool): ConnectorHostSubmitParams {
    return {
        environmentId: status.environmentId,
        requestId: toolName + '-one',
        previousSequence: status.sequence,
        request: {
            grantId: 'a'.repeat(64),
            grantRevision: '1',
            toolName,
            argumentsJson: '{"processId":"terminal-one","cols":112,"rows":37}',
        },
    };
}

/** Immutable terminal receipts preserve exact byte counters inside the bounded native JSON body. */
function completed(input: ConnectorHostSubmitParams): ConnectorHostJobView {
    return {
        id: input.requestId + '-job',
        environmentId: input.environmentId,
        sequence: '9007199254740994',
        phase: 'completed',
        request: input.request,
        response: {
            outcome: 'succeeded',
            errorCode: null,
            resultJson: '{"processId":"terminal-one","finalOutputBytes":"9007199254740993"}',
        },
    };
}

it('generated host values retain published keys and match both finite schema tool bounds and error codes', (): void => {
    for (const [key, value] of Object.entries(publishedHostToolValues)) {
        expect(Reflect.get(ConnectorHostToolValues, key)).toBe(value);
    }
    const values: readonly ConnectorHostTool[] = Object.values(ConnectorHostToolValues);
    expect(values).toEqual(expect.arrayContaining([...terminalTools]));
    expect(schema.definitions?.['ConnectorHostTool']?.enum).toEqual(values);
    expect(
        schema.definitions?.['ConnectorHostResponse']?.properties?.['errorCode']?.anyOf?.[0]?.enum,
    ).toEqual(Object.values(ConnectorHostResponseerrorCodeVariant0Values));
    for (const name of ['ConnectorHostProfile', 'ConnectorHostSummary']) {
        expect(schema.definitions?.[name]?.properties?.['tools']?.maxItems).toBe(values.length);
    }
    expect(methodValidators[Method.ConnectorsHostStatus].result(status)).toBe(true);
});

it('accepts every terminal control and rejects unknown names, duplicate grants and extra authority fields', (): void => {
    for (const tool of terminalTools) {
        const input: ConnectorHostSubmitParams = original(tool);
        expect(methodValidators[Method.ConnectorsHostSubmit].params(input)).toBe(true);
        expect(methodValidators[Method.ConnectorsHostResult].result(completed(input))).toBe(true);
    }
    for (const toolName of ['terminal', 'terminal_input', 'terminal_pause', 'process_resize']) {
        expect(
            methodValidators[Method.ConnectorsHostSubmit].params({
                ...original('terminal_start'),
                request: { ...original('terminal_start').request, toolName },
            }),
        ).toBe(false);
    }
    for (const profile of [
        { ...status.profile, tools: [...terminalTools, 'terminal_read'] },
        { ...status.profile, tools: ['terminal_unknown'] },
        { ...status.profile, tools: terminalTools, nativeLock: true },
    ]) {
        expect(methodValidators[Method.ConnectorsHostStatus].result({ ...status, profile })).toBe(
            false,
        );
    }
});

it('the authenticated client round-trips a complete terminal profile and every terminal submission without altering originals', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    let client: NexaClient | null = null;
    let active: ConnectorHostSubmitParams = original('terminal_start');
    gateway.handler = (socket: WebSocket, request: Request): void => {
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result:
                    request.method === Method.ConnectorsHostStatus.valueOf()
                        ? status
                        : completed(active),
            }),
        );
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect(
            await client.call(Method.ConnectorsHostStatus, {
                environmentId: status.environmentId,
            }),
        ).toEqual(status);
        for (const tool of terminalTools) {
            active = original(tool);
            expect(await client.call(Method.ConnectorsHostSubmit, active)).toEqual(
                completed(active),
            );
            expect(
                gateway.requests.find(
                    (request: Request): boolean =>
                        request.method === Method.ConnectorsHostSubmit.valueOf() &&
                        JSON.stringify(request.params) === JSON.stringify(active),
                ),
            ).toBeDefined();
        }
    } finally {
        client?.close();
        await gateway.close();
    }
});
