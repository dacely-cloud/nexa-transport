// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryCarrierFactory } from './BinaryCarrierFactory';
import { BinaryChunks } from './BinaryChunks';
import { BinaryMetadataMeasure } from './BinaryMetadataMeasure';
import { JsonStringBytes } from './JsonStringBytes';
import type { BinaryCarrier } from './interface/BinaryCarrier';
import type { BinaryJsonObject } from './interface/BinaryJsonObject';
import type { BinaryJsonValue } from './interface/BinaryJsonValue';
import type { BinaryPart } from './interface/BinaryPart';

/** Validates and measures the whole envelope before copying metadata or allocating its frame. */
export class BinaryEnvelopePlan {
    /** Existing NXBF metadata limit; byte bodies retain the separate 300 MiB media ceiling. */
    public static readonly MAX_HEADER_BYTES: number = 1024 * 1024;
    readonly #source: BinaryJsonValue;
    readonly #carriers: BinaryCarrier[] = [];
    readonly #paths: Map<string, BinaryCarrier> = new Map();
    #jsonBytes: number = 0;
    #partBytes: number = 2;
    #payloadBytes: number = 0;

    /** Borrows input for one synchronous encode; callers retain it unchanged until framing completes. */
    public constructor(raw: unknown) {
        if (!this.#inspect(raw, [])) {
            throw new TypeError('Invalid binary JSON envelope');
        }
        this.#source = raw;
        if (this.#carriers.length !== 0) {
            const measure: BinaryMetadataMeasure = new BinaryMetadataMeasure(
                new Set(this.#paths.keys()),
                BinaryEnvelopePlan.MAX_HEADER_BYTES - this.#partBytes - 18,
            );
            this.#jsonBytes = measure.measure(this.#source);
        }
        this.#admitted();
        Object.freeze(this.#carriers);
    }

    /** Original carriers whose writes are deferred until complete admission. */
    public get carriers(): readonly BinaryCarrier[] {
        return this.#carriers;
    }

    /** Exact total of admitted raw carrier lengths. */
    public get payloadBytes(): number {
        return this.#payloadBytes;
    }

    /** Exact projected UTF-8 header size, or a saturation value when no binary frame is needed. */
    public get headerBytes(): number {
        return this.#jsonBytes + this.#partBytes + 18;
    }

    /** Copies only admitted metadata; carriers become null without enumerating their byte values. */
    public metadata(): BinaryJsonValue {
        this.#admitted();
        if (this.#carriers.length === 0) {
            throw new TypeError('A plaintext envelope has no binary metadata projection');
        }
        return this.#copy(this.#source, []);
    }

    /** Bounds recursion and measures each value while immediately validating external data. */
    #inspect(value: unknown, path: readonly string[]): value is BinaryJsonValue {
        if (path.length > 24) {
            throw new RangeError('Binary JSON nesting limit exceeded');
        }
        if (value === null || typeof value === 'boolean' || typeof value === 'number') {
            if (typeof value === 'number' && !Number.isFinite(value)) {
                return false;
            }
            this.#take(String(value).length);
            return true;
        }
        if (typeof value === 'string') {
            this.#take(value.length + 2);
            return true;
        }
        if (value instanceof Uint8Array) {
            this.#take(2);
            for (let index: number = 0; index < value.length; index += 1) {
                if (this.#jsonBytes > BinaryEnvelopePlan.MAX_HEADER_BYTES) {
                    break;
                }
                const byte: number | undefined = value[index];
                if (byte === undefined) {
                    throw new TypeError('Changed binary byte storage');
                }
                this.#take((index === 0 ? 0 : 1) + String(index).length + 3 + String(byte).length);
            }
            return true;
        }
        if (Array.isArray(value)) {
            this.#take(2);
            for (let index: number = 0; index < value.length; index += 1) {
                if (index !== 0) {
                    this.#take(1);
                }
                const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
                    value,
                    String(index),
                );
                this.#requireData(descriptor);
                const child: unknown = descriptor === undefined ? null : descriptor.value;
                if (!this.#inspect(child, [...path, String(index)])) {
                    return false;
                }
            }
            return true;
        }
        if (!BinaryEnvelopePlan.#record(value)) {
            return false;
        }
        this.#take(2);
        let count: number = 0;
        let key: string;
        for (key in value) {
            if (!Object.hasOwn(value, key)) {
                continue;
            }
            const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
                value,
                key,
            );
            this.#requireData(descriptor);
            const child: unknown = descriptor?.value;
            if (child === undefined) {
                continue;
            }
            this.#take((count++ === 0 ? 0 : 1) + key.length + 3);
            const next: readonly string[] = [...path, key];
            if (next.length > 24) {
                throw new RangeError('Binary JSON nesting limit exceeded');
            }
            const carrier: BinaryCarrier | null = this.#carrier(value, key, child, next);
            if (carrier === null) {
                if (!this.#inspect(child, next)) {
                    return false;
                }
            } else {
                this.#part(carrier);
                this.#take(4);
            }
        }
        return true;
    }

    /** Detects the protocol's explicit byte fields while leaving unrelated metadata unchanged. */
    #carrier(
        holder: Readonly<Record<string, unknown>>,
        key: string,
        child: unknown,
        path: readonly string[],
    ): BinaryCarrier | null {
        if (typeof child === 'string' && key === 'pcm') {
            return BinaryCarrierFactory.base64(child, path);
        }
        if (typeof child === 'string' && key === 'data') {
            const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
                holder,
                'kind',
            );
            this.#requireData(descriptor);
            const kind: unknown = descriptor?.value;
            if (kind === 'base64') {
                return BinaryCarrierFactory.base64(child, path);
            }
        }
        if (key === 'voice' || (key === 'data' && path.at(-2) === 'video')) {
            return BinaryCarrierFactory.array(child, path);
        }
        return null;
    }

    /** Charges paths and bodies before retaining a write operation, with no payload allocation. */
    #part(carrier: BinaryCarrier): void {
        const part: BinaryPart = carrier.part;
        if (this.#carriers.length >= 128) {
            throw new RangeError('Too many binary fields');
        }
        if (this.#payloadBytes + part.length > BinaryChunks.MAX_FILE_BYTES) {
            throw new RangeError('Binary envelope exceeds limits');
        }
        if (
            part.path.some(
                (key: string): boolean =>
                    key === '__proto__' || key === 'constructor' || key === 'prototype',
            )
        ) {
            throw new TypeError('Invalid binary field path');
        }
        let size: number = `{"path":[],"length":${part.length},"encoding":"${part.encoding}"}`
            .length;
        for (let index: number = 0; index < part.path.length; index += 1) {
            const key: string | undefined = part.path[index];
            if (key === undefined) {
                throw new TypeError('Missing binary path field');
            }
            size +=
                (index === 0 ? 0 : 1) +
                JsonStringBytes.measure(key, BinaryEnvelopePlan.MAX_HEADER_BYTES);
        }
        this.#partBytes += size + (this.#carriers.length === 0 ? 0 : 1);
        this.#payloadBytes += part.length;
        Object.freeze(part.path);
        Object.freeze(part);
        Object.freeze(carrier);
        this.#carriers.push(carrier);
        this.#paths.set(JSON.stringify(part.path), carrier);
        this.#admitted();
    }

    /** Saturates nonbinary metadata sizes; plaintext fallback remains available without a clone. */
    #take(bytes: number): void {
        this.#jsonBytes = Math.min(
            BinaryEnvelopePlan.MAX_HEADER_BYTES + 1,
            this.#jsonBytes + bytes,
        );
        this.#admitted();
    }

    /** Applies the header cap only to frames that actually contain binary carriers. */
    #admitted(): void {
        if (this.#carriers.length !== 0 && this.headerBytes > BinaryEnvelopePlan.MAX_HEADER_BYTES) {
            throw new RangeError('Binary envelope exceeds limits');
        }
    }

    /** Rejects an external accessor before its native descriptor value enters validation. */
    #requireData(descriptor: PropertyDescriptor | undefined): void {
        if (descriptor?.get !== undefined || descriptor?.set !== undefined) {
            throw new TypeError('Invalid binary JSON accessor');
        }
    }

    /** Copies an admitted JSON subtree and replaces every planned carrier before traversing it. */
    #copy(value: BinaryJsonValue, path: readonly string[]): BinaryJsonValue {
        if (this.#paths.has(JSON.stringify(path))) {
            return null;
        }
        if (value === null || typeof value !== 'object' || value instanceof Uint8Array) {
            return value;
        }
        if (Array.isArray(value)) {
            const copied: BinaryJsonValue[] = [];
            for (let index: number = 0; index < value.length; index += 1) {
                const child: BinaryJsonValue | undefined = value[index];
                copied.push(
                    this.#copy(child === undefined ? null : child, [...path, String(index)]),
                );
            }
            return copied;
        }
        const copied: BinaryJsonObject = {};
        let key: string;
        for (key in value) {
            if (!Object.hasOwn(value, key)) {
                continue;
            }
            const child: BinaryJsonValue | undefined = value[key];
            if (child === undefined) {
                continue;
            }
            Object.defineProperty(copied, key, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: this.#copy(child, [...path, key]),
            });
        }
        return copied;
    }

    /** JSON dictionaries use plain or null prototypes; class instances are not silently emptied. */
    static #record(value: unknown): value is Readonly<Record<string, unknown>> {
        return (
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            (Reflect.getPrototypeOf(value) === Object.prototype ||
                Reflect.getPrototypeOf(value) === null)
        );
    }
}
