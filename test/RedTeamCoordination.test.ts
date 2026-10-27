// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { RedTeamCodec } from '../src/redteam/RedTeamCodec.js';
import type {
    RedTeamAgent,
    RedTeamCoordinationEvent,
    RedTeamSnapshot,
    RedTeamExecutionAction,
    RedTeamDelegatedAgent,
    RedTeamEvidence,
} from '../src/redteam/RedTeamTypes.js';

const event: RedTeamCoordinationEvent = {
    eventId: 'event-1',
    sequence: '9007199254740993',
    atMs: '1792627200000',
    kind: 'assign',
    agentId: 'agent-1',
    taskId: 'paged-out-task',
    findingId: null,
    summary: 'Assigned the dependency check.',
};
const snapshot: RedTeamSnapshot = {
    effort: {
        effortId: 'effort-1',
        title: 'Owned project',
        source: { kind: 'files', fileIds: ['file-1'] },
        rules: 'Use the supplied scope.',
        parallelism: 8,
        status: 'running',
        revision: '1',
        createdAtMs: '1',
        updatedAtMs: '1',
        sessionKey: 'owner::redteam',
        taskCount: '0',
        findingCount: '0',
        error: null,
    },
    agents: [
        {
            agentId: 'agent-1',
            name: 'Researcher One',
            sessionKey: 'owner::worker',
            status: 'verifying',
            taskId: null,
            activity: 'Checking a reported result.',
        },
    ],
    tasks: [],
    findings: [],
    nextTaskCursor: null,
    nextFindingCursor: null,
    coordination: [event],
};

const action: RedTeamExecutionAction = {
    effortId: 'effort-1',
    agentId: 'agent-1',
    parentAgentId: 'orchestrator',
    actionId: 'observed-tool',
    kind: 'tool',
    state: 'started',
    target: {
        targetId: 'tool:observed',
        kind: 'tool',
        label: 'Observed tool',
        sessionKey: 'owner::worker',
        toolCallId: 'call-1',
        fileId: null,
        path: null,
        line: null,
    },
    relatedTargetId: null,
};

it('binds observed execution to the exact effort, agent, parent and saved session', (): void => {
    const observed: RedTeamSnapshot = {
        ...snapshot,
        coordination: [{ ...event, kind: 'progress', action }],
    };
    expect(RedTeamCodec.snapshot(observed)).toEqual(observed);
    for (const change of [
        { effortId: 'foreign-effort' },
        { agentId: 'foreign-agent' },
        { parentAgentId: null },
        { target: { ...action.target, sessionKey: 'foreign::session' } },
    ] satisfies readonly Partial<RedTeamExecutionAction>[]) {
        expect((): RedTeamSnapshot =>
            RedTeamCodec.snapshot({
                ...snapshot,
                coordination: [{ ...event, action: { ...action, ...change } }],
            }),
        ).toThrow('another effort');
    }
    const root: RedTeamSnapshot = {
        ...snapshot,
        coordination: [
            {
                ...event,
                agentId: 'orchestrator',
                action: {
                    ...action,
                    agentId: 'orchestrator',
                    parentAgentId: null,
                    target: { ...action.target, sessionKey: snapshot.effort.sessionKey },
                },
            },
        ],
    };
    expect(RedTeamCodec.snapshot(root)).toEqual(root);
});

it('retains real nested native identities, original archive selectors and unconfirmed outcomes without widening scheduler slots', (): void => {
    const native: RedTeamDelegatedAgent = {
        agentId: 'native:actual-worker',
        parentAgentId: 'agent-1',
        name: 'Security researcher',
        goal: 'Inspect the original runtime.',
        sessionKey: 'owner::worker',
        historySelection: { workerId: 'actual-worker', streamId: 'original-parent-stream' },
        status: 'failed',
        taskId: null,
        activity: 'Worker ended without a final receipt.',
    };
    const nativeAction: RedTeamExecutionAction = {
        ...action,
        agentId: native.agentId,
        parentAgentId: native.parentAgentId,
        state: 'unconfirmed',
        target: { ...action.target, historySelection: native.historySelection },
    };
    const observed: RedTeamSnapshot = {
        ...snapshot,
        delegatedAgents: [native],
        coordination: [{ ...event, agentId: native.agentId, action: nativeAction }],
    };
    expect(RedTeamCodec.snapshot(observed)).toEqual(observed);
    expect(observed.agents).toHaveLength(1);
    for (const changed of [
        { ...nativeAction, parentAgentId: 'foreign-parent' },
        {
            ...nativeAction,
            target: {
                ...nativeAction.target,
                historySelection: {
                    workerId: 'foreign-worker',
                    streamId: 'original-parent-stream',
                },
            },
        },
        {
            ...nativeAction,
            target: {
                ...nativeAction.target,
                historySelection: { workerId: 'actual-worker', streamId: 'foreign-stream' },
            },
        },
    ]) {
        expect((): RedTeamSnapshot =>
            RedTeamCodec.snapshot({
                ...observed,
                coordination: [{ ...event, agentId: native.agentId, action: changed }],
            }),
        ).toThrow('another effort');
    }
    expect((): RedTeamSnapshot =>
        RedTeamCodec.snapshot({
            ...observed,
            delegatedAgents: new Array<RedTeamDelegatedAgent>(201).fill(native),
        }),
    ).toThrow();
    expect((): RedTeamDelegatedAgent =>
        RedTeamCodec.delegatedAgent({ ...native, agentId: 'persona-alias' }),
    ).toThrow('original archive');
});

