// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method, type AgentProfile, type AgentProfileInput } from '../src/protocol/Protocol.js';
import { TestGateway, type Request } from './Support.js';

const input: AgentProfileInput = {
    name: 'My reviewer',
    description: 'Review project changes.',
    instructions: 'Read the project checklist and report concrete findings.',
    provider: '',
    model: '',
    tools: ['read_file', 'grep'],
};

const directoryRevision = '9007199254740997';
const upgradeAvailable = false;
const requestId = '8c599db7-258c-411b-a73a-b29cc1be4e58';

const profile: AgentProfile = {
    ...input,
    id: 'profile:8c599db7-258c-411b-a73a-b29cc1be4e58',
    revision: '9007199254740993',
};

it('round-trips private agent profile mutations with exact revision strings', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    let client: NexaClient | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: { directoryRevision, upgradeAvailable, profiles: [profile] },
            }),
        );
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect(await client.call(Method.AgentProfilesList, {})).toEqual({
            directoryRevision,
            upgradeAvailable,
            profiles: [profile],
        });
        expect(
            await client.call(Method.AgentProfilesCreate, {
                requestId,
                expectedDirectoryRevision: directoryRevision,
                profile: input,
            }),
        ).toEqual({
            directoryRevision,
            upgradeAvailable,
            profiles: [profile],
        });
        expect(
            await client.call(Method.AgentProfilesUpdate, {
                id: profile.id,
                expectedRevision: profile.revision,
                profile: { ...input, tools: null },
            }),
        ).toEqual({ directoryRevision, upgradeAvailable, profiles: [profile] });
        expect(
            await client.call(Method.AgentProfilesDelete, {
                id: profile.id,
                expectedRevision: profile.revision,
            }),
        ).toEqual({ directoryRevision, upgradeAvailable, profiles: [profile] });
        expect(
            await client.call(Method.AgentProfilesUpgrade, {
                expectedDirectoryRevision: directoryRevision,
            }),
        ).toEqual({ directoryRevision, upgradeAvailable, profiles: [profile] });
        expect(gateway.requests.slice(1).map((request: Request): string => request.method)).toEqual(
            [
                Method.AgentProfilesList,
                Method.AgentProfilesCreate,
                Method.AgentProfilesUpdate,
                Method.AgentProfilesDelete,
                Method.AgentProfilesUpgrade,
            ],
        );
        expect(gateway.requests[2]?.params['requestId']).toBe(requestId);
        expect(gateway.requests[2]?.params['expectedDirectoryRevision']).toBe(directoryRevision);
        expect(gateway.requests[3]?.params['expectedRevision']).toBe(profile.revision);
        expect(gateway.requests[4]?.params['expectedRevision']).toBe(profile.revision);
    } finally {
        client?.close();
        await gateway.close();
    }
});

it('rejects malformed profile results before returning them to an application', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    let client: NexaClient | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: {
                    directoryRevision,
                    upgradeAvailable,
                    profiles: [{ ...profile, revision: 42 }],
                },
            }),
        );
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        await expect(client.call(Method.AgentProfilesList, {})).rejects.toThrow();
    } finally {
        client?.close();
        await gateway.close();
    }
});
