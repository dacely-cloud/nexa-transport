// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it, vi } from 'vitest';
import type { WebSocket } from 'ws';
import { InboundCapacity } from '../src/networking/InboundCapacity.js';
import { EventStream } from '../src/networking/EventStream.js';
import { BinaryByteBudget } from '../src/media/BinaryByteBudget.js';
import type { BinaryInputReservation } from '../src/media/BinaryInputReservation.js';
import { ProjectChannel } from '../src/networking/ProjectChannel.js';
import { CompanyProjectProtocol } from '../src/company/CompanyProjectProtocol.js';
import { ProjectOp, type ProjectPacket } from '../src/company/CompanyProjectTypes.js';
import { ClientResources } from '../src/networking/ClientResources.js';
import { NexaClient } from '../src/networking/NexaClient.js';
import { TurnStream } from '../src/networking/TurnStream.js';
import { Method, type HelloOk, type JsonValue } from '../src/protocol/Protocol.js';
import { hello, result, TestGateway, type Request } from './Support.js';
import { TransportErrorCode } from '../src/networking/TransportError.js';
import * as validators from '../src/protocol/Validators.js';

const cancelMethod: string = Method.TasksCancel;

it('combines unread queues across streams and releases them on consumption, failure and explicit discard', async (): Promise<void> => {
    const parent: BinaryByteBudget = new BinaryByteBudget(20000);
    const input: InboundCapacity = new InboundCapacity(20000, parent);
    const retain: (bytes: number) => BinaryInputReservation = (
        bytes: number,
    ): BinaryInputReservation => input.reserve(bytes);
    const first: EventStream<string> = new EventStream(8, 20000, retain);
    const second: EventStream<string> = new EventStream(8, 20000, retain);
    try {
        first.push('first', 1500);
        expect((): void => second.push('excess', 1500)).toThrow('Aggregate');
        first.end();
        expect(input.used).toBeGreaterThan(0);
        expect(await first.next()).toEqual({ done: false, value: 'first' });
        expect(input.used).toBe(0);
        second.push('second', 1500);
        second.end(new Error('failed'));
        expect(input.used).toBe(0);
    } finally {
        first.discard();
        second.discard();
    }
    expect(parent.used).toBe(0);
});

it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 0.5])(
    'rejects invalid event weights before corrupting accounting, even with a waiting consumer (%s)',
    async (bytes: number): Promise<void> => {
        const queue: EventStream<string> = new EventStream();
        const waiting: Promise<IteratorResult<string, undefined>> = queue.next();
        expect((): void => queue.push('invalid', bytes)).toThrow('accounting');
        queue.push('valid', 1);
        expect(await waiting).toEqual({ done: false, value: 'valid' });
        await queue.return();
    },
);

it('charges only received project capacity and returns it on malformed input, timeout and disposal', async (): Promise<void> => {
    vi.useFakeTimers();
    const input: InboundCapacity = new InboundCapacity(16384, new BinaryByteBudget(16384));
    const channel: ProjectChannel = new ProjectChannel(input);
    let id: string = '';
    channel.resume((bytes: Uint8Array<ArrayBuffer>): void => {
        id = CompanyProjectProtocol.decode(bytes).id;
    });
    const prefix: () => ProjectPacket = (): ProjectPacket => ({
        op: ProjectOp.Chunk,
        id,
        project: 'project',
        offset: 0,
        total: CompanyProjectProtocol.fileBytes,
        bytes: new Uint8Array([173]),
    });
    try {
        const pending: Promise<Uint8Array<ArrayBuffer>> = channel.file(
            'project',
            'attempt',
            'file.bin',
        );
        channel.receive(prefix());
        expect(input.used).toBe(4608);
        channel.receive({
            op: ProjectOp.Chunk,
            id,
            project: 'project',
            offset: 1,
            total: CompanyProjectProtocol.fileBytes,
            bytes: new Uint8Array(0),
        });
        await expect(pending).rejects.toThrow('out-of-order');
        expect(input.used).toBe(0);
        const timed: Promise<Uint8Array<ArrayBuffer>> = channel.file(
            'project',
            'attempt',
            'file.bin',
        );
        const rejected: Promise<void> = expect(timed).rejects.toThrow('timed out');
        channel.receive(prefix());
        await vi.advanceTimersByTimeAsync(15001);
        await rejected;
        expect(input.used).toBe(0);
        const disposed: Promise<Uint8Array<ArrayBuffer>> = channel.file(
            'project',
            'attempt',
            'file.bin',
        );
        channel.receive(prefix());
        channel.clear();
        await expect(disposed).rejects.toThrow('disposed');
        expect(input.used).toBe(0);
        expect(vi.getTimerCount()).toBe(0);
    } finally {
        channel.clear();
        vi.useRealTimers();
    }
});

const greeting: HelloOk = {
    ...hello,
    features: {
        ...hello.features,
        methods: [Method.AgentStream, Method.TasksCancel],
        methodScopes: {},
    },
};

