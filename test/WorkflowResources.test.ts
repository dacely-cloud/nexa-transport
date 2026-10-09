// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { ResourceBindingCodec } from '../src/workflows/ResourceBindingCodec.js';
import { ResourceReadiness } from '../src/workflows/ResourceReadiness.js';
import { ResourceMode, ResourceIssue } from '../src/workflows/ResourceTypes.js';
import type { ResourceBinding } from '../src/workflows/ResourceTypes.js';

describe('portable workflow resource contracts', (): void => {
    it.each([
        'EachComponents',
        'GraphEach',
        'ConversionComponents',
        'ScalarConversion',
        'ListComponents',
        'lists/ListTypes',
        'lists/ListPlan',
        'lists/ListValues',
        'lists/ListAggregate',
        'lists/ListTransform',
        'MappingComponents',
        'mapping/MappingTypes',
        'mapping/MappingCodec',
        'mapping/MappingEvaluator',
        'mapping/MappingExpressions',
        'mapping/MappingPaths',
        'mapping/MappingValues',
        'mapping/MappingLiteral',
        'mapping/MappingValidation',
        'ResourceTypes',
        'ResourceBindingCodec',
        'ResourceReadiness',
        'WorkflowTypes',
        'WorkflowInput',
        'WorkflowJson',
        'WorkflowCodec',
        'WorkflowRequests',
        'WorkflowRequestCodec',
        'SchemaTypes',
        'Schemas',
        'SchemaValues',
        'SchemaCompatibility',
        'ComponentTypes',
        'ComponentFactory',
        'CoreComponents',
        'AgentComponents',
        'ResourceComponents',
        'ComponentRegistry',
        'TimeLimits',
        'TimeComponents',
        'WaitCodec',
        'GraphTypes',
        'GraphProblems',
        'GraphConnections',
        'GraphResources',
        'GraphOrder',
        'GraphValidation',
        'PortCompatibility',
        'runtime/RunTypes',
        'runtime/RunRequests',
        'runtime/RunRequestCodec',
        'runtime/RunCodec',
    ])(
        'keeps %s identical to the authoritative Nexa source',
        async (file: string): Promise<void> => {
            const canonical: string = await readFile(
                new URL(`../../nexa/src/workflows/${file}.ts`, import.meta.url),
                'utf8',
            );
            const portable: string = await readFile(
                new URL(`../src/workflows/${file}.ts`, import.meta.url),
                'utf8',
            );
            expect(portable).toBe(canonical);
            expect(portable).not.toMatch(/(?:from\s*|import\s*\(\s*)['"]node:/u);
        },
    );

    it('decodes a saved unresolved attachment without claiming live readiness', (): void => {
        const raw: unknown = JSON.parse(
            '{"version":1,"id":"source-1","alias":"Monthly reports","family":"database","use":"attach","consumerId":"agent-1","selection":null,"operations":["read"],"limits":{"maxItems":100,"maxBytes":"1048576"},"maxAgeMs":null}',
        );
        const binding: ResourceBinding = ResourceBindingCodec.parse(raw);
        expect(ResourceReadiness.inspect(binding, null, ResourceMode.Live, 0n)).toMatchObject({
            ready: false,
            issue: ResourceIssue.Setup,
        });
        expect(JSON.parse(JSON.stringify(binding))).toEqual(raw);
    });
});
