// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** How a retained source layer controls the visibility of its sibling artwork. */
export const DesignMaskMode = { Alpha: 'alpha', Vector: 'vector', Luminance: 'luminance' } as const;
/** Stable mask rendering mode shared by tooling and the editor. */
export type DesignMaskMode = (typeof DesignMaskMode)[keyof typeof DesignMaskMode];
/** The source is an immediate child, referenced by identity rather than painter order. */
export interface DesignMask {
    readonly mode: DesignMaskMode;
    readonly sourceId: string | null;
}
