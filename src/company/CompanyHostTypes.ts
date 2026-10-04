// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Passive resource reads are private owner operations, independent of company spending approvals. */
export const HostOp = {
    Read: 1,
    Subscribe: 2,
    Unsubscribe: 3,
    Snapshot: 128,
    Update: 129,
    Stopped: 130,
    Error: 131,
} as const;

/** A workspace assignment may exist without a connected transport or a reporting daemon. */
export type CompanyHostStatus =
    'local' | 'connected' | 'disconnected' | 'unassigned' | 'unsupported' | 'unavailable';

/** Capacity describes the selected workspace, never an inventory of other accounts or provider hardware. */
export interface CompanyHostState {
    readonly revision: bigint;
    readonly sampledAt: bigint;
    readonly status: CompanyHostStatus;
    readonly parallelism?: number;
    readonly memory?: bigint;
    /** Commands on this executor connection; unavailable for local sandbox process tables. */
    readonly commands?: number;
}
/** A read cannot select a machine, start a connection or change configuration. */
export interface CompanyHostControl {
    readonly op: typeof HostOp.Read | typeof HostOp.Subscribe | typeof HostOp.Unsubscribe;
    readonly id: string;
}
/** Ordered resource updates remain independent of company policy revisions. */
export interface CompanyHostSnapshot {
    readonly op: typeof HostOp.Snapshot | typeof HostOp.Update;
    readonly id: string;
    readonly sequence: bigint;
    readonly state: CompanyHostState;
}
/** Ending a view or rejecting access never returns resource data. */
export interface CompanyHostTerminal {
    readonly op: typeof HostOp.Stopped | typeof HostOp.Error;
    readonly id: string;
    readonly message: string;
}
/** NCH1 is a small binary family on the existing private Chat socket. */
export type CompanyHostPacket = CompanyHostControl | CompanyHostSnapshot | CompanyHostTerminal;
