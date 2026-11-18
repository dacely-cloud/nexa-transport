// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { Method } from 'nexa-protocol/gateway/Method.js';
import type { ParamsOf, ResultOf, HelloOk } from 'nexa-protocol/gateway/ProtocolTypes.js';
import type { CallOptions } from '../interface/ClientOptions.js';
import type { ReceivedAttachment, AttachmentProgress } from 'nexa-protocol/media/BinaryMedia.js';
import type { GatewayEvent } from './ClientEvents.js';

/** Resource, streaming and archive owners borrow this connection contract; NexaClient retains validation and socket authority. */
export interface ClientConnection {
    readonly connected: boolean;
    readonly hello: HelloOk;
    /** Permanently close a corrupt stream connection and reject its pending requests. */
    close(): void;
    /** Validate parameters and results through the authenticated connection without replaying mutations. */
    call<M extends Exclude<Method, Method.Connect>>(
        method: M,
        params: ParamsOf<M>,
        options?: CallOptions,
    ): Promise<ResultOf<M>>;
    /** Send one bounded chunk using the connection's current negotiated binary capability. */
    uploadChunk(
        uploadId: string,
        offset: string,
        bytes: Uint8Array,
        options?: CallOptions,
    ): Promise<ResultOf<typeof Method.DataUploadChunk>>;
    /** Borrow a live event subscription and return its exact cancellation function. */
    onEvent(listener: (event: GatewayEvent) => void): () => void;
    /** Observe termination without taking ownership of reconnection or socket disposal. */
    onClose(listener: (error: Error) => void): () => void;
    /** Borrow validated attachment delivery for a bounded history read. */
    onAttachment(listener: (file: ReceivedAttachment) => void): () => void;
    /** Borrow attachment progress without retaining its binary payload. */
    onAttachmentProgress(listener: (progress: AttachmentProgress) => void): () => void;
}
