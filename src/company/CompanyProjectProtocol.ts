// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';
import {
    CompanyMaintenanceCodec,
    type CompanyMaintenanceCommand,
    type CompanyMaintenancePolicy,
} from './CompanyMaintenanceTypes.js';
import { CompanyWorkCodec, type CompanyWork, type CompanyWorkCommand } from './CompanyWork.js';
export type {
    CompanyMaintenanceCommand,
    CompanyMaintenancePolicy,
    CompanyMaintenanceRun,
    CompanyMaintenanceSettings,
} from './CompanyMaintenanceTypes.js';

/** Private project messages multiplexed over the authenticated Chat socket. */
export const CompanyProjectOp = {
    Read: 1,
    Command: 2,
    Artifact: 3,
    Subscribe: 4,
    Leave: 5,
    Allowance: 6,
    Employee: 7,
    Ledger: 8,
    Recover: 9,
    Maintenance: 10,
    Snapshot: 128,
    File: 129,
    Error: 130,
    History: 131,
    Spending: 132,
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
    readonly version?: 1 | 2 | 3 | 4;
}
/** An owner records why an interrupted, financially settled assignment may be retried. */
export interface CompanyRecoveryCommand {
    readonly id: string;
    readonly attemptId: string;
    readonly revision: bigint;
    readonly evidence: string;
}
/** Provider-request spending; unknown amounts remain reserved and cannot be edited by a browser. */
export interface CompanySpendingRow {
    readonly sequence: bigint;
    readonly id: string;
    readonly attemptId: string;
    readonly maximum: bigint;
    readonly amount: bigint | null;
    readonly state: 'reserved' | 'dispatched' | 'settled' | 'cancelled';
    readonly provider: string;
    readonly model: string;
    readonly receipt: string;
}
/** A bounded account-owned attempt and any recorded recovery decision. */
export interface CompanyRecoveryRow {
    readonly attemptId: string;
    readonly employeeId: string;
    readonly title: string;
    readonly status: 'running' | 'succeeded' | 'failed' | 'interrupted';
    readonly pending: boolean;
    readonly evidence: string;
    readonly at: bigint;
}
/** Cursor-based private spending history, independent of public office packets. */
export interface CompanySpending extends CompanyProjectWire {
    readonly op: typeof CompanyProjectOp.Spending;
    readonly id: string;
    readonly projectId: string;
    readonly next: bigint;
    readonly charges: readonly CompanySpendingRow[];
    readonly attempts: readonly CompanyRecoveryRow[];
}
/** Requests never contain an owner; the gateway supplies the verified account. */
export type CompanyProjectRequest = CompanyProjectWire &
    (
        | ({
              readonly op: typeof CompanyProjectOp.Maintenance;
              readonly projectId: string;
          } & CompanyMaintenanceCommand)
        | {
              readonly op: typeof CompanyProjectOp.Ledger;
              readonly id: string;
              readonly projectId: string;
              readonly before: bigint;
          }
        | ({
              readonly op: typeof CompanyProjectOp.Recover;
              readonly projectId: string;
          } & CompanyRecoveryCommand)
        | {
              readonly op: typeof CompanyProjectOp.Employee;
              readonly id: string;
              readonly employeeId: string;
          }
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
    /** Present on hosts that support owner-authorized recurring maintenance. */
    readonly maintenance?: CompanyMaintenancePolicy | null;
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
/** Measured project history; counts describe records, not model intelligence. */
export interface CompanyEmployeeHistory extends CompanyProjectWire {
    readonly op: typeof CompanyProjectOp.History;
    readonly id: string;
    readonly employeeId: string;
    readonly asOf: bigint;
    readonly attempts: number;
    readonly completed: number;
    readonly blocked: number;
    readonly running: number;
    readonly reviews: number;
    readonly repeats: number;
    readonly accepted: number;
    readonly inputTokens: bigint;
    readonly outputTokens: bigint;
    readonly recent: readonly CompanyEmployeeRecord[];
}
/** An immutable execution author and evidence from that exact attempt. */
export interface CompanyEmployeeRecord {
    readonly projectId: string;
    readonly projectName: string;
    readonly taskId: string;
    readonly title: string;
    readonly kind: 'plan' | 'work' | 'review' | 'unknown';
    readonly attemptId: string;
    readonly status: 'running' | 'done' | 'blocked';
    readonly started: bigint;
    readonly finished: bigint;
    readonly summary: string;
    readonly evidence: number;
    readonly artifacts: number;
    readonly repeat: boolean;
    readonly accepted: boolean;
}
/** Private operation result. */
export type CompanyProjectResponse = CompanyProjectWire &
    (
        | CompanyProjectSnapshot
        | CompanyProjectFile
        | CompanyEmployeeHistory
        | CompanySpending
        | {
              readonly op: typeof CompanyProjectOp.Error;
              readonly id: string;
              readonly message: string;
          }
    );
/** Both directions of the bounded project protocol. */
export type CompanyProjectPacket = CompanyProjectRequest | CompanyProjectResponse;

/** NCPW v5 adds private owner-authorized recurring maintenance. */
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
        version: 1 | 2 | 3 | 4 | 5 = packet.version ?? 5,
    ): Uint8Array<ArrayBuffer> {
        if (version !== 1 && version !== 2 && version !== 3 && version !== 4 && version !== 5) {
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
        if (
            version < 3 &&
            (packet.op === CompanyProjectOp.Employee || packet.op === CompanyProjectOp.History)
        ) {
            throw new Error('Employee history requires NCPW v3');
        }
        if (
            version < 4 &&
            [CompanyProjectOp.Ledger, CompanyProjectOp.Recover, CompanyProjectOp.Spending].some(
                (op) => op === packet.op,
            )
        ) {
            throw new Error('Project recovery requires NCPW v4');
        }
        this.#id(packet.id);
        if (packet.op === CompanyProjectOp.Maintenance && version < 5) {
            throw new Error('Recurring maintenance requires NCPW v5');
        }
        const w = new BinaryWriter(1024);
        w.u32(0x5750434e).u8(version).u8(packet.op).u8(0).u8(0).str(packet.id);
        if (packet.op === CompanyProjectOp.Snapshot) {
            const work = CompanyWorkCodec.encode(packet.work, version >= 3 ? 2 : 1);
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
            if (version >= 5) {
                const maintenance = packet.maintenance
                    ? CompanyMaintenanceCodec.encode(packet.maintenance)
                    : new Uint8Array();
                w.u32(maintenance.length).bytes(maintenance);
            }
        } else if (packet.op === CompanyProjectOp.Spending) {
            if (packet.charges.length > 50 || packet.attempts.length > 128) {
                throw new Error('Spending history exceeds limits');
            }
            w.str(packet.projectId).u64(packet.next).u8(packet.charges.length);
            for (const row of packet.charges) {
                w.u64(row.sequence)
                    .str(row.id)
                    .str(row.attemptId)
                    .u64(row.maximum)
                    .u8(row.amount === null ? 0 : 1);
                if (row.amount !== null) {
                    w.u64(row.amount);
                }
                w.str(row.state).str(row.provider).str(row.model).str(row.receipt);
            }
            w.u8(packet.attempts.length);
            for (const row of packet.attempts) {
                w.str(row.attemptId)
                    .str(row.employeeId)
                    .str(row.title)
                    .str(row.status)
                    .u8(row.pending ? 1 : 0)
                    .str(row.evidence)
                    .u64(row.at);
            }
        } else if (packet.op === CompanyProjectOp.Employee) {
            this.#employee(packet.employeeId);
            w.str(packet.employeeId);
        } else if (packet.op === CompanyProjectOp.History) {
            this.#employee(packet.employeeId);
            if (packet.recent.length > 20) {
                throw new Error('Employee history exceeds limits');
            }
            w.str(packet.employeeId).u64(packet.asOf);
            for (const count of [
                packet.attempts,
                packet.completed,
                packet.blocked,
                packet.running,
                packet.reviews,
                packet.repeats,
                packet.accepted,
            ]) {
                w.u32(count);
            }
            this.#wide(w, packet.inputTokens);
            this.#wide(w, packet.outputTokens);
            w.u8(packet.recent.length);
            for (const row of packet.recent) {
                w.str(row.projectId)
                    .str(row.projectName)
                    .str(row.taskId)
                    .str(row.title)
                    .str(row.kind)
                    .str(row.attemptId)
                    .str(row.status)
                    .u64(row.started)
                    .u64(row.finished)
                    .str(row.summary)
                    .u32(row.evidence)
                    .u32(row.artifacts)
                    .u8(row.repeat ? 1 : 0)
                    .u8(row.accepted ? 1 : 0);
            }
        } else if (packet.op === CompanyProjectOp.Error) {
            w.str(packet.message);
        } else {
            w.str(packet.projectId);
            if (packet.op === CompanyProjectOp.Maintenance) {
                w.u64(packet.revision);
                CompanyMaintenanceCodec.settings(w, packet);
            } else if (packet.op === CompanyProjectOp.Ledger) {
                w.u64(packet.before);
            } else if (packet.op === CompanyProjectOp.Recover) {
                this.#recovery(packet);
                w.str(packet.attemptId).u64(packet.revision).str(packet.evidence);
            } else if (packet.op === CompanyProjectOp.Allowance) {
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
        if (version !== 1 && version !== 2 && version !== 3 && version !== 4 && version !== 5) {
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
                ...(version >= 3 ? { assignments: true as const } : {}),
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
            if (version >= 5) {
                const length = r.u32();
                if (length > 32768) {
                    throw new Error('Maintenance policy exceeds limits');
                }
                packet = {
                    ...packet,
                    maintenance:
                        length === 0 ? null : CompanyMaintenanceCodec.decode(r.bytes(length)),
                };
            }
        } else if (op === CompanyProjectOp.Spending && version >= 4) {
            const projectId = r.str(),
                next = r.u64(),
                count = r.u8();
            if (count > 50) {
                throw new Error('Spending history exceeds limits');
            }
            const charges: CompanySpendingRow[] = [];
            for (let i = 0; i < count; i++) {
                const sequence = r.u64(),
                    chargeId = r.str(),
                    attemptId = r.str(),
                    maximum = r.u64(),
                    hasAmount = r.u8();
                if (hasAmount > 1) {
                    throw new Error('Invalid spending amount flag');
                }
                const amount = hasAmount === 1 ? r.u64() : null,
                    state = r.str();
                if (
                    state !== 'reserved' &&
                    state !== 'dispatched' &&
                    state !== 'settled' &&
                    state !== 'cancelled'
                ) {
                    throw new Error('Invalid spending state');
                }
                charges.push({
                    sequence,
                    id: chargeId,
                    attemptId,
                    maximum,
                    amount,
                    state,
                    provider: r.str(),
                    model: r.str(),
                    receipt: r.str(),
                });
            }
            const attemptCount = r.u8();
            if (attemptCount > 128) {
                throw new Error('Recovery history exceeds limits');
            }
            const attempts: CompanyRecoveryRow[] = [];
            for (let i = 0; i < attemptCount; i++) {
                const attemptId = r.str(),
                    employeeId = r.str(),
                    title = r.str(),
                    status = r.str(),
                    pending = r.u8();
                if (
                    pending > 1 ||
                    (status !== 'running' &&
                        status !== 'succeeded' &&
                        status !== 'failed' &&
                        status !== 'interrupted')
                ) {
                    throw new Error('Invalid recovery state');
                }
                attempts.push({
                    attemptId,
                    employeeId,
                    title,
                    status,
                    pending: pending === 1,
                    evidence: r.str(),
                    at: r.u64(),
                });
            }
            packet = { op, id, projectId, next, charges, attempts };
        } else if (op === CompanyProjectOp.Employee && version >= 3) {
            const employeeId = r.str();
            this.#employee(employeeId);
            packet = { op, id, employeeId };
        } else if (op === CompanyProjectOp.History && version >= 3) {
            const employeeId = r.str();
            this.#employee(employeeId);
            const asOf = r.u64(),
                attempts = r.u32(),
                completed = r.u32(),
                blocked = r.u32(),
                running = r.u32(),
                reviews = r.u32(),
                repeats = r.u32(),
                accepted = r.u32();
            const inputTokens = r.u64() | (r.u64() << 64n),
                outputTokens = r.u64() | (r.u64() << 64n);
            const count = r.u8();
            if (count > 20) {
                throw new Error('Employee history exceeds limits');
            }
            const recent: CompanyEmployeeRecord[] = [];
            for (let i = 0; i < count; i++) {
                const projectId = r.str(),
                    projectName = r.str(),
                    taskId = r.str(),
                    title = r.str(),
                    kind = r.str(),
                    attemptId = r.str(),
                    status = r.str();
                if (
                    (kind !== 'plan' &&
                        kind !== 'work' &&
                        kind !== 'review' &&
                        kind !== 'unknown') ||
                    (status !== 'running' && status !== 'done' && status !== 'blocked')
                ) {
                    throw new Error('Invalid employee history state');
                }
                const started = r.u64(),
                    finished = r.u64(),
                    summary = r.str(),
                    evidence = r.u32(),
                    artifacts = r.u32(),
                    repeat = r.u8(),
                    accepted = r.u8();
                if (repeat > 1 || accepted > 1) {
                    throw new Error('Invalid employee history flag');
                }
                recent.push({
                    projectId,
                    projectName,
                    taskId,
                    title,
                    kind,
                    attemptId,
                    status,
                    started,
                    finished,
                    summary,
                    evidence,
                    artifacts,
                    repeat: repeat === 1,
                    accepted: accepted === 1,
                });
            }
            packet = {
                op,
                id,
                employeeId,
                asOf,
                attempts,
                completed,
                blocked,
                running,
                reviews,
                repeats,
                accepted,
                inputTokens,
                outputTokens,
                recent,
            };
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
            } else if (op === CompanyProjectOp.Maintenance && version >= 5) {
                packet = {
                    op,
                    id,
                    projectId,
                    revision: r.u64(),
                    ...CompanyMaintenanceCodec.readSettings(r),
                };
            } else if (op === CompanyProjectOp.Ledger && version >= 4) {
                packet = { op, id, projectId, before: r.u64() };
            } else if (op === CompanyProjectOp.Recover && version >= 4) {
                packet = {
                    op,
                    id,
                    projectId,
                    attemptId: r.str(),
                    revision: r.u64(),
                    evidence: r.str(),
                };
                this.#recovery(packet);
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
                if (kind === 'assign' && version >= 3) {
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
        return version === 5 ? packet : { ...packet, version };
    }
    static #recovery(command: CompanyRecoveryCommand): void {
        this.#id(command.attemptId);
        if (!command.evidence.trim() || command.evidence.length > 16000) {
            throw new Error('Recovery requires evidence of the checked outcome');
        }
    }
    static #employee(id: string): void {
        if (!id || id.length > 128) {
            throw new Error('Invalid employee identity');
        }
    }
    static #wide(w: BinaryWriter, value: bigint): void {
        if (value < 0n || value >= 1n << 128n) {
            throw new Error('Invalid employee usage total');
        }
        w.u64(value & 0xffffffffffffffffn).u64(value >> 64n);
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
