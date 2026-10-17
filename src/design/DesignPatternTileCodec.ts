// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignAssetCodec } from './DesignAssetCodec.js';
import { DesignAssetLimits } from './DesignAssetTypes.js';
import type { DesignPatternTileRequest, DesignPatternTileSlice } from './DesignPatternTileTypes.js';

/** Tile preview transfer uses the same acknowledged image-chunk size and canonical encoding. */
export class DesignPatternTileCodec {
    /** Exact revision, density and pixel bounds are retained on each source-free continuation. */
    public static request(raw: unknown): DesignPatternTileRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'revision',
            'patternId',
            'density',
            'maxDimension',
            'offset',
        ]);
        const offset: string = DesignAssetCodec.offset(value['offset']);
        if (BigInt(offset) % BigInt(DesignAssetLimits.chunkBytes) !== 0n) {
            throw new Error('Pattern preview offset must follow the fixed image-chunk boundaries.');
        }
        return {
            id: V.id(value['id']),
            revision: V.revision(value['revision']),
            patternId: V.id(value['patternId']),
            density: V.number(value['density'], 0.01, 64),
            maxDimension: V.number(value['maxDimension'], 64, 2048, true),
            offset,
        };
    }

    /** Returned byte ranges are exact, nonempty and bounded independently of original source size. */
    public static slice(raw: unknown): DesignPatternTileSlice {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'revision',
            'patternId',
            'intrinsicWidth',
            'intrinsicHeight',
            'width',
            'height',
            'byteLength',
            'sha256',
            'offset',
            'data',
            'nextOffset',
        ]);
        const data: string = DesignAssetCodec.base64(value['data']);
        const byteLength: string = DesignAssetCodec.offset(value['byteLength']);
        const offset: string = DesignAssetCodec.offset(value['offset']);
        const nextOffset: string | null =
            value['nextOffset'] === null ? null : DesignAssetCodec.offset(value['nextOffset']);
        const count: bigint = BigInt(
            (data.length / 4) * 3 - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0),
        );
        const total: bigint = BigInt(byteLength);
        const start: bigint = BigInt(offset);
        const end: bigint = start + count;
        const width: number = V.number(value['width'], 1, 2048, true);
        const height: number = V.number(value['height'], 1, 2048, true);
        const intrinsicWidth: number = V.number(value['intrinsicWidth'], 0, 100000);
        const intrinsicHeight: number = V.number(value['intrinsicHeight'], 0, 100000);
        if (
            total < 1n ||
            total > 8n * 1024n * 1024n ||
            start % BigInt(DesignAssetLimits.chunkBytes) !== 0n ||
            start >= total ||
            count !==
                (total - start < BigInt(DesignAssetLimits.chunkBytes)
                    ? total - start
                    : BigInt(DesignAssetLimits.chunkBytes)) ||
            nextOffset !== (end === total ? null : end.toString()) ||
            width * height > 1048576 ||
            intrinsicWidth <= 0 ||
            intrinsicHeight <= 0
        ) {
            throw new Error(
                'Pattern preview slice does not match its bounded raster or byte ranges.',
            );
        }
        return {
            id: V.id(value['id']),
            revision: V.revision(value['revision']),
            patternId: V.id(value['patternId']),
            intrinsicWidth,
            intrinsicHeight,
            width,
            height,
            byteLength,
            sha256: DesignAssetCodec.digest(value['sha256']),
            offset,
            data,
            nextOffset,
        };
    }
}
