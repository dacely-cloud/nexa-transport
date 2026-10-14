// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { DesignComponents } from '../src/design/DesignComponents.js';
import { DesignComponentAction as Action } from '../src/design/DesignComponentTypes.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { Method } from '../src/protocol/Protocol.js';
import { DesignScene } from '../src/design/DesignScene.js';
import { DesignKind, type DesignDocument, type DesignNode } from '../src/design/DesignTypes.js';
import type { DesignComponentRequest } from '../src/design/DesignComponentTypes.js';
import type { DesignSelectionPlan } from '../src/design/DesignSelectionTypes.js';

it('visible instance-root overrides cross the typed boundary with source IDs and exact undo', (): void => {
    const component: DesignNode = DesignDefaults.node('component', DesignKind.Component);
    const instance: DesignNode = {
        ...DesignDefaults.node('instance', DesignKind.Instance),
        componentId: component.id,
    };
    const template: DesignDocument = DesignDefaults.document('root-override');
    const document: DesignDocument = {
        ...template,
        pages: template.pages.map((page) => ({ ...page, roots: [component.id, instance.id] })),
        nodes: [component, instance],
    };
    const request: DesignComponentRequest = {
        id: document.id,
        expectedRevision: document.revision,
        commandId: 'root',
        pageId: 'page-1',
        command: {
            action: Action.Override,
            instanceId: instance.id,
            targetId: instance.id,
            changes: { name: 'Local root' },
        },
    };
    expect(methodValidators[Method.DesignComponent].params(request)).toBe(true);
    const plan: DesignSelectionPlan = DesignComponents.plan(
        document,
        request.pageId,
        request.command,
        (): string => 'unused',
    );
    const result: ReturnType<typeof DesignEdits.apply> = DesignEdits.apply(
        document,
        plan.operations,
    );
    expect(
        result.document.nodes.find((node: DesignNode): boolean => node.id === instance.id)
            ?.overrides,
    ).toMatchObject([{ nodeId: component.id, name: 'Local root' }]);
    expect(
        result.document.nodes.find((node: DesignNode): boolean => node.id === component.id),
    ).toEqual(component);
    expect(DesignEdits.restore(result.document, result.changes).document).toEqual(document);
});

it('component RPC accepts centered placement and rejects malformed commands at the transport boundary', (): void => {
    const request: DesignComponentRequest = {
        id: 'layout',
        expectedRevision: '12',
        commandId: 'place',
        pageId: 'page-1',
        command: { action: 'place', componentId: 'button', x: 400, y: 300, center: true },
    };
    expect(methodValidators[Method.DesignComponent].params(request)).toBe(true);
    expect((): DesignComponentRequest =>
        DesignComponents.request({ ...request, owner: 'other' }),
    ).toThrow('Unexpected');
    expect(
        methodValidators[Method.DesignComponent].params({
            ...request,
            command: { ...request.command, center: 'true' },
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.DesignComponent].params({
            ...request,
            command: { action: 'made-up' },
        }),
    ).toBe(false);
    expect(DesignComponents.command(request.command)).toEqual(request.command);
});

it('component planning and expansion remain identical to the native model', async (): Promise<void> => {
    for (const name of [
        'DesignComponents',
        'DesignComponentTypes',
        'DesignComponentTargets',
        'DesignComponentSwap',
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
    if (text.text === null) {
        throw new Error('Missing text defaults.');
    }
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

it('portable swap produces typed save operations accepted by the existing websocket contract', (): void => {
    const component: DesignNode = DesignDefaults.node('first', DesignKind.Component);
    const replacement: DesignNode = DesignDefaults.node('next', DesignKind.Component);
    const instance: DesignNode = {
        ...DesignDefaults.node('instance', DesignKind.Instance),
        componentId: component.id,
        width: 230,
        height: 54,
        overrides: [
            { nodeId: component.id, name: 'Personalized', text: null, style: null, visible: true },
        ],
    };
    const template: DesignDocument = DesignDefaults.document('swap');
    const document: DesignDocument = {
        ...template,
        pages: template.pages.map((page) => ({
            ...page,
            roots: [component.id, replacement.id, instance.id],
        })),
        nodes: [component, replacement, instance],
    };
    const plan: DesignSelectionPlan = DesignComponents.plan(
        document,
        'page-1',
        { action: Action.Swap, instanceId: instance.id, componentId: replacement.id },
        (): string => 'unused',
    );
    expect(
        methodValidators[Method.DesignSave].params({
            id: document.id,
            expectedRevision: document.revision,
            commandId: 'swap',
            operations: plan.operations,
        }),
    ).toBe(true);
    const result: ReturnType<typeof DesignEdits.apply> = DesignEdits.apply(
        document,
        plan.operations,
    );
    expect(
        result.document.nodes.find((node: DesignNode): boolean => node.id === instance.id),
    ).toEqual({
        ...instance,
        componentId: replacement.id,
        overrides: [
            {
                ...instance.overrides[0],
                nodeId: replacement.id,
                name: 'Personalized',
                text: null,
                style: null,
                visible: true,
            },
        ],
    });
    expect(DesignEdits.restore(result.document, result.changes).document).toEqual(document);
});
