// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    OfficeConstruction,
    OfficeDesks,
    type OfficeDeskPoint,
    type OfficeDeskPlacement,
    type OfficePlacement,
} from '../office/OfficeProtocol';

/** Operations on the private company channel multiplexed with NGOP and Chat. */
export const CompanyOp = {
    Read: 1,
    Configure: 2,
    Hire: 3,
    Department: 4,
    Draft: 5,
    Assign: 6,
    Employee: 7,
    DepartmentSettings: 8,
    Construction: 9,
    Procedure: 10,
    Snapshot: 128,
    Error: 129,
} as const;
/** Optional employee overrides; null tools inherits the deployment ceiling, while [] permits none. */
export interface CompanyEmployeeSettings {
    readonly provider: string;
    readonly model: string;
    readonly tools: readonly string[] | null;
}
/** Stable company employee, independent of execution attempts. */
export interface CompanyEmployee {
    readonly id: string;
    readonly name: string;
    readonly role: string;
    readonly instructions: string;
    readonly departmentId: string;
    readonly desk: number;
    /** Optional physical location; changing the desk address resets it. */
    readonly deskPosition?: OfficeDeskPoint;
    readonly settings?: CompanyEmployeeSettings;
}
/** Shared owner-authored guidance and an optional ceiling on members' tools. */
export interface CompanyDepartmentSettings {
    readonly instructions: string;
    readonly tools: readonly string[] | null;
}
/** Organizational area owned by this company. */
export interface CompanyDepartment {
    /** Saved team-area placement; private department identity is never sent to visitors. */
    readonly area?: number;
    readonly id: string;
    readonly name: string;
    readonly settings?: CompanyDepartmentSettings;
}
/** Immutable accepted project that supplies a follow-up's starting files. */
export interface CompanyProjectSource {
    readonly projectId: string;
    readonly revision: bigint;
}
/** Persistent project brief ready for planning and execution. */
export interface CompanyProject {
    readonly source?: CompanyProjectSource;
    readonly id: string;
    readonly name: string;
    readonly brief: string;
    readonly managerId: string;
    readonly team: readonly string[];
}
/** Owner-reviewed reusable guidance tied to an immutable accepted delivery. */
export interface CompanyProcedureDetails {
    readonly title: string;
    readonly instructions: string;
    readonly scope: 'employee' | 'department';
    readonly targetId: string;
    readonly source: CompanyProjectSource;
    readonly status: 'draft' | 'approved' | 'retired';
}
/** Approval activates only the saved wording; edits return the procedure to draft. */
export interface CompanyProcedure extends CompanyProcedureDetails {
    readonly id: string;
    readonly approvedAt: bigint;
}
/** Private authoritative company state. Never delivered to office visitors. */
export interface CompanyState {
    readonly procedures?: readonly CompanyProcedure[];
    readonly construction?: readonly OfficePlacement[];
    readonly name: string;
    readonly revision: bigint;
    readonly employees: readonly CompanyEmployee[];
    readonly departments: readonly CompanyDepartment[];
    readonly projects: readonly CompanyProject[];
}
/** Request identity and optimistic revision are supplied on every command. */
export interface CompanyRequest {
    /** Reply using the original wire layout for older clients. */
    readonly version?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    readonly id: string;
    readonly revision: bigint;
}
/** Read the current company without mutating it. */
export interface CompanyRead extends CompanyRequest {
    readonly op: typeof CompanyOp.Read;
}
/** Rename the company. */
export interface CompanyConfigure extends CompanyRequest {
    readonly op: typeof CompanyOp.Configure;
    readonly name: string;
}
/** Hire one persistent, account-scoped employee. */
export interface CompanyHire extends CompanyRequest {
    readonly op: typeof CompanyOp.Hire;
    readonly name: string;
    readonly role: string;
    readonly instructions: string;
    readonly departmentId: string;
}
/** Create a department. */
export interface CompanyCreateDepartment extends CompanyRequest {
    readonly op: typeof CompanyOp.Department;
    readonly name: string;
}
/** Update shared guidance and permissions without changing department membership. */
export interface CompanyEditDepartment extends CompanyRequest {
    readonly op: typeof CompanyOp.DepartmentSettings;
    readonly departmentId: string;
    readonly name: string;
    readonly settings: CompanyDepartmentSettings;
}
/** Save a project brief and its initial staffing. */
export interface CompanyDraft extends CompanyRequest {
    readonly sourceProjectId?: string;
    readonly op: typeof CompanyOp.Draft;
    readonly name: string;
    readonly brief: string;
    readonly managerId: string;
    readonly team: readonly string[];
}
/** Change an employee's department and permanent desk. */
export interface CompanyAssign extends CompanyRequest {
    readonly op: typeof CompanyOp.Assign;
    readonly employeeId: string;
    readonly departmentId: string;
    readonly desk: number;
}
/** Update a persistent employee without changing their ID, assignments, or desk. */
export interface CompanyEditEmployee extends CompanyRequest {
    readonly op: typeof CompanyOp.Employee;
    readonly employeeId: string;
    readonly name: string;
    readonly role: string;
    readonly instructions: string;
    readonly settings: CompanyEmployeeSettings;
}
/** One department assigned to a saved team-area placement. */
export interface CompanyTeamArea {
    readonly departmentId: string;
    readonly placementId: number;
}
/** Save a complete bounded floor plan without altering work or employee identity. */
export interface CompanyConstruction extends CompanyRequest {
    /** Omitted preserves saved positions; an empty array restores automatic placement. */
    readonly deskPositions?: readonly OfficeDeskPlacement[];
    /** Omitted preserves valid assignments; an empty list clears every assignment. */
    readonly teams?: readonly CompanyTeamArea[];
    readonly op: typeof CompanyOp.Construction;
    readonly construction: readonly OfficePlacement[];
}
/** Create a draft, revise it, approve saved wording, or retire a procedure. */
export interface CompanyEditProcedure extends CompanyRequest, CompanyProcedureDetails {
    readonly op: typeof CompanyOp.Procedure;
    readonly procedureId: string;
}
/** Commands carry no owner field; the gateway supplies the authenticated principal. */
export type CompanyCommand =
    | CompanyRead
    | CompanyEditProcedure
    | CompanyConstruction
    | CompanyConfigure
    | CompanyHire
    | CompanyCreateDepartment
    | CompanyEditDepartment
    | CompanyDraft
    | CompanyAssign
    | CompanyEditEmployee;
