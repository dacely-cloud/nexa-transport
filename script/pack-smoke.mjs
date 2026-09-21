/** Server-only release verification: install the tarball in an isolated consumer. */
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve('.');
const directory = await mkdtemp(join(tmpdir(), 'nexa-transport-consumer-'));
try {
    await writeFile(
        join(directory, 'package.json'),
        JSON.stringify({ private: true, type: 'module' }),
    );
    execFileSync(
        'npm',
        [
            'install',
            '--ignore-scripts',
            '--no-audit',
            '--no-fund',
            join(root, 'nexa-transport-0.1.0.tgz'),
        ],
        { cwd: directory, stdio: 'pipe' },
    );
    await writeFile(
        join(directory, 'consumer.ts'),
        `import { NexaClient } from 'nexa-transport';
import { NexaMedia } from 'nexa-transport/media';
import { EventName } from 'nexa-transport/events';
import { TransportError } from 'nexa-transport/errors';
import type { AskResult } from 'nexa-transport/protocol';
import type { ClientOptions } from 'nexa-transport/options';
import type { TurnStream } from 'nexa-transport/stream';
const options: ClientOptions = { url: 'ws://localhost:18830' };
async function consume(): Promise<AskResult> {
    const client: NexaClient = await NexaClient.connect(options);
    const turn: TurnStream = client.stream({ message: 'Read', attachments: [await NexaMedia.image(new Blob(['x'], { type: 'image/png' }))] });
    client.on(EventName.ApprovalRequested, approval => { console.log(approval.approvalId); });
    for await (const event of turn) { if (event.type === 'tool-finish') console.log(event.outcome.result.content); }
    client.close();
    return await turn.result;
}
void consume;
void TransportError;
`,
    );
    await writeFile(
        join(directory, 'tsconfig.json'),
        JSON.stringify({
            compilerOptions: {
                strict: true,
                noEmit: true,
                target: 'ES2024',
                module: 'NodeNext',
                moduleResolution: 'NodeNext',
                lib: ['ES2024', 'DOM'],
                types: [],
                exactOptionalPropertyTypes: true,
            },
            include: ['consumer.ts'],
        }),
    );
    execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', join(directory, 'tsconfig.json')], {
        cwd: directory,
        stdio: 'pipe',
    });
    execFileSync(
        'node',
        [
            '--input-type=module',
            '-e',
            `import { NexaClient } from 'nexa-transport'; import { NexaMedia } from 'nexa-transport/media'; import { EventName } from 'nexa-transport/events'; if (typeof NexaClient.connect !== 'function' || NexaMedia.base64(new Uint8Array([1,2,3])) !== 'AQID' || EventName.TurnEvent !== 'turn.event') throw new Error('Package exports failed');`,
        ],
        { cwd: directory, stdio: 'pipe' },
    );
    console.log('Packed package passes Node runtime and strict NodeNext consumer type checks.');
} finally {
    await rm(directory, { recursive: true, force: true });
}
