// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method, type ConnectorContextCheckView } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { TestGateway, type Request } from './Support.js';

const view: ConnectorContextCheckView = {
    version: 'a'.repeat(64),
    changed: false,
    serverNowMs: '9007199254740993',
    nextTransitionAtMs: '9007199254740994',
};

it('conditional context checks accept only canonical versions and exact finite future server transitions', (): void => {
    const params: (raw: unknown) => boolean =
        methodValidators[Method.ConnectorsContextCheck].params;
    const result: (raw: unknown) => boolean =
        methodValidators[Method.ConnectorsContextCheck].result;
    expect(params({ knownVersion: null })).toBe(true);
    expect(params({ knownVersion: view.version })).toBe(true);
    for (const raw of [
        {},
        { knownVersion: 'A'.repeat(64) },
        { knownVersion: null, userId: 'foreign' },
    ]) {
        expect(params(raw)).toBe(false);
    }
    expect(result(view)).toBe(true);
    for (const replacement of [
        { version: 'a'.repeat(63) },
        { serverNowMs: 9007199254740992 },
        { serverNowMs: '9223372036854775808' },
        { nextTransitionAtMs: view.serverNowMs },
        { nextTransitionAtMs: '01' },
        { nextTransitionAtMs: '9223372036854775808' },
        { account: 'foreign' },
    ]) {
        expect(result({ ...view, ...replacement })).toBe(false);
    }
    expect(result({ ...view, nextTransitionAtMs: null })).toBe(true);
});

it('one unchanged conditional request transfers no connector inventory through the public client', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    let client: NexaClient | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        expect(request.method).toBe(Method.ConnectorsContextCheck.valueOf());
        expect(request.params).toEqual({ knownVersion: view.version });
        socket.send(JSON.stringify({ id: request.id, ok: true, result: view }));
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect(
            await client.call(Method.ConnectorsContextCheck, { knownVersion: view.version }),
        ).toEqual(view);
        expect(
            gateway.requests.filter((request: Request): boolean =>
                request.method.startsWith('connectors.'),
            ),
        ).toHaveLength(1);
    } finally {
        client?.close();
        await gateway.close();
    }
});