/** Successful response, correlated with its command ID. */
export interface CompanySnapshot {
    readonly version?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    readonly op: typeof CompanyOp.Snapshot;
    readonly id: string;
    readonly state: CompanyState;
}
/** Rejected command; no private state is embedded in errors. */
export interface CompanyError {
    readonly version?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    readonly op: typeof CompanyOp.Error;
    readonly id: string;
    readonly message: string;
}
/** Both directions of the bounded binary company protocol. */
export type CompanyPacket = CompanyCommand | CompanySnapshot | CompanyError;

class Writer {
    #offset = 8;
    #bytes: Uint8Array<ArrayBuffer> = new Uint8Array(1024);
    public reserve(size: number): void {
        if (size < 0 || this.#offset + size > 4 * 1024 * 1024) {
            throw new Error('Company packet exceeds limits');
        }
        if (this.#offset + size > this.#bytes.length) {
            const grown: Uint8Array<ArrayBuffer> = new Uint8Array(
                Math.max(this.#offset + size, this.#bytes.length * 2),
            );
            grown.set(this.#bytes);
            this.#bytes = grown;
        }
    }
    public uint(value: number): void {
        if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
            throw new Error('Invalid company integer');
        }
        this.reserve(4);
        new DataView(this.#bytes.buffer).setUint32(this.#offset, value, true);
        this.#offset += 4;
    }
    public big(value: bigint): void {
        if (value < 0n || value > 0xffffffffffffffffn) {
            throw new Error('Invalid company revision');
        }
        this.reserve(8);
        new DataView(this.#bytes.buffer).setBigUint64(this.#offset, value, true);
        this.#offset += 8;
    }
    public text(value: string): void {
        const bytes: Uint8Array = new TextEncoder().encode(value);
        if (bytes.length > 65536) {
            throw new Error('Company text exceeds limits');
        }
        this.uint(bytes.length);
        this.reserve(bytes.length);
        this.#bytes.set(bytes, this.#offset);
        this.#offset += bytes.length;
    }
    public list<T>(values: readonly T[], write: (value: T) => void): void {
        if (values.length > 256) {
            throw new Error('Too many company records');
        }
        this.uint(values.length);
        for (const value of values) {
            write(value);
        }
    }
    public finish(op: number, version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): Uint8Array<ArrayBuffer> {
        const view: DataView = new DataView(this.#bytes.buffer);
        view.setUint32(0, 0x504d434e, true);
        view.setUint8(4, version);
        view.setUint8(5, op);
        return this.#bytes.slice(0, this.#offset);
    }
}
class Reader {
    #offset = 8;
    readonly #view: DataView;
    readonly #bytes: Uint8Array;
    public constructor(bytes: Uint8Array) {
        this.#bytes = bytes;
        this.#view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }
    public take(size: number): number {
        if (size < 0 || size > this.#bytes.length - this.#offset) {
            throw new Error('Truncated company packet');
        }
        const start: number = this.#offset;
        this.#offset += size;
        return start;
    }
    public uint(): number {
        return this.#view.getUint32(this.take(4), true);
    }
    public big(): bigint {
        return this.#view.getBigUint64(this.take(8), true);
    }
    public text(): string {
        const length: number = this.uint();
        if (length > 65536) {
            throw new Error('Company text exceeds limits');
        }
        const start: number = this.take(length);
        return new TextDecoder('utf-8', { fatal: true }).decode(
            this.#bytes.subarray(start, start + length),
        );
    }
    public list<T>(read: () => T): readonly T[] {
        const count: number = this.uint();
        if (count > 256) {
            throw new Error('Too many company records');
        }
        return Array.from({ length: count }, read);
    }
    public finish(): void {
        if (this.#offset !== this.#bytes.length) {
            throw new Error('Trailing company packet data');
        }
    }
}

/** NCMP v7 adds reviewed reusable procedures, retaining earlier reply layouts. */
export class CompanyProtocol {
    /** Identify a frame without parsing an unrelated Chat or game packet. */
    public static isFrame(bytes: Uint8Array): boolean {
        return (
            bytes.length >= 4 &&
            new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true) ===
                0x504d434e
        );
    }
    /** Encode a command or its response. */
    public static encode(
        packet: CompanyPacket,
        version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = packet.version ?? 8,
    ): Uint8Array<ArrayBuffer> {
        if (
            (version !== 1 &&
                version !== 2 &&
                version !== 3 &&
                version !== 4 &&
                version !== 5 &&
                version !== 6 &&
                version !== 7 &&
                version !== 8) ||
            (version === 1 && packet.op === CompanyOp.Employee)
        ) {
            throw new Error('Employee settings require NCMP v2');
        }
        if (version < 3 && packet.op === CompanyOp.DepartmentSettings) {
            throw new Error('Department settings require NCMP v3');
        }
        if (version < 4 && packet.op === CompanyOp.Construction) {
            throw new Error('Office construction requires NCMP v4');
        }
        if (version < 5 && packet.op === CompanyOp.Draft && packet.sourceProjectId) {
            throw new Error('Follow-up projects require NCMP v5');
        }
        if (version < 6 && packet.op === CompanyOp.Construction && packet.teams !== undefined) {
            throw new Error('Department areas require NCMP v6');
        }
        if (version < 7 && packet.op === CompanyOp.Procedure) {
            throw new Error('Reviewed procedures require NCMP v7');
        }
        if (
            version < 8 &&
            packet.op === CompanyOp.Construction &&
            packet.deskPositions !== undefined
        ) {
            throw new Error('Desk positions require NCMP v8');
        }
        if (!/^[a-zA-Z0-9-]{1,64}$/.test(packet.id)) {
            throw new Error('Invalid company request ID');
        }
        const w: Writer = new Writer();
        w.text(packet.id);
        if (packet.op === CompanyOp.Snapshot) {
            const state: CompanyState = packet.state;
            w.big(state.revision);
            w.text(state.name);
            w.list(state.employees, (employee) => {
                w.text(employee.id);
                w.text(employee.name);
                w.text(employee.role);
                w.text(employee.instructions);
                w.text(employee.departmentId);
                w.uint(employee.desk);
                if (version >= 8) {
                    w.uint(employee.deskPosition ? 1 : 0);
                    if (employee.deskPosition) {
                        this.#writeDesk(w, { desk: employee.desk, ...employee.deskPosition });
                    }
                }
                if (version >= 2) {
                    this.#writeSettings(
                        w,
                        employee.settings ?? { provider: '', model: '', tools: null },
                    );
                }
            });
            w.list(state.departments, (department) => {
                w.text(department.id);
                w.text(department.name);
                if (version >= 3) {
                    this.#writeDepartment(
                        w,
                        department.settings ?? { instructions: '', tools: null },
                    );
                }
                if (version >= 6) {
                    this.#writeArea(w, department.area);
                }
            });
            w.list(state.projects, (project) => {
                w.text(project.id);
                w.text(project.name);
                w.text(project.brief);
                w.text(project.managerId);
                w.list(project.team, (id) => w.text(id));
                if (version >= 5) {
                    w.text(project.source?.projectId ?? '');
                    if (project.source) {
                        w.big(project.source.revision);
                    }
                }
            });
            if (version >= 4) {
                this.#writeConstruction(w, state.construction ?? []);
            }
            if (version >= 7) {
                w.list(state.procedures ?? [], (procedure) => {
                    w.text(procedure.id);
                    this.#writeProcedure(w, procedure);
                    w.big(procedure.approvedAt);
                });
            }
        } else if (packet.op === CompanyOp.Error) {
            w.text(packet.message);
        } else {
            w.big(packet.revision);
            switch (packet.op) {
                case CompanyOp.Procedure:
                    w.text(packet.procedureId);
                    this.#writeProcedure(w, packet);
                    break;
                case CompanyOp.Construction:
                    this.#writeConstruction(w, packet.construction);
                    if (version >= 6) {
                        this.#writeTeams(w, packet.teams);
                    }
                    if (version >= 8) {
                        w.uint(packet.deskPositions === undefined ? 0 : 1);
                        if (packet.deskPositions !== undefined) {
                            OfficeDesks.validate(packet.deskPositions);
                            w.list(packet.deskPositions, (item) => this.#writeDesk(w, item));
                        }
                    }
                    break;
                case CompanyOp.DepartmentSettings:
                    w.text(packet.departmentId);
                    w.text(packet.name);
                    this.#writeDepartment(w, packet.settings);
                    break;
                case CompanyOp.Employee:
                    w.text(packet.employeeId);
                    w.text(packet.name);
                    w.text(packet.role);
                    w.text(packet.instructions);
                    this.#writeSettings(w, packet.settings);
                    break;
                case CompanyOp.Read:
                    break;
                case CompanyOp.Configure:
                case CompanyOp.Department:
                    w.text(packet.name);
                    break;
                case CompanyOp.Hire:
                    w.text(packet.name);
                    w.text(packet.role);
                    w.text(packet.instructions);
                    w.text(packet.departmentId);
                    break;
                case CompanyOp.Draft:
                    w.text(packet.name);
                    w.text(packet.brief);
                    w.text(packet.managerId);
                    w.list(packet.team, (id) => w.text(id));
                    if (version >= 5) {
                        w.text(packet.sourceProjectId ?? '');
                    }
                    break;
                case CompanyOp.Assign:
                    w.text(packet.employeeId);
                    w.text(packet.departmentId);
                    w.uint(packet.desk);
                    break;
                default: {
                    const never: never = packet;
                    throw new Error(`Unknown company command: ${String(never)}`);
                }
            }
        }
        return w.finish(packet.op, version);
    }
    /** Decode at the trust boundary; no JSON, dynamic field names, or executable values. */
    public static decode(bytes: Uint8Array): CompanyPacket {
        if (
            bytes.length < 8 ||
            bytes.length > 4 * 1024 * 1024 ||
            !this.isFrame(bytes) ||
            (bytes[4] !== 1 &&
                bytes[4] !== 2 &&
                bytes[4] !== 3 &&
                bytes[4] !== 4 &&
                bytes[4] !== 5 &&
                bytes[4] !== 6 &&
                bytes[4] !== 7 &&
                bytes[4] !== 8) ||
            bytes[6] !== 0 ||
            bytes[7] !== 0
        ) {
            throw new Error('Invalid company frame');
        }
        const version = bytes[4];
        const r: Reader = new Reader(bytes);
        const id: string = r.text();
        if (!/^[a-zA-Z0-9-]{1,64}$/.test(id)) {
            throw new Error('Invalid company request ID');
        }
        const op: number | undefined = bytes[5];
        let packet: CompanyPacket;
        if (op === CompanyOp.Snapshot) {
            const revision: bigint = r.big();
            const name: string = r.text();
            const employees: readonly CompanyEmployee[] = r.list(() => ({
                id: r.text(),
                name: r.text(),
                role: r.text(),
                instructions: r.text(),
                departmentId: r.text(),
                desk: r.uint(),
                ...(version >= 8 ? this.#readDeskPoint(r) : {}),
                ...(version >= 2 ? { settings: this.#readSettings(r) } : {}),
            }));
            const departments: readonly CompanyDepartment[] = r.list(() => ({
                id: r.text(),
                name: r.text(),
                ...(version >= 3 ? { settings: this.#readDepartment(r) } : {}),
                ...(version >= 6 ? this.#readArea(r) : {}),
            }));
            const projects: readonly CompanyProject[] = r.list(() => ({
                id: r.text(),
                name: r.text(),
                brief: r.text(),
                managerId: r.text(),
                team: r.list(() => r.text()),
                ...(version >= 5 ? this.#readSource(r) : {}),
            }));
            packet = {
                op,
                id,
                state: {
                    revision,
                    name,
                    employees,
                    departments,
                    projects,
                    ...(version >= 4 ? { construction: this.#readConstruction(r) } : {}),
                    ...(version >= 7
                        ? {
                              procedures: r.list(() => ({
                                  id: r.text(),
                                  ...this.#readProcedure(r),
                                  approvedAt: r.big(),
                              })),
                          }
                        : {}),
                },
            };
        } else if (op === CompanyOp.Error) {
            packet = { op, id, message: r.text() };
        } else {
            const revision: bigint = r.big();
            switch (op) {
                case CompanyOp.Procedure:
                    if (version < 7) {
                        throw new Error('Reviewed procedures require NCMP v7');
                    }
                    packet = { op, id, revision, procedureId: r.text(), ...this.#readProcedure(r) };
                    break;
                case CompanyOp.Construction:
                    if (version < 4) {
                        throw new Error('Office construction requires NCMP v4');
                    }
                    packet = {
                        op,
                        id,
                        revision,
                        construction: this.#readConstruction(r),
                        ...(version >= 6 ? this.#readTeams(r) : {}),
                        ...(version >= 8 ? this.#readDesks(r) : {}),
                    };
                    break;
                case CompanyOp.DepartmentSettings:
                    if (version < 3) {
                        throw new Error('Department settings require NCMP v3');
                    }
                    packet = {
                        op,
                        id,
                        revision,
                        departmentId: r.text(),
                        name: r.text(),
                        settings: this.#readDepartment(r),
                    };
                    break;
                case CompanyOp.Employee:
                    if (version < 2) {
                        throw new Error('Employee settings require NCMP v2');
                    }
                    packet = {
                        op,
                        id,
                        revision,
                        employeeId: r.text(),
                        name: r.text(),
                        role: r.text(),
                        instructions: r.text(),
                        settings: this.#readSettings(r),
                    };
                    break;
                case CompanyOp.Read:
                    packet = { op, id, revision };
                    break;
                case CompanyOp.Configure:
                case CompanyOp.Department:
                    packet = { op, id, revision, name: r.text() };
                    break;
                case CompanyOp.Hire:
                    packet = {
                        op,
                        id,
                        revision,
                        name: r.text(),
                        role: r.text(),
                        instructions: r.text(),
                        departmentId: r.text(),
                    };
                    break;
                case CompanyOp.Draft:
                    packet = {
                        op,
                        id,
                        revision,
                        name: r.text(),
                        brief: r.text(),
                        managerId: r.text(),
                        team: r.list(() => r.text()),
                        ...(version >= 5 ? this.#readSourceId(r) : {}),
                    };
                    break;
                case CompanyOp.Assign:
                    packet = {
                        op,
                        id,
                        revision,
                        employeeId: r.text(),
                        departmentId: r.text(),
                        desk: r.uint(),
                    };
                    break;
                default:
                    throw new Error('Unknown company opcode');
            }
        }
        r.finish();
        return version === 8 ? packet : { ...packet, version };
    }
    static #writeDesk(w: Writer, item: OfficeDeskPlacement): void {
        OfficeDesks.validate([item]);
        w.uint(item.desk);
        w.uint(item.x + 128);
        w.uint(item.z + 128);
    }
    static #readDesk(r: Reader): OfficeDeskPlacement {
        const item = { desk: r.uint(), x: r.uint() - 128, z: r.uint() - 128 };
        OfficeDesks.validate([item]);
        return item;
    }
    static #readDeskPoint(r: Reader): Pick<CompanyEmployee, 'deskPosition'> {
        const flag = r.uint();
        if (flag > 1) {
            throw new Error('Invalid desk position flag');
        }
        if (!flag) {
            return {};
        }
        const item = this.#readDesk(r);
        return { deskPosition: { x: item.x, z: item.z } };
    }
    static #readDesks(r: Reader): Pick<CompanyConstruction, 'deskPositions'> {
        const flag = r.uint();
        if (flag > 1) {
            throw new Error('Invalid desk positions flag');
        }
        if (!flag) {
            return {};
        }
        const deskPositions = r.list(() => this.#readDesk(r));
        OfficeDesks.validate(deskPositions);
        return { deskPositions };
    }
    static #writeProcedure(w: Writer, procedure: CompanyProcedureDetails): void {
        w.text(procedure.title);
        w.text(procedure.instructions);
        const scope = ['employee', 'department'].indexOf(procedure.scope);
        const status = ['draft', 'approved', 'retired'].indexOf(procedure.status);
        if (scope < 0 || status < 0) {
            throw new Error('Invalid procedure state');
        }
        w.uint(scope);
        w.text(procedure.targetId);
        w.text(procedure.source.projectId);
        w.big(procedure.source.revision);
        w.uint(status);
    }
    static #readProcedure(r: Reader): CompanyProcedureDetails {
        const title = r.text(),
            instructions = r.text();
        const scope = (['employee', 'department'] as const)[r.uint()];
        const targetId = r.text();
        const source = { projectId: r.text(), revision: r.big() };
        const status = (['draft', 'approved', 'retired'] as const)[r.uint()];
        if (!scope || !status) {
            throw new Error('Invalid procedure state');
        }
        return { title, instructions, scope, targetId, source, status };
    }
    static #writeArea(w: Writer, area: number | undefined): void {
        if (area !== undefined && (!Number.isInteger(area) || area < 0 || area > 255)) {
            throw new Error('Invalid department area');
        }
        w.uint(area === undefined ? 0 : area + 1);
    }
    static #readArea(r: Reader): Pick<CompanyDepartment, 'area'> {
        const area = r.uint();
        if (area > 256) {
            throw new Error('Invalid department area');
        }
        return area ? { area: area - 1 } : {};
    }
    static #writeTeams(w: Writer, teams: readonly CompanyTeamArea[] | undefined): void {
        w.uint(teams === undefined ? 0 : 1);
        if (teams === undefined) {
            return;
        }
        if (teams.length > 16) {
            throw new Error('Too many department areas');
        }
        w.list(teams, (team) => {
            w.text(team.departmentId);
            this.#writeArea(w, team.placementId);
        });
    }
    static #readTeams(r: Reader): Pick<CompanyConstruction, 'teams'> {
        const present = r.uint();
        if (present === 0) {
            return {};
        }
        if (present !== 1) {
            throw new Error('Invalid department areas');
        }
        const teams = r.list(() => {
            const departmentId = r.text();
            const { area } = this.#readArea(r);
            if (area === undefined) {
                throw new Error('Missing department area');
            }
            return { departmentId, placementId: area };
        });
        if (teams.length > 16) {
            throw new Error('Too many department areas');
        }
        return { teams };
    }
    static #readSourceId(r: Reader): Pick<CompanyDraft, 'sourceProjectId'> {
        const sourceProjectId = r.text();
        return sourceProjectId ? { sourceProjectId } : {};
    }
    static #readSource(r: Reader): Pick<CompanyProject, 'source'> {
        const projectId = r.text();
        return projectId ? { source: { projectId, revision: r.big() } } : {};
    }
    static #writeConstruction(w: Writer, items: readonly OfficePlacement[]): void {
        OfficeConstruction.validate(items);
        w.list(items, (item) => {
            w.uint(item.id);
            w.text(item.kind);
            w.uint(item.floor);
            w.uint(item.x + 128);
            w.uint(item.z + 128);
            w.uint(item.rotation);
        });
    }
    static #readConstruction(r: Reader): readonly OfficePlacement[] {
        const items: readonly OfficePlacement[] = r.list(() => ({
            id: r.uint(),
            kind: r.text() as OfficePlacement['kind'],
            floor: r.uint(),
            x: r.uint() - 128,
            z: r.uint() - 128,
            rotation: r.uint(),
        }));
        OfficeConstruction.validate(items);
        return items;
    }
    static #writeDepartment(w: Writer, settings: CompanyDepartmentSettings): void {
        w.text(settings.instructions);
        this.#writeTools(w, settings.tools);
    }
    static #readDepartment(r: Reader): CompanyDepartmentSettings {
        return { instructions: r.text(), tools: this.#readTools(r) };
    }
    static #writeTools(w: Writer, tools: readonly string[] | null): void {
        w.uint(tools === null ? 0 : 1);
        if (tools !== null) {
            w.list(tools, (tool) => w.text(tool));
        }
    }
    static #readTools(r: Reader): readonly string[] | null {
        const mode: number = r.uint();
        if (mode > 1) {
            throw new Error('Invalid company tool mode');
        }
        return mode === 0 ? null : r.list(() => r.text());
    }
    static #writeSettings(w: Writer, settings: CompanyEmployeeSettings): void {
        w.text(settings.provider);
        w.text(settings.model);
        this.#writeTools(w, settings.tools);
    }
    static #readSettings(r: Reader): CompanyEmployeeSettings {
        return { provider: r.text(), model: r.text(), tools: this.#readTools(r) };
    }
}
