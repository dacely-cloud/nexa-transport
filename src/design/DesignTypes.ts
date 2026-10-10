// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Editable scene primitives, including reusable component definitions and instances. */
export const DesignKind = {
    Frame: 'frame',
    Group: 'group',
    Rectangle: 'rectangle',
    Ellipse: 'ellipse',
    Line: 'line',
    Polygon: 'polygon',
    Path: 'path',
    Text: 'text',
    Image: 'image',
    Component: 'component',
    Instance: 'instance',
} as const;
/** Primitive identity. */
export type DesignKind = (typeof DesignKind)[keyof typeof DesignKind];
/** Free positioning and responsive container layouts. */
export const DesignFlow = {
    Absolute: 'absolute',
    Row: 'row',
    Column: 'column',
    Grid: 'grid',
} as const;
/** Layout direction. */
export type DesignFlow = (typeof DesignFlow)[keyof typeof DesignFlow];
/** Sizing relative to the parent and content. */
export const DesignSizing = { Fixed: 'fixed', Fill: 'fill', Hug: 'hug' } as const;
/** Sizing choice. */
export type DesignSizing = (typeof DesignSizing)[keyof typeof DesignSizing];
/** Alignment within the available layout space. */
export const DesignAlign = {
    Start: 'start',
    Center: 'center',
    End: 'end',
    Between: 'between',
    Stretch: 'stretch',
} as const;
/** Alignment choice. */
export type DesignAlign = (typeof DesignAlign)[keyof typeof DesignAlign];
/** Absolute children retain a chosen relation to a resized parent. */
export const DesignConstraint = {
    Start: 'start',
    Center: 'center',
    End: 'end',
    Stretch: 'stretch',
    Scale: 'scale',
} as const;
/** Constraint choice. */
export type DesignConstraint = (typeof DesignConstraint)[keyof typeof DesignConstraint];
/** Supported paint sources. Image assets use workspace references. */
export const DesignPaintKind = {
    Solid: 'solid',
    Linear: 'linear',
    Radial: 'radial',
    Image: 'image',
} as const;
/** Paint kind. */
export type DesignPaintKind = (typeof DesignPaintKind)[keyof typeof DesignPaintKind];
/** Color stop in a normalized gradient. */
export interface DesignGradientStop {
    readonly offset: number;
    readonly color: string;
}
/** Layer paint. Colors are validated hex values, never arbitrary CSS. */
export interface DesignPaint {
    readonly kind: DesignPaintKind;
    readonly color: string;
    readonly opacity: number;
    readonly angle: number;
    readonly stops: readonly DesignGradientStop[];
    readonly assetId: string | null;
    readonly tokenId: string | null;
    /** Omitted framing retains the original centered-cover behavior of existing image paints. */
    readonly framing?: DesignImageFraming;
}
/** Four independent corner radii, in clockwise order. */
export interface DesignCorners {
    readonly topLeft: number;
    readonly topRight: number;
    readonly bottomRight: number;
    readonly bottomLeft: number;
}
/** Outline properties. */
export interface DesignStroke {
    readonly paint: DesignPaint;
    readonly width: number;
    readonly dash: readonly number[];
}
/** Drop or inner shadow. */
export interface DesignShadow {
    readonly x: number;
    readonly y: number;
    readonly blur: number;
    readonly spread: number;
    readonly color: string;
    readonly inner: boolean;
}
/** Style can be shared across arbitrary primitives. */
export interface DesignStyle {
    readonly fills: readonly DesignPaint[];
    readonly stroke: DesignStroke | null;
    readonly corners: DesignCorners;
    readonly shadows: readonly DesignShadow[];
    readonly blur: number;
}
/** Container layout, including wrapping, grid tracks and content alignment. */
export interface DesignLayout {
    readonly flow: DesignFlow;
    readonly wrap: boolean;
    readonly gap: number;
    readonly rowGap: number;
    readonly padding: DesignInsets;
    readonly align: DesignAlign;
    readonly justify: DesignAlign;
    readonly columns: number;
    readonly clip: boolean;
}
/** Box padding. */
export interface DesignInsets {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
}
/** Child sizing and positioning relative to its parent. */
export interface DesignPlacement {
    readonly width: DesignSizing;
    readonly height: DesignSizing;
    readonly absolute: boolean;
    readonly horizontal: DesignConstraint;
    readonly vertical: DesignConstraint;
    readonly minWidth: number;
    readonly maxWidth: number;
    readonly minHeight: number;
    readonly maxHeight: number;
    readonly columnSpan: number;
    readonly rowSpan: number;
}
/** Rich text range. Offsets are UTF-16 indices into the layer's text. */
export interface DesignTextRun {
    readonly start: number;
    readonly end: number;
    readonly family: string;
    readonly size: number;
    readonly weight: number;
    readonly italic: boolean;
    readonly color: string;
    readonly underline: boolean;
}
/** Text layout is shared by the canvas, tools and exported designs. */
export interface DesignText {
    readonly content: string;
    readonly family: string;
    readonly size: number;
    readonly weight: number;
    readonly italic: boolean;
    readonly lineHeight: number;
    readonly letterSpacing: number;
    readonly align: DesignAlign;
    readonly runs: readonly DesignTextRun[];
}
/** Path verbs use explicit coordinates; cubic curves are preserved as editable geometry. */
export const DesignPathVerb = {
    Move: 'M',
    Line: 'L',
    Quadratic: 'Q',
    Cubic: 'C',
    Close: 'Z',
} as const;
/** Vector path verb. */
export type DesignPathVerb = (typeof DesignPathVerb)[keyof typeof DesignPathVerb];
/** A vector instruction in layer-local coordinates. */
export interface DesignPathCommand {
    readonly verb: DesignPathVerb;
    readonly values: readonly number[];
}
/** Image scaling mode. */
export const DesignImageFit = { Cover: 'cover', Contain: 'contain' } as const;
/** Image scaling mode. */
export type DesignImageFit = (typeof DesignImageFit)[keyof typeof DesignImageFit];
/** Token families. */
export const DesignTokenCategory = {
    Color: 'color',
    Spacing: 'spacing',
    Typography: 'typography',
} as const;
/** Token family. */
export type DesignTokenCategory = (typeof DesignTokenCategory)[keyof typeof DesignTokenCategory];
/** Prototype triggers. */
export const DesignTrigger = { Click: 'click', Hover: 'hover', After: 'after' } as const;
/** Prototype trigger. */
export type DesignTrigger = (typeof DesignTrigger)[keyof typeof DesignTrigger];
/** Prototype actions. */
export const DesignAction = { Navigate: 'navigate', Overlay: 'overlay', Back: 'back' } as const;
/** Prototype action. */
export type DesignAction = (typeof DesignAction)[keyof typeof DesignAction];
/** Prototype transitions. */
export const DesignTransition = {
    Instant: 'instant',
    Dissolve: 'dissolve',
    Slide: 'slide',
} as const;
/** Prototype transition. */
export type DesignTransition = (typeof DesignTransition)[keyof typeof DesignTransition];
/** Workspace image reference and crop transform. */
export interface DesignImageFraming {
    readonly fit: DesignImageFit;
    readonly cropX: number;
    readonly cropY: number;
    readonly scale: number;
}
/** A durable workspace image and its authored framing. */
export interface DesignImage extends DesignImageFraming {
    readonly assetId: string;
}
/** All layer state is explicit and editable; no generated markup is the source of truth. */
export interface DesignNode {
    readonly id: string;
    readonly name: string;
    readonly kind: DesignKind;
    readonly parentId: string | null;
    readonly children: readonly string[];
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly rotation: number;
    readonly opacity: number;
    readonly visible: boolean;
    readonly locked: boolean;
    readonly style: DesignStyle;
    readonly layout: DesignLayout;
    readonly placement: DesignPlacement;
    readonly text: DesignText | null;
    readonly path: readonly DesignPathCommand[];
    readonly image: DesignImage | null;
    readonly componentId: string | null;
    readonly overrides: readonly DesignOverride[];
}
/** Instance overrides target a source layer without modifying its component definition. */
export interface DesignOverride {
    readonly nodeId: string;
    readonly name: string | null;
    readonly text: string | null;
    readonly style: DesignStyle | null;
    readonly visible: boolean | null;
}
/** A page has its own root layers and viewport. */
export interface DesignPage {
    readonly id: string;
    readonly name: string;
    readonly roots: readonly string[];
    readonly background: string;
}
/** Named design-system values. */
export interface DesignToken {
    readonly id: string;
    readonly name: string;
    readonly value: string;
    readonly category: DesignTokenCategory;
}
/** Click, hover and timed prototype links are independent of editable layout. */
export interface DesignInteraction {
    readonly id: string;
    readonly nodeId: string;
    readonly targetId: string;
    readonly trigger: DesignTrigger;
    readonly action: DesignAction;
    readonly transition: DesignTransition;
    readonly durationMs: number;
}
/** Anchored comments can refer to exact layers or canvas coordinates. */
export interface DesignComment {
    readonly id: string;
    readonly nodeId: string | null;
    readonly x: number;
    readonly y: number;
    readonly text: string;
    readonly author: string;
    readonly resolved: boolean;
}
/** Revision numbers are decimal strings across JavaScript runtimes and the wire. */
export interface DesignDocument {
    readonly format: 1;
    readonly id: string;
    readonly name: string;
    readonly revision: string;
    readonly pages: readonly DesignPage[];
    readonly nodes: readonly DesignNode[];
    readonly tokens: readonly DesignToken[];
    readonly interactions: readonly DesignInteraction[];
    readonly comments: readonly DesignComment[];
}
/** Resolved layout boxes are separate from authored values and never written back implicitly. */
export interface DesignBox {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly rotation: number;
    readonly depth: number;
    readonly clipId: string | null;
}
