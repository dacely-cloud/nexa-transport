// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgNumbers } from './DesignSvgNumbers.js';

/** SVG's six affine coefficients map points without relying on a platform DOMMatrix. */
export interface DesignSvgMatrix {
    readonly a: number;
    readonly b: number;
    readonly c: number;
    readonly d: number;
    readonly e: number;
    readonly f: number;
}
/** One point in the current SVG user coordinate system. */
export interface DesignSvgPoint {
    readonly x: number;
    readonly y: number;
}
/** Viewport mapping retains the declared artboard separately from the mapped artwork. */
export interface DesignSvgViewport {
    readonly width: number;
    readonly height: number;
    readonly matrix: DesignSvgMatrix;
}

/** Portable affine composition follows the order of SVG transform lists and viewBox mappings. */
export class DesignSvgTransforms {
    public static readonly identity: DesignSvgMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    public static point(matrix: DesignSvgMatrix, x: number, y: number): DesignSvgPoint {
        return {
            x: matrix.a * x + matrix.c * y + matrix.e,
            y: matrix.b * x + matrix.d * y + matrix.f,
        };
    }
    /** Parent transforms apply after local transforms. */
    public static multiply(parent: DesignSvgMatrix, local: DesignSvgMatrix): DesignSvgMatrix {
        const matrix: DesignSvgMatrix = {
            a: parent.a * local.a + parent.c * local.b,
            b: parent.b * local.a + parent.d * local.b,
            c: parent.a * local.c + parent.c * local.d,
            d: parent.b * local.c + parent.d * local.d,
            e: parent.a * local.e + parent.c * local.f + parent.e,
            f: parent.b * local.e + parent.d * local.f + parent.f,
        };
        if (
            Object.values(matrix).some(
                (value: number): boolean => !Number.isFinite(value) || Math.abs(value) > 1e9,
            )
        ) {
            throw new Error('SVG transform exceeds its coordinate range.');
        }
        return matrix;
    }
    public static parse(source: string): DesignSvgMatrix {
        let matrix: DesignSvgMatrix = this.identity;
        let rest: string = source.trim();
        let count: number = 0;
        while (rest.length > 0) {
            if (++count > 128) {
                throw new Error('SVG transform list exceeds its budget.');
            }
            const match: RegExpMatchArray | null = /^([A-Za-z]+)\s*\(([^()]*)\)/u.exec(rest);
            const name: string | undefined = match?.[1];
            const raw: string | undefined = match?.[2];
            if (match === null || name === undefined || raw === undefined) {
                throw new Error('Invalid SVG transform ' + rest.slice(0, 40));
            }
            const values: readonly number[] = DesignSvgNumbers.list(raw, 6);
            const x: number = values[0] ?? 0;
            const y: number = values[1] ?? 0;
            let local: DesignSvgMatrix;
            if (name === 'matrix' && values.length === 6) {
                local = {
                    a: x,
                    b: y,
                    c: values[2] ?? 0,
                    d: values[3] ?? 0,
                    e: values[4] ?? 0,
                    f: values[5] ?? 0,
                };
            } else if (name === 'translate' && (values.length === 1 || values.length === 2)) {
                local = { ...this.identity, e: x, f: y };
            } else if (name === 'scale' && (values.length === 1 || values.length === 2)) {
                local = { ...this.identity, a: x, d: values[1] ?? x };
            } else if (name === 'rotate' && (values.length === 1 || values.length === 3)) {
                const angle: number = (x * Math.PI) / 180;
                const cos: number = Math.cos(angle);
                const sin: number = Math.sin(angle);
                const cx: number = values[1] ?? 0;
                const cy: number = values[2] ?? 0;
                local = {
                    a: cos,
                    b: sin,
                    c: -sin,
                    d: cos,
                    e: cx - cos * cx + sin * cy,
                    f: cy - sin * cx - cos * cy,
                };
            } else if ((name === 'skewX' || name === 'skewY') && values.length === 1) {
                const slope: number = Math.tan((x * Math.PI) / 180);
                local =
                    name === 'skewX'
                        ? { ...this.identity, c: slope }
                        : { ...this.identity, b: slope };
            } else {
                throw new Error('Unsupported SVG transform or argument count: ' + name);
            }
            matrix = this.multiply(matrix, local);
            rest = rest.slice(match[0].length).trimStart();
            if (rest.startsWith(',')) {
                rest = rest.slice(1).trimStart();
                if (rest.length === 0) {
                    throw new Error('Trailing SVG transform separator.');
                }
            }
        }
        return matrix;
    }
    /** PreserveAspectRatio defaults to xMidYMid meet; none preserves independent axis scaling. */
    public static viewport(
        width: number,
        height: number,
        viewBox: string | undefined,
        aspect: string = 'xMidYMid meet',
    ): DesignSvgViewport {
        if (width <= 0 || height <= 0 || width > 100000 || height > 100000) {
            throw new Error('SVG viewport dimensions must be positive and at most 100000.');
        }
        if (viewBox === undefined) {
            return { width, height, matrix: this.identity };
        }
        const values: readonly number[] = DesignSvgNumbers.list(viewBox, 4);
        const left: number = values[0] ?? 0;
        const top: number = values[1] ?? 0;
        const boxWidth: number = values[2] ?? 0;
        const boxHeight: number = values[3] ?? 0;
        if (values.length !== 4 || boxWidth <= 0 || boxHeight <= 0) {
            throw new Error('Invalid SVG viewBox.');
        }
        const parts: readonly string[] = aspect.trim().split(/\s+/u);
        const align: string = parts[0] ?? '';
        const mode: string = parts[1] ?? 'meet';
        if (
            parts.length > 2 ||
            !['meet', 'slice'].includes(mode) ||
            (align !== 'none' && !/^x(?:Min|Mid|Max)Y(?:Min|Mid|Max)$/u.test(align))
        ) {
            throw new Error('Unsupported SVG preserveAspectRatio.');
        }
        let x: number = width / boxWidth;
        let y: number = height / boxHeight;
        if (align !== 'none') {
            x = y = mode === 'slice' ? Math.max(x, y) : Math.min(x, y);
        }
        const offsetX: number = align.includes('xMid')
            ? (width - boxWidth * x) / 2
            : align.includes('xMax')
              ? width - boxWidth * x
              : 0;
        const offsetY: number = align.includes('YMid')
            ? (height - boxHeight * y) / 2
            : align.includes('YMax')
              ? height - boxHeight * y
              : 0;
        return {
            width,
            height,
            matrix: { a: x, b: 0, c: 0, d: y, e: offsetX - left * x, f: offsetY - top * y },
        };
    }
    /** Similarity transforms retain an editable centered stroke and its authored cap/join settings. */
    public static strokeScale(matrix: DesignSvgMatrix): number | null {
        const x: number = Math.hypot(matrix.a, matrix.b);
        const y: number = Math.hypot(matrix.c, matrix.d);
        if (x < 1e-10 || y < 1e-10) {
            return null;
        }
        if (
            Math.abs(x - y) > 1e-8 * Math.max(x, y) ||
            Math.abs(matrix.a * matrix.c + matrix.b * matrix.d) > 1e-8 * x * y
        ) {
            return null;
        }
        return x;
    }
    /** The native curve kernel consumes a row-major homogeneous matrix. */
    public static kernel(matrix: DesignSvgMatrix): readonly number[] {
        return [matrix.a, matrix.c, matrix.e, matrix.b, matrix.d, matrix.f, 0, 0, 1];
    }
}
