// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignStrokeCap, DesignStrokeJoin } from './DesignStrokeTypes.js';
import type { DesignPolygonSettings } from './DesignPolygons.js';
import type { DesignArcSettings } from './DesignArcs.js';
import type { DesignGradientTransformChanges } from './DesignGradientTypes.js';
import type { DesignImageTransform } from './DesignImageTransformTypes.js';
import type { DesignImageAdjustments } from './DesignImageAdjustmentTypes.js';
import type { DesignTypographyOverrides } from './DesignTypographyStyleTypes.js';
import type { DesignTextDirection } from './DesignTextDirection.js';

import type { DesignFontBinding } from './DesignFontTypes.js';
import type { DesignVariantSet, DesignVariantValue } from './DesignVariantTypes.js';
import type { DesignMask } from './DesignMaskTypes.js';
import type { DesignBooleanMode } from './DesignBooleanTypes.js';
import type { DesignBlendMode, DesignIsolation } from './DesignBlendTypes.js';

import type {
    DesignFrameGrid,
    DesignFlow,
    DesignGradientKind,
    DesignGradientStop,
    DesignSizing,
    DesignAlign,
    DesignGuideValue,
    DesignConstraint,
    DesignNode,
    DesignPage,
    DesignStyle,
    DesignPaint,
    DesignShadow,
    DesignLayout,
    DesignPlacement,
    DesignText,
    DesignPathCommand,
    DesignImage,
    DesignImageFit,
    DesignOverride,
    DesignKind,
    DesignToken,
    DesignTokenCategory,
    DesignInteraction,
    DesignComment,
    DesignDocument,
} from './DesignTypes.js';

/** Atomic scene operations shared by agents and the editor. */
export const DesignOperationKind = {
    Insert: 'insert',
    Update: 'update',
    Resize: 'resize',
    Position: 'position',
    Translate: 'translate',
    Rotate: 'rotate',
    Scale: 'scale',
    Layout: 'layout',
    Sizing: 'sizing',
    Typography: 'typography',
    TypographyStyle: 'typography-style',
    TextStyle: 'text-style',
    Text: 'text',
    Move: 'move',
    Reparent: 'reparent',
    Remove: 'remove',
    Page: 'page',
    Guide: 'guide',
    Metadata: 'metadata',
    Token: 'token',
    Recolor: 'recolor',
    PaintColor: 'paint-color',
    PaintGradient: 'paint-gradient',
    PaintImage: 'paint-image',
    PaintPattern: 'paint-pattern',
    Stroke: 'stroke',
    Polygon: 'polygon',
    Arc: 'arc',
    Style: 'style',
} as const;
/** Replace one exact color across selected authored subtrees without transferring their source bodies. */
export interface DesignRecolorOperation {
    readonly op: typeof DesignOperationKind.Recolor;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly before: string;
    readonly after: string;
}
/** Read-only native drafts admit bounded geometry, layout, color and hierarchy edits, never source replacements. */
export type DesignPreviewOperation =
    | DesignLayoutOperation
    | DesignRecolorOperation
    | DesignReparentOperation
    | DesignResizeOperation;
