import type { WireError } from '../protocol/Protocol.js';
/** Machine-readable transport failures. */
export const TransportErrorCode = {
    Closed: 'closed',
    Timeout: 'timeout',
    Aborted: 'aborted',
    Protocol: 'protocol',
    Limit: 'limit',
    Connection: 'connection',
    Remote: 'remote',
} as const;
/** Transport failure category. */
export type TransportErrorCode = (typeof TransportErrorCode)[keyof typeof TransportErrorCode];
/** A transport failure or a typed gateway error, without credential-bearing URLs. */
export class TransportError extends Error {
    /** Creates a failure with optional server diagnostics. */
    public constructor(
        public readonly code: TransportErrorCode,
        message: string,
        public readonly remote?: WireError,
    ) {
        super(message);
        this.name = 'TransportError';
    }
}
