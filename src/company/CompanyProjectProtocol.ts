// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';
import { CompanyWorkCodec, type CompanyWork, type CompanyWorkCommand } from './CompanyWork.js';

/** Private project messages multiplexed over the authenticated Chat socket. */
export const CompanyProjectOp = {
    Read: 1,
    Command: 2,
    Artifact: 3,
    Subscribe: 4,
    Leave: 5,
    Allowance: 6,
    Snapshot: 128,
    File: 129,
    Error: 130,
} as const;
/** Real usage and commitments, independently versioned from project work. */
export interface CompanyProjectBudget {
    readonly revision: bigint;
    readonly limit: bigint;
    readonly spent: bigint;
    readonly reserved: bigint;
    readonly concurrency: number;
}
/** Live owner dispatch controls. Pausing lets assignments already running finish. */
export interface CompanyProjectSchedule {
    readonly paused: boolean;
    readonly priority: number;
}
/** An allowance change is deduplicated by its own stable ID and financial revision. */
export interface CompanyAllowanceCommand {
    readonly id: string;
    readonly revision: bigint;
    readonly limit: bigint;
    readonly concurrency: number;
}
/** Retain the requested wire version for replies to older clients. */
export interface CompanyProjectWire {
    readonly version?: 1 | 2;
}
/** Requests never contain an owner; the gateway supplies the verified account. */
export type CompanyProjectRequest = CompanyProjectWire &
    (
        | ({
              readonly op: typeof CompanyProjectOp.Allowance;
              readonly projectId: string;
          } & CompanyAllowanceCommand)
        | {
              readonly op:
                  | typeof CompanyProjectOp.Read
                  | typeof CompanyProjectOp.Subscribe
                  | typeof CompanyProjectOp.Leave;
              readonly id: string;
              readonly projectId: string;
          }
        | {
              readonly op: typeof CompanyProjectOp.Command;
              readonly id: string;
              readonly projectId: string;
              readonly command: CompanyWorkCommand;
          }
        | {
              readonly op: typeof CompanyProjectOp.Artifact;
              readonly id: string;
              readonly projectId: string;
              readonly attemptId: string;
              readonly path: string;
              readonly offset: number;
          }
    );
/** Complete owner-only work state with current spending. */
export interface CompanyProjectSnapshot extends CompanyProjectWire {
    readonly op: typeof CompanyProjectOp.Snapshot;
    readonly id: string;
    readonly work: CompanyWork;
    readonly budget: CompanyProjectBudget | null;
    readonly schedule?: CompanyProjectSchedule;
    /** This host supports reassignment and immutable execution authors. */
    readonly assignments?: true;
}
/** A bounded slice of a host-resolved captured delivery, never an arbitrary filesystem read. */
export interface CompanyProjectFile extends CompanyProjectWire {
    readonly op: typeof CompanyProjectOp.File;
    readonly id: string;
    readonly projectId: string;
    readonly attemptId: string;
    readonly path: string;
    readonly digest: string;
    readonly total: number;
    readonly offset: number;
    readonly bytes: Uint8Array;
}
/** Private operation result. */
export type CompanyProjectResponse = CompanyProjectWire &
    (
        | CompanyProjectSnapshot
        | CompanyProjectFile
        | {
              readonly op: typeof CompanyProjectOp.Error;
              readonly id: string;
              readonly message: string;
          }
    );
/** Both directions of the bounded project protocol. */
export type CompanyProjectPacket = CompanyProjectRequest | CompanyProjectResponse;

