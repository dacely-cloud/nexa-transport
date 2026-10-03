// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';
import type { CompanyWorkPhase } from './CompanyWork.js';

/** Explicit owner authorization for repeating an already accepted task plan. */
export interface CompanyMaintenanceSettings {
    readonly sourceRevision: bigint;
    readonly intervalMs: bigint;
    readonly maxRuns: number;
    readonly limit: bigint;
    readonly concurrency: number;
    readonly maxIterations: number;
    readonly paused: boolean;
}
/** Configuration retries retain their original identity and policy revision. */
export interface CompanyMaintenanceCommand extends CompanyMaintenanceSettings {
    readonly id: string;
    readonly revision: bigint;
}
/** Each reserved cycle has its own durable project, source snapshot, and allowance. */
export interface CompanyMaintenanceRun {
    readonly projectId: string;
    readonly sourceProjectId: string;
    readonly sourceRevision: bigint;
    readonly at: bigint;
    readonly limit: bigint;
    readonly concurrency: number;
    readonly maxIterations: number;
    readonly phase: CompanyWorkPhase | 'preparing';
    readonly workRevision: bigint;
}
/** Private policy state; cycle phases and revisions are refreshed from actual work records. */
export interface CompanyMaintenancePolicy extends CompanyMaintenanceSettings {
    readonly revision: bigint;
    readonly nextAt: bigint;
    readonly error: string;
    readonly runs: readonly CompanyMaintenanceRun[];
}
/** Portable bounded binary data used by the project channel and durable policy store. */
export class CompanyMaintenanceCodec {
    /** Configuration bounds apply identically on the server and the SDK. */
    public static validate(value: CompanyMaintenanceSettings): void {
        if (
            value.sourceRevision < 1n ||
            value.intervalMs < 3600000n ||
            value.intervalMs > 90n * 86400000n ||
            !Number.isInteger(value.maxRuns) ||
            value.maxRuns < 1 ||
            value.maxRuns > 32 ||
            value.limit < 0n ||
            value.limit > 0x7fffffffffffffffn ||
            !Number.isInteger(value.concurrency) ||
            value.concurrency < 1 ||
            value.concurrency > 8 ||
            !Number.isInteger(value.maxIterations) ||
            value.maxIterations < 1 ||
            value.maxIterations > 64 ||
            typeof value.paused !== 'boolean'
        ) {
            throw new Error('Invalid recurring maintenance limits.');
        }
    }
    /** Append owner-selected limits with exact 64-bit money and time fields. */
    public static settings(w: BinaryWriter, value: CompanyMaintenanceSettings): void {
        this.validate(value);
        w.u64(value.sourceRevision)
            .u64(value.intervalMs)
            .u8(value.maxRuns)
            .u64(value.limit)
            .u8(value.concurrency)
            .u8(value.maxIterations)
            .u8(value.paused ? 1 : 0);
    }
    /** Read and validate a configuration before it can reach the scheduler. */
    public static readSettings(r: BinaryReader): CompanyMaintenanceSettings {
        const sourceRevision = r.u64(),
            intervalMs = r.u64(),
            maxRuns = r.u8(),
            limit = r.u64(),
            concurrency = r.u8(),
            maxIterations = r.u8(),
            paused = r.u8();
        if (paused > 1) {
            throw new Error('Invalid maintenance pause flag.');
        }
        const value = {
            sourceRevision,
            intervalMs,
            maxRuns,
            limit,
            concurrency,
            maxIterations,
            paused: paused === 1,
        };
        this.validate(value);
        return value;
    }
    /** Encode a bounded, self-versioned policy for storage or a private project snapshot. */
    public static encode(value: CompanyMaintenancePolicy): Uint8Array<ArrayBuffer> {
        const w = new BinaryWriter(512);
        w.u8(1).u64(value.revision);
        this.settings(w, value);
        if (value.runs.length > value.maxRuns || value.error.length > 2000) {
            throw new Error('Invalid maintenance history.');
        }
        w.u64(value.nextAt).str(value.error).u8(value.runs.length);
        const used = new Set<string>();
        for (const run of value.runs) {
            if (
                !run.projectId ||
                run.projectId.length > 128 ||
                used.has(run.projectId) ||
                !run.sourceProjectId ||
                run.sourceProjectId.length > 128 ||
                ![
                    'preparing',
                    'draft',
                    'planning',
                    'plan-review',
                    'running',
                    'delivery-review',
                    'accepted',
                    'blocked',
                ].includes(run.phase)
            ) {
                throw new Error('Invalid maintenance cycle.');
            }
            used.add(run.projectId);
            this.validate({
                ...value,
                sourceRevision: run.sourceRevision,
                limit: run.limit,
                concurrency: run.concurrency,
                maxIterations: run.maxIterations,
            });
            w.str(run.projectId)
                .str(run.sourceProjectId)
                .u64(run.sourceRevision)
                .u64(run.at)
                .u64(run.limit)
                .u8(run.concurrency)
                .u8(run.maxIterations)
                .str(run.phase)
                .u64(run.workRevision);
        }
        return w.toBytes();
    }
    /** Reject truncated, oversized, or ambiguous policy records. */
    public static decode(bytes: Uint8Array): CompanyMaintenancePolicy {
        if (bytes.length > 32768) {
            throw new Error('Maintenance policy exceeds limits.');
        }
        const r = new BinaryReader(bytes);
        if (r.u8() !== 1) {
            throw new Error('Unsupported maintenance policy.');
        }
        const revision = r.u64(),
            settings = this.readSettings(r),
            nextAt = r.u64(),
            error = r.str(),
            count = r.u8();
        if (count > 32) {
            throw new Error('Too many maintenance cycles.');
        }
        const runs: CompanyMaintenanceRun[] = [];
        for (let index = 0; index < count; index++) {
            runs.push({
                projectId: r.str(),
                sourceProjectId: r.str(),
                sourceRevision: r.u64(),
                at: r.u64(),
                limit: r.u64(),
                concurrency: r.u8(),
                maxIterations: r.u8(),
                phase: r.str() as CompanyMaintenanceRun['phase'],
                workRevision: r.u64(),
            });
        }
        if (r.remaining) {
            throw new Error('Trailing maintenance data.');
        }
        const value = { revision, ...settings, nextAt, error, runs };
        this.encode(value);
        return value;
    }
}
