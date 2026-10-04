// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';
import {
    CompanyOp,
    type CompanyPacket,
    type CompanyState,
    type EmployeeDetails,
    type ProjectDetails,
    type CompanyEmployee,
    type CompanyDepartment,
    type CompanyProject,
} from './CompanyTypes.js';

/** NCO2 frames carry bounded private company data on the existing Chat socket. */
export class CompanyProtocol {
    static readonly #magic = 0x324f434e;
    /** Recognize only this schema, independently of public office activity and legacy protocols. */
    public static isFrame(bytes: Uint8Array): boolean {
        return (
            bytes.length >= 4 &&
            new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true) ===
                this.#magic
        );
    }
    /** Encode and validate both trusted persistence records and outgoing client requests. */
    public static encode(packet: CompanyPacket): Uint8Array<ArrayBuffer> {
        const w: BinaryWriter = new BinaryWriter(256);
        w.u32(this.#magic).u8(1).u8(packet.op).str(packet.id);
        if (packet.op === CompanyOp.Snapshot) {
            this.#writeState(w, packet.state);
        } else if (packet.op === CompanyOp.LiveSnapshot || packet.op === CompanyOp.Update) {
            w.u64(packet.sequence);
            this.#writeState(w, packet.state);
        } else if (
            packet.op === CompanyOp.Subscribe ||
            packet.op === CompanyOp.Unsubscribe ||
            packet.op === CompanyOp.Stopped
        ) {
            /** Watch control frames carry only their correlation ID. */
        } else if (packet.op === CompanyOp.Error) {
            w.str(packet.message);
        } else {
            w.u64(packet.revision);
            switch (packet.op) {
                case CompanyOp.Read:
                    break;
                case CompanyOp.Configure:
                    w.str(packet.name);
                    break;
                case CompanyOp.Employee:
                    w.str(packet.employeeId);
                    this.#writeEmployee(w, packet);
                    break;
                case CompanyOp.Department:
                    w.str(packet.departmentId).str(packet.name).str(packet.instructions);
                    break;
                case CompanyOp.Project:
                    this.#writeProject(w, packet);
                    break;
            }
        }
        const bytes: Uint8Array<ArrayBuffer> = w.toBytes();
        this.decode(bytes);
        return bytes;
    }
    /** Reject unsupported operations, oversized arrays, malformed UTF-8 and trailing data. */
    public static decode(bytes: Uint8Array): CompanyPacket {
        const r: BinaryReader = new BinaryReader(bytes);
        if (r.u32() !== this.#magic || r.u8() !== 1) {
            throw new Error('Unsupported company protocol');
        }
        const op: number = r.u8();
        const id: string = this.#text(r, 80);
        if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) {
            throw new Error('Invalid company command ID');
        }
        let packet: CompanyPacket;
        if (op === CompanyOp.Snapshot) {
            packet = { op, id, state: this.#readState(r) };
        } else if (op === CompanyOp.LiveSnapshot || op === CompanyOp.Update) {
            packet = { op, id, sequence: r.u64(), state: this.#readState(r) };
        } else if (
            op === CompanyOp.Subscribe ||
            op === CompanyOp.Unsubscribe ||
            op === CompanyOp.Stopped
        ) {
            packet = { op, id };
        } else if (op === CompanyOp.Error) {
            packet = { op, id, message: this.#text(r, 512) };
        } else {
            const revision: bigint = r.u64();
            switch (op) {
                case CompanyOp.Read:
                    packet = { op, id, revision };
                    break;
                case CompanyOp.Configure:
                    packet = { op, id, revision, name: this.#text(r, 80) };
                    break;
                case CompanyOp.Employee:
                    packet = {
                        op,
                        id,
                        revision,
                        employeeId: this.#text(r, 64),
                        ...this.#readEmployee(r),
                    };
                    break;
                case CompanyOp.Department:
                    packet = {
                        op,
                        id,
                        revision,
                        departmentId: this.#text(r, 64),
                        name: this.#text(r, 80),
                        instructions: this.#text(r, 16000),
                    };
                    break;
                case CompanyOp.Project:
                    packet = { op, id, revision, ...this.#readProject(r) };
                    break;
                default:
                    throw new Error('Unknown company operation');
            }
        }
        if (r.remaining) {
            throw new Error('Trailing company data');
        }
        return packet;
    }
    static #text(r: BinaryReader, maximum: number): string {
        const value: string = r.str();
        if (value.length > maximum || value.includes('\0')) {
            throw new Error('Invalid company text');
        }
        return value;
    }
    static #count(r: BinaryReader, maximum: number): number {
        const value: number = r.u32();
        if (value > maximum) {
            throw new Error('Too many company records');
        }
        return value;
    }
    static #strings(w: BinaryWriter, values: readonly string[]): void {
        w.u32(values.length);
        for (const value of values) {
            w.str(value);
        }
    }
    static #readStrings(r: BinaryReader, maximum: number): readonly string[] {
        const count: number = this.#count(r, maximum);
        const values: string[] = [];
        for (let i = 0; i < count; i++) {
            values.push(this.#text(r, 128));
        }
        if (new Set(values).size !== values.length) {
            throw new Error('Duplicate company references');
        }
        return values;
    }
    static #writeEmployee(w: BinaryWriter, value: EmployeeDetails): void {
        w.str(value.name)
            .str(value.role)
            .str(value.instructions)
            .str(value.departmentId)
            .str(value.provider)
            .str(value.model)
            .u8(value.tools === null ? 0 : 1);
        if (value.tools !== null) {
            this.#strings(w, value.tools);
        }
    }
    static #readEmployee(r: BinaryReader): EmployeeDetails {
        const name: string = this.#text(r, 80),
            role: string = this.#text(r, 80),
            instructions: string = this.#text(r, 16000),
            departmentId: string = this.#text(r, 64),
            provider: string = this.#text(r, 128),
            model: string = this.#text(r, 128);
        const flag: number = r.u8();
        if (flag > 1) {
            throw new Error('Invalid employee tool policy');
        }
        return {
            name,
            role,
            instructions,
            departmentId,
            provider,
            model,
            tools: flag ? this.#readStrings(r, 128) : null,
        };
    }
    static #writeProject(w: BinaryWriter, value: ProjectDetails): void {
        w.str(value.name).str(value.brief).str(value.managerId);
        this.#strings(w, value.team);
    }
    static #readProject(r: BinaryReader): ProjectDetails {
        return {
            name: this.#text(r, 120),
            brief: this.#text(r, 16000),
            managerId: this.#text(r, 64),
            team: this.#readStrings(r, 32),
        };
    }
    static #writeState(w: BinaryWriter, state: CompanyState): void {
        w.u64(state.revision).str(state.name).u32(state.employees.length);
        for (const employee of state.employees) {
            w.str(employee.id).u8(employee.desk);
            this.#writeEmployee(w, employee);
        }
        w.u32(state.departments.length);
        for (const team of state.departments) {
            w.str(team.id).str(team.name).str(team.instructions);
        }
        w.u32(state.projects.length);
        for (const project of state.projects) {
            w.str(project.id).u64(project.createdAt);
            this.#writeProject(w, project);
        }
    }
    static #readState(r: BinaryReader): CompanyState {
        const revision: bigint = r.u64(),
            name: string = this.#text(r, 80);
        const employees: CompanyEmployee[] = [],
            departments: CompanyDepartment[] = [],
            projects: CompanyProject[] = [];
        const employeeCount: number = this.#count(r, 224);
        for (let i = 0; i < employeeCount; i++) {
            employees.push({ id: this.#text(r, 64), desk: r.u8(), ...this.#readEmployee(r) });
        }
        const departmentCount: number = this.#count(r, 32);
        for (let i = 0; i < departmentCount; i++) {
            departments.push({
                id: this.#text(r, 64),
                name: this.#text(r, 80),
                instructions: this.#text(r, 16000),
            });
        }
        const projectCount: number = this.#count(r, 128);
        for (let i = 0; i < projectCount; i++) {
            projects.push({ id: this.#text(r, 64), createdAt: r.u64(), ...this.#readProject(r) });
        }
        return { revision, name, employees, departments, projects };
    }
}
