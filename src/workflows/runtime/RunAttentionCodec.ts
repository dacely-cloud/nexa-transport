// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from '../WorkflowInput.js';
import {
    WorkflowAttentionCategory,
    type WorkflowAttentionQuery,
    type WorkflowAttentionCursor,
} from './RunAttentionTypes.js';

/** Portable strict cursor and query validation for the owner inbox. */
export class WorkflowAttentionCodec {
    /** Rejects mixed source cursors and unbounded scans before querying storage. */
    public static query(raw: unknown): WorkflowAttentionQuery {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'category',
            'after',
            'limit',
        ]);
        const category: unknown = value['category'];
        if (
            category !== WorkflowAttentionCategory.Requests &&
            category !== WorkflowAttentionCategory.Failures
        ) {
            throw new Error('Unsupported workflow attention category');
        }
        const limit: unknown = value['limit'];
        if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 20) {
            throw new Error('Attention page size must be between 1 and 20');
        }
        let after: WorkflowAttentionCursor | null = null;
        if (value['after'] !== null) {
            const cursor: Readonly<Record<string, unknown>> = WorkflowInput.record(value['after'], [
                'runId',
                'nodeId',
            ]);
            after = {
                runId: WorkflowInput.id(cursor['runId']),
                nodeId: cursor['nodeId'] === null ? null : WorkflowInput.id(cursor['nodeId']),
            };
            if ((category === WorkflowAttentionCategory.Requests) !== (after.nodeId !== null)) {
                throw new Error('Attention cursor belongs to another category');
            }
        }
        return { category, after, limit };
    }
}
