// SPDX-License-Identifier: Apache-2.0
interface BinaryJsonObject {
    [key: string]: JsonValue;
}
type JsonValue = null | boolean | number | string | JsonValue[] | BinaryJsonObject;

/** Encoding retained by the JSON-facing protocol after wire bytes are restored. */
const BinaryEncoding = { Base64: 'base64', Array: 'array' } as const;
type BinaryEncoding = (typeof BinaryEncoding)[keyof typeof BinaryEncoding];
interface BinaryPart {
    readonly path: readonly string[];
    readonly length: number;
    readonly encoding: BinaryEncoding;
}

/** NXBF envelopes replace inline media and PCM strings with raw, contiguous bytes. */
export class BinaryEnvelope {
    public static encode(text: string): Uint8Array<ArrayBuffer> | null {
        const raw: unknown = JSON.parse(text);
        if (!BinaryEnvelope.#json(raw)) {
            throw new TypeError('Invalid binary JSON envelope');
        }
        const parts: BinaryPart[] = [];
        const payloads: Uint8Array[] = [];
        BinaryEnvelope.#extract(raw, [], parts, payloads, 0, { remaining: 100 * 1024 * 1024 });
        if (parts.length === 0) {
            return null;
        }
        const header: Uint8Array<ArrayBuffer> = new TextEncoder().encode(
            JSON.stringify({ json: raw, parts }),
        );
        const length: number = payloads.reduce(
            (total: number, bytes: Uint8Array): number => total + bytes.byteLength,
            0,
        );
        if (header.byteLength > 1024 * 1024 || length > 100 * 1024 * 1024) {
            throw new RangeError('Binary envelope exceeds limits');
        }
        const frame: Uint8Array<ArrayBuffer> = new Uint8Array(8 + header.byteLength + length);
        const view: DataView = new DataView(frame.buffer);
        view.setUint32(0, 0x4e584246);
        view.setUint32(4, header.byteLength);
        frame.set(header, 8);
        let offset: number = 8 + header.byteLength;
        for (const bytes of payloads) {
            frame.set(bytes, offset);
            offset += bytes.byteLength;
        }
        return frame;
    }

