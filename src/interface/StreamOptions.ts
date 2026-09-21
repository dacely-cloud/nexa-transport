import type { CallOptions } from './ClientOptions.js';
/** Resource and cancellation controls for a streaming turn. */
export interface StreamOptions extends CallOptions {
    /** Maximum unread events before cancelling; default 256. */
    readonly maxBufferedEvents?: number;
    /** Maximum unread JSON event bytes; default 8 MiB. */
    readonly maxBufferedBytes?: number;
    /** Maximum overall turn duration; default one hour. */
    readonly turnTimeoutMs?: number;
}
