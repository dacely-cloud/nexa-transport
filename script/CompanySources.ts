// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

/** Server-only generator for the canonical browser-compatible company codec dependency graph. */
export class CompanySources {
    public static readonly FILES: readonly string[] = Object.freeze([
        'BinaryReader',
        'BinaryWriter',
        'CompanyTypes',
        'CompanyLimitsTypes',
        'CompanyProtocol',
        'CompanyWorkTypes',
        'CompanyWorkCodec',
        'CompanyBudgetTypes',
        'CompanyProjectTypes',
        'CompanyProjectProtocol',
        'CompanyEmployeeTypes',
        'CompanyEmployeeProtocol',
        'CompanyHostTypes',
        'CompanyHostProtocol',
    ]);

    /** Restricts reads to the known canonical graph rather than arbitrary generator input paths. */
    public static source(name: string): string {
        if (!CompanySources.FILES.includes(name)) {
            throw new TypeError('Unknown canonical company source');
        }
        return readFileSync(
            new URL('../../nexa/src/company/' + name + '.ts', import.meta.url),
            'utf8',
        );
    }

    /** Loads the whole graph before writing, then removes the superseded task-owned combined module. */
    public static sync(): void {
        const sources: ReadonlyMap<string, string> = new Map(
            CompanySources.FILES.map((name: string): readonly [string, string] => [
                name,
                CompanySources.source(name),
            ]),
        );
        mkdirSync(new URL('../src/company/', import.meta.url), { recursive: true });
        let name: string;
        for (name of CompanySources.FILES) {
            const source: string | undefined = sources.get(name);
            if (source === undefined) {
                throw new Error('Missing canonical company source');
            }
            writeFileSync(new URL('../src/company/' + name + '.ts', import.meta.url), source);
        }
        const obsolete: URL = new URL('../src/company/CompanyBinary.ts', import.meta.url);
        if (existsSync(obsolete)) {
            unlinkSync(obsolete);
        }
    }
}
