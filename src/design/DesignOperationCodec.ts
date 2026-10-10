// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignCodec } from './DesignCodec.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignLayoutCodec } from './DesignLayoutCodec.js';
import { DesignKind, type DesignPathCommand, type DesignOverride } from './DesignTypes.js';
import { DesignNodeCodec } from './DesignNodeCodec.js';
import { DesignBooleanMode } from './DesignBooleanTypes.js';
import {
    DesignOperationKind as Kind,
    type DesignOperation,
    type DesignNodeChanges,
} from './DesignOperationTypes.js';
import type { DesignNode, DesignToken, DesignInteraction, DesignComment } from './DesignTypes.js';

/** Boundary decoding for atomic agent/editor commands; unknown properties are rejected. */
export class DesignOperationCodec {
    /** Parses detached transaction values; complete layer and tree invariants are checked after atomic application. */
    public static operations(raw: unknown): readonly DesignOperation[] {
        return V.list(raw, 512, (entry: unknown): DesignOperation => {
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
                    'tokens',
                    'interactions',
                    'comments',
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
                    const node: DesignNode = DesignNodeCodec.node(value['node']);
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
                    const changes: DesignNodeChanges = this.#changes(value['changes']);
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
        });
    }
    static #changes(raw: unknown): DesignNodeChanges {
        const value: Readonly<Record<string, unknown>> = V.fields(raw, KEYS, []);
        if (Reflect.ownKeys(value).length === 0) {
            throw new Error('Layer update requires at least one property');
        }
        return {
            ...(Object.hasOwn(value, 'name') ? { name: V.text(value['name']) } : {}),
            ...(Object.hasOwn(value, 'booleanMode')
                ? {
                      booleanMode:
                          value['booleanMode'] === null
                              ? null
                              : V.choice(value['booleanMode'], Object.values(DesignBooleanMode)),
                  }
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
