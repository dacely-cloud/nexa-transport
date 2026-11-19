import { afterEach, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method } from 'nexa-protocol/gateway/Method.js';
import { hello, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    client = undefined;
    gateway = undefined;
});

it('obtains one ticket per socket, reuses the established socket and renews only on reconnect', async (): Promise<void> => {
    gateway = new TestGateway();
    let issued: number = 0;
    client = await NexaClient.connect({
        url: await gateway.url(),
        tokenProvider: (): Promise<string> => Promise.resolve(`ticket-${++issued}`),
    });
    gateway.handler = (socket: WebSocket, request: Request): void => {
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: { ok: true, connections: 1, protocol: 1, uptimeMs: 1, version: 'test' },
            }),
        );
    };
    for (let index: number = 0; index < 100; index++) {
        await client.call(Method.Health, {});
    }
    expect(issued).toBe(1);
    const restored: Promise<void> = new Promise<void>((resolve): void => {
        client?.onReconnect(resolve);
    });
    gateway.handler = (socket: WebSocket): void => {
        socket.close(1001, 'retry');
    };
    await expect(client.call(Method.Health, {})).rejects.toThrow();
    await restored;
    expect(issued).toBe(2);
    expect(gateway.upgradeUrls).toEqual(['/?token=ticket-1', '/?token=ticket-2']);
});

it('refuses mixed credentials and aborts while obtaining a ticket without opening a socket', async (): Promise<void> => {
    gateway = new TestGateway();
    const url: string = await gateway.url();
    await expect(
        NexaClient.connect({
            url,
            apiKey: 'old',
            tokenProvider: (): Promise<string> => Promise.resolve('new'),
        }),
    ).rejects.toThrow('other credentials');
    const controller: AbortController = new AbortController();
    await expect(
        NexaClient.connect({
            url,
            signal: controller.signal,
            tokenProvider: (): Promise<string> => {
                controller.abort();
                return Promise.resolve('ticket');
            },
        }),
    ).rejects.toThrow('aborted');
    expect(gateway.upgradeUrls).toHaveLength(0);
});

it('resuming after an abnormal close starts one fresh handshake without waiting for retry timers', async (): Promise<void> => {
    gateway = new TestGateway();
    let issued: number = 0;
    const renewal: PromiseWithResolvers<string> = Promise.withResolvers<string>();
    client = await NexaClient.connect({
        url: await gateway.url(),
        tokenProvider: (): Promise<string> =>
            ++issued === 1 ? Promise.resolve('first') : renewal.promise,
    });
    const connected: NexaClient = client;
    const restored: Promise<void> = new Promise<void>((resolve): void => {
        connected.onReconnect(resolve);
    });
    gateway.handler = (socket: WebSocket): void => {
        socket.terminate();
    };
    await expect(connected.call(Method.Health, {})).rejects.toThrow('1006');
    expect(issued).toBe(1);
    expect(connected.reconnecting).toBe(true);
    connected.resumeReconnect();
    expect(issued).toBe(2);
    connected.resumeReconnect();
    renewal.resolve('second');
    await restored;
    connected.resumeReconnect();
    expect(issued).toBe(2);
    expect(gateway.upgradeUrls).toEqual(['/?token=first', '/?token=second']);
});

it('manual close while renewal is pending prevents the replacement socket', async (): Promise<void> => {
    gateway = new TestGateway();
    let issued: number = 0;
    const pending: PromiseWithResolvers<string> = Promise.withResolvers<string>();
    client = await NexaClient.connect({
        url: await gateway.url(),
        tokenProvider: async (): Promise<string> => (++issued === 1 ? 'first' : pending.promise),
    });
    gateway.handler = (socket: WebSocket): void => {
        socket.close(1001, 'retry');
    };
    await expect(client.call(Method.Health, {})).rejects.toThrow();
    await expect.poll((): number => issued).toBe(2);
    client.close();
    pending.resolve('second');
    await new Promise<void>((resolve): void => {
        setTimeout(resolve, 30);
    });
    expect(gateway.upgradeUrls).toHaveLength(1);
});

it('does not replace a session ticket with a gateway-issued reusable token', async (): Promise<void> => {
    gateway = new TestGateway({ ...hello, auth: { ...hello.auth, token: 'unexpected-secret' } });
    await expect(
        NexaClient.connect({
            url: await gateway.url(),
            tokenProvider: (): Promise<string> => Promise.resolve('one-time-ticket'),
        }),
    ).rejects.toThrow('cannot accept a gateway token');
});
