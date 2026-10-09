// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** One actual analyzer instruction, with an exact unsigned native address. */
export interface ReverseControlFlowInstruction {
    readonly address: string;
    readonly instruction: string;
}
/** A basic block retains declared edges even when their destinations are on another page. */
export interface ReverseControlFlowBlock {
    readonly id: string;
    readonly start: string;
    readonly end: string;
    /** Ghidra uses an inclusive last address; IDA uses an exclusive end address. */
    readonly endInclusive?: boolean;
    readonly successors: readonly string[];
    readonly instructions: readonly ReverseControlFlowInstruction[];
    readonly instructionsTruncated: boolean;
}
/** A bounded captured graph page, independent of analyzer handles and capabilities. */
export interface ReverseControlFlowPage {
    readonly function: string;
    readonly address: string;
    readonly blocks: readonly ReverseControlFlowBlock[];
    readonly totalBlocks: number;
    readonly offset: number;
    readonly nextOffset: number | null;
}

/** Portable validation shared by agent consumers and Chat's graph renderer. */
export class ReverseControlFlow {
    /** Narrows untrusted captured JSON and rejects inconsistent bounds before mounting graph nodes. */
    public static read(input: unknown): ReverseControlFlowPage {
        if (
            typeof input !== 'object' ||
            input === null ||
            !('function' in input) ||
            typeof input.function !== 'string' ||
            input.function.length > 1024 ||
            !('address' in input) ||
            !this.#address(input.address) ||
            !('blocks' in input) ||
            !Array.isArray(input.blocks) ||
            input.blocks.length > 200 ||
            !('totalBlocks' in input) ||
            !this.#count(input.totalBlocks, 100_000) ||
            !('nextOffset' in input) ||
            (input.nextOffset !== null && !this.#count(input.nextOffset, 100_000)) ||
            ('offset' in input && !this.#count(input.offset, 100_000))
        ) {
            throw new TypeError('Invalid captured control-flow page');
        }
        const offset: number =
            'offset' in input && typeof input.offset === 'number' ? input.offset : 0;
        const blocks: ReverseControlFlowBlock[] = input.blocks.map(
            (block: unknown): ReverseControlFlowBlock => this.#block(block),
        );
        const end: number = offset + blocks.length;
        if (
            offset > input.totalBlocks ||
            end > input.totalBlocks ||
            (blocks.length === 0 && offset < input.totalBlocks) ||
            input.nextOffset !== (end < input.totalBlocks ? end : null) ||
            new Set(blocks.map((block: ReverseControlFlowBlock): string => block.id)).size !==
                blocks.length ||
            blocks.reduce(
                (count: number, block: ReverseControlFlowBlock): number =>
                    count + block.instructions.length,
                0,
            ) > 10_000
        ) {
            throw new RangeError('Inconsistent captured control-flow pagination');
        }
        return {
            function: input.function,
            address: input.address,
            blocks,
            totalBlocks: input.totalBlocks,
            offset,
            nextOffset: input.nextOffset,
        };
    }

    static #block(input: unknown): ReverseControlFlowBlock {
        if (
            typeof input !== 'object' ||
            input === null ||
            !('id' in input) ||
            !this.#id(input.id) ||
            !('start' in input) ||
            !this.#address(input.start) ||
            !('end' in input) ||
            !this.#address(input.end) ||
            ('endInclusive' in input && typeof input.endInclusive !== 'boolean') ||
            !('successors' in input) ||
            !Array.isArray(input.successors) ||
            input.successors.length > 200 ||
            !input.successors.every((id: unknown): id is string => this.#id(id)) ||
            new Set(input.successors).size !== input.successors.length ||
            !('instructions' in input) ||
            !Array.isArray(input.instructions) ||
            input.instructions.length > 100 ||
            !('instructionsTruncated' in input) ||
            typeof input.instructionsTruncated !== 'boolean'
        ) {
            throw new TypeError('Invalid captured basic block');
        }
        const start: bigint = this.#value(input.start);
        const end: bigint = this.#value(input.end);
        const inclusive: boolean = 'endInclusive' in input && input.endInclusive === true;
        const instructions: ReverseControlFlowInstruction[] = input.instructions.map(
            (instruction: unknown): ReverseControlFlowInstruction => this.#instruction(instruction),
        );
        if (
            start > end ||
            instructions.some(
                (instruction: ReverseControlFlowInstruction, index: number): boolean => {
                    const address: bigint = this.#value(instruction.address);
                    const previous: ReverseControlFlowInstruction | undefined =
                        instructions[index - 1];
                    return (
                        address < start ||
                        (inclusive ? address > end : address >= end) ||
                        (previous !== undefined && this.#value(previous.address) >= address)
                    );
                },
            )
        ) {
            throw new RangeError('Instruction lies outside its captured block or order');
        }
        return {
            id: input.id,
            start: input.start,
            end: input.end,
            ...('endInclusive' in input ? { endInclusive: inclusive } : {}),
            successors: [...input.successors],
            instructions,
            instructionsTruncated: input.instructionsTruncated,
        };
    }

    static #instruction(input: unknown): ReverseControlFlowInstruction {
        if (
            typeof input !== 'object' ||
            input === null ||
            !('address' in input) ||
            !this.#address(input.address) ||
            !('instruction' in input) ||
            typeof input.instruction !== 'string' ||
            input.instruction.length > 4096
        ) {
            throw new TypeError('Invalid captured instruction');
        }
        return { address: input.address, instruction: input.instruction };
    }
    static #id(value: unknown): value is string {
        return typeof value === 'string' && /^[0-9]{1,10}$/u.test(value);
    }
    static #address(value: unknown): value is string {
        return typeof value === 'string' && /^(?:0x)?[a-fA-F0-9]{1,16}$/u.test(value);
    }
    static #value(address: string): bigint {
        return BigInt(address.startsWith('0x') ? address : `0x${address}`);
    }
    static #count(value: unknown, maximum: number): value is number {
        return (
            typeof value === 'number' &&
            Number.isSafeInteger(value) &&
            value >= 0 &&
            value <= maximum
        );
    }
}
