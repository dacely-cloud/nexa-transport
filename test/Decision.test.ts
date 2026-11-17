// SPDX-License-Identifier: LicenseRef-Proprietary

import { afterEach, describe, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method, type DecisionRunResult } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { hello, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    client = undefined;
    gateway = undefined;
});

describe('stateless decision SDK', (): void => {
    it('sends caller input and options only and preserves JSON numeric text', async (): Promise<void> => {
        gateway = new TestGateway();
        const result: DecisionRunResult = {
            json: '{"id":9007199254740993123,"action":"requested::bash","arguments":{"command":"ls -la"}}',
            durationMs: 140,
            usage: { inputTokens: 80, outputTokens: 20 },
        };
        gateway.handler = (socket: WebSocket, request: Request): void =>
            socket.send(JSON.stringify({ id: request.id, ok: true, result }));
        client = await NexaClient.connect({ url: await gateway.url() });
        expect(await client.decide({ input: 'List files', allowCustomActions: true })).toEqual(
            result,
        );
        expect(gateway.requests.at(-1)).toMatchObject({
            method: Method.DecisionRun,
            params: { input: 'List files', allowCustomActions: true },
        });
        expect(Object.keys(gateway.requests.at(-1)?.params ?? {}).sort()).toEqual([
            'allowCustomActions',
            'input',
        ]);
    });
    it('rejects an older gateway before sending a decision', async (): Promise<void> => {
        gateway = new TestGateway({
            ...hello,
            features: {
                ...hello.features,
                methods: hello.features.methods.filter(
                    (method: string): boolean => method !== Method.DecisionRun,
                ),
            },
        });
        client = await NexaClient.connect({ url: await gateway.url() });
        await expect(client.decide({ input: 'x' })).rejects.toThrow('updated Nexa gateway');
        expect(gateway.requests).toHaveLength(1);
    });
    it('rejects hidden prompt/history controls and invalid action shapes at the wire boundary', (): void => {
        const validate = methodValidators[Method.DecisionRun].params;
        expect(validate({ input: 'x', actions: [{ id: 'A' }] })).toBe(true);
        for (const value of [
            { input: 'x', system: 'override' },
            { input: 'x', history: [] },
            { input: 'x', actions: [] },
            { input: 'x', actions: [{ id: '../tool' }] },
            { input: 'x', actions: new Array(33).fill({ id: 'A' }) },
        ]) {
            expect(validate(value)).toBe(false);
        }
    });
});
