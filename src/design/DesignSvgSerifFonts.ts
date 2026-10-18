// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgSelection } from './DesignSvgTypes.js';
import { DesignSvgSelections } from './DesignSvgSelections.js';
import { DesignFontBindings } from './DesignFontBindings.js';
import { DesignSvgGeometry } from './DesignSvgGeometry.js';

/** Only explicit exports load and embed the optional public serif faces selected by their text. */
export class DesignSvgSerifFonts {
    /** Metadata scans do not import either font original. */
    public static used(selection: DesignSvgSelection): ReadonlySet<boolean> {
        const used: Set<boolean> = new Set();
        for (const node of DesignSvgSelections.nodes(selection)) {
            if (node.text === null || node.text.content === '') {
                continue;
            }
            if (node.text.font == null && node.text.family.toLowerCase() === 'source serif 4') {
                used.add(node.text.italic);
            }
            for (const run of node.text.runs) {
                if (
                    DesignFontBindings.resolve(node.text, run) === null &&
                    run.family.toLowerCase() === 'source serif 4'
                ) {
                    used.add(run.italic);
                }
            }
        }
        return used;
    }

    /** One original per selected style preserves portable lettering and upstream redistribution terms. */
    public static async embed(selection: DesignSvgSelection): Promise<string> {
        const used: ReadonlySet<boolean> = this.used(selection);
        if (used.size === 0) {
            return '';
        }
        const { DesignSourceSerifBytes }: typeof import('./DesignSourceSerifBytes.js') =
            await import('./DesignSourceSerifBytes.js');
        const { DesignSourceSerifLicense }: typeof import('./DesignSourceSerifLicense.js') =
            await import('./DesignSourceSerifLicense.js');
        const css: string = [...used]
            .map(
                (italic: boolean): string =>
                    `@font-face{font-family:'Source Serif 4';font-style:${italic ? 'italic' : 'normal'};font-weight:200 900;font-variation-settings:'opsz' 20;src:url(data:font/ttf;base64,${DesignSourceSerifBytes.encoded(italic)}) format('truetype');}`,
            )
            .join('');
        return `<metadata>${DesignSvgGeometry.escape(DesignSourceSerifLicense.text)}</metadata><style>${css}</style>`;
    }
}
