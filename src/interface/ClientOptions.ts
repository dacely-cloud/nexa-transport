import type { AskParams } from '../protocol/Protocol.js';
/** Metadata sent in the Nexa connect handshake. */
export interface ClientIdentity {
    /** Stable application or installation identifier. */
    readonly id: string;
    /** Application version. */
    readonly version: string;
    /** Runtime description for gateway operators. */
    readonly platform: string;
}

/** Browser and Node.js connection configuration. Credentials stay in memory. */
export interface ClientOptions {
    /** ws(s) endpoint, or an http(s) URL converted to ws(s). */
    readonly url: string;
    /** Nexa token, or a previously provisioned device token. */
    readonly apiKey?: string;
    /** Stable device id for paired-device authentication. */
    readonly deviceId?: string;
    /** Display name when requesting device pairing. */
    readonly deviceName?: string;
    /** Single-use pairing code issued by the operator. */
    readonly pairingCode?: string;
    /** Requested subset of scopes; the server remains authoritative. */
    readonly scopes?: readonly import('../protocol/Protocol.js').Scope[];
    /** Receives exceptions raised by application event listeners. */
    readonly onListenerError?: (error: Error) => void;
    /** Client identity for gateway diagnostics. */
    readonly client?: ClientIdentity;
    /** Deadline for opening and authenticating the connection; default 15000. */
    readonly connectTimeoutMs?: number;
    /** Per-RPC response deadline; default 60000. */
    readonly requestTimeoutMs?: number;
    /** Maximum inbound and outbound JSON frame bytes; default 16 MiB. */
    readonly maxMessageBytes?: number;
    /** Maximum concurrent pending RPCs; default 64. */
    readonly maxPendingRequests?: number;
    /** Cancels the connection attempt. */
    readonly signal?: AbortSignal;
}

/** Optional deadline and cancellation for an individual RPC. */
export interface CallOptions {
    /** Cancels local waiting; mutating RPCs may already have executed. */
    readonly signal?: AbortSignal;
    /** Deadline in milliseconds. */
    readonly timeoutMs?: number;
}

/** Conversation, media, and cancellation options for a direct ask. */
export interface AskOptions extends Omit<AskParams, 'message'>, CallOptions {}
