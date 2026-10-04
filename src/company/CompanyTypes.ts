// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { CompanyLimitsPacket } from './CompanyLimitsTypes.js';

/** Private company operations on the existing authenticated game connection. */
export const CompanyOp = {
    Read: 1,
    Configure: 2,
    Employee: 3,
    Department: 4,
    Project: 5,
    Subscribe: 6,
    Unsubscribe: 7,
    ReadLimits: 8,
    SetLimits: 9,
    SubscribeLimits: 10,
    UnsubscribeLimits: 11,
    DepartmentPolicy: 12,
    KnowledgeDraft: 13,
    KnowledgePublish: 14,
    KnowledgeArchive: 15,
    LimitsSnapshot: 133,
    LimitsUpdate: 134,
    LimitsStopped: 135,
    LimitsError: 136,
    Snapshot: 128,
    Error: 129,
    LiveSnapshot: 130,
    Update: 131,
    Stopped: 132,
} as const;
/** Saved employee configuration; tool names can only narrow deployment permissions. */
export interface EmployeeDetails {
    readonly name: string;
    readonly role: string;
    readonly instructions: string;
    readonly departmentId: string;
    readonly provider: string;
    readonly model: string;
    readonly tools: readonly string[] | null;
}
/** Stable identity and desk survive task attempts and changes to the employee's configuration. */
export interface CompanyEmployee extends EmployeeDetails {
    readonly id: string;
    readonly desk: number;
}
/** Owner-reviewed guidance; saving edits returns an entry to draft until explicit publication. */
export interface CompanyKnowledge {
    readonly id: string;
    readonly title: string;
    readonly body: string;
    readonly kind: 'note' | 'procedure';
    readonly revision: number;
    readonly reviewedAt: bigint;
    readonly archived: boolean;
}
/** Shared instructions for a named team. */
export interface CompanyDepartment {
    readonly library?: readonly CompanyKnowledge[];
    /** Absent or null inherits deployment access; an empty list permits no action tools. */
    readonly tools?: readonly string[] | null;
    readonly id: string;
    readonly name: string;
    readonly instructions: string;
}
/** A saved brief does not grant approval to execute or spend. */
export interface ProjectDetails {
    readonly name: string;
    readonly brief: string;
    readonly managerId: string;
    readonly team: readonly string[];
}
/** Persistent project identity, independent of a conversation or execution attempt. */
export interface CompanyProject extends ProjectDetails {
    readonly id: string;
    readonly createdAt: bigint;
}
/** Owner-only company state; never included in visitor packets. */
export interface CompanyState {
    readonly revision: bigint;
    readonly name: string;
    readonly employees: readonly CompanyEmployee[];
    readonly departments: readonly CompanyDepartment[];
    readonly projects: readonly CompanyProject[];
}
/** Negotiated company snapshots add department tools in version two and private knowledge in version three. */
export interface CompanyWireVersion {
    readonly version?: 2 | 3;
}
/** A durable command ID is reusable only with the identical command body. */
export interface CompanyRequest extends CompanyWireVersion {
    readonly id: string;
    readonly revision: bigint;
}
/** Read the authenticated account's current company. */
export interface CompanyRead extends CompanyRequest {
    readonly op: typeof CompanyOp.Read;
}
/** Rename the authenticated account's company. */
export interface CompanyConfigure extends CompanyRequest {
    readonly op: typeof CompanyOp.Configure;
    readonly name: string;
}
/** Empty employeeId hires; an existing owned ID updates configuration without changing its desk. */
export interface CompanyStaff extends CompanyRequest, EmployeeDetails {
    readonly op: typeof CompanyOp.Employee;
    readonly employeeId: string;
}
/** Empty departmentId creates a team; an existing ID updates it. */
export interface CompanyTeam extends CompanyRequest {
    readonly op: typeof CompanyOp.Department;
    readonly departmentId: string;
    readonly name: string;
    readonly instructions: string;
}
/** Save department instructions and its tool ceiling together in one reviewed change. */
export interface CompanyDepartmentPolicy extends CompanyRequest {
    readonly op: typeof CompanyOp.DepartmentPolicy;
    readonly departmentId: string;
    readonly name: string;
    readonly instructions: string;
    readonly tools: readonly string[] | null;
}
/** Save a private draft without changing employee guidance until the owner publishes it. */
export interface CompanyKnowledgeDraft extends CompanyRequest {
    readonly op: typeof CompanyOp.KnowledgeDraft;
    readonly departmentId: string;
    readonly entryId: string;
    readonly title: string;
    readonly body: string;
    readonly kind: 'note' | 'procedure';
}
/** Publish the current saved draft or archive existing guidance at the reviewed company revision. */
export interface CompanyKnowledgeDecision extends CompanyRequest {
    readonly op: typeof CompanyOp.KnowledgePublish | typeof CompanyOp.KnowledgeArchive;
    readonly departmentId: string;
    readonly entryId: string;
}
/** Create a project brief and its initial staffing without starting execution. */
export interface CompanyBrief extends CompanyRequest, ProjectDetails {
    readonly op: typeof CompanyOp.Project;
}
/** Commands never accept an owner identity from the client. */
export type CompanyCommand =
    | CompanyRead
    | CompanyConfigure
    | CompanyStaff
    | CompanyTeam
    | CompanyBrief
    | CompanyDepartmentPolicy
    | CompanyKnowledgeDraft
    | CompanyKnowledgeDecision;
/** Correlated authoritative state after a read or committed command. */
export interface CompanySnapshot {
    readonly op: typeof CompanyOp.Snapshot;
    readonly id: string;
    readonly state: CompanyState;
}
/** A rejected command does not change the company revision. */
export interface CompanyFailure {
    readonly op: typeof CompanyOp.Error;
    readonly id: string;
    readonly message: string;
}
/** Subscribe to the authenticated account's company without creating a durable command. */
export interface CompanySubscribe {
    readonly op: typeof CompanyOp.Subscribe;
    readonly id: string;
}
/** Release one private stream. */
export interface CompanyUnsubscribe {
    readonly op: typeof CompanyOp.Unsubscribe;
    readonly id: string;
}
/** Ephemeral reads never enter the durable company command journal. */
export type CompanyWatchControl = CompanySubscribe | CompanyUnsubscribe;
/** The first subscription packet always has sequence zero. */
export interface CompanyLiveSnapshot {
    readonly op: typeof CompanyOp.LiveSnapshot;
    readonly id: string;
    readonly sequence: bigint;
    readonly state: CompanyState;
}
/** A subscription has its own contiguous sequence, independent of coalesced company revisions. */
export interface CompanyUpdate {
    readonly op: typeof CompanyOp.Update;
    readonly id: string;
    readonly sequence: bigint;
    readonly state: CompanyState;
}
/** A cancelled company subscription retains no server state. */
export interface CompanyStopped {
    readonly op: typeof CompanyOp.Stopped;
    readonly id: string;
}
/** Binary company request and response union. */
export type CompanyPacket = (
    | CompanyCommand
    | CompanySnapshot
    | CompanyFailure
    | CompanyWatchControl
    | CompanyLiveSnapshot
    | CompanyUpdate
    | CompanyStopped
    | CompanyLimitsPacket
) &
    CompanyWireVersion;
