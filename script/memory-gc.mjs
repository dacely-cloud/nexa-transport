import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { createScenario } from './memory-scenario.mjs';
import { Method } from '../dist/protocol.js';
import { NexaClient } from '../dist/nexa-transport.js';
import { createPeer } from './memory-peer.mjs';

assert.equal(typeof globalThis.gc, 'function', 'Run with node --expose-gc');
const peer = await createPeer();
after(() => peer.close());
async function collected(reference) {
    for (let i = 0; i < 30; i++) {
        await delay(10);
        globalThis.gc();
        if (reference.deref() === undefined) return true;
    }
    return false;
}

test('retained completed turns do not retain disposed clients', async () => {
    async function complete() {
        const client = await NexaClient.connect({ url: peer.url, reconnect: false });
        const turn = client.stream({ message: 'complete' });
        for await (const event of turn) assert.equal(event.type, 'text');
        await turn.result;
        client.close();
        return { turn, reference: new WeakRef(client) };
    }
    const retained = await complete();
    assert.equal(
        await collected(retained.reference),
        true,
        'completed TurnStream retained the client',
    );
    assert.equal((await retained.turn.result).text, 'finished');
});

test('retained unsubscribe functions release their callback after removal', async () => {
    const client = await NexaClient.connect({ url: peer.url, reconnect: false });
    function subscribe() {
        const listener = () => {};
        const stop = client.onEvent(listener);
        stop();
        return { stop, reference: new WeakRef(listener) };
    }
    try {
        const retained = subscribe();
        assert.equal(
            await collected(retained.reference),
            true,
            'unsubscribe closure retained callback',
        );
        retained.stop();
    } finally {
        client.close();
    }
});

test('retained closed sockets do not retain their clients', async () => {
    const NativeSocket = globalThis.WebSocket;
    const sockets = [];
    globalThis.WebSocket = class extends NativeSocket {
        constructor(url) {
            super(url);
            sockets.push(this);
        }
    };
    async function dispose() {
        const client = await NexaClient.connect({ url: peer.url, reconnect: false });
        client.close();
        return new WeakRef(client);
    }
    try {
        const reference = await dispose();
        assert.equal(await collected(reference), true, 'closed socket listeners retained client');
        assert.equal(sockets.length, 1);
    } finally {
        globalThis.WebSocket = NativeSocket;
    }
});

test('cleanup handles do not retain callbacks after the client is closed', async () => {
    async function subscribeAndClose() {
        const client = await NexaClient.connect({ url: peer.url, reconnect: false });
        const listener = () => {};
        const stop = client.onEvent(listener);
        client.close();
        return { stop, reference: new WeakRef(listener) };
    }
    const retained = await subscribeAndClose();
    assert.equal(
        await collected(retained.reference),
        true,
        'unused cleanup handle retained a disposed callback',
    );
    retained.stop();
});

test('a stalled attachment handler does not retain a disposed client or unused file data', async () => {
    const gate = Promise.withResolvers();
    async function dispose() {
        const client = await NexaClient.connect({ url: peer.url, reconnect: false });
        let data;
        client.onAttachment((file) => {
            data = new WeakRef(file.data);
            return gate.promise;
        });
        await client.call(Method.AgentAsk, { message: 'attachment' });
        client.close();
        return { client: new WeakRef(client), data };
    }
    try {
        const refs = await dispose();
        assert.equal(
            await collected(refs.client),
            true,
            'stalled handler retained disposed client',
        );
        assert.equal(
            await collected(refs.data),
            true,
            'SDK retained file data after invoking handler',
        );
    } finally {
        gate.resolve();
    }
});

test('an outstanding RPC does not retain its original upload parameters', async () => {
    const client = await NexaClient.connect({ url: peer.url, reconnect: false });
    function request() {
        const params = {
            message: 'timeout',
            attachments: [
                {
                    type: 'image',
                    source: {
                        kind: 'base64',
                        mediaType: 'image/png',
                        data: 'AQID'.repeat(256 * 1024),
                    },
                },
            ],
        };
        return {
            reference: new WeakRef(params),
            pending: client.call(Method.AgentAsk, params).catch(() => {}),
        };
    }
    const retained = request();
    try {
        assert.equal(
            await collected(retained.reference),
            true,
            'RPC retained its original upload parameters while waiting for a response',
        );
    } finally {
        client.close();
        await retained.pending;
    }
});

