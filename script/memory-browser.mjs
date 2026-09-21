import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocket } from 'ws';
import { createPeer } from './memory-peer.mjs';

class CDP {
    next = 0;
    pending = new Map();
    constructor(socket) {
        this.socket = socket;
        socket.on('message', (bytes) => {
            const message = JSON.parse(bytes.toString());
            if (!message.id) return;
            const waiter = this.pending.get(message.id);
            if (!waiter) return;
            this.pending.delete(message.id);
            if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
            else waiter.resolve(message.result);
        });
        socket.on('close', () => {
            for (const waiter of this.pending.values())
                waiter.reject(new Error('Chrome disconnected'));
            this.pending.clear();
        });
    }
    static async connect(url) {
        const socket = new WebSocket(url);
        await new Promise((resolve, reject) => {
            socket.once('open', resolve);
            socket.once('error', reject);
        });
        return new CDP(socket);
    }
    async send(method, params = {}, sessionId) {
        const id = ++this.next;
        const pending = Promise.withResolvers();
        this.pending.set(id, pending);
        this.socket.send(
            JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }),
        );
        const timeout = setTimeout(() => {
            this.pending.delete(id);
            pending.reject(new Error(`CDP timeout: ${method}`));
        }, 60000);
        try {
            return await pending.promise;
        } finally {
            clearTimeout(timeout);
        }
    }
    async evaluate(session, expression) {
        const result = await this.send(
            'Runtime.evaluate',
            { expression, awaitPromise: true, returnByValue: true },
            session,
        );
        if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
        return result.result.value;
    }
}
const directory = await mkdtemp(join(tmpdir(), 'nexa-memory-chrome-'));
const peer = await createPeer();
const chrome = spawn(
    process.env.CHROME_BIN ?? 'google-chrome',
    [
        '--headless=new',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
        '--remote-debugging-port=0',
        `--user-data-dir=${directory}`,
        'about:blank',
    ],
    { stdio: 'ignore' },
);
let launchError;
chrome.on('error', (error) => {
    launchError = error;
});
let cdp;
try {
    let endpoint;
    for (let i = 0; i < 100; i++) {
        if (launchError) throw launchError;
        try {
            const [port, path] = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8'))
                .trim()
                .split('\n');
            endpoint = `ws://127.0.0.1:${port}${path}`;
            break;
        } catch {
            await delay(100);
        }
    }
    assert.ok(endpoint, 'Chrome did not start; set CHROME_BIN to its executable');
    cdp = await CDP.connect(endpoint);
    const sessions = [];
    for (let i = 0; i < 2; i++) {
        const { targetId } = await cdp.send('Target.createTarget', { url: peer.httpUrl });
        const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
        sessions.push(sessionId);
        await cdp.send('Runtime.enable', {}, sessionId);
        for (let attempt = 0; attempt < 100; attempt++) {
            if (
                await cdp.evaluate(
                    sessionId,
                    `location.origin === ${JSON.stringify(peer.httpUrl)} && document.readyState === 'complete'`,
                )
            )
                break;
            await delay(20);
        }
        await cdp.evaluate(
            sessionId,
            `import(${JSON.stringify(peer.httpUrl + '/script/memory-scenario.mjs')}).then(async m => { globalThis.scenario = await m.createScenario(${JSON.stringify(peer.url)}); })`,
        );
    }
    const measure = async (session) => {
        await cdp.send('HeapProfiler.collectGarbage', {}, session);
        return (await cdp.send('Runtime.getHeapUsage', {}, session)).usedSize;
    };
    await Promise.all(sessions.map((session) => cdp.evaluate(session, 'scenario.batch(60)')));
    const baseline = await Promise.all(sessions.map(measure));
    const samples = [];
    for (let batch = 0; batch < 5; batch++) {
        await Promise.all(sessions.map((session) => cdp.evaluate(session, 'scenario.batch(120)')));
        samples.push(await Promise.all(sessions.map(measure)));
    }
    await Promise.all(
        sessions.map((session) =>
            cdp.evaluate(session, 'scenario.reconnect(3).then(() => scenario.disposeClients(20))'),
        ),
    );
    await delay(100);
    const final = await Promise.all(sessions.map(measure));
    const retained = await Promise.all(
        sessions.map((session) => cdp.evaluate(session, 'scenario.retained()')),
    );
    for (let i = 0; i < sessions.length; i++) {
        assert.deepEqual(retained[i], { completed: 660, turns: 0, callbacks: 0, clients: 0 });
        assert.ok(
            final[i] - baseline[i] < 4 * 1024 * 1024,
            `Tab ${i + 1} heap grew more than 4 MiB after GC`,
        );
    }
    console.log(
        JSON.stringify(
            { baselineBytes: baseline, batchHeapBytes: samples, finalBytes: final, retained },
            null,
            2,
        ),
    );
    await Promise.all(sessions.map((session) => cdp.evaluate(session, 'scenario.close()')));
} finally {
    cdp?.socket.close();
    const exited = new Promise((resolve) => chrome.once('exit', resolve));
    if (chrome.exitCode === null && !launchError) {
        chrome.kill('SIGKILL');
        await exited;
    }
    await peer.close();
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
