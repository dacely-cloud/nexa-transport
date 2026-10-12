// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignValues as V } from './DesignValues.js';
import { DesignAlign, type DesignText } from './DesignTypes.js';
import type { DesignTypographyChanges } from './DesignOperationTypes.js';

/** Typography validation shares the canonical text validator without filling omitted saved properties. */
export class DesignTypographyChangesCodec {
    /** Rejects body replacement, empty patches and invalid styles at the wire boundary. */
    public static parse(raw: unknown): DesignTypographyChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['family', 'size', 'weight', 'italic', 'lineHeight', 'letterSpacing', 'align', 'font'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply at least one typography change.');
        }
        const defaults: DesignText | null = DesignDefaults.node('typography-default', 'text').text;
        if (defaults === null) {
            throw new Error('Text defaults are unavailable.');
        }
        const parsed: DesignText = DesignStyleCodec.text({ ...defaults, ...value });
        return {
            ...(value['family'] === undefined ? {} : { family: parsed.family }),
            ...(value['size'] === undefined ? {} : { size: parsed.size }),
            ...(value['weight'] === undefined ? {} : { weight: parsed.weight }),
            ...(value['italic'] === undefined ? {} : { italic: parsed.italic }),
            ...(value['lineHeight'] === undefined ? {} : { lineHeight: parsed.lineHeight }),
            ...(value['letterSpacing'] === undefined
                ? {}
                : { letterSpacing: parsed.letterSpacing }),
            ...(value['align'] === undefined
                ? {}
                : {
                      align: V.choice(value['align'], [
                          DesignAlign.Start,
                          DesignAlign.Center,
                          DesignAlign.End,
                      ]),
                  }),
            ...(value['font'] === undefined ? {} : { font: parsed.font ?? null }),
        };
    }
}
