// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Native SVG import creates one editable artboard without sending existing document bodies. */
export interface DesignSvgImportRequest {
    readonly id: string;
    readonly expectedRevision: string;
    readonly commandId: string;
    readonly pageId: string;
    readonly parentId: string | null;
    readonly index: number | null;
    readonly x: number;
    readonly y: number;
    readonly name: string;
    readonly source: string;
}
/** Intentional SVG file transfer and parsing remain bounded independently of canvas scrolling. */
export class DesignSvgImportLimits {
    public static readonly bytes: bigint = 2n * 1024n * 1024n;
    public static readonly characters: number = 2 * 1024 * 1024;
}
