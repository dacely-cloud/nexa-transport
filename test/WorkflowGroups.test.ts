// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it } from 'vitest';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method } from '../src/protocol/Protocol.js';
import { WorkflowCodec } from '../src/workflows/WorkflowCodec.js';
import type { WorkflowReadRequest } from '../src/workflows/WorkflowRequests.js';
import { WorkflowRequestCodec } from '../src/workflows/WorkflowRequestCodec.js';
import { WorkflowGroupCodec } from '../src/workflows/WorkflowGroupCodec.js';
import type { WorkflowPatch } from '../src/workflows/WorkflowTypes.js';
import type { WorkflowGroup } from '../src/workflows/WorkflowGroupTypes.js';
import { hello, TestGateway } from './Support.js';

let client: NexaClient | null = null;
let gateway: TestGateway | null = null;
const patch: WorkflowPatch = {
    details: null,
    nodes: [],
    positions: [],
    edges: [],
    removeNodes: [],
    removeEdges: [],
};
const group: WorkflowGroup = {
    id: 'group',
    title: 'Research',
    objective: '',
    parent: null,
    x: 10,
    y: 20,
    nodes: [],
    ports: [],
};
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    client = null;
    gateway = null;
});

it('negotiates hierarchy separately and refuses newer read/save shapes before sending to an older gateway', async (): Promise<void> => {
    gateway = new TestGateway({
        ...hello,
        features: { ...hello.features, workflowDraftsVersion: 1, workflowGraphVersion: 1 },
    });
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    expect(client.supportsWorkflowGraph).toBe(true);
    expect(client.supportsWorkflowGroups).toBe(false);
    const before: number = gateway.requests.length;
    await expect(
        client.call(Method.WorkflowsRead, {
            workflowId: 'draft',
            revision: null,
            nodeOffset: 0,
            edgeOffset: 0,
            groupOffset: 0,
        }),
    ).rejects.toThrow('groups require an updated');
    await expect(
        client.call(Method.WorkflowsSave, {
            workflowId: 'draft',
            commandId: 'group',
            expectedRevision: '1',
            patch: { ...patch, groups: [group], removeGroups: [] },
        }),
    ).rejects.toThrow('groups require an updated');
    expect(gateway.requests.length).toBe(before);
});

it('advertises hierarchy only when graph/draft support is complete', async (): Promise<void> => {
    gateway = new TestGateway({
        ...hello,
        features: {
            ...hello.features,
            workflowDraftsVersion: 1,
            workflowGraphVersion: 1,
            workflowGroupsVersion: 1,
        },
    });
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    expect(client.supportsWorkflowGroups).toBe(true);
});

it('retains legacy shapes while requiring paired hierarchy upserts/deletions and pinned group pagination', (): void => {
    expect(WorkflowCodec.patch(patch)).toEqual(patch);
    expect(WorkflowCodec.patch({ ...patch, groups: [group], removeGroups: [] }).groups).toEqual([
        group,
    ]);
    expect((): WorkflowPatch => WorkflowCodec.patch({ ...patch, groups: [] })).toThrow('fields');
    expect((): WorkflowPatch =>
        WorkflowCodec.patch({ ...patch, groups: [group], removeGroups: [group.id] }),
    ).toThrow('Duplicate');
    expect((): WorkflowReadRequest =>
        WorkflowRequestCodec.read({
            workflowId: 'draft',
            revision: null,
            nodeOffset: 0,
            edgeOffset: 0,
            groupOffset: 128,
        }),
    ).toThrow('revision');
    expect(WorkflowGroupCodec.parse(group)).toEqual(group);
    expect((): WorkflowGroup =>
        WorkflowGroupCodec.parse({ ...group, objective: '', collapse: true }),
    ).toThrow('fields');
});
