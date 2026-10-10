// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignKind,
    DesignPathVerb as Verb,
    type DesignPathCommand,
    type DesignNode,
} from './DesignTypes.js';
import type { DesignNodeChanges } from './DesignOperationTypes.js';
import { DesignValues as V } from './DesignValues.js';

/** A pen anchor and its optional absolute incoming and outgoing tangent handles. */
export interface DesignPathAnchor {
    readonly x: number;
    readonly y: number;
    readonly incomingX: number | null;
    readonly incomingY: number | null;
    readonly outgoingX: number | null;
    readonly outgoingY: number | null;
}
/** Tight geometric bounds and normalized, editable local commands. */
export interface DesignPathGeometry {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly path: readonly DesignPathCommand[];
}

/** Portable pen geometry and resize behavior are shared by native edits and browser authoring. */
export class DesignPaths {
    /** Width and height edits resize vector coordinates unless the command supplies an explicit replacement path. */
    public static resize(node: DesignNode, changes: DesignNodeChanges): DesignNode {
        const { booleanMode: previousMode, ...base } = node;
        const { booleanMode: changedMode, ...properties } = changes;
        const kind: DesignNode['kind'] = properties.kind ?? node.kind;
        const mode: DesignNode['booleanMode'] =
            changedMode === null ? undefined : (changedMode ?? previousMode);
        const next: DesignNode = {
            ...base,
            ...properties,
            ...(kind === DesignKind.Boolean && mode !== undefined ? { booleanMode: mode } : {}),
        };
        if (
            node.path.length === 0 ||
            changes.path !== undefined ||
            (changes.width === undefined && changes.height === undefined)
        ) {
            return next;
        }
        return {
            ...next,
            path: this.scale(node.path, next.width / node.width, next.height / node.height),
        };
    }
    /** Scales endpoints and tangent controls together, retaining subpaths and verb identity. */
    public static scale(
        path: readonly DesignPathCommand[],
        x: number,
        y: number,
    ): readonly DesignPathCommand[] {
        return path.map((command: DesignPathCommand): DesignPathCommand => ({
            verb: command.verb,
            values: command.values.map(
                (value: number, index: number): number => value * (index % 2 === 0 ? x : y),
            ),
        }));
    }
    /** Straight and curved segments are authored in world coordinates, then normalized around true curve extrema. */
    public static draw(anchors: readonly DesignPathAnchor[], closed: boolean): DesignPathGeometry {
        if (anchors.length < 2 || anchors.length > 2048) {
            throw new Error('A pen path requires 2 to 2048 anchors.');
        }
        for (const anchor of anchors) {
            V.number(anchor.x);
            V.number(anchor.y);
            for (const value of [
                anchor.incomingX,
                anchor.incomingY,
                anchor.outgoingX,
                anchor.outgoingY,
            ]) {
                if (value !== null) {
                    V.number(value);
                }
            }
            if (
                (anchor.incomingX === null) !== (anchor.incomingY === null) ||
                (anchor.outgoingX === null) !== (anchor.outgoingY === null)
            ) {
                throw new Error('Pen tangent handles require both coordinates.');
            }
        }
        const first: DesignPathAnchor | undefined = anchors[0];
        if (first === undefined) {
            throw new Error('Missing first pen anchor.');
        }
        const path: DesignPathCommand[] = [{ verb: Verb.Move, values: [first.x, first.y] }];
        for (let index: number = 1; index < anchors.length; index++) {
            const a: DesignPathAnchor | undefined = anchors[index - 1];
            const b: DesignPathAnchor | undefined = anchors[index];
            if (a !== undefined && b !== undefined) {
                path.push(this.#segment(a, b));
            }
        }
        const last: DesignPathAnchor | undefined = anchors.at(-1);
        if (closed) {
            if (last !== undefined && (last.outgoingX !== null || first.incomingX !== null)) {
                path.push(this.#segment(last, first));
            }
            path.push({ verb: Verb.Close, values: [] });
        }
        return this.normalize(path);
    }
    /** Exact quadratic and cubic extrema bound the curve rather than the larger tangent-control hull. */
    public static normalize(path: readonly DesignPathCommand[]): DesignPathGeometry {
        let left: number = Infinity;
        let top: number = Infinity;
        let right: number = -Infinity;
        let bottom: number = -Infinity;
        let x: number = 0;
        let y: number = 0;
        let startX: number = 0;
        let startY: number = 0;
        const include: (px: number, py: number) => void = (px: number, py: number): void => {
            left = Math.min(left, px);
            top = Math.min(top, py);
            right = Math.max(right, px);
            bottom = Math.max(bottom, py);
        };
        for (const command of path) {
            const values: readonly number[] = command.values;
            if (command.verb === Verb.Move || command.verb === Verb.Line) {
                x = values[0] ?? 0;
                y = values[1] ?? 0;
                if (command.verb === Verb.Move) {
                    startX = x;
                    startY = y;
                }
                include(x, y);
            } else if (command.verb === Verb.Close) {
                x = startX;
                y = startY;
                include(x, y);
            } else {
                const quadratic: boolean = command.verb === Verb.Quadratic;
                const endX: number = values[quadratic ? 2 : 4] ?? x;
                const endY: number = values[quadratic ? 3 : 5] ?? y;
                const aX: number = values[0] ?? x;
                const aY: number = values[1] ?? y;
                const bX: number = quadratic ? endX : (values[2] ?? x);
                const bY: number = quadratic ? endY : (values[3] ?? y);
                const times: readonly number[] = [
                    ...this.#extrema(x, aX, bX, endX, quadratic),
                    ...this.#extrema(y, aY, bY, endY, quadratic),
                ];
                include(x, y);
                include(endX, endY);
                for (const t of times) {
                    include(
                        this.#curve(x, aX, bX, endX, t, quadratic),
                        this.#curve(y, aY, bY, endY, t, quadratic),
                    );
                }
                x = endX;
                y = endY;
            }
        }
        if (!Number.isFinite(left)) {
            throw new Error('A vector path requires geometry.');
        }
        return {
            x: left,
            y: top,
            width: Math.max(0.01, right - left),
            height: Math.max(0.01, bottom - top),
            path: path.map((command: DesignPathCommand): DesignPathCommand => ({
                verb: command.verb,
                values: command.values.map(
                    (value: number, index: number): number =>
                        value - (index % 2 === 0 ? left : top),
                ),
            })),
        };
    }
    static #segment(a: DesignPathAnchor, b: DesignPathAnchor): DesignPathCommand {
        return a.outgoingX !== null || b.incomingX !== null
            ? {
                  verb: Verb.Cubic,
                  values: [
                      a.outgoingX ?? a.x,
                      a.outgoingY ?? a.y,
                      b.incomingX ?? b.x,
                      b.incomingY ?? b.y,
                      b.x,
                      b.y,
                  ],
              }
            : { verb: Verb.Line, values: [b.x, b.y] };
    }
    static #curve(
        a: number,
        b: number,
        c: number,
        d: number,
        t: number,
        quadratic: boolean,
    ): number {
        const u: number = 1 - t;
        return quadratic
            ? u * u * a + 2 * u * t * b + t * t * d
            : u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
    }
    static #extrema(
        a: number,
        b: number,
        c: number,
        d: number,
        quadratic: boolean,
    ): readonly number[] {
        if (quadratic) {
            const divisor: number = a - 2 * b + d;
            const t: number = divisor === 0 ? -1 : (a - b) / divisor;
            return t > 0 && t < 1 ? [t] : [];
        }
        const x: number = -a + 3 * b - 3 * c + d;
        const y: number = 2 * (a - 2 * b + c);
        const z: number = b - a;
        if (Math.abs(x) < 1e-12) {
            const t: number = Math.abs(y) < 1e-12 ? -1 : -z / y;
            return t > 0 && t < 1 ? [t] : [];
        }
        const discriminant: number = y * y - 4 * x * z;
        if (discriminant < 0) {
            return [];
        }
        const root: number = Math.sqrt(discriminant);
        return [(-y + root) / (2 * x), (-y - root) / (2 * x)].filter(
            (t: number): boolean => t > 0 && t < 1,
        );
    }
}
