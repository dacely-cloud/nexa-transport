// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryByteBudget } from '../media/BinaryByteBudget.js';
import { BinaryChunks } from '../media/BinaryChunks.js';
import { BinaryInputReservation } from '../media/BinaryInputReservation.js';
import { BinaryRequestMemory } from '../media/BinaryRequestMemory.js';
import { BinaryAdmissionError } from '../media/BinaryAdmissionError.js';
import { BinaryMedia, type AttachmentProgress } from '../media/BinaryMedia.js';
import { JsonFrameMemory } from '../media/JsonFrameMemory.js';
import { Utf8Bytes } from '../media/Utf8Bytes.js';
import type { BinaryChunkReceipt } from '../media/interface/BinaryChunkReceipt.js';
import { TransportError, TransportErrorCode } from './TransportError.js';

/** Shares inbound working storage across partial transfers, decoding and unfinished consumers. */
export class InboundCapacity {
    /** Covers a maximum file's wire working storage and geometric growth peak. */
    public static readonly DEFAULT_BYTES: number = 2 * BinaryChunks.MAX_TRANSFER_BYTES;
    static readonly #global: BinaryByteBudget = new BinaryByteBudget(
        2 * InboundCapacity.DEFAULT_BYTES,
    );
    readonly #budget: BinaryByteBudget;
    readonly #chunks: BinaryChunks;

    /** A realm pool also bounds multiple clients; host-supplied pools support smaller deployments. */
    public constructor(
        limit: number = InboundCapacity.DEFAULT_BYTES,
        parent: BinaryByteBudget = InboundCapacity.#global,
    ) {
        this.#budget = new BinaryByteBudget(limit, parent);
        this.#chunks = new BinaryChunks(this.#budget);
        Object.freeze(this);
    }

    /** Retained input belonging to this client, including consumers from an earlier socket. */
    public get used(): number {
        return this.#budget.used;
    }

    /** Reassembly and progress metadata must acquire this same local and realm credit. */
    public accept(
        raw: ArrayBuffer,
        progress: (progress: AttachmentProgress) => void,
    ): BinaryChunkReceipt | null {
        return this.#chunks.acceptOwned(
            raw,
            (prefix: Uint8Array<ArrayBuffer>, total: number): void => {
                const credit: BinaryInputReservation = BinaryInputReservation.acquire(
                    this.#budget,
                    0,
                );
                try {
                    const update: AttachmentProgress | null = BinaryMedia.progress(
                        prefix,
                        total,
                        credit,
                    );
                    if (update !== null) {
                        progress(update);
                    }
                } finally {
                    credit.close();
                }
            },
        );
    }

    /** Completed transfer storage remains charged while the decoder acquires its working credit. */
    public binary(receipt: BinaryChunkReceipt): BinaryInputReservation {
        try {
            return BinaryInputReservation.acquire(
                this.#budget,
                BinaryRequestMemory.wire(new Uint8Array(receipt.buffer)),
                receipt.credit ?? undefined,
            );
        } catch (error: unknown) {
            if (receipt.credit?.belongsTo(this.#budget) === true) {
                receipt.credit.close();
            }
            throw error;
        }
    }

    /** Bounds UTF-8 allocation and decoded JSON structure before parsing an inbound text frame. */
    public text(raw: string, frameLimit: number): BinaryInputReservation {
        const bytes: number = Utf8Bytes.measure(raw, frameLimit);
        if (bytes > frameLimit) {
            throw new TransportError(TransportErrorCode.Limit, 'Inbound JSON frame exceeds limit');
        }
        const credit: BinaryInputReservation = BinaryInputReservation.acquire(
            this.#budget,
            7 * bytes + 128,
        );
        try {
            const encoded: Uint8Array<ArrayBuffer> = new TextEncoder().encode(raw);
            const charge: number = JsonFrameMemory.measure(encoded, credit.limit);
            if (!credit.reserve(charge - credit.used)) {
                throw new TransportError(
                    TransportErrorCode.Limit,
                    'Inbound JSON memory budget is full',
                );
            }
            return credit;
        } catch (error: unknown) {
            credit.close();
            if (error instanceof RangeError) {
                throw new BinaryAdmissionError('Inbound JSON structure exceeds its working budget');
            }
            throw error;
        }
    }

    /** Disconnect returns only incomplete storage; external consumers retain their independent credit. */
    public clear(): void {
        this.#chunks.clear();
    }
}
