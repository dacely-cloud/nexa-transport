/** Controls disk-backed upload without adding source bytes to an agent request. */
export interface DataUploadOptions {
    /** Cancels upload and requests cleanup of its incomplete server file. */
    readonly signal?: AbortSignal;
    /** Reports acknowledged bytes, never queued or merely read bytes. */
    readonly onProgress?: (uploadedBytes: bigint, totalBytes: bigint) => void;
}
