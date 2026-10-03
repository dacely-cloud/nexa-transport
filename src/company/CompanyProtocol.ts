// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Operations on the private company channel multiplexed with NGOP and Chat. */
export const CompanyOp = {
    Read: 1,
    Configure: 2,
    Hire: 3,
    Department: 4,
    Draft: 5,
    Assign: 6,
    Employee: 7,
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
    readonly settings?: CompanyEmployeeSettings;
}
/** Organizational area owned by this company. */
export interface CompanyDepartment {
    readonly id: string;
    readonly name: string;
}
/** Persistent project brief ready for planning and execution. */
export interface CompanyProject {
    readonly id: string;
    readonly name: string;
    readonly brief: string;
    readonly managerId: string;
    readonly team: readonly string[];
}
/** Private authoritative company state. Never delivered to office visitors. */
export interface CompanyState {
    readonly name: string;
    readonly revision: bigint;
    readonly employees: readonly CompanyEmployee[];
    readonly departments: readonly CompanyDepartment[];
    readonly projects: readonly CompanyProject[];
}
/** Request identity and optimistic revision are supplied on every command. */
export interface CompanyRequest {
    /** Reply using the original wire layout for older clients. */
    readonly version?: 1;
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
/** Save a project brief and its initial staffing. */
export interface CompanyDraft extends CompanyRequest {
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
/** Commands carry no owner field; the gateway supplies the authenticated principal. */
export type CompanyCommand =
    | CompanyRead
    | CompanyConfigure
    | CompanyHire
    | CompanyCreateDepartment
    | CompanyDraft
    | CompanyAssign
    | CompanyEditEmployee;
/** Successful response, correlated with its command ID. */
export interface CompanySnapshot {
    readonly version?: 1;
    readonly op: typeof CompanyOp.Snapshot;
    readonly id: string;
    readonly state: CompanyState;
}
/** Rejected command; no private state is embedded in errors. */
export interface CompanyError {
    readonly version?: 1;
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
    public finish(op: number, version: 1 | 2): Uint8Array<ArrayBuffer> {
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

/** NCMP v2 adds persistent employee settings while retaining the v1 wire layout. */
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
        version: 1 | 2 = packet.version ?? 2,
    ): Uint8Array<ArrayBuffer> {
        if (
            (version !== 1 && version !== 2) ||
            (version === 1 && packet.op === CompanyOp.Employee)
        ) {
            throw new Error('Employee settings require NCMP v2');
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
                if (version === 2) {
                    this.#writeSettings(
                        w,
                        employee.settings ?? { provider: '', model: '', tools: null },
                    );
                }
            });
            w.list(state.departments, (department) => {
                w.text(department.id);
                w.text(department.name);
            });
            w.list(state.projects, (project) => {
                w.text(project.id);
                w.text(project.name);
                w.text(project.brief);
                w.text(project.managerId);
                w.list(project.team, (id) => w.text(id));
            });
        } else if (packet.op === CompanyOp.Error) {
            w.text(packet.message);
        } else {
            w.big(packet.revision);
            switch (packet.op) {
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
            (bytes[4] !== 1 && bytes[4] !== 2) ||
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
                ...(version === 2 ? { settings: this.#readSettings(r) } : {}),
            }));
            const departments: readonly CompanyDepartment[] = r.list(() => ({
                id: r.text(),
                name: r.text(),
            }));
            const projects: readonly CompanyProject[] = r.list(() => ({
                id: r.text(),
                name: r.text(),
                brief: r.text(),
                managerId: r.text(),
                team: r.list(() => r.text()),
            }));
            packet = { op, id, state: { revision, name, employees, departments, projects } };
        } else if (op === CompanyOp.Error) {
            packet = { op, id, message: r.text() };
        } else {
            const revision: bigint = r.big();
            switch (op) {
                case CompanyOp.Employee:
                    if (version !== 2) {
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
        return version === 1 ? { ...packet, version: 1 } : packet;
    }
    static #writeSettings(w: Writer, settings: CompanyEmployeeSettings): void {
        w.text(settings.provider);
        w.text(settings.model);
        w.uint(settings.tools === null ? 0 : 1);
        if (settings.tools !== null) {
            w.list(settings.tools, (tool) => w.text(tool));
        }
    }
    static #readSettings(r: Reader): CompanyEmployeeSettings {
        const provider = r.text(),
            model = r.text(),
            tools = r.uint();
        if (tools > 1) {
            throw new Error('Invalid employee tool mode');
        }
        return { provider, model, tools: tools === 0 ? null : r.list(() => r.text()) };
    }
}
