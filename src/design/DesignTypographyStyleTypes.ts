// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignAlign } from './DesignTypes.js';
import type { DesignFontBinding } from './DesignFontTypes.js';

/** A saved text style contains typography only; content and rich ranges remain on each layer. */
export interface DesignTypographyValues {
    readonly family: string;
    readonly size: number;
    readonly weight: number;
    readonly italic: boolean;
    readonly lineHeight: number;
    readonly letterSpacing: number;
    readonly align: typeof DesignAlign.Start | typeof DesignAlign.Center | typeof DesignAlign.End;
    readonly font: DesignFontBinding | null;
}
/** Local properties override their saved style while other fields remain linked. */
export interface DesignTypographyOverrides {
    readonly family?: string;
    readonly size?: number;
    readonly weight?: number;
    readonly italic?: boolean;
    readonly lineHeight?: number;
    readonly letterSpacing?: number;
    readonly align?: typeof DesignAlign.Start | typeof DesignAlign.Center | typeof DesignAlign.End;
    readonly font?: DesignFontBinding | null;
}
/** A text layer links to a typed typography token and may override individual properties. */
export interface DesignTypographyLink {
    readonly tokenId: string;
    readonly overrides?: DesignTypographyOverrides;
}
