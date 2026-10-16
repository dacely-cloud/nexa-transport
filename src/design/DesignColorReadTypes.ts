// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSelectionColor } from './DesignRecolorEdits.js';

/** Revision-pinned color grouping addresses authored selection roots without source transfers. */
export interface DesignColorReadRequest {
    readonly id: string;
    readonly revision: string;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly offset: number;
    readonly limit: number;
}

/** Only colors and authored-layer counts leave storage; the digest binds all continuation pages. */
export interface DesignColorReadPage {
    readonly id: string;
    readonly revision: string;
    readonly pageId: string;
    readonly selectionSha256: string;
    readonly offset: number;
    readonly total: number;
    readonly colors: readonly DesignSelectionColor[];
    readonly nextOffset: number | null;
}

/** Native color pages use the authenticated read-only gateway. */
export interface DesignColorReadMethod {
    readonly params: DesignColorReadRequest;
    readonly result: DesignColorReadPage;
}
