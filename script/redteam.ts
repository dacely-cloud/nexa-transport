// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { mkdir, readFile, writeFile } from 'node:fs/promises';

/** Nexa owns the portable effort and report contracts used by its browser transport. */
const files: readonly string[] = [
    'RedTeamTypes',
    'RedTeamInput',
    'RedTeamCodec',
    'RedTeamRequestCodec',
    'RedTeamReportCodec',
    'RedTeamExecutionTypes',
    'RedTeamExecutionCodec',
];
const destination: URL = new URL('../src/redteam/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const file of files) {
    const content: string = await readFile(
        new URL(`../../nexa/src/redteam/${file}.ts`, import.meta.url),
        'utf8',
    );
    await writeFile(new URL(`${file}.ts`, destination), content);
}
