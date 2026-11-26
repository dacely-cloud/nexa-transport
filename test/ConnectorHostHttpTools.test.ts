// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { expect, it } from 'vitest';
import { Method } from 'nexa-protocol/gateway/Method.js';
import { methodValidators } from 'nexa-protocol/schema/MethodValidators.js';
import {
    type ConnectorHostStatus,
    ConnectorHostTool,
} from 'nerva-connector-protocol/protocol/ConnectorHost.js';
import type { ConnectorInventoryPage } from 'nerva-connector-protocol/protocol/ConnectorInventory.js';
import { ConnectorEnrollmentPhase } from 'nerva-connector-protocol/protocol/ConnectorEnrollment.js';
import { ConnectorPresence } from 'nerva-connector-protocol/protocol/ConnectorInventory.js';
import { ConnectorInventoryTrust } from 'nerva-connector-protocol/protocol/ConnectorInventory.js';

/** All current tools remain an approval ceiling; no call or actual host is made by schema qualification. */
const tools: readonly ConnectorHostTool[] = Object.values(ConnectorHostTool);
/** Public profile fields never contain a provider credential or controller endpoint. */
const status: ConnectorHostStatus<string> = {
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

it('decodes the complete current tool catalog in inventory/status and accepts only the four exact HTTP tool names in admission', (): void => {
    expect(tools).toContain('environment_inspect');
    expect(methodValidators[Method.ConnectorsHostStatus].result(status)).toBe(true);
    const inventory: ConnectorInventoryPage<string> = {
        items: [
            {
                enrollment: {
                    id: 'conn_' + 'b'.repeat(64),
                    environmentId: 'test-environment',
                    name: 'Uploaded-source PC',
                    phase: ConnectorEnrollmentPhase.EnrolledOffline,
                    revision: '1',
                    issuedAtMs: '1',
                    expiresAtMs: '1000',
                    enrolledAtMs: '2',
                    revokedAtMs: null,
                },
                presence: ConnectorPresence.Online,
                trust: ConnectorInventoryTrust.CustomerReported,
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
