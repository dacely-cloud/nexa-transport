// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { Method } from '../src/protocol/Protocol.js';
import { WorkflowCodec } from '../src/workflows/WorkflowCodec.js';
import { WorkflowModelsCodec } from '../src/workflows/WorkflowModels.js';
import { WorkflowInput } from '../src/workflows/WorkflowInput.js';
import { WorkflowRequestCodec } from '../src/workflows/WorkflowRequestCodec.js';
import type { WorkflowCreateRequest } from '../src/workflows/WorkflowRequests.js';
import type { WorkflowNode } from '../src/workflows/WorkflowTypes.js';

it('keeps IDs short through the actual RPC validators while retaining full task instructions', (): void => {
    const id: string = 'workflow';
    const request: WorkflowCreateRequest = {
        workflowId: id,
        commandId: id,
        details: { name: 'Reports', description: '', tags: [], folder: id },
    };
    expect(methodValidators[Method.WorkflowsCreate].params(request)).toBe(true);
    const task: string = 't'.repeat(256_000);
    const node: WorkflowNode = {
        id,
        component: 'agent.turn',
        componentVersion: '1',
        label: 'Reports',
        configuration: { task },
        resources: [],
    };
    expect(WorkflowCodec.node(node)).toEqual(node);
    expect((): WorkflowCreateRequest =>
        WorkflowRequestCodec.create({
            ...request,
            workflowId: 'w'.repeat(257),
        }),
    ).toThrow('exceeds 256 characters');
    expect((): WorkflowNode => WorkflowCodec.node({ ...node, id: 'n'.repeat(257) })).toThrow(
        'Node ID exceeds 256 characters',
    );
});

it('caps model identities at 256 characters and reports malformed values accurately', (): void => {
    const id: string = `provider/${'model-'.repeat(30)}@stable+variant`;
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
    expect((): string => WorkflowModelsCodec.identity('m'.repeat(257))).toThrow(
        'Model ID exceeds 256 characters',
    );
    expect((): string => WorkflowInput.text(42, 256)).toThrow('Expected workflow text');
});
