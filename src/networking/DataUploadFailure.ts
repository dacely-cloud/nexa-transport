import type { DataUploadContext } from '../protocol/Protocol.js';

/** A proved cancellation differs from an unconfirmed transfer or publication. */
export const DataUploadFailureState = { Canceled: 'canceled', Unconfirmed: 'unconfirmed' } as const;
/** No timeout, disconnect or cancellation request alone proves native cleanup. */
export type DataUploadFailureState =
    (typeof DataUploadFailureState)[keyof typeof DataUploadFailureState];
/** Callers retain this exact original rather than constructing a replacement upload after uncertainty. */
export interface DataUploadOriginal {
    readonly context: DataUploadContext;
    readonly requestId: string;
    readonly filename: string;
    readonly byteLength: string;
}
/** Safe metadata supports explicit same-original recovery without exposing source bytes or account credentials. */
export class DataUploadFailure extends Error {
    /** The native source remains retained unless its state was authoritatively canceled. */
    public constructor(
        public readonly original: DataUploadOriginal,
        public readonly uploadId: string | null,
        public readonly state: DataUploadFailureState,
        cause: unknown,
    ) {
        super(
            state === DataUploadFailureState.Canceled
                ? 'This file upload was canceled. Select the file again to start a new upload.'
                : 'File upload did not finish. Retain its original request and upload ID for recovery; its delivery or cleanup may be unconfirmed.',
            { cause },
        );
        this.name = 'DataUploadFailure';
    }
}
