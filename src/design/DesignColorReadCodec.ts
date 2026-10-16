// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import type { DesignColorReadRequest, DesignColorReadPage } from './DesignColorReadTypes.js';
import type { DesignSelectionColor } from './DesignRecolorEdits.js';

/** Closed portable boundaries keep color requests and results bounded and body-free. */
export class DesignColorReadCodec {
    /** Requests use the same selection bounds as the native recolor command. */
    public static request(raw: unknown): DesignColorReadRequest {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'revision',
            'pageId',
            'selection',
            'offset',
            'limit',
        ]);
        const selection: readonly string[] = V.list(
            value['selection'],
            128,
            (id: unknown): string => V.id(id),
        );
        if (selection.length === 0 || new Set(selection).size !== selection.length) {
            throw new Error('Select 1 to 128 distinct layers.');
        }
        return {
            id: V.id(value['id']),
            revision: V.revision(value['revision']),
            pageId: V.id(value['pageId']),
            selection,
            offset: V.number(value['offset'], 0, 33554432, true),
            limit: V.number(value['limit'], 1, 64, true),
        };
    }

    /** Validate compact response rows before displaying native data in the inspector. */
    public static page(raw: unknown): DesignColorReadPage {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'revision',
            'pageId',
            'selectionSha256',
            'offset',
            'total',
            'colors',
            'nextOffset',
        ]);
        const selectionSha256: string = V.text(value['selectionSha256'], 64);
        if (!/^[a-f0-9]{64}$/u.test(selectionSha256)) {
            throw new Error('Invalid selection fingerprint.');
        }
        const offset: number = V.number(value['offset'], 0, 33554432, true);
        const total: number = V.number(value['total'], offset, 33554432, true);
        const colors: readonly DesignSelectionColor[] = V.list(
            value['colors'],
            64,
            (rawColor: unknown): DesignSelectionColor => {
                const color: Readonly<Record<string, unknown>> = V.record(rawColor, [
                    'color',
                    'layers',
                ]);
                return {
                    color: V.color(color['color']),
                    layers: V.number(color['layers'], 1, 10000, true),
                };
            },
        );
        const nextOffset: number | null =
            value['nextOffset'] === null
                ? null
                : V.number(value['nextOffset'], offset + 1, total, true);
        if (
            offset + colors.length > total ||
            new Set(colors.map((entry: DesignSelectionColor): string => entry.color)).size !==
                colors.length ||
            (nextOffset === null
                ? offset + colors.length !== total
                : nextOffset !== offset + colors.length || nextOffset >= total)
        ) {
            throw new Error('Incomplete color page.');
        }
        return {
            id: V.id(value['id']),
            revision: V.revision(value['revision']),
            pageId: V.id(value['pageId']),
            selectionSha256,
            offset,
            total,
            colors,
            nextOffset,
        };
    }
}
