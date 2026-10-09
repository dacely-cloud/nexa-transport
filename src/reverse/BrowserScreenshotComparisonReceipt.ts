// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    BrowserScreenshotComparisonSnapshot,
    BrowserScreenshotComparisonSource,
} from '../protocol/Protocol.js';
import { BrowserPixelReceipt } from './BrowserPixelReceipt.js';
import { BrowserScreenshotReceipt } from './BrowserScreenshotReceipt.js';

/** Portable comparison provenance and exact arithmetic validation keep image bodies out of progress. */
export class BrowserScreenshotComparisonReceipt {
    /** Validates both source receipts and the separate durable comparison evidence identity. */
    public static snapshot(
        value: BrowserScreenshotComparisonSnapshot,
        runId: string,
        sessionId?: string,
    ): void {
        if (
            Object.keys(value).some(
                (key: string): boolean =>
                    !['before', 'after', 'metrics', 'reference'].includes(key),
            ) ||
            JSON.stringify(value).length > 24000
        )
            {throw new Error('Screenshot comparison exceeds its metadata contract');}
        this.#source(value.before, value.reference.sessionId);
        this.#source(value.after, value.reference.sessionId);
        BrowserPixelReceipt.read(value.metrics);
        const receipt: BrowserScreenshotComparisonSource = value.before;
        BrowserScreenshotReceipt.snapshot(
            { ...receipt.metadata, reference: value.reference },
            runId,
            sessionId,
        );
        if (
            value.metrics.beforeWidth !== value.before.metadata.width ||
            value.metrics.beforeHeight !== value.before.metadata.height ||
            value.metrics.afterWidth !== value.after.metadata.width ||
            value.metrics.afterHeight !== value.after.metadata.height
        )
            {throw new Error('Comparison metrics left their source dimensions');}
    }
    static #source(value: BrowserScreenshotComparisonSource, sessionId: string): void {
        if (
            Object.keys(value).some(
                (key: string): boolean => !['reference', 'sha256', 'metadata'].includes(key),
            ) ||
            !/^[a-f0-9]{64}$/u.test(value.sha256)
        )
            {throw new Error('Invalid comparison source identity');}
        BrowserScreenshotReceipt.snapshot(
            { ...value.metadata, reference: value.reference },
            value.reference.runId,
            sessionId,
        );
    }
}
