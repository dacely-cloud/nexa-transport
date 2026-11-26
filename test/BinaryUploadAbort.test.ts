// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { randomUUID } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import type { WebSocket as ServerSocket } from 'ws';
import { Method } from 'nexa-protocol/gateway/Method.js';
import type { JsonValue } from 'nexa-protocol/json/JsonValue.js';
import { NexaClient } from '../src/networking/NexaClient.js';
import { hello, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;

afterEach(async (): Promise<void> => {
    vi.unstubAllGlobals();
    client?.close();
    await gateway?.close();
    client = undefined;
    gateway = undefined;
});

it('cancels only the aborted binary upload and keeps the connection usable', async (): Promise<void> => {
    const controller: AbortController = new AbortController();
    let binaryFrames: number = 0;
    /** Aborts the upload right after its first chunk reaches the socket. */
    class CountingSocket extends WebSocket {
        public override send(data: Parameters<WebSocket['send']>[0]): void {
            super.send(data);
            if (typeof data !== 'string' && ++binaryFrames === 1) {
                controller.abort();
            }
        }
    }
    vi.stubGlobal('WebSocket', CountingSocket);
    gateway = new TestGateway({
        ...hello,
        features: { ...hello.features, binaryMedia: true, binaryDataUploads: true },
        policy: { ...hello.policy, maxBufferedBytes: 65_536 },
    });
    const methods: string[] = [];
    gateway.handler = (socket: ServerSocket, request: Request): void => {
        methods.push(request.method);
        socket.send(JSON.stringify({ id: request.id, ok: true, result: [] }));
    };
    client = await NexaClient.connect({ url: await gateway.url(), requestTimeoutMs: 10_000 });
    const closes: Error[] = [];
    client.onClose((error: Error): void => {
        closes.push(error);
    });
    await expect(
        client.uploadChunk(randomUUID(), '0', new Uint8Array(4 * 1024 * 1024), {
            signal: controller.signal,
        }),
    ).rejects.toThrow('Request aborted');
    expect(binaryFrames).toBe(2);
    expect(client.connected).toBe(true);
    expect(closes).toEqual([]);
    await client.call(Method.SessionsList, {});
    expect(methods).toEqual([Method.SessionsList]);
});

it('sends deeply nested plain JSON as text on a binary-media gateway', async (): Promise<void> => {
    gateway = new TestGateway({ ...hello, features: { ...hello.features, binaryMedia: true } });
    const received: Request[] = [];
    gateway.handler = (socket: ServerSocket, request: Request): void => {
        received.push(request);
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: { ok: true, path: 'nexa.json', key: 'workflow.deep' },
            }),
        );
    };
    client = await NexaClient.connect({ url: await gateway.url() });
    let value: JsonValue = 'leaf';
    for (let depth: number = 0; depth < 30; depth++) {
        value = { child: value };
    }
    await client.call(Method.ConfigSet, { key: 'workflow.deep', value });
    expect(received.map((request: Request): unknown => request.params['value'])).toEqual([value]);
});
