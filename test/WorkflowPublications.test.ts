import { expect, it } from 'vitest';
import { WorkflowPublicationCodec } from '../src/workflows/PublicationCodec.js';
import { WorkflowRunRequestCodec } from '../src/workflows/runtime/RunRequestCodec.js';
import type {
    WorkflowPublishRequest,
    WorkflowPublishedRunRequest,
} from '../src/workflows/PublicationTypes.js';
import { Method } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
it('publication commands retain independent draft and release fences and reject caller ownership', (): void => {
    const command: WorkflowPublishRequest = {
        workflowId: 'workflow',
        revision: '9007199254740993',
        expectedDraftRevision: '9007199254740994',
        commandId: 'publish',
        expectedPublicationId: 'prior',
        policy: { triggerNodeId: 'start', maxConcurrency: 4, timeoutMs: '60000' },
    };
    expect(WorkflowPublicationCodec.publish(command)).toEqual(command);
    expect(methodValidators[Method.WorkflowsPublicationsPublish].params(command)).toBe(true);
    expect((): WorkflowPublishRequest =>
        WorkflowPublicationCodec.publish({ ...command, principal: 'other' }),
    ).toThrow();
    expect((): WorkflowPublishRequest =>
        WorkflowPublicationCodec.publish({
            ...command,
            policy: { ...command.policy, timeoutMs: '0' },
        }),
    ).toThrow();
});
it('published runs cannot override the manifest policy or forge their mode through a draft test', (): void => {
    const request: WorkflowPublishedRunRequest = {
        workflowId: 'workflow',
        publicationId: 'release',
        runId: 'run',
        input: {},
    };
    expect(WorkflowPublicationCodec.run(request)).toEqual(request);
    expect(methodValidators[Method.WorkflowsPublicationsRun].params(request)).toBe(true);
    expect((): WorkflowPublishedRunRequest =>
        WorkflowPublicationCodec.run({ ...request, timeoutMs: '86400000' }),
    ).toThrow();
    expect((): ReturnType<typeof WorkflowRunRequestCodec.start> =>
        WorkflowRunRequestCodec.start({
            workflowId: 'workflow',
            revision: '1',
            runId: 'run',
            mode: 'published',
            input: {},
            triggerNodeId: 'start',
            maxConcurrency: 1,
            timeoutMs: '60000',
        }),
    ).toThrow();
});
