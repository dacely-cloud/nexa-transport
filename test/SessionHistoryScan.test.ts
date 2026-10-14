// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it, vi, type MockInstance } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import type { SessionHistoryRecord } from '../src/protocol/Protocol.js';
import { hello, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;

afterEach(async (): Promise<void> => {
    vi.restoreAllMocks();
    client?.close();
    await gateway?.close();
});

/** Supplies actual authenticated transcript RPCs at arbitrary byte boundaries. */
async function connect(bytes: Buffer, pageBytes: number): Promise<NexaClient> {
    gateway = new TestGateway({
        ...hello,
        features: { ...hello.features, sessionHistory: true },
    });
    gateway.handler = (socket: WebSocket, request: Request): void => {
        const offset: number = Number(request.params['cursor'] ?? '0');
        const end: number = Math.min(bytes.length, offset + pageBytes);
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: {
                    format: 1,
                    chunk: bytes.subarray(offset, end).toString('base64'),
                    endCursor: String(bytes.length),
                    ...(end < bytes.length ? { nextCursor: String(end) } : {}),
                },
            }),
        );
    };
    client = await NexaClient.connect({ url: await gateway.url() });
    return client;
}

it('scans a large split record in linear input space and preserves its full text', async (): Promise<void> => {
    const record: SessionHistoryRecord = {
        id: 'large',
        at: 1000,
        kind: 'event',
        data: { streamId: 'stream', event: { type: 'text', text: '🙂 Café'.repeat(16000) } },
    };
    const journal: string = JSON.stringify(record) + '\n';
    const connected: NexaClient = await connect(Buffer.from(journal), 512);
    const scan: MockInstance<typeof String.prototype.indexOf> = vi.spyOn(
        String.prototype,
        'indexOf',
    );
    expect(await connected.readHistory('saved')).toEqual([record]);
    let scanned: number = 0;
    for (let index: number = 0; index < scan.mock.calls.length; index++) {
        const context: unknown = scan.mock.contexts[index];
        const call: Parameters<typeof String.prototype.indexOf> | undefined =
            scan.mock.calls[index];
        if (typeof context === 'string' && call?.[0] === '\n') {
            scanned += Math.max(0, context.length - (call[1] ?? 0));
        }
    }
    expect(scanned).toBeLessThanOrEqual(journal.length * 2);
});

it('rejects a transcript page exceeding the requested byte ceiling before base64 decoding', async (): Promise<void> => {
    const connected: NexaClient = await connect(Buffer.alloc(1024 * 1024 + 4, 32), 1024 * 1024 + 4);
    const decode: MockInstance<typeof atob> = vi.spyOn(globalThis, 'atob');
    await expect(connected.readHistory('saved')).rejects.toThrow();
    expect(decode.mock.calls.length).toBe(0);
});

it('rejects excess decoded bytes even when base64 padding keeps the encoded length within the ceiling', async (): Promise<void> => {
    const connected: NexaClient = await connect(Buffer.alloc(1024 * 1024 + 1, 32), 1024 * 1024 + 1);
    await expect(connected.readHistory('saved')).rejects.toThrow(
        'History page exceeds requested byte limit',
    );
});

it('rejects an incomplete final UTF-8 code point', async (): Promise<void> => {
    const connected: NexaClient = await connect(Buffer.from([0xc3]), 1);
    await expect(connected.readHistory('saved')).rejects.toThrow();
});
