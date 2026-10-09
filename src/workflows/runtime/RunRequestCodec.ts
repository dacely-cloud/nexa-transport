// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from '../WorkflowInput.js';
import { WorkflowJson } from '../WorkflowJson.js';
import { ResourceBindingCodec } from '../ResourceBindingCodec.js';
import { WorkflowRunMode } from './RunTypes.js';
import type {
    WorkflowRunStartRequest,
    WorkflowRunRequest,
    WorkflowRunEventsRequest,
    WorkflowRunStepsRequest,
    WorkflowRunAttemptsRequest,
    WorkflowRunOutputRequest,
    WorkflowRunListRequest,
    WorkflowAgentSessionRequest,
    WorkflowAgentInputRequest,
    WorkflowAgentControlRequest,
} from './RunRequests.js';

/** Portable strict request validation. Caller identity never comes from the payload. */
export class WorkflowRunRequestCodec {
    public static agent(raw: unknown): WorkflowAgentSessionRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'nodeId',
            'invocationId',
        ]);
        return {
            runId: WorkflowInput.id(value['runId']),
            nodeId: WorkflowInput.id(value['nodeId']),
            invocationId: WorkflowInput.id(value['invocationId']),
        };
    }
    public static agentControl(raw: unknown): WorkflowAgentControlRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'nodeId',
            'invocationId',
            'controlId',
            'expectedRevision',
            'paused',
        ]);
        const revision: string = WorkflowInput.text(value['expectedRevision'], 19);
        if (
            !/^(0|[1-9][0-9]*)$/.test(revision) ||
            BigInt(revision) >= 9223372036854775807n ||
            typeof value['paused'] !== 'boolean'
        ) {
            throw new Error('Invalid agent control');
        }
        return {
            ...this.agent({
                runId: value['runId'],
                nodeId: value['nodeId'],
                invocationId: value['invocationId'],
            }),
            controlId: WorkflowInput.id(value['controlId']),
            expectedRevision: revision,
            paused: value['paused'],
        };
    }
    public static agentInput(raw: unknown): WorkflowAgentInputRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'nodeId',
            'invocationId',
            'inputId',
            'text',
        ]);
        return {
            ...this.agent({
                runId: value['runId'],
                nodeId: value['nodeId'],
                invocationId: value['invocationId'],
            }),
            inputId: WorkflowInput.id(value['inputId']),
            text: WorkflowInput.text(value['text'], 16384),
        };
    }
    /** Validates a pinned test command and its execution limits. */
    public static start(raw: unknown): WorkflowRunStartRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'workflowId',
            'revision',
            'triggerNodeId',
            'mode',
            'input',
            'maxConcurrency',
            'timeoutMs',
        ]);
        const mode: unknown = value['mode'];
        if (mode !== WorkflowRunMode.LiveTest && mode !== WorkflowRunMode.MockTest) {
            throw new Error('Select a supported test mode');
        }
        const revision: string = ResourceBindingCodec.decimal(value['revision']);
        if (revision === '0') {
            throw new Error('Select a saved workflow revision');
        }
        const timeoutMs: string = ResourceBindingCodec.decimal(value['timeoutMs']);
        if (BigInt(timeoutMs) < 1_000n || BigInt(timeoutMs) > 86_400_000n) {
            throw new Error('Run timeout must be between one second and one day');
        }
        return {
            runId: WorkflowInput.id(value['runId']),
            workflowId: WorkflowInput.id(value['workflowId']),
            revision,
            triggerNodeId: WorkflowInput.id(value['triggerNodeId']),
            mode,
            input: WorkflowJson.object(value['input']),
            maxConcurrency: this.#integer(value['maxConcurrency'], 1, 32),
            timeoutMs,
        };
    }
    /** Validates a run identity without accepting caller-supplied ownership. */
    public static run(raw: unknown): WorkflowRunRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, ['runId']);
        return { runId: WorkflowInput.id(value['runId']) };
    }
    /** Validates the journal cursor and page bound. */
    public static events(raw: unknown): WorkflowRunEventsRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'after',
            'limit',
        ]);
        return {
            runId: WorkflowInput.id(value['runId']),
            after: ResourceBindingCodec.decimal(value['after']),
            limit: this.#integer(value['limit'], 1, 100),
        };
    }
    /** Validates the step metadata cursor and page bound. */
    public static steps(raw: unknown): WorkflowRunStepsRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'afterNodeId',
            'limit',
        ]);
        return {
            runId: WorkflowInput.id(value['runId']),
            afterNodeId:
                value['afterNodeId'] === null ? null : WorkflowInput.id(value['afterNodeId']),
            limit: this.#integer(value['limit'], 1, 100),
        };
    }
    /** Attempt counters are bounded by the engine's recovery limit. */
    public static attempts(raw: unknown): WorkflowRunAttemptsRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'nodeId',
            'afterAttempt',
            'limit',
        ]);
        return {
            runId: WorkflowInput.id(value['runId']),
            nodeId: WorkflowInput.id(value['nodeId']),
            afterAttempt:
                value['afterAttempt'] === null
                    ? null
                    : this.#integer(value['afterAttempt'], 1, 100),
            limit: this.#integer(value['limit'], 1, 60),
        };
    }
    /** Validates the attempt identity and bounded UTF-16 offset. */
    public static output(raw: unknown): WorkflowRunOutputRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'nodeId',
            'invocationId',
            'offset',
        ]);
        return {
            runId: WorkflowInput.id(value['runId']),
            nodeId: WorkflowInput.id(value['nodeId']),
            invocationId: WorkflowInput.id(value['invocationId']),
            offset: this.#integer(value['offset'], 0, 512 * 1024 * 1024),
        };
    }
    /** Validates a workflow history cursor and page bound. */
    public static list(raw: unknown): WorkflowRunListRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'afterRunId',
            'limit',
        ]);
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            afterRunId: value['afterRunId'] === null ? null : WorkflowInput.id(value['afterRunId']),
            limit: this.#integer(value['limit'], 1, 60),
        };
    }
    static #integer(raw: unknown, minimum: number, maximum: number): number {
        if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < minimum || raw > maximum) {
            throw new Error(`Expected an integer between ${minimum} and ${maximum}`);
        }
        return raw;
    }
}
