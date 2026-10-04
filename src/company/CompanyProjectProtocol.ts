// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';
import { CompanyWorkCodec } from './CompanyWorkCodec.js';
import type { CompanyAllowance } from './CompanyBudgetTypes.js';
import { ProjectOp, type ProjectPacket } from './CompanyProjectTypes.js';

/** NCP2: binary decisions, ordered full-state updates, and bounded artifact chunks. */
export class CompanyProjectProtocol {
    static readonly #magic: number = 0x3250434e;
    public static readonly chunkBytes: number = 128 * 1024;
    public static readonly fileBytes: number = 4 * 1024 * 1024;
    /** Match this channel without inspecting private content. */
    public static isFrame(bytes: Uint8Array): boolean {
        return (
            bytes.length >= 4 &&
            new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true) ===
                this.#magic
        );
    }
    /** Encode bounded primitives, preserving bigint revisions and USD microcents. */
    public static encode(packet: ProjectPacket): Uint8Array<ArrayBuffer> {
        const w: BinaryWriter = new BinaryWriter(1024);
        w.u32(this.#magic)
            .u8(packet.version ?? 1)
            .u8(packet.op)
            .str(packet.id)
            .str(packet.project);
        switch (packet.op) {
            case ProjectOp.Read:
            case ProjectOp.Subscribe:
            case ProjectOp.Unsubscribe:
            case ProjectOp.Stopped:
                break;
            case ProjectOp.Command: {
                if (packet.command.kind === 'baseline' && packet.version !== 2) {
                    throw new Error('Starting products require project protocol version 2');
                }
                const bytes: Uint8Array = CompanyWorkCodec.command(packet.command);
                w.u32(bytes.length).bytes(bytes);
                break;
            }
            case ProjectOp.File:
                w.str(packet.attempt).str(packet.path);
                break;
            case ProjectOp.Snapshot:
            case ProjectOp.Update: {
                if (packet.state.work.baseline && packet.version !== 2) {
                    throw new Error('Starting products require project protocol version 2');
                }
                const bytes: Uint8Array = CompanyWorkCodec.encode(packet.state.work);
                w.u64(packet.sequence)
                    .u32(bytes.length)
                    .bytes(bytes)
                    .u8(packet.state.allowance === null ? 0 : 1);
                if (packet.state.allowance !== null) {
                    w.u64(packet.state.allowance.revision)
                        .u64(packet.state.allowance.limit)
                        .u64(packet.state.allowance.spent)
                        .u64(packet.state.allowance.reserved)
                        .u32(packet.state.allowance.concurrency);
                }
                break;
            }
            case ProjectOp.Chunk:
                w.u32(packet.offset).u32(packet.total).u32(packet.bytes.length).bytes(packet.bytes);
                break;
            case ProjectOp.Error:
                w.str(packet.message);
                break;
        }
        const bytes: Uint8Array<ArrayBuffer> = w.toBytes();
        this.decode(bytes);
        return bytes;
    }
    /** Reject unknown operations, malformed data, truncation, oversized chunks, and trailing bytes. */
    public static decode(bytes: Uint8Array): ProjectPacket {
        const r: BinaryReader = new BinaryReader(bytes);
        const magic: number = r.u32();
        const version: number = r.u8();
        if (magic !== this.#magic || (version !== 1 && version !== 2)) {
            throw new Error('Unsupported project protocol');
        }
        const op: number = r.u8();
        const id: string = this.#text(r, 80);
        const project: string = this.#text(r, 80);
        if (!/^[a-zA-Z0-9-]{1,80}$/.test(id) || !/^[a-zA-Z0-9-]{1,80}$/.test(project)) {
            throw new Error('Invalid project identity');
        }
        let packet: ProjectPacket;
        switch (op) {
            case ProjectOp.Read:
            case ProjectOp.Subscribe:
            case ProjectOp.Unsubscribe:
            case ProjectOp.Stopped:
                packet = { op, id, project };
                break;
            case ProjectOp.Command:
                packet = {
                    op,
                    id,
                    project,
                    command: CompanyWorkCodec.decodeCommand(r.bytes(r.u32())),
                };
                break;
            case ProjectOp.File:
                packet = { op, id, project, attempt: this.#text(r, 80), path: this.#text(r, 1024) };
                break;
            case ProjectOp.Snapshot:
            case ProjectOp.Update: {
                const sequence: bigint = r.u64();
                const work = CompanyWorkCodec.decode(r.bytes(r.u32()));
                const present: number = r.u8();
                if (work.projectId !== project || present > 1) {
                    throw new Error('Invalid project snapshot');
                }
                const allowance: CompanyAllowance | null =
                    present === 0
                        ? null
                        : {
                              revision: r.u64(),
                              limit: r.u64(),
                              spent: r.u64(),
                              reserved: r.u64(),
                              concurrency: r.u32(),
                          };
                if (
                    allowance !== null &&
                    (allowance.concurrency < 1 || allowance.concurrency > 32)
                ) {
                    throw new Error('Invalid project allowance');
                }
                packet = { op, id, project, sequence, state: { work, allowance } };
                break;
            }
            case ProjectOp.Chunk: {
                const offset: number = r.u32(),
                    total: number = r.u32(),
                    length: number = r.u32();
                if (
                    total > this.fileBytes ||
                    length > this.chunkBytes ||
                    offset + length > total ||
                    (length === 0 && total !== 0)
                ) {
                    throw new Error('Invalid project file chunk');
                }
                packet = { op, id, project, offset, total, bytes: r.bytes(length) };
                break;
            }
            case ProjectOp.Error:
                packet = { op, id, project, message: this.#text(r, 512) };
                break;
            default:
                throw new Error('Unknown project operation');
        }
        if (r.remaining !== 0) {
            throw new Error('Trailing project packet data');
        }
        if (
            version === 1 &&
            ((packet.op === ProjectOp.Command && packet.command.kind === 'baseline') ||
                ((packet.op === ProjectOp.Snapshot || packet.op === ProjectOp.Update) &&
                    packet.state.work.baseline))
        ) {
            throw new Error('Starting products require project protocol version 2');
        }
        return version === 2 ? { ...packet, version: 2 } : packet;
    }
    static #text(r: BinaryReader, maximum: number): string {
        const text: string = r.str();
        if (text.length > maximum || text.includes('\0')) {
            throw new Error('Invalid project text');
        }
        return text;
    }
}
