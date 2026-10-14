// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MediaSources } from '../script/MediaSources.js';
import { BinaryEnvelope } from '../src/media/BinaryEnvelope.js';

describe('canonical portable media sources', (): void => {
    it.each(MediaSources.FILES)(
        'matches the gateway implementation for %s',
        (name: string): void => {
            const source: string = readFileSync(
                new URL('../src/media/' + name, import.meta.url),
                'utf8',
            );
            expect(source).toBe(MediaSources.source(name));
        },
    );

    it('preserves byte views and noncanonical base64 text through the SDK encoder', (): void => {
        const source: Uint8Array = new Uint8Array([91, 3, 5, 255, 92]);
        const frame: Uint8Array<ArrayBuffer> | null = BinaryEnvelope.encodeValue({
            voice: source.subarray(1, 4),
            pcm: 'AB==',
        });
        if (frame === null) {
            throw new Error('Missing SDK binary frame');
        }
        expect(BinaryEnvelope.decode(frame.buffer, frame.length)).toEqual({
            voice: [3, 5, 255],
            pcm: 'AB==',
        });
        expect([...frame.subarray(frame.length - 3)]).toEqual([3, 5, 255]);
    });
});
