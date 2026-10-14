// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    Method,
    type ResultOf,
    type SessionHistoryPage,
    type SessionHistoryParams,
    type SessionHistoryRecord,
} from '../protocol/Protocol.js';
import { HistoryPageWindow } from './HistoryPageWindow.js';
import { HistoryRecordDecoder } from './HistoryRecordDecoder.js';
import type { AttachmentProgress, ReceivedAttachment } from '../media/BinaryMedia.js';
import type { NexaClient, SavedHistorySnapshot } from './NexaClient.js';
import type { CallOptions } from '../interface/ClientOptions.js';

/** Restores bounded journal pages and exact binary files through authenticated RPCs. */
export class SessionHistoryReader {
    /** Reads complete records after a prior boundary, without downloading their prefix again. */
    public static async snapshot(
        client: NexaClient,
        id: string,
        cursor: string = '0',
        endCursor?: string,
        concurrency: number = 16,
        signal?: AbortSignal,
    ): Promise<SavedHistorySnapshot> {
        signal?.throwIfAborted();
        const records: SessionHistoryRecord[] = [];
        const decoder: TextDecoder = new TextDecoder('utf-8', { fatal: true });
        const journal: HistoryRecordDecoder = new HistoryRecordDecoder();
        const pages: HistoryPageWindow = new HistoryPageWindow(
            (params: SessionHistoryParams, options: CallOptions): Promise<SessionHistoryPage> =>
                client.call(Method.SessionsTranscript, params, options),
            id,
            concurrency,
            signal,
        );
        try {
            for (;;) {
                signal?.throwIfAborted();
                const page: SessionHistoryPage = await pages.read(cursor, endCursor);
                signal?.throwIfAborted();
                if (
                    page.format !== 1 ||
                    !/^\d+$/.test(page.endCursor) ||
                    (endCursor !== undefined && page.endCursor !== endCursor)
                ) {
                    throw new Error('Invalid history snapshot boundary');
                }
                endCursor = page.endCursor;
                const raw: string = atob(page.chunk);
                if (raw.length > HistoryPageWindow.pageBytes) {
                    throw new Error('History page exceeds requested byte limit');
                }
                const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(raw.length);
                for (let index: number = 0; index < raw.length; index += 1) {
                    bytes[index] = raw.charCodeAt(index);
                }
                const next: bigint = BigInt(cursor) + BigInt(bytes.byteLength);
                if (
                    next > BigInt(endCursor) ||
                    (page.nextCursor !== undefined &&
                        (page.nextCursor !== next.toString() || next <= BigInt(cursor))) ||
                    (page.nextCursor === undefined && next !== BigInt(endCursor))
                ) {
                    throw new Error('Invalid history page cursor');
                }
                if (page.nextCursor !== undefined) {
                    pages.prefetch(page.nextCursor, endCursor, BigInt(bytes.byteLength));
                }
                let record: SessionHistoryRecord;
                for (record of journal.write(
                    decoder.decode(bytes, { stream: page.nextCursor !== undefined }),
                )) {
                    records.push(record);
                }
                if (page.nextCursor === undefined) {
                    break;
                }
                cursor = page.nextCursor;
            }
            journal.finish();
            return { records, endCursor: endCursor ?? cursor };
        } finally {
            pages.close();
        }
    }

    /** Subscribes before requesting bytes, matching both session and attachment identity. */
    public static async download(
        client: NexaClient,
        id: string,
        attachmentId: string,
        signal?: AbortSignal,
        progress?: (receivedBytes: number, totalBytes: number) => void,
    ): Promise<ReceivedAttachment> {
        signal?.throwIfAborted();
        const controller: AbortController = new AbortController();
        const requestSignal: AbortSignal =
            signal === undefined ? controller.signal : AbortSignal.any([signal, controller.signal]);
        const delivery: PromiseWithResolvers<ReceivedAttachment> =
            Promise.withResolvers<ReceivedAttachment>();
        const stalledDelivery: PromiseWithResolvers<never> = Promise.withResolvers<never>();
        const stalled: () => void = (): void =>
            stalledDelivery.reject(new Error('Download stalled. Please try again.'));
        let idle: ReturnType<typeof setTimeout> = setTimeout(stalled, 60_000);
        const stopProgress: () => void = client.onAttachmentProgress(
            (update: AttachmentProgress): void => {
                if (
                    update.sessionId !== id ||
                    update.id !== attachmentId ||
                    update.streamId !== undefined
                ) {
                    return;
                }
                clearTimeout(idle);
                idle = setTimeout(stalled, 60_000);
                progress?.(update.receivedBytes, update.totalBytes);
            },
        );
        const stop: () => void = client.onAttachment((file: ReceivedAttachment): void => {
            if (file.sessionId === id && file.id === attachmentId && file.streamId === undefined) {
                progress?.(file.byteLength, file.byteLength);
                delivery.resolve(file);
            }
        });
        const stopClose: () => void = client.onClose((error: Error): void =>
            delivery.reject(error),
        );
        const abort: () => void = (): void => delivery.reject(signal?.reason);
        signal?.addEventListener('abort', abort, { once: true });
        const timeout: ReturnType<typeof setTimeout> = setTimeout((): void => {
            delivery.reject(new Error('Saved file delivery timed out'));
        }, 600_000);
        try {
            const [, file]: [ResultOf<typeof Method.SessionsDownload>, ReceivedAttachment] =
                await Promise.race([
                    Promise.all([
                        client.call(
                            Method.SessionsDownload,
                            { id, attachmentId },
                            { timeoutMs: 600_000, signal: requestSignal },
                        ),
                        delivery.promise,
                    ]),
                    stalledDelivery.promise,
                ]);
            return file;
        } finally {
            controller.abort();
            signal?.removeEventListener('abort', abort);
            clearTimeout(timeout);
            clearTimeout(idle);
            stopProgress();
            stop();
            stopClose();
        }
    }
}
