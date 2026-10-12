// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgLayerContext } from './DesignSvgImportContext.js';
import { DesignSvgReferences } from './DesignSvgReferences.js';
import { DesignSvgImportStyles } from './DesignSvgImportStyles.js';
import { DesignSvgImportBounds } from './DesignSvgImportBounds.js';
import type { DesignSvgSourceBounds } from './DesignSvgImportGeometry.js';
import { DesignSvgImportTree } from './DesignSvgImportTree.js';
import { DesignSvgImportMask } from './DesignSvgImportMask.js';
import { DesignSvgImportViewport } from './DesignSvgImportViewport.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';
import type { DesignMaskMode } from './DesignMaskTypes.js';

/** Mask content uses the normal editable renderer, including colors, gradients, opacity and nested clips. */
export type DesignSvgResourceRender = (
    element: DesignSvgElement,
    context: DesignSvgLayerContext,
) => Promise<string | null>;

/** Source interpretation and region clipping follow independent SVG maskContentUnits and maskUnits. */
export class DesignSvgImportMasks {
    public constructor(
        public readonly elements: ReadonlyMap<string, DesignSvgElement>,
        public readonly styles: DesignSvgImportStyles,
        public readonly tree: DesignSvgImportTree,
        public readonly masks: DesignSvgImportMask,
        public readonly viewports: DesignSvgImportViewport,
        public readonly render: DesignSvgResourceRender,
    ) {}
    public async apply(
        targetId: string,
        expression: string,
        context: DesignSvgLayerContext,
    ): Promise<void> {
        if (expression.trim() === 'none') {
            return;
        }
        const id: string = DesignSvgReferences.paint(expression);
        if (context.references.includes(id) || context.references.length >= 32) {
            throw new Error('SVG mask reference is cyclic or too deep.');
        }
        const definition: DesignSvgElement | undefined = this.elements.get(id);
        if (definition === undefined || definition.name !== 'mask') {
            throw new Error('SVG mask not found: ' + id);
        }
        const bounds: DesignSvgSourceBounds | null = await DesignSvgImportBounds.measure(
            this.tree,
            targetId,
            T.inverse(context.matrix),
        );
        const box: DesignSvgMatrix =
            bounds === null
                ? { ...T.identity, a: 0, d: 0 }
                : { a: bounds.width, b: 0, c: 0, d: bounds.height, e: bounds.x, f: bounds.y };
        const contentUnits: string = definition.attributes['maskContentUnits'] ?? 'userSpaceOnUse';
        const regionUnits: string = definition.attributes['maskUnits'] ?? 'objectBoundingBox';
        if (
            !['userSpaceOnUse', 'objectBoundingBox'].includes(contentUnits) ||
            !['userSpaceOnUse', 'objectBoundingBox'].includes(regionUnits)
        ) {
            throw new Error('Unsupported SVG mask coordinate units.');
        }
        const style: Readonly<Record<string, string>> = this.styles.definition(definition);
        const source: string | null = await this.render(definition, {
            ...context,
            parentId: context.parentId,
            matrix: T.multiply(
                context.matrix,
                contentUnits === 'objectBoundingBox' ? box : T.identity,
            ),
            width: contentUnits === 'objectBoundingBox' ? 1 : context.width,
            height: contentUnits === 'objectBoundingBox' ? 1 : context.height,
            style,
            ancestors: this.styles.ancestors.get(definition) ?? [],
            references: [...context.references, id],
        });
        if (source === null) {
            throw new Error('Missing SVG mask source.');
        }
        const object: boolean = regionUnits === 'objectBoundingBox';
        const x: number = DesignSvgNumbers.length(
            definition.attributes['x'] ?? '-10%',
            object ? 1 : context.width,
        );
        const y: number = DesignSvgNumbers.length(
            definition.attributes['y'] ?? '-10%',
            object ? 1 : context.height,
        );
        const width: number = DesignSvgNumbers.length(
            definition.attributes['width'] ?? '120%',
            object ? 1 : context.width,
        );
        const height: number = DesignSvgNumbers.length(
            definition.attributes['height'] ?? '120%',
            object ? 1 : context.height,
        );
        const matrix: DesignSvgMatrix = T.multiply(
            context.matrix,
            T.multiply(object ? box : T.identity, { ...T.identity, e: x, f: y }),
        );
        await this.viewports.rectangle(source, width, height, matrix);
        const interpretation: string =
            context.style['mask-mode'] === 'match-source' ||
            context.style['mask-mode'] === undefined
                ? (style['mask-type'] ?? 'luminance')
                : context.style['mask-mode'];
        if (interpretation !== 'alpha' && interpretation !== 'luminance') {
            throw new Error('Unsupported SVG mask interpretation.');
        }
        const mode: DesignMaskMode = interpretation;
        this.masks.wrap(targetId, source, mode);
    }
}
