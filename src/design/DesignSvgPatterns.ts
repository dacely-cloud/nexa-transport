// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignImageFit,
    type DesignPaint,
    type DesignBox,
    type DesignImageFraming,
} from './DesignTypes.js';
import type { DesignSvgResult } from './DesignSvgTypes.js';
import type { DesignImageTransform } from './DesignImageTransformTypes.js';
import { DesignImageGeometry } from './DesignImageGeometry.js';
import { DesignPatternGeometry } from './DesignPatternGeometry.js';
import { DesignSvgImageTile } from './DesignSvgImageTile.js';
import { DesignImageColor } from './DesignImageColor.js';

/** Component cells retain vector paths, text and nested definitions inside a self-contained SVG pattern. */
export class DesignSvgPatterns {
    readonly #sources: Map<string, DesignSvgResult> = new Map();
    readonly #identities: Map<string, string> = new Map();
    public constructor(
        public readonly definitions: string[],
        public readonly identify: (prefix: string) => string,
        public readonly render: (componentId: string, prefix: string) => DesignSvgResult,
    ) {}

    /** All pattern paints for one component share its vector source definition; placement remains paint-local. */
    public paint(paint: DesignPaint, box: DesignBox): string {
        if (paint.patternId == null) {
            throw new Error('Pattern paint requires a linked component definition.');
        }
        let source: DesignSvgResult | undefined = this.#sources.get(paint.patternId);
        let id: string | undefined = this.#identities.get(paint.patternId);
        if (source === undefined || id === undefined) {
            id = this.identify('pattern-source');
            source = this.render(paint.patternId, id + '-');
            this.definitions.push(`<g id="${id}">${source.svg}</g>`);
            this.#sources.set(paint.patternId, source);
            this.#identities.set(paint.patternId, id);
        }
        const framing: DesignImageFraming = DesignPatternGeometry.framing(paint);
        const matrix: DesignImageTransform = DesignImageGeometry.matrix(
            framing,
            box,
            source.width,
            source.height,
        );
        const transform: string = `matrix(${(matrix.a * box.width) / source.width} ${(matrix.b * box.height) / source.width} ${(matrix.c * box.width) / source.height} ${(matrix.d * box.height) / source.height} ${matrix.tx * box.width} ${matrix.ty * box.height})`;
        let content: string = `<use href="#${id}"/>`;
        let width: number = source.width;
        let height: number = source.height;
        let placement: string = transform;
        if (framing.fit === DesignImageFit.Tile && framing.tile != null) {
            content = DesignSvgImageTile.content(
                id,
                framing.tile,
                source.width,
                source.height,
                this.identify,
                this.definitions,
            );
            width = height = 1;
            placement = DesignSvgImageTile.transform(matrix, box);
        }
        if (framing.fit !== DesignImageFit.Tile) {
            content = `<use href="#${id}" transform="${transform}"/>`;
            placement = '';
            width = box.width;
            height = box.height;
        }
        if (DesignImageColor.active(framing.adjustments)) {
            const filter: string = this.identify('pattern-colors');
            this.definitions.push(
                `<filter id="${filter}" color-interpolation-filters="sRGB" x="-100%" y="-100%" width="300%" height="300%">${DesignImageColor.svg(DesignImageColor.transform(framing.adjustments))}</filter>`,
            );
            content = `<g filter="url(#${filter})">${content}</g>`;
        }
        const pattern: string = this.identify('vector-pattern');
        this.definitions.push(
            `<pattern id="${pattern}" patternUnits="userSpaceOnUse" width="${width}" height="${height}"${placement === '' ? '' : ` patternTransform="${placement}"`}>${content}</pattern>`,
        );
        return `url(#${pattern})`;
    }
}
