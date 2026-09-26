import type { NexaClient } from './NexaClient.js';
import {
    Method,
    type DataUpload,
    type DataUploadPosition,
    type DataFile,
} from '../protocol/Protocol.js';
import type { DataUploadOptions } from '../interface/DataUploadOptions.js';

/** Browser/Node bulk upload with one bounded slice in flight and acknowledged backpressure. */
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
            let offset: number = 0;
            options.onProgress?.(0n, BigInt(source.size));
            while (offset < source.size) {
                options.signal?.throwIfAborted();
                const bytes: Uint8Array = new Uint8Array(
                    await source.slice(offset, offset + 192 * 1024).arrayBuffer(),
                );
                let binary: string = '';
                for (let index: number = 0; index < bytes.length; index += 8192) {
                    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
                }
                const position: DataUploadPosition = await client.call(
                    Method.DataUploadChunk,
                    {
                        id: upload.id,
                        offset: String(offset),
                        data: btoa(binary),
                    },
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
}
