import { WorkflowTimeLimits } from './TimeLimits.js';
import { WorkflowInput } from './WorkflowInput.js';
import { WorkflowJson } from './WorkflowJson.js';
import { ResourceBindingCodec } from './ResourceBindingCodec.js';
import type {
    WorkflowPublicationPolicy,
    WorkflowPublicationCheckRequest,
    WorkflowPublishRequest,
    WorkflowPublicationReadRequest,
    WorkflowPublicationListRequest,
    WorkflowPublishedRunRequest,
    WorkflowPublicationReference,
} from './PublicationTypes.js';

/** Strict portable boundaries reject caller-supplied owners, versions and execution grants. */
export class WorkflowPublicationCodec {
    public static revision(raw: unknown): string {
        const value: string = ResourceBindingCodec.decimal(raw);
        if (value === '0') {
            throw new Error('Select a saved revision or published version');
        }
        return value;
    }
    public static policy(raw: unknown): WorkflowPublicationPolicy {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'triggerNodeId',
            'maxConcurrency',
            'timeoutMs',
        ]);
        const maxConcurrency: unknown = value['maxConcurrency'];
        if (
            typeof maxConcurrency !== 'number' ||
            !Number.isInteger(maxConcurrency) ||
            maxConcurrency < 1 ||
            maxConcurrency > 32
        ) {
            throw new Error('Publication concurrency must be between 1 and 32');
        }
        const timeoutMs: string = WorkflowTimeLimits.timeout(value['timeoutMs'], 'Publication');
        return {
            triggerNodeId: WorkflowInput.id(value['triggerNodeId']),
            maxConcurrency,
            timeoutMs,
        };
    }
    public static check(raw: unknown): WorkflowPublicationCheckRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'revision',
            'policy',
        ]);
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            revision: this.revision(value['revision']),
            policy: this.policy(value['policy']),
        };
    }
    public static publish(raw: unknown): WorkflowPublishRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'revision',
            'policy',
            'commandId',
            'expectedDraftRevision',
            'expectedPublicationId',
        ]);
        return {
            ...this.check({
                workflowId: value['workflowId'],
                revision: value['revision'],
                policy: value['policy'],
            }),
            commandId: WorkflowInput.id(value['commandId']),
            expectedDraftRevision: this.revision(value['expectedDraftRevision']),
            expectedPublicationId:
                value['expectedPublicationId'] === null
                    ? null
                    : WorkflowInput.id(value['expectedPublicationId']),
        };
    }
    public static read(raw: unknown): WorkflowPublicationReadRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'publicationId',
        ]);
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            publicationId:
                value['publicationId'] === null ? null : WorkflowInput.id(value['publicationId']),
        };
    }
    public static list(raw: unknown): WorkflowPublicationListRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'afterVersion',
            'limit',
        ]);
        const limit: unknown = value['limit'];
        if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 20) {
            throw new Error('Read between 1 and 20 published versions');
        }
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            afterVersion:
                value['afterVersion'] === null ? null : this.revision(value['afterVersion']),
            limit,
        };
    }
    public static run(raw: unknown): WorkflowPublishedRunRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'workflowId',
            'publicationId',
            'runId',
            'input',
        ]);
        return {
            workflowId: WorkflowInput.id(value['workflowId']),
            publicationId: WorkflowInput.id(value['publicationId']),
            runId: WorkflowInput.id(value['runId']),
            input: WorkflowJson.object(value['input']),
        };
    }
    public static reference(raw: unknown): WorkflowPublicationReference {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'publicationId',
            'version',
            'revision',
        ]);
        return {
            publicationId: WorkflowInput.id(value['publicationId']),
            version: this.revision(value['version']),
            revision: this.revision(value['revision']),
        };
    }
}
