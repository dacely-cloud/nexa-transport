// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignKind } from './DesignTypes.js';
import { DesignBlendMode, DesignIsolation } from './DesignBlendTypes.js';
import type { DesignStyleChanges, DesignCornerChanges } from './DesignOperationTypes.js';

/** Compact decoration edits share canonical style limits while excluding paint and source replacement. */
export class DesignStyleChangesCodec {
    /** Validates a nonempty partial set of effects and corner radii. */
    public static parse(raw: unknown): DesignStyleChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['blur', 'shadows', 'corners', 'blendMode', 'isolation'],
            [],
        );
        if (
            Object.keys(value).length === 0 ||
            Object.keys(value).some((field: string): boolean => value[field] === undefined)
        ) {
            throw new Error('Supply at least one style property.');
        }
        return {
            ...(value['blendMode'] === undefined
                ? {}
                : {
                      blendMode:
                          value['blendMode'] === null
                              ? null
                              : V.choice(
                                    value['blendMode'],
                                    Object.values(DesignBlendMode),
                                    'style.blendMode',
                                ),
                  }),
            ...(value['isolation'] === undefined
                ? {}
                : {
                      isolation:
                          value['isolation'] === null
                              ? null
                              : V.choice(
                                    value['isolation'],
                                    Object.values(DesignIsolation),
                                    'style.isolation',
                                ),
                  }),
            ...(value['blur'] === undefined ? {} : { blur: V.number(value['blur'], 0, 1000) }),
            ...(value['shadows'] === undefined
                ? {}
                : {
                      shadows: DesignStyleCodec.style({
                          ...DesignDefaults.style(DesignKind.Rectangle),
                          shadows: value['shadows'],
                      }).shadows,
                  }),
            ...(value['corners'] === undefined ? {} : { corners: this.#corners(value['corners']) }),
        };
    }
    static #corners(raw: unknown): DesignCornerChanges {
        const fields: readonly string[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
        const value: Readonly<Record<string, unknown>> = V.fields(raw, fields, []);
        if (
            Object.keys(value).length === 0 ||
            Object.keys(value).some((field: string): boolean => value[field] === undefined)
        ) {
            throw new Error('Supply at least one corner radius.');
        }
        return {
            ...(value['topLeft'] === undefined ? {} : { topLeft: V.number(value['topLeft'], 0) }),
            ...(value['topRight'] === undefined
                ? {}
                : { topRight: V.number(value['topRight'], 0) }),
            ...(value['bottomRight'] === undefined
                ? {}
                : { bottomRight: V.number(value['bottomRight'], 0) }),
            ...(value['bottomLeft'] === undefined
                ? {}
                : { bottomLeft: V.number(value['bottomLeft'], 0) }),
        };
    }
}
