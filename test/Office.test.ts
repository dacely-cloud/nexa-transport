import { expect, it, vi } from 'vitest';
import { WebSocketServer } from 'ws';
import { NexaClient } from '../src/networking/NexaClient';
import { OfficeGameOp, OfficeProtocol, type OfficeGamePacket } from '../src/office/OfficeProtocol';
import { Method } from '../src/protocol/Protocol';
import { hello } from './Support';

it.each([2, 3, 4, 5, 6, 7, 8] as const)(
    'multiplexes office v%i with RPC and restores negotiated subscriptions',
    async (version) => {
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
                            OfficeProtocol.encode(
                                {
                                    ...OfficeProtocol.control(OfficeGameOp.Snapshot),
                                    projects: [
                                        {
                                            id: 'company:portal',
                                            owner: 'Ada',
                                            goal: 'Portal',
                                            state: 'running',
                                            items: [],
                                            agents: [],
                                            execution: {
                                                running: 1,
                                                ready: 2,
                                                waiting: 1,
                                                blocked: 0,
                                                slots: 2,
                                                paused: false,
                                                phase: 'running',
                                            },
                                        },
                                    ],
                                    construction: [
                                        {
                                            id: 4,
                                            kind: 'window',
                                            floor: 0,
                                            x: 3,
                                            z: 6,
                                            rotation: 1,
                                        },
                                    ],
                                    agents: [
                                        {
                                            id: 'employee',
                                            agentId: 'employee',
                                            name: 'Ada',
                                            state: 'idle',
                                            activity: 'Accepted',
                                            goal: '',
                                            desk: 71,
                                            appearance: 65535,
                                            deskPosition: { x: -8, z: 3 },
                                            reaction: {
                                                id: 'acceptance',
                                                startedAt: 1n,
                                                expiresAt: 8001n,
                                                reason: 'accepted',
                                                phrase: 'WE DID IT!',
                                            },
                                        },
                                    ],
                                },
                                version,
                            ),
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
                                    ? {
                                          ...hello,
                                          features: {
                                              ...hello.features,
                                              officeGame: true,
                                              ...(version >= 3 ? { officeGameVersion: 3 } : {}),
                                              ...(version >= 7 ? { officeAppearance: true } : {}),
                                              ...(version >= 8
                                                  ? { officeDeskPositions: true }
                                                  : {}),
                                              ...(version >= 6 ? { officeExecution: true } : {}),
                                              ...(version >= 5 ? { officeConstruction: true } : {}),
                                              ...(version >= 4
                                                  ? { officeDeskAssignments: true }
                                                  : {}),
                                          },
                                      }
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
            expect(input[0]?.version ?? 8).toBe(version);
            expect(snapshots[0]?.agents[0]?.reaction?.reason).toBe(
                version >= 3 ? 'accepted' : undefined,
            );
            expect(snapshots[0]?.agents[0]?.desk).toBe(version >= 4 ? 71 : undefined);
            expect(snapshots[0]?.agents[0]?.appearance).toBe(version >= 7 ? 65535 : undefined);
            expect(snapshots[0]?.agents[0]?.deskPosition).toEqual(
                version >= 8 ? { x: -8, z: 3 } : undefined,
            );
            expect(snapshots[0]?.construction?.[0]?.kind).toBe(version >= 5 ? 'window' : undefined);
            expect(snapshots.at(-1)?.projects[0]?.execution?.slots).toBe(
                version >= 6 ? 2 : undefined,
            );
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
            expect(snapshots[0]?.construction?.[0]?.kind).toBe(version >= 5 ? 'window' : undefined);
            expect(snapshots.at(-1)?.projects[0]?.execution?.slots).toBe(
                version >= 6 ? 2 : undefined,
            );
            expect(await client.call(Method.AgentsList, {})).toEqual([]);
            const stopClosing = client.subscribeOffice(() => {});
            const state = vi
                .spyOn(WebSocket.prototype, 'readyState', 'get')
                .mockReturnValue(WebSocket.CLOSING);
            const send = vi.spyOn(WebSocket.prototype, 'send');
            try {
                expect(client.connected).toBe(false);
                client.moveOffice({ name: 'Visitor', x: 1, z: 2, yaw: 0, floor: 0, active: true });
                stopClosing();
                expect(send).not.toHaveBeenCalled();
            } finally {
                send.mockRestore();
                state.mockRestore();
            }
        } finally {
            client.close();
            for (const socket of server.clients) {
                socket.terminate();
            }
            await new Promise<void>((resolve, reject) =>
                server.close((error) => (error ? reject(error) : resolve())),
            );
        }
    },
);