for (const mode of ['cancel', 'fail']) {
    test(`retained ${mode} turns release their clients`, async () => {
        async function complete() {
            const client = await NexaClient.connect({ url: peer.url, reconnect: false });
            const turn = client.stream({ message: mode });
            try {
                for await (const event of turn) {
                    assert.equal(event.type, 'text');
                    if (mode === 'cancel') break;
                }
                await turn.result;
                assert.fail('Expected a failed turn');
            } catch (error) {
                assert.ok(['aborted', 'remote'].includes(error.code));
            }
            client.close();
            return { turn, reference: new WeakRef(client) };
        }
        const retained = await complete();
        assert.equal(await collected(retained.reference), true);
        await assert.rejects(retained.turn.result);
    });
}

test('all subscription cleanup handles release their callbacks on disposal', async () => {
    async function subscribe() {
        const client = await NexaClient.connect({ url: peer.url, reconnect: false });
        const registrations = [
            (listener) => client.onEvent(listener),
            (listener) => client.onAttachment(listener),
            (listener) => client.onAudio(listener),
            (listener) => client.onSequenceGap(listener),
            (listener) => client.onClose(listener),
            (listener) => client.onReconnect(listener),
            (listener) => client.on('turn.event', listener),
        ];
        const retained = registrations.map((register) => {
            const callback = () => {};
            return { stop: register(callback), reference: new WeakRef(callback) };
        });
        client.close();
        return retained;
    }
    for (const entry of await subscribe()) {
        assert.equal(await collected(entry.reference), true);
        entry.stop();
    }
});

test('the initial connection signal can be collected while its client is still connected', async () => {
    async function connect() {
        const controller = new AbortController();
        return {
            client: await NexaClient.connect({ url: peer.url, signal: controller.signal }),
            signal: new WeakRef(controller.signal),
        };
    }
    const retained = await connect();
    try {
        assert.equal(await collected(retained.signal), true);
    } finally {
        retained.client.close();
    }
});

test('two simultaneous connections plateau after repeated turns, reconnects and disposal', async () => {
    const scenarios = await Promise.all([createScenario(peer.url), createScenario(peer.url)]);
    async function measure() {
        await delay(20);
        globalThis.gc();
        const { heapUsed, arrayBuffers } = process.memoryUsage();
        return { heapUsed, arrayBuffers };
    }
    try {
        await Promise.all(scenarios.map((scenario) => scenario.batch(30)));
        const baseline = await measure();
        const samples = [];
        for (let batch = 0; batch < 4; batch++) {
            await Promise.all(scenarios.map((scenario) => scenario.batch(90)));
            samples.push(await measure());
        }
        await Promise.all(
            scenarios.map((scenario) =>
                scenario.reconnect(2).then(() => scenario.disposeClients(10)),
            ),
        );
        const final = await measure();
        for (const scenario of scenarios) {
            assert.deepEqual(scenario.retained(), {
                completed: 390,
                turns: 0,
                callbacks: 0,
                clients: 0,
            });
        }
        assert.ok(
            final.heapUsed - baseline.heapUsed < 8 * 1024 * 1024,
            'Heap did not plateau after GC',
        );
        assert.ok(
            final.arrayBuffers - baseline.arrayBuffers < 2 * 1024 * 1024,
            'Binary buffers did not return to baseline',
        );
        console.log(JSON.stringify({ baseline, samples, final }));
    } finally {
        for (const scenario of scenarios) scenario.close();
    }
});

test('saved parameter-validation errors do not retain closed clients', async () => {
    async function reject() {
        const client = await NexaClient.connect({ url: peer.url, reconnect: false });
        let failure;
        try {
            await client.call(Method.AgentAsk, { message: 123 });
        } catch (error) {
            failure = error;
        }
        client.close();
        return { failure, reference: new WeakRef(client) };
    }
    const retained = await reject();
    assert.equal(
        await collected(retained.reference),
        true,
        'lazy validation error stack retained client',
    );
    assert.equal(retained.failure.name, 'TypeError');
});
