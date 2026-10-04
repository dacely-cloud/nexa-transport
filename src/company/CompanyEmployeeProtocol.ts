// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';
import {
    EmployeeOp,
    type CompanyEmployeePacket,
    type CompanyEmployeeProject,
} from './CompanyEmployeeTypes.js';
import type { CompanyWorkPhase } from './CompanyWorkTypes.js';

/** NCE1 supplies bounded evidence portfolios without opening another connection or running inference. */
export class CompanyEmployeeProtocol {
    static readonly #magic: number = 0x3145434e;
    static readonly #phases: readonly CompanyWorkPhase[] = [
        'draft',
        'planning',
        'plan-review',
        'running',
        'delivery-review',
        'accepted',
        'blocked',
    ];
    /** Recognize this private family before decoding its contents. */
    public static isFrame(bytes: Uint8Array): boolean {
        return (
            bytes.length >= 4 &&
            new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true) ===
                this.#magic
        );
    }
    /** Encode exact counts and tokens, then validate the complete envelope before sending. */
    public static encode(packet: CompanyEmployeePacket): Uint8Array<ArrayBuffer> {
        const w: BinaryWriter = new BinaryWriter(1024);
        w.u32(this.#magic).u8(1).u8(packet.op).str(packet.id).str(packet.employeeId);
        if (packet.op === EmployeeOp.Snapshot || packet.op === EmployeeOp.Update) {
            if (packet.state.employeeId !== packet.employeeId) {
                throw new Error('Employee report identity mismatch');
            }
            w.u64(packet.sequence).u64(packet.state.revision).u32(packet.state.projects.length);
            for (const project of packet.state.projects) {
                w.str(project.projectId)
                    .str(project.name)
                    .u64(project.revision)
                    .u8(this.#phases.indexOf(project.phase))
                    .u64(project.acceptedAt);
                for (const value of [
                    project.completed,
                    project.blocked,
                    project.interrupted,
                    project.running,
                    project.acceptedTasks,
                    project.repeatedTasks,
                    project.recordedChecks,
                ]) {
                    if (!Number.isInteger(value) || value < 0 || value > 65536) {
                        throw new Error('Invalid employee result count');
                    }
                    w.u32(value);
                }
                for (const value of [project.inputTokens, project.outputTokens]) {
                    if (value < 0n || value > 128n * 0xffffffffffffffffn) {
                        throw new Error('Invalid employee token total');
                    }
                    w.u64(value & 0xffffffffffffffffn).u64(value >> 64n);
                }
            }
        } else if (packet.op === EmployeeOp.Stopped || packet.op === EmployeeOp.Error) {
            w.str(packet.message);
        }
        const bytes: Uint8Array<ArrayBuffer> = w.toBytes();
        this.decode(bytes);
        return bytes;
    }
    /** Reject unknown operations, malformed lists, duplicate projects and trailing bytes. */
    public static decode(bytes: Uint8Array): CompanyEmployeePacket {
        if (bytes.length > 128 * 1024) {
            throw new Error('Employee report is too large');
        }
        const r: BinaryReader = new BinaryReader(bytes);
        if (r.u32() !== this.#magic || r.u8() !== 1) {
            throw new Error('Unsupported employee report protocol');
        }
        const op: number = r.u8(),
            id: string = this.#text(r, 64),
            employeeId: string = this.#text(r, 64);
        if (!id || !employeeId) {
            throw new Error('Missing employee report identity');
        }
        let packet: CompanyEmployeePacket;
        if (
            op === EmployeeOp.Read ||
            op === EmployeeOp.Subscribe ||
            op === EmployeeOp.Unsubscribe
        ) {
            packet = { op, id, employeeId };
        } else if (op === EmployeeOp.Snapshot || op === EmployeeOp.Update) {
            const sequence: bigint = r.u64(),
                revision: bigint = r.u64(),
                count: number = r.u32();
            if (count > 128) {
                throw new Error('Too many employee projects');
            }
            const projects: CompanyEmployeeProject[] = [];
            for (let index: number = 0; index < count; index++) {
                const projectId: string = this.#text(r, 64),
                    name: string = this.#text(r, 120),
                    projectRevision: bigint = r.u64(),
                    phase: CompanyWorkPhase | undefined = this.#phases[r.u8()],
                    acceptedAt: bigint = r.u64();
                if (
                    !projectId ||
                    !name ||
                    !phase ||
                    projects.some((project) => project.projectId === projectId)
                ) {
                    throw new Error('Invalid employee project');
                }
                const completed: number = this.#count(r);
                const blocked: number = this.#count(r);
                const interrupted: number = this.#count(r);
                const running: number = this.#count(r);
                const acceptedTasks: number = this.#count(r);
                const repeatedTasks: number = this.#count(r);
                const recordedChecks: number = this.#count(r);
                const attempts: number = completed + blocked + interrupted + running;
                if (attempts > 128) {
                    throw new Error('Too many employee attempts');
                }
                if (
                    acceptedTasks > completed ||
                    repeatedTasks > Math.floor(attempts / 2) ||
                    recordedChecks > completed * 128
                ) {
                    throw new Error('Inconsistent employee evidence counts');
                }
                if (acceptedTasks > 0 && (phase !== 'accepted' || acceptedAt === 0n)) {
                    throw new Error('Unaccepted employee delivery credit');
                }
                projects.push({
                    projectId,
                    name,
                    revision: projectRevision,
                    phase,
                    acceptedAt,
                    completed,
                    blocked,
                    interrupted,
                    running,
                    acceptedTasks,
                    repeatedTasks,
                    recordedChecks,
                    inputTokens: this.#tokens(r, attempts),
                    outputTokens: this.#tokens(r, attempts),
                });
            }
            packet = { op, id, employeeId, sequence, state: { revision, employeeId, projects } };
        } else if (op === EmployeeOp.Stopped || op === EmployeeOp.Error) {
            packet = { op, id, employeeId, message: this.#text(r, 512) };
        } else {
            throw new Error('Unknown employee report operation');
        }
        if (r.remaining !== 0) {
            throw new Error('Trailing employee report bytes');
        }
        return packet;
    }
    static #count(r: BinaryReader): number {
        const value: number = r.u32();
        if (value > 65536) {
            throw new Error('Invalid employee result count');
        }
        return value;
    }
    static #tokens(r: BinaryReader, attempts: number): bigint {
        const low: bigint = r.u64();
        const high: bigint = r.u64();
        const value: bigint = low | (high << 64n);
        if (value > BigInt(attempts) * 0xffffffffffffffffn) {
            throw new Error('Inconsistent employee token total');
        }
        return value;
    }
    static #text(r: BinaryReader, maximum: number): string {
        const value: string = r.str();
        if (value.length > maximum) {
            throw new Error('Employee report text is too long');
        }
        return value;
    }
}
