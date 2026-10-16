// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignStrokeCap, DesignStrokeJoin } from './DesignStrokeTypes.js';
import type { DesignPolygonSettings } from './DesignPolygons.js';
import type { DesignArcSettings } from './DesignArcs.js';
import type { DesignGradientTransform } from './DesignGradientTypes.js';
import type { DesignImageTransform } from './DesignImageTransformTypes.js';
import type { DesignImageSampling } from './DesignImageSamplingTypes.js';
import type { DesignImageAdjustments } from './DesignImageAdjustmentTypes.js';
import type { DesignTypographyValues, DesignTypographyLink } from './DesignTypographyStyleTypes.js';

import type { DesignVariantSet, DesignVariantValue } from './DesignVariantTypes.js';
import type { DesignMask } from './DesignMaskTypes.js';
import type { DesignBooleanMode } from './DesignBooleanTypes.js';
import type { DesignFontBinding } from './DesignFontTypes.js';
import type { DesignTextDirection } from './DesignTextDirection.js';
import type { DesignBlendMode, DesignIsolation } from './DesignBlendTypes.js';

/** Editable scene primitives, including reusable component definitions and instances. */
export const DesignKind = {
    Frame: 'frame',
    Group: 'group',
    Boolean: 'boolean',
    Mask: 'mask',
    Rectangle: 'rectangle',
    Ellipse: 'ellipse',
    Line: 'line',
    Polygon: 'polygon',
    Path: 'path',
    Text: 'text',
    Image: 'image',
    Component: 'component',
    ComponentSet: 'component-set',
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
    Angular: 'angular',
    Diamond: 'diamond',
    Image: 'image',
} as const;
/** Paint kind. */
export type DesignPaintKind = (typeof DesignPaintKind)[keyof typeof DesignPaintKind];
/** The four editable gradient families share stops and normalized handles. */
export type DesignGradientKind = Exclude<
    DesignPaintKind,
    typeof DesignPaintKind.Solid | typeof DesignPaintKind.Image
>;
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
    /** Null or omission retains the original angle-based linear or centered radial geometry. */
    readonly gradient?: DesignGradientTransform | null;
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
    /** Omission retains the original round-cap behavior. */
    readonly cap?: DesignStrokeCap;
    /** Omission retains the original round-join behavior. */
    readonly join?: DesignStrokeJoin;
    /** A finite ratio bounds miter corners; omission uses four. */
    readonly miterLimit?: number;
    readonly paint: DesignPaint;
    readonly width: number;
    readonly dash: readonly number[];
    /** Signed distance into the repeated dash pattern; omission starts at zero. */
    readonly dashOffset?: number;
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
    /** Omission preserves the normal layer compositing of existing documents. */
    readonly blendMode?: DesignBlendMode;
    /** Explicit isolation contains descendant blending without changing their editable tree. */
    readonly isolation?: DesignIsolation;
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
    /** Optional per-layer constraint baselines; legacy documents inherit the parent's authored dimensions. */
    readonly referenceWidth?: number;
    readonly referenceHeight?: number;
    /** Normalized frame geometry retains the original implicit basis of its absolute content and instances. */
    readonly contentReferenceWidth?: number;
    readonly contentReferenceHeight?: number;
}
/** Rich text range. Offsets are UTF-16 indices into the layer's text. */
export interface DesignTextRun {
    /** An explicit range fill stack replaces layer fills; null or omission retains legacy color/inheritance. */
    readonly fills?: readonly DesignPaint[] | null;
    /** Omission inherits a compatible base face; null explicitly chooses an unbound family. */
    readonly font?: DesignFontBinding | null;
    readonly start: number;
    readonly end: number;
    readonly family: string;
    readonly size: number;
    readonly weight: number;
    readonly italic: boolean;
    /** Null inherits the layer's fills, including gradients and image paints. */
    readonly color: string | null;
    readonly underline: boolean;
}
/** Text layout is shared by the canvas, tools and exported designs. */
export interface DesignText {
    /** Auto resolves each paragraph from its first strong character. Alignment remains physical. */
    readonly direction?: DesignTextDirection;
    /** Saved typography remains linked while local overrides and rich spans stay editable. */
    readonly typographyStyle?: DesignTypographyLink | null;
    /** Exact private font bytes remain in the owner's library, independently of the saved scene. */
    readonly font?: DesignFontBinding | null;
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
export const DesignImageFit = {
    Cover: 'cover',
    Contain: 'contain',
    Stretch: 'stretch',
    Tile: 'tile',
} as const;
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
    /** In Tile mode, content maps image units into an independently placed repeat cell. */
    readonly tile?: import('./DesignImageTileTypes.js').DesignImageTile | null;
    /** Omission or null retains the original image colors; edits never replace pixel bytes. */
    readonly adjustments?: DesignImageAdjustments | null;
    readonly fit: DesignImageFit;
    readonly cropX: number;
    readonly cropY: number;
    readonly scale: number;
    /** Optional orientation applies around the painted box center in physical pixels. */
    readonly rotation?: number;
    readonly flipX?: boolean;
    readonly flipY?: boolean;
    /** Null or omission uses fit/crop; a forward matrix provides explicit editable affine placement. */
    readonly transform?: DesignImageTransform | null;
}
/** A durable workspace image and its authored framing. */
export interface DesignImage extends DesignImageFraming {
    readonly assetId: string;
    /** Imported source viewport cropping occurs before texture filtering; null uses the full original. */
    readonly sampling?: DesignImageSampling | null;
}
/** Saved construction overlays stay separate from automatic child placement. */
export const DesignFrameGridKind = { Square: 'square', Columns: 'columns', Rows: 'rows' } as const;
/** Grid orientation for a frame's construction overlay. */
export type DesignFrameGridKind = (typeof DesignFrameGridKind)[keyof typeof DesignFrameGridKind];
/** Stretch divides available space; fixed tracks retain their authored size. */
export const DesignFrameGridDistribution = {
    Stretch: 'stretch',
    Start: 'start',
    Center: 'center',
    End: 'end',
} as const;
/** Track distribution within the frame's margins. */
export type DesignFrameGridDistribution =
    (typeof DesignFrameGridDistribution)[keyof typeof DesignFrameGridDistribution];
