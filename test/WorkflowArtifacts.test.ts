import { expect, it } from 'vitest';
import {
    WorkflowArtifactDownloads,
    type WorkflowArtifactReader,
    type WorkflowArtifactDownload,
    type WorkflowArtifactSelection,
} from '../src/workflows/runtime/ArtifactDownload.js';
import { WorkflowRunArtifactCodec } from '../src/workflows/runtime/RunArtifactCodec.js';
import type {
    WorkflowRunArtifact,
    WorkflowRunArtifactPage,
    WorkflowRunArtifactRequest,
} from '../src/workflows/runtime/RunArtifactTypes.js';

const selection: WorkflowArtifactSelection = { runId: 'run', artifactId: 'artifact' };
class ArtifactReader implements WorkflowArtifactReader {
    public readonly requests: WorkflowRunArtifactRequest[] = [];
    public transform: (page: WorkflowRunArtifactPage) => WorkflowRunArtifactPage = (
        page: WorkflowRunArtifactPage,
    ): WorkflowRunArtifactPage => page;
    public constructor(
        public readonly bytes: Uint8Array<ArrayBuffer>,
        public readonly artifact: WorkflowRunArtifact,
    ) {}
    public read(request: WorkflowRunArtifactRequest): Promise<WorkflowRunArtifactPage> {
        this.requests.push(request);
        const end: number = Math.min(
            this.bytes.length,
            request.offset + WorkflowRunArtifactCodec.chunkBytes,
        );
        const fragment: Uint8Array = this.bytes.subarray(request.offset, end);
        const encoded: string = Array.from(fragment, (value: number): string =>
            String.fromCharCode(value),
        ).join('');
        return Promise.resolve(
            this.transform({
                ...request,
                artifact: this.artifact,
                base64: btoa(encoded),
                nextOffset: end < this.bytes.length ? end : null,
            }),
        );
    }
    public static async create(): Promise<ArtifactReader> {
        const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(600_000);
        for (let index: number = 0; index < bytes.length; index += 1) {
            bytes[index] = index % 251;
        }
        const digest: Uint8Array = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
        return new ArtifactReader(bytes, {
            artifactId: selection.artifactId,
            name: 'image.png',
            contentType: 'image/png',
            bytes: String(bytes.length),
            sha256: Array.from(digest, (value: number): string =>
                value.toString(16).padStart(2, '0'),
            ).join(''),
            expiresAtMs: '1791475000000',
        });
    }
}

it('assembles bounded chunks in order and verifies the exact bytes with Web Crypto', async (): Promise<void> => {
    const reader: ArtifactReader = await ArtifactReader.create();
    const result: WorkflowArtifactDownload = await new WorkflowArtifactDownloads(reader).download(
        selection,
        new AbortController().signal,
    );
    expect(result.bytes).toEqual(reader.bytes);
    expect(result.artifact).toEqual(reader.artifact);
    expect(
        reader.requests.map((request: WorkflowRunArtifactRequest): number => request.offset),
    ).toEqual([0, 262_144, 524_288]);
});

it.each(['identity', 'metadata', 'offset', 'cursor', 'truncated', 'oversized', 'corrupt'])(
    'rejects %s responses instead of returning a partial artifact',
    async (failure: string): Promise<void> => {
        const reader: ArtifactReader = await ArtifactReader.create();
        reader.transform = (page: WorkflowRunArtifactPage): WorkflowRunArtifactPage => {
            switch (failure) {
                case 'identity':
                    return { ...page, runId: 'another-run' };
                case 'metadata':
                    return page.offset === 0
                        ? page
                        : { ...page, artifact: { ...page.artifact, name: 'changed.png' } };
                case 'offset':
                    return { ...page, offset: page.offset + 1 };
                case 'cursor':
                    return { ...page, nextOffset: null };
                case 'truncated':
                    return { ...page, base64: '' };
                case 'oversized':
                    return { ...page, artifact: { ...page.artifact, bytes: '999999999' } };
                default:
                    return { ...page, artifact: { ...page.artifact, sha256: '0'.repeat(64) } };
            }
        };
        await expect(
            new WorkflowArtifactDownloads(reader).download(selection, new AbortController().signal),
        ).rejects.toThrow();
        expect(reader.requests.length).toBeLessThanOrEqual(3);
    },
);

it('stops before dispatch and between responses when aborted', async (): Promise<void> => {
    const reader: ArtifactReader = await ArtifactReader.create();
    await expect(
        new WorkflowArtifactDownloads(reader).download(selection, AbortSignal.abort()),
    ).rejects.toThrow();
    expect(reader.requests).toHaveLength(0);
    const controller: AbortController = new AbortController();
    reader.transform = (page: WorkflowRunArtifactPage): WorkflowRunArtifactPage => {
        controller.abort();
        return page;
    };
    await expect(
        new WorkflowArtifactDownloads(reader).download(selection, controller.signal),
    ).rejects.toThrow();
    expect(reader.requests).toHaveLength(1);
});
