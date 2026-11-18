// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { methodValidators } from 'nexa-protocol/schema/MethodValidators.js';
import { schema } from 'nexa-protocol/schema/SchemaData.js';
import type { Schema } from 'nexa-protocol/schema/Schema.js';
import {
    ConnectorHostErrorCode,
    ConnectorHostTool,
    type ConnectorHostStatus,
    type ConnectorHostSummary,
} from 'nexa-protocol/dataplane/ConnectorHostTypes.js';
import type { ConnectorInventoryPage } from 'nexa-protocol/dataplane/ConnectorInventoryTypes.js';
import { Method } from 'nexa-protocol/gateway/Method.js';
import { TestGateway, type Request } from './Support.js';

/** Native desktop capabilities must be part of the exact published catalog, not admitted as arbitrary strings. */
const desktopTools: readonly ConnectorHostTool[] = ['application_open', 'desktop_snapshot'];
const tools: readonly ConnectorHostTool[] = [
    ...new Set([...Object.values(ConnectorHostTool), ...desktopTools]),
];
const summary: ConnectorHostSummary = {
    grantId: 'a'.repeat(64),
    grantRevision: '9007199254740993',
    enabled: true,
    platform: 'windows',
    tools,
};
const status: ConnectorHostStatus = {
    environmentId: 'env_connector_' + 'b'.repeat(64),
    sequence: '0',
    acknowledgedSequence: '0',
    online: true,
    profile: { ...summary, directory: 'C:\\Projects' },
};
/** An offline paired computer may retain its full current consent summary without any hardware sample. */
const inventory: ConnectorInventoryPage = {
    items: [
        {
            enrollment: {
                id: 'conn_' + 'b'.repeat(64),
                environmentId: status.environmentId,
                name: 'Desktop contract fixture',
                phase: 'enrolled-offline',
                revision: '1',
                issuedAtMs: '1',
                expiresAtMs: '600001',
                enrolledAtMs: '2',
                revokedAtMs: null,
            },
            presence: 'offline',
            trust: 'customer-reported',
            receivedAtMs: null,
            specification: null,
            instructions: '',
            instructionsRevision: '0',
            host: summary,
        },
    ],
    next: null,
};

it('accepts the authoritative complete host tool catalog in inventory summaries and status profiles', (): void => {
    expect(Object.values(ConnectorHostTool)).toEqual(tools);
    expect(methodValidators[Method.ConnectorsInventory].result(inventory)).toBe(true);
    expect(methodValidators[Method.ConnectorsHostStatus].result(status)).toBe(true);
    for (const name of ['ConnectorHostProfile', 'ConnectorHostSummary']) {
        const field: Schema | undefined = schema.definitions?.[name]?.properties?.['tools'];
        expect(field?.minItems).toBe(1);
        expect(field?.maxItems).toBe(tools.length);
        expect(field?.items?.$ref).toBe('#/definitions/ConnectorHostTool');
    }
});

it('keeps previously published error keys stable when an additive native expiry result is refreshed', (): void => {
    expect(ConnectorHostErrorCode.Interrupted).toBe('interrupted');
    expect(ConnectorHostErrorCode.Unsupported).toBe('unsupported');
    expect(Object.values(ConnectorHostErrorCode)).toContain('expired');
});

it('keeps both desktop names exact in original host submissions while rejecting unregistered capabilities', (): void => {
    for (const toolName of desktopTools) {
        expect(
            methodValidators[Method.ConnectorsHostSubmit].params({
                environmentId: status.environmentId,
                requestId: 'desktop-fixture',
                previousSequence: '0',
                request: {
                    grantId: summary.grantId,
                    grantRevision: summary.grantRevision,
                    toolName,
                    argumentsJson: '{}',
                },
            }),
        ).toBe(true);
    }
    for (const granted of [
        [],
        ['application_open', 'application_open'],
        ['desktop_snapshot', 'desktop_arbitrary'],
    ]) {
        expect(
            methodValidators[Method.ConnectorsHostStatus].result({
                ...status,
                profile: { ...status.profile, tools: granted },
            }),
        ).toBe(false);
        expect(
            methodValidators[Method.ConnectorsInventory].result({
                ...inventory,
                items: inventory.items.map((item) => ({
                    ...item,
                    host: { ...summary, tools: granted },
                })),
            }),
        ).toBe(false);
    }
    expect(
        methodValidators[Method.ConnectorsHostStatus].result({
            ...status,
            profile: { ...status.profile, nativeLock: true },
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.ConnectorsInventory].result({
            ...inventory,
            items: inventory.items.map((item) => ({
                ...item,
                host: { ...summary, directory: 'C:\\private' },
            })),
        }),
    ).toBe(false);
});

it('preserves complete inventory and profile replies through the actual authenticated client socket', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    let client: NexaClient | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result:
                    request.method === Method.ConnectorsInventory.valueOf() ? inventory : status,
            }),
        );
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect(await client.call(Method.ConnectorsInventory, { after: null })).toEqual(inventory);
        expect(
            await client.call(Method.ConnectorsHostStatus, { environmentId: status.environmentId }),
        ).toEqual(status);
    } finally {
        client?.close();
        await gateway.close();
    }
});
