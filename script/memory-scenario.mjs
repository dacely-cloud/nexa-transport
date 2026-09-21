import { NexaClient } from '../dist/nexa-transport.js';
import { Method } from '../dist/protocol.js';

export async function createScenario(url) {
    const client = await NexaClient.connect({ url, reconnect: true });
    const turns = [];
    const callbacks = [];
    const clients = [];
    let completed = 0;
    return {
        async batch(count) {
            for (let i = 0; i < count; i++) {
                const mode = ['complete', 'cancel', 'fail'][i % 3];
                const controller = new AbortController();
                const turn = client.stream({ message: mode }, { signal: controller.signal });
                turns.push(new WeakRef(turn));
                const listener = () => {};
                callbacks.push(new WeakRef(listener));
                const stop = client.onEvent(listener);
                try {
                    for await (const event of turn) {
                        if (event.type !== 'text') throw new Error('Unexpected event');
                        if (mode === 'cancel') break;
                    }
                    await turn.result;
                    if (mode === 'fail') throw new Error('Expected remote failure');
                } catch (error) {
                    if (mode === 'complete' || !['aborted', 'remote'].includes(error.code))
                        throw error;
                } finally {
                    stop();
                }
                completed++;
            }
        },
        async reconnect(count) {
            for (let i = 0; i < count; i++) {
                const ready = new Promise((resolve) => {
                    const stop = client.onReconnect(() => {
                        stop();
                        resolve();
                    });
                });
                try {
                    await client.call(Method.AgentAsk, { message: 'disconnect' });
                } catch (error) {
                    if (error.code !== 'closed') throw error;
                }
                await ready;
                const result = await client.call(Method.AgentAsk, { message: 'reconnected' });
                if (result.text !== 'finished') throw new Error('Reconnect failed');
            }
        },
        async disposeClients(count) {
            for (let i = 0; i < count; i++) {
                const temporary = await NexaClient.connect({ url, reconnect: false });
                clients.push(new WeakRef(temporary));
                const pending = temporary.call(Method.AgentAsk, { message: 'timeout' });
                temporary.close();
                try {
                    await pending;
                    throw new Error('Expected close rejection');
                } catch (error) {
                    if (error.code !== 'closed') throw error;
                }
            }
        },
        retained() {
            const alive = (refs) =>
                refs.reduce((total, ref) => total + (ref.deref() === undefined ? 0 : 1), 0);
            return {
                completed,
                turns: alive(turns),
                callbacks: alive(callbacks),
                clients: alive(clients),
            };
        },
        close() {
            client.close();
        },
    };
}