/** NCPW v3 preserves execution authors and adds reassignment; older clients retain their wire layout. */
export class CompanyProjectProtocol {
    /** One response carries at most 64 KiB of artifact bytes. */
    public static readonly chunkBytes = 65536;
    /** Identify this family without interpreting unrelated game or Chat frames. */
    public static isFrame(bytes: Uint8Array): boolean {
        return (
            bytes.length >= 4 &&
            new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true) ===
                0x5750434e
        );
    }
    /** Encode one request or result. */
    public static encode(
        packet: CompanyProjectPacket,
        version: 1 | 2 | 3 = packet.version ?? 3,
    ): Uint8Array<ArrayBuffer> {
        if (version !== 1 && version !== 2 && version !== 3) {
            throw new Error('Unsupported project packet');
        }
        if (
            version === 1 &&
            (packet.op === CompanyProjectOp.Allowance ||
                (packet.op === CompanyProjectOp.Command && packet.command.kind === 'schedule'))
        ) {
            throw new Error('Project controls require NCPW v2');
        }
        if (
            version < 3 &&
            packet.op === CompanyProjectOp.Command &&
            packet.command.kind === 'assign'
        ) {
            throw new Error('Project reassignment requires NCPW v3');
        }
        this.#id(packet.id);
        const w = new BinaryWriter(1024);
        w.u32(0x5750434e).u8(version).u8(packet.op).u8(0).u8(0).str(packet.id);
        if (packet.op === CompanyProjectOp.Snapshot) {
            const work = CompanyWorkCodec.encode(packet.work, version === 3 ? 2 : 1);
            w.u32(work.length)
                .bytes(work)
                .u8(packet.budget === null ? 0 : 1);
            if (packet.budget !== null) {
                w.u64(packet.budget.revision)
                    .u64(packet.budget.limit)
                    .u64(packet.budget.spent)
                    .u64(packet.budget.reserved)
                    .u32(packet.budget.concurrency);
            }
            if (version >= 2) {
                const schedule = packet.schedule ?? { paused: false, priority: 1 };
                this.#schedule(schedule);
                w.u8(schedule.paused ? 1 : 0).u8(schedule.priority);
            }
        } else if (packet.op === CompanyProjectOp.Error) {
            w.str(packet.message);
        } else {
            w.str(packet.projectId);
            if (packet.op === CompanyProjectOp.Allowance) {
                w.u64(packet.revision).u64(packet.limit).u32(packet.concurrency);
            } else if (packet.op === CompanyProjectOp.Command) {
                const command = packet.command;
                if (command.id !== packet.id) {
                    throw new Error('Mismatched project command identity');
                }
                w.str(command.kind).u64(command.revision);
                if (command.kind === 'assign') {
                    w.str(command.taskId).str(command.employeeId);
                } else if (command.kind === 'schedule') {
                    this.#schedule(command);
                    w.u8(command.paused ? 1 : 0).u8(command.priority);
                } else if (command.kind === 'plan' || command.kind === 'approve') {
                    w.u64(command.limit)
                        .u64(command.allowanceRevision)
                        .u32(command.concurrency)
                        .u32(command.maxIterations);
                    if (command.kind === 'plan') {
                        w.str(command.reviewerId);
                    }
                } else {
                    w.str(command.kind === 'correct' ? command.feedback : command.evidence);
                }
            } else if (
                packet.op === CompanyProjectOp.Artifact ||
                packet.op === CompanyProjectOp.File
            ) {
                w.str(packet.attemptId).str(packet.path).u32(packet.offset);
                if (packet.op === CompanyProjectOp.File) {
                    this.#file(packet);
                    w.str(packet.digest)
                        .u32(packet.total)
                        .u32(packet.bytes.length)
                        .bytes(packet.bytes);
                }
            }
        }
        return w.toBytes();
    }
    /** Validate before routing; unknown operations, invalid UTF-8, and trailing data are rejected. */
    public static decode(bytes: Uint8Array): CompanyProjectPacket {
        const r = new BinaryReader(bytes);
        if (r.u32() !== 0x5750434e) {
            throw new Error('Unsupported project packet');
        }
        const version = r.u8();
        if (version !== 1 && version !== 2 && version !== 3) {
            throw new Error('Unsupported project packet');
        }
        const op = r.u8();
        if (r.u8() !== 0 || r.u8() !== 0) {
            throw new Error('Invalid project header');
        }
        const id = r.str();
        this.#id(id);
        let packet: CompanyProjectPacket;
        if (op === CompanyProjectOp.Snapshot) {
            const size = r.u32();
            if (size > 2 * 1024 * 1024) {
                throw new Error('Project snapshot exceeds limits');
            }
            const work = CompanyWorkCodec.decode(r.bytes(size));
            const hasBudget = r.u8();
            if (hasBudget > 1) {
                throw new Error('Invalid project budget flag');
            }
            const budget =
                hasBudget === 0
                    ? null
                    : {
                          revision: r.u64(),
                          limit: r.u64(),
                          spent: r.u64(),
                          reserved: r.u64(),
                          concurrency: r.u32(),
                      };
            packet = {
                op,
                id,
                work,
                budget,
                ...(version === 3 ? { assignments: true as const } : {}),
            };
            if (version >= 2) {
                const paused = r.u8(),
                    priority = r.u8();
                if (paused > 1) {
                    throw new Error('Invalid project pause flag');
                }
                const schedule = { paused: paused === 1, priority };
                this.#schedule(schedule);
                packet = { ...packet, schedule };
            }
        } else if (op === CompanyProjectOp.Error) {
            packet = { op, id, message: r.str() };
        } else {
            const projectId = r.str();
            if (!projectId || projectId.length > 128) {
                throw new Error('Invalid project identity');
            }
            if (
                op === CompanyProjectOp.Read ||
                op === CompanyProjectOp.Subscribe ||
                op === CompanyProjectOp.Leave
            ) {
                packet = { op, id, projectId };
            } else if (op === CompanyProjectOp.Allowance && version >= 2) {
                packet = {
                    op,
                    id,
                    projectId,
                    revision: r.u64(),
                    limit: r.u64(),
                    concurrency: r.u32(),
                };
            } else if (op === CompanyProjectOp.Command) {
                const kind = r.str();
                const revision = r.u64();
                let command: CompanyWorkCommand;
                if (kind === 'assign' && version === 3) {
                    command = { kind, id, revision, taskId: r.str(), employeeId: r.str() };
                } else if (kind === 'schedule' && version >= 2) {
                    const paused = r.u8(),
                        priority = r.u8();
                    if (paused > 1) {
                        throw new Error('Invalid project pause flag');
                    }
                    command = { kind, id, revision, paused: paused === 1, priority };
                    this.#schedule(command);
                } else if (kind === 'plan' || kind === 'approve') {
                    const limit = r.u64(),
                        allowanceRevision = r.u64(),
                        concurrency = r.u32(),
                        maxIterations = r.u32();
                    command =
                        kind === 'plan'
                            ? {
                                  kind,
                                  id,
                                  revision,
                                  limit,
                                  allowanceRevision,
                                  concurrency,
                                  maxIterations,
                                  reviewerId: r.str(),
                              }
                            : {
                                  kind,
                                  id,
                                  revision,
                                  limit,
                                  allowanceRevision,
                                  concurrency,
                                  maxIterations,
                              };
                } else if (kind === 'correct') {
                    command = { kind, id, revision, feedback: r.str() };
                } else if (kind === 'accept') {
                    command = { kind, id, revision, evidence: r.str() };
                } else {
                    throw new Error('Unknown project command');
                }
                packet = { op, id, projectId, command };
            } else if (op === CompanyProjectOp.Artifact || op === CompanyProjectOp.File) {
                const attemptId = r.str(),
                    path = r.str(),
                    offset = r.u32();
                if (op === CompanyProjectOp.Artifact) {
                    packet = { op, id, projectId, attemptId, path, offset };
                } else {
                    const digest = r.str(),
                        total = r.u32(),
                        size = r.u32();
                    if (size > this.chunkBytes) {
                        throw new Error('Project file chunk exceeds limits');
                    }
                    packet = {
                        op,
                        id,
                        projectId,
                        attemptId,
                        path,
                        offset,
                        digest,
                        total,
                        bytes: r.bytes(size),
                    };
                    this.#file(packet);
                }
            } else {
                throw new Error('Unknown project opcode');
            }
        }
        if (r.remaining !== 0) {
            throw new Error('Trailing project packet data');
        }
        return version < 3 ? { ...packet, version: version as 1 | 2 } : packet;
    }
    static #schedule(schedule: CompanyProjectSchedule): void {
        if (
            typeof schedule.paused !== 'boolean' ||
            !Number.isInteger(schedule.priority) ||
            schedule.priority < 0 ||
            schedule.priority > 2
        ) {
            throw new Error('Invalid project schedule');
        }
    }
    static #id(id: string): void {
        if (!/^[a-zA-Z0-9-]{1,64}$/.test(id)) {
            throw new Error('Invalid project request identity');
        }
    }
    static #file(file: CompanyProjectFile): void {
        if (
            !/^[a-f0-9]{64}$/.test(file.digest) ||
            file.total > 4 * 1024 * 1024 ||
            file.bytes.length > this.chunkBytes ||
            file.offset > file.total ||
            file.offset + file.bytes.length > file.total ||
            (file.bytes.length === 0 && file.offset !== file.total)
        ) {
            throw new Error('Invalid project file chunk');
        }
    }
}
