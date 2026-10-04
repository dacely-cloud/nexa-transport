// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';
import {
    HostOp,
    type CompanyHostPacket,
    type CompanyHostState,
    type CompanyHostStatus,
} from './CompanyHostTypes.js';

/** Resource reports contain only bounded counts and byte totals; no paths, endpoints or free-form labels. */
export class CompanyHostProtocol {
    static readonly #magic: number = 0x3148434e;
    static readonly #statuses: readonly CompanyHostStatus[] = [
        'local',
        'connected',
        'disconnected',
        'unassigned',
        'unsupported',
        'unavailable',
    ];
    /** Recognize this family before authorizing the private read. */
    public static isFrame(bytes: Uint8Array): boolean {
        return (
            bytes.length >= 4 &&
            new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true) ===
                this.#magic
        );
    }
    /** Validate the same envelope that the receiver accepts before sending. */
    public static encode(packet: CompanyHostPacket): Uint8Array<ArrayBuffer> {
        const w: BinaryWriter = new BinaryWriter(256);
        w.u32(this.#magic).u8(1).u8(packet.op).str(packet.id);
        if (packet.op === HostOp.Snapshot || packet.op === HostOp.Update) {
            const state: CompanyHostState = packet.state;
            this.#validate(state);
            if (packet.sequence < 0n || packet.sequence > 0xffffffffffffffffn) {
                throw new Error('Invalid resource sequence');
            }
            w.u64(packet.sequence)
                .u64(state.revision)
                .u64(state.sampledAt)
                .u8(this.#statuses.indexOf(state.status));
            const flags: number =
                Number(state.parallelism !== undefined) |
                (Number(state.memory !== undefined) << 1) |
                (Number(state.commands !== undefined) << 2);
            w.u8(flags);
            if (state.parallelism !== undefined) {
                w.u32(state.parallelism);
            }
            if (state.memory !== undefined) {
                w.u64(state.memory);
            }
            if (state.commands !== undefined) {
                w.u32(state.commands);
            }
        } else if (packet.op === HostOp.Stopped || packet.op === HostOp.Error) {
            w.str(packet.message);
        }
        const bytes: Uint8Array<ArrayBuffer> = w.toBytes();
        this.decode(bytes);
        return bytes;
    }
    /** Missing, inconsistent, unknown and trailing fields cannot become capacity claims. */
    public static decode(bytes: Uint8Array): CompanyHostPacket {
        if (bytes.length > 1024) {
            throw new Error('Workspace resource packet is too large');
        }
        const r: BinaryReader = new BinaryReader(bytes);
        if (r.u32() !== this.#magic || r.u8() !== 1) {
            throw new Error('Unsupported workspace resource protocol');
        }
        const op: number = r.u8();
        const id: string = r.str();
        if (!id || id.length > 64 || id.includes('\0')) {
            throw new Error('Invalid workspace resource identity');
        }
        let packet: CompanyHostPacket;
        if (op === HostOp.Read || op === HostOp.Subscribe || op === HostOp.Unsubscribe) {
            packet = { op, id };
        } else if (op === HostOp.Snapshot || op === HostOp.Update) {
            const sequence: bigint = r.u64();
            const revision: bigint = r.u64();
            const sampledAt: bigint = r.u64();
            const status: CompanyHostStatus | undefined = this.#statuses[r.u8()];
            const flags: number = r.u8();
            if (!status || flags > 7 || sampledAt === 0n) {
                throw new Error('Invalid workspace resource state');
            }
            const parallelism: number | undefined = flags & 1 ? r.u32() : undefined;
            const memory: bigint | undefined = flags & 2 ? r.u64() : undefined;
            const commands: number | undefined = flags & 4 ? r.u32() : undefined;
            const state: CompanyHostState = {
                revision,
                sampledAt,
                status,
                ...(parallelism === undefined ? {} : { parallelism }),
                ...(memory === undefined ? {} : { memory }),
                ...(commands === undefined ? {} : { commands }),
            };
            this.#validate(state);
            packet = { op, id, sequence, state };
        } else if (op === HostOp.Stopped || op === HostOp.Error) {
            const message: string = r.str();
            if (message.length > 256 || message.includes('\0')) {
                throw new Error('Invalid workspace resource error');
            }
            packet = { op, id, message };
        } else {
            throw new Error('Unknown workspace resource operation');
        }
        if (r.remaining !== 0) {
            throw new Error('Trailing workspace resource bytes');
        }
        return packet;
    }
    static #validate(state: CompanyHostState): void {
        if (
            state.revision < 0n ||
            state.revision > 0xffffffffffffffffn ||
            state.sampledAt <= 0n ||
            state.sampledAt > 0xffffffffffffffffn
        ) {
            throw new Error('Invalid workspace resource revision or time');
        }
        if (state.status === 'local' || state.status === 'connected') {
            if (
                state.parallelism === undefined ||
                !Number.isInteger(state.parallelism) ||
                state.parallelism < 1 ||
                state.parallelism > 65536 ||
                state.memory === undefined ||
                state.memory <= 0n ||
                state.memory > 0xffffffffffffffffn ||
                (state.status === 'local' && state.commands !== undefined) ||
                (state.commands !== undefined &&
                    (!Number.isInteger(state.commands) ||
                        state.commands < 0 ||
                        state.commands > 65536))
            ) {
                throw new Error('Inconsistent workspace capacity');
            }
        } else if (
            !this.#statuses.includes(state.status) ||
            state.parallelism !== undefined ||
            state.memory !== undefined ||
            state.commands !== undefined
        ) {
            throw new Error('Unavailable workspace cannot report resources');
        }
    }
}
