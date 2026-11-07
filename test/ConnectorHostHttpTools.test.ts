// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import {
    ConnectorHostToolValues,
    Method,
    type ConnectorHostTool,
    type ConnectorHostStatus,
    type ConnectorInventoryPage,
} from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

/** All current tools remain an approval ceiling; no call or actual host is made by schema qualification. */
const tools: readonly ConnectorHostTool[] = Object.values(ConnectorHostToolValues);
/** Public profile fields never contain a provider credential or controller endpoint. */
const status: ConnectorHostStatus = {
    environmentId: 'test-environment',
    sequence: '0',
    acknowledgedSequence: '0',
    online: true,
    profile: {
        grantId: 'a'.repeat(64),
        grantRevision: '1',
        enabled: true,
        platform: 'windows',
        directory: 'C:\\Projects',
        tools,
    },
};

it('decodes all31 current approved tools in inventory/status and accepts only the four exact HTTP tool names in admission', (): void => {
    expect(tools).toHaveLength(31);
    expect(methodValidators[Method.ConnectorsHostStatus].result(status)).toBe(true);
    const inventory: ConnectorInventoryPage = {
        items: [
            {
                enrollment: {
                    id: 'conn_' + 'b'.repeat(64),
                    environmentId: 'test-environment',
                    name: 'Uploaded-source PC',
                    phase: 'enrolled-offline',
                    revision: '1',
                    issuedAtMs: '1',
                    expiresAtMs: '1000',
                    enrolledAtMs: '2',
                    revokedAtMs: null,
                },
                presence: 'online',
                trust: 'customer-reported',
                receivedAtMs: null,
                specification: null,
                instructions: '',
                instructionsRevision: '0',
                host: {
                    grantId: 'a'.repeat(64),
                    grantRevision: '1',
                    enabled: true,
                    platform: 'windows',
                    tools,
                },
            },
        ],
        next: null,
    };
    expect(methodValidators[Method.ConnectorsInventory].result(inventory)).toBe(true);
    for (const tool of ['network_resolve', 'http_open', 'http_read', 'http_close']) {
        expect(
            methodValidators[Method.ConnectorsHostSubmit].params({
                environmentId: 'test-environment',
                requestId: 'http-original',
                previousSequence: '0',
                request: {
                    grantId: 'a'.repeat(64),
                    grantRevision: '1',
                    toolName: tool,
                    argumentsJson: '{}',
                },
            }),
        ).toBe(true);
    }
    expect(
        methodValidators[Method.ConnectorsHostSubmit].params({
            environmentId: 'test-environment',
            requestId: 'unknown-original',
            previousSequence: '0',
            request: {
                grantId: 'a'.repeat(64),
                grantRevision: '1',
                toolName: 'http_arbitrary',
                argumentsJson: '{}',
            },
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.ConnectorsHostStatus].result({
            ...status,
            profile: { ...status.profile, tools: [...tools, 'http_arbitrary'] },
        }),
    ).toBe(false);
});
