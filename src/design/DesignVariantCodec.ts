// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    DesignVariantValue,
    DesignVariantSet,
    DesignVariantPropertyEdit,
} from './DesignVariantTypes.js';
import { DesignValues as V } from './DesignValues.js';

/** Strict bounded values shared by saved documents, editor changes and native component tools. */
export class DesignVariantCodec {
    /** Names and values are human text rather than arbitrary object keys. */
    public static label(raw: unknown): string {
        const text: string = V.text(raw, 80);
        if (text !== text.trim()) {
            throw new Error('Variant names and values cannot start or end with whitespace.');
        }
        return text;
    }
    /** An empty template may have no default until its variants are inserted atomically. */
    public static set(raw: unknown): DesignVariantSet {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['properties', 'defaultId']);
        const properties: readonly string[] = V.list(
            value['properties'],
            16,
            (entry: unknown): string => this.label(entry),
        );
        if (properties.length === 0 || new Set(properties).size !== properties.length) {
            throw new Error('A component set requires 1 to 16 distinct properties.');
        }
        return { properties, defaultId: V.optionalId(value['defaultId']) };
    }
    /** Each dimension is named once; whole-set compatibility is checked after the transaction. */
    public static values(raw: unknown): readonly DesignVariantValue[] {
        const values: readonly DesignVariantValue[] = V.list(
            raw,
            16,
            (entry: unknown): DesignVariantValue => {
                const value: Readonly<Record<string, unknown>> = V.record(entry, [
                    'property',
                    'value',
                ]);
                return {
                    property: this.label(value['property']),
                    value: this.label(value['value']),
                };
            },
        );
        if (
            values.length === 0 ||
            new Set(values.map((entry: DesignVariantValue): string => entry.property)).size !==
                values.length
        ) {
            throw new Error('Supply 1 to 16 distinct variant properties.');
        }
        return values;
    }
    /** Property editing preserves existing values through explicit source names. */
    public static properties(raw: unknown): readonly DesignVariantPropertyEdit[] {
        const edits: readonly DesignVariantPropertyEdit[] = V.list(
            raw,
            16,
            (entry: unknown): DesignVariantPropertyEdit => {
                const value: Readonly<Record<string, unknown>> = V.record(entry, ['from', 'name']);
                return {
                    from: value['from'] === null ? null : this.label(value['from']),
                    name: this.label(value['name']),
                };
            },
        );
        const sources: readonly string[] = edits.flatMap(
            (entry: DesignVariantPropertyEdit): string[] =>
                entry.from === null ? [] : [entry.from],
        );
        if (
            edits.length === 0 ||
            new Set(edits.map((entry: DesignVariantPropertyEdit): string => entry.name)).size !==
                edits.length ||
            new Set(sources).size !== sources.length
        ) {
            throw new Error('Choose distinct property names and sources.');
        }
        return edits;
    }
}
