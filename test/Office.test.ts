import { expect, it } from 'vitest';
import { WebSocketServer } from 'ws';
import { NexaClient } from '../src/networking/NexaClient';
import { OfficeGameOp, OfficeProtocol, type OfficeGamePacket } from '../src/office/OfficeProtocol';
import { Method } from '../src/protocol/Protocol';
import { hello } from './Support';

it('multiplexes binary office input with RPC and restores the subscription after reconnect', async () => {
    const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    const input: OfficeGamePacket[] = [];
    let connections = 0;
    server.on('connection', (socket) => {
        connections++;
        socket.send(
            JSON.stringify({
                event: 'connect.challenge',
                seq: 1,
                data: { nonce: 'challenge', ts: 1, protocol: 1, minProtocol: 1 },
            }),
        );
        socket.on('message', (raw: Buffer, binary: boolean) => {
            if (binary) {
                const packet = OfficeProtocol.decode(raw);
                input.push(packet);
                if (packet.op === OfficeGameOp.Request) {
                    socket.send(
                        OfficeProtocol.encode(OfficeProtocol.control(OfficeGameOp.Snapshot)),
                    );
                }
            } else {
                const request = JSON.parse(raw.toString()) as {
                    readonly id: string;
                    readonly method: string;
                };
                socket.send(
                    JSON.stringify({
                        id: request.id,
                        ok: true,
                        result:
                            request.method === 'connect'
                                ? { ...hello, features: { ...hello.features, officeGame: true } }
                                : [],
                    }),
                );
            }
        });
    });
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    if (address === null || typeof address === 'string') {
        throw new Error('Expected loopback address');
    }
    const client = await NexaClient.connect({ url: `ws://127.0.0.1:${address.port}` });
    try {
        const snapshots: OfficeGamePacket[] = [];
        const stop = client.subscribeOffice((packet) => snapshots.push(packet));
        await expect.poll(() => snapshots.length).toBe(1);
        expect(await client.call(Method.AgentsList, {})).toEqual([]);
        client.moveOffice({ name: 'Visitor', x: 1, z: 2, yaw: 0, floor: 0, active: true });
        await expect
            .poll(() => input.some((packet) => packet.op === OfficeGameOp.Player))
            .toBe(true);
        expect(connections).toBe(1);
        for (const socket of server.clients) {
            socket.close(1001, 'Reconnect test');
        }
        await expect.poll(() => snapshots.length, { timeout: 5000 }).toBe(2);
        expect(connections).toBe(2);
        expect(input.filter((packet) => packet.op === OfficeGameOp.Request)).toHaveLength(2);
        stop();
        await expect.poll(() => input.at(-1)?.op).toBe(OfficeGameOp.Leave);
        expect(client.connected).toBe(true);
        expect(await client.call(Method.AgentsList, {})).toEqual([]);
    } finally {
        client.close();
        for (const socket of server.clients) {
            socket.terminate();
        }
        await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
        );
    }
});