/** One editable overlay has a stable identity and complete canonical settings. */
export interface DesignFrameGrid {
    readonly id: string;
    readonly kind: DesignFrameGridKind;
    readonly distribution: DesignFrameGridDistribution;
    readonly visible: boolean;
    readonly color: string;
    readonly count: number;
    readonly size: number;
    readonly gutter: number;
    readonly margin: number;
    readonly offset: number;
}
/** All layer state is explicit and editable; no generated markup is the source of truth. */
export interface DesignNode {
    /** Optional ellipse-relative arc, sector or ring parameters. */
    readonly arc?: DesignArcSettings;
    /** Optional regular polygon or star parameters; freeform path edits detach this definition. */
    readonly polygon?: DesignPolygonSettings;
    /** Optional saved frame overlays are omitted from artwork exports. */
    readonly layoutGrids?: readonly DesignFrameGrid[];
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
    /** Uniform linked artwork scale; definitions retain their original geometry and styles. */
    readonly contentScale?: number;
    readonly overrides: readonly DesignOverride[];
    /** Omitted on ordinary layers, preserving existing document and retry identities. */
    readonly booleanMode?: DesignBooleanMode;
    /** Retained source identity and coverage mode; omitted on ordinary layers. */
    readonly mask?: DesignMask;
    /** Reusable variant set metadata; only component-set containers accept it. */
    readonly variants?: DesignVariantSet;
    /** Named values on an immediate component definition inside a variant set. */
    readonly variant?: readonly DesignVariantValue[];
}
/** Instance overrides target a source layer without modifying its component definition. */
export interface DesignOverride {
    readonly nodeId: string;
    readonly name: string | null;
    readonly text: string | null;
    readonly style: DesignStyle | null;
    readonly visible: boolean | null;
}
/** A saved ruler line uses a page-world coordinate on one canvas axis. */
export const DesignRulerAxis = { X: 'x', Y: 'y' } as const;
/** Axis names are shared by native tooling, codecs and the canvas. */
export type DesignRulerAxis = (typeof DesignRulerAxis)[keyof typeof DesignRulerAxis];
/** A guide edit carries only its axis and world position. */
export interface DesignGuideValue {
    readonly axis: DesignRulerAxis;
    readonly position: number;
}
/** Stable guide identity allows independent edits without replacing other agents' guides. */
export interface DesignRulerGuide extends DesignGuideValue {
    readonly id: string;
}
/** A page has its own root layers and viewport. */
export interface DesignPage {
    /** Omitted on legacy pages; ruler guides do not affect exported artwork. */
    readonly guides?: readonly DesignRulerGuide[];
    readonly id: string;
    readonly name: string;
    readonly roots: readonly string[];
    readonly background: string;
}
/** Named design-system values. */
export interface DesignToken {
    /** Legacy typography values remain readable; typed styles are explicit and independently validated. */
    readonly typography?: DesignTypographyValues;
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
