// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReverseBrowserReference } from '../protocol/Protocol.js';

/** Portable boundary primitives build typed storage-comparison receipts without assertions or secret fields. */
export class BrowserStorageComparisonValues {
    /** Rejects arrays and missing or additional properties before reading an external object. */
    public static record(raw: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
        if (!this.#record(raw)) {
            throw new TypeError('Invalid storage comparison record');
        }
        const value: Readonly<Record<string, unknown>> = raw;
        if (
            Object.keys(value).length !== keys.length ||
            !keys.every((key: string): boolean => Object.hasOwn(value, key))
        ) {
            throw new TypeError('Unexpected storage comparison fields');
        }
        return value;
    }
    /** Text bounds apply before the value enters an internal interface. */
    public static text(raw: unknown, maximum: number): string {
        if (typeof raw !== 'string' || raw.length > maximum) {
            throw new TypeError('Invalid storage comparison text');
        }
        return raw;
    }
    /** Canonical finite decimal counters cannot conceal precision loss or hostile allocation sizes. */
    public static count(raw: unknown, maximum: bigint = 40000n): string {
        const value: string = this.text(raw, 5);
        if (!/^(?:0|[1-9][0-9]*)$/u.test(value) || BigInt(value) > maximum) {
            throw new TypeError('Invalid storage comparison count');
        }
        return value;
    }
    /** Booleans never use coercion at the archive or transport boundary. */
    public static flag(raw: unknown): boolean {
        if (typeof raw !== 'boolean') {
            throw new TypeError('Invalid storage comparison flag');
        }
        return raw;
    }
    /** Only named finite runtime constants can enter closed comparison modes and outcomes. */
    public static selection<T extends string>(raw: unknown, allowed: readonly T[]): T {
        const value: T | undefined = allowed.find((entry: T): boolean => entry === raw);
        if (value === undefined) {
            throw new TypeError('Invalid storage comparison selection');
        }
        return value;
    }
    /** Hashes always identify complete original UTF-8 artifacts independently from source descriptors. */
    public static sha(raw: unknown): string {
        const value: string = this.text(raw, 64);
        if (!/^[a-f0-9]{64}$/u.test(value)) {
            throw new TypeError('Invalid storage comparison hash');
        }
        return value;
    }
    /** IDs never admit workspace paths or arbitrary database selectors. */
    public static uuid(raw: unknown): string {
        const value: string = this.text(raw, 36);
        if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u.test(value)) {
            throw new TypeError('Invalid storage comparison id');
        }
        return value;
    }
    /** A reference contains only the trusted conversation and immutable capture provenance. */
    public static reference(raw: unknown): ReverseBrowserReference {
        const value: Readonly<Record<string, unknown>> = this.record(raw, [
            'sessionId',
            'runId',
            'evidenceId',
            'captureSha256',
        ]);
        const sessionId: string = this.text(value.sessionId, 1024);
        if (sessionId.length === 0) {
            throw new TypeError('Missing storage comparison conversation');
        }
        return {
            sessionId,
            runId: this.uuid(value.runId),
            evidenceId: this.uuid(value.evidenceId),
            captureSha256: this.sha(value.captureSha256),
        };
    }
    static #record(raw: unknown): raw is Readonly<Record<string, unknown>> {
        return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
    }
}
