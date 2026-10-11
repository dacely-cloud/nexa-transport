// SPDX-License-Identifier: Apache-2.0

import {
    DesignSvgLimits,
    type DesignSvgResult,
    type DesignSvgSelection,
} from './DesignSvgTypes.js';
import type { DesignBox } from './DesignTypes.js';
import { DesignSvgGeometry } from './DesignSvgGeometry.js';

/** Explicit exports embed only the selected built-in font faces; ordinary scene transfers contain no font bytes. */
export class DesignSvgFonts {
    public static async embed(
        result: DesignSvgResult,
        selection: DesignSvgSelection,
    ): Promise<DesignSvgResult> {
        const used: ReadonlySet<boolean> = this.#used(selection);
        if (used.size === 0) {
            return result;
        }
        const { DesignInterBytes }: typeof import('./DesignInterBytes.js') =
            await import('./DesignInterBytes.js');
        const { DesignInterLicense }: typeof import('./DesignInterLicense.js') =
            await import('./DesignInterLicense.js');
        const css: string = [...used]
            .map(
                (italic: boolean): string =>
                    `@font-face{font-family:Inter;font-style:${italic ? 'italic' : 'normal'};font-weight:100 900;font-variation-settings:'opsz' 14;src:url(data:font/woff2;base64,${DesignInterBytes.encoded(italic)}) format('woff2');}`,
            )
            .join('');
        const svg: string = result.svg.replace(
            '<defs>',
            `<metadata>${DesignSvgGeometry.escape(DesignInterLicense.text)}</metadata><defs><style>${css}</style>`,
        );
        if (svg.length > DesignSvgLimits.characters) {
            throw new Error('Export individual frames to stay within the SVG content budget.');
        }
        return { ...result, svg };
    }
    /** Native file exports use real Inter shaping and the portable fallback for other system families. */
    public static inter(selection: DesignSvgSelection): boolean {
        return this.#used(selection).size > 0;
    }
    static #used(selection: DesignSvgSelection): ReadonlySet<boolean> {
        const ids: ReadonlySet<string> = new Set(
            selection.boxes.map((box: DesignBox): string => box.id),
        );
        const used: Set<boolean> = new Set();
        for (const node of selection.scene.nodes) {
            if (!ids.has(node.id) || node.text === null || node.text.content === '') {
                continue;
            }
            if (node.text.family.toLowerCase() === 'inter') {
                used.add(node.text.italic);
            }
            for (const run of node.text.runs) {
                if (run.family.toLowerCase() === 'inter') {
                    used.add(run.italic);
                }
            }
        }
        return used;
    }
}
