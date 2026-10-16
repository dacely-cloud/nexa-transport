// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgLayerContext } from './DesignSvgImportContext.js';
import { DesignSvgReferences } from './DesignSvgReferences.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgTransforms as T } from './DesignSvgTransforms.js';

/** Referenced XML remains immutable while its editable instance receives independent native identities. */
export interface DesignSvgUsePlan {
    readonly element: DesignSvgElement;
    readonly context: DesignSvgLayerContext;
}

/** Local use references inherit the host's style while CSS selectors stop at the cloned subtree boundary. */
export class DesignSvgImportUse {
    public static plan(
        element: DesignSvgElement,
        context: DesignSvgLayerContext,
        elements: ReadonlyMap<string, DesignSvgElement>,
    ): DesignSvgUsePlan {
        const id: string = DesignSvgReferences.fragment(
            element.attributes['href'] ?? element.attributes['xlink:href'] ?? '',
        );
        if (context.references.includes(id) || context.references.length >= 32) {
            throw new DesignSvgInputError('SVG use reference is cyclic or too deep.');
        }
        const referenced: DesignSvgElement | undefined = elements.get(id);
        if (referenced === undefined) {
            throw new DesignSvgInputError('SVG use element not found: ' + id);
        }
        const x: number = DesignSvgNumbers.length(
            context.style['x'] ?? element.attributes['x'] ?? '0',
            context.width,
        );
        const y: number = DesignSvgNumbers.length(
            context.style['y'] ?? element.attributes['y'] ?? '0',
            context.height,
        );
        const attributes: Record<string, string> = { ...referenced.attributes };
        if (referenced.name === 'symbol' || referenced.name === 'svg') {
            for (const key of ['width', 'height']) {
                const value: string | undefined = context.style[key] ?? element.attributes[key];
                if (value !== undefined && value !== 'auto') {
                    attributes[key] = value;
                }
            }
        }
        return {
            element: { ...referenced, attributes },
            context: {
                ...context,
                matrix: T.multiply(context.matrix, { ...T.identity, e: x, f: y }),
                ancestors: [],
                references: [...context.references, id],
            },
        };
    }
}
