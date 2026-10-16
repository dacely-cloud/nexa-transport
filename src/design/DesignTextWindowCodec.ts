// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import type { DesignGlyphBounds } from './DesignFontGlyphTypes.js';
import type { DesignTextWindowRequest, DesignTextWindowCursor } from './DesignTextWindowTypes.js';

/** Strict selectors and bounded pixel coordinates are checked before storage or shaping. */
export class DesignTextWindowCodec {
    /** Expanded occurrence identities may contain escaped instance paths rather than authored layer IDs. */
    public static request(raw: unknown): DesignTextWindowRequest {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            [
                'id',
                'revision',
                'pageId',
                'occurrenceId',
                'window',
                'cursor',
                'limit',
                'paintClipping',
            ],
            ['id', 'revision', 'pageId', 'occurrenceId', 'window', 'cursor', 'limit'],
        );
        return {
            id: V.id(value['id']),
            revision: V.revision(value['revision']),
            pageId: V.id(value['pageId']),
            occurrenceId: V.text(value['occurrenceId'], 65536),
            window: this.bounds(value['window']),
            cursor: value['cursor'] === null ? null : this.cursor(value['cursor']),
            limit: V.number(value['limit'], 1, 256, true),
            ...(value['paintClipping'] === undefined
                ? {}
                : { paintClipping: V.boolean(value['paintClipping']) }),
        };
    }

    /** Rectangle sizes bound work independently of the saved text's full height or width. */
    public static bounds(raw: unknown): DesignGlyphBounds {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'x',
            'y',
            'width',
            'height',
        ]);
        return {
            x: V.number(value['x'], -1000000, 1000000),
            y: V.number(value['y'], -1000000, 1000000),
            width: V.number(value['width'], 0.01, 1000000),
            height: V.number(value['height'], 0.01, 1000000),
        };
    }

    /** Cursor counters are bounded by the native text and rich-range budgets. */
    public static cursor(raw: unknown): DesignTextWindowCursor {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'lineIndex',
            'segmentIndex',
            'glyphIndex',
        ]);
        return {
            lineIndex: V.number(value['lineIndex'], 0, 100000, true),
            segmentIndex: V.number(value['segmentIndex'], 0, 1024, true),
            glyphIndex:
                value['glyphIndex'] === null
                    ? null
                    : V.number(value['glyphIndex'], 0, 100000, true),
        };
    }
}
