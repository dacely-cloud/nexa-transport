// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { expect, it } from 'vitest';
import type { InboundAttachment } from 'nexa-protocol/gateway/AttachmentTypes.js';
import type { SessionHistoryRecord } from 'nexa-protocol/gateway/HistoryTypes.js';
import { NexaMedia } from '../src/media/NexaMedia.js';
import { HistoryRecordDecoder } from '../src/networking/HistoryRecordDecoder.js';

/** One journal line holding a minimal event record. */
function line(id: string): string {
    const record: SessionHistoryRecord = {
        id,
        at: 1,
        kind: 'event',
        data: { streamId: 'stream', event: { type: 'text', text: id } },
    };
    return JSON.stringify(record) + '\n';
}

it('keeps records after an early break for the next write', (): void => {
    const decoder: HistoryRecordDecoder = new HistoryRecordDecoder();
    const first: string[] = [];
    for (const record of decoder.write(line('a') + line('b'))) {
        first.push(record.id);
        break;
    }
    expect(first).toEqual(['a']);
    expect([...decoder.write(line('c'))].map((record): string => record.id)).toEqual(['b', 'c']);
    decoder.finish();
});

it('refuses to finish with records that were never read', (): void => {
    const decoder: HistoryRecordDecoder = new HistoryRecordDecoder();
    for (const record of decoder.write(line('a') + line('b'))) {
        expect(record.id).toBe('a');
        break;
    }
    expect((): void => decoder.finish()).toThrow('Incomplete saved history record');
});

it.each(['notes.constructor', 'a.__proto__', 'x.toString'])(
    'types %s as generic binary rather than an inherited object member',
    async (name: string): Promise<void> => {
        const attachment: InboundAttachment = await NexaMedia.document(
            new Blob([new Uint8Array([1, 2, 3])]),
            name,
        );
        const source: unknown = attachment.type === 'document' ? attachment.source : null;
        expect(source).toMatchObject({ kind: 'base64', mediaType: 'application/octet-stream' });
    },
);
