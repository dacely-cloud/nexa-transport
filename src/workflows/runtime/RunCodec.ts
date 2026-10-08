// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowRunModelCodec } from './RunModelCodec.js';
import { WorkflowInput } from '../WorkflowInput.js';
import { WorkflowCodec } from '../WorkflowCodec.js';
import { WorkflowJson } from '../WorkflowJson.js';
import { ResourceBindingCodec } from '../ResourceBindingCodec.js';
import type {
    WorkflowNode,
    WorkflowEdge,
    WorkflowObject,
    WorkflowValue,
} from '../WorkflowTypes.js';
import {
    WorkflowRunMode,
    type WorkflowRunSnapshot,
    type WorkflowStepResult,
    type WorkflowNamedResult,
} from './RunTypes.js';

/** Validates stored snapshots and completed values as well as incoming execution requests. */
export class WorkflowRunCodec {
    public static snapshot(raw: unknown): WorkflowRunSnapshot {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            ...(raw !== null && typeof raw === 'object' && Object.hasOwn(raw, 'models')
                ? ['models']
                : []),
            'format',
            'graph',
            'triggerNodeId',
            'mode',
            'input',
            'maxConcurrency',
            'timeoutMs',
        ]);
        if (value['format'] !== 1) {
            throw new Error('Unsupported workflow run snapshot format');
        }
        const graph: Readonly<Record<string, unknown>> = WorkflowInput.record(value['graph'], [
            'workflowId',
            'revision',
            'nodes',
            'edges',
        ]);
        const nodes: readonly WorkflowNode[] = WorkflowInput.list(
            graph['nodes'],
            10_000,
            WorkflowCodec.node.bind(WorkflowCodec),
        );
        const edges: readonly WorkflowEdge[] = WorkflowInput.list(
            graph['edges'],
            50_000,
            WorkflowCodec.edge.bind(WorkflowCodec),
        );
        WorkflowInput.unique(nodes.map((node: WorkflowNode): string => node.id));
        WorkflowInput.unique(edges.map((edge: WorkflowEdge): string => edge.id));
        const mode: unknown = value['mode'];
        if (mode !== WorkflowRunMode.LiveTest && mode !== WorkflowRunMode.MockTest) {
            throw new Error('Unsupported workflow run mode');
        }
        const concurrency: unknown = value['maxConcurrency'];
        if (
            typeof concurrency !== 'number' ||
            !Number.isInteger(concurrency) ||
            concurrency < 1 ||
            concurrency > 32
        ) {
            throw new Error('Workflow concurrency must be between 1 and 32');
        }
        const timeoutMs: string = ResourceBindingCodec.decimal(value['timeoutMs']);
        if (BigInt(timeoutMs) < 1_000n || BigInt(timeoutMs) > 86_400_000n) {
            throw new Error('Workflow run timeout must be between one second and one day');
        }
        const revision: string = ResourceBindingCodec.decimal(graph['revision']);
        if (revision === '0') {
            throw new Error('Workflow run requires a saved revision');
        }
        const input: WorkflowObject = WorkflowJson.object(value['input']);
        return Object.freeze({
            ...(value['models'] === undefined
                ? {}
                : { models: WorkflowRunModelCodec.list(value['models']) }),
            format: 1,
            graph: Object.freeze({
                workflowId: WorkflowInput.id(graph['workflowId']),
                revision,
                nodes,
                edges,
            }),
            triggerNodeId: WorkflowInput.id(value['triggerNodeId']),
            mode,
            input,
            maxConcurrency: concurrency,
            timeoutMs,
        });
    }
    public static result(raw: unknown): WorkflowStepResult {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'outputs',
            'routes',
            'result',
        ]);
        const routes: readonly string[] = WorkflowInput.list(
            value['routes'],
            1_000,
            WorkflowInput.id.bind(WorkflowInput),
        );
        WorkflowInput.unique(routes);
        let result: WorkflowNamedResult | null = null;
        if (value['result'] !== null) {
            const named: Readonly<Record<string, unknown>> = WorkflowInput.record(value['result'], [
                'name',
                'value',
            ]);
            const wrapped: WorkflowObject = WorkflowJson.object({ value: named['value'] });
            const output: WorkflowValue | undefined = wrapped['value'];
            if (output === undefined) {
                throw new Error('Named workflow result is missing');
            }
            result = Object.freeze({ name: WorkflowInput.text(named['name'], 160), value: output });
        }
        return Object.freeze({ outputs: WorkflowJson.object(value['outputs']), routes, result });
    }
}
