// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BrowserStorageGroup } from './BrowserStorageReceipt.js';
import type { BrowserStorageMetadata } from '../protocol/Protocol.js';
import {
    BrowserStorageCompareMode as Mode,
    BrowserStorageCompareStatus as Status,
} from './BrowserStorageComparisonDefinitions.js';
import type {
    BrowserStorageCompareMode,
    BrowserStorageQuotaComparison,
} from '../protocol/Protocol.js';

/** Shared portable scope rules keep native comparison and external receipt validation equivalent. */
export class BrowserStorageComparisonPolicy {
    /** Cookie identity includes the URL applicability scope; other stores are origin scoped. */
    public static sameScope(
        group: BrowserStorageGroup,
        before: BrowserStorageMetadata,
        after: BrowserStorageMetadata,
    ): boolean {
        return (
            before.origin === after.origin &&
            (group !== BrowserStorageGroup.Cookies || before.url === after.url)
        );
    }
    /** Independent source opt-ins determine the strongest mutually admissible comparison. */
    public static mode(
        group: BrowserStorageGroup,
        before: BrowserStorageMetadata,
        after: BrowserStorageMetadata,
    ): BrowserStorageCompareMode {
        if (
            !this.sameScope(group, before, after) ||
            !before.coverage[group].selected ||
            !after.coverage[group].selected ||
            !before.coverage[group].available ||
            !after.coverage[group].available
        ) {
            return Mode.Unavailable;
        }
        return before.includeFingerprints && after.includeFingerprints
            ? Mode.Fingerprints
            : before.includeNames && after.includeNames
              ? Mode.Names
              : Mode.Unavailable;
    }
    /** Missing coverage and repeated identities prevent unique complete inventories. */
    public static complete(
        group: BrowserStorageGroup,
        before: BrowserStorageMetadata,
        after: BrowserStorageMetadata,
        ambiguous: bigint,
    ): boolean {
        return (
            this.mode(group, before, after) !== Mode.Unavailable &&
            before.coverage[group].complete &&
            after.coverage[group].complete &&
            ambiguous === 0n
        );
    }
    /** Reasons follow the same precedence as the native evidence engine and cannot be forged in a receipt. */
    public static reason(
        group: BrowserStorageGroup,
        before: BrowserStorageMetadata,
        after: BrowserStorageMetadata,
        ambiguous: bigint,
    ): string | null {
        return !this.sameScope(group, before, after)
            ? 'Captured storage scopes differ.'
            : this.mode(group, before, after) === Mode.Unavailable
              ? 'Matching storage selections were unavailable.'
              : ambiguous > 0n
                ? 'Repeated row identities cannot establish unique records.'
                : !this.complete(group, before, after, ambiguous)
                  ? 'At least one inventory was unavailable, partial or changed during capture.'
                  : null;
    }
    /** Exact quota differences never cross origin or pretend missing measurements are zero. */
    public static quota(
        before: BrowserStorageMetadata,
        after: BrowserStorageMetadata,
    ): BrowserStorageQuotaComparison {
        if (
            before.origin !== after.origin ||
            !before.quota.available ||
            !after.quota.available ||
            before.quota.usageBytes === null ||
            after.quota.usageBytes === null ||
            before.quota.quotaBytes === null ||
            after.quota.quotaBytes === null
        ) {
            return { status: Status.Unknown, usageDeltaBytes: null, quotaDeltaBytes: null };
        }
        const usage: bigint = BigInt(after.quota.usageBytes) - BigInt(before.quota.usageBytes);
        const quota: bigint = BigInt(after.quota.quotaBytes) - BigInt(before.quota.quotaBytes);
        return {
            status: usage === 0n && quota === 0n ? Status.Unchanged : Status.Changed,
            usageDeltaBytes: usage.toString(),
            quotaDeltaBytes: quota.toString(),
        };
    }
}
