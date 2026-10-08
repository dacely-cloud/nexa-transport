import { afterEach, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method, type SessionHistoryRecord } from '../src/protocol/Protocol.js';
import { hello, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
});

/** Splits journals at arbitrary byte boundaries, as a large file page can. */
async function connect(
    text: string,
    pageBytes: number | ((offset: number) => number),
    maxPendingRequests: number = 64,
    compact: boolean = false,
): Promise<NexaClient> {
    gateway = new TestGateway({
        ...hello,
        features: {
            ...hello.features,
            sessionHistory: true,
            ...(compact ? { transcriptBlocks: true as const } : {}),
        },
    });
    const bytes: Buffer = Buffer.from(text, 'utf8');
    gateway.handler = (socket: WebSocket, request: Request): void => {
        const offset: number = Number(request.params['cursor'] ?? '0');
        const length: number = typeof pageBytes === 'number' ? pageBytes : pageBytes(offset);
        const end: number = Math.min(bytes.length, offset + length);
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: {
                    format: 1,
                    ...(request.method === Method.SessionsTranscript ? { raw: true } : {}),
                    chunk: bytes.subarray(offset, end).toString('base64'),
                    endCursor: bytes.length.toString(),
                    ...(end < bytes.length ? { nextCursor: end.toString() } : {}),
                },
            }),
        );
    };
    client = await NexaClient.connect({ url: await gateway.url(), maxPendingRequests });
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

it.each([1, 4, 64])(
    'pipelines ordered reads despite reordered replies, within a pending limit of %i',
    async (limit: number): Promise<void> => {
        const records: SessionHistoryRecord[] = Array.from(
            { length: 12 },
            (_, index: number): SessionHistoryRecord => ({
                id: `event:${index}`,
                at: index,
                kind: 'event',
                data: { streamId: 'stream', event: { type: 'text', text: `🙂 Café ${index}` } },
            }),
        );
        const connected: NexaClient = await connect(
            records.map((record): string => JSON.stringify(record) + '\n').join(''),
            37,
            limit,
        );
        if (gateway === undefined) {
            throw new Error('Missing gateway');
        }
        const reply: typeof gateway.handler = gateway.handler;
        let active: number = 0;
        let peak: number = 0;
        gateway.handler = (socket: WebSocket, request: Request): void => {
            peak = Math.max(peak, ++active);
            setTimeout(
                (): void => {
                    active -= 1;
                    reply(socket, request);
                },
                Number(request.params['cursor'] ?? '0') % 2 ? 1 : 10,
            );
        };
        expect(await connected.readHistory('saved')).toEqual(records);
        expect(peak).toBeLessThanOrEqual(Math.max(1, Math.min(16, Math.floor(limit / 2))));
        if (limit > 1) {
            expect(peak).toBeGreaterThan(1);
        }
        expect(
            gateway.requests
                .slice(2)
                .every((request): boolean => typeof request.params['endCursor'] === 'string'),
        ).toBe(true);
    },
);

it('adapts to changing page sizes without losing split UTF-8 or JSON', async (): Promise<void> => {
    const record: SessionHistoryRecord = {
        id: 'variable',
        at: 1000,
        kind: 'event',
        data: { streamId: 'stream', event: { type: 'text', text: '🙂 Café'.repeat(100) } },
    };
    const connected: NexaClient = await connect(
        JSON.stringify(record) + '\n',
        (offset: number): number => (offset < 128 ? 31 : 7),
    );
    expect(await connected.readHistory('saved')).toEqual([record]);
});

it.each(['boundary', 'cursor', 'short', 'missing-newline'])(
    'rejects a malformed prefetched %s page without leaving pending reads',
    async (failure: string): Promise<void> => {
        const record: SessionHistoryRecord = {
            id: 'broken',
            at: 1000,
            kind: 'event',
            data: { streamId: 'stream', event: { type: 'text', text: 'Café 🙂'.repeat(100) } },
        };
        const text: string = JSON.stringify(record) + '\n';
        const connected: NexaClient = await connect(text, 31);
        if (gateway === undefined) {
            throw new Error('Missing gateway');
        }
        const reply: typeof gateway.handler = gateway.handler;
        gateway.handler = (socket: WebSocket, request: Request): void => {
            const bytes: Buffer = Buffer.from(text);
            const offset: number = Number(request.params['cursor']);
            const end: number = Math.min(bytes.length, offset + 31);
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result: {
                        format: 1,
                        chunk: bytes
                            .subarray(
                                offset,
                                failure === 'short' && offset > 0
                                    ? end - 1
                                    : failure === 'missing-newline' && end === bytes.length
                                      ? end - 1
                                      : end,
                            )
                            .toString('base64'),
                        endCursor: String(
                            failure === 'boundary' && offset > 0 ? bytes.length + 1 : bytes.length,
                        ),
                        ...(end < bytes.length
                            ? {
                                  nextCursor: String(
                                      failure === 'cursor' && offset > 0 ? offset : end,
                                  ),
                              }
                            : {}),
                    },
                }),
            );
        };
        await expect(connected.readHistory('saved')).rejects.toThrow();
        // All prefetched failures are observed and cancellations release local RPC capacity.
        gateway.handler = reply;
        expect(
            await connected.readHistorySnapshot('saved', String(Buffer.byteLength(text))),
        ).toEqual({ records: [], endCursor: String(Buffer.byteLength(text)) });
    },
);

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

/** Compact wire bytes are intentionally unrelated to physical journal cursor distances. */
it('reads compact UTF-8 blocks using physical cursors and a fixed snapshot end', async (): Promise<void> => {
    gateway = new TestGateway({
        ...hello,
        features: { ...hello.features, sessionHistory: true, transcriptBlocks: true },
    });
    const requested: string[] = [];
    gateway.handler = (socket: WebSocket, request: Request): void => {
        requested.push(request.method);
        const cursor: string = String(request.params['cursor']);
        const record: SessionHistoryRecord = {
            id: cursor,
            at: 1,
            kind: 'event',
            data: {
                streamId: 'stream',
                event: { type: 'text', text: cursor === '0' ? 'ap' : 'ple🙂' },
            },
        };
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: {
                    format: 1,
                    chunk: Buffer.from(JSON.stringify(record) + '\n').toString('base64'),
                    endCursor: '100000',
                    ...(cursor === '0' ? { nextCursor: '50000' } : {}),
                },
            }),
        );
    };
    client = await NexaClient.connect({ url: await gateway.url() });
    const saved = await client.readHistorySnapshot('saved');
    expect(saved.endCursor).toBe('100000');
    expect(
        saved.records
            .map((record): string =>
                record.kind === 'event' && record.data.event.type === 'text'
                    ? record.data.event.text
                    : '',
            )
            .join(''),
    ).toBe('apple🙂');
    expect(requested).toEqual([Method.SessionsTranscript, Method.SessionsTranscript]);
    expect(gateway.requests.at(-1)?.params['endCursor']).toBe('100000');
});

it('falls back to split-record paging for oversized legacy records without losing UTF-8', async (): Promise<void> => {
    const record: SessionHistoryRecord = {
        id: 'oversized',
        at: 1,
        kind: 'event',
        data: { streamId: 'stream', event: { type: 'text', text: 'apple🙂' } },
    };
    const connected: NexaClient = await connect(JSON.stringify(record) + '\n', 7, 64, true);
    expect(await connected.readHistory('saved')).toEqual([record]);
    expect(gateway?.requests[1]?.method).toBe(Method.SessionsTranscript);
    expect(gateway?.requests[2]?.method).toBe(Method.SessionsHistory);
});
