// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import type { GatewayLimits, JsonValue } from '../src/protocol/Protocol.js';
import { hello, TestGateway, type Request } from './Support.js';

it.each([true, false])(
    'sizes raw slices to advertised working memory, including legacy process-only limits (%s)',
    async (principalQuota: boolean): Promise<void> => {
        const limits: GatewayLimits = {
            maxConnections: 20,
            maxRequests: 20,
            maxRequestsPerConnection: 10,
            maxRequestsPerPrincipal: 10,
            maxRequestBytes: 128 * 1024,
            ...(principalQuota ? { maxRequestBytesPerPrincipal: 64 * 1024 } : {}),
            maxStreams: 10,
            maxStreamsPerConnection: 5,
            maxStreamsPerPrincipal: 5,
            maxSubscriptionsPerConnection: 10,
            maxOutboundBytes: 128 * 1024,
            handshakeTimeoutMs: 10000,
        };
        const gateway: TestGateway = new TestGateway({
            ...hello,
            features: { ...hello.features, binaryDataUploads: true },
            policy: { ...hello.policy, limits },
        });
        let client: NexaClient | null = null;
        const source: Uint8Array<ArrayBuffer> = new Uint8Array(400000).fill(173);
        const received: Uint8Array<ArrayBuffer> = new Uint8Array(source.byteLength);
        let offset: number = 0;
        let count: number = 0;
        gateway.handler = (socket: WebSocket, request: Request): void => {
            let result: JsonValue;
            if (request.method === 'data.upload.chunk') {
                const data: unknown = request.params['data'];
                if (!(data instanceof Uint8Array)) {
                    throw new Error('Missing raw slice');
                }
                expect(data.byteLength).toBeLessThanOrEqual(principalQuota ? 32768 : 65536);
                expect(request.params['offset']).toBe(String(offset));
                received.set(data, offset);
                offset += data.byteLength;
                count += 1;
                result = { id: 'upload', offset: String(offset) };
            } else {
                result = {
                    id: 'upload',
                    filename: 'source.bin',
                    byteLength: String(source.byteLength),
                    chunkBytes: String(4 * 1024 * 1024),
                    path: '/workspace/source.bin',
                };
            }
            socket.send(JSON.stringify({ id: request.id, ok: true, result }));
        };
        try {
            client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
            await client.uploadData(new Blob([source]), 'source.bin');
            expect(received).toEqual(source);
            expect(count).toBeGreaterThan(6);
            expect(client.connected).toBe(true);
        } finally {
            client?.close();
            await gateway.close();
        }
    },
);
