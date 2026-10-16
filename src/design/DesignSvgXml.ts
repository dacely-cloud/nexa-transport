// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { XmlReader } from './XmlReader.js';
import { DesignSvgInputError } from './DesignSvgInputError.js';

/** Inert SVG data; imported markup never enters the browser DOM. */
export interface DesignSvgElement {
    readonly name: string;
    readonly attributes: Readonly<Record<string, string>>;
    readonly children: readonly DesignSvgContent[];
}
/** Text and element records preserve the original child order. */
export type DesignSvgContent = DesignSvgElement | string;

/** Applies SVG root and namespace constraints to the shared bounded XML reader. */
export class DesignSvgXml {
    public constructor(public readonly source: string) {}
    /** Requires a complete SVG document and its standard namespace when declared. */
    public parse(): DesignSvgElement {
        let root: DesignSvgElement;
        try {
            root = new XmlReader(this.source).parse();
        } catch (error: unknown) {
            if (error instanceof SyntaxError) {
                throw new DesignSvgInputError(error.message);
            }
            throw error;
        }
        if (root.name !== 'svg') {
            throw new DesignSvgInputError('Expected an svg root');
        }
        const namespace: string | undefined = root.attributes['xmlns'];
        if (namespace !== undefined && namespace !== 'http://www.w3.org/2000/svg') {
            throw new DesignSvgInputError('Unsupported SVG namespace');
        }
        return root;
    }
}
