// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { JsonStringBytes } from './JsonStringBytes';
import type { BinaryJsonValue } from './interface/BinaryJsonValue';

/** Measures admitted JSON projections before any metadata copy, excluding their raw carriers. */
export class BinaryMetadataMeasure {
    readonly #paths: ReadonlySet<string>;
    readonly #limit: number;
    #bytes: number = 0;

    /** Takes an immutable set of replacement paths and the remaining header capacity. */
    public constructor(paths: ReadonlySet<string>, limit: number) {
        if (!Number.isSafeInteger(limit) || limit < 0 || paths.size > 128) {
            throw new RangeError('Invalid binary metadata capacity');
        }
        this.#paths = new Set(paths);
        this.#limit = limit;
    }

    /** Performs exact sizing only when a binary frame is actually needed. */
    public measure(value: BinaryJsonValue): number {
        this.#bytes = 0;
        this.#visit(value, []);
        return this.#bytes;
    }

    /** Counts owned JSON entries and UTF-8 escaping without allocating their serialized text. */
    #visit(value: BinaryJsonValue, path: readonly string[]): void {
        if (this.#paths.has(JSON.stringify(path))) {
            this.#take(4);
            return;
        }
        if (value === null || typeof value === 'number' || typeof value === 'boolean') {
            this.#take(String(value).length);
            return;
        }
        if (typeof value === 'string') {
            this.#take(JsonStringBytes.measure(value, this.#limit));
            return;
        }
        this.#take(2);
        if (value instanceof Uint8Array) {
            for (let index: number = 0; index < value.length; index += 1) {
                const byte: number | undefined = value[index];
                if (byte === undefined) {
                    throw new TypeError('Changed binary byte storage');
                }
                this.#take((index === 0 ? 0 : 1) + String(index).length + 3 + String(byte).length);
            }
            return;
        }
        if (Array.isArray(value)) {
            for (let index: number = 0; index < value.length; index += 1) {
                if (index !== 0) {
                    this.#take(1);
                }
                const child: BinaryJsonValue | undefined = value[index];
                this.#visit(child === undefined ? null : child, [...path, String(index)]);
            }
            return;
        }
        let count: number = 0;
        let key: string;
        for (key in value) {
            if (!Object.hasOwn(value, key)) {
                continue;
            }
            const child: BinaryJsonValue | undefined = value[key];
            if (child === undefined) {
                continue;
            }
            this.#take((count++ === 0 ? 0 : 1) + JsonStringBytes.measure(key, this.#limit) + 1);
            this.#visit(child, [...path, key]);
        }
    }

    /** Rejects at the first exceeded bound, before a projected container or string is allocated. */
    #take(bytes: number): void {
        this.#bytes += bytes;
        if (this.#bytes > this.#limit) {
            throw new RangeError('Binary envelope exceeds limits');
        }
    }
}
