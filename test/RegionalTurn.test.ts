// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method } from '../src/protocol/Protocol.js';
import { TestGateway, hello, result, type Request } from './Support.js';

it.each([true, false])(
    'sends explicit coarse regional context only when advertised: %s',
    async (advertised: boolean): Promise<void> => {
        const gateway: TestGateway = new TestGateway({
            ...hello,
            features: { ...hello.features, ...(advertised ? { userRegion: true } : {}) },
        });
        let client: NexaClient | undefined;
        try {
            client = await NexaClient.connect({
                url: await gateway.url(),
                reconnect: false,
                userRegion: { countryCode: 'GB', timeZone: 'Europe/London' },
            });
            gateway.handler = (socket: WebSocket, request: Request): void => {
                expect(request.params['userRegion']).toEqual(
                    advertised ? { countryCode: 'GB', timeZone: 'Europe/London' } : undefined,
                );
                if (request.method === 'agent.ask') {
                    socket.send(JSON.stringify({ id: request.id, ok: true, result }));
                    return;
                }
                socket.send(
                    JSON.stringify({
                        id: request.id,
                        ok: true,
                        result: { streamId: request.params['streamId'], runId: 'regional-run' },
                    }),
                );
                socket.send(
                    JSON.stringify({
                        event: 'turn.end',
                        seq: 2,
                        data: { streamId: request.params['streamId'], ok: true, result },
                    }),
                );
            };
            expect((await client.stream({ message: 'News please' }).result).text).toBe('finished');
            expect((await client.call(Method.AgentAsk, { message: 'News please' })).text).toBe(
                'finished',
            );
        } finally {
            client?.close();
            await gateway.close();
        }
    },
);
