// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Standard layer blending applies to a layer and its composited descendants. */
export const DesignBlendMode = {
    Normal: 'normal',
    Multiply: 'multiply',
    Screen: 'screen',
    Overlay: 'overlay',
    Darken: 'darken',
    Lighten: 'lighten',
    ColorDodge: 'color-dodge',
    ColorBurn: 'color-burn',
    HardLight: 'hard-light',
    SoftLight: 'soft-light',
    Difference: 'difference',
    Exclusion: 'exclusion',
    Hue: 'hue',
    Saturation: 'saturation',
    Color: 'color',
    Luminosity: 'luminosity',
} as const;

/** A validated native layer blend mode. */
export type DesignBlendMode = (typeof DesignBlendMode)[keyof typeof DesignBlendMode];

/** An isolated group starts its children against a transparent internal backdrop. */
export const DesignIsolation = { Auto: 'auto', Isolate: 'isolate' } as const;

/** Automatic grouping retains existing opacity, masking and effect isolation rules. */
export type DesignIsolation = (typeof DesignIsolation)[keyof typeof DesignIsolation];

/** Optional authored compositing preserves legacy documents with neither property. */
export interface DesignBlendStyle {
    readonly blendMode?: DesignBlendMode;
    readonly isolation?: DesignIsolation;
}
