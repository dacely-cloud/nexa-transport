// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
    ReverseInvestigation,
    type ReverseControlFlowBlock,
    type ReverseControlFlowPage,
} from '../src/reverse/ReverseInvestigation.js';

function block(): ReverseControlFlowBlock {
    return {
        id: '0',
        start: '0x401000',
        end: '0x401010',
        successors: ['1', '2'],
        instructions: [{ address: '0x401000', instruction: 'test eax, eax' }],
        instructionsTruncated: false,
    };
}
function page(): ReverseControlFlowPage {
    return {
        function: 'branch',
        address: '0x401000',
        blocks: [block()],
        totalBlocks: 3,
        offset: 0,
        nextOffset: 1,
    };
}

describe('captured native control flow', (): void => {
    it('keeps page-external successors and exact full-width Ghidra addresses', (): void => {
        expect(ReverseInvestigation.controlFlow(page())).toEqual(page());
        const ghidra: ReverseControlFlowPage = {
            function: 'high',
            address: 'fffffffffffffffe',
            offset: 0,
            totalBlocks: 1,
            nextOffset: null,
            blocks: [
                {
                    ...block(),
                    start: 'fffffffffffffffe',
                    end: 'ffffffffffffffff',
                    endInclusive: true,
                    successors: [],
                    instructions: [{ address: 'ffffffffffffffff', instruction: 'ret' }],
                },
            ],
        };
        expect(ReverseInvestigation.controlFlow(ghidra)).toEqual(ghidra);
        expect((): ReverseControlFlowPage =>
            ReverseInvestigation.controlFlow({
                ...ghidra,
                blocks: [{ ...ghidra.blocks[0], endInclusive: false }],
            }),
        ).toThrow('outside');
    });
    it('rejects broken pagination, duplicate ids, malformed addresses and out-of-range instructions', (): void => {
        for (const invalid of [
            { ...page(), nextOffset: null },
            { ...page(), offset: -1 },
            { ...page(), offset: 3 },
            { ...page(), blocks: [] },
            { ...page(), totalBlocks: 100_001 },
            { ...page(), blocks: [block(), block()], nextOffset: 2 },
            { ...page(), blocks: [{ ...block(), successors: ['1', '1'] }] },
            { ...page(), blocks: [{ ...block(), end: '0x400000' }] },
            { ...page(), blocks: [{ ...block(), end: '0x10000000000000000' }] },
            {
                ...page(),
                blocks: [
                    { ...block(), instructions: [{ address: '0x401020', instruction: 'ret' }] },
                ],
            },
            {
                ...page(),
                blocks: [
                    {
                        ...block(),
                        instructions: Array.from(
                            { length: 101 },
                            (): ReverseControlFlowBlock['instructions'][number] => ({
                                address: '0x401000',
                                instruction: 'nop',
                            }),
                        ),
                    },
                ],
            },
        ]) {
            expect((): ReverseControlFlowPage =>
                ReverseInvestigation.controlFlow(invalid),
            ).toThrow();
        }
    });
    it('retains explicit truncated coverage and detaches validated edges from input mutation', (): void => {
        const successors: string[] = ['1', '2'];
        const captured: ReverseControlFlowPage = ReverseInvestigation.controlFlow({
            ...page(),
            blocks: [{ ...block(), successors, instructionsTruncated: true }],
        });
        successors.push('3');
        expect(captured.blocks[0]?.successors).toEqual(['1', '2']);
        expect(captured.blocks[0]?.instructionsTruncated).toBe(true);
    });
});
