// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignValues as V } from './DesignValues.js';
import type { DesignText, DesignTextRun } from './DesignTypes.js';
import type { DesignTextStyleChanges } from './DesignOperationTypes.js';

/** Rich-format patches share the canonical range validator without accepting source replacement. */
export class DesignTextStyleChangesCodec {
    /** Unknown fields, empty patches and unsupported font/style values reject at the boundary. */
    public static parse(raw: unknown): DesignTextStyleChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['family', 'size', 'weight', 'italic', 'color', 'underline', 'font'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply at least one text style change.');
        }
        const defaults: DesignText | null = DesignDefaults.node('style-default', 'text').text;
        if (defaults === null) {
            throw new Error('Text defaults are unavailable.');
        }
        const text: DesignText = DesignStyleCodec.text({
            ...defaults,
            content: 'x',
            runs: [
                {
                    start: 0,
                    end: 1,
                    family: defaults.family,
                    size: defaults.size,
                    weight: defaults.weight,
                    italic: defaults.italic,
                    color: '#000000',
                    underline: false,
                    ...value,
                },
            ],
        });
        const parsed: DesignTextRun | undefined = text.runs[0];
        if (parsed === undefined) {
            throw new Error('Text style defaults are unavailable.');
        }
        return {
            ...(value['family'] === undefined ? {} : { family: parsed.family }),
            ...(value['size'] === undefined ? {} : { size: parsed.size }),
            ...(value['weight'] === undefined ? {} : { weight: parsed.weight }),
            ...(value['italic'] === undefined ? {} : { italic: parsed.italic }),
            ...(value['color'] === undefined ? {} : { color: parsed.color }),
            ...(value['underline'] === undefined ? {} : { underline: parsed.underline }),
            ...(value['font'] === undefined ? {} : { font: parsed.font ?? null }),
        };
    }
}
