// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BrowserStorageReceipt } from './BrowserStorageReceipt.js';
import { BrowserStorageComparisonValues as Value } from './BrowserStorageComparisonValues.js';
import { BrowserStorageComparisonPolicy as Policy } from './BrowserStorageComparisonPolicy.js';
import { BrowserStorageGroup } from './BrowserStorageReceipt.js';
import type { BrowserStorageMetadata } from '../protocol/Protocol.js';
import { BrowserStorageCompareMode as Mode, BrowserStorageCompareStatus as Status } from './BrowserStorageComparisonDefinitions.js';
import type { BrowserStorageComparison, BrowserStorageComparisonSource, BrowserStorageGroupComparison, BrowserStorageQuotaComparison, BrowserStorageComparisonSnapshot } from '../protocol/Protocol.js';
import type { ReverseBrowserReference } from '../protocol/Protocol.js';

/** Portable comparison headers reject fabricated equality, counters, quota deltas and cross-conversation sources. */
export class BrowserStorageComparisonReceipt {
    /** External headers contain no change arrays, values or additional explanatory payloads. */
    public static read(raw: unknown): BrowserStorageComparison {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'algorithm',
            'before',
            'after',
            'status',
            'complete',
            'detailsComplete',
            'quota',
            'groups',
            'limitations',
        ]);
        if (value.algorithm !== 'storage-observations-v1') {
            throw new TypeError('Invalid storage comparison algorithm');
        }
        const before: BrowserStorageComparisonSource = this.#source(value.before);
        const after: BrowserStorageComparisonSource = this.#source(value.after);
        if (before.reference.sessionId !== after.reference.sessionId) {
            throw new TypeError('Storage comparison sources belong to different conversations');
        }
        const scopes: Readonly<Record<string, unknown>> = Value.record(
            value.groups,
            Object.values(BrowserStorageGroup),
        );
        const groups: Record<BrowserStorageGroup, BrowserStorageGroupComparison> = {
            [BrowserStorageGroup.Local]: this.#group(
                scopes[BrowserStorageGroup.Local],
                BrowserStorageGroup.Local,
                before.metadata,
                after.metadata,
            ),
            [BrowserStorageGroup.Session]: this.#group(
                scopes[BrowserStorageGroup.Session],
                BrowserStorageGroup.Session,
                before.metadata,
                after.metadata,
            ),
            [BrowserStorageGroup.Cookies]: this.#group(
                scopes[BrowserStorageGroup.Cookies],
                BrowserStorageGroup.Cookies,
                before.metadata,
                after.metadata,
            ),
            [BrowserStorageGroup.IndexedDb]: this.#group(
                scopes[BrowserStorageGroup.IndexedDb],
                BrowserStorageGroup.IndexedDb,
                before.metadata,
                after.metadata,
            ),
            [BrowserStorageGroup.Cache]: this.#group(
                scopes[BrowserStorageGroup.Cache],
                BrowserStorageGroup.Cache,
                before.metadata,
                after.metadata,
            ),
        };
        const quota: BrowserStorageQuotaComparison = Policy.quota(before.metadata, after.metadata);
        const observed: Readonly<Record<string, unknown>> = Value.record(value.quota, [
            'status',
            'usageDeltaBytes',
            'quotaDeltaBytes',
        ]);
        if (
            observed.status !== quota.status ||
            observed.usageDeltaBytes !== quota.usageDeltaBytes ||
            observed.quotaDeltaBytes !== quota.quotaDeltaBytes
        ) {
            throw new TypeError('Storage comparison quota arithmetic changed');
        }
        const entries: readonly BrowserStorageGroupComparison[] = Object.values(groups);
        const complete: boolean =
            quota.status !== Status.Unknown &&
            entries.every(
                (entry: BrowserStorageGroupComparison): boolean =>
                    entry.complete && entry.mode === Mode.Fingerprints,
            );
        const changed: boolean =
            quota.status === Status.Changed ||
            entries.some(
                (entry: BrowserStorageGroupComparison): boolean => entry.status === Status.Changed,
            );
        const status: (typeof Status)[keyof typeof Status] = changed
            ? Status.Changed
            : complete
              ? Status.Unchanged
              : Status.Unknown;
        const detailsComplete: boolean = entries.every(
            (entry: BrowserStorageGroupComparison): boolean => entry.omittedChanges === '0',
        );
        if (
            Value.flag(value.complete) !== complete ||
            Value.selection(value.status, Object.values(Status)) !== status ||
            Value.flag(value.detailsComplete) !== detailsComplete
        ) {
            throw new TypeError('Storage comparison status or completeness changed');
        }
        if (!Array.isArray(value.limitations) || value.limitations.length > 8) {
            throw new TypeError('Invalid storage comparison limitations');
        }
        const items: readonly unknown[] = value.limitations;
        const limitations: string[] = items.map((entry: unknown): string => Value.text(entry, 512));
        const result: BrowserStorageComparison = {
            algorithm: 'storage-observations-v1',
            before,
            after,
            status,
            complete,
            detailsComplete,
            quota,
            groups,
            limitations,
        };
        if (JSON.stringify(result).length > 64000) {
            throw new RangeError('Storage comparison header exceeds its budget');
        }
        return result;
    }
    /** Canonical validated header identity remains independent from input object insertion order. */
    public static identity(value: BrowserStorageComparison): string {
        const header: BrowserStorageComparison = this.read(value);
        return JSON.stringify([
            header.algorithm,
            [
                header.before.reference,
                header.before.sha256,
                BrowserStorageReceipt.identity(header.before.metadata),
            ],
            [
                header.after.reference,
                header.after.sha256,
                BrowserStorageReceipt.identity(header.after.metadata),
            ],
            header.status,
            header.complete,
            header.detailsComplete,
            header.quota,
            header.groups,
            header.limitations,
        ]);
    }
    /** Streamed report references and both original sources must belong to the same current conversation. */
    public static snapshot(
        value: BrowserStorageComparisonSnapshot,
        runId: string,
        sessionId?: string,
    ): void {
        const { reference, ...header }: BrowserStorageComparisonSnapshot = value;
        const comparison: BrowserStorageComparison = this.read(header);
        const source: ReverseBrowserReference = Value.reference(reference);
        if (
            source.runId !== runId ||
            source.sessionId !== sessionId ||
            comparison.before.reference.sessionId !== sessionId
        ) {
            throw new TypeError('Storage comparison progress belongs to a foreign report');
        }
    }
    static #source(raw: unknown): BrowserStorageComparisonSource {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'reference',
            'sha256',
            'metadata',
        ]);
        return {
            reference: Value.reference(value.reference),
            sha256: Value.sha(value.sha256),
            metadata: BrowserStorageReceipt.metadata(value.metadata),
        };
    }
    static #group(
        raw: unknown,
        group: BrowserStorageGroup,
        before: BrowserStorageMetadata,
        after: BrowserStorageMetadata,
    ): BrowserStorageGroupComparison {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'mode',
            'status',
            'complete',
            'reason',
            'ambiguousIdentities',
            'added',
            'removed',
            'modified',
            'unchanged',
            'totalChanges',
            'retainedChanges',
            'omittedChanges',
        ]);
        const ambiguous: string = Value.count(value.ambiguousIdentities);
        const added: string = Value.count(value.added);
        const removed: string = Value.count(value.removed);
        const modified: string = Value.count(value.modified);
        const unchanged: string = Value.count(value.unchanged);
        const total: string = Value.count(value.totalChanges);
        const retained: string = Value.count(value.retainedChanges);
        const omitted: string = Value.count(value.omittedChanges);
        const mode: BrowserStorageGroupComparison['mode'] = Policy.mode(group, before, after);
        const complete: boolean = Policy.complete(group, before, after, BigInt(ambiguous));
        const reason: string | null = Policy.reason(group, before, after, BigInt(ambiguous));
        const status: BrowserStorageGroupComparison['status'] =
            BigInt(total) > 0n ? Status.Changed : complete ? Status.Unchanged : Status.Unknown;
        if (
            value.mode !== mode ||
            value.complete !== complete ||
            value.reason !== reason ||
            value.status !== status ||
            BigInt(total) !== BigInt(added) + BigInt(removed) + BigInt(modified) ||
            BigInt(retained) + BigInt(omitted) !== BigInt(total) ||
            (mode !== Mode.Fingerprints && modified !== '0') ||
            (!complete && (added !== '0' || removed !== '0')) ||
            (mode === Mode.Unavailable &&
                (total !== '0' || unchanged !== '0' || ambiguous !== '0')) ||
            BigInt(added) + BigInt(modified) + BigInt(unchanged) >
                BigInt(after.coverage[group].rows) ||
            BigInt(removed) + BigInt(modified) + BigInt(unchanged) >
                BigInt(before.coverage[group].rows) ||
            BigInt(ambiguous) >
                BigInt(before.coverage[group].rows) + BigInt(after.coverage[group].rows)
        ) {
            throw new TypeError('Storage comparison group contradicts its source coverage');
        }
        return {
            mode,
            status,
            complete,
            reason,
            ambiguousIdentities: ambiguous,
            added,
            removed,
            modified,
            unchanged,
            totalChanges: total,
            retainedChanges: retained,
            omittedChanges: omitted,
        };
    }
}
