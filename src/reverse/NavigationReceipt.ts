// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReverseFunctionsPage, ReverseInspectResult } from '../protocol/Protocol.js';
import { reverseFunctions, reverseInspection } from '../protocol/Validators.js';
import { ArchiveReceipt } from './ArchiveReceipt.js';

/** Portable bounds and consistency checks for directory metadata and saved inspection receipts. */
export class NavigationReceipt {
    /** Preserves exact addresses and sizes without materializing the entire function inventory. */
    public static functions(input: unknown): ReverseFunctionsPage {
        if (!reverseFunctions(input)) {
            throw new TypeError('Invalid investigation function directory');
        }
        if (
            !this.#identity(input.runId, input.sha256) ||
            !this.#decimal(input.cursor) ||
            !this.#decimal(input.total) ||
            (input.nextCursor !== null && !this.#decimal(input.nextCursor)) ||
            input.functions.length > 50 ||
            (input.error !== null && (input.error.length === 0 || input.error.length > 2000)) ||
            (['ready', 'indexing', 'unavailable'].includes(input.state) && input.error !== null) ||
            (input.state === 'unavailable' && input.total !== '0') ||
            input.functions.some(
                (row): boolean =>
                    !/^0x(?:0|[1-9a-f][0-9a-f]{0,15})$/u.test(row.address) ||
                    row.name.length === 0 ||
                    row.name.length > 1024 ||
                    (row.bytes !== null &&
                        (!this.#decimal(row.bytes) ||
                            BigInt(row.bytes) > 18_446_744_073_709_551_615n)),
            )
        ) {
            throw new RangeError('Function directory exceeds presentation limits');
        }
        const cursor: bigint = BigInt(input.cursor);
        const total: bigint = BigInt(input.total);
        const end: bigint = cursor + BigInt(input.functions.length);
        if (
            total > 100_000n ||
            cursor > total ||
            end > total ||
            input.functions.length !== Number(total - cursor > 50n ? 50n : total - cursor) ||
            input.nextCursor !== (end < total ? end.toString() : null) ||
            input.functions.some((row, index: number): boolean => {
                const previous: typeof row | undefined = input.functions[index - 1];
                return previous !== undefined && BigInt(previous.address) >= BigInt(row.address);
            })
        ) {
            throw new RangeError('Inconsistent function directory pagination');
        }
        return input;
    }
    /** Inspections return provenance only; captured text remains behind the paged evidence API. */
    public static inspection(input: unknown): ReverseInspectResult {
        if (!reverseInspection(input)) {
            throw new TypeError('Invalid investigation inspection receipt');
        }
        if (
            !this.#identity(input.runId, input.sha256) ||
            !ArchiveReceipt.validRecord(input.record) ||
            !['reverse-ida', 'reverse-ghidra'].includes(input.record.expert) ||
            !['decompile', 'disassemble', 'xrefs', 'graph'].includes(input.record.operation) ||
            input.record.selector === null ||
            input.record.selector.length === 0 ||
            BigInt(input.record.characters) > 8_388_608n ||
            Object.keys(input).some(
                (key: string): boolean => !['runId', 'sha256', 'record'].includes(key),
            )
        ) {
            throw new RangeError('Inspection receipt exceeds presentation limits');
        }
        return input;
    }
    static #decimal(value: string): boolean {
        return /^(?:0|[1-9][0-9]{0,19})$/u.test(value);
    }
    static #identity(runId: string, sha256: string): boolean {
        return runId.length > 0 && runId.length <= 128 && /^[a-f0-9]{64}$/u.test(sha256);
    }
}
