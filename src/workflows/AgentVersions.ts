// SPDX-License-Identifier: Apache-2.0
import { WorkflowInput } from './WorkflowInput.js';

/** Account-owned instructions. Tool grants and model choices remain separate execution policy. */
export interface WorkflowAgentDefinition {
    readonly id: string;
    readonly name: string;
    readonly instructions: string;
}
/** Immutable content identity; updates to the shared agent create a different version. */
export interface WorkflowAgentVersion extends WorkflowAgentDefinition {
    readonly version: string;
}
export interface WorkflowAgentListRequest {
    readonly workflowId: string;
}
export interface WorkflowAgentPinRequest extends WorkflowAgentListRequest {
    readonly agentId: string;
    readonly version: string;
}
export interface WorkflowAgentList {
    readonly workflowId: string;
    readonly agents: readonly WorkflowAgentVersion[];
}
export interface WorkflowAgentPin {
    readonly workflowId: string;
    readonly agent: WorkflowAgentVersion;
}
/** Portable validation for discovery, explicit pinning and stored instructions. */
export class WorkflowAgentVersionCodec {
    public static definition(raw: unknown): WorkflowAgentDefinition {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'id',
            'name',
            'instructions',
        ]);
        const id: string = WorkflowInput.id(value['id']);
        if (!/^personal:[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u.test(id)) {
            throw new Error('Choose an account-owned agent');
        }
        return {
            id,
            name: WorkflowInput.text(value['name'], 80),
            instructions: WorkflowInput.text(value['instructions'], 16000, true),
        };
    }
    public static version(raw: unknown): string {
        if (typeof raw !== 'string' || !/^[a-f0-9]{64}$/u.test(raw)) {
            throw new Error('Choose a pinned agent version');
        }
        return raw;
    }
    public static read(raw: unknown): WorkflowAgentVersion {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'id',
            'name',
            'instructions',
            'version',
        ]);
        return {
            ...this.definition({
                id: value['id'],
                name: value['name'],
                instructions: value['instructions'],
            }),
            version: this.version(value['version']),
        };
    }
    public static listRequest(raw: unknown): WorkflowAgentListRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, ['workflowId']);
        return { workflowId: WorkflowInput.id(value['workflowId']) };
    }
    public static pinRequest(raw: unknown): WorkflowAgentPinRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'agentId',
            'version',
        ]);
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            agentId: WorkflowInput.id(value['agentId']),
            version: this.version(value['version']),
        };
    }
    public static list(raw: unknown): WorkflowAgentList {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'agents',
        ]);
        const agents: readonly WorkflowAgentVersion[] = WorkflowInput.list(
            value['agents'],
            32,
            (entry: unknown): WorkflowAgentVersion => this.read(entry),
        );
        WorkflowInput.unique(agents.map((agent: WorkflowAgentVersion): string => agent.id));
        return { workflowId: WorkflowInput.id(value['workflowId']), agents };
    }
    public static pin(raw: unknown): WorkflowAgentPin {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'agent',
        ]);
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            agent: this.read(value['agent']),
        };
    }
}
