// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    BrowserStorageMetadata,
    BrowserStorageCoverage,
    BrowserStorageQuota,
    BrowserStorageRow,
    BrowserStoragePage,
} from '../protocol/Protocol.js';

/** Native storage enumeration. */
export const BrowserStorageGroup = {
    Local: 'local-storage',
    Session: 'session-storage',
    Cookies: 'cookies',
    IndexedDb: 'indexed-db',
    Cache: 'cache-storage',
} as const;
/** Native storage selection type. */
export type BrowserStorageGroup = (typeof BrowserStorageGroup)[keyof typeof BrowserStorageGroup];

/** Native storage enumeration. */
export const BrowserStorageKind = {
    Name: 'name',
    Value: 'value',
    Schema: 'schema',
    Record: 'record',
    CacheEntry: 'cache-entry',
} as const;
/** Native storage selection type. */
export type BrowserStorageKind = (typeof BrowserStorageKind)[keyof typeof BrowserStorageKind];

/** Host captures remain separate from paged wire responses. */
export interface BrowserStorageCapture {
    readonly metadata: BrowserStorageMetadata;
    readonly rows: readonly BrowserStorageRow[];
}

/** Portable validation keeps saved storage receipts value-free and coverage claims internally consistent. */
export class BrowserStorageReceipt {
    /** Canonical header identity ignores object insertion order while retaining every declared provenance and coverage field. */
    public static identity(value: BrowserStorageMetadata): string {
        const metadata: BrowserStorageMetadata = this.metadata(value);
        return JSON.stringify([
            metadata.provider,
            metadata.targetId,
            metadata.frameId,
            metadata.url,
            metadata.origin,
            metadata.capturedAt,
            metadata.includeNames,
            metadata.includeFingerprints,
            metadata.valuesRedacted,
            metadata.fingerprintAlgorithm,
            metadata.fingerprintsComplete,
            [metadata.quota.available, metadata.quota.usageBytes, metadata.quota.quotaBytes],
            Object.values(BrowserStorageGroup).map(
                (group: BrowserStorageGroup): readonly (string | boolean)[] => {
                    const scope: BrowserStorageCoverage = metadata.coverage[group];
                    return [
                        group,
                        scope.selected,
                        scope.available,
                        scope.complete,
                        scope.rows,
                        scope.omitted,
                        scope.changedDuringCapture,
                    ];
                },
            ),
            metadata.limitations,
        ]);
    }
    /** Narrows an external header before archive, transport or UI code can use it. */
    public static metadata(raw: unknown): BrowserStorageMetadata {
        if (!this.#metadata(raw)) {
            throw new TypeError('Invalid browser storage metadata');
        }
        const origin: URL = new URL(raw.origin);
        const url: URL = new URL(raw.url);
        if (
            !['http:', 'https:'].includes(origin.protocol) ||
            origin.origin !== raw.origin ||
            url.origin !== raw.origin ||
            url.username !== '' ||
            url.password !== '' ||
            !raw.targetId ||
            raw.targetId.length > 256 ||
            !raw.frameId ||
            raw.frameId.length > 128 ||
            raw.url.length > 4096 ||
            raw.origin.length > 4096 ||
            new Date(raw.capturedAt).toISOString() !== raw.capturedAt ||
            raw.limitations.length > 8 ||
            raw.limitations.some((value: string): boolean => value.length > 512) ||
            JSON.stringify(raw).length > 24000
        ) {
            throw new RangeError('Browser storage metadata exceeds its contract');
        }
        if (
            raw.quota.available
                ? raw.quota.usageBytes === null || raw.quota.quotaBytes === null
                : raw.quota.usageBytes !== null || raw.quota.quotaBytes !== null
        ) {
            throw new TypeError('Browser storage quota availability changed');
        }
        for (const value of [raw.quota.usageBytes, raw.quota.quotaBytes]) {
            if (
                value !== null &&
                (!this.#decimal(value, 16) || BigInt(value) > BigInt(Number.MAX_SAFE_INTEGER))
            ) {
                throw new TypeError('Invalid browser storage byte count');
            }
        }
        let total: bigint = 0n;
        for (const group of Object.values(BrowserStorageGroup)) {
            const scope: BrowserStorageCoverage = raw.coverage[group];
            const selected: boolean =
                group === BrowserStorageGroup.Cookies
                    ? raw.includeFingerprints
                    : raw.includeNames || raw.includeFingerprints;
            if (
                scope.selected !== selected ||
                !this.#decimal(scope.rows, 5) ||
                !this.#decimal(scope.omitted, 7) ||
                BigInt(scope.rows) > 20000n ||
                (!selected &&
                    (scope.available ||
                        scope.complete ||
                        scope.changedDuringCapture ||
                        scope.rows !== '0' ||
                        scope.omitted !== '0')) ||
                ((!scope.available || scope.changedDuringCapture || scope.omitted !== '0') &&
                    scope.complete)
            ) {
                throw new TypeError('Browser storage coverage changed');
            }
            total += BigInt(scope.rows);
        }
        if (
            total > 20000n ||
            raw.fingerprintsComplete !==
                (raw.includeFingerprints &&
                    Object.values(raw.coverage).every(
                        (scope: BrowserStorageCoverage): boolean =>
                            scope.selected && scope.available && scope.complete,
                    ))
        ) {
            throw new TypeError('Browser storage fingerprint completeness changed');
        }
        return raw;
    }
    /** Each row has an explicit storage authority and kind, and never contains original values. */
    public static row(raw: unknown, metadata: BrowserStorageMetadata): BrowserStorageRow {
        if (!this.#row(raw)) {
            throw new TypeError('Invalid browser storage row');
        }
        const prefix: string = raw.group + ':';
        const ordinal: string = raw.id.slice(prefix.length);
        const scope: BrowserStorageCoverage = metadata.coverage[raw.group];
        const kinds: readonly BrowserStorageKind[] =
            raw.group === BrowserStorageGroup.IndexedDb
                ? [BrowserStorageKind.Name, BrowserStorageKind.Schema, BrowserStorageKind.Record]
                : raw.group === BrowserStorageGroup.Cache
                  ? [BrowserStorageKind.Name, BrowserStorageKind.CacheEntry]
                  : [BrowserStorageKind.Value];
        if (
            !scope.selected ||
            (!raw.complete && scope.complete) ||
            !raw.id.startsWith(prefix) ||
            !this.#decimal(ordinal, 5) ||
            BigInt(ordinal) >= BigInt(scope.rows) ||
            !kinds.includes(raw.kind) ||
            (raw.name !== null &&
                (!metadata.includeNames || JSON.stringify(raw.name).length > 4096)) ||
            (!metadata.includeNames && raw.name !== null) ||
            (metadata.includeNames && raw.name === null && raw.complete) ||
            (metadata.includeFingerprints
                ? !this.#sha(raw.identitySha256) ||
                  (raw.valueSha256 === null ? raw.complete : !this.#sha(raw.valueSha256))
                : raw.identitySha256 !== null || raw.valueSha256 !== null) ||
            (!metadata.includeFingerprints &&
                [
                    BrowserStorageKind.Schema,
                    BrowserStorageKind.Record,
                    BrowserStorageKind.CacheEntry,
                ].some((kind: BrowserStorageKind): boolean => kind === raw.kind))
        ) {
            throw new TypeError('Browser storage row exceeds its selected coverage');
        }
        return raw;
    }
    /** Captures have exact per-group ordinals and counters before indexed publication. */
    public static capture(raw: unknown): BrowserStorageCapture {
        if (
            !this.#record(raw) ||
            !this.#keys(raw, ['metadata', 'rows']) ||
            !Array.isArray(raw.rows)
        ) {
            throw new TypeError('Invalid browser storage capture');
        }
        const metadata: BrowserStorageMetadata = this.metadata(raw.metadata);
        const entries: readonly unknown[] = raw.rows;
        if (entries.length > 20000 || JSON.stringify(raw).length > 4194304) {
            throw new RangeError('Browser storage capture exceeds its bound');
        }
        const counts: Map<BrowserStorageGroup, bigint> = new Map<BrowserStorageGroup, bigint>();
        const rows: BrowserStorageRow[] = entries.map((entry: unknown): BrowserStorageRow => {
            const row: BrowserStorageRow = this.row(entry, metadata);
            const ordinal: bigint = counts.get(row.group) ?? 0n;
            if (row.id !== row.group + ':' + ordinal.toString()) {
                throw new TypeError('Browser storage ordinal changed');
            }
            counts.set(row.group, ordinal + 1n);
            if (!row.complete && metadata.coverage[row.group].complete) {
                throw new TypeError('Incomplete browser storage row claims complete coverage');
            }
            return row;
        });
        for (const group of Object.values(BrowserStorageGroup)) {
            if ((counts.get(group) ?? 0n).toString() !== metadata.coverage[group].rows) {
                throw new TypeError('Browser storage row count changed');
            }
        }
        return { metadata, rows };
    }
    /** Saved pages contain only selected consecutive rows within a finite serialized response. */
    public static page(value: BrowserStoragePage): void {
        const metadata: BrowserStorageMetadata = this.metadata(value.metadata);
        if (
            !this.#sha(value.sha256) ||
            !this.#sha(value.captureSha256) ||
            !this.#uuid(value.runId) ||
            !this.#uuid(value.evidenceId) ||
            !this.#decimal(value.cursor, 5) ||
            value.rows.length > 20 ||
            JSON.stringify(value).length > 32000
        ) {
            throw new TypeError('Browser storage page exceeds its contract');
        }
        const cursor: bigint = BigInt(value.cursor);
        if (value.group === null) {
            if (cursor !== 0n || value.rows.length !== 0 || value.nextCursor !== null) {
                throw new TypeError('Browser storage metadata read contains rows');
            }
            return;
        }
        if (!this.#group(value.group)) {
            throw new TypeError('Invalid browser storage page group');
        }
        const total: bigint = BigInt(metadata.coverage[value.group].rows);
        if (cursor > total) {
            throw new TypeError('Browser storage page cursor exceeds inventory');
        }
        for (let index: number = 0; index < value.rows.length; index++) {
            const row: BrowserStorageRow = this.row(value.rows[index], metadata);
            if (row.id !== value.group + ':' + (cursor + BigInt(index)).toString()) {
                throw new TypeError('Browser storage page ordinal changed');
            }
        }
        const next: bigint = cursor + BigInt(value.rows.length);
        if (
            next > total ||
            value.nextCursor !== (next < total ? next.toString() : null) ||
            (next < total && value.rows.length === 0)
        ) {
            throw new TypeError('Browser storage page did not advance');
        }
    }
    static #metadata(raw: unknown): raw is BrowserStorageMetadata {
        return (
            this.#record(raw) &&
            this.#keys(raw, [
                'provider',
                'targetId',
                'frameId',
                'url',
                'origin',
                'capturedAt',
                'includeNames',
                'includeFingerprints',
                'valuesRedacted',
                'fingerprintAlgorithm',
                'fingerprintsComplete',
                'quota',
                'coverage',
                'limitations',
            ]) &&
            raw.provider === 'cdp-passive' &&
            typeof raw.targetId === 'string' &&
            typeof raw.frameId === 'string' &&
            typeof raw.url === 'string' &&
            typeof raw.origin === 'string' &&
            typeof raw.capturedAt === 'string' &&
            typeof raw.includeNames === 'boolean' &&
            typeof raw.includeFingerprints === 'boolean' &&
            raw.valuesRedacted === true &&
            raw.fingerprintAlgorithm === 'sha256-canonical-json-v1' &&
            typeof raw.fingerprintsComplete === 'boolean' &&
            this.#quota(raw.quota) &&
            this.#record(raw.coverage) &&
            this.#keys(raw.coverage, Object.values(BrowserStorageGroup)) &&
            Object.values(raw.coverage).every((value: unknown): value is BrowserStorageCoverage =>
                this.#coverage(value),
            ) &&
            Array.isArray(raw.limitations) &&
            raw.limitations.every((value: unknown): value is string => typeof value === 'string')
        );
    }
    static #quota(raw: unknown): raw is BrowserStorageQuota {
        return (
            this.#record(raw) &&
            this.#keys(raw, ['available', 'usageBytes', 'quotaBytes']) &&
            typeof raw.available === 'boolean' &&
            (typeof raw.usageBytes === 'string' || raw.usageBytes === null) &&
            (typeof raw.quotaBytes === 'string' || raw.quotaBytes === null)
        );
    }
    static #coverage(raw: unknown): raw is BrowserStorageCoverage {
        return (
            this.#record(raw) &&
            this.#keys(raw, [
                'selected',
                'available',
                'complete',
                'rows',
                'omitted',
                'changedDuringCapture',
            ]) &&
            typeof raw.selected === 'boolean' &&
            typeof raw.available === 'boolean' &&
            typeof raw.complete === 'boolean' &&
            typeof raw.rows === 'string' &&
            typeof raw.omitted === 'string' &&
            typeof raw.changedDuringCapture === 'boolean'
        );
    }
    static #row(raw: unknown): raw is BrowserStorageRow {
        return (
            this.#record(raw) &&
            this.#keys(raw, [
                'id',
                'group',
                'kind',
                'name',
                'identitySha256',
                'valueSha256',
                'complete',
            ]) &&
            typeof raw.id === 'string' &&
            this.#group(raw.group) &&
            Object.values(BrowserStorageKind).some(
                (kind: BrowserStorageKind): boolean => kind === raw.kind,
            ) &&
            (typeof raw.name === 'string' || raw.name === null) &&
            (typeof raw.identitySha256 === 'string' || raw.identitySha256 === null) &&
            (typeof raw.valueSha256 === 'string' || raw.valueSha256 === null) &&
            typeof raw.complete === 'boolean'
        );
    }
    static #record(raw: unknown): raw is Readonly<Record<string, unknown>> {
        return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
    }
    static #group(raw: unknown): raw is BrowserStorageGroup {
        return Object.values(BrowserStorageGroup).some(
            (group: BrowserStorageGroup): boolean => group === raw,
        );
    }
    static #keys(raw: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
        return (
            Object.keys(raw).length === keys.length &&
            keys.every((key: string): boolean => Object.hasOwn(raw, key))
        );
    }
    static #decimal(value: string, length: number): boolean {
        return value.length <= length && /^(?:0|[1-9][0-9]*)$/u.test(value);
    }
    static #sha(value: string | null): boolean {
        return value !== null && /^[a-f0-9]{64}$/u.test(value);
    }
    static #uuid(value: string): boolean {
        return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u.test(value);
    }
}
