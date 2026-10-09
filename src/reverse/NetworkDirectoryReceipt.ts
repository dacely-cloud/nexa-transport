import type { ReverseNetworkDirectoryPage } from '../protocol/Protocol.js';
import { reverseNetworkDirectory } from '../protocol/Validators.js';
import { NetworkReceipt } from './NetworkReceipt.js';

/** Bounds owner-scoped HTTP metadata separately from full immutable payload evidence. */
export class NetworkDirectoryReceipt {
    /** Validates source order, exact cursors, payload links and per-page presentation budgets. */
    public static read(input: unknown): ReverseNetworkDirectoryPage {
        if (!reverseNetworkDirectory(input)) {
            throw new TypeError('Invalid network metadata directory');
        }
        if (
            input.runId.length === 0 ||
            input.runId.length > 128 ||
            !/^[a-f0-9]{64}$/u.test(input.sha256) ||
            !this.#decimal(input.cursor) ||
            !this.#decimal(input.total) ||
            !this.#decimal(input.sourceEntries) ||
            (input.nextCursor !== null && !this.#decimal(input.nextCursor)) ||
            input.requests.length > 20 ||
            JSON.stringify(input).length > 12000 ||
            (input.error !== null && (input.error.length === 0 || input.error.length > 2000)) ||
            (['ready', 'indexing', 'unavailable'].includes(input.state) && input.error !== null) ||
            (input.state === 'unavailable' &&
                (input.total !== '0' || input.sourceEntries !== '0')) ||
            Object.keys(input).some(
                (key: string): boolean =>
                    ![
                        'runId',
                        'sha256',
                        'state',
                        'error',
                        'cursor',
                        'nextCursor',
                        'total',
                        'sourceEntries',
                        'requests',
                    ].includes(key),
            )
        ) {
            throw new RangeError('Network directory exceeds presentation limits');
        }
        const cursor: bigint = BigInt(input.cursor);
        const total: bigint = BigInt(input.total);
        const source: bigint = BigInt(input.sourceEntries);
        const end: bigint = cursor + BigInt(input.requests.length);
        if (
            source > 100000n ||
            total > source ||
            cursor > total ||
            end > total ||
            (input.requests.length === 0 && cursor < total) ||
            input.nextCursor !== (end < total ? end.toString() : null)
        ) {
            throw new RangeError('Inconsistent network directory pagination');
        }
        for (let index: number = 0; index < input.requests.length; index += 1) {
            const row: ReverseNetworkDirectoryPage['requests'][number] | undefined =
                input.requests[index];
            if (row === undefined) {
                throw new RangeError('Missing network metadata');
            }
            NetworkReceipt.request(row, 4096);
            const previous: typeof row | undefined = input.requests[index - 1];
            if (
                BigInt(row.id.slice(6)) >= source ||
                (previous !== undefined &&
                    BigInt(previous.id.slice(6)) >= BigInt(row.id.slice(6))) ||
                [row.requestEvidenceId, row.responseEvidenceId].some(
                    (id: string | null): boolean =>
                        id !== null && !/^[a-zA-Z0-9_-]{1,128}$/u.test(id),
                )
            ) {
                throw new RangeError('Invalid network metadata provenance');
            }
        }
        return input;
    }
    static #decimal(value: string): boolean {
        return /^(?:0|[1-9][0-9]{0,19})$/u.test(value);
    }
}
