import type { NexaClient } from './NexaClient.js';
import {
    Method,
    type ConversationDataUpload,
    type DataUploadPosition,
    type ConversationDataFile,
    type GatewayLimits,
    type DataUploadContext,
} from '../protocol/Protocol.js';
import type { DataUploadOptions } from '../interface/DataUploadOptions.js';
import { BinaryUploadSizing } from '../media/BinaryUploadSizing.js';
import {
    DataUploadFailure,
    DataUploadFailureState,
    type DataUploadOriginal,
} from './DataUploadFailure.js';

/** Browser/Node bulk upload owns bounded slices, exact acknowledgments and one immutable conversation target. */
export class DataUploadClient {
    /** New byte admission never infers a target or uses a replacement identity after an uncertain response. */
    public static async upload(
        client: NexaClient,
        source: Blob,
        filename: string,
        options: DataUploadOptions,
    ): Promise<ConversationDataFile> {
        options.signal?.throwIfAborted();
        const length: number = source.size;
        if (!Number.isSafeInteger(length) || length < 0) {
            throw new Error('Invalid exact upload byte length');
        }
        const context: DataUploadContext = Object.freeze({
            sessionId: options.context.sessionId,
            selectionRevision: options.context.selectionRevision,
            ownerSha256: options.context.ownerSha256,
        });
        const original: DataUploadOriginal = Object.freeze({
            context,
            requestId: options.requestId,
            filename,
            byteLength: String(length),
        });
        let upload: ConversationDataUpload | null = null;
        try {
            const candidate: ConversationDataUpload = await client.call(
                Method.DataUploadStart,
                original,
                options.signal === undefined ? {} : { signal: options.signal },
            );
            if (
                candidate.filename !== filename ||
                candidate.byteLength !== original.byteLength ||
                !this.#sameContext(candidate.context, context) ||
                BigInt(candidate.offset) > BigInt(length) ||
                ((candidate.state === 'publishing' ||
                    candidate.state === 'complete' ||
                    candidate.state === 'unconfirmed') &&
                    candidate.offset !== original.byteLength)
            ) {
                throw new Error('Gateway returned another upload original');
            }
            upload = candidate;
            options.onStarted?.(upload);
            if (upload.state === 'canceled') {
                throw new Error('The original upload is canceled');
            }
            if (upload.state === 'receiving') {
                const limits: GatewayLimits | undefined = client.hello.policy.limits;
                const budget: number | undefined =
                    limits === undefined
                        ? undefined
                        : Math.min(
                              limits.maxRequestBytes,
                              limits.maxRequestBytesPerPrincipal ?? limits.maxRequestBytes,
                          );
                const chunkBytes: number = Math.min(
                    this.#chunkBytes(upload.chunkBytes),
                    Math.floor(client.hello.policy.maxPayloadBytes) - 1024,
                    BinaryUploadSizing.chunkBytes(upload.id, budget),
                );
                if (chunkBytes < 1) {
                    throw new Error('Gateway upload budget is too small');
                }
                let offset: number = Number(BigInt(upload.offset));
                options.onProgress?.(BigInt(offset), BigInt(length));
                while (offset < length) {
                    options.signal?.throwIfAborted();
                    const bytes: Uint8Array = new Uint8Array(
                        await source.slice(offset, offset + chunkBytes).arrayBuffer(),
                    );
                    const position: DataUploadPosition = await client.uploadChunk(
                        upload.id,
                        String(offset),
                        bytes,
                        options.signal === undefined ? {} : { signal: options.signal },
                    );
                    offset += bytes.length;
                    if (position.id !== upload.id || position.offset !== String(offset)) {
                        throw new Error('Gateway acknowledged an unexpected upload position');
                    }
                    options.onProgress?.(BigInt(offset), BigInt(length));
                }
            }
            const result: ConversationDataFile = await client.call(
                Method.DataUploadFinish,
                { id: upload.id },
                {
                    timeoutMs: 21600000,
                    ...(options.signal === undefined ? {} : { signal: options.signal }),
                },
            );
            if (
                result.id !== upload.id ||
                result.filename !== filename ||
                result.byteLength !== original.byteLength ||
                result.offset !== original.byteLength ||
                result.state !== 'complete' ||
                !this.#sameContext(result.context, context)
            ) {
                throw new Error('Gateway returned another completed source');
            }
            return result;
        } catch (error: unknown) {
            if (upload !== null && upload.state !== 'complete') {
                try {
                    await client.call(
                        Method.DataUploadCancel,
                        { id: upload.id },
                        { timeoutMs: 5000 },
                    );
                } catch {
                    /** A failed cleanup request preserves its exact original; it never authorizes a fresh source. */
                }
            }
            throw new DataUploadFailure(
                original,
                upload?.id ?? null,
                upload?.state === 'canceled'
                    ? DataUploadFailureState.Canceled
                    : DataUploadFailureState.Unconfirmed,
                error,
            );
        }
    }
    /** Comparison fields are public freshness commitments; server authorization remains independent. */
    static #sameContext(left: DataUploadContext, right: DataUploadContext): boolean {
        return (
            left.sessionId === right.sessionId &&
            left.selectionRevision === right.selectionRevision &&
            left.ownerSha256 === right.ownerSha256
        );
    }
    /** Current gateways must advertise their bounded chunk contract explicitly. */
    static #chunkBytes(value: string | undefined): number {
        if (value === undefined || !/^[1-9][0-9]{0,6}$/u.test(value)) {
            throw new Error('Gateway advertised an invalid upload chunk size');
        }
        const bytes: number = Number(value);
        if (bytes > 4 * 1024 * 1024) {
            throw new Error('Gateway advertised an invalid upload chunk size');
        }
        return bytes;
    }
}
