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
async function connect(
    text: string,
    pageBytes: number | ((offset: number) => number),
    maxPendingRequests: number = 64,
): Promise<NexaClient> {
    gateway = new TestGateway({ ...hello, features: { ...hello.features, sessionHistory: true } });
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
