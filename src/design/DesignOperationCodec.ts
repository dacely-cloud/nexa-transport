// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignRulerCodec } from './DesignRulerCodec.js';
import { DesignCodec } from './DesignCodec.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignLayoutCodec } from './DesignLayoutCodec.js';
import {
    DesignKind,
    DesignConstraint,
    type DesignPathCommand,
    type DesignOverride,
} from './DesignTypes.js';
import { DesignNodeCodec } from './DesignNodeCodec.js';
import { DesignVariantCodec } from './DesignVariantCodec.js';
import { DesignMaskCodec } from './DesignMaskCodec.js';
import { DesignBooleanMode } from './DesignBooleanTypes.js';
import {
    DesignOperationKind as Kind,
    type DesignOperation,
    type DesignNodeChanges,
    type DesignFlowReorder,
} from './DesignOperationTypes.js';
import type { DesignNode, DesignToken, DesignInteraction, DesignComment } from './DesignTypes.js';

/** Boundary decoding for atomic agent/editor commands; unknown properties are rejected. */
export class DesignOperationCodec {
    /** Parses detached transaction values; complete layer and tree invariants are checked after atomic application. */
    public static operations(raw: unknown): readonly DesignOperation[] {
        const parse: (entry: unknown) => DesignOperation = (entry: unknown): DesignOperation => {
            const tag: Readonly<Record<string, unknown>> = V.fields(
                entry,
                [
                    'op',
                    'node',
                    'parentId',
                    'pageId',
                    'index',
                    'id',
                    'changes',
                    'content',
                    'name',
                    'background',
                    'value',
                    'tokens',
                    'interactions',
                    'comments',
                    'selection',
                    'width',
                    'height',
                    'x',
                    'y',
                    'horizontal',
                    'vertical',
                    'absolute',
                    'dx',
                    'dy',
                    'reorders',
                    'angle',
                    'pivotX',
                    'pivotY',
                    'factor',
                ],
                ['op'],
            );
            const op: string = V.choice(tag['op'], Object.values(Kind));
            switch (op) {
                case Kind.Insert: {
                    const value: Readonly<Record<string, unknown>> = V.record(entry, [
                        'op',
                        'node',
                        'parentId',
                        'pageId',
                        'index',
                    ]);
                    const node: DesignNode = V.context('insert.node', (): DesignNode =>
                        DesignNodeCodec.node(value['node']),
                    );
                    return {
                        op,
                        node,
                        parentId: V.optionalId(value['parentId']),
                        pageId: V.id(value['pageId']),
                        index: V.number(value['index'], 0, 10000, true),
                    };
                }
                case Kind.Update: {
                    const value: Readonly<Record<string, unknown>> = V.record(entry, [
                        'op',
                        'id',
                        'changes',
                    ]);
                    const id: string = V.id(value['id']);
                    const changes: DesignNodeChanges = V.context(
                        'update.changes',
                        (): DesignNodeChanges => this.#changes(value['changes']),
                    );
                    return { op, id, changes };
                }
                case Kind.Text: {
                    const value: Readonly<Record<string, unknown>> = V.record(entry, [
                        'op',
                        'id',
                        'content',
                    ]);
                    return {
                        op,
                        id: V.id(value['id']),
                        content: V.text(value['content'], 100000, true),
                    };
                }
                case Kind.Scale: {
                    const value: Readonly<Record<string, unknown>> = V.fields(
                        entry,
                        ['op', 'pageId', 'selection', 'factor', 'pivotX', 'pivotY'],
                        ['op', 'pageId', 'selection', 'factor'],
                    );
                    const selection: readonly string[] = V.list(
                        value['selection'],
                        128,
                        (id: unknown): string => V.id(id),
                    );
                    if (selection.length === 0 || new Set(selection).size !== selection.length) {
                        throw new Error('Scale requires 1 to 128 distinct selected layers.');
                    }
                    if ((value['pivotX'] === undefined) !== (value['pivotY'] === undefined)) {
                        throw new Error('Scaling requires both pivot coordinates or neither.');
                    }
                    return {
                        op,
                        pageId: V.id(value['pageId']),
                        selection,
                        factor: V.number(value['factor'], 0.01, 100),
                        ...(value['pivotX'] === undefined
                            ? {}
                            : {
                                  pivotX: V.number(value['pivotX'], -100000, 100000),
                                  pivotY: V.number(value['pivotY'], -100000, 100000),
                              }),
                    };
                }
                case Kind.Rotate: {
                    const value: Readonly<Record<string, unknown>> = V.fields(
                        entry,
                        ['op', 'pageId', 'selection', 'angle', 'pivotX', 'pivotY'],
                        ['op', 'pageId', 'selection', 'angle'],
                    );
                    const selection: readonly string[] = V.list(
                        value['selection'],
                        128,
                        (id: unknown): string => V.id(id),
                    );
                    if (selection.length === 0 || new Set(selection).size !== selection.length) {
                        throw new Error('Rotate requires 1 to 128 distinct selected layers.');
                    }
                    if ((value['pivotX'] === undefined) !== (value['pivotY'] === undefined)) {
                        throw new Error('Rotation requires both pivot coordinates or neither.');
                    }
                    return {
                        op,
                        pageId: V.id(value['pageId']),
                        selection,
                        angle: V.number(value['angle'], -360, 360),
                        ...(value['pivotX'] === undefined
                            ? {}
                            : {
                                  pivotX: V.number(value['pivotX'], -100000, 100000),
                                  pivotY: V.number(value['pivotY'], -100000, 100000),
                              }),
                    };
                }
                case Kind.Translate: {
                    const value: Readonly<Record<string, unknown>> = V.fields(
                        entry,
                        ['op', 'pageId', 'selection', 'dx', 'dy', 'reorders'],
                        ['op', 'pageId', 'selection', 'dx', 'dy'],
                    );
                    const selection: readonly string[] = V.list(
                        value['selection'],
                        128,
                        (id: unknown): string => V.id(id),
                    );
                    if (selection.length === 0 || new Set(selection).size !== selection.length) {
                        throw new Error('Translate requires 1 to 128 distinct selected layers.');
                    }
                    return {
                        op,
                        pageId: V.id(value['pageId']),
                        selection,
                        dx: V.number(value['dx'], -100000, 100000),
                        dy: V.number(value['dy'], -100000, 100000),
                        ...(Object.hasOwn(value, 'reorders')
                            ? {
                                  reorders: V.list(
                                      value['reorders'],
                                      128,
                                      (raw: unknown): DesignFlowReorder => {
                                          const reorder: Readonly<Record<string, unknown>> =
                                              V.record(raw, ['id', 'index']);
                                          return {
                                              id: V.id(reorder['id']),
                                              index: V.number(reorder['index'], 0, 10000, true),
                                          };
                                      },
                                  ),
                              }
                            : {}),
                    };
                }
                case Kind.Position: {
                    const value: Readonly<Record<string, unknown>> = V.fields(
                        entry,
                        ['op', 'id', 'pageId', 'x', 'y', 'horizontal', 'vertical', 'absolute'],
                        ['op', 'id', 'pageId'],
                    );
                    if (
                        ['x', 'y', 'horizontal', 'vertical', 'absolute'].every(
                            (key: string): boolean => value[key] === undefined,
                        )
                    ) {
                        throw new Error(
                            'Position requires a coordinate, pin or absolute placement change.',
                        );
                    }
                    return {
                        op,
                        id: V.id(value['id']),
                        pageId: V.id(value['pageId']),
                        ...(value['x'] === undefined
                            ? {}
                            : { x: V.number(value['x'], -100000, 100000) }),
                        ...(value['y'] === undefined
                            ? {}
                            : { y: V.number(value['y'], -100000, 100000) }),
                        ...(value['horizontal'] === undefined
                            ? {}
                            : {
                                  horizontal: V.choice(
                                      value['horizontal'],
                                      Object.values(DesignConstraint),
                                  ),
                              }),
                        ...(value['vertical'] === undefined
                            ? {}
                            : {
                                  vertical: V.choice(
                                      value['vertical'],
                                      Object.values(DesignConstraint),
                                  ),
                              }),
                        ...(value['absolute'] === undefined
                            ? {}
                            : { absolute: V.boolean(value['absolute']) }),
                    };
                }
                case Kind.Resize: {
                    const value: Readonly<Record<string, unknown>> = V.fields(
                        entry,
                        ['op', 'pageId', 'selection', 'width', 'height', 'x', 'y'],
                        ['op', 'pageId', 'selection'],
                    );
                    const selection: readonly string[] = V.list(
                        value['selection'],
                        128,
                        (id: unknown): string => V.id(id),
                    );
                    if (selection.length === 0 || new Set(selection).size !== selection.length) {
                        throw new Error('Resize requires 1 to 128 distinct selected layers.');
                    }
                    if (value['width'] === undefined && value['height'] === undefined) {
                        throw new Error('Resize requires width or height.');
                    }
                    if (
                        (value['x'] !== undefined && value['width'] === undefined) ||
                        (value['y'] !== undefined && value['height'] === undefined)
                    ) {
                        throw new Error('Resize x requires width; resize y requires height.');
                    }
                    if (
                        selection.length !== 1 &&
                        (value['x'] !== undefined || value['y'] !== undefined)
                    ) {
                        throw new Error('Resize position edits require one selected layer.');
                    }
                    return {
                        op,
                        pageId: V.id(value['pageId']),
                        selection,
                        ...(value['width'] === undefined
                            ? {}
                            : { width: V.number(value['width'], 0.01, 100000) }),
                        ...(value['height'] === undefined
                            ? {}
                            : { height: V.number(value['height'], 0.01, 100000) }),
                        ...(value['x'] === undefined
                            ? {}
                            : { x: V.number(value['x'], -100000, 100000) }),
                        ...(value['y'] === undefined
                            ? {}
                            : { y: V.number(value['y'], -100000, 100000) }),
                    };
                }
                case Kind.Move: {
                    const value: Readonly<Record<string, unknown>> = V.record(entry, [
                        'op',
                        'id',
                        'parentId',
                        'pageId',
                        'index',
                    ]);
                    return {
                        op,
                        id: V.id(value['id']),
                        parentId: V.optionalId(value['parentId']),
                        pageId: V.id(value['pageId']),
                        index: V.number(value['index'], 0, 10000, true),
                    };
                }
                case Kind.Remove: {
                    const value: Readonly<Record<string, unknown>> = V.record(entry, ['op', 'id']);
                    return { op, id: V.id(value['id']) };
                }
                case Kind.Guide: {
                    const value: Readonly<Record<string, unknown>> = V.record(entry, [
                        'op',
                        'pageId',
                        'id',
                        'value',
                    ]);
                    return {
                        op,
                        pageId: V.id(value['pageId']),
                        id: V.id(value['id']),
                        value:
                            value['value'] === null ? null : DesignRulerCodec.value(value['value']),
                    };
                }
                case Kind.Page: {
                    const value: Readonly<Record<string, unknown>> = V.record(entry, [
                        'op',
                        'id',
                        'name',
                        'background',
                    ]);
                    return {
                        op,
                        id: V.id(value['id']),
                        name: value['name'] === null ? null : V.text(value['name']),
                        background: V.color(value['background']),
                    };
                }
                case Kind.Metadata: {
                    const value: Readonly<Record<string, unknown>> = V.fields(
                        entry,
                        ['op', 'name', 'tokens', 'interactions', 'comments'],
                        ['op'],
                    );
                    return {
                        op,
                        ...(Object.hasOwn(value, 'name') ? { name: V.text(value['name']) } : {}),
                        ...(Object.hasOwn(value, 'tokens')
                            ? {
                                  tokens: V.list(
                                      value['tokens'],
                                      4096,
                                      (item: unknown): DesignToken => DesignCodec.token(item),
                                  ),
                              }
                            : {}),
                        ...(Object.hasOwn(value, 'interactions')
                            ? {
                                  interactions: V.list(
                                      value['interactions'],
                                      10000,
                                      (item: unknown): DesignInteraction =>
                                          DesignCodec.interaction(item),
                                  ),
                              }
                            : {}),
                        ...(Object.hasOwn(value, 'comments')
                            ? {
                                  comments: V.list(
                                      value['comments'],
                                      10000,
                                      (item: unknown): DesignComment => DesignCodec.comment(item),
                                  ),
                              }
                            : {}),
                    };
                }
                default:
                    throw new Error('Unsupported design operation');
            }
        };
        let index: number = 0;
        return V.list(raw, 512, (entry: unknown): DesignOperation =>
            V.context('operations[' + String(index++) + ']', (): DesignOperation => parse(entry)),
        );
    }
    static #changes(raw: unknown): DesignNodeChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(raw, KEYS, []);
        if (Reflect.ownKeys(value).length === 0) {
            throw new Error('Layer update requires at least one property');
        }
        return {
            ...(Object.hasOwn(value, 'contentScale')
                ? {
                      contentScale:
                          value['contentScale'] === null
                              ? null
                              : V.number(value['contentScale'], 0.0001, 10000),
                  }
                : {}),
            ...(Object.hasOwn(value, 'variants')
                ? {
                      variants:
                          value['variants'] === null
                              ? null
                              : DesignVariantCodec.set(value['variants']),
                  }
                : {}),
            ...(Object.hasOwn(value, 'variant')
                ? {
                      variant:
                          value['variant'] === null
                              ? null
                              : DesignVariantCodec.values(value['variant']),
                  }
                : {}),
            ...(Object.hasOwn(value, 'name') ? { name: V.text(value['name']) } : {}),
            ...(Object.hasOwn(value, 'booleanMode')
                ? {
                      booleanMode:
                          value['booleanMode'] === null
                              ? null
                              : V.choice(value['booleanMode'], Object.values(DesignBooleanMode)),
                  }
                : {}),
            ...(Object.hasOwn(value, 'mask')
                ? { mask: value['mask'] === null ? null : DesignMaskCodec.parse(value['mask']) }
                : {}),
            ...(Object.hasOwn(value, 'kind')
                ? { kind: V.choice(value['kind'], Object.values(DesignKind)) }
                : {}),
            ...(Object.hasOwn(value, 'x') ? { x: V.number(value['x']) } : {}),
            ...(Object.hasOwn(value, 'y') ? { y: V.number(value['y']) } : {}),
            ...(Object.hasOwn(value, 'width') ? { width: V.number(value['width'], 0.01) } : {}),
            ...(Object.hasOwn(value, 'height') ? { height: V.number(value['height'], 0.01) } : {}),
            ...(Object.hasOwn(value, 'rotation')
                ? { rotation: V.number(value['rotation'], -360, 360) }
                : {}),
            ...(Object.hasOwn(value, 'opacity')
                ? { opacity: V.number(value['opacity'], 0, 1) }
                : {}),
            ...(Object.hasOwn(value, 'visible') ? { visible: V.boolean(value['visible']) } : {}),
            ...(Object.hasOwn(value, 'locked') ? { locked: V.boolean(value['locked']) } : {}),
            ...(Object.hasOwn(value, 'style')
                ? { style: DesignStyleCodec.style(value['style']) }
                : {}),
            ...(Object.hasOwn(value, 'layout')
                ? { layout: DesignLayoutCodec.layout(value['layout']) }
                : {}),
            ...(Object.hasOwn(value, 'placement')
                ? { placement: DesignLayoutCodec.placement(value['placement']) }
                : {}),
            ...(Object.hasOwn(value, 'text')
                ? { text: value['text'] === null ? null : DesignStyleCodec.text(value['text']) }
                : {}),
            ...(Object.hasOwn(value, 'path')
                ? {
                      path: V.list(value['path'], 10000, (entry: unknown): DesignPathCommand =>
                          DesignNodeCodec.path(entry),
                      ),
                  }
                : {}),
            ...(Object.hasOwn(value, 'image')
                ? { image: value['image'] === null ? null : DesignNodeCodec.image(value['image']) }
                : {}),
            ...(Object.hasOwn(value, 'componentId')
                ? { componentId: V.optionalId(value['componentId']) }
                : {}),
            ...(Object.hasOwn(value, 'overrides')
                ? {
                      overrides: V.list(
                          value['overrides'],
                          1024,
                          (entry: unknown): DesignOverride => DesignNodeCodec.override(entry),
                      ),
                  }
                : {}),
        };
    }
}
const KEYS: readonly string[] = [
    'booleanMode',
    'contentScale',
    'mask',
    'variants',
    'variant',
    'name',
    'kind',
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
