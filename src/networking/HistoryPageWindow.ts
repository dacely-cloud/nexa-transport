// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { SessionHistoryPage, SessionHistoryParams } from '../protocol/Protocol.js';
import type { CallOptions } from '../interface/ClientOptions.js';

/** Typed authenticated RPC boundary supplied by the owning client. */
type HistoryPageRequest = (
    params: SessionHistoryParams,
    options: CallOptions,
) => Promise<SessionHistoryPage>;

/** A speculative read whose rejection is observed before ordered consumption. */
interface PendingHistoryPage {
    readonly controller: AbortController;
    readonly result: Promise<HistoryPageResult>;
}

/** A validated page is the only success value retained by speculative reads. */
interface HistoryPageSuccess {
    readonly ok: true;
    readonly page: SessionHistoryPage;
}

/** Untrusted thrown values are normalized at the RPC boundary. */
interface HistoryPageFailure {
    readonly ok: false;
    readonly error: Error;
}

/** Explicitly modeled settlement avoids the library rejection result's untyped reason. */
type HistoryPageResult = HistoryPageSuccess | HistoryPageFailure;

/** Bounded ordered lookahead admits encoded page size before retaining a speculative result. */
export class HistoryPageWindow {
    public static readonly pageBytes: number = 1024 * 1024;
    static readonly #maximumLookahead: bigint = 16n * 1024n * 1024n;
    readonly #pending: Map<string, PendingHistoryPage> = new Map();
    readonly #requestPage: HistoryPageRequest;
    readonly #id: string;
    readonly #concurrency: number;
    readonly #signal: AbortSignal | undefined;

    /** Bounds speculative requests independently of server-selected strides. */
    public constructor(
        request: HistoryPageRequest,
        id: string,
        concurrency: number,
        signal?: AbortSignal,
    ) {
        if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) {
            throw new RangeError('Invalid history page concurrency');
        }
        this.#requestPage = request;
        this.#id = id;
        this.#concurrency = concurrency;
        this.#signal = signal;
    }

    /** Consumes the next page while preserving original RPC errors. */
    public async read(cursor: string, endCursor?: string): Promise<SessionHistoryPage> {
        const pending: PendingHistoryPage =
            this.#pending.get(cursor) ?? this.#request(cursor, endCursor);
        const result: HistoryPageResult = await pending.result;
        this.#pending.delete(cursor);
        if (!result.ok) {
            throw result.error;
        }
        return result.page;
    }

    /** A changed stride cancels obsolete lookahead without reordering journal bytes. */
    public prefetch(cursor: string, endCursor: string, stride: bigint): void {
        if (stride <= 0n) {
            throw new RangeError('Invalid history page stride');
        }
        const remaining: Set<string> = new Set();
        const capacity: number = Math.min(
            this.#concurrency,
            Number(HistoryPageWindow.#maximumLookahead / stride),
        );
        const end: bigint = BigInt(endCursor);
        for (
            let offset: bigint = BigInt(cursor), count: number = 0;
            offset < end && count < capacity;
            offset += stride, count++
        ) {
            remaining.add(offset.toString());
        }
        let entry: [string, PendingHistoryPage];
        for (entry of this.#pending) {
            const [offset, pending]: [string, PendingHistoryPage] = entry;
            if (!remaining.has(offset)) {
                pending.controller.abort();
                this.#pending.delete(offset);
            }
        }
        let offset: string;
        for (offset of remaining) {
            if (!this.#pending.has(offset)) {
                this.#request(offset, endCursor);
            }
        }
    }

    /** Stops every outstanding speculative request on completion, error or cancellation. */
    public close(): void {
        let pending: PendingHistoryPage;
        for (pending of this.#pending.values()) {
            pending.controller.abort();
        }
        this.#pending.clear();
    }

    /** Registers a handled promise even when an RPC implementation throws synchronously. */
    #request(cursor: string, endCursor?: string): PendingHistoryPage {
        const controller: AbortController = new AbortController();
        const pending: PendingHistoryPage = {
            controller,
            result: this.#settle(controller, cursor, endCursor),
        };
        this.#pending.set(cursor, pending);
        return pending;
    }

    /** Oversized replies are discarded immediately, rather than kept until their decode turn. */
    async #settle(
        controller: AbortController,
        cursor: string,
        endCursor?: string,
    ): Promise<HistoryPageResult> {
        try {
            const value: SessionHistoryPage = await this.#requestPage(
                {
                    id: this.#id,
                    cursor,
                    pageBytes: HistoryPageWindow.pageBytes,
                    ...(endCursor === undefined ? {} : { endCursor }),
                },
                {
                    signal:
                        this.#signal === undefined
                            ? controller.signal
                            : AbortSignal.any([controller.signal, this.#signal]),
                },
            );
            if (value.chunk.length > Math.ceil(HistoryPageWindow.pageBytes / 3) * 4) {
                throw new Error('History page exceeds requested byte limit');
            }
            return { ok: true, page: value };
        } catch (reason: unknown) {
            return {
                ok: false,
                error:
                    reason instanceof Error
                        ? reason
                        : new Error('History page request failed', { cause: reason }),
            };
        }
    }
}
