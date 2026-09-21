import { Method } from '../protocol/Protocol.js';
import type { StreamOptions } from '../interface/StreamOptions.js';
import type {
    AskResult,
    StreamAccepted,
    StreamParams,
    WireTurnEvent,
} from '../protocol/Protocol.js';
import * as validators from '../protocol/Validators.js';
import { EventStream } from './EventStream.js';
import type { GatewayEvent, NexaClient } from './NexaClient.js';
import { TransportError, TransportErrorCode } from './TransportError.js';

/** A turn's events, terminal result, and server-side cancellation handle. */
export class TurnStream implements AsyncIterable<WireTurnEvent> {
    readonly #events: EventStream<WireTurnEvent>;
    readonly #client: NexaClient;
    readonly #accepted: Promise<StreamAccepted>;
    readonly #completion: PromiseWithResolvers<AskResult> = Promise.withResolvers<AskResult>();
    readonly #unlisten: () => void;
    readonly #unclose: () => void;
    readonly #timer: ReturnType<typeof setTimeout>;
    readonly #options: StreamOptions;
    readonly #abort: () => void;
    #ended: boolean = false;
    /** Client-chosen id, registered before any RPC can emit events. */
    public readonly streamId: string;
    /** Settles when turn.end arrives, even if events have not yet been consumed. */
    public readonly result: Promise<AskResult>;
    /** Starts a turn; use NexaClient.stream. */
    public constructor(client: NexaClient, params: StreamParams, options: StreamOptions = {}) {
        const limit: number = options.maxBufferedEvents ?? 256;
        const bytes: number = options.maxBufferedBytes ?? 8 * 1024 * 1024;
        if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > 64 * 1024 * 1024) {
            throw new RangeError('Invalid stream byte limit');
        }
        const duration: number = options.turnTimeoutMs ?? 3_600_000;
        if (
            !Number.isSafeInteger(limit) ||
            limit < 1 ||
            limit > 65_536 ||
            !Number.isSafeInteger(duration) ||
            duration < 1 ||
            duration > 2_147_483_647
        ) {
            throw new RangeError('Invalid stream limits');
        }
        if (!client.connected || options.signal?.aborted === true) {
            throw new TransportError(
                TransportErrorCode.Aborted,
                'Cannot start a disconnected or aborted turn',
            );
        }
        this.#client = client;
        this.#options = options;
        this.streamId = params.streamId ?? crypto.randomUUID();
        this.#events = new EventStream(limit, bytes);
        this.result = this.#completion.promise;
        this.#unlisten = client.onEvent((event: GatewayEvent): void => {
            this.#receive(event);
        });
        this.#unclose = client.onClose((error: Error): void => {
            this.#end(error);
        });
        this.#abort = (): void => {
            void this.#cancel(new TransportError(TransportErrorCode.Aborted, 'Turn aborted'));
        };
        this.#timer = setTimeout((): void => {
            void this.#cancel(new TransportError(TransportErrorCode.Timeout, 'Turn timed out'));
        }, duration);
        this.#accepted = client.call(
            Method.AgentStream,
            { ...params, streamId: this.streamId },
            options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs },
        );
        void this.#observeStart();
        void this.#observeResult();
        options.signal?.addEventListener('abort', this.#abort, { once: true });
    }
    /** Stops the server run using its runId, never the client streamId. */
    public async cancel(): Promise<void> {
        await this.#cancel(new TransportError(TransportErrorCode.Aborted, 'Turn cancelled'));
    }
    /** Consuming partially and breaking cancels the remaining server run. */
    public async *[Symbol.asyncIterator](): AsyncGenerator<WireTurnEvent, void> {
        try {
            for await (const event of this.#events) {
                yield event;
            }
        } finally {
            if (!this.#ended) {
                await this.cancel();
            }
        }
    }
    async #observeStart(): Promise<void> {
        try {
            const accepted: StreamAccepted = await this.#accepted;
            if (accepted.streamId !== this.streamId) {
                await this.#cancel(
                    new TransportError(
                        TransportErrorCode.Protocol,
                        'Stream acknowledgement mismatch',
                    ),
                );
            }
        } catch (error: unknown) {
            this.#end(asError(error));
            if (error instanceof TransportError && error.code === TransportErrorCode.Timeout) {
                this.#client.close();
            }
        }
    }
    async #observeResult(): Promise<void> {
        try {
            await this.result;
        } catch {
            /** Consumers observe failure through result or iteration. */
        }
    }
    async #cancel(error: Error): Promise<void> {
        if (this.#ended) {
            return;
        }
        this.#end(error);
        try {
            const accepted: StreamAccepted = await this.#accepted;
            if (this.#client.connected) {
                await this.#client.call(Method.TasksCancel, { id: accepted.runId });
            }
        } catch {
            /** A failed start or disconnected socket already has no locally owned run. */
        }
    }
    #receive(frame: GatewayEvent): void {
        try {
            if (frame.event === 'turn.event') {
                if (!validators.turnEvent(frame.data)) {
                    throw new TransportError(TransportErrorCode.Protocol, 'Invalid turn event');
                }
                if (frame.data.streamId === this.streamId) {
                    this.#events.push(
                        frame.data.event,
                        new TextEncoder().encode(JSON.stringify(frame.data.event)).length,
                    );
                }
            } else if (frame.event === 'turn.end') {
                if (!validators.turnEnd(frame.data)) {
                    throw new TransportError(
                        TransportErrorCode.Protocol,
                        'Invalid turn completion',
                    );
                }
                if (frame.data.streamId !== this.streamId) {
                    return;
                }
                if (frame.data.ok && frame.data.result !== undefined) {
                    this.#completion.resolve(frame.data.result);
                    this.#end();
                } else {
                    throw new TransportError(
                        TransportErrorCode.Remote,
                        frame.data.error?.message ?? 'Turn failed without a result',
                        frame.data.error,
                    );
                }
            }
        } catch (error: unknown) {
            void this.#cancel(asError(error));
        }
    }
    #end(error?: Error): void {
        if (this.#ended) {
            return;
        }
        this.#ended = true;
        this.#unlisten();
        this.#unclose();
        clearTimeout(this.#timer);
        this.#options.signal?.removeEventListener('abort', this.#abort);
        if (error !== undefined) {
            this.#completion.reject(error);
        }
        this.#events.end(error);
    }
}
/** Converts a rejection only at the asynchronous error boundary. */
function asError(error: unknown): Error {
    return error instanceof Error
        ? error
        : new TransportError(TransportErrorCode.Connection, 'Streaming operation failed');
}
