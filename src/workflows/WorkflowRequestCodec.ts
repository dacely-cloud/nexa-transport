// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from './WorkflowInput.js';
import { WorkflowCodec } from './WorkflowCodec.js';
import { ResourceBindingCodec } from './ResourceBindingCodec.js';
import type {
    WorkflowCreateRequest,
    WorkflowSaveRequest,
    WorkflowDeleteRequest,
    WorkflowListRequest,
    WorkflowReadRequest,
    WorkflowRecordRequest,
    WorkflowValidateRequest,
} from './WorkflowRequests.js';
import type { WorkflowListCursor } from './WorkflowTypes.js';

/** Portable strict parsing at the gateway and import boundaries. Never accepts owner overrides. */
export class WorkflowRequestCodec {
    /** No account or registry override can be supplied by the remote caller. */
    public static catalog(raw: unknown): void {
        WorkflowInput.record(raw, []);
    }
    /** Pins validation to the exact revision that the editor can compare with its current draft. */
    public static validate(raw: unknown): WorkflowValidateRequest {
        const input: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'revision',
        ]);
        return Object.freeze({
            workflowId: WorkflowInput.id(input['workflowId']),
            revision: ResourceBindingCodec.decimal(input['revision']),
        });
    }
    /** Parses an idempotent empty draft creation. */
    public static create(raw: unknown): WorkflowCreateRequest {
        const input: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'commandId',
            'details',
        ]);
        return Object.freeze({
            workflowId: WorkflowInput.id(input['workflowId']),
            commandId: WorkflowInput.id(input['commandId']),
            details: WorkflowCodec.details(input['details']),
        });
    }
    /** Validates structure without requiring a runnable graph. */
    public static save(raw: unknown): WorkflowSaveRequest {
        const input: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'commandId',
            'expectedRevision',
            'patch',
        ]);
        return Object.freeze({
            workflowId: WorkflowInput.id(input['workflowId']),
            commandId: WorkflowInput.id(input['commandId']),
            expectedRevision: ResourceBindingCodec.decimal(input['expectedRevision']),
            patch: WorkflowCodec.patch(input['patch']),
        });
    }
    /** No owner override or unreviewed latest revision is accepted for deletion. */
    public static delete(raw: unknown): WorkflowDeleteRequest {
        const input: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'expectedRevision',
        ]);
        return Object.freeze({
            workflowId: WorkflowInput.id(input['workflowId']),
            expectedRevision: ResourceBindingCodec.decimal(input['expectedRevision']),
        });
    }
    /** Enforces the metadata page limit and an exact cursor. */
    public static list(raw: unknown): WorkflowListRequest {
        const input: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'limit',
            'cursor',
        ]);
        const limit: number = this.offset(input['limit'], 100);
        if (limit === 0) {
            throw new Error('Workflow page limit must be positive');
        }
        let cursor: WorkflowListCursor | null = null;
        if (input['cursor'] !== null) {
            const value: Readonly<Record<string, unknown>> = WorkflowInput.record(input['cursor'], [
                'workflowId',
                'updatedAtMs',
            ]);
            cursor = Object.freeze({
                workflowId: WorkflowInput.id(value['workflowId']),
                updatedAtMs: ResourceBindingCodec.decimal(value['updatedAtMs']),
            });
        }
        return Object.freeze({ limit, cursor });
    }
    /** Requires immutable revision pinning after the initial page. */
    public static read(raw: unknown): WorkflowReadRequest {
        const source: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const hierarchy: boolean = Object.hasOwn(source, 'groupOffset');
        const input: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'revision',
            'nodeOffset',
            'edgeOffset',
            ...(hierarchy ? ['groupOffset'] : []),
        ]);
        const nodeOffset: number = this.offset(input['nodeOffset'], 10_000);
        const edgeOffset: number = this.offset(input['edgeOffset'], 50_000);
        const revision: string | null =
            input['revision'] === null ? null : ResourceBindingCodec.decimal(input['revision']);
        const groupOffset: number | undefined = hierarchy
            ? this.offset(input['groupOffset'], 1000)
            : undefined;
        if (
            revision === null &&
            (nodeOffset !== 0 || edgeOffset !== 0 || (groupOffset ?? 0) !== 0)
        ) {
            throw new Error('Pin the workflow revision before reading subsequent pages');
        }
        return Object.freeze({
            workflowId: WorkflowInput.id(input['workflowId']),
            revision,
            ...(groupOffset === undefined ? {} : { groupOffset }),
            nodeOffset,
            edgeOffset,
        });
    }
    /** Reads a bounded piece of one immutable JSON record. */
    public static record(raw: unknown): WorkflowRecordRequest {
        const input: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'reference',
            'offset',
        ]);
        return Object.freeze({
            workflowId: WorkflowInput.id(input['workflowId']),
            reference: WorkflowInput.id(input['reference']),
            offset: this.offset(input['offset'], 1_073_741_824),
        });
    }
    /** Offsets are bounded local collection/string indices, never external integer identities. */
    public static offset(raw: unknown, maximum: number): number {
        if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0 || raw > maximum) {
            throw new Error(`Workflow offset must be an integer from 0 to ${maximum}`);
        }
        return raw;
    }
}
