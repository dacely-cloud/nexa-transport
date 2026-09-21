import { materializeError } from './ErrorStack.js';
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
/** WebSocket close details, preserved for diagnostics and reconnect decisions. */
export interface WebSocketCloseDetails {
    readonly code: number;
    readonly reason: string;
    readonly wasClean: boolean;
}
/** A transport failure or a typed gateway error, without credential-bearing URLs. */
export class TransportError extends Error {
    /** Creates a failure with optional server diagnostics. */
    public constructor(
        public readonly code: TransportErrorCode,
        message: string,
        public readonly remote?: WireError,
        public readonly closeDetails?: WebSocketCloseDetails,
    ) {
        super(message);
        this.name = 'TransportError';
        materializeError(this);
    }
}
