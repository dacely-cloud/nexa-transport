// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignPaintKind, DesignKind, type DesignBox, type DesignCorners } from './DesignTypes.js';
import type { DesignSceneNode } from './DesignScene.js';
import type { DesignLayoutResult } from './DesignLayoutTypes.js';
import type { DesignSelectionBounds } from './DesignSelectionTypes.js';
import type { DesignSvgSelection } from './DesignSvgTypes.js';
import { DesignPaths } from './DesignPaths.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';

/** Selection, clipping and rounded shapes use resolved world geometry rather than authored positions. */
export class DesignSvgGeometry {
    /** Escapes every text and attribute boundary; document names never become executable markup. */
    public static escape(value: string): string {
        return value.replace(
            /[&<>"']/gu,
            (character: string): string =>
                ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[
                    character
                ] ?? '',
        );
    }
    /** Exporting an instance selects its expanded children without selecting other instances of the same source. */
    public static select(
        scene: DesignLayoutResult,
        selection: readonly string[] = [],
    ): DesignSvgSelection {
        const nodes: ReadonlyMap<string, DesignSceneNode> = new Map(
            scene.nodes.map((node: DesignSceneNode): readonly [string, DesignSceneNode] => [
                node.id,
                node,
            ]),
        );
        const source: ReadonlyMap<string, DesignBox> = new Map(
            scene.boxes.map((box: DesignBox): readonly [string, DesignBox] => [box.id, box]),
        );
        const selected: ReadonlySet<string> = new Set(selection);
        const includes: (id: string) => boolean = (id: string): boolean => {
            if (selected.size === 0) {
                return true;
            }
            let current: string | null = id;
            while (current !== null) {
                if (selected.has(current)) {
                    return true;
                }
                current = nodes.get(current)?.parentId ?? null;
            }
            return false;
        };
        if (selection.some((id: string): boolean => !source.has(id))) {
            throw new Error('Show the selected layers before exporting.');
        }
        const boxes: DesignBox[] = [];
        const assets: Set<string> = new Set();
        let left: number = Infinity;
        let top: number = Infinity;
        let right: number = -Infinity;
        let bottom: number = -Infinity;
        for (const box of scene.boxes) {
            const node: DesignSceneNode | undefined = nodes.get(box.id);
            if (node === undefined) {
                continue;
            }
            if (node.booleanOwner !== undefined && includes(node.booleanOwner)) {
                continue;
            }
            let included: boolean = selected.size === 0 || selected.has(box.id);
            let parent: string | null = node.parentId;
            while (!included && parent !== null) {
                included = selected.has(parent);
                parent = nodes.get(parent)?.parentId ?? null;
            }
            if (!included) {
                continue;
            }
            boxes.push(box);
            if (node.image !== null) {
                assets.add(node.image.assetId);
            }
            for (const paint of [
                ...node.style.fills,
                ...(node.style.stroke === null ? [] : [node.style.stroke.paint]),
            ]) {
                if (paint.kind === DesignPaintKind.Image && paint.assetId !== null) {
                    assets.add(paint.assetId);
                }
            }
            const bounds: DesignSelectionBounds = DesignSelectionContext.bounds(box);
            const margin: number = Math.max(
                (node.style.stroke?.width ?? 0) / 2,
                node.style.blur * 3,
                ...node.style.shadows.map(
                    (shadow): number =>
                        Math.max(Math.abs(shadow.x), Math.abs(shadow.y)) +
                        shadow.blur * 3 +
                        Math.abs(shadow.spread),
                ),
            );
            let x1: number = bounds.left - margin;
            let y1: number = bounds.top - margin;
            let x2: number = bounds.right + margin;
            let y2: number = bounds.bottom + margin;
            let clipId: string | null = box.clipId;
            while (clipId !== null) {
                const clip: DesignBox | undefined = source.get(clipId);
                if (clip === undefined) {
                    break;
                }
                const clipBounds: DesignSelectionBounds = DesignSelectionContext.bounds(clip);
                x1 = Math.max(x1, clipBounds.left);
                y1 = Math.max(y1, clipBounds.top);
                x2 = Math.min(x2, clipBounds.right);
                y2 = Math.min(y2, clipBounds.bottom);
                clipId = clip.clipId;
            }
            if (x1 <= x2 && y1 <= y2) {
                left = Math.min(left, x1);
                top = Math.min(top, y1);
                right = Math.max(right, x2);
                bottom = Math.max(bottom, y2);
            }
        }
        if (!Number.isFinite(left)) {
            left = 0;
            top = 0;
            right = 1;
            bottom = 1;
        }
        return {
            scene,
            boxes,
            x: left,
            y: top,
            width: Math.max(1, right - left),
            height: Math.max(1, bottom - top),
            assetIds: [...assets],
        };
    }
    /** Four independent corners are clamped like the editor's signed-distance shape shader. */
    public static rounded(width: number, height: number, corners: DesignCorners): string {
        const maximum: number = Math.min(width, height) / 2;
        const a: number = Math.min(maximum, corners.topLeft);
        const b: number = Math.min(maximum, corners.topRight);
        const c: number = Math.min(maximum, corners.bottomRight);
        const d: number = Math.min(maximum, corners.bottomLeft);
        return `M${a} 0 H${width - b} ${b > 0 ? `A${b} ${b} 0 0 1 ${width} ${b}` : `L${width} 0`} V${height - c} ${c > 0 ? `A${c} ${c} 0 0 1 ${width - c} ${height}` : `L${width} ${height}`} H${d} ${d > 0 ? `A${d} ${d} 0 0 1 0 ${height - d}` : `L0 ${height}`} V${a} ${a > 0 ? `A${a} ${a} 0 0 1 ${a} 0` : 'L0 0'} Z`;
    }
    /** Resolved path coordinates fit paints to layout bounds and retain authored stroke widths and dashes. */
    public static shape(node: DesignSceneNode, box: DesignBox, attributes: string): string {
        if (node.kind === DesignKind.Boolean && node.path.length === 0) {
            return '';
        }
        if (node.kind === DesignKind.Ellipse) {
            return `<ellipse cx="${box.width / 2}" cy="${box.height / 2}" rx="${box.width / 2}" ry="${box.height / 2}" ${attributes}/>`;
        }
        if (node.path.length > 0) {
            const path: string = DesignPaths.scale(
                node.path,
                box.width / node.width,
                box.height / node.height,
            )
                .map((command): string => command.verb + command.values.join(' '))
                .join(' ');
            return `<path d="${path}" ${attributes}/>`;
        }
        return `<path d="${this.rounded(box.width, box.height, node.style.corners)}" ${attributes}/>`;
    }
}
