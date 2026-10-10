// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { DesignComponents } from '../src/design/DesignComponents.js';
import { DesignComponentAction as Action } from '../src/design/DesignComponentTypes.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { DesignScene } from '../src/design/DesignScene.js';
import { DesignKind, type DesignDocument, type DesignNode } from '../src/design/DesignTypes.js';
import type { DesignSelectionPlan } from '../src/design/DesignSelectionTypes.js';

it('component planning and expansion remain identical to the native model', async (): Promise<void> => {
    for (const name of [
        'DesignComponents',
        'DesignComponentTypes',
        'DesignComponentTargets',
        'DesignComponentDetach',
        'DesignScene',
        'DesignTree',
    ]) {
        const [sdk, native]: string[] = await Promise.all([
            readFile(new URL('../src/design/' + name + '.ts', import.meta.url), 'utf8'),
            readFile(new URL('../../nexa/src/design/' + name + '.ts', import.meta.url), 'utf8'),
        ]);
        expect(sdk).toBe(native);
    }
});

it('browser component edits preserve ownership, overrides and exact undo', (): void => {
    const frame: DesignNode = {
        ...DesignDefaults.node('card', DesignKind.Frame, 'Card'),
        children: ['label'],
    };
    const text: DesignNode = DesignDefaults.node('label', DesignKind.Text, 'Label');
    if (text.text === null) {throw new Error('Missing text defaults.');}
    const label: DesignNode = {
        ...text,
        parentId: frame.id,
        text: { ...text.text, content: 'Original' },
    };
    const template: DesignDocument = DesignDefaults.document('design');
    const document: DesignDocument = {
        ...template,
        pages: template.pages.map((page) => ({ ...page, roots: [frame.id] })),
        nodes: [frame, label],
    };
    const created: DesignSelectionPlan = DesignComponents.plan(
        document,
        'page-1',
        { action: Action.Create, selection: [frame.id] },
        (source: string): string => source,
    );
    const component: DesignDocument = DesignEdits.apply(document, created.operations).document;
    const placed: DesignSelectionPlan = DesignComponents.plan(
        component,
        'page-1',
        { action: Action.Place, componentId: frame.id, x: 240, y: 0 },
        (): string => 'instance',
    );
    const linked: DesignDocument = DesignEdits.apply(component, placed.operations).document;
    expect(linked.nodes).toHaveLength(3);
    const override: DesignSelectionPlan = DesignComponents.plan(
        linked,
        'page-1',
        {
            action: Action.Override,
            instanceId: 'instance',
            targetId: 'label',
            changes: { text: 'Custom' },
        },
        (): string => 'unused',
    );
    const customized: DesignDocument = DesignEdits.apply(linked, override.operations).document;
    expect(
        DesignScene.page(customized, 'page-1').nodes.find(
            (node): boolean => node.instanceId === 'instance' && node.sourceId === 'label',
        )?.text?.content,
    ).toBe('Custom');
    const detach: DesignSelectionPlan = DesignComponents.plan(
        customized,
        'page-1',
        { action: Action.Detach, selection: ['instance'] },
        (): string => 'baked-label',
    );
    const result: ReturnType<typeof DesignEdits.apply> = DesignEdits.apply(
        customized,
        detach.operations,
    );
    expect(
        result.document.nodes.find((node): boolean => node.id === 'baked-label')?.text?.content,
    ).toBe('Custom');
    expect(result.document.nodes.find((node): boolean => node.id === 'instance')?.kind).toBe(
        DesignKind.Frame,
    );
    expect(DesignEdits.restore(result.document, result.changes).document.nodes).toEqual(
        customized.nodes,
    );
});
