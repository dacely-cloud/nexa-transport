// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { SessionHistoryRecord } from 'nexa-protocol/gateway/HistoryTypes.js';
import { historyRecord } from 'nexa-protocol/schema/Validators.js';

/** Frames journal lines by scanning new input only, with coalesced retained text segments. */
export class HistoryRecordDecoder {
    static readonly #segmentSize: number = 16 * 1024;
    readonly #segments: string[] = [];
    readonly #seen: Set<string> = new Set();
    #tail: string = '';
    /** Input after the last yielded record when a consumer stopped iterating early. */
    #unread: string = '';

    /**
     * Yields complete validated records without rescanning the unfinished record prefix.
     *
     * @remarks
     * A consumer that stops iterating early keeps the rest of its input for the next `write`, so
     * no record is skipped.
     */
    public *write(text: string): Generator<SessionHistoryRecord, void> {
        const input: string = this.#unread + text;
        this.#unread = '';
        let offset: number = 0;
        try {
            for (;;) {
                const newline: number = input.indexOf('\n', offset);
                if (newline === -1) {
                    this.#append(input.slice(offset));
                    offset = input.length;
                    return;
                }
                this.#append(input.slice(offset, newline));
                this.#segments.push(this.#tail);
                const line: string = this.#segments.join('');
                this.#segments.length = 0;
                this.#tail = '';
                offset = newline + 1;
                const record: unknown = JSON.parse(line);
                if (
                    !historyRecord(record) ||
                    this.#seen.has(record.id) ||
                    !Number.isSafeInteger(record.at)
                ) {
                    throw new Error('Invalid or duplicate history record');
                }
                this.#seen.add(record.id);
                yield record;
            }
        } finally {
            if (offset < input.length) {
                this.#unread = input.slice(offset);
            }
        }
    }

    /** A snapshot boundary must terminate a complete journal line that was fully read. */
    public finish(): void {
        if (this.#tail.length !== 0 || this.#segments.length !== 0 || this.#unread.length !== 0) {
            throw new Error('Incomplete saved history record');
        }
    }

    /** Tiny pages cannot retain one string/array entry per page; each segment holds 16 Ki characters. */
    #append(text: string): void {
        let offset: number = 0;
        while (offset < text.length) {
            const count: number = Math.min(
                HistoryRecordDecoder.#segmentSize - this.#tail.length,
                text.length - offset,
            );
            this.#tail += text.slice(offset, offset + count);
            offset += count;
            if (this.#tail.length === HistoryRecordDecoder.#segmentSize) {
                this.#segments.push(this.#tail);
                this.#tail = '';
            }
        }
    }
}
