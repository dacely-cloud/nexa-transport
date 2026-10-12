// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignViewRequest, DesignViewPage } from './DesignViewTypes.js';
import type { DesignSize } from './DesignLayoutTypes.js';

/** Canvas records retain active typography metadata while explicitly deferring large text bodies. */
export interface DesignCanvasPage extends DesignViewPage {
    readonly textDeferredIds: readonly string[];
}

/** Intrinsic measurements are pinned to an expanded occurrence and its actual available width. */
export interface DesignCanvasMetric extends DesignSize {
    readonly occurrenceId: string;
    readonly maximumWidth: number;
    readonly streamed: boolean;
}

/** Metric pagination uses the same primary page and explicitly hydrated forests as the canvas records. */
export interface DesignCanvasMetricsRequest {
    readonly id: string;
    readonly revision: string;
    readonly pageId: string | null;
    readonly includeIds: readonly string[];
    readonly offset: number;
    readonly limit: number;
}

/** No text body is necessary to reproduce saved wrapping and automatic-layout bounds. */
export interface DesignCanvasMetricsPage {
    readonly id: string;
    readonly revision: string;
    readonly pageId: string;
    readonly entries: readonly DesignCanvasMetric[];
    readonly nextOffset: number | null;
}

/** Independently advertised canvas records allow complete-read fallback on older workspaces. */
export interface DesignCanvasMethod {
    readonly params: DesignViewRequest;
    readonly result: DesignCanvasPage;
}

/** Metric reads retain the exact canvas revision across continuations. */
export interface DesignCanvasMetricsMethod {
    readonly params: DesignCanvasMetricsRequest;
    readonly result: DesignCanvasMetricsPage;
}
