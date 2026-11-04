// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Semantic surfaces keep generated explanations legible in both application themes. */
export const VisualTone = {
    Neutral: 'neutral',
    Orange: 'orange',
    Blue: 'blue',
    Green: 'green',
    Purple: 'purple',
    Red: 'red',
} as const;
export type VisualTone = (typeof VisualTone)[keyof typeof VisualTone];
/** A scene mixes explanatory cards, background groups, typography and key figures. */
export const VisualElementKind = {
    Card: 'card',
    Group: 'group',
    Text: 'text',
    Metric: 'metric',
} as const;
export type VisualElementKind = (typeof VisualElementKind)[keyof typeof VisualElementKind];
/** Icons are native interface symbols, never model-authored markup or remote images. */
export const VisualIcon = {
    None: 'none',
    User: 'user',
    Server: 'server',
    Database: 'database',
    Cpu: 'cpu',
    Cloud: 'cloud',
    Shield: 'shield',
    Code: 'code',
    Layers: 'layers',
    Spark: 'spark',
    Check: 'check',
} as const;
export type VisualIcon = (typeof VisualIcon)[keyof typeof VisualIcon];
export const VisualSide = {
    Auto: 'auto',
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
} as const;
export type VisualSide = (typeof VisualSide)[keyof typeof VisualSide];
export const VisualLine = { Solid: 'solid', Dashed: 'dashed' } as const;
export type VisualLine = (typeof VisualLine)[keyof typeof VisualLine];
export const VisualArrow = { Forward: 'forward', Both: 'both', None: 'none' } as const;
export type VisualArrow = (typeof VisualArrow)[keyof typeof VisualArrow];
/** Scene coordinates are bounded display pixels, independent of viewport zoom. */
export interface VisualPoint extends Readonly<Record<string, number>> {
    readonly x: number;
    readonly y: number;
}
/** All copy is plain text; geometry and semantic style are the complete rendering instructions. */
export interface VisualElement extends Readonly<Record<string, string | number>> {
    readonly x: number;
    readonly y: number;
    readonly id: string;
    readonly kind: VisualElementKind;
    readonly title: string;
    readonly detail: string;
    readonly eyebrow: string;
    readonly value: string;
    readonly icon: VisualIcon;
    readonly tone: VisualTone;
    readonly width: number;
    readonly height: number;
}
/** Routes attach to card boundaries; optional waypoints describe intentional bends. */
export interface VisualConnection extends Readonly<
    Record<string, string | boolean | readonly VisualPoint[]>
> {
    readonly id: string;
    readonly from: string;
    readonly to: string;
    readonly label: string;
    readonly fromSide: VisualSide;
    readonly toSide: VisualSide;
    readonly line: VisualLine;
    readonly arrow: VisualArrow;
    readonly animated: boolean;
    readonly via: readonly VisualPoint[];
}
/** Optional guided explanations highlight existing content without changing its meaning or geometry. */
export interface VisualStep extends Readonly<Record<string, string | readonly string[]>> {
    readonly title: string;
    readonly detail: string;
    readonly elements: readonly string[];
    readonly connections: readonly string[];
}
/** Versioned, inert UI instructions delivered and restored as part of an ordinary conversation. */
export interface VisualResponse extends Readonly<
    Record<
        string,
        | string
        | number
        | readonly VisualElement[]
        | readonly VisualConnection[]
        | readonly VisualStep[]
    >
> {
    readonly version: 1;
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly width: number;
    readonly height: number;
    readonly elements: readonly VisualElement[];
    readonly connections: readonly VisualConnection[];
    readonly steps: readonly VisualStep[];
}
