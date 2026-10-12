// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignLayoutCodec } from './DesignLayoutCodec.js';
import { DesignValues as V } from './DesignValues.js';
import type { DesignLayout } from './DesignTypes.js';
import type { DesignLayoutChanges } from './DesignOperationTypes.js';

/** Compact layout changes reuse the canonical complete-layout validator without filling omitted saved fields. */
export class DesignLayoutChangesCodec {
    static readonly #defaults: DesignLayout = DesignDefaults.node('layout-default').layout;

    /** Rejects unknown keys, empty edits and invalid choices before native command planning. */
    public static parse(raw: unknown): DesignLayoutChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['flow', 'wrap', 'gap', 'rowGap', 'padding', 'align', 'justify', 'columns', 'clip'],
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply at least one layout change.');
        }
        const padding: Readonly<Record<string, unknown>> | undefined =
            value['padding'] === undefined
                ? undefined
                : V.fields(value['padding'], ['top', 'right', 'bottom', 'left'], []);
        if (padding !== undefined && Object.keys(padding).length === 0) {
            throw new Error('Supply at least one padding edge.');
        }
        const parsed: DesignLayout = DesignLayoutCodec.layout({
            ...this.#defaults,
            ...value,
            padding: { ...this.#defaults.padding, ...padding },
        });
        return {
            ...(value['flow'] === undefined ? {} : { flow: parsed.flow }),
            ...(value['wrap'] === undefined ? {} : { wrap: parsed.wrap }),
            ...(value['gap'] === undefined ? {} : { gap: parsed.gap }),
            ...(value['rowGap'] === undefined ? {} : { rowGap: parsed.rowGap }),
            ...(value['align'] === undefined ? {} : { align: parsed.align }),
            ...(value['justify'] === undefined ? {} : { justify: parsed.justify }),
            ...(value['columns'] === undefined ? {} : { columns: parsed.columns }),
            ...(value['clip'] === undefined ? {} : { clip: parsed.clip }),
            ...(padding === undefined
                ? {}
                : {
                      padding: {
                          ...(padding['top'] === undefined ? {} : { top: parsed.padding.top }),
                          ...(padding['right'] === undefined
                              ? {}
                              : { right: parsed.padding.right }),
                          ...(padding['bottom'] === undefined
                              ? {}
                              : { bottom: parsed.padding.bottom }),
                          ...(padding['left'] === undefined ? {} : { left: parsed.padding.left }),
                      },
                  }),
        };
    }
}
