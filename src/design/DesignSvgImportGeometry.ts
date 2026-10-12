// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignPathDashes } from './DesignPathDashes.js';
import type { DesignStroke } from './DesignTypes.js';
import { DesignValues as V } from './DesignValues.js';
import { DesignPathKit } from './DesignPathKit.js';
import { DesignPathKitScope } from './DesignPathKitScope.js';
import { DesignPathConics } from './DesignPathConics.js';
import { DesignPathWinding } from './DesignPathWinding.js';
import { DesignPaths, type DesignPathGeometry } from './DesignPaths.js';
import { DesignSvgPathData } from './DesignSvgPathData.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';
import type { DesignPathKitLibrary, DesignPathKitPath } from './DesignPathKitTypes.js';
import type { DesignPathCommand } from './DesignTypes.js';

/** SVG bounding boxes retain truly zero axes; the editable node's nonzero box is separate. */
export interface DesignSvgSourceBounds {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
/** Editable source and transformed geometry retain separate paint coordinate systems. */
export interface DesignSvgImportedGeometry {
    readonly source: DesignSvgSourceBounds;
    readonly target: DesignPathGeometry;
}

/** Curve conversion happens after affine transformation so its error remains bounded in final design units. */
export class DesignSvgImportGeometry {
    public static async convert(
        data: string,
        matrix: DesignSvgMatrix,
        evenOdd: boolean = false,
    ): Promise<DesignSvgImportedGeometry | null> {
        if (data.trim() === '') {
            return null;
        }
        DesignSvgPathData.validate(data);
        const library: DesignPathKitLibrary = await DesignPathKit.load();
        const scope: DesignPathKitScope = new DesignPathKitScope();
        try {
            const original: DesignPathKitPath = scope.own(library.FromSVGString(data));
            const raw: readonly DesignPathCommand[] = DesignPathConics.decode(original.toCmds());
            if (raw.length === 0) {
                return null;
            }
            const bounds: Readonly<Record<string, unknown>> = V.record(
                original.computeTightBounds(),
                ['fLeft', 'fTop', 'fRight', 'fBottom'],
            );
            const left: number = V.number(bounds['fLeft']);
            const top: number = V.number(bounds['fTop']);
            const source: DesignSvgSourceBounds = {
                x: left,
                y: top,
                width: V.number(bounds['fRight']) - left,
                height: V.number(bounds['fBottom']) - top,
            };
            let drawn: DesignPathKitPath = original;
            if (evenOdd) {
                original.setFillType(library.FillType.EVENODD);
                drawn = scope.own(
                    library.MakeFromOp(
                        original,
                        scope.own(library.NewPath()),
                        library.PathOp.UNION,
                    ),
                );
            }
            const transformed: DesignPathKitPath = scope.own(drawn.copy());
            if (transformed.transform(T.kernel(matrix)) === null) {
                throw new Error('Could not transform SVG path.');
            }
            const commands: readonly DesignPathCommand[] = DesignPathConics.decode(
                transformed.toCmds(),
            );
            if (commands.length === 0) {
                return null;
            }
            const target: DesignPathGeometry = DesignPaths.normalize(
                evenOdd ? DesignPathWinding.normalize(commands) : commands,
            );
            return { source, target };
        } finally {
            scope.close();
        }
    }
    /** Nonuniform transforms bake the exact expanded border into a separate editable filled vector. */
    public static async outline(
        data: string,
        matrix: DesignSvgMatrix,
        stroke: DesignStroke,
    ): Promise<DesignPathGeometry | null> {
        DesignSvgPathData.validate(data);
        const library: DesignPathKitLibrary = await DesignPathKit.load();
        const scope: DesignPathKitScope = new DesignPathKitScope();
        try {
            const original: DesignPathKitPath = scope.own(library.FromSVGString(data));
            const commands: readonly DesignPathCommand[] = DesignPathConics.decode(
                original.toCmds(),
            );
            const paths: readonly DesignPathCommand[] = DesignPathDashes.paint(
                commands,
                stroke.dash,
            );
            const dashed: DesignPathKitPath = scope.own(
                library.FromSVGString(
                    paths
                        .map(
                            (command: DesignPathCommand): string =>
                                command.verb + command.values.join(' '),
                        )
                        .join(' '),
                ),
            );
            const outlined: DesignPathKitPath = scope.own(
                dashed.stroke({
                    width: stroke.width,
                    miter_limit: stroke.miterLimit ?? 4,
                    cap:
                        stroke.cap === 'square'
                            ? library.StrokeCap.SQUARE
                            : stroke.cap === 'butt'
                              ? library.StrokeCap.BUTT
                              : library.StrokeCap.ROUND,
                    join:
                        stroke.join === 'bevel'
                            ? library.StrokeJoin.BEVEL
                            : stroke.join === 'miter'
                              ? library.StrokeJoin.MITER
                              : library.StrokeJoin.ROUND,
                }),
            );
            if (outlined.transform(T.kernel(matrix)) === null) {
                throw new Error('Could not transform SVG border.');
            }
            const empty: DesignPathKitPath = scope.own(library.NewPath());
            const union: DesignPathKitPath = scope.own(
                library.MakeFromOp(outlined, empty, library.PathOp.UNION),
            );
            const result: readonly DesignPathCommand[] = DesignPathWinding.normalize(
                DesignPathConics.decode(union.toCmds()),
            );
            return result.length === 0 ? null : DesignPaths.normalize(result);
        } finally {
            scope.close();
        }
    }
}
