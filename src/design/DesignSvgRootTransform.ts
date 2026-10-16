// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import {
    DesignSvgTransforms as T,
    type DesignSvgMatrix,
    type DesignSvgPoint,
} from './DesignSvgTransforms.js';

/** The outermost SVG has a CSS layout box; its transform and origin precede its internal viewBox. */
export class DesignSvgRootTransform {
    /** Resolves the default centered origin, or explicit viewport lengths, percentages and position keywords. */
    public static matrix(
        style: Readonly<Record<string, string>>,
        width: number,
        height: number,
    ): DesignSvgMatrix {
        const source: string = style['transform'] ?? '';
        const matrix: DesignSvgMatrix = T.parse(source);
        if (source.trim() === '' || source.trim() === 'none') {
            return matrix;
        }
        const box: string = style['transform-box'] ?? 'view-box';
        if (!['view-box', 'border-box', 'content-box', 'fill-box', 'stroke-box'].includes(box)) {
            throw new DesignSvgInputError('Invalid SVG root transform-box.');
        }
        const origin: DesignSvgPoint = this.#origin(
            style['transform-origin'] ?? '50% 50%',
            width,
            height,
        );
        return T.multiply(
            { ...T.identity, e: origin.x, f: origin.y },
            T.multiply(matrix, { ...T.identity, e: -origin.x, f: -origin.y }),
        );
    }

    static #origin(source: string, width: number, height: number): DesignSvgPoint {
        const values: string[] = source.trim().split(/\s+/u);
        if (values.length === 3) {
            if (DesignSvgNumbers.length(values[2] ?? '', 1) !== 0) {
                throw new DesignSvgInputError('SVG transform-origin requires a zero depth.');
            }
            values.pop();
        }
        if (values.length < 1 || values.length > 2 || values[0] === '') {
            throw new DesignSvgInputError('Invalid SVG transform-origin.');
        }
        let x: string = values[0] ?? 'center';
        let y: string = values[1] ?? 'center';
        if (values.length === 1 && (x === 'top' || x === 'bottom')) {
            y = x;
            x = 'center';
        } else if (x === 'top' || x === 'bottom' || y === 'left' || y === 'right') {
            const swap: string = x;
            x = y;
            y = swap;
        }
        return {
            x: this.#position(x, width, 'left', 'right'),
            y: this.#position(y, height, 'top', 'bottom'),
        };
    }

    static #position(value: string, extent: number, start: string, end: string): number {
        if (value === 'center') {
            return extent / 2;
        }
        if (value === start) {
            return 0;
        }
        if (value === end) {
            return extent;
        }
        return DesignSvgNumbers.length(value, extent);
    }
}
