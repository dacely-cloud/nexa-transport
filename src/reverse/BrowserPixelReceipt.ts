// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BrowserPixelComparison, BrowserPixelBounds } from '../protocol/Protocol.js';

export const BrowserPixelStatus = {
    Identical: 'identical',
    WithinThreshold: 'within-threshold',
    Different: 'different',
    DimensionMismatch: 'dimension-mismatch',
} as const;

/** Portable metrics validation narrows worker/archive receipts before internal use. */
export class BrowserPixelReceipt {
    /** Verifies status, decimal counters, exact arithmetic and a finite changed-pixel rectangle. */
    public static read(raw: unknown): BrowserPixelComparison {
        if (!this.#shape(raw)) {
            throw new TypeError('Invalid screenshot comparison metrics');
        }
        const a: number = raw.beforeWidth * raw.beforeHeight;
        const same: boolean =
            raw.beforeWidth === raw.afterWidth && raw.beforeHeight === raw.afterHeight;
        if (
            raw.algorithm !== 'rgba-channel-v1' ||
            !Object.values<string>(BrowserPixelStatus).includes(raw.status) ||
            ![raw.beforeWidth, raw.beforeHeight, raw.afterWidth, raw.afterHeight].every(
                (v: number): boolean => Number.isInteger(v) && v >= 1 && v <= 16384,
            ) ||
            a > 8388608 ||
            raw.afterWidth * raw.afterHeight > 8388608 ||
            !Number.isInteger(raw.channelThreshold) ||
            raw.channelThreshold < 0 ||
            raw.channelThreshold > 255 ||
            Object.keys(raw).some(
                (key: string): boolean =>
                    ![
                        'algorithm',
                        'beforeWidth',
                        'beforeHeight',
                        'afterWidth',
                        'afterHeight',
                        'channelThreshold',
                        'status',
                        'comparedPixels',
                        'changedPixels',
                        'changedRatio',
                        'absoluteChannelDelta',
                        'maximumChannelDelta',
                        'meanAbsoluteChannelDelta',
                        'bounds',
                    ].includes(key),
            )
        ) {
            throw new RangeError('Screenshot metrics exceed their contract');
        }
        if (!same) {
            if (
                raw.status !== BrowserPixelStatus.DimensionMismatch ||
                raw.comparedPixels !== '0' ||
                raw.changedPixels !== null ||
                raw.changedRatio !== null ||
                raw.absoluteChannelDelta !== null ||
                raw.maximumChannelDelta !== null ||
                raw.meanAbsoluteChannelDelta !== null ||
                raw.bounds !== null
            ) {
                throw new TypeError('Dimension mismatch contains fabricated pixel metrics');
            }
            return raw;
        }
        if (
            raw.status === BrowserPixelStatus.DimensionMismatch ||
            raw.comparedPixels !== String(a) ||
            raw.changedPixels === null ||
            raw.absoluteChannelDelta === null ||
            raw.maximumChannelDelta === null ||
            raw.meanAbsoluteChannelDelta === null ||
            raw.changedRatio === null ||
            !/^(?:0|[1-9][0-9]*)$/u.test(raw.changedPixels) ||
            !/^(?:0|[1-9][0-9]*)$/u.test(raw.absoluteChannelDelta) ||
            raw.changedPixels.length > 8 ||
            raw.absoluteChannelDelta.length > 11
        ) {
            throw new TypeError('Screenshot pixel counts changed');
        }
        const changed: bigint = BigInt(raw.changedPixels);
        const sum: bigint = BigInt(raw.absoluteChannelDelta);
        if (
            changed > BigInt(a) ||
            sum > BigInt(a) * 1020n ||
            raw.changedRatio !== Number(changed) / a ||
            !Number.isInteger(raw.maximumChannelDelta) ||
            raw.maximumChannelDelta < 0 ||
            raw.maximumChannelDelta > 255 ||
            raw.meanAbsoluteChannelDelta !== Number(sum) / (a * 4) ||
            sum < BigInt(raw.maximumChannelDelta) ||
            sum > BigInt(a) * 4n * BigInt(raw.maximumChannelDelta) ||
            (raw.maximumChannelDelta === 0) !== (sum === 0n) ||
            changed > 0n !== raw.maximumChannelDelta > raw.channelThreshold ||
            (raw.status === BrowserPixelStatus.Different) !== changed > 0n ||
            (raw.status === BrowserPixelStatus.Identical) !== (sum === 0n) ||
            (raw.status === BrowserPixelStatus.WithinThreshold) !== (changed === 0n && sum > 0n)
        ) {
            throw new TypeError('Screenshot metric arithmetic changed');
        }
        const bounds: BrowserPixelBounds | null = raw.bounds;
        if (changed === 0n) {
            if (bounds !== null) {
                throw new TypeError('Unchanged pixels have a fabricated rectangle');
            }
        } else if (
            bounds === null ||
            Object.keys(bounds).some(
                (key: string): boolean => !['x', 'y', 'width', 'height'].includes(key),
            ) ||
            ![bounds.x, bounds.y, bounds.width, bounds.height].every((v: number): boolean =>
                Number.isInteger(v),
            ) ||
            bounds.x < 0 ||
            bounds.y < 0 ||
            bounds.width < 1 ||
            bounds.height < 1 ||
            bounds.x + bounds.width > raw.beforeWidth ||
            bounds.y + bounds.height > raw.beforeHeight ||
            changed > BigInt(bounds.width * bounds.height)
        ) {
            throw new RangeError('Screenshot changed rectangle is invalid');
        }
        return raw;
    }
    static #shape(raw: unknown): raw is BrowserPixelComparison {
        if (typeof raw !== 'object' || raw === null) {
            return false;
        }
        return (
            'algorithm' in raw &&
            typeof raw.algorithm === 'string' &&
            'status' in raw &&
            typeof raw.status === 'string' &&
            'beforeWidth' in raw &&
            typeof raw.beforeWidth === 'number' &&
            'beforeHeight' in raw &&
            typeof raw.beforeHeight === 'number' &&
            'afterWidth' in raw &&
            typeof raw.afterWidth === 'number' &&
            'afterHeight' in raw &&
            typeof raw.afterHeight === 'number' &&
            'channelThreshold' in raw &&
            typeof raw.channelThreshold === 'number' &&
            'comparedPixels' in raw &&
            typeof raw.comparedPixels === 'string' &&
            'changedPixels' in raw &&
            (raw.changedPixels === null || typeof raw.changedPixels === 'string') &&
            'absoluteChannelDelta' in raw &&
            (raw.absoluteChannelDelta === null || typeof raw.absoluteChannelDelta === 'string') &&
            'changedRatio' in raw &&
            (raw.changedRatio === null || typeof raw.changedRatio === 'number') &&
            'maximumChannelDelta' in raw &&
            (raw.maximumChannelDelta === null || typeof raw.maximumChannelDelta === 'number') &&
            'meanAbsoluteChannelDelta' in raw &&
            (raw.meanAbsoluteChannelDelta === null ||
                typeof raw.meanAbsoluteChannelDelta === 'number') &&
            'bounds' in raw &&
            (raw.bounds === null ||
                (typeof raw.bounds === 'object' &&
                    'x' in raw.bounds &&
                    typeof raw.bounds.x === 'number' &&
                    'y' in raw.bounds &&
                    typeof raw.bounds.y === 'number' &&
                    'width' in raw.bounds &&
                    typeof raw.bounds.width === 'number' &&
                    'height' in raw.bounds &&
                    typeof raw.bounds.height === 'number'))
        );
    }
}
