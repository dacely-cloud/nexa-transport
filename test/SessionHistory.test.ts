import { afterEach, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import type { SessionHistoryRecord } from '../src/protocol/Protocol.js';
import { hello, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
});

/** Splits journals at arbitrary byte boundaries, as a large file page can. */
async function connect(text: string, pageBytes: number): Promise<NexaClient> {
    gateway = new TestGateway({ ...hello, features: { ...hello.features, sessionHistory: true } });
    const bytes: Buffer = Buffer.from(text, 'utf8');
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
                    endCursor: bytes.length.toString(),
                    ...(end < bytes.length ? { nextCursor: end.toString() } : {}),
                },
            }),
        );
    };
    client = await NexaClient.connect({ url: await gateway.url() });
    return client;
}

it('decodes split UTF-8 characters and split records without losing rich native fields', async (): Promise<void> => {
    const record: SessionHistoryRecord = {
        id: 'event',
        at: 1000,
        kind: 'event',
        data: {
            streamId: 'stream',
            event: {
                type: 'native',
                source: 'worker',
                data: { workerId: 'worker', event: { type: 'text', text: '🙂 Café' } },
            },
        },
    };
    const connected: NexaClient = await connect(`${JSON.stringify(record)}\n`, 7);
    expect(connected.supportsSessionHistory).toBe(true);
    expect(await connected.readHistory('saved')).toEqual([record]);
    expect(
        gateway?.requests
            .slice(2)
            .every((request: Request): boolean => typeof request.params['endCursor'] === 'string'),
    ).toBe(true);
});

it.each([
    '{"id":"event","at":1000,"kind":"event","data":{}}\n',
    '{"id":"event","at":1000,"kind":"event","data":{}}',
    '{"id":"event","at":1000,"kind":"event","data":{"streamId":"stream","event":{"type":"text","text":"answer"}}}\n'.repeat(
        2,
    ),
])(
    'rejects incomplete, invalid, and duplicated history without silently dropping content',
    async (text: string): Promise<void> => {
        const connected: NexaClient = await connect(text, 1000);
        await expect(connected.readHistory('saved')).rejects.toThrow();
    },
);

it('returns a complete cursor and reads only records after a prior snapshot', async (): Promise<void> => {
    const first: SessionHistoryRecord = {
        id: 'first',
        at: 1000,
        kind: 'event',
        data: { streamId: 'stream', event: { type: 'text', text: '🙂 First' } },
    };
    const second: SessionHistoryRecord = {
        id: 'second',
        at: 1001,
        kind: 'event',
        data: { streamId: 'stream', event: { type: 'text', text: 'Second' } },
    };
    const prefix: string = `${JSON.stringify(first)}\n`;
    const text: string = prefix + `${JSON.stringify(second)}\n`;
    const connected: NexaClient = await connect(text, 7);
    const snapshot = await connected.readHistorySnapshot(
        'saved',
        Buffer.byteLength(prefix).toString(),
    );
    expect(snapshot).toEqual({ records: [second], endCursor: Buffer.byteLength(text).toString() });
    expect(await connected.readHistorySnapshot('saved', snapshot.endCursor)).toEqual({
        records: [],
        endCursor: snapshot.endCursor,
    });
    expect(gateway?.requests[1]?.params['cursor']).toBe(Buffer.byteLength(prefix).toString());
});
