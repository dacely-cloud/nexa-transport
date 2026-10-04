// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { CompanyAllowance } from './CompanyBudgetTypes.js';
import type { CompanyWork, CompanyWorkCommand } from './CompanyWorkTypes.js';

/** Private project decisions and delivery transfer on the existing authenticated socket. */
export const ProjectOp = {
    Read: 1,
    Command: 2,
    File: 3,
    Subscribe: 4,
    Unsubscribe: 5,
    Snapshot: 128,
    Update: 129,
    Chunk: 130,
    Error: 131,
    Stopped: 132,
} as const;
/** Exact spending is separate from the project execution revision. */
export interface CompanyProjectState {
    readonly work: CompanyWork;
    readonly allowance: CompanyAllowance | null;
}
/** No packet accepts an owner, execution holder, or workspace filesystem path. */
export interface ProjectRequest {
    /** Version 2 supports an accepted starting product; omitted means the original wire format. */
    readonly version?: 2;
    readonly id: string;
    readonly project: string;
}
/** Initial read or subscription; every subscription starts with an authoritative snapshot. */
export interface ProjectRead extends ProjectRequest {
    readonly op: typeof ProjectOp.Read | typeof ProjectOp.Subscribe | typeof ProjectOp.Unsubscribe;
}
/** The decision's ID and revision survive an explicit retry after connection loss. */
export interface ProjectCommand extends ProjectRequest {
    readonly op: typeof ProjectOp.Command;
    readonly command: CompanyWorkCommand;
}
/** A delivery must resolve from an attempt in the authenticated owner's stored project. */
export interface ProjectFile extends ProjectRequest {
    readonly op: typeof ProjectOp.File;
    readonly attempt: string;
    readonly path: string;
}
/** Sequence is scoped to the subscription ID, starts at zero, and increases for each full update. */
export interface ProjectSnapshot extends ProjectRequest {
    readonly op: typeof ProjectOp.Snapshot | typeof ProjectOp.Update;
    readonly sequence: bigint;
    readonly state: CompanyProjectState;
}
/** Contiguous bounded chunks; zero bytes is a valid complete empty artifact. */
export interface ProjectChunk extends ProjectRequest {
    readonly op: typeof ProjectOp.Chunk;
    readonly offset: number;
    readonly total: number;
    readonly bytes: Uint8Array;
}
/** Correlated failure; private host errors are never returned verbatim. */
export interface ProjectFailure extends ProjectRequest {
    readonly op: typeof ProjectOp.Error;
    readonly message: string;
}
/** Explicit confirmation that no more updates will use this subscription ID. */
export interface ProjectStopped extends ProjectRequest {
    readonly op: typeof ProjectOp.Stopped;
}
export type ProjectClientPacket = ProjectRead | ProjectCommand | ProjectFile;
export type ProjectPacket =
    ProjectClientPacket | ProjectSnapshot | ProjectChunk | ProjectFailure | ProjectStopped;
