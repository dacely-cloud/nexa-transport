// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReverseGraphPage, ReverseGraphBlock } from '../protocol/Protocol.js';
import { reverseGraph } from '../protocol/Validators.js';
import { ArchiveReceipt } from './ArchiveReceipt.js';
import { ReverseControlFlow } from './ControlFlow.js';

/** Checks structured graph coverage and bounded presentation independently of native handles. */
export class GraphReceipt {
    public static read(raw: unknown): ReverseGraphPage {
        if (!reverseGraph(raw)) {
            throw new TypeError('Invalid archived graph page');
        }
        ReverseControlFlow.read(raw.graph);
        if (
            !/^[a-f0-9]{64}$/u.test(raw.sha256) ||
            !/^[a-f0-9]{64}$/u.test(raw.evidenceSha256) ||
            raw.runId.length === 0 ||
            raw.runId.length > 128 ||
            !ArchiveReceipt.validRecord(raw.record) ||
            raw.record.operation !== 'graph' ||
            !this.#decimal(raw.cursor) ||
            (raw.nextCursor !== null && !this.#decimal(raw.nextCursor)) ||
            raw.graph.blocks.length > 4 ||
            JSON.stringify(raw.graph.blocks).length > 12000 ||
            !this.#count(raw.capturedOffset, 100000) ||
            !this.#count(raw.capturedBlocks, 200)
        ) {
            throw new RangeError('Archived graph exceeds presentation limits');
        }
        const end: number = raw.capturedOffset + raw.capturedBlocks;
        if (
            end > raw.graph.totalBlocks ||
            raw.uncapturedOffset !== (end < raw.graph.totalBlocks ? end : null) ||
            raw.graph.offset < raw.capturedOffset ||
            raw.graph.offset + raw.graph.blocks.length > end
        ) {
            throw new RangeError('Inconsistent archived graph coverage');
        }
        for (const block of raw.graph.blocks) {
            if (
                !this.#count(block.instructionCount, 100) ||
                !this.#count(block.instructionOffset, block.instructionCount) ||
                block.instructionOffset + block.instructions.length > block.instructionCount ||
                block.nextInstructionOffset !==
                    (block.instructionOffset + block.instructions.length < block.instructionCount
                        ? block.instructionOffset + block.instructions.length
                        : null)
            ) {
                throw new RangeError('Inconsistent captured instruction pagination');
            }
        }
        if (raw.blockId === null) {
            const cursor: bigint = BigInt(raw.cursor);
            const next: bigint = cursor + BigInt(raw.graph.blocks.length);
            if (
                BigInt(raw.graph.offset) !== BigInt(raw.capturedOffset) + cursor ||
                raw.graph.blocks.some(
                    (block: ReverseGraphBlock): boolean => block.instructionOffset !== 0,
                ) ||
                raw.nextCursor !== (next < BigInt(raw.capturedBlocks) ? next.toString() : null) ||
                (raw.graph.blocks.length === 0 && cursor < BigInt(raw.capturedBlocks))
            ) {
                throw new RangeError('Inconsistent captured block pagination');
            }
        } else {
            const block: ReverseGraphBlock | undefined = raw.graph.blocks[0];
            if (
                raw.graph.blocks.length !== 1 ||
                block === undefined ||
                block.id !== raw.blockId ||
                BigInt(raw.cursor) !== BigInt(block.instructionOffset) ||
                raw.nextCursor !== (block.nextInstructionOffset?.toString() ?? null) ||
                (block.instructions.length === 0 &&
                    block.instructionOffset < block.instructionCount)
            ) {
                throw new RangeError('Inconsistent selected block instructions');
            }
        }
        return raw;
    }
    static #decimal(value: string): boolean {
        return /^(?:0|[1-9][0-9]{0,19})$/u.test(value);
    }
    static #count(value: number, maximum: number): boolean {
        return Number.isSafeInteger(value) && value >= 0 && value <= maximum;
    }
}
