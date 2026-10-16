// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignImageTransformCodec } from './DesignImageTransformCodec.js';
import type { DesignImageTile, DesignImageTileClip } from './DesignImageTileTypes.js';

/** Image content may extend outside a cell; the source crop stays within its immutable raster. */
export class DesignImageTileCodec {
    public static parse(raw: unknown): DesignImageTile {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['content', 'clip'],
            ['content'],
        );
        return {
            content: DesignImageTransformCodec.parse(value['content']),
            ...(value['clip'] === undefined
                ? {}
                : { clip: value['clip'] === null ? null : this.clip(value['clip']) }),
        };
    }

    public static clip(raw: unknown): DesignImageTileClip {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'x',
            'y',
            'width',
            'height',
        ]);
        const result: DesignImageTileClip = {
            x: V.number(value['x'], 0, 1),
            y: V.number(value['y'], 0, 1),
            width: V.number(value['width'], 0, 1),
            height: V.number(value['height'], 0, 1),
        };
        if (
            result.width <= 0 ||
            result.height <= 0 ||
            result.x + result.width > 1 + 1e-10 ||
            result.y + result.height > 1 + 1e-10
        ) {
            throw new Error(
                'Image tile crop must be a nonempty rectangle inside the original image.',
            );
        }
        return result;
    }
}
