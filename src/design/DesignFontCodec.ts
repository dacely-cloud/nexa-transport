// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import {
    DesignFontFormat,
    DesignFontLimits,
    type DesignFontAsset,
    type DesignFontImportRequest,
    type DesignFontListRequest,
    type DesignFontListPage,
    type DesignFontReadRequest,
    type DesignFontSlice,
    type DesignFontBinding,
} from './DesignFontTypes.js';

/** Every font boundary validates bounded identities, metadata and exact byte positions. */
export class DesignFontCodec {
    /** A saved reference never includes private bytes, filesystem paths or an owner selector. */
    public static binding(raw: unknown): DesignFontBinding | null {
        if (raw === null) {
            return null;
        }
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['id', 'sha256']);
        const sha256: string = V.text(value['sha256'], 64);
        if (!/^[a-f0-9]{64}$/u.test(sha256)) {
            throw new Error('Invalid font binding digest.');
        }
        return { id: V.id(value['id']), sha256 };
    }
    /** Font imports cannot smuggle ownership or extra filesystem fields. */
    public static import(raw: unknown): DesignFontImportRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'family',
            'weight',
            'italic',
            'path',
        ]);
        return {
            id: V.id(value['id']),
            family: this.#family(value['family']),
            weight: V.number(value['weight'], 1, 1000),
            italic: V.boolean(value['italic']),
            path: V.text(value['path'], 4096),
        };
    }
    /** Published metadata has a canonical digest and decimal file length. */
    public static asset(raw: unknown): DesignFontAsset {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'family',
            'weight',
            'italic',
            'format',
            'byteLength',
            'sha256',
        ]);
        const format: DesignFontFormat | undefined = Object.values(DesignFontFormat).find(
            (entry: DesignFontFormat): boolean => entry === value['format'],
        );
        const bytes: bigint = this.#position(value['byteLength']);
        const sha256: string = V.text(value['sha256'], 64);
        if (
            format === undefined ||
            bytes < 12n ||
            bytes > DesignFontLimits.fileBytes ||
            !/^[a-f0-9]{64}$/u.test(sha256)
        ) {
            throw new Error('Invalid published font metadata.');
        }
        return {
            id: V.id(value['id']),
            family: this.#family(value['family']),
            weight: V.number(value['weight'], 1, 1000),
            italic: V.boolean(value['italic']),
            format,
            byteLength: bytes.toString(),
            sha256,
        };
    }
    /** Listing returns at most 32 small metadata records per page. */
    public static list(raw: unknown): DesignFontListRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['after', 'limit']);
        return {
            after: value['after'] === null ? null : V.id(value['after']),
            limit: V.number(value['limit'], 1, 32, true),
        };
    }
    /** A library cursor must describe its last returned item and records must be ordered. */
    public static page(raw: unknown): DesignFontListPage {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['items', 'nextAfter']);
        const items: readonly DesignFontAsset[] = V.list(
            value['items'],
            32,
            (entry: unknown): DesignFontAsset => this.asset(entry),
        );
        const nextAfter: string | null =
            value['nextAfter'] === null ? null : V.id(value['nextAfter']);
        if (
            items.some(
                (item: DesignFontAsset, index: number): boolean =>
                    index > 0 && (items[index - 1]?.id ?? '') >= item.id,
            ) ||
            (nextAfter !== null && nextAfter !== items.at(-1)?.id)
        ) {
            throw new Error('Invalid font library cursor.');
        }
        return { items, nextAfter };
    }
    /** Font reads require exact chunk boundaries and canonical decimal offsets. */
    public static read(raw: unknown): DesignFontReadRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['id', 'offset']);
        const offset: bigint = this.#position(value['offset']);
        if (
            offset >= DesignFontLimits.fileBytes ||
            offset % BigInt(DesignFontLimits.chunkBytes) !== 0n
        ) {
            throw new Error('Invalid font read position.');
        }
        return { id: V.id(value['id']), offset: offset.toString() };
    }
    /** Wire slices must advance by the actual canonical base64 byte count and terminate exactly at EOF. */
    public static slice(raw: unknown): DesignFontSlice {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'font',
            'offset',
            'data',
            'nextOffset',
        ]);
        const font: DesignFontAsset = this.asset(value['font']);
        const offset: bigint = this.#position(value['offset']);
        const data: string = V.text(value['data'], 4 * Math.ceil(DesignFontLimits.chunkBytes / 3));
        if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(data)) {
            throw new Error('Invalid font byte encoding.');
        }
        const length: number =
            (data.length / 4) * 3 - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);
        const next: bigint = offset + BigInt(length);
        const end: bigint = BigInt(font.byteLength);
        const nextOffset: string | null =
            value['nextOffset'] === null ? null : this.#position(value['nextOffset']).toString();
        if (
            offset >= end ||
            offset % BigInt(DesignFontLimits.chunkBytes) !== 0n ||
            length !==
                Number(
                    end - offset < BigInt(DesignFontLimits.chunkBytes)
                        ? end - offset
                        : BigInt(DesignFontLimits.chunkBytes),
                ) ||
            nextOffset !== (next === end ? null : next.toString())
        ) {
            throw new Error('Invalid font slice boundaries.');
        }
        const alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        if (
            (data.endsWith('==') && (alphabet.indexOf(data.at(-3) ?? '') & 15) !== 0) ||
            (data.endsWith('=') &&
                !data.endsWith('==') &&
                (alphabet.indexOf(data.at(-2) ?? '') & 3) !== 0)
        ) {
            throw new Error('Font byte encoding is not canonical.');
        }
        return { font, offset: offset.toString(), data, nextOffset };
    }
    static #family(raw: unknown): string {
        const family: string = V.text(raw, 160);
        if (family.trim() !== family) {
            throw new Error('Invalid font family.');
        }
        for (let index: number = 0; index < family.length; index++) {
            const unit: number = family.charCodeAt(index);
            if (unit < 32 || unit === 127) {
                throw new Error('Invalid font family.');
            }
        }
        return family;
    }
    static #position(raw: unknown): bigint {
        const text: string = V.text(raw, 20);
        if (!/^(?:0|[1-9][0-9]*)$/u.test(text)) {
            throw new Error('Invalid font byte position.');
        }
        return BigInt(text);
    }
}
