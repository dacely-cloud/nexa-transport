// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { ComponentRegistry } from '../src/workflows/ComponentRegistry.js';
import { PortCompatibility } from '../src/workflows/PortCompatibility.js';
import type { ComponentPort } from '../src/workflows/ComponentTypes.js';
import { WorkflowRunCodec } from '../src/workflows/runtime/RunCodec.js';
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
