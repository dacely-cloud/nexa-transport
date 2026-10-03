// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';
import { CompanyWorkCodec, type CompanyWork, type CompanyWorkCommand } from './CompanyWork.js';

/** Private project messages multiplexed over the authenticated Chat socket. */
export const CompanyProjectOp = {
    Read: 1,
    Command: 2,
    Artifact: 3,
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
/** Requests never contain an owner; the gateway supplies the verified account. */
export type CompanyProjectRequest =
    | { readonly op: typeof CompanyProjectOp.Read; readonly id: string; readonly projectId: string }
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
      };
/** Complete owner-only work state with current spending. */
export interface CompanyProjectSnapshot {
    readonly op: typeof CompanyProjectOp.Snapshot;
    readonly id: string;
    readonly work: CompanyWork;
    readonly budget: CompanyProjectBudget | null;
}
/** A bounded slice of a host-resolved captured delivery, never an arbitrary filesystem read. */
export interface CompanyProjectFile {
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
export type CompanyProjectResponse =
    | CompanyProjectSnapshot
    | CompanyProjectFile
    | { readonly op: typeof CompanyProjectOp.Error; readonly id: string; readonly message: string };
/** Both directions of the bounded project protocol. */
export type CompanyProjectPacket = CompanyProjectRequest | CompanyProjectResponse;

/** NCPW v1 retains exact monetary integers and fixed schemas without JSON serialization. */
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
    public static encode(packet: CompanyProjectPacket): Uint8Array<ArrayBuffer> {
        this.#id(packet.id);
        const w = new BinaryWriter(1024);
        w.u32(0x5750434e).u8(1).u8(packet.op).u8(0).u8(0).str(packet.id);
        if (packet.op === CompanyProjectOp.Snapshot) {
            const work = CompanyWorkCodec.encode(packet.work);
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
        } else if (packet.op === CompanyProjectOp.Error) {
            w.str(packet.message);
        } else {
            w.str(packet.projectId);
            if (packet.op === CompanyProjectOp.Command) {
                const command = packet.command;
                if (command.id !== packet.id) {
                    throw new Error('Mismatched project command identity');
                }
                w.str(command.kind).u64(command.revision);
                if (command.kind === 'plan' || command.kind === 'approve') {
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
        if (r.u32() !== 0x5750434e || r.u8() !== 1) {
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
            packet = { op, id, work, budget };
        } else if (op === CompanyProjectOp.Error) {
            packet = { op, id, message: r.str() };
        } else {
            const projectId = r.str();
            if (!projectId || projectId.length > 128) {
                throw new Error('Invalid project identity');
            }
            if (op === CompanyProjectOp.Read) {
                packet = { op, id, projectId };
            } else if (op === CompanyProjectOp.Command) {
                const kind = r.str();
                const revision = r.u64();
                let command: CompanyWorkCommand;
                if (kind === 'plan' || kind === 'approve') {
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
        return packet;
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
