/** Server-only release verification: install the tarball in an isolated consumer. */
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve('.');
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
if (typeof manifest?.version !== 'string' || !/^[0-9A-Za-z.+-]+$/.test(manifest.version)) {
    throw new Error('Invalid package version for archive verification');
}
const archive = resolve(process.argv[2] ?? join(root, `nexa-transport-${manifest.version}.tgz`));
const directory = await mkdtemp(join(tmpdir(), 'nexa-transport-consumer-'));
try {
    await writeFile(
        join(directory, 'package.json'),
        JSON.stringify({ private: true, type: 'module' }),
    );
    /** Consumers declare the pinned nexa-protocol themselves; npm refuses URL dependencies reached transitively. */
    const protocol = manifest.dependencies?.['nexa-protocol'];
    if (typeof protocol !== 'string') throw new Error('Missing pinned nexa-protocol dependency');
    execFileSync(
        'npm',
        [
            'install',
            '--ignore-scripts',
            '--no-audit',
            '--no-fund',
            '--allow-remote=root',
            archive,
            `nexa-protocol@${protocol}`,
        ],
        { cwd: directory, stdio: 'pipe' },
    );
    await writeFile(
        join(directory, 'consumer.ts'),
        `import { NexaClient } from 'nexa-transport';
import { Method } from 'nexa-transport/protocol';
import type { AskResult } from 'nexa-transport/protocol';
import type { ClientOptions } from 'nexa-transport/options';
import type { TurnStream } from 'nexa-transport/stream';
import { NexaMedia } from 'nexa-transport/media';
import { EventName } from 'nexa-transport/events';
import { TransportError } from 'nexa-transport/errors';
import { RedTeamClient } from 'nexa-transport/redteam-client';
import { Graphics, type Graphic } from 'nexa-protocol/graphics/Graphic.js';
import { GatewayVersion } from 'nexa-protocol/gateway/GatewayVersion.js';
import { BinaryChunks } from 'nexa-protocol/media/BinaryChunks.js';
import { RedTeamRequestCodec } from 'nexa-protocol/redteam/RedTeamRequestCodec.js';
import type { DesignCommentTextPage } from 'nexa-protocol/design/DesignCommentReadTypes.js';
import type { WorkflowGroup } from 'nexa-protocol/workflows/WorkflowGroupTypes.js';
import type { WorkflowRunSnapshot } from 'nexa-protocol/workflows/runtime/RunSnapshotTypes.js';
function readFeedback(client: NexaClient): Promise<DesignCommentTextPage> {
    return client.call(Method.DesignCommentText, { id: 'layout', revision: '9007199254740993', pageId: null, commentId: 'note', offset: 0, limit: 2000 });
}
void readFeedback;
const group: WorkflowGroup | undefined = undefined;
void group;
function imageModel(snapshot: WorkflowRunSnapshot): string | undefined {
    return snapshot.imageModels?.[0]?.model;
}
void imageModel;
const graphic: Graphic | null = Graphics.isValid(null) ? null : null;
void graphic;
void GatewayVersion.Current;
void BinaryChunks;
void RedTeamRequestCodec.start;
void RedTeamClient;
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
            `import { NexaClient } from 'nexa-transport'; import { NexaMedia } from 'nexa-transport/media'; import { EventName } from 'nexa-transport/events'; import { RedTeamClient } from 'nexa-transport/redteam-client'; import { Graphics } from 'nexa-protocol/graphics/Graphic.js'; import { GatewayVersion } from 'nexa-protocol/gateway/GatewayVersion.js'; if (typeof NexaClient.connect !== 'function' || typeof RedTeamClient !== 'function' || typeof Graphics.isValid !== 'function' || GatewayVersion.Current < GatewayVersion.Minimum || NexaMedia.base64(new Uint8Array([1,2,3])) !== 'AQID' || EventName.TurnEvent !== 'turn.event') throw new Error('Package exports failed');`,
        ],
        { cwd: directory, stdio: 'pipe' },
    );
    console.log('Packed package passes Node runtime and strict NodeNext consumer type checks.');
} finally {
    await rm(directory, { recursive: true, force: true });
}
