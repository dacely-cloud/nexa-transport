// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';

/** Explicit publication over the existing socket, separate from private company records. */
export const ShowroomOp = {
    Read: 1,
    Publish: 2,
    Withdraw: 3,
    Preview: 4,
    Catalog: 128,
    Content: 129,
    Error: 130,
} as const;
/** Formats allowed for isolated, self-contained public previews. */
export type ShowroomFormat = 'html' | 'text' | 'png' | 'jpeg' | 'webp';
/** Public copy and content identity only; no project, attempt, path or account identifiers. */
export interface ShowroomEntry {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly format: ShowroomFormat;
    readonly digest: string;
    readonly bytes: number;
    readonly publishedAt: bigint;
}
/** The server derives the company owner exclusively from the authenticated connection. */
export type ShowroomRequest =
    | { readonly op: typeof ShowroomOp.Read; readonly id: string }
    | { readonly op: typeof ShowroomOp.Preview; readonly id: string; readonly entryId: string }
    | {
          readonly op: typeof ShowroomOp.Withdraw;
          readonly id: string;
          readonly revision: bigint;
          readonly entryId: string;
      }
    | {
          readonly op: typeof ShowroomOp.Publish;
          readonly id: string;
          readonly revision: bigint;
          readonly projectId: string;
          readonly sourceRevision: bigint;
          readonly attemptId: string;
          readonly path: string;
          readonly title: string;
          readonly description: string;
      };
/** A snapshot contains only currently published entries. */
export interface ShowroomCatalog {
    readonly op: typeof ShowroomOp.Catalog;
    readonly id: string;
    readonly revision: bigint;
    readonly entries: readonly ShowroomEntry[];
}
/** Content is a publication copy, never an unrestricted artifact read. */
export interface ShowroomContent {
    readonly op: typeof ShowroomOp.Content;
    readonly id: string;
    readonly entryId: string;
    readonly digest: string;
    readonly bytes: Uint8Array;
}
/** Bounded binary requests and responses. */
export type ShowroomPacket =
    | ShowroomRequest
    | ShowroomCatalog
    | ShowroomContent
    | { readonly op: typeof ShowroomOp.Error; readonly id: string; readonly message: string };

/** NSHW v1: little-endian, length-prefixed UTF-8, explicit operation and bounded payload. */
export class CompanyShowroomProtocol {
    public static readonly MAX_PREVIEW = 1024 * 1024;
    public static readonly MAX_ENTRIES = 16;
    static readonly #formats: readonly ShowroomFormat[] = ['html', 'text', 'png', 'jpeg', 'webp'];
    /** Inspect only the fixed magic; decoding validates the rest. */
    public static isFrame(bytes: Uint8Array): boolean {
        return (
            bytes.length >= 4 &&
            bytes[0] === 78 &&
            bytes[1] === 83 &&
            bytes[2] === 72 &&
            bytes[3] === 87
        );
    }
    /** Encode and validate a complete packet, including direct in-process callers. */
    public static encode(packet: ShowroomPacket): Uint8Array<ArrayBuffer> {
        const w = new BinaryWriter(512);
        w.bytes(new Uint8Array([78, 83, 72, 87, 1]))
            .u8(packet.op)
            .str(packet.id);
        switch (packet.op) {
            case ShowroomOp.Read:
                break;
            case ShowroomOp.Preview:
                w.str(packet.entryId);
                break;
            case ShowroomOp.Withdraw:
                w.u64(packet.revision).str(packet.entryId);
                break;
            case ShowroomOp.Publish:
                w.u64(packet.revision)
                    .str(packet.projectId)
                    .u64(packet.sourceRevision)
                    .str(packet.attemptId)
                    .str(packet.path)
                    .str(packet.title)
                    .str(packet.description);
                break;
            case ShowroomOp.Catalog:
                w.u64(packet.revision).u8(packet.entries.length);
                for (const entry of packet.entries) {
                    w.str(entry.id)
                        .str(entry.title)
                        .str(entry.description)
                        .u8(this.#formats.indexOf(entry.format))
                        .str(entry.digest)
                        .u32(entry.bytes)
                        .u64(entry.publishedAt);
                }
                break;
            case ShowroomOp.Content:
                w.str(packet.entryId)
                    .str(packet.digest)
                    .u32(packet.bytes.length)
                    .bytes(packet.bytes);
                break;
            case ShowroomOp.Error:
                w.str(packet.message);
                break;
        }
        const bytes = w.toBytes();
        this.decode(bytes);
        return bytes;
    }
    /** Reject unknown operations, oversized fields, trailing bytes and invalid content identities. */
    public static decode(bytes: Uint8Array): ShowroomPacket {
        if (!this.isFrame(bytes) || bytes.length > this.MAX_PREVIEW + 16384) {
            throw new Error('Invalid showroom packet');
        }
        const r = new BinaryReader(bytes);
        r.bytes(4);
        if (r.u8() !== 1) {
            throw new Error('Unsupported showroom version');
        }
        const op = r.u8();
        const text = (maximum: number, empty = false): string => {
            const value = r.str();
            if ((!empty && !value) || value.length > maximum) {
                throw new Error('Invalid showroom field');
            }
            return value;
        };
        const digest = (): string => {
            const value = text(64);
            if (!/^[a-f0-9]{64}$/.test(value)) {
                throw new Error('Invalid preview digest');
            }
            return value;
        };
        const size = (): number => {
            const value = r.u32();
            if (value > this.MAX_PREVIEW) {
                throw new Error('Preview exceeds 1 MiB');
            }
            return value;
        };
        const id = text(128);
        let packet: ShowroomPacket;
        switch (op) {
            case ShowroomOp.Read:
                packet = { op, id };
                break;
            case ShowroomOp.Preview:
                packet = { op, id, entryId: text(128) };
                break;
            case ShowroomOp.Withdraw:
                packet = { op, id, revision: r.u64(), entryId: text(128) };
                break;
            case ShowroomOp.Publish:
                packet = {
                    op,
                    id,
                    revision: r.u64(),
                    projectId: text(128),
                    sourceRevision: r.u64(),
                    attemptId: text(128),
                    path: text(1024),
                    title: text(80),
                    description: text(1200, true),
                };
                break;
            case ShowroomOp.Catalog: {
                const revision = r.u64(),
                    count = r.u8();
                if (count > this.MAX_ENTRIES) {
                    throw new Error('Too many showroom entries');
                }
                const entries: ShowroomEntry[] = [];
                for (let i = 0; i < count; i++) {
                    const entryId = text(128),
                        title = text(80),
                        description = text(1200, true);
                    const format = this.#formats[r.u8()];
                    if (!format) {
                        throw new Error('Invalid preview format');
                    }
                    entries.push({
                        id: entryId,
                        title,
                        description,
                        format,
                        digest: digest(),
                        bytes: size(),
                        publishedAt: r.u64(),
                    });
                }
                if (new Set(entries.map((entry) => entry.id)).size !== entries.length) {
                    throw new Error('Duplicate showroom entry');
                }
                packet = { op, id, revision, entries };
                break;
            }
            case ShowroomOp.Content:
                packet = { op, id, entryId: text(128), digest: digest(), bytes: r.bytes(size()) };
                break;
            case ShowroomOp.Error:
                packet = { op, id, message: text(2000) };
                break;
            default:
                throw new Error('Unknown showroom operation');
        }
        if (r.remaining) {
            throw new Error('Trailing showroom bytes');
        }
        return packet;
    }
}
