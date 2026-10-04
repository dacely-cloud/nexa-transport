// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Approved real spending in USD microcents; one dollar is 100,000,000 microcents. */
export interface CompanyAllowance {
    readonly revision: bigint;
    readonly limit: bigint;
    readonly spent: bigint;
    readonly reserved: bigint;
    readonly concurrency: number;
}

/** Host-owned execution identity, distinct from a persistent employee or task. */
export interface CompanyAttempt {
    readonly id: string;
    readonly taskId: string;
    readonly employeeId: string;
    readonly status: 'running' | 'succeeded' | 'failed' | 'interrupted';
    readonly holder: string;
    readonly expires: bigint;
}

/** A provider/tool request whose outcome can be reconciled independently of its attempt. */
export interface CompanyCharge {
    readonly id: string;
    readonly attemptId: string;
    readonly maximum: bigint;
    readonly amount: bigint | null;
    readonly state: 'reserved' | 'dispatched' | 'settled' | 'cancelled';
    readonly provider: string;
    readonly model: string;
    readonly receipt: string;
}

/** Cursor-bearing funding history, including unresolved provider requests. */
export interface CompanyChargeRecord extends CompanyCharge {
    readonly sequence: bigint;
}

/** Host-recorded evidence for resolving an interrupted execution. */
export interface CompanyReconciliation {
    readonly evidence: string;
    readonly at: bigint;
    readonly succeeded: boolean;
}

/** Revision-checked approval expressed in exact USD microcents. */
export interface CompanyAllowanceCommand {
    readonly id: string;
    readonly revision: bigint;
    readonly limit: bigint;
    readonly concurrency: number;
}
/** Maximum liability for one provider call before dispatch. */
export interface CompanyReservation {
    readonly id: string;
    readonly attemptId: string;
    readonly maximum: bigint;
    readonly provider: string;
    readonly model: string;
}
