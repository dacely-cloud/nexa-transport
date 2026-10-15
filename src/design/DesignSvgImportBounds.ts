// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignPathGeometry } from './DesignPaths.js';
import type { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignSvgImportGeometry, type DesignSvgSourceBounds } from './DesignSvgImportGeometry.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';
import type { DesignNode, DesignPathCommand } from './DesignTypes.js';

/** Clipping never alters the object geometry used for objectBoundingBox coordinates. */
export class DesignSvgImportBounds {
    public static async measure(
        tree: DesignSvgImportTree,
        id: string,
        matrix: DesignSvgMatrix,
    ): Promise<DesignSvgSourceBounds | null> {
        let left: number = Infinity;
        let top: number = Infinity;
        let right: number = -Infinity;
        let bottom: number = -Infinity;
        let visited: number = 0;
        const visit: (
            node: DesignNode,
            x: number,
            y: number,
            depth: number,
        ) => Promise<void> = async (
            node: DesignNode,
            x: number,
            y: number,
            depth: number,
        ): Promise<void> => {
            if (!tree.contributesBounds(node.id)) {
                return;
            }
            if (depth > 64 || ++visited > 10000) {
                throw new Error('SVG bounds exceed the hierarchy budget.');
            }
            const exact: DesignSvgSourceBounds | null = tree.originalBounds(node.id, matrix);
            if (exact !== null) {
                left = Math.min(left, exact.x);
                top = Math.min(top, exact.y);
                right = Math.max(right, exact.x + exact.width);
                bottom = Math.max(bottom, exact.y + exact.height);
                return;
            }
            const original: DesignPathGeometry | undefined = tree.sourceGeometry(node.id);
            const offset: DesignSvgMatrix =
                original === undefined
                    ? { ...T.identity, e: x + node.x, f: y + node.y }
                    : { ...T.identity, e: original.x, f: original.y };
            const path: readonly DesignPathCommand[] = original?.path ?? node.path;
            if (path.length > 0) {
                const data: string = path
                    .map(
                        (command: DesignPathCommand): string =>
                            command.verb + command.values.join(' '),
                    )
                    .join(' ');
                const bounds: DesignSvgSourceBounds | null = await DesignSvgImportGeometry.bounds(
                    data,
                    T.multiply(matrix, offset),
                );
                if (bounds !== null) {
                    left = Math.min(left, bounds.x);
                    top = Math.min(top, bounds.y);
                    right = Math.max(right, bounds.x + bounds.width);
                    bottom = Math.max(bottom, bounds.y + bounds.height);
                }
            }
            if (original !== undefined) {
                return;
            }
            for (const child of node.children) {
                if (child !== node.mask?.sourceId) {
                    await visit(tree.node(child), x + node.x, y + node.y, depth + 1);
                }
            }
        };
        await visit(tree.node(id), 0, 0, 0);
        return left === Infinity
            ? null
            : { x: left, y: top, width: right - left, height: bottom - top };
    }
}
