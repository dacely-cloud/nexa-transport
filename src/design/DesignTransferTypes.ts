// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Cross-document copies carry references only; source layers stay inside the authenticated workspace. */
export interface DesignTransferRequest {
    readonly id: string;
    readonly expectedRevision: string;
    readonly commandId: string;
    readonly sourceId: string;
    readonly sourceRevision: string;
    readonly sourcePageId: string;
    readonly selection: readonly string[];
    readonly pageId: string;
    readonly parentId: string | null;
    readonly x: number;
    readonly y: number;
}
