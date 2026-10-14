// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it, vi, type MockInstance } from 'vitest';
import { BinaryMedia, type ReceivedAttachment } from '../src/media/BinaryMedia.js';
import { BinaryByteBudget } from '../src/media/BinaryByteBudget.js';
import { BinaryInputReservation } from '../src/media/BinaryInputReservation.js';

/** Frames external metadata independently of the codec's trusted encoder. */
function frame(text: string): ArrayBuffer {
    const header: Uint8Array<ArrayBuffer> = new TextEncoder().encode(text);
    const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(8 + header.byteLength);
    const view: DataView = new DataView(bytes.buffer);
    view.setUint32(0, 0x4e584d44);
    view.setUint32(4, header.byteLength);
    bytes.set(header, 8);
    return bytes.buffer;
}

const attachment =
    '{"id":"file","filename":"file.bin","mimeType":"application/octet-stream","byteLength":0}' as const;

it('admits metadata before parsing and returns no credit when preflight refuses it', (): void => {
    const budget: BinaryByteBudget = new BinaryByteBudget(128);
    const credit: BinaryInputReservation = BinaryInputReservation.acquire(budget, 0);
    const buffer: ArrayBuffer = frame(`{"attachment":${attachment}}`);
    const parse: MockInstance<typeof JSON.parse> = vi.spyOn(JSON, 'parse');
    try {
        expect((): ReceivedAttachment => BinaryMedia.decode(buffer, 4096, credit)).toThrow(
            'budget',
        );
        expect(parse).not.toHaveBeenCalled();
        expect(budget.used).toBe(0);
    } finally {
        parse.mockRestore();
        credit.close();
    }
});

it('rejects deep extension metadata before parsing, including progress reads', (): void => {
    const buffer: ArrayBuffer = frame(
        `{"attachment":${attachment},"extension":${'['.repeat(70)}0${']'.repeat(70)}}`,
    );
    const parse: MockInstance<typeof JSON.parse> = vi.spyOn(JSON, 'parse');
    try {
        expect((): ReceivedAttachment => BinaryMedia.decode(buffer, 4096)).toThrow('nesting');
        expect((): ReturnType<typeof BinaryMedia.progress> =>
            BinaryMedia.progress(new Uint8Array(buffer), buffer.byteLength),
        ).toThrow('nesting');
        expect(parse).not.toHaveBeenCalled();
    } finally {
        parse.mockRestore();
    }
});

it('returns known scalar metadata without exposing untrusted extension properties', (): void => {
    const buffer: ArrayBuffer = frame(
        '{"attachment":{"id":"file","filename":"page.zip","mimeType":"application/zip","byteLength":0,"website":true,"extension":{"data":[1,2,3]}}}',
    );
    const decoded: ReceivedAttachment = BinaryMedia.decode(buffer, 4096);
    expect(decoded.website).toBe(true);
    expect(decoded).not.toHaveProperty('extension');
    expect(decoded.data.buffer).toBe(buffer);
});

it.each(['"yes"', '{}', '[]', '0'])(
    'rejects a nonboolean website classification (%s)',
    (website: string): void => {
        const buffer: ArrayBuffer = frame(
            `{"attachment":{"id":"file","filename":"page.zip","mimeType":"application/zip","byteLength":0,"website":${website}}}`,
        );
        expect((): ReceivedAttachment => BinaryMedia.decode(buffer, 4096)).toThrow('metadata');
    },
);