    public static decode(
        buffer: ArrayBuffer,
        maxBytes: number,
        maxJsonBytes: number = maxBytes,
    ): JsonValue {
        if (buffer.byteLength < 8 || buffer.byteLength > maxBytes) {
            throw new RangeError('Invalid binary envelope size');
        }
        const view: DataView = new DataView(buffer);
        const length: number = view.getUint32(4);
        if (
            view.getUint32(0) !== 0x4e584246 ||
            length > 1024 * 1024 ||
            length > buffer.byteLength - 8
        ) {
            throw new TypeError('Invalid binary envelope header');
        }
        const header: unknown = JSON.parse(
            new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(buffer, 8, length)),
        );
        if (
            !BinaryEnvelope.#record(header) ||
            !BinaryEnvelope.#json(header['json']) ||
            !Array.isArray(header['parts']) ||
            header['parts'].length > 128
        ) {
            throw new TypeError('Invalid binary envelope metadata');
        }
        const json: JsonValue = header['json'];
        let jsonBytes: number = new TextEncoder().encode(JSON.stringify(json)).length;
        if (jsonBytes > maxJsonBytes) {
            throw new RangeError('Decoded binary JSON exceeds limit');
        }
        let offset: number = 8 + length;
        for (const part of header['parts']) {
            if (!BinaryEnvelope.#part(part) || part.length > buffer.byteLength - offset) {
                throw new TypeError('Invalid binary envelope part');
            }
            const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(buffer, offset, part.length);
            offset += part.length;
            let target: JsonValue = json;
            for (let index: number = 0; index < part.path.length; index += 1) {
                const key: string | undefined = part.path[index];
                if (
                    key === undefined ||
                    key === '__proto__' ||
                    key === 'constructor' ||
                    key === 'prototype' ||
                    typeof target !== 'object' ||
                    target === null ||
                    !Object.hasOwn(target, key)
                ) {
                    throw new TypeError('Invalid binary field path');
                }
                if (
                    Array.isArray(target) &&
                    (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= target.length)
                ) {
                    throw new TypeError('Invalid binary array index');
                }
                if (index === part.path.length - 1) {
                    if ((Array.isArray(target) ? target[Number(key)] : target[key]) !== null) {
                        throw new TypeError('Binary field must reference an unused placeholder');
                    }
                    // Check expansion before allocating a number array or base64 string.
                    let replacementBytes: number = 2 + Math.ceil(bytes.length / 3) * 4;
                    if (part.encoding === BinaryEncoding.Array) {
                        replacementBytes = 2 + Math.max(0, bytes.length - 1);
                        for (const byte of bytes) {
                            replacementBytes += byte < 10 ? 1 : byte < 100 ? 2 : 3;
                        }
                    }
                    jsonBytes += replacementBytes - 4; // Replaces the JSON null placeholder.
                    if (jsonBytes > maxJsonBytes) {
                        throw new RangeError('Decoded binary JSON exceeds limit');
                    }
                    const replacement: JsonValue =
                        part.encoding === BinaryEncoding.Array
                            ? Array.from(bytes)
                            : BinaryEnvelope.#base64(bytes);
                    if (Array.isArray(target)) {
                        target[Number(key)] = replacement;
                    } else {
                        target[key] = replacement;
                    }
                } else {
                    const next: JsonValue | undefined = Array.isArray(target)
                        ? target[Number(key)]
                        : target[key];
                    if (next === undefined) {
                        throw new TypeError('Missing binary field');
                    }
                    target = next;
                }
            }
        }
        if (offset !== buffer.byteLength) {
            throw new RangeError('Unexpected trailing binary bytes');
        }
        return json;
    }

    static #extract(
        value: JsonValue,
        path: readonly string[],
        parts: BinaryPart[],
        payloads: Uint8Array[],
        depth: number,
        budget: { remaining: number },
    ): void {
        if (depth > 24) {
            throw new RangeError('Binary JSON nesting limit exceeded');
        }
        if (typeof value !== 'object' || value === null) {
            return;
        }
        for (const [key, child] of Object.entries(value)) {
            const base64: boolean =
                (key === 'pcm' ||
                    (key === 'data' && !Array.isArray(value) && value['kind'] === 'base64')) &&
                typeof child === 'string' &&
                child.length % 4 === 0 &&
                /^[A-Za-z0-9+/]*={0,2}$/.test(child);
            const rawArray: boolean =
                key === 'voice' || (key === 'data' && path.at(-1) === 'video');
            let bytes: Uint8Array | null = null;
            if (base64 && typeof child === 'string') {
                const length: number =
                    (child.length / 4) * 3 -
                    (child.endsWith('==') ? 2 : child.endsWith('=') ? 1 : 0);
                BinaryEnvelope.#reservePart(length, parts.length, budget);
                const decoded: string = atob(child);
                bytes = new Uint8Array(decoded.length);
                for (let index: number = 0; index < decoded.length; index += 1) {
                    bytes[index] = decoded.charCodeAt(index);
                }
            } else if (rawArray && typeof child === 'object' && child !== null) {
                const values: JsonValue[] = Object.values(child);
                if (
                    values.every(
                        (entry: JsonValue): entry is number =>
                            typeof entry === 'number' &&
                            Number.isInteger(entry) &&
                            entry >= 0 &&
                            entry <= 255,
                    )
                ) {
                    BinaryEnvelope.#reservePart(values.length, parts.length, budget);
                    bytes = Uint8Array.from(values);
                }
            }
            if (bytes !== null) {
                parts.push({
                    path: [...path, key],
                    length: bytes.byteLength,
                    encoding: base64 ? BinaryEncoding.Base64 : BinaryEncoding.Array,
                });
                payloads.push(bytes);
                if (Array.isArray(value)) {
                    value[Number(key)] = null;
                } else {
                    value[key] = null;
                }
            } else {
                BinaryEnvelope.#extract(child, [...path, key], parts, payloads, depth + 1, budget);
            }
        }
    }

    static #reservePart(length: number, count: number, budget: { remaining: number }): void {
        if (count >= 128) {
            throw new RangeError('Too many binary fields');
        }
        if (length > budget.remaining) {
            throw new RangeError('Binary envelope exceeds limits');
        }
        budget.remaining -= length;
    }

    static #base64(bytes: Uint8Array): string {
        const chunks: string[] = [];
        for (let offset: number = 0; offset < bytes.length; offset += 8192) {
            chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
        }
        return btoa(chunks.join(''));
    }
    static #record(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    static #part(value: unknown): value is BinaryPart {
        return (
            BinaryEnvelope.#record(value) &&
            Array.isArray(value['path']) &&
            value['path'].length > 0 &&
            value['path'].length <= 24 &&
            value['path'].every((key: unknown): key is string => typeof key === 'string') &&
            typeof value['length'] === 'number' &&
            Number.isSafeInteger(value['length']) &&
            value['length'] >= 0 &&
            (value['encoding'] === BinaryEncoding.Base64 ||
                value['encoding'] === BinaryEncoding.Array)
        );
    }
    static #json(value: unknown, depth: number = 0): value is JsonValue {
        if (depth > 24) {
            return false;
        }
        if (value === null || typeof value === 'string' || typeof value === 'boolean') {
            return true;
        }
        if (typeof value === 'number') {
            return Number.isFinite(value);
        }
        if (Array.isArray(value)) {
            return value.every((entry: unknown): boolean => BinaryEnvelope.#json(entry, depth + 1));
        }
        return (
            BinaryEnvelope.#record(value) &&
            Object.values(value).every((entry: unknown): boolean =>
                BinaryEnvelope.#json(entry, depth + 1),
            )
        );
    }
}
