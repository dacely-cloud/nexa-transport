// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method, type EmotionalSnapshot } from '../src/protocol/Protocol.js';
import { TestGateway, type Request } from './Support.js';
import { EventName } from '../src/protocol/Events.js';

/** A real pending socket reply lets the test invalidate an older in-flight snapshot. */
interface PendingEmotionReply {
    readonly socket: WebSocket;
    readonly request: Request;
}

/** Current expression and relationship scores with no private memory records. */
const snapshot: EmotionalSnapshot = {
    agentId: 'nexa',
    asOf: '2026-10-18T12:10:00.000Z',
    updatedAt: '2026-10-18T12:00:00.000Z',
    mood: 'warm',
    moodValence: 0.2,
    moodEnergy: 0.35,
    emotions: { gratitude: 0.4, hurt: 0, frustration: 0, concern: 0, curiosity: 0, joy: 0.2 },
    towardUser: { warmth: 0.6, trust: 0.55, caution: 0 },
    awareness: {
        kind: 'functional',
        subjectiveExperience: 'unverified',
        values: ['honesty', 'care', 'fairness', 'responsibility'],
        description: 'Inspectable functional emotional state.',
    },
};

it('reads private emotions with no browser-selectable user identity and validates all returned fields', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    const client: NexaClient = await NexaClient.connect({
        url: await gateway.url(),
        reconnect: false,
    });
    try {
        let reply: EmotionalSnapshot = snapshot;
        gateway.handler = (socket: WebSocket, request: Request): void => {
            expect(request.method).toBe(Method.SelfEmotions);
            expect(request.params).not.toHaveProperty('userId');
            socket.send(JSON.stringify({ id: request.id, ok: true, result: reply }));
        };
        expect(await client.emotions()).toEqual(snapshot);
        expect(gateway.requests.at(-1)?.params).toEqual({});
        expect(await client.emotions('nexa')).toEqual(snapshot);
        expect(gateway.requests.at(-1)?.params).toEqual({ agentId: 'nexa' });
        reply = { ...snapshot };
        Reflect.set(reply, 'recentMemories', [{ evidence: 'PRIVATE MEMORY' }]);
        await expect(client.emotions()).rejects.toThrow();
        await expect(client.call(Method.SelfEmotions, {})).rejects.toThrow();
        reply = snapshot;
        await expect(client.emotions('')).rejects.toThrow();
        await expect(client.emotions('x'.repeat(257))).rejects.toThrow();
        reply = { ...snapshot, emotions: { ...snapshot.emotions, hurt: 100 } };
        await expect(client.emotions()).rejects.toThrow();
        reply = { ...snapshot, towardUser: { ...snapshot.towardUser, trust: -1 } };
        await expect(client.emotions()).rejects.toThrow();
    } finally {
        client.close();
        await gateway.close();
    }
});

it('subscribes real UI views with shared reads and retains a reaction arriving during the initial read', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    const client: NexaClient = await NexaClient.connect({
        url: await gateway.url(),
        reconnect: false,
    });
    const pending: PendingEmotionReply[] = [];
    const first: string[] = [];
    const second: string[] = [];
    const errors: Error[] = [];
    let events: number = 0;
    try {
        gateway.handler = (socket: WebSocket, request: Request): void => {
            pending.push({ socket, request });
        };
        client.on(EventName.TurnEvent, (): void => {
            events++;
        });
        expect(client.supportsEmotions).toBe(true);
        const stopFirst: () => void = client.subscribeEmotions(
            (state: EmotionalSnapshot): void => {
                first.push(state.mood);
            },
            (error: Error): void => {
                errors.push(error);
            },
        );
        const stopSecond: () => void = client.subscribeEmotions(
            (state: EmotionalSnapshot): void => {
                second.push(state.mood);
            },
            (error: Error): void => {
                errors.push(error);
            },
        );
        await expect.poll((): number => pending.length).toBe(1);
        const initial: PendingEmotionReply | undefined = pending[0];
        if (initial === undefined) {
            throw new Error('Missing initial state request');
        }
        initial.socket.send(
            JSON.stringify({
                event: 'turn.event',
                seq: 2,
                data: {
                    streamId: 'work',
                    event: {
                        type: 'tool-finish',
                        outcome: {
                            call: { id: 'react', name: 'self_emotion', input: {} },
                            result: { status: 'ok', content: '{}' },
                            durationMs: 1,
                        },
                    },
                },
            }),
        );
        await expect.poll((): number => events).toBe(1);
        initial.socket.send(JSON.stringify({ id: initial.request.id, ok: true, result: snapshot }));
        await expect.poll((): number => pending.length).toBe(2);
        const next: PendingEmotionReply | undefined = pending[1];
        if (next === undefined) {
            throw new Error('Missing updated state request');
        }
        next.socket.send(
            JSON.stringify({
                id: next.request.id,
                ok: true,
                result: { ...snapshot, mood: 'guarded' },
            }),
        );
        await expect.poll((): number => second.length).toBe(2);
        expect(first).toEqual(['warm', 'guarded']);
        expect(second).toEqual(first);
        stopFirst();
        stopSecond();
        initial.socket.send(
            JSON.stringify({
                event: 'turn.event',
                seq: 3,
                data: {
                    streamId: 'work',
                    event: {
                        type: 'tool-finish',
                        outcome: {
                            call: { id: 'react-again', name: 'self_emotion', input: {} },
                            result: { status: 'ok', content: '{}' },
                            durationMs: 1,
                        },
                    },
                },
            }),
        );
        await expect.poll((): number => events).toBe(2);
        expect(pending).toHaveLength(2);
        expect(errors).toEqual([]);
    } finally {
        client.close();
        await gateway.close();
    }
});

it('restores the private emotional subscription after reconnect and stops delivery after unsubscribe', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    const client: NexaClient = await NexaClient.connect({ url: await gateway.url() });
    const states: string[] = [];
    const errors: Error[] = [];
    let peer: WebSocket | undefined;
    let reads: number = 0;
    try {
        gateway.handler = (socket: WebSocket, request: Request): void => {
            peer = socket;
            reads++;
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result: { ...snapshot, mood: reads === 1 ? 'warm' : 'guarded' },
                }),
            );
        };
        const stop: () => void = client.subscribeEmotions(
            (state: EmotionalSnapshot): void => {
                states.push(state.mood);
            },
            (error: Error): void => {
                errors.push(error);
            },
        );
        await expect.poll((): number => states.length).toBe(1);
        const active: WebSocket | undefined = peer;
        if (active === undefined) {
            throw new Error('Missing emotional state peer');
        }
        active.close(1001, 'temporary disconnect');
        await expect.poll((): number => states.length, { timeout: 3000 }).toBe(2);
        expect(states).toEqual(['warm', 'guarded']);
        expect(reads).toBe(2);
        expect(errors).toHaveLength(1);
        stop();
        client.close();
        expect(states).toHaveLength(2);
        expect(errors).toHaveLength(1);
    } finally {
        client.close();
        await gateway.close();
    }
});
