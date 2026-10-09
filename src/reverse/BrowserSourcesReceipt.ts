// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    BrowserSourcesPage,
    BrowserSourcesSnapshot,
    BrowserSourceDirectoryRow,
} from '../protocol/Protocol.js';
import { reverseBrowserSources } from '../protocol/Validators.js';
import { BrowserSourcesValues as Value } from './BrowserSourcesValues.js';

/** Bounded source decoding is portable across browsers, Node and other JavaScript hosts. */
export class BrowserSourcesReceipt {
    /** Validates selected representation, pagination, coverage and original source identity before rendering. */
    public static read(input: unknown): BrowserSourcesPage {
        if (!reverseBrowserSources(input)) {
            throw new TypeError('Invalid saved browser sources page');
        }
        Value.keys(input, [
            'runId',
            'sha256',
            'evidenceId',
            'captureSha256',
            'metadata',
            'view',
            'selector',
            'cursor',
            'nextCursor',
            'total',
            'records',
            'text',
            'sourceSha256',
            'sourceBytes',
        ]);
        Value.metadata(input.metadata);
        const maximum: bigint = input.view === 'source' ? 2097152n : 100000n;
        if (
            !Value.uuid(input.runId) ||
            !Value.uuid(input.evidenceId) ||
            !Value.hash(input.sha256) ||
            !Value.hash(input.captureSha256) ||
            !Value.count(input.cursor, maximum) ||
            !Value.count(input.total, maximum) ||
            input.records.length > 20 ||
            JSON.stringify(input).length > 12000
        ) {
            throw new RangeError('Browser source page exceeds its presentation limits');
        }
        const cursor: bigint = BigInt(input.cursor);
        const total: bigint = BigInt(input.total);
        let length: number = input.records.length;
        if (input.view === 'source') {
            if (
                input.selector === null ||
                !Value.recordId(input.selector, 50000n) ||
                input.records.length !== 0 ||
                input.text === null ||
                !input.text.isWellFormed() ||
                input.sourceSha256 === null ||
                !Value.hash(input.sourceSha256) ||
                input.sourceBytes === null ||
                !Value.count(input.sourceBytes, 2097152n) ||
                !input.metadata.includeSources ||
                input.metadata.coverage.capturedSources === '0' ||
                BigInt(input.sourceBytes) > BigInt(input.metadata.coverage.sourceBytes)
            ) {
                throw new RangeError('Invalid selected source page');
            }
            const sourceBytes: bigint = BigInt(input.sourceBytes);
            if (
                sourceBytes < total ||
                sourceBytes > total * 3n ||
                BigInt(new TextEncoder().encode(input.text).length) > sourceBytes ||
                (total === 0n &&
                    input.sourceSha256 !==
                        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
            ) {
                throw new RangeError('Inconsistent source text length or byte count');
            }
            length = input.text.length;
        } else {
            if (
                input.selector !== null ||
                input.text !== null ||
                input.sourceSha256 !== null ||
                input.sourceBytes !== null ||
                input.total !==
                    (input.view === 'scripts'
                        ? input.metadata.scriptCount
                        : input.metadata.resourceCount)
            ) {
                throw new RangeError(
                    'Source bodies or inconsistent counts appeared in a directory',
                );
            }
            const ids: Set<string> = new Set<string>();
            for (const row of input.records) {
                if (
                    ids.has(row.id) ||
                    row.kind !== (input.view === 'scripts' ? 'script' : 'resource')
                ) {
                    throw new RangeError('Duplicate or mismatched source directory row');
                }
                ids.add(row.id);
                this.#row(row, input);
            }
        }
        const end: bigint = cursor + BigInt(length);
        if (
            cursor > total ||
            end > total ||
            (end === cursor && cursor < total) ||
            input.nextCursor !== (end < total ? end.toString() : null)
        ) {
            throw new RangeError('Inconsistent browser source pagination');
        }
        return input;
    }
    /** Live progress binds a body-free source projection to its original investigation and conversation. */
    public static snapshot(value: BrowserSourcesSnapshot, runId: string, sessionId?: string): void {
        Value.metadata(value, true);
        Value.keys(value.reference, ['sessionId', 'runId', 'evidenceId', 'captureSha256']);
        if (
            value.reference.runId !== runId ||
            !Value.uuid(value.reference.runId) ||
            !Value.uuid(value.reference.evidenceId) ||
            !Value.hash(value.reference.captureSha256) ||
            value.reference.sessionId.length === 0 ||
            value.reference.sessionId.length > 1024 ||
            (sessionId !== undefined && value.reference.sessionId !== sessionId) ||
            JSON.stringify(value).length > 6000
        ) {
            throw new RangeError('Browser source reference left its original investigation');
        }
    }
    static #row(row: BrowserSourceDirectoryRow, page: BrowserSourcesPage): void {
        if (row.kind === 'script') {
            Value.script(row, page.metadata);
        } else {
            Value.resource(row, page.metadata);
        }
    }
}
