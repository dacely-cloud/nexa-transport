// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Private company operations on the existing authenticated game connection. */
export const CompanyOp = {
    Read: 1,
    Configure: 2,
    Employee: 3,
    Department: 4,
    Project: 5,
    Snapshot: 128,
    Error: 129,
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
/** Shared instructions for a named team. */
export interface CompanyDepartment {
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
/** A durable command ID is reusable only with the identical command body. */
export interface CompanyRequest {
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
/** Create a project brief and its initial staffing without starting execution. */
export interface CompanyBrief extends CompanyRequest, ProjectDetails {
    readonly op: typeof CompanyOp.Project;
}
/** Commands never accept an owner identity from the client. */
export type CompanyCommand =
    CompanyRead | CompanyConfigure | CompanyStaff | CompanyTeam | CompanyBrief;
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
/** Binary company request and response union. */
export type CompanyPacket = CompanyCommand | CompanySnapshot | CompanyFailure;
