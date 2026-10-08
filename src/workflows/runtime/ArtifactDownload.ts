export type { WorkflowRunArtifact } from './RunArtifactTypes.js';
import { Method } from '../../protocol/Protocol.js';
import type { NexaClient } from '../../networking/NexaClient.js';
import { WorkflowRunArtifactCodec } from './RunArtifactCodec.js';
import type {
    WorkflowRunArtifact,
    WorkflowRunArtifactRequest,
    WorkflowRunArtifactPage,
} from './RunArtifactTypes.js';

/** A complete artifact selection, without a user-supplied byte offset. */
export interface WorkflowArtifactSelection extends Omit<WorkflowRunArtifactRequest, 'offset'> {}
/** Read-only typed transport boundary used by downloads and embedded clients. */
export interface WorkflowArtifactReader {
    readonly read: (
        request: WorkflowRunArtifactRequest,
        signal: AbortSignal,
    ) => Promise<WorkflowRunArtifactPage>;
}
/** Verified bytes and their original immutable metadata. Object URLs remain owned by the application. */
export interface WorkflowArtifactDownload {
    readonly artifact: WorkflowRunArtifact;
    readonly bytes: Uint8Array<ArrayBuffer>;
}
/** Bounded, cancellable downloads validate every fragment and the complete content digest. */
export class WorkflowArtifactDownloads {
    /** Uses a typed reader; response data is still validated at the trust boundary. */
    public constructor(public readonly reader: WorkflowArtifactReader) {}
    /** Uses the existing authenticated connection without creating a second credential or HTTP path. */
    public static forClient(client: NexaClient): WorkflowArtifactDownloads {
        return new WorkflowArtifactDownloads({
            read: (
                request: WorkflowRunArtifactRequest,
                signal: AbortSignal,
            ): Promise<WorkflowRunArtifactPage> =>
                client.call(Method.WorkflowsRunsArtifact, request, { signal }),
        });
    }
    /** Rejects changing metadata, foreign fragments, truncation and corruption before returning bytes. */
    public async download(
        selection: WorkflowArtifactSelection,
        signal: AbortSignal,
    ): Promise<WorkflowArtifactDownload> {
        let offset: number = 0;
        let artifact: WorkflowRunArtifact | null = null;
        let bytes: Uint8Array<ArrayBuffer> | null = null;
        for (;;) {
            signal.throwIfAborted();
            const request: WorkflowRunArtifactRequest = WorkflowRunArtifactCodec.request({
                ...selection,
                offset,
            });
            const raw: unknown = await this.reader.read(request, signal);
            signal.throwIfAborted();
            const page: WorkflowRunArtifactPage = WorkflowRunArtifactCodec.page(raw);
            if (
                page.runId !== selection.runId ||
                page.artifactId !== selection.artifactId ||
                page.artifact.artifactId !== selection.artifactId ||
                page.offset !== offset
            ) {
                throw new Error('Artifact fragment belongs to another selection');
            }
            if (artifact === null) {
                artifact = page.artifact;
                bytes = new Uint8Array(Number(artifact.bytes));
            } else if (JSON.stringify(page.artifact) !== JSON.stringify(artifact)) {
                throw new Error('Artifact metadata changed during download');
            }
            if (bytes === null) {
                throw new Error('Artifact storage was not allocated');
            }
            const decoded: string = atob(page.base64);
            if (
                btoa(decoded) !== page.base64 ||
                decoded.length !==
                    Math.min(WorkflowRunArtifactCodec.chunkBytes, bytes.length - offset)
            ) {
                throw new Error('Artifact fragment has an invalid byte length or encoding');
            }
            for (let index: number = 0; index < decoded.length; index += 1) {
                bytes[offset + index] = decoded.charCodeAt(index);
            }
            offset += decoded.length;
            if (page.nextOffset !== (offset < bytes.length ? offset : null)) {
                throw new Error('Artifact fragment cursor is not contiguous');
            }
            if (page.nextOffset === null) {
                const digest: Uint8Array = new Uint8Array(
                    await crypto.subtle.digest('SHA-256', bytes),
                );
                signal.throwIfAborted();
                const actual: string = Array.from(digest, (value: number): string =>
                    value.toString(16).padStart(2, '0'),
                ).join('');
                if (actual !== artifact.sha256) {
                    throw new Error('Artifact failed SHA-256 integrity verification');
                }
                return { artifact, bytes };
            }
        }
    }
}
