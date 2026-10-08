// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { ComponentRegistry } from '../src/workflows/ComponentRegistry.js';
import { PortCompatibility } from '../src/workflows/PortCompatibility.js';
import type { ComponentPort } from '../src/workflows/ComponentTypes.js';
import { WorkflowRunCodec } from '../src/workflows/runtime/RunCodec.js';
import { WorkflowRunImageCodec } from '../src/workflows/runtime/RunImageCodec.js';
import type { WorkflowImageSettings } from '../src/workflows/runtime/RunImageTypes.js';
import type { WorkflowValue } from '../src/workflows/WorkflowTypes.js';
import { WorkflowImageQuoteCodec } from '../src/workflows/WorkflowImageQuote.js';
import { WorkflowImageResolutionCodec } from '../src/workflows/ImageResolution.js';
import { WorkflowImagePolicies } from '../src/workflows/ImageModelPolicy.js';
import type { WorkflowRunSnapshot } from '../src/workflows/runtime/RunTypes.js';

it('connects a text result to image generation through the portable catalog', (): void => {
    const catalog: ComponentRegistry = ComponentRegistry.builtin();
    const text: ComponentPort | undefined = catalog
        .get('inference.text', '1')
        ?.ports.find((port: ComponentPort): boolean => port.id === 'text');
    const prompt: ComponentPort | undefined = catalog
        .get('inference.image', '1')
        ?.ports.find((port: ComponentPort): boolean => port.id === 'prompt');
    if (text === undefined || prompt === undefined) {
        throw new Error('Missing inference ports');
    }
    expect(PortCompatibility.problem(text, prompt, 'data')).toBeNull();
});

it('round-trips immutable image settings through the browser run codec', (): void => {
    const snapshot: WorkflowRunSnapshot = {
        format: 1,
        graph: { workflowId: 'illustrate', revision: '1', nodes: [], edges: [] },
        triggerNodeId: 'start',
        mode: 'live-test',
        input: {},
        maxConcurrency: 1,
        timeoutMs: '60000',
        imageModels: [
            {
                nodeId: 'image',
                bindingId: 'image-model',
                provider: 'openai-images',
                model: 'gpt-image-2.5-sunburst-2026-09-08',
                capability: 'image',
                selection: 'exact',
                settings: {
                    size: '1536x864',
                    quality: 'max',
                    count: 1,
                    outputFormat: 'png',
                    options: { background: 'opaque' },
                },
                capabilityReference: 'a'.repeat(64),
                pricingReference: 'b'.repeat(64),
                priceServiceId: 'openai-images',
                estimatedMicrocents: '100000',
            },
        ],
    };
    const raw: unknown = JSON.parse(JSON.stringify(snapshot));
    expect(WorkflowRunCodec.snapshot(raw)).toEqual(snapshot);
});

it('exposes reference-image ports only on the explicit new component version', (): void => {
    const catalog: ComponentRegistry = ComponentRegistry.builtin();
    const original: ComponentPort | undefined = catalog
        .get('inference.image', '1')
        ?.ports.find((port: ComponentPort): boolean => port.id === 'referenceImages');
    const input: ComponentPort | undefined = catalog
        .get('inference.image', '2')
        ?.ports.find((port: ComponentPort): boolean => port.id === 'referenceImages');
    const output: ComponentPort | undefined = catalog
        .get('inference.image', '1')
        ?.ports.find((port: ComponentPort): boolean => port.id === 'images');
    expect(original).toBeUndefined();
    if (input === undefined || output === undefined) {
        throw new Error('Missing reference-image ports');
    }
    expect(PortCompatibility.problem(output, input, 'data')).toBeNull();
    expect(input.schema).toMatchObject({ kind: 'list', maxItems: 16 });
    expect(
        catalog.create('inference.image', '1', 'old').configuration['operation'],
    ).toBeUndefined();
    expect(catalog.create('inference.image', '2', 'new').configuration['operation']).toBe(
        'generate',
    );
    expect(
        Object.hasOwn(
            catalog.create('inference.image', '2', 'new').configuration,
            'referenceImages',
        ),
    ).toBe(false);
});

it('keeps legacy settings byte-stable and retains explicit operations through quote and shared-policy requests', (): void => {
    const legacy: WorkflowImageSettings = {
        size: '1536x864',
        quality: 'max',
        count: 1,
        outputFormat: 'png',
        options: { background: 'opaque' },
    };
    expect(JSON.stringify(WorkflowRunImageCodec.settings(legacy))).toBe(JSON.stringify(legacy));
    const edit: WorkflowImageSettings = { ...legacy, operation: 'edit' };
    expect(WorkflowRunImageCodec.settings(edit)).toEqual(edit);
    expect(
        WorkflowImageQuoteCodec.request({
            workflowId: 'pictures',
            nodeId: 'edit',
            provider: 'openai-images',
            model: 'gpt-image-2.5-sunburst-2026-09-08',
            settings: edit,
        }).settings.operation,
    ).toBe('edit');
    const raw: unknown = JSON.parse(
        JSON.stringify({
            workflowId: 'pictures',
            provider: 'openai-images',
            policy: WorkflowImagePolicies.defaults,
            requirements: [
                { nodeId: 'generate', settings: legacy },
                { nodeId: 'edit', settings: edit },
            ],
        }),
    );
    expect(
        WorkflowImageResolutionCodec.request(raw).requirements.map(
            (entry): string | undefined => entry.settings.operation,
        ),
    ).toEqual([undefined, 'edit']);
    const invalid: readonly WorkflowValue[] = ['blend', null, 1, {}];
    for (const operation of invalid) {
        expect((): WorkflowImageSettings =>
            WorkflowRunImageCodec.settings({ ...legacy, operation }),
        ).toThrow('operation');
    }
});
