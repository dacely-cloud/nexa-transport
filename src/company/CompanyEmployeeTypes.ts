// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { CompanyWorkPhase } from './CompanyWorkTypes.js';

/** Read-only private employee evidence, carried on the existing authenticated office socket. */
export const EmployeeOp = {
    Read: 1,
    Subscribe: 2,
    Unsubscribe: 3,
    Snapshot: 128,
    Update: 129,
    Stopped: 130,
    Error: 131,
} as const;

/** Counts describe actual saved attempts; repeated work is not automatically a defect. */
export interface CompanyEmployeeProject {
    readonly projectId: string;
    readonly name: string;
    readonly revision: bigint;
    readonly phase: CompanyWorkPhase;
    readonly acceptedAt: bigint;
    readonly completed: number;
    readonly blocked: number;
    readonly interrupted: number;
    readonly running: number;
    readonly acceptedTasks: number;
    /** Accepted implementation with exactly one saved run across all employees, excluding plans and reviews. */
    readonly singleRunAcceptedTasks?: number;
    readonly repeatedTasks: number;
    /** Legacy count of tool receipts on completed attempts; this does not assert that tests passed. */
    readonly recordedChecks: number;
    readonly inputTokens: bigint;
    readonly outputTokens: bigint;
    /** Available only when host-classified outcomes exist; legacy receipts remain unclassified. */
    readonly verification?: CompanyEmployeeVerification;
    /** Exact ledger amounts attributed to this employee's original execution attempts. */
    readonly cost?: CompanyEmployeeCost;
}
/** Settled spending and outstanding maximum liability remain separate; counts include cancelled requests. */
export interface CompanyEmployeeCost {
    readonly spent: bigint;
    readonly reserved: bigint;
    readonly charges: bigint;
    readonly unresolved: bigint;
}
/** Completed command exits and file reads are distinct evidence, including failures on blocked runs. */
export interface CompanyEmployeeVerification {
    readonly passedCommands: number;
    readonly failedCommands: number;
    readonly fileInspections: number;
    readonly unclassifiedReceipts: number;
}

/** Company revision fences names and ownership; ordered updates also carry operational changes. */
export interface CompanyEmployeeResults {
    readonly revision: bigint;
    readonly employeeId: string;
    readonly projects: readonly CompanyEmployeeProject[];
}

/** No employee report operation can execute work or change persistent records. */
export interface CompanyEmployeeControl {
    /** Version 4 adds accepted single-run delivery counts; absent retains the original binary layout. */
    readonly version?: 2 | 3 | 4;
    readonly op:
        typeof EmployeeOp.Read | typeof EmployeeOp.Subscribe | typeof EmployeeOp.Unsubscribe;
    readonly id: string;
    readonly employeeId: string;
}

/** First snapshot and subsequent changes remain correlated to the selected employee. */
export interface CompanyEmployeeSnapshot {
    /** Version 4 adds accepted single-run delivery counts. */
    readonly version?: 2 | 3 | 4;
    readonly op: typeof EmployeeOp.Snapshot | typeof EmployeeOp.Update;
    readonly id: string;
    readonly employeeId: string;
    readonly sequence: bigint;
    readonly state: CompanyEmployeeResults;
}

/** A stopped or rejected subscription never includes private project records. */
export interface CompanyEmployeeTerminal {
    /** Correlates the selected read protocol without including private records. */
    readonly version?: 2 | 3 | 4;
    readonly op: typeof EmployeeOp.Stopped | typeof EmployeeOp.Error;
    readonly id: string;
    readonly employeeId: string;
    readonly message: string;
}

/** NCE1 traffic is private owner data, separate from visitor office geometry and animations. */
export type CompanyEmployeePacket =
    CompanyEmployeeControl | CompanyEmployeeSnapshot | CompanyEmployeeTerminal;
