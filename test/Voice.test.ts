import { describe, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient, type ReceivedTranscript } from '../src/networking/NexaClient.js';
import { Method } from '../src/protocol/Protocol.js';
import { TestGateway, type Request } from './Support.js';

describe('streaming voice transcription', (): void => {
    it('starts a call, routes revisions and final text, sends PCM, and stops it', async (): Promise<void> => {
        const gateway: TestGateway = new TestGateway();
        gateway.handler = (socket: WebSocket, request: Request): void => {
            if (request.method === 'voice.start') {
                socket.send(
                    JSON.stringify({
                        id: request.id,
                        ok: true,
                        result: { callId: 'call', sampleRate: 24000, frameBytes: 3840 },
                    }),
                );
                for (const [index, kind] of ['interim', 'interim', 'heard'].entries()) {
                    socket.send(
                        JSON.stringify({
                            event: 'voice.event',
                            seq: index + 2,
                            data: {
                                callId: 'call',
                                kind,
                                text: ['hel', 'hello', 'hello there'][index],
                            },
                        }),
                    );
                }
            } else {
                socket.send(JSON.stringify({ id: request.id, ok: true, result: { ok: true } }));
            }
        };
        const client: NexaClient = await NexaClient.connect({ url: await gateway.url() });
        try {
            const received: ReceivedTranscript[] = [];
            const final: PromiseWithResolvers<undefined> = Promise.withResolvers<undefined>();
            const detach: () => void = client.onTranscript((event: ReceivedTranscript): void => {
                received.push(event);
                if (event.final) {
                    final.resolve(undefined);
                }
            });
            const call = await client.startVoice();
            await final.promise;
            expect(received).toEqual([
                { callId: 'call', text: 'hel', final: false },
                { callId: 'call', text: 'hello', final: false },
                { callId: 'call', text: 'hello there', final: true },
            ]);
            await client.sendAudio(call.callId, new Uint8Array(call.frameBytes));
            await client.stopVoice(call.callId);
            detach();
            expect(gateway.requests.at(-1)?.method).toBe(Method.VoiceStop);
        } finally {
            client.close();
            await gateway.close();
        }
    });
});
