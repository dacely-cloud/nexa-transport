// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import {
    DesignKind,
    DesignFrameGridKind,
    DesignFrameGridDistribution,
    type DesignFrameGrid,
} from './DesignTypes.js';

/** Construction overlays use bounded canonical settings shared by agents and the website. */
export class DesignFrameGridCodec {
    /** Only actual frames and reusable frame definitions own construction overlays. */
    public static supports(kind: DesignKind): boolean {
        return (
            kind === DesignKind.Frame ||
            kind === DesignKind.Component ||
            kind === DesignKind.ComponentSet
        );
    }
    /** A square grid starts on an eight-pixel rhythm; columns and rows stretch within margins. */
    public static defaults(id: string, kind: DesignFrameGridKind): DesignFrameGrid {
        return {
            id,
            kind,
            distribution: DesignFrameGridDistribution.Stretch,
            visible: true,
            color: '#A68CFF28',
            count: kind === DesignFrameGridKind.Columns ? 12 : 8,
            size: kind === DesignFrameGridKind.Square ? 8 : 64,
            gutter: 24,
            margin: 32,
            offset: 0,
        };
    }
    /** Partial creation records receive canonical defaults; replaced arrays still retain complete existing grid settings. */
    public static grids(raw: unknown): readonly DesignFrameGrid[] {
        const seen: Set<string> = new Set();
        return V.list(raw, 8, (entry: unknown): DesignFrameGrid => {
            const value: Readonly<Record<string, unknown>> = V.fields(
                entry,
                [
                    'id',
                    'kind',
                    'distribution',
                    'visible',
                    'color',
                    'count',
                    'size',
                    'gutter',
                    'margin',
                    'offset',
                ],
                ['id', 'kind'],
            );
            const id: string = V.id(value['id']);
            if (seen.has(id)) {
                throw new Error('Duplicate frame grid identity: ' + id);
            }
            seen.add(id);
            const kind: DesignFrameGridKind = V.choice(
                value['kind'],
                Object.values(DesignFrameGridKind),
            );
            const defaults: DesignFrameGrid = this.defaults(id, kind);
            return {
                id,
                kind,
                distribution:
                    value['distribution'] === undefined
                        ? defaults.distribution
                        : V.choice(
                              value['distribution'],
                              Object.values(DesignFrameGridDistribution),
                          ),
                visible:
                    value['visible'] === undefined ? defaults.visible : V.boolean(value['visible']),
                color: value['color'] === undefined ? defaults.color : V.color(value['color']),
                count:
                    value['count'] === undefined
                        ? defaults.count
                        : V.number(value['count'], 1, 256, true),
                size:
                    value['size'] === undefined
                        ? defaults.size
                        : V.number(value['size'], 0.01, 100000),
                gutter:
                    value['gutter'] === undefined
                        ? defaults.gutter
                        : V.number(value['gutter'], 0, 100000),
                margin:
                    value['margin'] === undefined
                        ? defaults.margin
                        : V.number(value['margin'], 0, 100000),
                offset:
                    value['offset'] === undefined
                        ? defaults.offset
                        : V.number(value['offset'], -100000, 100000),
            };
        });
    }
}
