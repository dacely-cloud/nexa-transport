import type { ReverseNetworkDetailPage } from '../protocol/Protocol.js';
import { reverseNetworkDetail } from '../protocol/Validators.js';
import { NetworkReceipt } from './NetworkReceipt.js';

/** Portable validation of immutable request projections, separate from agent-selected evidence. */
export class NetworkDetailReceipt {
    /** Validates exact progress, source identity, projection budgets and explicit absent/binary payloads. */
    public static read(input: unknown): ReverseNetworkDetailPage {
        if (!reverseNetworkDetail(input)) {
            throw new TypeError('Invalid saved request detail page');
        }
        const index: string | undefined = /^entry:(0|[1-9][0-9]{0,4})$/u.exec(input.selector)?.[1];
        if (
            input.runId.length === 0 ||
            input.runId.length > 128 ||
            !/^[a-f0-9]{64}$/u.test(input.sha256) ||
            !/^[a-f0-9]{64}$/u.test(input.captureSha256) ||
            index === undefined ||
            input.location !== `$.log.entries[${index}]` ||
            !this.#decimal(input.cursor) ||
            !this.#decimal(input.characters) ||
            (input.nextCursor !== null && !this.#decimal(input.nextCursor)) ||
            (input.unavailable !== null &&
                (input.unavailable.length === 0 || input.unavailable.length > 256)) ||
            JSON.stringify(input).length > 12000 ||
            Object.keys(input).some(
                (key: string): boolean =>
                    ![
                        'runId',
                        'sha256',
                        'selector',
                        'location',
                        'view',
                        'cursor',
                        'nextCursor',
                        'characters',
                        'captureSha256',
                        'body',
                        'unavailable',
                        'text',
                    ].includes(key),
            )
        ) {
            throw new RangeError('Saved request detail exceeds presentation limits');
        }
        const cursor: bigint = BigInt(input.cursor);
        const characters: bigint = BigInt(input.characters);
        const next: bigint = cursor + BigInt(input.text.length);
        if (
            characters > 8_388_608n ||
            cursor > characters ||
            next > characters ||
            (input.text.length === 0 && cursor < characters) ||
            input.nextCursor !== (next < characters ? next.toString() : null) ||
            (next < characters && /[\uD800-\uDBFF]$/u.test(input.text)) ||
            (input.unavailable !== null && (characters !== 0n || input.text !== ''))
        ) {
            throw new RangeError('Inconsistent saved request detail pagination');
        }
        const payload: boolean = input.view === 'request-body' || input.view === 'response-body';
        if (payload !== (input.body !== null) || (!payload && input.unavailable !== null)) {
            throw new TypeError('Saved request detail representation changed');
        }
        if (input.body !== null) {
            NetworkReceipt.body(input.body);
            if (
                input.unavailable === null &&
                (!input.body.captured ||
                    input.body.binary ||
                    BigInt(input.body.characters) !== characters)
            ) {
                throw new RangeError('Saved request payload coverage changed');
            }
        }
        return input;
    }
    static #decimal(value: string): boolean {
        return /^(?:0|[1-9][0-9]{0,19})$/u.test(value);
    }
}
