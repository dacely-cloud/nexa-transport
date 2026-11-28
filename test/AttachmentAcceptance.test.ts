import { Method } from 'nexa-protocol/gateway/Method.js';
import type { ReceivedAttachment } from 'nexa-protocol/media/BinaryMedia.js';
import { afterEach, describe, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    gateway = undefined;
    client = undefined;
});

/** The `acceptsAttachments` each hello declared, in order. */
function declarations(peer: TestGateway): readonly unknown[] {
    return peer.requests
        .filter((request: Request): boolean => request.method === 'connect')
        .map((request: Request): unknown => {
            const identity: unknown = request.params['client'];
            return typeof identity === 'object' && identity !== null && !Array.isArray(identity)
                ? (identity as Readonly<Record<string, unknown>>)['acceptsAttachments']
                : undefined;
        });
}

/** Receives nothing; stands in for an application's file handler. */
function keep(_file: ReceivedAttachment): void {}

describe('hello attachment acceptance', (): void => {
    it('declares false when no attachment handler is registered', async (): Promise<void> => {
        gateway = new TestGateway();
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect(declarations(gateway)).toEqual([false]);
    });

    it('declares true for a handler passed with the options', async (): Promise<void> => {
        gateway = new TestGateway();
        client = await NexaClient.connect({
            url: await gateway.url(),
            reconnect: false,
            onAttachment: keep,
        });
        expect(declarations(gateway)).toEqual([true]);
    });

    it('lets the client identity override the handler', async (): Promise<void> => {
        gateway = new TestGateway();
        const url: string = await gateway.url();
        const declared: NexaClient = await NexaClient.connect({
            url,
            reconnect: false,
            client: { id: 'app', version: '1', platform: 'web', acceptsAttachments: true },
        });
        declared.close();
        client = await NexaClient.connect({
            url,
            reconnect: false,
            onAttachment: keep,
            client: { id: 'app', version: '1', platform: 'web', acceptsAttachments: false },
        });
        expect(declarations(gateway)).toEqual([true, false]);
    });

    it('declares a handler added after connecting from the next hello', async (): Promise<void> => {
        gateway = new TestGateway();
        const peer: TestGateway = gateway;
        let dropped: boolean = false;
        peer.handler = (socket: WebSocket, request: Request): void => {
            if (!dropped) {
                dropped = true;
                socket.close(1001, 'temporary disconnect');
                return;
            }
            socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
        };
        const connected: NexaClient = await NexaClient.connect({ url: await peer.url() });
        client = connected;
        connected.onAttachment(keep);
        const restored: Promise<void> = new Promise((resolve): void => {
            connected.onReconnect(resolve);
        });
        await expect(
            connected.call(Method.SessionsSubscribe, { sessionId: 'test::main' }),
        ).rejects.toThrow();
        await restored;
        expect(declarations(peer)).toEqual([false, true]);
    });

    it('rejects a handler that is not a function', async (): Promise<void> => {
        gateway = new TestGateway();
        const url: string = await gateway.url();
        await expect(
            NexaClient.connect({
                url,
                // @ts-expect-error A JavaScript caller can pass a value that is not a handler.
                onAttachment: 'files',
            }),
        ).rejects.toThrow('onAttachment must be a function');
    });
});
