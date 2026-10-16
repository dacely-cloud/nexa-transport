// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgSelection } from './DesignSvgTypes.js';
import { DesignSvgGeometry } from './DesignSvgGeometry.js';

/** Script fallback bytes are embedded only when selected editable text can need those faces. */
export class DesignSvgScriptFonts {
    /** Exact public originals and their licenses keep downloaded text independent of system fonts. */
    public static async embed(selection: DesignSvgSelection): Promise<string> {
        const ids: ReadonlySet<string> = new Set(selection.boxes.map((box): string => box.id));
        let arabic: boolean = false;
        let hebrew: boolean = false;
        for (const node of selection.scene.nodes) {
            if (!ids.has(node.id) || node.text === null) {
                continue;
            }
            arabic ||=
                /\p{Script_Extensions=Arabic}/u.test(node.text.content) ||
                node.text.family.toLowerCase() === 'noto sans arabic' ||
                node.text.runs.some(
                    (run): boolean => run.family.toLowerCase() === 'noto sans arabic',
                );
            hebrew ||=
                /\p{Script_Extensions=Hebrew}/u.test(node.text.content) ||
                node.text.family.toLowerCase() === 'noto sans hebrew' ||
                node.text.runs.some(
                    (run): boolean => run.family.toLowerCase() === 'noto sans hebrew',
                );
        }
        if (!arabic && !hebrew) {
            return '';
        }
        const {
            DesignScriptFont,
            DesignScriptFontBytes,
        }: typeof import('./DesignScriptFontBytes.js') = await import('./DesignScriptFontBytes.js');
        const { DesignScriptFontLicense }: typeof import('./DesignScriptFontLicense.js') =
            await import('./DesignScriptFontLicense.js');
        const families: readonly string[] = [
            ...(arabic ? [DesignScriptFont.Arabic] : []),
            ...(hebrew ? [DesignScriptFont.Hebrew] : []),
        ];
        const css: string = Object.values(DesignScriptFont)
            .filter((family): boolean => families.includes(family))
            .flatMap((family): readonly string[] =>
                ['normal', 'italic'].map(
                    (style: string): string =>
                        `@font-face{font-family:'${family}';font-style:${style};font-weight:100 900;src:url(data:font/ttf;base64,${DesignScriptFontBytes.encoded(family)}) format('truetype');}`,
                ),
            )
            .join('');
        return (
            DesignScriptFontLicense.texts
                .map(
                    (text: string): string =>
                        `<metadata>${DesignSvgGeometry.escape(text)}</metadata>`,
                )
                .join('') + `<style>${css}</style>`
        );
    }
}
