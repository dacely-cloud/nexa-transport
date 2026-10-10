// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BrowserStorageComparisonValues as Value } from './BrowserStorageComparisonValues.js';
import { BrowserStorageComparisonReceipt } from './BrowserStorageComparisonReceipt.js';
import { BrowserStorageReceipt } from './BrowserStorageReceipt.js';
import { BrowserStorageGroup, BrowserStorageKind } from './BrowserStorageReceipt.js';
import type { BrowserStorageRow } from '../protocol/Protocol.js';
import { BrowserStorageChangeKind as Change, BrowserStorageCompareMode as Mode } from './BrowserStorageComparisonDefinitions.js';
import type { BrowserStorageComparison, BrowserStorageChange, BrowserStorageComparisonPage } from '../protocol/Protocol.js';
import type { BrowserStorageComparisonCapture } from './BrowserStorageComparisonDefinitions.js';

interface RetainedCounts {
    added: bigint;
    removed: bigint;
    modified: bigint;
    rows: bigint;
}

/** Portable change validation proves admissible row differences and bounded monotonic report paging. */
export class BrowserStorageChangeReceipt {
    static readonly #encoder: TextEncoder = new TextEncoder();
    /** Each difference retains complete original rows and never accepts secret-bearing additional fields. */
    public static row(raw: unknown, comparison: BrowserStorageComparison): BrowserStorageChange {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'id',
            'group',
            'change',
            'before',
            'after',
        ]);
        const group: BrowserStorageGroup = Value.selection(
            value.group,
            Object.values(BrowserStorageGroup),
        );
        const change: BrowserStorageChange['change'] = Value.selection(
            value.change,
            Object.values(Change),
        );
        const id: string = Value.text(value.id, 32);
        const ordinal: string = id.slice(group.length + 1);
        if (
            !id.startsWith(group + ':') ||
            BigInt(Value.count(ordinal)) >= BigInt(comparison.groups[group].retainedChanges)
        ) {
            throw new TypeError('Storage change ordinal exceeds its retained inventory');
        }
        const before: BrowserStorageRow | null =
            value.before === null
                ? null
                : BrowserStorageReceipt.row(value.before, comparison.before.metadata);
        const after: BrowserStorageRow | null =
            value.after === null
                ? null
                : BrowserStorageReceipt.row(value.after, comparison.after.metadata);
        const mode: (typeof Mode)[keyof typeof Mode] = comparison.groups[group].mode;
        for (const row of [before, after]) {
            if (
                row !== null &&
                (!row.complete ||
                    row.group !== group ||
                    mode === Mode.Unavailable ||
                    (mode === Mode.Names &&
                        row.kind !== BrowserStorageKind.Name &&
                        row.kind !== BrowserStorageKind.Value))
            ) {
                throw new TypeError('Storage change uses an incomplete or incompatible source row');
            }
        }
        if (change === Change.Modified) {
            if (
                before === null ||
                after === null ||
                mode !== Mode.Fingerprints ||
                before.kind !== after.kind ||
                before.identitySha256 !== after.identitySha256 ||
                before.valueSha256 === after.valueSha256
            ) {
                throw new TypeError('Storage modification has no proven content difference');
            }
        } else if (
            !comparison.groups[group].complete ||
            (change === Change.Added
                ? before !== null || after === null
                : before === null || after !== null)
        ) {
            throw new TypeError('Storage absence is not proven by complete comparable inventories');
        }
        if (
            comparison.groups[group][
                change === Change.Added
                    ? 'added'
                    : change === Change.Removed
                      ? 'removed'
                      : 'modified'
            ] === '0'
        ) {
            throw new TypeError('Storage change contradicts its declared counters');
        }
        return { id, group, change, before, after };
    }
    /** Publication requires exact retained ordinals, unique original rows and matching counter arithmetic. */
    public static capture(raw: unknown): BrowserStorageComparisonCapture {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'comparison',
            'changes',
        ]);
        const comparison: BrowserStorageComparison = BrowserStorageComparisonReceipt.read(
            value.comparison,
        );
        if (
            !Array.isArray(value.changes) ||
            value.changes.length > 40000 ||
            this.#encoder.encode(JSON.stringify(raw)).length > 4194304
        ) {
            throw new RangeError('Storage comparison original exceeds its report budget');
        }
        const items: readonly unknown[] = value.changes;
        const counts: Map<BrowserStorageGroup, RetainedCounts> = new Map<
            BrowserStorageGroup,
            RetainedCounts
        >();
        const before: Set<string> = new Set<string>();
        const after: Set<string> = new Set<string>();
        const changes: BrowserStorageChange[] = items.map((item: unknown): BrowserStorageChange => {
            const row: BrowserStorageChange = this.row(item, comparison);
            const count: RetainedCounts = counts.get(row.group) ?? {
                added: 0n,
                removed: 0n,
                modified: 0n,
                rows: 0n,
            };
            if (row.id !== row.group + ':' + count.rows.toString()) {
                throw new TypeError('Storage comparison retained ordinal changed');
            }
            for (const side of [
                { row: row.before, seen: before },
                { row: row.after, seen: after },
            ]) {
                if (side.row !== null) {
                    if (side.seen.has(side.row.id)) {
                        throw new TypeError('Storage comparison reuses an original row');
                    }
                    side.seen.add(side.row.id);
                }
            }
            count[
                row.change === Change.Added
                    ? 'added'
                    : row.change === Change.Removed
                      ? 'removed'
                      : 'modified'
            ] += 1n;
            count.rows += 1n;
            counts.set(row.group, count);
            return row;
        });
        for (const group of Object.values(BrowserStorageGroup)) {
            const count: RetainedCounts = counts.get(group) ?? {
                added: 0n,
                removed: 0n,
                modified: 0n,
                rows: 0n,
            };
            const scope: BrowserStorageComparison['groups'][BrowserStorageGroup] =
                comparison.groups[group];
            if (
                count.rows.toString() !== scope.retainedChanges ||
                count.added > BigInt(scope.added) ||
                count.removed > BigInt(scope.removed) ||
                count.modified > BigInt(scope.modified) ||
                (scope.omittedChanges === '0' &&
                    (count.added.toString() !== scope.added ||
                        count.removed.toString() !== scope.removed ||
                        count.modified.toString() !== scope.modified))
            ) {
                throw new TypeError('Storage comparison retained counters changed');
            }
        }
        return { comparison, changes };
    }
    /** Wire pages contain only a validated header and consecutive selected retained differences. */
    public static page(raw: unknown): BrowserStorageComparisonPage {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'runId',
            'sha256',
            'evidenceId',
            'captureSha256',
            'comparison',
            'group',
            'cursor',
            'nextCursor',
            'changes',
        ]);
        const comparison: BrowserStorageComparison = BrowserStorageComparisonReceipt.read(
            value.comparison,
        );
        const group: BrowserStorageGroup | null =
            value.group === null
                ? null
                : Value.selection(value.group, Object.values(BrowserStorageGroup));
        const cursor: string = Value.count(value.cursor);
        const nextCursor: string | null =
            value.nextCursor === null ? null : Value.count(value.nextCursor);
        if (
            !Array.isArray(value.changes) ||
            value.changes.length > 20 ||
            JSON.stringify(raw).length > 96000
        ) {
            throw new RangeError('Storage comparison page exceeds its transfer budget');
        }
        const items: readonly unknown[] = value.changes;
        const changes: BrowserStorageChange[] = items.map((item: unknown): BrowserStorageChange =>
            this.row(item, comparison),
        );
        if (group === null) {
            if (cursor !== '0' || nextCursor !== null || changes.length !== 0) {
                throw new TypeError('Storage comparison header contains changes');
            }
        } else {
            const total: bigint = BigInt(comparison.groups[group].retainedChanges);
            const end: bigint = BigInt(cursor) + BigInt(changes.length);
            if (
                end > total ||
                nextCursor !== (end < total ? end.toString() : null) ||
                (end < total && changes.length === 0)
            ) {
                throw new TypeError(
                    'Storage comparison page did not advance within its retained inventory',
                );
            }
            for (let index: number = 0; index < changes.length; index++) {
                const row: BrowserStorageChange | undefined = changes[index];
                if (
                    row === undefined ||
                    row.group !== group ||
                    row.id !== group + ':' + (BigInt(cursor) + BigInt(index)).toString()
                ) {
                    throw new TypeError('Storage comparison page ordinal changed');
                }
            }
        }
        return {
            runId: Value.uuid(value.runId),
            sha256: Value.sha(value.sha256),
            evidenceId: Value.uuid(value.evidenceId),
            captureSha256: Value.sha(value.captureSha256),
            comparison,
            group,
            cursor,
            nextCursor,
            changes,
        };
    }
}
