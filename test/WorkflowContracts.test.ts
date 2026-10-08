// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { WorkflowRequestCodec } from '../src/workflows/WorkflowRequestCodec.js';
import type {
    WorkflowObject,
    WorkflowValue,
    WorkflowNode,
} from '../src/workflows/WorkflowTypes.js';
import type { WorkflowSaveRequest } from '../src/workflows/WorkflowRequests.js';

it('validates the full supported configuration depth without a generated recursive-alias mismatch', (): void => {
    let nested: WorkflowValue = 'leaf';
    for (let depth: number = 0; depth < 31; depth += 1) {
        nested = { nested };
    }
    const configuration: WorkflowObject = { nested };
    const request: WorkflowSaveRequest = WorkflowRequestCodec.save({
        workflowId: 'draft',
        commandId: 'save',
        expectedRevision: '9007199254740993',
        patch: {
            details: null,
            nodes: [
                {
                    id: 'node',
                    component: 'agent',
                    componentVersion: '1',
                    label: 'Agent',
                    configuration,
                    resources: [],
                },
            ],
            positions: [],
            edges: [],
            removeNodes: [],
            removeEdges: [],
        },
    });
    expect(methodValidators[Method.WorkflowsSave].params(request)).toBe(true);
    expect(methodValidators[Method.WorkflowsSave].params({ ...request, expectedRevision: 1 })).toBe(
        false,
    );
    for (let depth: number = 0; depth < 300; depth += 1) {
        nested = { nested };
    }
    const oversized: WorkflowSaveRequest = {
        ...request,
        patch: {
            ...request.patch,
            nodes: request.patch.nodes.map((node: WorkflowNode): WorkflowNode => ({
                ...node,
                configuration: { nested },
            })),
        },
    };
    expect(methodValidators[Method.WorkflowsSave].params(oversized)).toBe(false);
    expect((): void => {
        WorkflowRequestCodec.save(oversized);
    }).toThrow('deeply nested');
});
