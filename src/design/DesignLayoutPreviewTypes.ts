// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignPreviewOperation } from './DesignOperationTypes.js';
import type { DesignViewRequest } from './DesignViewTypes.js';
import type {
    DesignCanvasPage,
    DesignCanvasMetricsRequest,
    DesignCanvasMetricsPage,
} from './DesignCanvasTypes.js';
import type { DesignTextWindowRequest, DesignTextWindowPage } from './DesignTextWindowTypes.js';

/** Preview transfers reuse the existing bounded canvas, metric and glyph formats. */
export const DesignLayoutPreviewAction = {
    Canvas: 'canvas',
    Metrics: 'metrics',
    Text: 'text',
} as const;
/** Each query has one exact result format. */
export type DesignLayoutPreviewAction =
    (typeof DesignLayoutPreviewAction)[keyof typeof DesignLayoutPreviewAction];
/** A canonical, owner/revision-qualified key pins continuations to one read-only draft. */
export interface DesignLayoutPreviewBase {
    readonly operation: DesignPreviewOperation;
    readonly key: string | null;
}
/** Canvas records never ask for explicit source-body hydration. */
export interface DesignLayoutPreviewCanvasRequest extends DesignLayoutPreviewBase {
    readonly action: typeof DesignLayoutPreviewAction.Canvas;
    readonly params: DesignViewRequest;
}
/** Width-specific native metrics are paged independently of the source text. */
export interface DesignLayoutPreviewMetricsRequest extends DesignLayoutPreviewBase {
    readonly action: typeof DesignLayoutPreviewAction.Metrics;
    readonly params: DesignCanvasMetricsRequest;
}
/** Only the visible glyph rectangle is transferred for the projected paragraph. */
export interface DesignLayoutPreviewTextRequest extends DesignLayoutPreviewBase {
    readonly action: typeof DesignLayoutPreviewAction.Text;
    readonly params: DesignTextWindowRequest;
}
/** A preview cannot contain arbitrary scene replacement operations. */
export type DesignLayoutPreviewRequest =
    | DesignLayoutPreviewCanvasRequest
    | DesignLayoutPreviewMetricsRequest
    | DesignLayoutPreviewTextRequest;
/** Paged, body-free draft records carry their checked projection identity. */
export interface DesignLayoutPreviewCanvasResult {
    readonly action: typeof DesignLayoutPreviewAction.Canvas;
    readonly key: string;
    readonly page: DesignCanvasPage;
}
/** Native wrapping remains exact at the preview's requested width. */
export interface DesignLayoutPreviewMetricsResult {
    readonly action: typeof DesignLayoutPreviewAction.Metrics;
    readonly key: string;
    readonly page: DesignCanvasMetricsPage;
}
/** Draft glyph IDs and positions refer to the same public or admitted private fonts as the saved canvas. */
export interface DesignLayoutPreviewTextResult {
    readonly action: typeof DesignLayoutPreviewAction.Text;
    readonly key: string;
    readonly page: DesignTextWindowPage;
}
/** The caller verifies the action and projection key before consuming a reply. */
export type DesignLayoutPreviewResult =
    | DesignLayoutPreviewCanvasResult
    | DesignLayoutPreviewMetricsResult
    | DesignLayoutPreviewTextResult;
/** Read-only preview support is advertised independently for older workspaces. */
export interface DesignLayoutPreviewMethod {
    readonly params: DesignLayoutPreviewRequest;
    readonly result: DesignLayoutPreviewResult;
}
