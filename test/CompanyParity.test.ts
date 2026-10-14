// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { CompanySources } from '../script/CompanySources';
import { BinaryReader } from '../src/company/BinaryReader';
import { BinaryWriter } from '../src/company/BinaryWriter';

it.each(CompanySources.FILES)('matches canonical company source for %s', (name: string): void => {
    const source: string = readFileSync(
        new URL('../src/company/' + name + '.ts', import.meta.url),
        'utf8',
    );
    expect(source).toBe(CompanySources.source(name));
});

it('preserves literal BOMs and the full unsigned revision range in the portable SDK', (): void => {
    const writer: BinaryWriter = new BinaryWriter(64);
    writer.str('\uFEFFinstructions').u64(0xffffffffffffffffn);
    const reader: BinaryReader = new BinaryReader(writer.toBytes());
    expect(reader.str()).toBe('\uFEFFinstructions');
    expect(reader.u64()).toBe(0xffffffffffffffffn);
    expect(reader.remaining).toBe(0);
});
