// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { CompanyProjectProtocol } from '../company/CompanyProjectProtocol.js';
import { ProjectOp, type ProjectPacket } from '../company/CompanyProjectTypes.js';
import { InboundCapacity } from './InboundCapacity.js';
import type { BinaryChunkTransfer } from '../media/BinaryChunkTransfer.js';
import type { BinaryChunkReceipt } from '../media/interface/BinaryChunkReceipt.js';
import { BinaryAdmissionError } from '../media/BinaryAdmissionError.js';
import { TransportError, TransportErrorCode } from './TransportError.js';

/** Owns incremental SDK file storage through the channel's correlated request lifetime. */
export class ProjectFileTransfer {
    #incoming: BinaryChunkTransfer | null = null;
    #finished: boolean = false;

    /** Uses the same authority as decoded packets and unread chat events. */
    public constructor(public readonly input: InboundCapacity) {}

    /** Validates forward progress and stable totals before acquiring or copying storage. */
    public accept(packet: ProjectPacket): Uint8Array<ArrayBuffer> | null {
        if (
            this.#finished ||
            packet.op !== ProjectOp.Chunk ||
            !Number.isSafeInteger(packet.total) ||
            packet.total < 0 ||
            packet.total > CompanyProjectProtocol.fileBytes ||
            !Number.isSafeInteger(packet.offset) ||
            packet.offset < 0 ||
            packet.bytes.byteLength > CompanyProjectProtocol.chunkBytes ||
            packet.bytes.byteLength > packet.total - packet.offset ||
            packet.offset !== (this.#incoming?.offset ?? 0) ||
            (this.#incoming !== null && this.#incoming.total !== packet.total) ||
            (packet.total > 0 && packet.bytes.byteLength === 0)
        ) {
            throw new Error('Invalid or out-of-order delivery chunk');
        }
        if (packet.total === 0) {
            this.#finished = true;
            return new Uint8Array(0);
        }
        try {
            if (this.#incoming === null) {
                this.#incoming = this.input.transfer(
                    packet.id,
                    packet.total,
                    packet.bytes.byteLength,
                );
            }
            this.#incoming.append(packet.offset, packet.bytes);
        } catch (error: unknown) {
            if (error instanceof BinaryAdmissionError) {
                throw new TransportError(
                    TransportErrorCode.Limit,
                    'Project file memory budget is full',
                );
            }
            throw error;
        }
        if (this.#incoming.offset !== packet.total) {
            return null;
        }
        const receipt: BinaryChunkReceipt = this.#incoming.completed();
        this.#incoming = null;
        this.#finished = true;
        receipt.credit?.close();
        return new Uint8Array(receipt.buffer);
    }

    /** Every request terminal path returns only this transfer's remaining storage. */
    public close(): void {
        this.#incoming?.close();
        this.#incoming = null;
        this.#finished = true;
    }
}
