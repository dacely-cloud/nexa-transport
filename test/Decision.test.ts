// SPDX-License-Identifier: LicenseRef-Proprietary

import { afterEach, describe, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import type { DecisionImage, DecisionRunResult } from 'nexa-protocol/decision/DecisionTypes.js';
import { Method } from 'nexa-protocol/gateway/Method.js';
import { methodValidators } from 'nexa-protocol/schema/MethodValidators.js';
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
            json: '{"id":9007199254740993123,"action":"bash","arguments":{"command":"ls -la"}}',
            durationMs: 140,
            usage: { inputTokens: 80, outputTokens: 20 },
        };
        gateway.handler = (socket: WebSocket, request: Request): void =>
            socket.send(JSON.stringify({ id: request.id, ok: true, result }));
        client = await NexaClient.connect({ url: await gateway.url() });
        expect(
            await client.decide({
                input: 'List files',
                allowCustomActions: true,
                explanation: true,
                brief: true,
            }),
        ).toEqual(result);
        expect(gateway.requests.at(-1)).toMatchObject({
            method: Method.DecisionRun,
            params: {
                input: 'List files',
                allowCustomActions: true,
                explanation: true,
                brief: true,
            },
        });
        expect(Object.keys(gateway.requests.at(-1)?.params ?? {}).sort()).toEqual([
            'allowCustomActions',
            'brief',
            'explanation',
            'input',
        ]);
    });
    it('rejects an older gateway before sending a decision', async (): Promise<void> => {
        gateway = new TestGateway({
            ...hello,
            features: {
                ...hello.features,
                methods: hello.features.methods.filter(
                    (method: string): boolean => method !== 'decision.run',
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
        expect(validate({ input: 'x', explanation: true, brief: true })).toBe(true);
        const image: DecisionImage = {
            mimeType: 'image/png',
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6eQAAAABJRU5ErkJggg==',
        };
        expect(validate({ input: 'Compare these images', images: [image, image, image] })).toBe(
            true,
        );
        for (const value of [
            { input: 'x', system: 'override' },
            { input: 'x', history: [] },
            { input: 'x', explanation: 'yes' },
            { input: 'x', brief: null },
            { input: 'x', images: [image, image, image, image] },
            { input: 'x', images: [{ mimeType: 'video/mp4', data: 'AAAA' }] },
            { input: 'x', images: [{ ...image, url: 'https://example.com/image.png' }] },
            { input: 'x', images: [{ ...image, data: 'a'.repeat(9786716) }] },
            { input: 'x', actions: [] },
            { input: 'x', actions: [{ id: '../tool' }] },
            { input: 'x', actions: new Array(33).fill({ id: 'A' }) },
        ]) {
            expect(validate(value)).toBe(false);
        }
    });
});
