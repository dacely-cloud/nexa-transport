// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { CompanyOp } from './CompanyTypes.js';

/** Real company-project usage; unset ceilings leave each approved project allowance in force. */
export interface CompanyLimits {
    readonly revision: bigint;
    readonly limit: bigint | null;
    readonly spent: bigint;
    readonly reserved: bigint;
    readonly concurrency: number | null;
    readonly running: number;
}
/** Explicit owner approval, deduplicated by its original command ID. */
export interface CompanyLimitsCommand {
    readonly id: string;
    readonly revision: bigint;
    readonly limit: bigint;
    readonly concurrency: number;
}

/** Read-only requests never enter the durable approval journal. */
export interface CompanyLimitsRead {
    readonly op: typeof CompanyOp.ReadLimits;
    readonly id: string;
}
/** Start an ordered private financial stream. */
export interface CompanyLimitsSubscribe {
    readonly op: typeof CompanyOp.SubscribeLimits;
    readonly id: string;
}
/** Release one private stream. */
export interface CompanyLimitsUnsubscribe {
    readonly op: typeof CompanyOp.UnsubscribeLimits;
    readonly id: string;
}
/** Ephemeral private financial controls. */
export type CompanyLimitsControl =
    CompanyLimitsRead | CompanyLimitsSubscribe | CompanyLimitsUnsubscribe;
/** The owner explicitly changes the company ceiling and execution capacity. */
export interface CompanyLimitsConfigure extends CompanyLimitsCommand {
    readonly op: typeof CompanyOp.SetLimits;
}
/** Policy revision changes only on approval; spending updates use a separate stream sequence. */
export interface CompanyLimitsSnapshot {
    readonly op: typeof CompanyOp.LimitsSnapshot;
    readonly id: string;
    readonly sequence: bigint;
    readonly state: CompanyLimits;
}
/** Contiguous updates may change usage while retaining the same policy revision. */
export interface CompanyLimitsUpdate {
    readonly op: typeof CompanyOp.LimitsUpdate;
    readonly id: string;
    readonly sequence: bigint;
    readonly state: CompanyLimits;
}
/** Subscription release acknowledgement. */
export interface CompanyLimitsStopped {
    readonly op: typeof CompanyOp.LimitsStopped;
    readonly id: string;
}
/** Correlated errors stay separate from staffing operations. */
export interface CompanyLimitsFailure {
    readonly op: typeof CompanyOp.LimitsError;
    readonly id: string;
    readonly message: string;
}
/** Company financial controls and projections, carried on the private NCO2 channel. */
export type CompanyLimitsPacket =
    | CompanyLimitsControl
    | CompanyLimitsConfigure
    | CompanyLimitsSnapshot
    | CompanyLimitsUpdate
    | CompanyLimitsStopped
    | CompanyLimitsFailure;
