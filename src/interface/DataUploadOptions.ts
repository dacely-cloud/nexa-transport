import type { DataUploadContext, ConversationDataUpload } from '../protocol/Protocol.js';

/** Controls one immutable, explicitly placed upload without adding source bytes to an agent request. */
export interface DataUploadOptions {
    /** Exact conversation/private-generation/provider comparison returned by authenticated target discovery. */
    readonly context: DataUploadContext;
    /** Retain this exact ID/context/declaration for acknowledgment recovery; never replace an uncertain original automatically. */
    readonly requestId: string;
    /** Cancels observation and requests cleanup of the exact unfinished source when known. */
    readonly signal?: AbortSignal;
    /** Reports acknowledged bytes, never queued or merely read bytes. */
    readonly onProgress?: (uploadedBytes: bigint, totalBytes: bigint) => void;
    /** Exposes the original server identity before source slices are read. */
    readonly onStarted?: (upload: ConversationDataUpload) => void;
}
