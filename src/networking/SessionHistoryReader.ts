import {
    Method,
    type SessionHistoryPage,
    type SessionHistoryRecord,
} from '../protocol/Protocol.js';
import { historyRecord } from '../protocol/Validators.js';
import type { ReceivedAttachment } from '../media/BinaryMedia.js';
import type { NexaClient } from './NexaClient.js';

/** Restores bounded journal pages and exact binary files through authenticated RPCs. */
export class SessionHistoryReader {
    /** Decodes across UTF-8 and JSON boundaries and validates every original record. */
    public static async read(
        client: NexaClient,
        id: string,
    ): Promise<readonly SessionHistoryRecord[]> {
        const records: SessionHistoryRecord[] = [];
        const decoder: TextDecoder = new TextDecoder('utf-8', { fatal: true });
        const seen: Set<string> = new Set();
        let pending: string = '';
        let cursor: string = '0';
        let endCursor: string | undefined;
        for (;;) {
            const page: SessionHistoryPage = await client.call(Method.SessionsHistory, {
                id,
                cursor,
                ...(endCursor === undefined ? {} : { endCursor }),
            });
            if (
                page.format !== 1 ||
                !/^\d+$/.test(page.endCursor) ||
                (endCursor !== undefined && page.endCursor !== endCursor)
            ) {
                throw new Error('Invalid history snapshot boundary');
            }
            endCursor = page.endCursor;
            const raw: string = atob(page.chunk);
            const bytes: Uint8Array<ArrayBuffer> = Uint8Array.from(raw, (char): number =>
                char.charCodeAt(0),
            );
            const next: bigint = BigInt(cursor) + BigInt(bytes.byteLength);
            if (
                next > BigInt(endCursor) ||
                (page.nextCursor !== undefined &&
                    (page.nextCursor !== next.toString() || next <= BigInt(cursor))) ||
                (page.nextCursor === undefined && next !== BigInt(endCursor))
            ) {
                throw new Error('Invalid history page cursor');
            }
            pending += decoder.decode(bytes, { stream: page.nextCursor !== undefined });
            let newline: number;
            while ((newline = pending.indexOf('\n')) !== -1) {
                const line: string = pending.slice(0, newline);
                pending = pending.slice(newline + 1);
                const record: unknown = JSON.parse(line);
                if (
                    !historyRecord(record) ||
                    seen.has(record.id) ||
                    !Number.isSafeInteger(record.at)
                ) {
                    throw new Error('Invalid or duplicate history record');
                }
                seen.add(record.id);
                records.push(record);
            }
            if (page.nextCursor === undefined) {
                break;
            }
            cursor = page.nextCursor;
        }
        if (pending.length !== 0) {
            throw new Error('Incomplete saved history record');
        }
        return records;
    }

    /** Subscribes before requesting bytes, matching both session and attachment identity. */
    public static async download(
        client: NexaClient,
        id: string,
        attachmentId: string,
    ): Promise<ReceivedAttachment> {
        const delivery: PromiseWithResolvers<ReceivedAttachment> =
            Promise.withResolvers<ReceivedAttachment>();
        const stop: () => void = client.onAttachment((file): void => {
            if (file.sessionId === id && file.id === attachmentId && file.streamId === undefined) {
                delivery.resolve(file);
            }
        });
        const stopClose: () => void = client.onClose((error): void => delivery.reject(error));
        const timeout: ReturnType<typeof setTimeout> = setTimeout((): void => {
            delivery.reject(new Error('Saved file delivery timed out'));
        }, 120_000);
        try {
            const [, file] = await Promise.all([
                client.call(Method.SessionsDownload, { id, attachmentId }, { timeoutMs: 120_000 }),
                delivery.promise,
            ]);
            return file;
        } finally {
            clearTimeout(timeout);
            stop();
            stopClose();
        }
    }
}
