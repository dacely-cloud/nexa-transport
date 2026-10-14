// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import type { TurnStream } from '../src/networking/TurnStream.js';
import type { TurnActivityEvent, TurnEventData, WireTurnEvent } from '../src/protocol/Protocol.js';
import { turnEvent } from '../src/protocol/Validators.js';
import { result, TestGateway, type Request } from './Support.js';

let client: NexaClient | undefined;
let gateway: TestGateway | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    client = undefined;
    gateway = undefined;
});

it('delivers setup, internal model work and heartbeat packets before answer text', async (): Promise<void> => {
    gateway = new TestGateway();
    client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    gateway.handler = (socket: WebSocket, request: Request): void => {
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: { streamId: request.params['streamId'], runId: 'activity' },
            }),
        );
        const stages: readonly TurnActivityEvent[] = [
            {
                type: 'turn-activity',
                phase: 'preparing',
                detail: 'Reading the message.',
                elapsedSeconds: 0,
            },
            {
                type: 'turn-activity',
                phase: 'understanding',
                detail: 'Identifying the requirements.',
                elapsedSeconds: 0,
            },
            {
                type: 'turn-activity',
                phase: 'understanding',
                detail: 'Identifying the requirements.',
                elapsedSeconds: 10,
            },
            {
                type: 'turn-activity',
                phase: 'verifying',
                detail: 'Checking results.',
                elapsedSeconds: 0,
            },
        ];
        for (let index: number = 0; index < stages.length; index += 1) {
            socket.send(
                JSON.stringify({
                    event: 'turn.event',
                    seq: index + 2,
                    data: {
                        streamId: request.params['streamId'],
                        event: {
                            type: 'status',
                            status: stages[index]?.phase,
                            detail: stages[index]?.detail,
                            activity: stages[index],
                        },
                    },
                }),
            );
        }
        socket.send(
            JSON.stringify({
                event: 'turn.event',
                seq: 6,
                data: {
                    streamId: request.params['streamId'],
                    event: { type: 'text', text: 'Done.' },
                },
            }),
        );
        socket.send(
            JSON.stringify({
                event: 'turn.end',
                seq: 7,
                data: { streamId: request.params['streamId'], ok: true, result },
            }),
        );
    };
    const stream: TurnStream = client.stream({
        message: 'Help with this request.',
        targetTimeSeconds: 3600,
    });
    const events: WireTurnEvent[] = [];
    for await (const event of stream) {
        events.push(event);
    }
    expect(events.map((event: WireTurnEvent): string => event.type)).toEqual([
        'status',
        'status',
        'status',
        'status',
        'text',
    ]);
    expect(events[2]).toMatchObject({
        type: 'status',
        activity: { phase: 'understanding', elapsedSeconds: 10 },
    });
    await stream.result;
});

it('validates stage names and bounded activity at the untrusted wire boundary', (): void => {
    const data: TurnEventData = {
        streamId: 'turn',
        event: {
            type: 'status',
            status: 'understanding',
            detail: 'Reading the request.',
            activity: {
                type: 'turn-activity',
                phase: 'understanding',
                detail: 'Reading the request.',
                elapsedSeconds: 0,
            },
        },
    };
    if (data.event.type !== 'status') {
        throw new Error('Expected status');
    }
    expect(turnEvent(data)).toBe(true);
    expect(
        turnEvent({
            streamId: 'turn',
            event: { type: 'status', status: 'understanding', detail: 'Reading the request.' },
        }),
    ).toBe(true);
    expect(
        turnEvent({
            ...data,
            event: { ...data.event, activity: { ...data.event.activity, phase: 'made-up' } },
        }),
    ).toBe(false);
    expect(
        turnEvent({
            ...data,
            event: { ...data.event, activity: { ...data.event.activity, elapsedSeconds: -1 } },
        }),
    ).toBe(false);
    expect(
        turnEvent({
            ...data,
            event: { ...data.event, activity: { ...data.event.activity, detail: 'x'.repeat(301) } },
        }),
    ).toBe(false);
});
