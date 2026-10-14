// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { SessionHistoryRecord } from '../protocol/Protocol.js';
import { historyRecord } from '../protocol/Validators.js';

/** Frames journal lines by scanning new input only, with coalesced retained text segments. */
export class HistoryRecordDecoder {
    static readonly #segmentSize: number = 16 * 1024;
    readonly #segments: string[] = [];
    readonly #seen: Set<string> = new Set();
    #tail: string = '';

    /** Yields complete validated records without rescanning the unfinished record prefix. */
    public *write(text: string): Generator<SessionHistoryRecord, void> {
        let offset: number = 0;
        for (;;) {
            const newline: number = text.indexOf('\n', offset);
            if (newline === -1) {
                this.#append(text.slice(offset));
                return;
            }
            this.#append(text.slice(offset, newline));
            this.#segments.push(this.#tail);
            const line: string = this.#segments.join('');
            this.#segments.length = 0;
            this.#tail = '';
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
            offset = newline + 1;
        }
    }

    /** A snapshot boundary must terminate a complete journal line. */
    public finish(): void {
        if (this.#tail.length !== 0 || this.#segments.length !== 0) {
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
