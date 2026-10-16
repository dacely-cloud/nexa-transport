// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import {
    DesignClipboardPlacement,
    type DesignClipboardCopyRequest,
    type DesignClipboardCutRequest,
    type DesignClipboardPasteRequest,
} from './DesignClipboardTypes.js';

/** Strict reference-only clipboard boundary shared by browser requests and native tools. */
export class DesignClipboardCodec {
    /** Copy identifies selected native layers at their current revision. */
    public static copy(raw: unknown): DesignClipboardCopyRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'clipboardId',
            'sourceId',
            'sourceRevision',
            'pageId',
            'selection',
        ]);
        const selection: readonly string[] = V.list(
            value['selection'],
            128,
            (id: unknown): string => V.id(id),
        );
        if (selection.length === 0 || new Set(selection).size !== selection.length) {
            throw new Error('Select 1 to 128 distinct source layers.');
        }
        return {
            clipboardId: V.id(value['clipboardId']),
            sourceId: V.id(value['sourceId']),
            sourceRevision: V.revision(value['sourceRevision']),
            pageId: V.id(value['pageId']),
            selection,
        };
    }
    /** Cut binds a frozen snapshot and source removal to one revision and command identity. */
    public static cut(raw: unknown): DesignClipboardCutRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'expectedRevision',
            'commandId',
            'clipboardId',
            'pageId',
            'selection',
        ]);
        const copy: DesignClipboardCopyRequest = this.copy({
            clipboardId: value['clipboardId'],
            sourceId: value['id'],
            sourceRevision: value['expectedRevision'],
            pageId: value['pageId'],
            selection: value['selection'],
        });
        return {
            id: copy.sourceId,
            expectedRevision: copy.sourceRevision,
            commandId: V.id(value['commandId']),
            clipboardId: copy.clipboardId,
            pageId: copy.pageId,
            selection: copy.selection,
        };
    }
    /** No owner, source body or client-supplied snapshot is accepted by paste. */
    public static paste(raw: unknown): DesignClipboardPasteRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'expectedRevision',
            'commandId',
            'clipboardId',
            'pageId',
            'parentId',
            'placement',
            'x',
            'y',
        ]);
        return {
            id: V.id(value['id']),
            expectedRevision: V.revision(value['expectedRevision']),
            commandId: V.id(value['commandId']),
            clipboardId: V.id(value['clipboardId']),
            pageId: V.id(value['pageId']),
            parentId: V.optionalId(value['parentId']),
            placement: V.choice(
                value['placement'],
                Object.values(DesignClipboardPlacement),
                'clipboard.placement',
            ),
            x: V.number(value['x']),
            y: V.number(value['y']),
        };
    }
}
