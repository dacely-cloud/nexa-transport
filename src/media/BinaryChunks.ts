// SPDX-License-Identifier: Apache-2.0

/** Optional host accounting shared across connections or transport workers. */
export interface BinaryChunkBudget {
    reserve(bytes: number): boolean;
    release(bytes: number): void;
}
interface IncomingTransfer {
    readonly id: string;
    readonly data: Uint8Array<ArrayBuffer>;
    offset: number;
    timer: ReturnType<typeof setTimeout>;
}

/** Ordered, bounded assembly of NXCH frames; JSON and PCM frames may pass between chunks. */
export class BinaryChunks {
    public static readonly MAX_FILE_BYTES: number = 100 * 1024 * 1024;
    public static readonly MAX_TRANSFER_BYTES: number = 101 * 1024 * 1024;
    public static readonly CHUNK_BYTES: number = 256 * 1024;
    static #retained: number = 0;
    #incoming: IncomingTransfer | null = null;

    public constructor(public readonly budget?: BinaryChunkBudget) {}

    public static isChunk(buffer: ArrayBuffer): boolean {
        return buffer.byteLength >= 4 && new DataView(buffer).getUint32(0) === 0x4e584348;
    }

    /** Produces small frames without duplicating the entire transfer. */
    public static *split(
        bytes: Uint8Array,
        chunkBytes: number = BinaryChunks.CHUNK_BYTES,
    ): Generator<Uint8Array<ArrayBuffer>, void> {
        if (bytes.byteLength === 0 || bytes.byteLength > BinaryChunks.MAX_TRANSFER_BYTES) {
            throw new RangeError('Binary transfer exceeds 100 MiB plus framing');
        }
        if (
            !Number.isSafeInteger(chunkBytes) ||
            chunkBytes < 1 ||
            chunkBytes > BinaryChunks.CHUNK_BYTES
        ) {
            throw new RangeError('Invalid binary chunk limit');
        }
        const id: Uint8Array<ArrayBuffer> = crypto.getRandomValues(new Uint8Array(16));
        for (let offset: number = 0; offset < bytes.byteLength; offset += chunkBytes) {
            const payload: Uint8Array = bytes.subarray(offset, offset + chunkBytes);
            const frame: Uint8Array<ArrayBuffer> = new Uint8Array(28 + payload.byteLength);
            const view: DataView = new DataView(frame.buffer);
            view.setUint32(0, 0x4e584348);
            frame.set(id, 4);
            view.setUint32(20, bytes.byteLength);
            view.setUint32(24, offset);
            frame.set(payload, 28);
            yield frame;
        }
    }

    /** Cancels the transfer identified by a previously sent chunk. */
    public static cancel(chunk: Uint8Array): Uint8Array<ArrayBuffer> {
        const frame: Uint8Array<ArrayBuffer> = new Uint8Array(28);
        frame.set(chunk.subarray(0, 20));
        return frame;
    }

    /** Returns the complete frame, null while receiving, or the original unchunked frame. */
    public accept(buffer: ArrayBuffer): ArrayBuffer | null {
        if (!BinaryChunks.isChunk(buffer)) {
            return buffer;
        }
        try {
            if (buffer.byteLength < 28 || buffer.byteLength > 28 + BinaryChunks.CHUNK_BYTES) {
                throw new RangeError('Invalid binary chunk size');
            }
            const view: DataView = new DataView(buffer);
            const total: number = view.getUint32(20);
            const offset: number = view.getUint32(24);
            const id: string = Array.from(new Uint8Array(buffer, 4, 16), (byte: number): string =>
                byte.toString(16).padStart(2, '0'),
            ).join('');
            if (total === 0 && offset === 0 && buffer.byteLength === 28) {
                if (this.#incoming !== null && this.#incoming.id !== id) {
                    throw new Error('Cancellation targets another binary transfer');
                }
                this.clear();
                return null;
            }
            if (
                total === 0 ||
                total > BinaryChunks.MAX_TRANSFER_BYTES ||
                offset > total ||
                buffer.byteLength - 28 > total - offset
            ) {
                throw new RangeError('Invalid binary transfer bounds');
            }
            if (this.#incoming === null) {
                if (offset !== 0 || !this.#reserve(total)) {
                    throw new RangeError(
                        'Binary transfer is out of order or memory budget is exhausted',
                    );
                }
                try {
                    this.#incoming = {
                        id,
                        data: new Uint8Array(total),
                        offset: 0,
                        timer: setTimeout((): void => this.clear(), 30_000),
                    };
                } catch (error: unknown) {
                    this.#release(total);
                    throw error;
                }
            }
            if (
                this.#incoming.id !== id ||
                this.#incoming.data.byteLength !== total ||
                this.#incoming.offset !== offset
            ) {
                throw new RangeError('Binary chunks are duplicated, interleaved or out of order');
            }
            this.#incoming.data.set(new Uint8Array(buffer, 28), offset);
            this.#incoming.offset += buffer.byteLength - 28;
            clearTimeout(this.#incoming.timer);
            if (this.#incoming.offset === total) {
                const result: ArrayBuffer = this.#incoming.data.buffer;
                this.clear();
                return result;
            }
            this.#incoming.timer = setTimeout((): void => this.clear(), 30_000);
            return null;
        } catch (error: unknown) {
            this.clear();
            throw error;
        }
    }

    /** Releases incomplete transfers on disconnect, cancellation, timeout or protocol failure. */
    public clear(): void {
        if (this.#incoming !== null) {
            clearTimeout(this.#incoming.timer);
            this.#release(this.#incoming.data.byteLength);
            this.#incoming = null;
        }
    }
    #reserve(bytes: number): boolean {
        if (this.budget !== undefined) {
            return this.budget.reserve(bytes);
        }
        if (BinaryChunks.#retained + bytes > 256 * 1024 * 1024) {
            return false;
        }
        BinaryChunks.#retained += bytes;
        return true;
    }
    #release(bytes: number): void {
        if (this.budget !== undefined) {
            this.budget.release(bytes);
        } else {
            BinaryChunks.#retained -= bytes;
        }
    }
}
