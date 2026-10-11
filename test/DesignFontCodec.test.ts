// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignFontCodec } from '../src/design/DesignFontCodec.js';
import {
    DesignFontLimits,
    type DesignFontAsset,
    type DesignFontSlice,
} from '../src/design/DesignFontTypes.js';

const font: DesignFontAsset = {
    id: 'brand',
    family: 'Brand Sans',
    weight: 400,
    italic: false,
    format: 'ttf',
    byteLength: '14',
    sha256: 'a'.repeat(64),
};

test('font wire slices require exact offsets, byte lengths, canonical base64 and EOF', (): void => {
    const slice: DesignFontSlice = {
        font,
        offset: '0',
        data: 'AAAAAAAAAAAAAAAAAAA=',
        nextOffset: null,
    };
    expect(DesignFontCodec.slice(slice)).toEqual(slice);
    expect((): void => {
        DesignFontCodec.slice({ ...slice, data: 'AAAAAAAAAAAAAAAAAAB=' });
    }).toThrow('canonical');
    expect((): void => {
        DesignFontCodec.slice({ ...slice, nextOffset: '14' });
    }).toThrow('boundaries');
    expect((): void => {
        DesignFontCodec.slice({ ...slice, offset: '00' });
    }).toThrow('position');
    expect((): void => {
        DesignFontCodec.slice({ ...slice, offset: '1' });
    }).toThrow('boundaries');
    expect((): void => {
        DesignFontCodec.slice({ ...slice, data: 'AAAAAAAAAAAAAAAA' });
    }).toThrow('boundaries');
    expect((): void => {
        DesignFontCodec.read({ id: 'brand', offset: DesignFontLimits.fileBytes.toString() });
    }).toThrow('position');
});

test('font metadata rejects oversized files, invalid styles, accessors and injected ownership', (): void => {
    expect((): void => {
        DesignFontCodec.asset({
            ...font,
            byteLength: (DesignFontLimits.fileBytes + 1n).toString(),
        });
    }).toThrow('metadata');
    expect((): void => {
        DesignFontCodec.asset({ ...font, family: ' Brand Sans' });
    }).toThrow('family');
    expect((): void => {
        DesignFontCodec.asset({ ...font, format: 'collection' });
    }).toThrow('metadata');
    expect((): void => {
        DesignFontCodec.asset({ ...font, sha256: 'A'.repeat(64) });
    }).toThrow('metadata');
    expect((): void => {
        DesignFontCodec.asset({
            ...font,
            get family(): string {
                throw new Error('Accessor ran');
            },
        });
    }).toThrow('data properties');
    expect((): void => {
        DesignFontCodec.import({
            id: 'brand',
            family: 'Brand Sans',
            weight: 400,
            italic: false,
            path: 'font.ttf',
            owner: 'another-user',
        });
    }).toThrow('Unexpected');
    expect((): void => {
        DesignFontCodec.list({ after: null, limit: 33 });
    }).toThrow('bounds');
});
