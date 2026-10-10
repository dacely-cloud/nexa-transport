// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignImageFramingCodec } from './DesignImageFramingCodec.js';
import { DesignFreeze } from './DesignFreeze.js';
import { DesignLayoutCodec } from './DesignLayoutCodec.js';
import {
    DesignKind,
    DesignPathVerb,
    type DesignNode,
    type DesignImage,
    type DesignPathCommand,
    type DesignOverride,
} from './DesignTypes.js';

/** Complete layer validation avoids silently losing newer fields during an older client's edit. */
export class DesignNodeCodec {
    /** Parses and detaches one layer with bounded text, effects and geometry. */
    public static node(raw: unknown): DesignNode {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'name',
            'kind',
            'parentId',
            'children',
            'x',
            'y',
            'width',
            'height',
            'rotation',
            'opacity',
            'visible',
            'locked',
            'style',
            'layout',
            'placement',
            'text',
            'path',
            'image',
            'componentId',
            'overrides',
        ]);
        const kind: DesignKind = V.choice(value['kind'], Object.values(DesignKind));
        const node: DesignNode = {
            id: V.id(value['id']),
            name: V.text(value['name']),
            kind,
            parentId: V.optionalId(value['parentId']),
            children: V.list(value['children'], 10000, (entry: unknown): string => V.id(entry)),
            x: V.number(value['x']),
            y: V.number(value['y']),
            width: V.number(value['width'], 0.01),
            height: V.number(value['height'], 0.01),
            rotation: V.number(value['rotation'], -360, 360),
            opacity: V.number(value['opacity'], 0, 1),
            visible: V.boolean(value['visible']),
            locked: V.boolean(value['locked']),
            style: DesignStyleCodec.style(value['style']),
            layout: DesignLayoutCodec.layout(value['layout']),
            placement: DesignLayoutCodec.placement(value['placement']),
            text: value['text'] === null ? null : DesignStyleCodec.text(value['text']),
            path: V.list(value['path'], 10000, (entry: unknown): DesignPathCommand =>
                this.path(entry),
            ),
            image: value['image'] === null ? null : this.image(value['image']),
            componentId: V.optionalId(value['componentId']),
            overrides: V.list(value['overrides'], 1024, (entry: unknown): DesignOverride =>
                this.override(entry),
            ),
        };
        if (kind === DesignKind.Text && node.text === null) {
            throw new Error('Text layer requires text settings');
        }
        if (kind !== DesignKind.Text && node.text !== null) {
            throw new Error('Only text layers accept text settings');
        }
        if (
            node.children.length > 0 &&
            ![DesignKind.Frame, DesignKind.Group, DesignKind.Component].some(
                (entry: DesignKind): boolean => entry === kind,
            )
        ) {
            throw new Error('Only containers accept child layers');
        }
        if (kind === DesignKind.Instance && node.componentId === null) {
            throw new Error('Instance requires a component reference');
        }
        if (
            kind !== DesignKind.Instance &&
            (node.componentId !== null || node.overrides.length > 0)
        ) {
            throw new Error('Only instances accept component references and overrides');
        }
        if (
            node.path.length > 0 &&
            ![DesignKind.Path, DesignKind.Polygon, DesignKind.Line].some(
                (entry: DesignKind): boolean => entry === kind,
            )
        ) {
            throw new Error('Only vector layers accept path geometry');
        }
        if (node.path.length > 0 && node.path[0]?.verb !== DesignPathVerb.Move) {
            throw new Error('A vector path must start with a move command');
        }
        if (node.image !== null && kind !== DesignKind.Image) {
            throw new Error('Only image layers accept an image reference');
        }
        return DesignFreeze.node(node);
    }
    /** Validates one bounded layer path value. */
    public static path(raw: unknown): DesignPathCommand {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['verb', 'values']);
        const verb: DesignPathVerb = V.choice(value['verb'], Object.values(DesignPathVerb));
        const values: readonly number[] = V.list(value['values'], 6, (entry: unknown): number =>
            V.number(entry),
        );
        const lengths: Readonly<Record<DesignPathVerb, number>> = { M: 2, L: 2, Q: 4, C: 6, Z: 0 };
        if (values.length !== lengths[verb]) {
            throw new Error('Vector command has the wrong coordinate count');
        }
        return { verb, values };
    }
    /** Validates one bounded layer image value. */
    public static image(raw: unknown): DesignImage {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'assetId',
            'fit',
            'cropX',
            'cropY',
            'scale',
        ]);
        return {
            assetId: V.id(value['assetId']),
            ...DesignImageFramingCodec.parse({
                fit: value['fit'],
                cropX: value['cropX'],
                cropY: value['cropY'],
                scale: value['scale'],
            }),
        };
    }
    /** Validates one bounded layer override value. */
    public static override(raw: unknown): DesignOverride {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'nodeId',
            'name',
            'text',
            'style',
            'visible',
        ]);
        return {
            nodeId: V.id(value['nodeId']),
            name: value['name'] === null ? null : V.text(value['name']),
            text: value['text'] === null ? null : V.text(value['text'], 100000, true),
            style: value['style'] === null ? null : DesignStyleCodec.style(value['style']),
            visible: value['visible'] === null ? null : V.boolean(value['visible']),
        };
    }
}
