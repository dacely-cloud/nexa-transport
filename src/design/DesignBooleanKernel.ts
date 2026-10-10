// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignBooleanMode as Mode, type DesignBooleanOperand } from './DesignBooleanTypes.js';
import { DesignPathKit } from './DesignPathKit.js';
import { DesignPathKitScope } from './DesignPathKitScope.js';
import type {
    DesignPathKitLibrary,
    DesignPathKitPath,
    DesignPathKitEnum,
} from './DesignPathKitTypes.js';
import { DesignPathConics } from './DesignPathConics.js';
import { DesignPathDashes } from './DesignPathDashes.js';
import { DesignPathWinding } from './DesignPathWinding.js';
import { DesignPathVerb as Verb, type DesignPathCommand } from './DesignTypes.js';

/** Shared native/browser Boolean geometry preserves holes, curves, and the full fill-and-stroke silhouette. */
export class DesignBooleanKernel {
    /** Sources stay immutable; every native intermediate is released on success or failure. */
    public static async combine(
        operands: readonly DesignBooleanOperand[],
        mode: Mode,
    ): Promise<readonly DesignPathCommand[]> {
        if (operands.length < 1 || operands.length > 128) {
            throw new Error('A Boolean group requires 1 to 128 source layers.');
        }
        const library: DesignPathKitLibrary = await DesignPathKit.load();
        const operation: DesignPathKitEnum = this.#operation(library, mode);
        const scope: DesignPathKitScope = new DesignPathKitScope();
        let budget: number = 0;
        let commandBudget: number = 0;
        try {
            let result: DesignPathKitPath | null = null;
            for (const operand of operands) {
                budget += operand.outline.length;
                if (budget > 2_000_000) {
                    throw new Error('Boolean sources exceed the geometry input budget.');
                }
                const source: DesignPathKitPath = this.#operand(library, scope, operand);
                const commands: unknown = source.toCmds();
                if (!Array.isArray(commands)) {
                    throw new Error('Invalid native vector output.');
                }
                commandBudget += commands.length;
                if (commandBudget > 20_000) {
                    throw new Error('Boolean sources exceed the geometry command budget.');
                }
                if (result === null) {
                    result = source;
                } else {
                    const combined: DesignPathKitPath = scope.own(
                        library.MakeFromOp(result, source, operation),
                    );
                    scope.release(result);
                    scope.release(source);
                    result = combined;
                }
            }
            return result === null
                ? []
                : DesignPathWinding.normalize(DesignPathConics.decode(result.toCmds()));
        } finally {
            scope.close();
        }
    }

    /** Converts editable commands to the native verb IDs without changing coordinate order. */
    public static commands(path: readonly DesignPathCommand[]): readonly (readonly number[])[] {
        return path.map((command: DesignPathCommand): readonly number[] => [
            command.verb === Verb.Move
                ? 0
                : command.verb === Verb.Line
                  ? 1
                  : command.verb === Verb.Quadratic
                    ? 2
                    : command.verb === Verb.Cubic
                      ? 4
                      : 5,
            ...command.values,
        ]);
    }

    static #operation(library: DesignPathKitLibrary, mode: Mode): DesignPathKitEnum {
        switch (mode) {
            case Mode.Union:
                return library.PathOp.UNION;
            case Mode.Subtract:
                return library.PathOp.DIFFERENCE;
            case Mode.Intersect:
                return library.PathOp.INTERSECT;
            case Mode.Exclude:
                return library.PathOp.XOR;
            default:
                throw new Error('Unknown Boolean operation.');
        }
    }

    static #operand(
        library: DesignPathKitLibrary,
        scope: DesignPathKitScope,
        operand: DesignBooleanOperand,
    ): DesignPathKitPath {
        if (
            operand.matrix.length !== 9 ||
            operand.matrix.some((value: number): boolean => !Number.isFinite(value)) ||
            operand.matrix[6] !== 0 ||
            operand.matrix[7] !== 0 ||
            operand.matrix[8] !== 1
        ) {
            throw new Error('Boolean source requires a finite affine transform.');
        }
        const outline: DesignPathKitPath = scope.own(
            operand.outline === '' ? library.NewPath() : library.FromSVGString(operand.outline),
        );
        const commands: unknown = outline.toCmds();
        if (!Array.isArray(commands) || commands.length > 10_000) {
            throw new Error('Boolean source exceeds the editable vector budget.');
        }
        outline.setFillType(library.FillType.WINDING);
        let silhouette: DesignPathKitPath = operand.filled
            ? scope.own(outline.copy())
            : scope.own(library.NewPath());
        const stroke: DesignBooleanOperand['stroke'] = operand.stroke;
        if (stroke !== null && stroke.width > 0) {
            const center: DesignPathKitPath =
                stroke.dash.length === 0
                    ? scope.own(outline.copy())
                    : scope.own(
                          library.FromCmds(
                              this.commands(
                                  DesignPathDashes.paint(
                                      DesignPathConics.decode(outline.toCmds()),
                                      stroke.dash,
                                  ),
                              ),
                          ),
                      );
            if (
                center.stroke({
                    width: stroke.width,
                    miter_limit: 4,
                    join: library.StrokeJoin.ROUND,
                    cap: library.StrokeCap.ROUND,
                }) === null
            ) {
                throw new Error('The vector engine could not expand the source border.');
            }
            const combined: DesignPathKitPath = scope.own(
                library.MakeFromOp(silhouette, center, library.PathOp.UNION),
            );
            scope.release(silhouette);
            scope.release(center);
            silhouette = combined;
        }
        scope.release(outline);
        if (silhouette.transform(operand.matrix) === null) {
            throw new Error('The vector engine could not transform the source.');
        }
        const empty: DesignPathKitPath = scope.own(library.NewPath());
        const resolved: DesignPathKitPath = scope.own(
            library.MakeFromOp(silhouette, empty, library.PathOp.UNION),
        );
        scope.release(silhouette);
        scope.release(empty);
        return resolved;
    }
}
