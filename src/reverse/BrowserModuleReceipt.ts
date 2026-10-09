// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BrowserModulePage } from '../protocol/Protocol.js';
import { reverseBrowserModules } from '../protocol/Validators.js';
import { BrowserSourcesValues as Source } from './BrowserSourcesValues.js';
import { BrowserModuleValues as Value } from './BrowserModuleValues.js';

/** Typed saved module pages are validated before any website presentation. */
export class BrowserModuleReceipt {
    /** Enforces exact representation, cursor progression, row state and immutable provenance. */
    public static read(raw: unknown): BrowserModulePage {
        if (!reverseBrowserModules(raw)) {
            throw new TypeError('Invalid saved browser module page');
        }
        Value.keys(raw, [
            'runId',
            'sha256',
            'evidenceId',
            'reportSha256',
            'metadata',
            'view',
            'selector',
            'field',
            'cursor',
            'nextCursor',
            'total',
            'records',
            'text',
            'textSha256',
        ]);
        Value.metadata(raw.metadata, raw.runId);
        const maximum: bigint = raw.view === 'text' ? 8192n : 100000n;
        if (
            !Source.uuid(raw.runId) ||
            !Source.uuid(raw.evidenceId) ||
            !Source.hash(raw.sha256) ||
            !Source.hash(raw.reportSha256) ||
            !Source.count(raw.cursor, maximum) ||
            !Source.count(raw.total, maximum) ||
            raw.records.length > 20 ||
            JSON.stringify(raw).length > 12000
        ) {
            throw new RangeError('Browser module page exceeds its bounds');
        }
        const cursor: bigint = BigInt(raw.cursor);
        const total: bigint = BigInt(raw.total);
        let count: number = raw.records.length;
        if (raw.view === 'text') {
            const global: boolean =
                raw.field !== null &&
                ['module', 'importer-url', 'map-base-url', 'parse-error'].includes(raw.field);
            if (
                raw.field === null ||
                raw.records.length !== 0 ||
                (global ? raw.selector !== null : raw.selector === null) ||
                (raw.text === null
                    ? raw.total !== '0' || raw.textSha256 !== null
                    : !raw.text.isWellFormed() ||
                      raw.textSha256 === null ||
                      !Source.hash(raw.textSha256))
            ) {
                throw new RangeError('Invalid selected module text');
            }
            const maximum: bigint =
                raw.field === 'module' || raw.field === 'specifier' || raw.field === 'expression'
                    ? 1024n
                    : raw.field === 'parse-error'
                      ? 1000n
                      : 8192n;
            const expected: string | null | undefined =
                raw.field === 'module'
                    ? raw.metadata.moduleCharacters
                    : raw.field === 'importer-url'
                      ? raw.metadata.importerCharacters
                      : raw.field === 'map-base-url'
                        ? raw.metadata.importMapBaseCharacters
                        : raw.field === 'parse-error'
                          ? raw.metadata.parseErrorCharacters
                          : undefined;
            if (
                total > maximum ||
                (expected !== undefined &&
                    (raw.total !== (expected ?? '0') ||
                        (expected === null) !== (raw.text === null)))
            ) {
                throw new RangeError('Selected module text identity changed');
            }
            count = raw.text?.length ?? 0;
        } else {
            if (
                raw.field !== null ||
                raw.text !== null ||
                raw.textSha256 !== null ||
                (raw.view === 'imports'
                    ? raw.selector !== null || raw.total !== raw.metadata.importCount
                    : raw.selector === null ||
                      (raw.metadata.sourceCapture === null && raw.total !== '0'))
            ) {
                throw new RangeError('Invalid browser module directory');
            }
            const ids: Set<string> = new Set();
            for (const row of raw.records) {
                if (
                    ids.has(row.id) ||
                    row.kind !== (raw.view === 'imports' ? 'import' : 'candidate')
                ) {
                    throw new RangeError('Mixed or duplicate module directory rows');
                }
                ids.add(row.id);
                if (row.kind === 'import') {
                    Value.imported(row, raw.metadata);
                } else {
                    Value.candidate(row);
                }
            }
        }
        if (
            raw.selector !== null &&
            (raw.selector.length === 0 || raw.selector.length > 128 || !raw.selector.isWellFormed())
        ) {
            throw new RangeError('Invalid saved module selector');
        }
        const end: bigint = cursor + BigInt(count);
        if (
            cursor > total ||
            end > total ||
            (end < total && count === 0) ||
            raw.nextCursor !== (end < total ? end.toString() : null)
        ) {
            throw new RangeError('Inconsistent module pagination');
        }
        return raw;
    }
}
