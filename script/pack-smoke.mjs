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
    execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', archive], {
        cwd: directory,
        stdio: 'pipe',
    });
    await writeFile(
        join(directory, 'consumer.ts'),
        `import { NexaClient } from 'nexa-transport';
import { DesignFlex } from 'nexa-transport/design-flex';
import { DesignTidyGeometry } from 'nexa-transport/design-tidy-geometry';
import { DesignTidyEdits } from 'nexa-transport/design-tidy-edits';
void DesignTidyGeometry.inspect;
void DesignTidyEdits;
import { DesignGridPacking } from 'nexa-transport/design-grid-packing';
import * as DesignTextDirection from 'nexa-transport/design-text-direction';
void DesignFlex.lines;
void DesignGridPacking.arrange;
void DesignTextDirection;
import { WorkflowGroupCodec } from 'nexa-transport/workflow-group-codec';
import type { WorkflowGroup } from 'nexa-transport/workflow-group-types';
const savedGroup: WorkflowGroup = WorkflowGroupCodec.parse({id: 'group', title: 'Research', objective: '', parent: null, x: 0, y: 0, nodes: [], ports: []});
void savedGroup;
import { WorkflowImagePolicies } from 'nexa-transport/workflow-image-policy';
import { WorkflowImageResolutionCodec } from 'nexa-transport/workflow-image-resolution';
void WorkflowImagePolicies.defaults;
void WorkflowImageResolutionCodec.result;
import { NexaMedia } from 'nexa-transport/media';
import { WorkflowArtifactDownloads, type WorkflowArtifactDownload } from 'nexa-transport/workflow-artifacts';
import { EventName } from 'nexa-transport/events';
import { TransportError } from 'nexa-transport/errors';
import type { AskResult } from 'nexa-transport/protocol';
import type { ClientOptions } from 'nexa-transport/options';
import type { TurnStream } from 'nexa-transport/stream';
import { ComponentRegistry } from 'nexa-transport/workflow-catalog';
import { WorkflowRunCodec } from 'nexa-transport/workflow-run-codec';
import type { WorkflowRunSnapshot } from 'nexa-transport/workflow-run-types';
import { WorkflowImageQuoteCodec, type WorkflowImageQuoteRequest } from 'nexa-transport/workflow-image-quote';
const quoteRequest: WorkflowImageQuoteRequest = WorkflowImageQuoteCodec.request({ workflowId: 'draft', nodeId: 'image', provider: 'images', model: 'model', settings: { size: '1024x1024', quality: 'high', count: 1, outputFormat: 'png', options: {} } });
void quoteRequest;
function imageSnapshot(snapshot: WorkflowRunSnapshot): string | undefined {
    const parsed: WorkflowRunSnapshot = WorkflowRunCodec.snapshot(snapshot);
    return parsed.imageModels?.[0]?.model;
}
void imageSnapshot;
if (ComponentRegistry.builtin().get('inference.image', '1') === null) throw new Error('Missing image component');
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
async function downloadArtifact(client: NexaClient): Promise<WorkflowArtifactDownload> {
    return WorkflowArtifactDownloads.forClient(client).download({ runId: 'run', artifactId: 'artifact' }, new AbortController().signal);
}
void downloadArtifact;
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
            `import { NexaClient } from 'nexa-transport'; import { NexaMedia } from 'nexa-transport/media'; import { EventName } from 'nexa-transport/events'; import { WorkflowArtifactDownloads } from 'nexa-transport/workflow-artifacts'; import { DesignFlex } from 'nexa-transport/design-flex'; import { DesignGridPacking } from 'nexa-transport/design-grid-packing'; import * as DesignTextDirection from 'nexa-transport/design-text-direction'; if (typeof NexaClient.connect !== 'function' || typeof WorkflowArtifactDownloads.forClient !== 'function' || typeof DesignFlex.lines !== 'function' || typeof DesignGridPacking.arrange !== 'function' || Object.keys(DesignTextDirection).length === 0 || NexaMedia.base64(new Uint8Array([1,2,3])) !== 'AQID' || EventName.TurnEvent !== 'turn.event') throw new Error('Package exports failed');`,
        ],
        { cwd: directory, stdio: 'pipe' },
    );
    console.log('Packed package passes Node runtime and strict NodeNext consumer type checks.');
} finally {
    await rm(directory, { recursive: true, force: true });
}