/** Editable properties exclude identity and tree links, which have dedicated operations. */
export interface DesignNodeChanges {
    /** Null resets the layer to a complete ellipse, preserving paints and layout. */
    readonly arc?: DesignArcSettings | null;
    /** Replaces regular polygon or star parameters; null keeps its outline as a freeform vector. */
    readonly polygon?: DesignPolygonSettings | null;
    /** Null removes construction overlays while preserving authored artwork. */
    readonly layoutGrids?: readonly DesignFrameGrid[] | null;
    readonly contentScale?: number | null;
    /** A null value clears the operation when explicitly flattening a Boolean group. */
    readonly booleanMode?: DesignBooleanMode | null;
    /** Null clears masking when converting the container into an ordinary group. */
    readonly mask?: DesignMask | null;
    /** Null releases component-set metadata when converting its container. */
    readonly variants?: DesignVariantSet | null;
    /** Null releases a definition from its set. */
    readonly variant?: readonly DesignVariantValue[] | null;
    readonly name?: string;
    readonly kind?: DesignKind;
    readonly x?: number;
    readonly y?: number;
    readonly width?: number;
    readonly height?: number;
    readonly rotation?: number;
    readonly opacity?: number;
    readonly visible?: boolean;
    readonly locked?: boolean;
    readonly style?: DesignStyle;
    readonly layout?: DesignLayout;
    readonly placement?: DesignPlacement;
    readonly text?: DesignText | null;
    readonly path?: readonly DesignPathCommand[];
    readonly image?: DesignImage | null;
    readonly componentId?: string | null;
    readonly overrides?: readonly DesignOverride[];
}
/** Insert a standalone node at a precise location in a page or container. */
export interface DesignInsert {
    readonly op: typeof DesignOperationKind.Insert;
    readonly node: DesignNode;
    readonly parentId: string | null;
    readonly pageId: string;
    readonly index: number;
}
/** Update only chosen properties, preserving unrelated edits. */
export interface DesignUpdate {
    readonly op: typeof DesignOperationKind.Update;
    readonly id: string;
    readonly changes: DesignNodeChanges;
}
/** Optional edge changes preserve the other saved padding values. */
export interface DesignPaddingChanges {
    readonly top?: number;
    readonly right?: number;
    readonly bottom?: number;
    readonly left?: number;
}
/** A compact native layout edit changes only supplied fields. */
export interface DesignLayoutChanges {
    readonly flow?: DesignFlow;
    readonly wrap?: boolean;
    readonly gap?: number;
    readonly rowGap?: number;
    readonly padding?: DesignPaddingChanges;
    readonly align?: DesignAlign;
    readonly justify?: DesignAlign;
    readonly columns?: number;
    readonly clip?: boolean;
}
/** Native layout geometry is resolved against owner-scoped source records, never browser body placeholders. */
export interface DesignLayoutOperation {
    readonly op: typeof DesignOperationKind.Layout;
    readonly id: string;
    readonly pageId: string;
    readonly changes: DesignLayoutChanges;
}
/** Native sizing changes preserve every omitted saved placement field. */
export interface DesignSizingChanges {
    readonly width?: DesignSizing;
    readonly height?: DesignSizing;
    readonly minWidth?: number;
    readonly maxWidth?: number;
    readonly minHeight?: number;
    readonly maxHeight?: number;
    readonly columnSpan?: number;
    readonly rowSpan?: number;
}
/** Limits and sizing modes resolve against complete native sources without transferring their bodies. */
export interface DesignSizingOperation {
    readonly op: typeof DesignOperationKind.Sizing;
    readonly id: string;
    readonly pageId: string;
    readonly changes: DesignSizingChanges;
}
/** Base typography changes preserve the source content and every authored rich-text range. */
export interface DesignTypographyChanges {
    readonly direction?: DesignTextDirection;
    readonly family?: string;
    readonly size?: number;
    readonly weight?: number;
    readonly italic?: boolean;
    readonly lineHeight?: number;
    readonly letterSpacing?: number;
    readonly align?: typeof DesignAlign.Start | typeof DesignAlign.Center | typeof DesignAlign.End;
    readonly font?: DesignFontBinding | null;
}
/** Link one text layer to a typed saved style, reset its overrides or detach at its current appearance. */
export interface DesignTypographyStyleOperation {
    readonly op: typeof DesignOperationKind.TypographyStyle;
    readonly id: string;
    readonly pageId: string;
    readonly tokenId: string | null;
}
/** The native source remains authoritative while the website sends only changed font properties. */
export interface DesignTypographyOperation {
    readonly op: typeof DesignOperationKind.Typography;
    readonly id: string;
    readonly pageId: string;
    readonly changes: DesignTypographyChanges;
}
/** Partial styles for a nonempty UTF-16 range; omitted properties retain their per-range values. */
export interface DesignTextStyleChanges {
    /** Up to eight range paints; an empty stack hides fill ink, while null restores layer inheritance. */
    readonly fills?: readonly DesignPaint[] | null;
    readonly family?: string;
    readonly size?: number;
    readonly weight?: number;
    readonly italic?: boolean;
    /** Null removes a range's solid override and restores the layer's fills. */
    readonly color?: string | null;
    readonly underline?: boolean;
    readonly font?: DesignFontBinding | null;
}
/** Rich formatting never replaces the source body or styles outside the selected range. */
export interface DesignTextStyleOperation {
    readonly op: typeof DesignOperationKind.TextStyle;
    readonly id: string;
    readonly pageId: string;
    readonly start: number;
    readonly end: number;
    readonly changes: DesignTextStyleChanges;
}
/** Replace text content while preserving typography and clipping existing rich-text ranges. */
export interface DesignTextOperation {
    readonly op: typeof DesignOperationKind.Text;
    readonly id: string;
    readonly content: string;
}
/** Explicit geometry edits fix requested axes and preserve absolute child constraints atomically. */
export interface DesignResizeOperation {
    readonly op: typeof DesignOperationKind.Resize;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly width?: number;
    readonly height?: number;
    /** Position edits accompany a single dragged layer and use its resolved parent coordinates. */
    readonly x?: number;
    readonly y?: number;
    /** Paired normalized coordinates retain this point of one layer through resize and native content reflow. */
    readonly anchorX?: number;
    readonly anchorY?: number;
}
/** Visible parent-local coordinates and pin changes preserve the layer's resolved size. */
export interface DesignPositionChanges {
    readonly x?: number;
    readonly y?: number;
    readonly horizontal?: DesignConstraint;
    readonly vertical?: DesignConstraint;
    /** Explicitly leave or rejoin an auto-layout parent's flowing children. */
    readonly absolute?: boolean;
}
/** One layer has one coordinate space; batch positions share the save transaction and undo. */
export interface DesignPositionOperation extends DesignPositionChanges {
    readonly op: typeof DesignOperationKind.Position;
    readonly id: string;
    readonly pageId: string;
}
/** A selected flowing child changes its sibling slot without leaving automatic layout. */
export interface DesignFlowReorder {
    readonly id: string;
    readonly index: number;
}
/** Rotates topmost selected layers together around a world pivot; omitted pivots use their combined bounds. */
export interface DesignRotateOperation {
    readonly op: typeof DesignOperationKind.Rotate;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly angle: number;
    readonly pivotX?: number;
    readonly pivotY?: number;
}
/** Uniform artwork scaling preserves text and effect metrics, unlike resizing a container. */
export interface DesignScaleOperation {
    readonly op: typeof DesignOperationKind.Scale;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly factor: number;
    readonly pivotX?: number;
    readonly pivotY?: number;
}
/** Move a selection from one original scene, optionally reordering selected flow children in the same edit. */
export interface DesignTranslateOperation {
    readonly op: typeof DesignOperationKind.Translate;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly dx: number;
    readonly dy: number;
    readonly reorders?: readonly DesignFlowReorder[];
}
/** Reparent or reorder without breaking both sides of the tree. */
export interface DesignMove {
    readonly op: typeof DesignOperationKind.Move;
    readonly id: string;
    readonly parentId: string | null;
    readonly pageId: string;
    readonly index: number;
}
/** Moves selected authored roots between containers while preserving their resolved world geometry natively. */
export interface DesignReparentOperation {
    readonly op: typeof DesignOperationKind.Reparent;
    readonly pageId: string;
    readonly selection: readonly string[];
    readonly parentId: string | null;
    readonly index: number;
    /** Optional world displacement applies after preserving the original geometry. */
    readonly dx?: number;
    /** Optional world displacement applies after preserving the original geometry. */
    readonly dy?: number;
    /** Defaults to true; false joins an automatic destination's flow instead of applying a displacement. */
    readonly absolute?: boolean;
}
/** Delete a subtree and its anchored comments and prototype links. */
export interface DesignRemove {
    readonly op: typeof DesignOperationKind.Remove;
    readonly id: string;
}
/** Create, rename or remove a page. Root lists are managed by tree operations. */
export interface DesignPageOperation {
    readonly op: typeof DesignOperationKind.Page;
    readonly id: string;
    readonly name: string | null;
    readonly background: string;
}
/** Sets one page guide by identity, or removes it with value:null. */
export interface DesignGuideOperation {
    readonly op: typeof DesignOperationKind.Guide;
    readonly pageId: string;
    readonly id: string;
    readonly value: DesignGuideValue | null;
}
/** Document properties and supporting design-system or collaboration records. */
export interface DesignMetadata {
    readonly op: typeof DesignOperationKind.Metadata;
    readonly name?: string;
    readonly tokens?: readonly DesignToken[];
    readonly interactions?: readonly DesignInteraction[];
    readonly comments?: readonly DesignComment[];
}
/** Omitted token properties keep their saved values. */
export interface DesignTokenChanges {
    readonly typography?: DesignTypographyOverrides | null;
    readonly name?: string;
    readonly value?: string;
    readonly category?: DesignTokenCategory;
}
/** Create or edit one token; null detaches its paints and deletes it without changing their appearance. */
export interface DesignTokenOperation {
    readonly op: typeof DesignOperationKind.Token;
    readonly id: string;
    readonly changes: DesignTokenChanges | null;
}
/** Existing fill and stroke colors share one compact native edit. */
export const DesignPaintColorTarget = { Fill: 'fill', Stroke: 'stroke' } as const;
/** Paint location. */
export type DesignPaintColorTarget =
    (typeof DesignPaintColorTarget)[keyof typeof DesignPaintColorTarget];
