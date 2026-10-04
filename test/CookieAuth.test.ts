import { afterEach, expect, it, vi } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method } from '../src/protocol/Protocol.js';
import { hello, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;

afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
    client = undefined;
    gateway = undefined;
    vi.unstubAllGlobals();
});

/** Gives the Node websocket test the origin checks of a browser document. */
function browserOrigin(endpoint: string): void {
    const url: URL = new URL(endpoint.replace(/^ws/, 'http'));
    vi.stubGlobal('window', { location: url });
}

it('requires a browser and a same-origin endpoint for cookie authentication', async (): Promise<void> => {
    await expect(
        NexaClient.connect({ url: 'wss://example.com/nexa', cookieAuth: true }),
    ).rejects.toThrow('same-origin');
    browserOrigin('wss://example.com');
    await expect(
        NexaClient.connect({ url: 'wss://other.example/nexa', cookieAuth: true }),
    ).rejects.toThrow('same-origin');
    await expect(
        NexaClient.connect({ url: 'ws://example.com/nexa', cookieAuth: true }),
    ).rejects.toThrow('same-origin');
});

it('rejects mixed credentials before opening a socket', async (): Promise<void> => {
    browserOrigin('wss://example.com');
    for (const url of [
        'wss://example.com/nexa?token=secret',
        'wss://user:secret@example.com/nexa',
    ]) {
        await expect(NexaClient.connect({ url, cookieAuth: true })).rejects.toThrow();
    }
    for (const credentials of [
        { apiKey: 'secret' },
        { deviceId: 'device' },
        { pairingCode: 'secret' },
    ]) {
        await expect(
            NexaClient.connect({ url: 'wss://example.com/nexa', cookieAuth: true, ...credentials }),
        ).rejects.toThrow('credentials');
    }
});

it('reconnects using the cookie marker without generating credential requests per RPC', async (): Promise<void> => {
    gateway = new TestGateway();
    const url: string = await gateway.url();
    browserOrigin(url);
    const accountId: string = 'a'.repeat(64);
    client = await NexaClient.connect({ url, cookieAuth: true, accountId });
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
    expect(gateway.upgradeUrls).toEqual([`/?auth=cookie&account=${accountId}`]);
    const reconnected: Promise<void> = new Promise<void>((resolve): void => {
        client?.onReconnect(resolve);
    });
    gateway.handler = (socket: WebSocket): void => {
        socket.close(1001, 'retry');
    };
    await expect(client.call(Method.Health, {})).rejects.toThrow();
    await reconnected;
    expect(gateway.upgradeUrls).toEqual([
        `/?auth=cookie&account=${accountId}`,
        `/?auth=cookie&account=${accountId}`,
    ]);
});

it('rejects malformed account restrictions and restrictions without cookie mode', async (): Promise<void> => {
    browserOrigin('wss://example.com');
    await expect(
        NexaClient.connect({ url: 'wss://example.com/nexa', cookieAuth: true, accountId: 'bad' }),
    ).rejects.toThrow('identifier');
    await expect(
        NexaClient.connect({ url: 'wss://example.com/nexa', accountId: 'a'.repeat(64) }),
    ).rejects.toThrow('requires cookie');
});

it('refuses a server token instead of changing credential mode on reconnect', async (): Promise<void> => {
    gateway = new TestGateway({ ...hello, auth: { ...hello.auth, token: 'unexpected-secret' } });
    const url: string = await gateway.url();
    browserOrigin(url);
    await expect(NexaClient.connect({ url, cookieAuth: true })).rejects.toThrow(
        'cannot accept a gateway token',
    );
    expect(gateway.upgradeUrls).toEqual(['/?auth=cookie']);
});
