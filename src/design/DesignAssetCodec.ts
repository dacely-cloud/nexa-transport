// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0
import { DesignValues as V } from './DesignValues.js';
import {
    DesignAssetLimits as Limits,
    DesignAssetMime,
    type DesignAssetStartRequest,
    type DesignAssetChunkRequest,
    type DesignAssetReadRequest,
    type DesignAssetIdRequest,
    type DesignAssetListRequest,
    type DesignAsset,
    type DesignAssetPosition,
    type DesignAssetSlice,
    type DesignAssetListPage,
} from './DesignAssetTypes.js';

/** Portable strict boundaries for image metadata and bounded wire slices. */
export class DesignAssetCodec {
    /** Canonical SHA-256 identity pins retries to the same complete image. */
    public static digest(raw: unknown): string {
        if (typeof raw !== 'string' || !/^[a-f0-9]{64}$/.test(raw)) {
            throw new Error('Invalid image digest.');
        }
        return raw;
    }
    /** File sizes and positions keep decimal integer precision on the wire. */
    public static offset(raw: unknown): string {
        if (
            typeof raw !== 'string' ||
            !/^(0|[1-9][0-9]{0,8})$/.test(raw) ||
            BigInt(raw) > Limits.fileBytes
        ) {
            throw new Error('Invalid image byte position.');
        }
        return raw;
    }
    /** Admission binds every retry to one name, size and complete digest. */
    public static start(raw: unknown): DesignAssetStartRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'name',
            'byteLength',
            'sha256',
        ]);
        const byteLength: string = this.offset(value['byteLength']);
        if (byteLength === '0') {
            throw new Error('Image cannot be empty.');
        }
        return {
            id: V.id(value['id']),
            name: V.text(value['name'], 160),
            byteLength,
            sha256: this.digest(value['sha256']),
        };
    }
    /** Upload slices share the same strict canonical base64 boundary as download slices. */
    public static chunk(raw: unknown): DesignAssetChunkRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['id', 'offset', 'data']);
        return {
            id: V.id(value['id']),
            offset: this.offset(value['offset']),
            data: this.base64(value['data']),
        };
    }
    /** Rejects noncanonical padding bits and bounds decoded bytes before allocation. */
    public static base64(data: unknown): string {
        if (
            typeof data !== 'string' ||
            data.length < 4 ||
            data.length > Math.ceil(Limits.chunkBytes / 3) * 4 ||
            !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)
        ) {
            throw new Error('Invalid image chunk.');
        }
        const alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        if (
            (data.endsWith('==') && (alphabet.indexOf(data.at(-3) ?? '') & 15) !== 0) ||
            (data.endsWith('=') &&
                !data.endsWith('==') &&
                (alphabet.indexOf(data.at(-2) ?? '') & 3) !== 0)
        ) {
            throw new Error('Image chunk must use canonical base64.');
        }
        return data;
    }
    /** Strict asset addressing never accepts ownership from input fields. */
    public static id(raw: unknown): DesignAssetIdRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['id']);
        return { id: V.id(value['id']) };
    }
    /** Download requests use exact byte positions. */
    public static read(raw: unknown): DesignAssetReadRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['id', 'offset']);
        return { id: V.id(value['id']), offset: this.offset(value['offset']) };
    }
    /** Library requests page only small metadata. */
    public static list(raw: unknown): DesignAssetListRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['after', 'limit']);
        return {
            after: value['after'] === null ? null : V.id(value['after']),
            limit: V.number(value['limit'], 1, 100, true),
        };
    }
    /** Immutable published metadata validates decode dimensions and digest. */
    public static asset(raw: unknown): DesignAsset {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'name',
            'mime',
            'byteLength',
            'sha256',
            'width',
            'height',
        ]);
        const sha256: string = this.digest(value['sha256']);
        const width: number = V.number(value['width'], 1, Limits.edge, true);
        const height: number = V.number(value['height'], 1, Limits.edge, true);
        if (width * height > Limits.pixels) {
            throw new Error('Image exceeds the 16 megapixel limit.');
        }
        const byteLength: string = this.offset(value['byteLength']);
        if (byteLength === '0') {
            throw new Error('Image cannot be empty.');
        }
        return Object.freeze({
            id: V.id(value['id']),
            name: V.text(value['name'], 160),
            mime: V.choice(value['mime'], Object.values(DesignAssetMime)),
            byteLength,
            sha256,
            width,
            height,
        });
    }
    /** Acknowledgements cannot jump outside the admitted upload or its fixed boundaries. */
    public static position(raw: unknown): DesignAssetPosition {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'offset',
            'byteLength',
        ]);
        const offset: string = this.offset(value['offset']);
        const byteLength: string = this.offset(value['byteLength']);
        if (
            byteLength === '0' ||
            BigInt(offset) > BigInt(byteLength) ||
            (offset !== byteLength && BigInt(offset) % BigInt(Limits.chunkBytes) !== 0n)
        ) {
            throw new Error('Invalid image upload acknowledgement.');
        }
        return { id: V.id(value['id']), offset, byteLength };
    }
    /** Each slice proves exact progress and has the same immutable identity as its metadata. */
    public static slice(raw: unknown): DesignAssetSlice {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'asset',
            'offset',
            'data',
            'nextOffset',
        ]);
        const asset: DesignAsset = this.asset(value['asset']);
        const offset: string = this.offset(value['offset']);
        const data: string = this.base64(value['data']);
        const count: bigint = BigInt(
            (data.length / 4) * 3 - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0),
        );
        const remaining: bigint = BigInt(asset.byteLength) - BigInt(offset);
        const next: bigint = BigInt(offset) + count;
        const nextOffset: string | null =
            value['nextOffset'] === null ? null : this.offset(value['nextOffset']);
        if (
            BigInt(offset) % BigInt(Limits.chunkBytes) !== 0n ||
            remaining <= 0n ||
            count !==
                (remaining < BigInt(Limits.chunkBytes) ? remaining : BigInt(Limits.chunkBytes)) ||
            nextOffset !== (next === BigInt(asset.byteLength) ? null : next.toString())
        ) {
            throw new Error('Image slice does not match its fixed byte boundaries.');
        }
        return { asset, offset, data, nextOffset };
    }
    /** Ready image listings are ordered metadata with a progress-proving continuation. */
    public static page(raw: unknown): DesignAssetListPage {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['items', 'nextAfter']);
        const items: readonly DesignAsset[] = V.list(
            value['items'],
            100,
            (item: unknown): DesignAsset => this.asset(item),
        );
        const nextAfter: string | null = V.optionalId(value['nextAfter']);
        if (
            items.some(
                (item: DesignAsset, index: number): boolean =>
                    index > 0 && item.id <= (items[index - 1]?.id ?? ''),
            ) ||
            (nextAfter !== null && nextAfter !== items.at(-1)?.id)
        ) {
            throw new Error('Invalid image library continuation.');
        }
        return { items, nextAfter };
    }
}