/** Omitted color properties retain the original paint; tokenId:null alone preserves its resolved color. */
export interface DesignPaintColorChanges {
    readonly color?: string;
    readonly tokenId?: string | null;
    readonly opacity?: number;
}
/** Fill index zero may create a first paint; stroke edits require an existing stroke and index zero. */
export interface DesignPaintColorOperation {
    readonly op: typeof DesignOperationKind.PaintColor;
    readonly id: string;
    readonly pageId: string;
    readonly target: DesignPaintColorTarget;
    readonly index: number;
    readonly changes: DesignPaintColorChanges;
}
/** Imported imagery and crop properties can be edited without resending any source or style records. */
export interface DesignPaintImageChanges {
    readonly tile?: import('./DesignImageTileTypes.js').DesignImageTile | null;
    /** Partial color edits retain other adjustments; null restores original image colors. */
    readonly adjustments?: Partial<DesignImageAdjustments> | null;
    readonly assetId?: string;
    readonly fit?: DesignImageFit;
    readonly cropX?: number;
    readonly cropY?: number;
    readonly scale?: number;
    readonly rotation?: number;
    readonly flipX?: boolean;
    readonly flipY?: boolean;
    readonly transform?: DesignImageTransform | null;
}
/** Page-scoped placement or framing of one image fill or existing stroke. */
export interface DesignPaintImageOperation {
    readonly op: typeof DesignOperationKind.PaintImage;
    readonly id: string;
    readonly pageId: string;
    readonly target: DesignPaintColorTarget;
    readonly index: number;
    readonly changes: DesignPaintImageChanges;
}
/** Linked source edits retain all other paint, layer and text properties. */
export interface DesignPaintPatternChanges extends Omit<DesignPaintImageChanges, 'assetId'> {
    readonly patternId?: string;
}
/** Revision-checked vector pattern framing shares the existing indexed paint authority. */
export interface DesignPaintPatternOperation {
    readonly op: typeof DesignOperationKind.PaintPattern;
    readonly id: string;
    readonly pageId: string;
    readonly target: DesignPaintColorTarget;
    readonly index: number;
    readonly changes: DesignPaintPatternChanges;
}
/** Geometry and stops are independent of source bodies and the rest of the paint stack. */
export interface DesignPaintGradientChanges {
    readonly kind?: DesignGradientKind;
    readonly angle?: number;
    readonly gradient?: DesignGradientTransformChanges | null;
    readonly stops?: readonly DesignGradientStop[];
}
/** Page-scoped native editing of one fill or stroke gradient. */
export interface DesignPaintGradientOperation {
    readonly op: typeof DesignOperationKind.PaintGradient;
    readonly id: string;
    readonly pageId: string;
    readonly target: DesignPaintColorTarget;
    readonly index: number;
    readonly changes: DesignPaintGradientChanges;
}
/** Omitted border properties retain their current values, including the paint. */
export interface DesignStrokeChanges {
    readonly width?: number;
    readonly dash?: readonly number[];
    readonly dashOffset?: number;
    readonly cap?: DesignStrokeCap;
    readonly join?: DesignStrokeJoin;
    readonly miterLimit?: number;
}
/** Null removes a border; nonempty changes create or edit one authored layer's border. */
export interface DesignStrokeOperation {
    readonly op: typeof DesignOperationKind.Stroke;
    readonly id: string;
    readonly pageId: string;
    readonly changes: DesignStrokeChanges | null;
}
/** Page-scoped native shape regeneration preserves other layers and checks locked ancestry. */
export interface DesignPolygonOperation {
    readonly op: typeof DesignOperationKind.Polygon;
    readonly id: string;
    readonly pageId: string;
    readonly changes: DesignPolygonSettings | null;
}
/** Page-scoped arc edits regenerate only the selected ellipse's bounded curve geometry. */
export interface DesignArcOperation {
    readonly op: typeof DesignOperationKind.Arc;
    readonly id: string;
    readonly pageId: string;
    readonly changes: DesignArcSettings | null;
}

