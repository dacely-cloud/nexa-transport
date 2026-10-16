// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignBidiParagraph, type DesignBidiRun } from './DesignBidiParagraph.js';
import { DesignTextDirection, type DesignResolvedTextDirection } from './DesignTextDirection.js';

/** SVG anchors use the paragraph direction while native text alignment stays in physical coordinates. */
export class DesignSvgImportTextDirection {
    /** Explicit resolved exports can be imported when native bidi keeps the same logical directional run. */
    public static read(
        content: string,
        style: Readonly<Record<string, string>>,
    ): DesignResolvedTextDirection {
        const direction: DesignResolvedTextDirection =
            style['direction'] === 'rtl' ? DesignTextDirection.Rtl : DesignTextDirection.Ltr;
        if (style['unicode-bidi'] === 'bidi-override') {
            const runs: readonly DesignBidiRun[] = new DesignBidiParagraph(content, direction).runs(
                0,
                content.length,
            );
            const run: DesignBidiRun | undefined = runs[0];
            if (
                runs.length !== 1 ||
                run?.start !== 0 ||
                run.end !== content.length ||
                run.direction !== direction ||
                /\p{Bidi_Control}/u.test(content)
            ) {
                throw new DesignSvgInputError(
                    'SVG bidi override changes logical ordering and requires native directional override support.',
                );
            }
        }
        return direction;
    }

    /** Start and end swap physical edges in right-to-left text; middle remains the visual center. */
    public static anchor(anchor: string, direction: DesignResolvedTextDirection): number {
        return anchor === 'middle'
            ? 0.5
            : (anchor === 'end') !== (direction === DesignTextDirection.Rtl)
              ? 1
              : 0;
    }
}
