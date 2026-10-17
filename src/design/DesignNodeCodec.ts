// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignVariantCodec } from './DesignVariantCodec.js';
import { DesignPolygons } from './DesignPolygons.js';
import { DesignArcs } from './DesignArcs.js';
import { DesignMaskCodec } from './DesignMaskCodec.js';
import { DesignBooleanMode } from './DesignBooleanTypes.js';
import { DesignFlow } from './DesignTypes.js';
import { DesignFrameGridCodec } from './DesignFrameGridCodec.js';
import { DesignValues as V } from './DesignValues.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignImageFramingCodec } from './DesignImageFramingCodec.js';
import { DesignImageSamplingCodec } from './DesignImageSamplingCodec.js';
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
    static readonly #pathLengths: Readonly<Record<DesignPathVerb, number>> = Object.freeze({
        M: 2,
        L: 2,
        Q: 4,
        C: 6,
        Z: 0,
    });
    static readonly #containers: readonly DesignKind[] = [
        DesignKind.Frame,
        DesignKind.Group,
        DesignKind.Component,
        DesignKind.ComponentSet,
        DesignKind.Boolean,
        DesignKind.Mask,
    ];
    /** Authored children belong only to native containers; linked instances expand their definition. */
    public static acceptsChildren(kind: DesignKind): boolean {
        return this.#containers.includes(kind);
    }

    /** Parses and detaches one layer with bounded text, effects and geometry. */
    public static node(raw: unknown): DesignNode {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            [
                ...KEYS,
                'booleanMode',
                'mask',
                'variants',
                'variant',
                'contentScale',
                'layoutGrids',
                'polygon',
                'arc',
            ],
            KEYS,
        );
        const kind: DesignKind = V.choice(value['kind'], Object.values(DesignKind), 'node.kind');
        if (Object.hasOwn(value, 'arc') && kind !== DesignKind.Ellipse) {
            throw new Error('Only ellipse layers accept arc settings.');
        }
        if (Object.hasOwn(value, 'polygon') && kind !== DesignKind.Polygon) {
            throw new Error('Only polygon layers accept polygon or star parameters.');
        }
        if (
            (Object.hasOwn(value, 'variants') && kind !== DesignKind.ComponentSet) ||
            (Object.hasOwn(value, 'variant') && kind !== DesignKind.Component)
        ) {
            throw new Error('Variant metadata requires a component set or variant definition.');
        }
        if (Object.hasOwn(value, 'contentScale') && kind !== DesignKind.Instance) {
            throw new Error('Only linked instances accept contentScale.');
        }
        if (Object.hasOwn(value, 'layoutGrids') && !DesignFrameGridCodec.supports(kind)) {
            throw new Error('Only frames and frame definitions accept layout grids.');
        }
        const node: DesignNode = {
            ...(Object.hasOwn(value, 'arc') ? { arc: DesignArcs.parse(value['arc']) } : {}),
            ...(Object.hasOwn(value, 'polygon')
                ? { polygon: DesignPolygons.parse(value['polygon']) }
                : {}),
            ...(value['layoutGrids'] === undefined
                ? {}
                : { layoutGrids: DesignFrameGridCodec.grids(value['layoutGrids']) }),
            ...(Object.hasOwn(value, 'contentScale')
                ? { contentScale: V.number(value['contentScale'], 0.0001, 10000) }
                : {}),
            id: V.id(value['id']),
            name: V.text(value['name']),
            kind,
            ...(kind === DesignKind.Boolean
                ? { booleanMode: V.choice(value['booleanMode'], Object.values(DesignBooleanMode)) }
                : {}),
            ...(kind === DesignKind.Mask ? { mask: DesignMaskCodec.parse(value['mask']) } : {}),
            ...(kind === DesignKind.ComponentSet
                ? { variants: DesignVariantCodec.set(value['variants']) }
                : {}),
            ...(Object.hasOwn(value, 'variant')
                ? { variant: DesignVariantCodec.values(value['variant']) }
                : {}),
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
            style: V.context('node.style', (): DesignNode['style'] =>
                DesignStyleCodec.style(value['style']),
            ),
            layout: V.context('node.layout', (): DesignNode['layout'] =>
                DesignLayoutCodec.layout(value['layout']),
            ),
            placement: V.context('node.placement', (): DesignNode['placement'] =>
                DesignLayoutCodec.placement(value['placement']),
            ),
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
        if (node.children.length > 0 && !this.acceptsChildren(kind)) {
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
            node.arc === undefined &&
            ![
                DesignKind.Path,
                DesignKind.Polygon,
                DesignKind.Line,
                DesignKind.Boolean,
                DesignKind.Group,
            ].some((entry: DesignKind): boolean => entry === kind)
        ) {
            throw new Error('Only vector layers accept path geometry');
        }
        if (node.path.length > 0 && node.path[0]?.verb !== DesignPathVerb.Move) {
            throw new Error('A vector path must start with a move command');
        }
        if (node.image !== null && kind !== DesignKind.Image) {
            throw new Error('Only image layers accept an image reference');
        }
        if (kind !== DesignKind.Mask && Object.hasOwn(value, 'mask')) {
            throw new Error('Only mask groups accept a mask source and mode');
        }
        if (kind !== DesignKind.Boolean && Object.hasOwn(value, 'booleanMode')) {
            throw new Error('Only Boolean groups accept an operation mode');
        }
        if (
            (kind === DesignKind.Boolean || kind === DesignKind.Mask) &&
            (node.layout.flow !== DesignFlow.Absolute ||
                node.layout.clip ||
                Object.values(node.layout.padding).some((value: number): boolean => value !== 0))
        ) {
            throw new Error('Boolean sources use an unclipped absolute container');
        }
        return DesignFreeze.node(
            node.arc !== undefined
                ? { ...node, path: DesignArcs.path(node.arc, node.width, node.height) }
                : node.polygon === undefined
                  ? node
                  : { ...node, path: DesignPolygons.path(node.polygon, node.width, node.height) },
        );
    }
    /** Exact coordinate counts are shared by native parsing and model-visible input schemas. */
    public static pathValueCount(verb: DesignPathVerb): number {
        return DesignNodeCodec.#pathLengths[verb];
    }

    /** Validates one bounded layer path value. */
    public static path(raw: unknown): DesignPathCommand {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['verb', 'values']);
        const verb: DesignPathVerb = V.choice(value['verb'], Object.values(DesignPathVerb));
        const expected: number = DesignNodeCodec.pathValueCount(verb);
        const rawValues: unknown = value['values'];
        if (Array.isArray(rawValues) && rawValues.length !== expected) {
            throw new Error(
                'Vector ' +
                    verb +
                    ' requires ' +
                    String(expected) +
                    ' coordinates; received ' +
                    String(rawValues.length),
            );
        }
        const values: readonly number[] = V.list(rawValues, 6, (entry: unknown): number =>
            V.number(entry),
        );
        return { verb, values };
    }
    /** Validates one bounded layer image value. */
    public static image(raw: unknown): DesignImage {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            [
                'assetId',
                'fit',
                'cropX',
                'cropY',
                'scale',
                'rotation',
                'flipX',
                'flipY',
                'transform',
                'sampling',
                'tile',
                'adjustments',
            ],
            ['assetId', 'fit', 'cropX', 'cropY', 'scale'],
        );
        return {
            assetId: V.id(value['assetId']),
            ...(value['sampling'] === undefined
                ? {}
                : {
                      sampling:
                          value['sampling'] === null
                              ? null
                              : DesignImageSamplingCodec.parse(value['sampling']),
                  }),
            ...DesignImageFramingCodec.parse({
                ...(value['tile'] === undefined ? {} : { tile: value['tile'] }),
                fit: value['fit'],
                cropX: value['cropX'],
                cropY: value['cropY'],
                scale: value['scale'],
                ...(value['adjustments'] === undefined
                    ? {}
                    : { adjustments: value['adjustments'] }),
                ...(value['rotation'] === undefined ? {} : { rotation: value['rotation'] }),
                ...(value['flipX'] === undefined ? {} : { flipX: value['flipX'] }),
                ...(value['flipY'] === undefined ? {} : { flipY: value['flipY'] }),
                ...(value['transform'] === undefined ? {} : { transform: value['transform'] }),
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

const KEYS: readonly string[] = [
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
];