it('drains a large queue in order while compacting consumed entries and returning all credit', async (): Promise<void> => {
    const input: InboundCapacity = new InboundCapacity(20000000, new BinaryByteBudget(20000000));
    const queue: EventStream<number> = new EventStream(
        20000,
        200000,
        (bytes: number): BinaryInputReservation => input.reserve(bytes),
    );
    let index: number = 0;
    try {
        for (index = 0; index < 10000; index += 1) {
            queue.push(index, 1);
        }
        for (index = 0; index < 5000; index += 1) {
            expect((await queue.next()).value).toBe(index);
        }
        for (index = 10000; index < 15000; index += 1) {
            queue.push(index, 1);
        }
        queue.end();
        for (index = 5000; index < 15000; index += 1) {
            expect((await queue.next()).value).toBe(index);
        }
        expect(await queue.next()).toEqual({ done: true, value: undefined });
        expect(input.used).toBe(0);
    } finally {
        queue.discard();
    }
});

it('validates a matching event once rather than once per active turn', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway(greeting);
    const turns: TurnStream[] = [];
    let client: NexaClient | null = null;
    let count: number = 0;
    const checked = vi.spyOn(validators, 'turnEvent');
    gateway.handler = (socket: WebSocket, request: Request): void => {
        if (request.method === cancelMethod) {
            socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
            return;
        }
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: { streamId: request.params['streamId'], runId: 'run' },
            }),
        );
        count += 1;
        if (count === 16) {
            socket.send(
                JSON.stringify({
                    event: 'turn.event',
                    seq: 2,
                    data: { streamId: 'first', event: { type: 'text', text: 'hello' } },
                }),
            );
        }
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        for (let index: number = 0; index < 16; index += 1) {
            const turn: TurnStream = client.stream({
                message: 'hold',
                streamId: index === 0 ? 'first' : String(index),
            });
            turns.push(turn);
            await turn.accepted;
        }
        await vi.waitFor((): void => {
            expect(checked).toHaveBeenCalledTimes(1);
        });
    } finally {
        for (const turn of turns) {
            await turn.cancel();
        }
        checked.mockRestore();
        client?.close();
        await gateway.close();
    }
});

it('retains completed unread stream input and releases it when the consumer discards the queue', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway(greeting);
    let client: NexaClient | null = null;
    let first: TurnStream | null = null;
    let sequence: number = 2;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        if (request.method === cancelMethod) {
            socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
            return;
        }
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: { streamId: request.params['streamId'], runId: 'run' },
            }),
        );
        socket.send(
            JSON.stringify({
                event: 'turn.event',
                seq: sequence++,
                data: {
                    streamId: request.params['streamId'],
                    event: { type: 'text', text: 'x'.repeat(2000) },
                },
            }),
        );
        socket.send(
            JSON.stringify({
                event: 'turn.end',
                seq: sequence++,
                data: { streamId: request.params['streamId'], ok: true, result },
            }),
        );
    };
    try {
        client = await NexaClient.connect({
            url: await gateway.url(),
            maxInboundBytes: 32768,
            maxActiveStreams: 1,
            reconnect: false,
        });
        first = client.stream({ message: 'first' });
        await first.result;
        expect(ClientResources.input(client).used).toBeGreaterThan(10000);
        const second: TurnStream = client.stream({ message: 'second' });
        await expect(second.result).rejects.toMatchObject({ code: TransportErrorCode.Limit });
        await first.cancel();
        expect(ClientResources.input(client).used).toBe(0);
    } finally {
        await first?.cancel();
        client?.close();
        await gateway.close();
    }
});

it('shares active slots with direct TurnStream constructors and releases them on cancellation', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway(greeting);
    let client: NexaClient | null = null;
    const turns: TurnStream[] = [];
    gateway.handler = (socket: WebSocket, request: Request): void => {
        const response: JsonValue =
            request.method === cancelMethod
                ? { ok: true }
                : { streamId: request.params['streamId'] ?? '', runId: 'run' };
        socket.send(JSON.stringify({ id: request.id, ok: true, result: response }));
    };
    try {
        client = await NexaClient.connect({
            url: await gateway.url(),
            maxActiveStreams: 2,
            reconnect: false,
        });
        const setupOwner: NexaClient = client;
        const setup = vi.spyOn(client, 'onEvent').mockImplementationOnce((): (() => void) => {
            throw new Error('Listener setup failed');
        });
        expect((): TurnStream =>
            setupOwner.stream({ message: 'broken', streamId: 'same' }),
        ).toThrow('Listener setup failed');
        setup.mockRestore();
        const first: TurnStream = client.stream({ message: 'first', streamId: 'same' });
        turns.push(first);
        await first.accepted;
        const second: TurnStream = new TurnStream(client, { message: 'direct' });
        turns.push(second);
        await second.accepted;
        const owner: NexaClient = client;
        expect(
            (): TurnStream => new TurnStream(owner, { message: 'duplicate', streamId: 'same' }),
        ).toThrow('already active');
        expect((): TurnStream => owner.stream({ message: 'excess' })).toThrow('Too many active');
        await second.cancel();
        const restored: TurnStream = owner.stream({ message: 'restored' });
        turns.push(restored);
        await restored.accepted;
    } finally {
        for (const turn of turns) {
            await turn.cancel();
        }
        client?.close();
        await gateway.close();
    }
});
