import { TransportError, TransportErrorCode } from './TransportError.js';
/** One waiting iterator consumer. */
interface Waiter<T> {
    readonly resolve: (value: IteratorResult<T, undefined>) => void;
    readonly reject: (error: Error) => void;
}
/** One retained event and its accounted byte size. */
interface Entry<T> {
    readonly value: T;
    readonly bytes: number;
}
/** Bounded queue with deterministic completion for an asynchronous event consumer. */
export class EventStream<T> implements AsyncIterableIterator<T> {
    readonly #values: Entry<T>[] = [];
    #waiter: Waiter<T> | undefined;
    #bytes: number = 0;
    #ended: boolean = false;
    #error: Error | undefined;
    /** Sets the maximum unread event count. */
    public constructor(
        public readonly limit: number = 256,
        public readonly maxBytes: number = 8 * 1024 * 1024,
    ) {}
    /** Delivers an event or rejects overflow before retaining more memory. */
    public push(value: T, bytes: number): void {
        if (this.#ended) {
            return;
        }
        if (this.#waiter !== undefined) {
            this.#waiter.resolve({ done: false, value });
            this.#waiter = undefined;
        } else {
            if (this.#values.length >= this.limit || this.#bytes + bytes > this.maxBytes) {
                throw new TransportError(TransportErrorCode.Limit, 'Stream consumer fell behind');
            }
            this.#values.push({ value, bytes });
            this.#bytes += bytes;
        }
    }
    /** Ends the queue, preserving already received events on normal completion. */
    public end(error?: Error): void {
        if (this.#ended) {
            return;
        }
        this.#ended = true;
        this.#error = error;
        if (error !== undefined) {
            this.#values.length = 0;
            this.#bytes = 0;
            this.#waiter?.reject(error);
        } else {
            this.#waiter?.resolve({ done: true, value: undefined });
        }
        this.#waiter = undefined;
    }
    /** Returns the next event. Concurrent reads are deliberately rejected. */
    public next(): Promise<IteratorResult<T, undefined>> {
        if (this.#error !== undefined) {
            return Promise.reject(this.#error);
        }
        if (this.#values.length > 0) {
            const entry: Entry<T> | undefined = this.#values.shift();
            if (entry !== undefined) {
                this.#bytes -= entry.bytes;
                return Promise.resolve({ done: false, value: entry.value });
            }
        }
        if (this.#ended) {
            return Promise.resolve({ done: true, value: undefined });
        }
        if (this.#waiter !== undefined) {
            return Promise.reject(new Error('Only one stream consumer is supported'));
        }
        return new Promise<IteratorResult<T, undefined>>((resolve, reject): void => {
            this.#waiter = { resolve, reject };
        });
    }
    /** The queue is its own iterator. */
    public [Symbol.asyncIterator](): AsyncIterableIterator<T> {
        return this;
    }
}
