// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { Method } from '../src/protocol/Protocol.js';
import { WorkflowCodec } from '../src/workflows/WorkflowCodec.js';
import { WorkflowModelsCodec } from '../src/workflows/WorkflowModels.js';
import { WorkflowInput } from '../src/workflows/WorkflowInput.js';
import type { WorkflowCreateRequest } from '../src/workflows/WorkflowRequests.js';
import type { WorkflowNode } from '../src/workflows/WorkflowTypes.js';

it('accepts long workflow and node identities through the actual RPC validators', (): void => {
    const id: string = 'workflow-'.repeat(100);
    const request: WorkflowCreateRequest = {
        workflowId: id,
        commandId: id,
        details: { name: 'Reports', description: '', tags: [], folder: id },
    };
    expect(methodValidators[Method.WorkflowsCreate].params(request)).toBe(true);
    const prompt: string = 'Instructions for the whole workflow. '.repeat(500);
    const node: WorkflowNode = {
        id,
        component: 'agent.turn',
        componentVersion: '1',
        label: 'Reports',
        configuration: { prompt },
        resources: [],
    };
    expect(WorkflowCodec.node(node)).toEqual(node);
});

it('accepts provider model identities beyond 256 characters and reports malformed values accurately', (): void => {
    const id: string = `provider/${'model-'.repeat(100)}@stable+variant`;
    expect(WorkflowModelsCodec.identity(id)).toBe(id);
    expect(
        methodValidators[Method.WorkflowsModels].params({
            workflowId: 'draft',
            provider: 'provider',
            query: '',
            capability: 'text',
            compatibleOnly: true,
            favorites: [id],
            after: id,
        }),
    ).toBe(true);
    expect((): string => WorkflowInput.id('')).toThrow('Invalid workflow identity');
    expect((): string => WorkflowInput.text(42, 256)).toThrow('Expected workflow text');
});
