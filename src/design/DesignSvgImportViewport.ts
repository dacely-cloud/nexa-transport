// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgLayerContext } from './DesignSvgImportContext.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';
import {
    DesignSvgImportGeometry,
    type DesignSvgImportedGeometry,
} from './DesignSvgImportGeometry.js';
import { DesignSvgImportMask } from './DesignSvgImportMask.js';
import { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignDefaults } from './DesignDefaults.js';

/** Viewport clipping uses the physical rectangle before applying its internal viewBox. */
export interface DesignSvgViewportPlan {
    readonly matrix: DesignSvgMatrix;
    readonly context: DesignSvgLayerContext;
    readonly width: number;
    readonly height: number;
    readonly clip: boolean;
}

/** Nested SVGs and referenced symbols retain their own aspect mapping and editable viewport clips. */
export class DesignSvgImportViewport {
    #sequence: number = 0;
    public constructor(
        public readonly tree: DesignSvgImportTree,
        public readonly masks: DesignSvgImportMask,
        public readonly identify: (key: string) => string,
    ) {}
    public plan(
        element: DesignSvgElement,
        context: DesignSvgLayerContext,
    ): DesignSvgViewportPlan | null {
        const style: Readonly<Record<string, string>> = context.style;
        const width: number = DesignSvgNumbers.length(
            style['width'] ?? element.attributes['width'] ?? '100%',
            context.width,
        );
        const height: number = DesignSvgNumbers.length(
            style['height'] ?? element.attributes['height'] ?? '100%',
            context.height,
        );
        if (width < 0 || height < 0) {
            throw new DesignSvgInputError('SVG viewport dimensions must be nonnegative.');
        }
        if (width === 0 || height === 0) {
            return null;
        }
        const x: number =
            element.name === 'symbol'
                ? 0
                : DesignSvgNumbers.length(
                      style['x'] ?? element.attributes['x'] ?? '0',
                      context.width,
                  );
        const y: number =
            element.name === 'symbol'
                ? 0
                : DesignSvgNumbers.length(
                      style['y'] ?? element.attributes['y'] ?? '0',
                      context.height,
                  );
        const viewport: ReturnType<typeof T.viewport> = T.viewport(
            width,
            height,
            element.attributes['viewBox'],
            element.attributes['preserveAspectRatio'],
        );
        const matrix: DesignSvgMatrix = T.multiply(context.matrix, { ...T.identity, e: x, f: y });
        const box: readonly number[] =
            element.attributes['viewBox'] === undefined
                ? []
                : DesignSvgNumbers.list(element.attributes['viewBox'], 4);
        return {
            matrix,
            width,
            height,
            clip: style['overflow'] !== 'visible',
            context: {
                ...context,
                matrix: T.multiply(matrix, viewport.matrix),
                width: box[2] ?? width,
                height: box[3] ?? height,
            },
        };
    }
    public async clip(id: string, plan: DesignSvgViewportPlan): Promise<void> {
        if (!plan.clip) {
            return;
        }
        await this.rectangle(id, plan.width, plan.height, plan.matrix);
    }
    /** Mask regions clip their source pixels independently of mask content units. */
    public async rectangle(
        id: string,
        width: number,
        height: number,
        matrix: DesignSvgMatrix,
    ): Promise<void> {
        if (width <= 0 || height <= 0) {
            const empty: string = this.identify('viewport-clip:' + (++this.#sequence).toString());
            this.tree.append(DesignDefaults.node(empty, 'group', 'Empty mask region'));
            this.masks.wrap(id, empty);
            return;
        }
        const geometry: DesignSvgImportedGeometry | null = await DesignSvgImportGeometry.convert(
            `M0 0H${width}V${height}H0Z`,
            matrix,
        );
        if (geometry === null) {
            throw new Error('Missing SVG viewport clip geometry.');
        }
        const sourceId: string = this.identify('viewport-clip:' + (++this.#sequence).toString());
        const base: ReturnType<typeof DesignDefaults.node> = DesignDefaults.node(
            sourceId,
            'path',
            'Viewport clip',
        );
        this.tree.append({
            ...base,
            ...geometry.target,
            style: { ...base.style, fills: [DesignDefaults.paint('#FFFFFF')], stroke: null },
        });
        this.tree.recordGeometry(sourceId, geometry.target);
        this.masks.wrap(id, sourceId);
    }
}
