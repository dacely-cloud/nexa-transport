import { materializeError } from './ErrorStack.js';
import type { CallOptions } from '../interface/ClientOptions.js';
import type { JsonValue } from '../protocol/Protocol.js';
import { TransportError, TransportErrorCode } from './TransportError.js';
/** One request's response and cleanup hooks. */
interface PendingRequest {
    readonly resolve: (value: JsonValue) => void;
    readonly reject: (error: Error) => void;
    readonly cleanup: () => void;
}
/** Owns bounded RPC lifetimes and always settles waiters on disconnect. */
export class PendingRequests {
    readonly #pending: Map<string, PendingRequest> = new Map();
    /** Sets a hard concurrency bound. */
    public constructor(public readonly limit: number) {}
    /** Registers before send, including timeout and abort cleanup. */
    public create(
        id: string,
        options: CallOptions,
        timeout: number,
        onSettled?: () => void,
    ): Promise<JsonValue> {
        if (this.#pending.size >= this.limit) {
            return Promise.reject(
                new TransportError(TransportErrorCode.Limit, 'Too many pending requests'),
            );
        }
        return new Promise<JsonValue>((resolve, reject): void => {
            const abort: () => void = (): void => {
                this.reject(id, new TransportError(TransportErrorCode.Aborted, 'Request aborted'));
            };
            const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
                this.reject(
                    id,
                    new TransportError(TransportErrorCode.Timeout, 'Request timed out'),
                );
            }, timeout);
            this.#pending.set(id, {
                resolve,
                reject,
                cleanup: (): void => {
                    clearTimeout(timer);
                    options.signal?.removeEventListener('abort', abort);
                    onSettled?.();
                },
            });
            options.signal?.addEventListener('abort', abort, { once: true });
            if (options.signal?.aborted === true) {
                abort();
            }
        });
    }
    /** Whether a registered request may still be sent. */
    public has(id: string): boolean {
        return this.#pending.has(id);
    }
    /** Delivers a response exactly once. */
    public resolve(id: string, value: JsonValue): void {
        const pending: PendingRequest | undefined = this.#take(id);
        pending?.resolve(value);
    }
    /** Fails one request exactly once. */
    public reject(id: string, error: Error): void {
        const pending: PendingRequest | undefined = this.#take(id);
        if (pending !== undefined) {
            pending.reject(materializeError(error));
        }
    }
    /** Settles all outstanding requests. */
    public close(error: Error): void {
        for (const id of this.#pending.keys()) {
            this.reject(id, error);
        }
    }
    #take(id: string): PendingRequest | undefined {
        const pending: PendingRequest | undefined = this.#pending.get(id);
        if (pending !== undefined) {
            this.#pending.delete(id);
            pending.cleanup();
        }
        return pending;
    }
}
