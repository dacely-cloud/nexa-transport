// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignNode, DesignBox, DesignPathCommand } from './DesignTypes.js';
import type { DesignSelectionBounds } from './DesignSelectionTypes.js';
import { DesignBooleanGeometry } from './DesignBooleanGeometry.js';
import { DesignBooleanTransforms } from './DesignBooleanTransforms.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import { DesignPaths, type DesignPathGeometry } from './DesignPaths.js';

/** Tight source bounds include curved extrema and centered borders in their Boolean owner's coordinates. */
export class DesignBooleanBounds {
    /** Resolves one painted source without using the corners of a rotated rectangular approximation. */
    public static source(
        node: DesignNode,
        box: DesignBox,
        owner: DesignBox,
    ): DesignSelectionBounds {
        const path: readonly DesignPathCommand[] = DesignBooleanGeometry.path(
            node,
            box.width,
            box.height,
        );
        let bounds: DesignSelectionBounds;
        if (path.length === 0) {
            bounds = DesignSelectionContext.bounds(DesignBooleanTransforms.local(box, owner));
        } else {
            const matrix: readonly number[] = DesignBooleanGeometry.matrix(box, owner);
            const transformed: readonly DesignPathCommand[] = path.map(
                (command: DesignPathCommand): DesignPathCommand => ({
                    verb: command.verb,
                    values: command.values.map((_value: number, index: number): number => {
                        const x: number = command.values[index - (index % 2)] ?? 0;
                        const y: number = command.values[index - (index % 2) + 1] ?? 0;
                        return index % 2 === 0
                            ? (matrix[0] ?? 1) * x + (matrix[1] ?? 0) * y + (matrix[2] ?? 0)
                            : (matrix[3] ?? 0) * x + (matrix[4] ?? 1) * y + (matrix[5] ?? 0);
                    }),
                }),
            );
            const geometry: DesignPathGeometry = DesignPaths.normalize(transformed);
            bounds = {
                left: geometry.x,
                top: geometry.y,
                right: geometry.x + geometry.width,
                bottom: geometry.y + geometry.height,
            };
        }
        const border: number = (node.style.stroke?.width ?? 0) / 2;
        return {
            left: bounds.left - border,
            top: bounds.top - border,
            right: bounds.right + border,
            bottom: bounds.bottom + border,
        };
    }
}
