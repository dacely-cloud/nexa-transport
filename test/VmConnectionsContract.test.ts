// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import {
    Method,
    type ChatModelSelection,
    type LicensedToolStatus,
} from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import {
    ChatModelSource,
    LicensedTool,
    LicensedToolState,
} from '../src/connections/ConnectionTypes.js';

const status: LicensedToolStatus = {
    tool: LicensedTool.IdaPro,
    title: 'IDA Pro',
    state: LicensedToolState.Installed,
    edition: 'ida-pro',
    detail: 'Installed on your VM with your license.',
};

it('accepts only closed licensed tool replies, so no license field can ride along', (): void => {
    expect(methodValidators[Method.ConnectionsToolsStatus].result({ tools: [status] })).toBe(true);
    expect(
        methodValidators[Method.ConnectionsToolsStatus].result({
            tools: [{ ...status, apiKey: 'leaked-key-value' }],
        }),
    ).toBe(false);
    expect(methodValidators[Method.ConnectionsToolsInstall].params({ tool: 'ida-pro' })).toBe(true);
    expect(methodValidators[Method.ConnectionsToolsInstall].params({ tool: 'other' })).toBe(false);
    expect(methodValidators[Method.ConnectionsToolsStatus].params({ userId: 'someone' })).toBe(
        false,
    );
});

it('carries a connected chat model on stream requests and refuses unknown sources', (): void => {
    const model: ChatModelSelection = {
        source: ChatModelSource.Subscription,
        provider: 'claude-code',
        model: 'claude-opus-5-5',
    };
    expect(methodValidators[Method.AgentStream].params({ message: 'Hello', model })).toBe(true);
    expect(
        methodValidators[Method.AgentStream].params({
            message: 'Hello',
            model: { ...model, source: 'borrowed-key' },
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.ConnectionsModelsList].result({
            items: [{ ...model, name: 'Claude Opus 5.5', providerName: 'Claude Code' }],
        }),
    ).toBe(true);
});

it('retires the per-workflow application sign-in methods', (): void => {
    expect(Object.values(Method)).not.toContain('workflows.runs.applications.check');
    expect(Object.values(Method)).not.toContain('workflows.runs.applications.setup');
    expect(Object.values(Method)).toContain('connections.applications.setup');
});
