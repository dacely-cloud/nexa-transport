// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import { DesignSvgPathData } from './DesignSvgPathData.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignPathKit } from './DesignPathKit.js';
import { DesignPathKitScope } from './DesignPathKitScope.js';
import { DesignPathConics } from './DesignPathConics.js';
import type { DesignPathKitLibrary, DesignPathKitPath } from './DesignPathKitTypes.js';
import type { DesignPathCommand } from './DesignTypes.js';

/** SVG primitives and full path syntax converge on the existing editable native Bezier representation. */
export class DesignSvgShapePaths {
    public static data(element: DesignSvgElement, width: number, height: number): string {
        const a: Readonly<Record<string, string>> = element.attributes;
        const x: (name: string, fallback?: number) => number = (
            name: string,
            fallback: number = 0,
        ): number => DesignSvgNumbers.length(a[name] ?? '', width, fallback);
        const y: (name: string, fallback?: number) => number = (
            name: string,
            fallback: number = 0,
        ): number => DesignSvgNumbers.length(a[name] ?? '', height, fallback);
        if (element.name === 'path') {
            return a['d'] ?? '';
        }
        if (element.name === 'line') {
            return `M${x('x1')} ${y('y1')}L${x('x2')} ${y('y2')}`;
        }
        if (element.name === 'polygon' || element.name === 'polyline') {
            const values: readonly number[] = DesignSvgNumbers.list(a['points'] ?? '', 20000);
            if (values.length % 2 !== 0) {
                throw new Error('SVG points require paired coordinates.');
            }
            if (values.length < 4) {
                return '';
            }
            return `M${values.join(' ')}${element.name === 'polygon' ? 'Z' : ''}`;
        }
        if (element.name === 'circle' || element.name === 'ellipse') {
            const cx: number = x('cx');
            const cy: number = y('cy');
            const radius: number = DesignSvgNumbers.length(
                a['r'] ?? '',
                Math.hypot(width, height) / Math.SQRT2,
            );
            const rx: number = element.name === 'circle' ? radius : x('rx');
            const ry: number = element.name === 'circle' ? radius : y('ry');
            if (rx < 0 || ry < 0) {
                throw new Error('SVG ellipse radii must be nonnegative.');
            }
            if (rx === 0 || ry === 0) {
                return '';
            }
            return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
        }
        if (element.name === 'rect') {
            const left: number = x('x');
            const top: number = y('y');
            const w: number = x('width');
            const h: number = y('height');
            if (w < 0 || h < 0) {
                throw new Error('SVG rectangle dimensions must be nonnegative.');
            }
            if (w === 0 || h === 0) {
                return '';
            }
            const rx: number = Math.min(w / 2, a['rx'] === undefined ? y('ry') : x('rx'));
            const ry: number = Math.min(h / 2, a['ry'] === undefined ? x('rx') : y('ry'));
            if (rx < 0 || ry < 0) {
                throw new Error('SVG rectangle radii must be nonnegative.');
            }
            if (rx === 0 || ry === 0) {
                return `M${left} ${top}H${left + w}V${top + h}H${left}Z`;
            }
            return (
                `M${left + rx} ${top}H${left + w - rx}A${rx} ${ry} 0 0 1 ${left + w} ${top + ry}` +
                `V${top + h - ry}A${rx} ${ry} 0 0 1 ${left + w - rx} ${top + h}` +
                `H${left + rx}A${rx} ${ry} 0 0 1 ${left} ${top + h - ry}` +
                `V${top + ry}A${rx} ${ry} 0 0 1 ${left + rx} ${top}Z`
            );
        }
        throw new Error('Unsupported SVG shape ' + element.name);
    }
    /** Native allocation ownership includes malformed source and conversion failures. */
    public static async parse(data: string): Promise<readonly DesignPathCommand[]> {
        if (data.trim().length === 0) {
            return [];
        }
        DesignSvgPathData.validate(data);
        const library: DesignPathKitLibrary = await DesignPathKit.load();
        const scope: DesignPathKitScope = new DesignPathKitScope();
        try {
            const path: DesignPathKitPath = scope.own(library.FromSVGString(data));
            return DesignPathConics.decode(path.toCmds());
        } finally {
            scope.close();
        }
    }
}
