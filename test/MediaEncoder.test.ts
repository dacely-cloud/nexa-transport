// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { describe, expect, it } from 'vitest';
import { BinaryEnvelope } from 'nexa-protocol/media/BinaryEnvelope.js';

describe('portable media encoder', (): void => {
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
