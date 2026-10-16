// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignImageTile } from './DesignImageTileTypes.js';
import type { DesignImageTransform } from './DesignImageTransformTypes.js';
import type { DesignBox } from './DesignTypes.js';

/** A cell clips its editable original image independently of source cropping and bitmap dimensions. */
export class DesignSvgImageTile {
    public static content(
        imageId: string,
        tile: DesignImageTile,
        width: number,
        height: number,
        identity: (prefix: string) => string,
        definitions: string[],
    ): string {
        const matrix: DesignImageTransform = tile.content;
        let source: string = `<use href="#${imageId}"/>`;
        if (tile.clip != null) {
            const id: string = identity('tile-source-clip');
            definitions.push(
                `<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="${tile.clip.x * width}" y="${tile.clip.y * height}" width="${tile.clip.width * width}" height="${tile.clip.height * height}"/></clipPath>`,
            );
            source = `<g clip-path="url(#${id})">${source}</g>`;
        }
        return `<g transform="matrix(${matrix.a / width} ${matrix.b / width} ${matrix.c / height} ${matrix.d / height} ${matrix.tx} ${matrix.ty})">${source}</g>`;
    }

    public static transform(matrix: DesignImageTransform, box: DesignBox): string {
        return `matrix(${matrix.a * box.width} ${matrix.b * box.height} ${matrix.c * box.width} ${matrix.d * box.height} ${matrix.tx * box.width} ${matrix.ty * box.height})`;
    }
}
