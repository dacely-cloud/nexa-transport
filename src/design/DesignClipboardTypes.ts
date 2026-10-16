// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSelectionBounds } from './DesignSelectionTypes.js';

/** Copy references the exact source revision without transmitting selected source bodies. */
export interface DesignClipboardCopyRequest {
    readonly clipboardId: string;
    readonly sourceId: string;
    readonly sourceRevision: string;
    readonly pageId: string;
    readonly selection: readonly string[];
}

/** Small receipt for the owner's current immutable clipboard snapshot. */
export interface DesignClipboardReceipt {
    readonly clipboardId: string;
    readonly sourceId: string;
    readonly sourceRevision: string;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly bounds: DesignSelectionBounds;
    readonly nodeCount: number;
    readonly expiresAt: string;
}

/** Placement either centers the copied bounds, uses their original position or specifies a top-left point. */
export const DesignClipboardPlacement = {
    Center: 'center',
    Original: 'original',
    Point: 'point',
} as const;
/** Closed placement mode for native paste commands. */
export type DesignClipboardPlacement =
    (typeof DesignClipboardPlacement)[keyof typeof DesignClipboardPlacement];

/** Paste references a native clipboard snapshot and creates one normal undoable destination command. */
export interface DesignClipboardPasteRequest {
    readonly id: string;
    readonly expectedRevision: string;
    readonly commandId: string;
    readonly clipboardId: string;
    readonly pageId: string;
    readonly parentId: string | null;
    readonly placement: DesignClipboardPlacement;
    readonly x: number;
    readonly y: number;
}

/** Cut atomically freezes native source and removes its selected forests as one undoable source command. */
export interface DesignClipboardCutRequest {
    readonly id: string;
    readonly expectedRevision: string;
    readonly commandId: string;
    readonly clipboardId: string;
    readonly pageId: string;
    readonly selection: readonly string[];
}
