// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignKind, type DesignNode } from '../src/design/DesignTypes.js';

test('the websocket contract retains component-set and child tuple fields and rejects malformed boundary values', (): void => {
    const set: DesignNode = {
        ...DesignDefaults.node('set', DesignKind.ComponentSet, 'Button'),
        variants: { properties: ['State'], defaultId: 'default' },
        children: ['default'],
    };
    const child: DesignNode = {
        ...DesignDefaults.node('default', DesignKind.Component, 'Default'),
        parentId: 'set',
        variant: [{ property: 'State', value: 'Default' }],
    };
    const summary: ReturnType<typeof DesignDefaults.document> = DesignDefaults.document('test');
    expect(
        methodValidators[Method.DesignRead].result({
            summary: {
                id: summary.id,
                name: summary.name,
                revision: '1',
                nodeCount: 2,
                pageCount: 1,
                updatedAt: '0',
            },
            records: [
                { kind: 'node', id: set.id, value: set },
                { kind: 'node', id: child.id, value: child },
            ],
            fragment: null,
            nextCursor: null,
        }),
    ).toBe(true);
    for (const changes of [
        { variants: { properties: ['State'], defaultId: 'default' } },
        { variant: [{ property: 'State', value: 'Hover' }] },
        { variants: null, variant: null },
    ]) {
        expect(
            methodValidators[Method.DesignSave].params({
                id: 'test',
                expectedRevision: '1',
                commandId: 'edit',
                operations: [{ op: 'update', id: 'set', changes }],
            }),
        ).toBe(true);
    }
    expect(
        methodValidators[Method.DesignSave].params({
            id: 'test',
            expectedRevision: '1',
            commandId: 'edit',
            operations: [
                {
                    op: 'update',
                    id: 'set',
                    changes: { variants: { properties: [123], defaultId: null } },
                },
            ],
        }),
    ).toBe(false);
});

test('the SDK ships the exact portable native variant implementation', async (): Promise<void> => {
    for (const name of [
        'DesignVariantTypes',
        'DesignVariantCodec',
        'DesignVariantTree',
        'DesignVariants',
        'DesignVariantCommands',
        'DesignVariantEdits',
        'DesignVariantGeometry',
    ]) {
        const source: string = await readFile('../nexa/src/design/' + name + '.ts', 'utf8');
        expect(await readFile('src/design/' + name + '.ts', 'utf8')).toBe(source);
    }
});