it('preserves explicit verifier evidence attribution while missing attribution retains the original reporter contract', (): void => {
    const original: RedTeamEvidence = {
        fileId: 'original-proof',
        description: 'Original retained trace.',
    };
    const verifier: RedTeamEvidence = {
        ...original,
        agentId: 'independent-verifier',
        fileId: 'verifier-proof',
    };
    expect(RedTeamCodec.evidence(original)).toEqual(original);
    expect(RedTeamCodec.evidence(verifier)).toEqual(verifier);
    expect(RedTeamCodec.evidence({ ...original, agentId: null })).toEqual({
        ...original,
        agentId: null,
    });
    expect((): void => {
        RedTeamCodec.evidence({ ...verifier, sessionKey: 'foreign::arbitrary' });
    }).toThrow();
});

it('preserves named verification agents and exact coordination sequences with paged-out references', (): void => {
    expect(RedTeamCodec.snapshot(snapshot)).toEqual(snapshot);
    expect(
        RedTeamCodec.coordination({ ...event, kind: 'verify', findingId: 'paged-out-finding' })
            .findingId,
    ).toBe('paged-out-finding');
});
it('retains historical snapshots without adding missing optional fields', (): void => {
    const { coordination: _coordination, ...historical }: RedTeamSnapshot = snapshot;
    const agent: RedTeamAgent = {
        agentId: 'agent-1',
        sessionKey: null,
        status: 'idle',
        taskId: null,
        activity: '',
    };
    expect(RedTeamCodec.snapshot({ ...historical, agents: [agent] })).toEqual({
        ...historical,
        agents: [agent],
    });
    expect(Object.hasOwn(RedTeamCodec.agent(agent), 'name')).toBe(false);
});
it('validates every coordination kind without inventing event types', (): void => {
    for (const kind of ['assign', 'result', 'verify', 'progress']) {
        expect(RedTeamCodec.coordination({ ...event, kind }).kind).toBe(kind);
    }
    expect((): void => {
        RedTeamCodec.coordination({ ...event, kind: 'animation' });
    }).toThrow();
});
it('rejects unknown agents and duplicate event identities or sequence values', (): void => {
    expect((): void => {
        RedTeamCodec.snapshot({ ...snapshot, coordination: [{ ...event, agentId: 'unknown' }] });
    }).toThrow('known agent');
    expect((): void => {
        RedTeamCodec.snapshot({
            ...snapshot,
            coordination: [event, { ...event, sequence: '9007199254740994' }],
        });
    }).toThrow('Duplicate');
    expect((): void => {
        RedTeamCodec.snapshot({
            ...snapshot,
            coordination: [event, { ...event, eventId: 'event-2' }],
        });
    }).toThrow('increasing');
    expect((): void => {
        RedTeamCodec.snapshot({
            ...snapshot,
            coordination: [event, { ...event, eventId: 'event-2', sequence: '1' }],
        });
    }).toThrow('increasing');
});
it('rejects unsafe decimals, oversize pages and invalid names or summaries', (): void => {
    for (const sequence of ['9223372036854775808', '-1', '01', 9007199254740992]) {
        expect((): void => {
            RedTeamCodec.coordination({ ...event, sequence });
        }).toThrow();
    }
    expect((): void => {
        RedTeamCodec.snapshot({
            ...snapshot,
            coordination: new Array<RedTeamCoordinationEvent>(101).fill(event),
        });
    }).toThrow();
    expect((): void => {
        RedTeamCodec.coordination({ ...event, summary: 'x'.repeat(4097) });
    }).toThrow();
    expect((): void => {
        RedTeamCodec.agent({ ...snapshot.agents[0], name: '' });
    }).toThrow();
    expect((): void => {
        RedTeamCodec.snapshot({ ...snapshot, coordination: undefined });
    }).toThrow();
});
