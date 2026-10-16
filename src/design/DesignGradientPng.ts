// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { zlibSync } from 'fflate';
import { DesignGradientSampling } from './DesignGradientSampling.js';
import type { DesignPaint } from './DesignTypes.js';
import type { DesignGradientViewport } from './DesignGradientTypes.js';

/** SVG has no angular or diamond primitive; only the paint is embedded, preserving vector shapes and text. */
export class DesignGradientPng {
    /** Explicit raster bounds; exports retain at least one pixel per design unit. */
    public static readonly maximumEdge: number = 4096;
    public static readonly maximumPixels: number = 4 * 1024 * 1024;

    /** No canvas, DOM, filesystem or Node-only APIs are required by the portable exporter. */
    public static encode(
        paint: DesignPaint,
        width: number,
        height: number,
        viewport: DesignGradientViewport = { x: 0, y: 0, width: 1, height: 1 },
    ): string {
        this.dimensions(width, height);
        return this.#encode(paint, width, height, viewport);
    }

    /** Allocation planners use the same limits without creating pixel buffers or compressed output. */
    public static dimensions(width: number, height: number): void {
        if (
            !Number.isInteger(width) ||
            !Number.isInteger(height) ||
            width < 1 ||
            height < 1 ||
            width > this.maximumEdge ||
            height > this.maximumEdge ||
            width * height > this.maximumPixels
        ) {
            throw new Error(
                'Angular and diamond SVG paint exports require at most 4096 pixels per edge and 4 megapixels per paint.',
            );
        }
    }

    static #encode(
        paint: DesignPaint,
        width: number,
        height: number,
        viewport: DesignGradientViewport,
    ): string {
        const stride: number = width * 4 + 1;
        const pixels: Uint8Array = new Uint8Array(stride * height);
        const sample: DesignGradientSampling = new DesignGradientSampling(paint);
        for (let y: number = 0; y < height; y++) {
            const start: number = y * stride;
            pixels[start] = 1;
            for (let x: number = 0; x < width; x++) {
                sample.write(
                    sample.position(
                        viewport.x + ((x + 0.5) / width) * viewport.width,
                        viewport.y + ((y + 0.5) / height) * viewport.height,
                    ),
                    pixels,
                    start + 1 + x * 4,
                );
            }
            // PNG Sub filtering compresses smooth color transitions without changing any channel.
            for (let index: number = stride - 1; index >= 5; index--) {
                pixels[start + index] =
                    (pixels[start + index] ?? 0) - (pixels[start + index - 4] ?? 0);
            }
        }
        const header: Uint8Array = new Uint8Array(13);
        const fields: DataView = new DataView(header.buffer);
        fields.setUint32(0, width);
        fields.setUint32(4, height);
        header[8] = 8;
        header[9] = 6;
        const chunks: readonly Uint8Array[] = [
            new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
            this.#chunk('IHDR', header),
            this.#chunk('IDAT', zlibSync(pixels, { level: 6 })),
            this.#chunk('IEND', new Uint8Array()),
        ];
        const result: Uint8Array = new Uint8Array(
            chunks.reduce((sum: number, part: Uint8Array): number => sum + part.length, 0),
        );
        let offset: number = 0;
        for (const part of chunks) {
            result.set(part, offset);
            offset += part.length;
        }
        let binary: string = '';
        for (let index: number = 0; index < result.length; index += 8192) {
            binary += String.fromCharCode(...result.subarray(index, index + 8192));
        }
        return btoa(binary);
    }

    static #chunk(name: string, data: Uint8Array): Uint8Array {
        const chunk: Uint8Array = new Uint8Array(data.length + 12);
        const fields: DataView = new DataView(chunk.buffer);
        fields.setUint32(0, data.length);
        for (let index: number = 0; index < 4; index++) {
            chunk[index + 4] = name.charCodeAt(index);
        }
        chunk.set(data, 8);
        let crc: number = 0xffffffff;
        for (let index: number = 4; index < chunk.length - 4; index++) {
            crc ^= chunk[index] ?? 0;
            for (let bit: number = 0; bit < 8; bit++) {
                crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
            }
        }
        fields.setUint32(chunk.length - 4, (crc ^ 0xffffffff) >>> 0);
        return chunk;
    }
}
