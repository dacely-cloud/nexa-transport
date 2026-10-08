// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from '../WorkflowInput.js';
import { WorkflowCodec } from '../WorkflowCodec.js';
import { ResourceBindingCodec } from '../ResourceBindingCodec.js';
import type { WorkflowNode, WorkflowEdge, WorkflowPosition } from '../WorkflowTypes.js';
import {
    PlanningLimits,
    RequirementState,
    type PlanningDocument,
    type PlanningBrief,
    type PlanningQuestion,
    type PlanningRequirement,
    type PlanningProposal,
    type PlanningRequest,
    type PlanningTurnRef,
    type PlanningHistoryRequest,
} from './PlanningTypes.js';

/** Shared wire and model-output boundary. Strict fields prevent silently ignored model instructions. */
export class PlanningCodec {
    public static request(raw: unknown): PlanningRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'requestId',
            'baseRevision',
            'previousRequestId',
            'message',
            'document',
        ]);
        const request: PlanningRequest = {
            workflowId: WorkflowInput.id(value['workflowId']),
            requestId: WorkflowInput.id(value['requestId']),
            baseRevision: ResourceBindingCodec.decimal(value['baseRevision']),
            previousRequestId:
                value['previousRequestId'] === null
                    ? null
                    : WorkflowInput.id(value['previousRequestId']),
            message: WorkflowInput.text(value['message'], PlanningLimits.messageCharacters),
            document: this.document(value['document']),
        };
        this.bytes(request, PlanningLimits.requestBytes);
        return Object.freeze(request);
    }
    public static reference(raw: unknown): PlanningTurnRef {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'requestId',
        ]);
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            requestId: WorkflowInput.id(value['requestId']),
        };
    }
    public static history(raw: unknown): PlanningHistoryRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'beforeRequestId',
        ]);
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            beforeRequestId:
                value['beforeRequestId'] === null
                    ? null
                    : WorkflowInput.id(value['beforeRequestId']),
        };
    }
    public static document(raw: unknown): PlanningDocument {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'details',
            'nodes',
            'positions',
            'edges',
        ]);
        const nodes: readonly WorkflowNode[] = WorkflowInput.list(
            value['nodes'],
            PlanningLimits.nodes,
            (entry: unknown): WorkflowNode => WorkflowCodec.node(entry),
        );
        const positions: readonly WorkflowPosition[] = WorkflowInput.list(
            value['positions'],
            PlanningLimits.nodes,
            (entry: unknown): WorkflowPosition => WorkflowCodec.position(entry),
        );
        const edges: readonly WorkflowEdge[] = WorkflowInput.list(
            value['edges'],
            PlanningLimits.edges,
            (entry: unknown): WorkflowEdge => WorkflowCodec.edge(entry),
        );
        WorkflowInput.unique(nodes.map((node: WorkflowNode): string => node.id));
        WorkflowInput.unique(positions.map((position: WorkflowPosition): string => position.id));
        WorkflowInput.unique(edges.map((edge: WorkflowEdge): string => edge.id));
        const ids: ReadonlySet<string> = new Set(
            nodes.map((node: WorkflowNode): string => node.id),
        );
        if (
            positions.length !== nodes.length ||
            positions.some((position: WorkflowPosition): boolean => !ids.has(position.id))
        ) {
            throw new Error('Every planning component needs exactly one position');
        }
        return Object.freeze({
            details: WorkflowCodec.details(value['details']),
            nodes,
            positions,
            edges,
        });
    }
    public static proposal(raw: unknown): PlanningProposal {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'message',
            'brief',
            'patch',
        ]);
        const proposal: PlanningProposal = {
            message: WorkflowInput.text(value['message'], 6000),
            brief: this.brief(value['brief']),
            patch: value['patch'] === null ? null : WorkflowCodec.patch(value['patch']),
        };
        this.bytes(proposal, PlanningLimits.responseBytes);
        return Object.freeze(proposal);
    }
    public static brief(raw: unknown): PlanningBrief {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'goal',
            'requirements',
            'sources',
            'outputs',
            'boundaries',
            'assumptions',
            'questions',
            'schedule',
            'budget',
        ]);
        const requirements: readonly PlanningRequirement[] = WorkflowInput.list(
            value['requirements'],
            64,
            (raw: unknown): PlanningRequirement => {
                const entry: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
                    'id',
                    'text',
                    'nodeIds',
                    'state',
                ]);
                const state: unknown = entry['state'];
                if (
                    state !== RequirementState.Drafted &&
                    state !== RequirementState.Missing &&
                    state !== RequirementState.Question
                ) {
                    throw new Error('Invalid planning requirement state');
                }
                const nodeIds: readonly string[] = WorkflowInput.list(
                    entry['nodeIds'],
                    100,
                    (id: unknown): string => WorkflowInput.id(id),
                );
                WorkflowInput.unique(nodeIds);
                return {
                    id: WorkflowInput.id(entry['id']),
                    text: WorkflowInput.text(entry['text'], 1000),
                    nodeIds,
                    state,
                };
            },
        );
        const questions: readonly PlanningQuestion[] = WorkflowInput.list(
            value['questions'],
            3,
            (raw: unknown): PlanningQuestion => {
                const entry: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
                    'id',
                    'text',
                    'choices',
                ]);
                return {
                    id: WorkflowInput.id(entry['id']),
                    text: WorkflowInput.text(entry['text'], 1000),
                    choices: this.#texts(entry['choices'], 6),
                };
            },
        );
        WorkflowInput.unique(requirements.map((entry: PlanningRequirement): string => entry.id));
        WorkflowInput.unique(questions.map((entry: PlanningQuestion): string => entry.id));
        return {
            goal: WorkflowInput.text(value['goal'], 2000),
            requirements,
            questions,
            sources: this.#texts(value['sources'], 32),
            outputs: this.#texts(value['outputs'], 32),
            boundaries: this.#texts(value['boundaries'], 32),
            assumptions: this.#texts(value['assumptions'], 16),
            schedule:
                value['schedule'] === null ? null : WorkflowInput.text(value['schedule'], 1000),
            budget: value['budget'] === null ? null : WorkflowInput.text(value['budget'], 1000),
        };
    }
    public static bytes(
        value: PlanningRequest | PlanningProposal | PlanningDocument,
        maximum: number,
    ): void {
        if (new TextEncoder().encode(JSON.stringify(value)).byteLength > maximum) {
            throw new Error(`Planning content exceeds ${maximum} bytes`);
        }
    }
    static #texts(raw: unknown, maximum: number): readonly string[] {
        return WorkflowInput.list(raw, maximum, (entry: unknown): string =>
            WorkflowInput.text(entry, 1000),
        );
    }
}
