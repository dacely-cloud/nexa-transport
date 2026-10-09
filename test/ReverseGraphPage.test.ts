// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type {
    ReverseGraphPage,
    ReverseGraphBlock,
    ReverseControlFlowInstruction,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

function page(): ReverseGraphPage {
    return {
        runId: 'run',
        sha256: 'a'.repeat(64),
        evidenceSha256: 'b'.repeat(64),
        record: {
            id: 'capture',
            expert: 'reverse-ghidra',
            operation: 'graph',
            selector: null,
            path: '/evidence.txt',
            excerpt: '',
            characters: '500000',
            createdAtMs: '1',
        },
        cursor: '0',
        nextCursor: '1',
        blockId: null,
        capturedOffset: 2,
        capturedBlocks: 3,
        uncapturedOffset: 5,
        graph: {
            function: 'branch',
            address: 'fffffffffffffff0',
            offset: 2,
            totalBlocks: 6,
            nextOffset: 3,
            blocks: [
                {
                    id: '2',
                    start: 'fffffffffffffff0',
                    end: 'ffffffffffffffff',
                    endInclusive: true,
                    successors: ['3'],
                    instructionsTruncated: false,
                    instructions: [{ address: 'fffffffffffffff0', instruction: 'MOV EAX, 7' }],
                    instructionOffset: 0,
                    instructionCount: 2,
                    nextInstructionOffset: 1,
                },
            ],
        },
    };
}
describe('archived graph pages', (): void => {
    it('retains uncaptured blocks and separately paged instructions without reporting analyzer truncation', (): void => {
        const original: ReverseGraphPage = page();
        expect(ReverseInvestigation.graph(original)).toBe(original);
        const detail: ReverseGraphPage = {
            ...original,
            blockId: '2',
            cursor: '1',
            nextCursor: null,
            graph: {
                ...original.graph,
                blocks: original.graph.blocks.map(
                    (block: ReverseGraphBlock): ReverseGraphBlock => ({
                        ...block,
                        instructionOffset: 1,
                        nextInstructionOffset: null,
                        instructions: [{ address: 'ffffffffffffffff', instruction: 'RET' }],
                    }),
                ),
            },
        };
        expect(ReverseInvestigation.graph(detail)).toBe(detail);
        expect(detail.graph.blocks[0]?.instructionsTruncated).toBe(false);
    });
    it('rejects contradictory capture, block and instruction cursors', (): void => {
        for (const invalid of [
            { ...page(), nextCursor: null },
            { ...page(), cursor: '1' },
            { ...page(), uncapturedOffset: 6 },
            { ...page(), capturedBlocks: 201 },
            { ...page(), blockId: '3' },
            { ...page(), blockId: '2', cursor: '2' },
            {
                ...page(),
                graph: {
                    ...page().graph,
                    blocks: page().graph.blocks.map(
                        (block: ReverseGraphBlock): ReverseGraphBlock => ({
                            ...block,
                            nextInstructionOffset: null,
                        }),
                    ),
                },
            },
            {
                ...page(),
                graph: {
                    ...page().graph,
                    blocks: page().graph.blocks.map(
                        (block: ReverseGraphBlock): ReverseGraphBlock => ({
                            ...block,
                            instructionCount: 0,
                        }),
                    ),
                },
            },
        ]) {
            expect((): ReverseGraphPage => ReverseInvestigation.graph(invalid)).toThrow();
        }
    });
    it('bounds serialized previews rather than assuming an instruction count bounds text', (): void => {
        const original: ReverseGraphPage = page();
        const instructions: readonly ReverseGraphPage['graph']['blocks'][number]['instructions'][number][] =
            Array.from(
                { length: 4 },
                (_value: unknown, index: number): ReverseControlFlowInstruction => ({
                    address: '0x' + (0xfffffffffffffff0n + BigInt(index)).toString(16),
                    instruction: 'x'.repeat(4000),
                }),
            );
        const oversized: ReverseGraphPage = {
            ...original,
            graph: {
                ...original.graph,
                blocks: original.graph.blocks.map(
                    (block: ReverseGraphBlock): ReverseGraphBlock => ({
                        ...block,
                        instructions,
                        instructionCount: 4,
                        nextInstructionOffset: null,
                    }),
                ),
            },
        };
        expect((): ReverseGraphPage => ReverseInvestigation.graph(oversized)).toThrow(
            'presentation limits',
        );
    });
});
