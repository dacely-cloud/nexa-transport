// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignOperationCodec } from './DesignOperationCodec.js';
import type {
    DesignCreateRequest,
    DesignReadRequest,
    DesignSaveRequest,
    DesignUndoRequest,
    DesignListRequest,
    DesignEventsRequest,
    DesignChangesRequest,
    DesignLayoutRequest,
    DesignCursor,
} from './DesignRequests.js';

/** Strict detached request decoding shared by agent and gateway boundaries. */
export class DesignRequestCodec {
    /** Empty document creation. */
    public static create(raw: unknown): DesignCreateRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['id', 'name', 'commandId']);
        return {
            id: V.id(value['id']),
            name: V.text(value['name']),
            commandId: V.id(value['commandId']),
        };
    }
    /** A revision-pinned snapshot page. */
    public static read(raw: unknown): DesignReadRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'revision',
            'cursor',
            'limit',
        ]);
        return {
            id: V.id(value['id']),
            revision: value['revision'] === null ? null : V.revision(value['revision']),
            cursor: this.cursor(value['cursor']),
            limit: V.number(value['limit'], 1, 128, true),
        };
    }
    /** A complete atomic transaction without requiring a prior document to parse it. */
    public static save(raw: unknown): DesignSaveRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'expectedRevision',
            'commandId',
            'operations',
        ]);
        return {
            id: V.id(value['id']),
            expectedRevision: V.revision(value['expectedRevision']),
            commandId: V.id(value['commandId']),
            operations: DesignOperationCodec.operations(value['operations']),
        };
    }
    /** Owner-scoped undo of one committed transaction. */
    public static undo(raw: unknown): DesignUndoRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'expectedRevision',
            'commandId',
            'targetCommandId',
        ]);
        return {
            id: V.id(value['id']),
            expectedRevision: V.revision(value['expectedRevision']),
            commandId: V.id(value['commandId']),
            targetCommandId: V.id(value['targetCommandId']),
        };
    }
    /** Small library projection. */
    public static list(raw: unknown): DesignListRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['after', 'limit']);
        return {
            after: V.optionalId(value['after']),
            limit: V.number(value['limit'], 1, 100, true),
        };
    }
    /** A durable journal continuation. */
    public static events(raw: unknown): DesignEventsRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'afterRevision',
            'limit',
        ]);
        return {
            id: V.id(value['id']),
            afterRevision:
                value['afterRevision'] === '0' ? '0' : V.revision(value['afterRevision']),
            limit: V.number(value['limit'], 1, 128, true),
        };
    }
    /** Forward changes of one retained command. */
    public static changes(raw: unknown): DesignChangesRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'commandId',
            'cursor',
            'limit',
        ]);
        return {
            id: V.id(value['id']),
            commandId: V.id(value['commandId']),
            cursor: this.cursor(value['cursor']),
            limit: V.number(value['limit'], 1, 128, true),
        };
    }
    /** Page geometry without large entity content. */
    public static layout(raw: unknown): DesignLayoutRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'revision',
            'pageId',
            'offset',
            'limit',
        ]);
        return {
            id: V.id(value['id']),
            revision: V.revision(value['revision']),
            pageId: V.id(value['pageId']),
            offset: V.number(value['offset'], 0, 20000, true),
            limit: V.number(value['limit'], 1, 256, true),
        };
    }
    /** A detached cursor never retains caller-owned objects across an asynchronous read. */
    public static cursor(raw: unknown): DesignCursor | null {
        if (raw === null) {
            return null;
        }
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['record', 'character']);
        return {
            record: V.number(value['record'], 0, 50000, true),
            character: V.number(value['character'], 0, 32 * 1024 * 1024, true),
        };
    }
}
