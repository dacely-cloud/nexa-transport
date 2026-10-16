// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignGradientPng } from './DesignGradientPng.js';

/** Integer sampling dimensions remain bounded independently of authored frame dimensions. */
export interface DesignSvgGradientSize {
    readonly width: number;
    readonly height: number;
}

/** Reserves ordinary sampling before offering denser text paints, preserving previously admissible exports. */
export class DesignSvgGradientBudget {
    readonly #minimum: Map<string, bigint> = new Map();
    readonly #dense: Set<string> = new Set();
    #remaining: bigint = 0n;
    #pixels: number = 0;
    /** Shared embedding limit remains 16 × 1024 × 1024 pixels per document. */
    public static readonly maximumPixels: number = 16 * 1024 * 1024;

    /** Duplicate identities reserve once; text and vector uses can share one denser paint definition. */
    public reserve(key: string, width: number, height: number, density: number): void {
        if (!this.#minimum.has(key)) {
            const pixels: bigint = BigInt(Math.ceil(width)) * BigInt(Math.ceil(height));
            this.#minimum.set(key, pixels);
            this.#remaining += pixels;
        }
        if (density > 1) {
            this.#dense.add(key);
        }
    }

    /** Each emitted paint is allocated once, retaining the four-megapixel paint and sixteen-megapixel document limits. */
    public allocate(
        key: string,
        width: number,
        height: number,
        density: number,
    ): DesignSvgGradientSize {
        const remaining: bigint = this.#remaining - (this.#minimum.get(key) ?? 0n);
        const denseWidth: number = Math.ceil(width * 2);
        const denseHeight: number = Math.ceil(height * 2);
        const scale: number =
            (density > 1 || this.#dense.has(key)) &&
            denseWidth <= DesignGradientPng.maximumEdge &&
            denseHeight <= DesignGradientPng.maximumEdge &&
            denseWidth * denseHeight <= DesignGradientPng.maximumPixels &&
            BigInt(this.#pixels + denseWidth * denseHeight) + remaining <=
                BigInt(DesignSvgGradientBudget.maximumPixels)
                ? 2
                : 1;
        const result: DesignSvgGradientSize = {
            width: Math.ceil(width * scale),
            height: Math.ceil(height * scale),
        };
        if (this.#pixels + result.width * result.height > DesignSvgGradientBudget.maximumPixels) {
            throw new Error(
                'Angular and diamond SVG paint exports exceed the 16 megapixel document budget.',
            );
        }
        DesignGradientPng.dimensions(result.width, result.height);
        this.#pixels += result.width * result.height;
        this.#remaining = remaining;
        this.#minimum.delete(key);
        return result;
    }
}
