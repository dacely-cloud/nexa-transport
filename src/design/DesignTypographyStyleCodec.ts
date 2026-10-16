// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignFontFamilyCodec } from './DesignFontFamilyCodec.js';

import { DesignValues as V } from './DesignValues.js';
import { DesignFontCodec } from './DesignFontCodec.js';
import { DesignAlign } from './DesignTypes.js';
import { DesignTextDirection } from './DesignTextDirection.js';
import type {
    DesignTypographyValues,
    DesignTypographyOverrides,
    DesignTypographyLink,
} from './DesignTypographyStyleTypes.js';

/** Typography style and binding records share strict scalar validation without source-body allocation. */
export class DesignTypographyStyleCodec {
    /** Unbound defaults provide a complete base for a newly authored style. */
    public static defaults(): DesignTypographyValues {
        return {
            family: 'Inter',
            size: 16,
            weight: 400,
            italic: false,
            lineHeight: 1.4,
            letterSpacing: 0,
            align: DesignAlign.Start,
            font: null,
        };
    }
    /** Complete persisted style values are canonical and detached from input. */
    public static values(raw: unknown): DesignTypographyValues {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            [
                'family',
                'size',
                'weight',
                'italic',
                'lineHeight',
                'letterSpacing',
                'align',
                'font',
                'direction',
            ],
            ['family', 'size', 'weight', 'italic', 'lineHeight', 'letterSpacing', 'align', 'font'],
        );
        return {
            ...(Object.hasOwn(value, 'direction')
                ? {
                      direction: V.choice(
                          value['direction'],
                          Object.values(DesignTextDirection),
                          'typography.direction',
                      ),
                  }
                : {}),
            family: DesignFontFamilyCodec.family(value['family']),
            size: V.number(value['size'], 1, 1000),
            weight: V.number(value['weight'], 100, 900, true),
            italic: V.boolean(value['italic']),
            lineHeight: V.number(value['lineHeight'], 0.5, 5),
            letterSpacing: V.number(value['letterSpacing'], -100, 500),
            align: V.choice(value['align'], [
                DesignAlign.Start,
                DesignAlign.Center,
                DesignAlign.End,
            ]),
            font: DesignFontCodec.binding(value['font']),
        };
    }
    /** Changed and overridden fields remain partial; an absent field preserves inheritance. */
    public static changes(raw: unknown, empty: boolean = false): DesignTypographyOverrides {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            [
                'family',
                'size',
                'weight',
                'italic',
                'lineHeight',
                'letterSpacing',
                'align',
                'font',
                'direction',
            ],
            [],
        );
        if (!empty && Object.keys(value).length === 0) {
            throw new Error('Supply at least one typography change.');
        }
        const parsed: DesignTypographyValues = this.values({ ...this.defaults(), ...value });
        return {
            ...(value['direction'] === undefined ? {} : { direction: parsed.direction }),
            ...(value['family'] === undefined ? {} : { family: parsed.family }),
            ...(value['size'] === undefined ? {} : { size: parsed.size }),
            ...(value['weight'] === undefined ? {} : { weight: parsed.weight }),
            ...(value['italic'] === undefined ? {} : { italic: parsed.italic }),
            ...(value['lineHeight'] === undefined ? {} : { lineHeight: parsed.lineHeight }),
            ...(value['letterSpacing'] === undefined
                ? {}
                : { letterSpacing: parsed.letterSpacing }),
            ...(value['align'] === undefined ? {} : { align: parsed.align }),
            ...(value['font'] === undefined ? {} : { font: parsed.font }),
        };
    }
    /** Null detaches a layer; omitted overrides inherit every saved property. */
    public static link(raw: unknown): DesignTypographyLink | null {
        if (raw === null) {
            return null;
        }
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['tokenId', 'overrides'],
            ['tokenId'],
        );
        return {
            tokenId: V.id(value['tokenId']),
            ...(value['overrides'] === undefined
                ? {}
                : { overrides: this.changes(value['overrides'], true) }),
        };
    }
}
