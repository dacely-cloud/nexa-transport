import type { NexaClient } from './NexaClient.js';
import {
    Method,
    type DataUpload,
    type DataUploadPosition,
    type DataFile,
    type GatewayLimits,
} from '../protocol/Protocol.js';
import type { DataUploadOptions } from '../interface/DataUploadOptions.js';
import { BinaryUploadSizing } from '../media/BinaryUploadSizing.js';

/** Browser/Node bulk upload with negotiated slices and acknowledged backpressure. */
export class DataUploadClient {
    /** Uploads a Blob or File without reading the whole source into memory. */
    public static async upload(
        client: NexaClient,
        source: Blob,
        filename: string,
        options: DataUploadOptions = {},
    ): Promise<DataFile> {
        options.signal?.throwIfAborted();
        const upload: DataUpload = await client.call(
            Method.DataUploadStart,
            {
                filename,
                byteLength: String(source.size),
            },
            options.signal === undefined ? {} : { signal: options.signal },
        );
        try {
            const limits: GatewayLimits | undefined = client.hello.policy.limits;
            const budget: number | undefined =
                limits === undefined
                    ? undefined
                    : Math.min(
                          limits.maxRequestBytes,
                          limits.maxRequestBytesPerPrincipal ?? limits.maxRequestBytes,
                      );
            const chunkBytes: number = Math.min(
                DataUploadClient.#chunkBytes(upload.chunkBytes),
                Math.floor(client.hello.policy.maxPayloadBytes) - 1024,
                BinaryUploadSizing.chunkBytes(upload.id, budget),
            );
            if (chunkBytes < 1) {
                throw new Error('Gateway upload budget is too small');
            }
            let offset: number = 0;
            options.onProgress?.(0n, BigInt(source.size));
            while (offset < source.size) {
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
                options.onProgress?.(BigInt(offset), BigInt(source.size));
            }
            return await client.call(
                Method.DataUploadFinish,
                { id: upload.id },
                options.signal === undefined ? {} : { signal: options.signal },
            );
        } catch (error: unknown) {
            try {
                await client.call(Method.DataUploadCancel, { id: upload.id }, { timeoutMs: 5000 });
            } catch {
                /** A disconnected server expires incomplete uploads; preserve the original error. */
            }
            throw error;
        }
    }

    /** Older gateways retain their 192 KB limit; untrusted advertisements remain bounded. */
    static #chunkBytes(value: string | undefined): number {
        if (value === undefined) {
            return 192 * 1024;
        }
        if (!/^[1-9][0-9]{0,6}$/u.test(value)) {
            throw new Error('Gateway advertised an invalid upload chunk size');
        }
        const bytes: number = Number(value);
        if (bytes > 4 * 1024 * 1024) {
            throw new Error('Gateway advertised an invalid upload chunk size');
        }
        return bytes;
    }
}
