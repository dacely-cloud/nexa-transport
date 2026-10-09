// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type {
    ReverseFunction,
    ReverseFunctionsPage,
    ReverseInspectResult,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

const functions: ReverseFunctionsPage = {
    runId: 'run',
    sha256: 'a'.repeat(64),
    engine: 'ida',
    state: 'ready',
    error: null,
    cursor: '0',
    nextCursor: null,
    total: '1',
    functions: [{ address: '0xffffffffffffffff', name: 'main', bytes: '18446744073709551615' }],
};
const inspection: ReverseInspectResult = {
    runId: functions.runId,
    sha256: functions.sha256,
    record: {
        id: 'capture',
        expert: 'reverse-ida',
        operation: 'decompile',
        selector: 'main',
        path: '/workspace/evidence.txt',
        excerpt: 'return 7;',
        characters: '9',
        createdAtMs: '1',
    },
};

describe('native directory and inspection receipts', (): void => {
    it('retains full-width addresses and sizes exactly and distinguishes incomplete inventories', (): void => {
        expect(ReverseInvestigation.functions(functions)).toBe(functions);
        for (const state of ['indexing', 'partial', 'failed'] as const) {
            const page: ReverseFunctionsPage = {
                ...functions,
                state,
                error: state === 'indexing' ? null : 'Capture interrupted',
            };
            expect(ReverseInvestigation.functions(page)).toBe(page);
        }
        expect(
            ReverseInvestigation.functions({
                ...functions,
                state: 'unavailable',
                total: '0',
                functions: [],
            }).state,
        ).toBe('unavailable');
    });
    it('validates exact full pages, final offsets and strictly increasing addresses', (): void => {
        const rows: readonly ReverseFunction[] = Array.from(
            { length: 50 },
            (_value: unknown, index: number): ReverseFunction => ({
                address: '0x' + (0x1000 + index).toString(16),
                name: `function_${index}`,
                bytes: null,
            }),
        );
        const page: ReverseFunctionsPage = {
            ...functions,
            functions: rows,
            total: '51',
            nextCursor: '50',
        };
        expect(ReverseInvestigation.functions(page)).toBe(page);
        for (const invalid of [
            { ...page, total: '52', nextCursor: '51' },
            { ...page, functions: rows.slice(0, 49) },
            { ...page, functions: [...rows].reverse() },
            { ...page, functions: [...rows.slice(1), rows[49]] },
            { ...page, functions: [...rows, rows[0]] },
            { ...functions, cursor: '1' },
            { ...functions, total: '100001' },
            { ...functions, cursor: '01' },
        ]) {
            expect((): ReverseFunctionsPage => ReverseInvestigation.functions(invalid)).toThrow();
        }
        expect(
            ReverseInvestigation.functions({ ...functions, cursor: '1', functions: [] }).nextCursor,
        ).toBeNull();
    });
    it('rejects invalid native identities, impossible lifecycle states and unsafe integer metadata', (): void => {
        for (const invalid of [
            { ...functions, sha256: 'invalid' },
            { ...functions, engine: 'browser' },
            { ...functions, error: 'Incomplete' },
            { ...functions, state: 'unavailable' },
            { ...functions, state: 'partial', error: 'x'.repeat(2001) },
            ...['0x01', '0X10', '0x10000000000000000', '10'].map((address: string) => ({
                ...functions,
                functions: [{ address, name: 'main', bytes: null }],
            })),
            ...['18446744073709551616', '01', '-1'].map((bytes: string) => ({
                ...functions,
                functions: [{ address: '0x10', name: 'main', bytes }],
            })),
        ]) {
            expect((): ReverseFunctionsPage => ReverseInvestigation.functions(invalid)).toThrow();
        }
    });
    it('accepts provenance without a body and rejects capabilities or foreign operations', (): void => {
        expect(ReverseInvestigation.inspection(inspection)).toBe(inspection);
        for (const invalid of [
            { ...inspection, text: 'x'.repeat(12001) },
            { ...inspection, token: 'private' },
            { ...inspection, sha256: 'invalid' },
            { ...inspection, record: { ...inspection.record, operation: 'execute' } },
            { ...inspection, record: { ...inspection.record, expert: 'reverse-reviewer' } },
            { ...inspection, record: { ...inspection.record, selector: null } },
            { ...inspection, record: { ...inspection.record, characters: '8388609' } },
        ]) {
            expect((): ReverseInspectResult => ReverseInvestigation.inspection(invalid)).toThrow();
        }
    });
});