/** Omitted radii retain their original authored values. */
export interface DesignCornerChanges {
    readonly topLeft?: number;
    readonly topRight?: number;
    readonly bottomRight?: number;
    readonly bottomLeft?: number;
}
/** Decoration changes retain all unrelated style fields; a supplied shadow array replaces only that stack. */
export interface DesignStyleChanges {
    /** Null removes the authored mode and restores legacy normal compositing. */
    readonly blendMode?: DesignBlendMode | null;
    /** Null removes the authored isolation override. */
    readonly isolation?: DesignIsolation | null;
    readonly blur?: number;
    readonly shadows?: readonly DesignShadow[];
    readonly corners?: DesignCornerChanges;
}
/** Compact decoration edits apply to an authored layer or a linked instance root. */
export interface DesignStyleOperation {
    readonly op: typeof DesignOperationKind.Style;
    readonly id: string;
    readonly pageId: string;
    readonly changes: DesignStyleChanges;
}
/** A transaction can contain different operation types. */
export type DesignOperation =
    | DesignInsert
    | DesignUpdate
    | DesignResizeOperation
    | DesignPositionOperation
    | DesignTranslateOperation
    | DesignRotateOperation
    | DesignScaleOperation
    | DesignLayoutOperation
    | DesignSizingOperation
    | DesignTypographyStyleOperation
    | DesignTypographyOperation
    | DesignTextStyleOperation
    | DesignTextOperation
    | DesignMove
    | DesignReparentOperation
    | DesignRemove
    | DesignGuideOperation
    | DesignPageOperation
    | DesignMetadata
    | DesignTokenOperation
    | DesignRecolorOperation
    | DesignPaintColorOperation
    | DesignPaintGradientOperation
    | DesignPaintImageOperation
    | DesignPaintPatternOperation
    | DesignStrokeOperation
    | DesignPolygonOperation
    | DesignArcOperation
    | DesignStyleOperation;
/** Before and after images provide conflict-safe undo and bounded deltas. */
export interface DesignEntityChange<T> {
    readonly id: string;
    readonly before: T | null;
    readonly after: T | null;
}
/** Supporting metadata is independent of scene entity changes. */
export interface DesignMetadataState {
    readonly name: string;
    readonly tokens: readonly DesignToken[];
    readonly interactions: readonly DesignInteraction[];
    readonly comments: readonly DesignComment[];
}
/** A commit records only touched entities, with exact preconditions. */
export interface DesignChangeSet {
    readonly nodes: readonly DesignEntityChange<DesignNode>[];
    readonly pages: readonly DesignEntityChange<DesignPage>[];
    readonly metadata: DesignEntityChange<DesignMetadataState> | null;
}
/** Result of an atomic scene transaction, prior to assigning its durable revision. */
export interface DesignEditResult {
    /** Native selection planners can publish their resulting selection without returning layer bodies. */
    readonly selection?: readonly string[];
    readonly document: DesignDocument;
    readonly changes: DesignChangeSet;
}
