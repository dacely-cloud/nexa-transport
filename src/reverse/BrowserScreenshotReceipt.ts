// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    BrowserScreenshotPage,
    BrowserScreenshotMetadata,
    BrowserScreenshotSnapshot,
    BrowserScreenshotViewport,
    ReverseBrowserReference,
} from '../protocol/Protocol.js';
import { reverseBrowserScreenshot } from '../protocol/Validators.js';

type ScreenshotFields =
    | BrowserScreenshotPage
    | BrowserScreenshotMetadata
    | BrowserScreenshotSnapshot
    | BrowserScreenshotViewport
    | ReverseBrowserReference;
/** Portable PNG receipt checks keep pixel data out of unsolicited metadata and progress. */
export class BrowserScreenshotReceipt {
    /** Validates archive provenance, finite image size and exact selected byte-page continuity. */
    public static read(input: unknown): BrowserScreenshotPage {
        if (!reverseBrowserScreenshot(input)) {
            throw new TypeError('Invalid saved screenshot page');
        }
        this.#keys(input, [
            'runId',
            'sha256',
            'evidenceId',
            'captureSha256',
            'metadata',
            'view',
            'cursor',
            'nextCursor',
            'data',
        ]);
        this.#metadata(input.metadata);
        if (
            !this.#uuid(input.runId) ||
            !this.#uuid(input.evidenceId) ||
            !this.#hash(input.sha256) ||
            !this.#hash(input.captureSha256) ||
            !this.#count(input.cursor, 4194304n) ||
            JSON.stringify(input).length > 75000
        ) {
            throw new RangeError('Invalid screenshot page identity or budget');
        }
        const cursor: bigint = BigInt(input.cursor);
        const total: bigint = BigInt(input.metadata.bytes);
        if (input.view === 'metadata') {
            if (cursor !== 0n || input.nextCursor !== null || input.data !== null) {
                throw new TypeError('Screenshot metadata contains image data');
            }
        } else {
            if (
                input.data === null ||
                input.data.length > 65536 ||
                input.data.length % 4 !== 0 ||
                !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(
                    input.data,
                ) ||
                btoa(atob(input.data)) !== input.data
            ) {
                throw new TypeError('Invalid screenshot image page encoding');
            }
            const length: bigint = BigInt(atob(input.data).length);
            const expected: bigint = total - cursor > 49152n ? 49152n : total - cursor;
            if (
                cursor > total ||
                length !== expected ||
                input.nextCursor !== (cursor + length < total ? String(cursor + length) : null)
            ) {
                throw new RangeError('Screenshot image page continuity changed');
            }
        }
        return input;
    }
    /** A native progress snapshot cannot contain pixels or foreign archive references. */
    public static snapshot(
        value: BrowserScreenshotSnapshot,
        runId: string,
        sessionId?: string,
    ): void {
        this.#metadata(value, true);
        this.#keys(value.reference, ['sessionId', 'runId', 'evidenceId', 'captureSha256']);
        if (
            value.reference.runId !== runId ||
            !this.#uuid(value.reference.runId) ||
            !this.#uuid(value.reference.evidenceId) ||
            !this.#hash(value.reference.captureSha256) ||
            value.reference.sessionId.length === 0 ||
            value.reference.sessionId.length > 1024 ||
            (sessionId !== undefined && value.reference.sessionId !== sessionId)
        ) {
            throw new TypeError('Screenshot left its original investigation');
        }
    }
    static #metadata(value: BrowserScreenshotMetadata, snapshot: boolean = false): void {
        this.#keys(value, [
            'provider',
            'targetId',
            'frameId',
            'origin',
            'capturedAt',
            'mimeType',
            'sha256',
            'bytes',
            'width',
            'height',
            'viewport',
            'coverage',
            ...(snapshot ? ['reference'] : []),
        ]);
        this.#keys(value.viewport, ['pageX', 'pageY', 'width', 'height', 'scale']);
        const origin: URL = new URL(value.origin);
        const time: number = Date.parse(value.capturedAt);
        if (
            value.provider !== 'cdp-passive' ||
            value.mimeType !== 'image/png' ||
            value.coverage !== 'visible-viewport' ||
            value.targetId.length === 0 ||
            value.targetId.length > 256 ||
            !value.targetId.isWellFormed() ||
            value.frameId.length === 0 ||
            value.frameId.length > 256 ||
            !value.frameId.isWellFormed() ||
            !['http:', 'https:'].includes(origin.protocol) ||
            origin.origin !== value.origin ||
            value.origin.length > 4096 ||
            value.capturedAt.length !== 24 ||
            !Number.isFinite(time) ||
            new Date(time).toISOString() !== value.capturedAt ||
            !this.#hash(value.sha256) ||
            !this.#count(value.bytes, 4194304n) ||
            BigInt(value.bytes) < 57n ||
            !Number.isInteger(value.width) ||
            !Number.isInteger(value.height) ||
            !this.#number(value.width, 1, 16384) ||
            !this.#number(value.height, 1, 16384) ||
            value.width * value.height > 8388608
        ) {
            throw new RangeError('Invalid screenshot metadata');
        }
        const viewport: BrowserScreenshotViewport = value.viewport;
        if (
            !this.#number(viewport.pageX, 0, 1000000000) ||
            !this.#number(viewport.pageY, 0, 1000000000) ||
            !this.#number(viewport.width, 1, 16384) ||
            !this.#number(viewport.height, 1, 16384) ||
            !this.#number(viewport.scale, 0.01, 100) ||
            viewport.width * viewport.height > 8388608
        ) {
            throw new RangeError('Invalid screenshot viewport');
        }
    }
    static #number(value: number, minimum: number, maximum: number): boolean {
        return Number.isFinite(value) && value >= minimum && value <= maximum;
    }
    static #keys(value: ScreenshotFields, fields: readonly string[]): void {
        if (Object.keys(value).some((field: string): boolean => !fields.includes(field))) {
            throw new TypeError('Undeclared screenshot field');
        }
    }
    static #hash(value: string): boolean {
        return /^[a-f0-9]{64}$/u.test(value);
    }
    static #uuid(value: string): boolean {
        return /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u.test(value);
    }
    static #count(value: string, maximum: bigint): boolean {
        return /^(?:0|[1-9][0-9]*)$/u.test(value) && BigInt(value) <= maximum;
    }
}
