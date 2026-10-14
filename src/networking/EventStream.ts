import { TransportError, TransportErrorCode } from './TransportError.js';
import type { BinaryInputReservation } from '../media/BinaryInputReservation.js';
import { EventCredits } from './EventCredits.js';
import { InboundCapacity } from './InboundCapacity.js';
import { BinaryAdmissionError } from '../media/BinaryAdmissionError.js';
/** One waiting iterator consumer. */
interface Waiter<T> {
    readonly resolve: (value: IteratorResult<T, undefined>) => void;
    readonly reject: (error: Error) => void;
}
/** One retained event and its accounted byte size. */
interface Entry<T> {
    readonly value: T;
    readonly bytes: number;
    readonly credit: BinaryInputReservation;
}
/** Bounded queue with deterministic completion for an asynchronous event consumer. */
export class EventStream<T> implements AsyncIterableIterator<T> {
    #values: (Entry<T> | undefined)[] = [];
    #head: number = 0;
    #waiter: Waiter<T> | undefined;
    #bytes: number = 0;
    #ended: boolean = false;
    #error: Error | undefined;
    readonly #credits: EventCredits = new EventCredits();
    readonly #retain: (bytes: number) => BinaryInputReservation;
    /** Sets the maximum unread event count. */
    public constructor(
        public readonly limit: number = 256,
        public readonly maxBytes: number = 8 * 1024 * 1024,
        retain?: (bytes: number) => BinaryInputReservation,
    ) {
        if (
            !Number.isSafeInteger(limit) ||
            limit < 1 ||
            limit > 65536 ||
            !Number.isSafeInteger(maxBytes) ||
            maxBytes < 1 ||
            maxBytes > 64 * 1024 * 1024
        ) {
            throw new RangeError('Invalid event queue limits');
        }
        const input: InboundCapacity | undefined =
            retain === undefined ? new InboundCapacity() : undefined;
        this.#retain =
            retain ??
            ((bytes: number): BinaryInputReservation => {
                if (input === undefined) {
                    throw new Error('Event queue input authority is unavailable');
                }
                return input.reserve(bytes);
            });
        this.#credits.track(this);
    }
    /** Delivers an event or rejects overflow before retaining more memory. */
    public push(value: T, bytes: number): void {
        if (this.#ended) {
            return;
        }
        if (!Number.isSafeInteger(bytes) || bytes < 0) {
            throw new RangeError('Invalid event byte accounting');
        }
        if (this.#waiter !== undefined) {
            this.#waiter.resolve({ done: false, value });
            this.#waiter = undefined;
        } else {
            if (
                this.#values.length - this.#head >= this.limit ||
                bytes > this.maxBytes - this.#bytes
            ) {
                throw new TransportError(TransportErrorCode.Limit, 'Stream consumer fell behind');
            }
            let credit: BinaryInputReservation;
            try {
                credit = this.#retain(7 * bytes + 128);
            } catch (error: unknown) {
                if (error instanceof BinaryAdmissionError) {
                    throw new TransportError(
                        TransportErrorCode.Limit,
                        'Aggregate event memory budget is full',
                    );
                }
                throw error;
            }
            try {
                this.#credits.add(credit);
                this.#values.push({ value, bytes, credit });
            } catch (error: unknown) {
                this.#credits.release(credit);
                throw error;
            }
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
            this.discard();
            this.#waiter?.reject(error);
        } else {
            this.#waiter?.resolve({ done: true, value: undefined });
        }
        this.#waiter = undefined;
        if (this.#values.length === this.#head) {
            this.#credits.dispose();
        }
    }
    /** Releases unread events when the consumer explicitly stops, including after completion. */
    public return(): Promise<IteratorResult<T, undefined>> {
        this.discard();
        this.end();
        return Promise.resolve({ done: true, value: undefined });
    }
    /** Drops buffered values without changing the terminal result. */
    public discard(): void {
        this.#values.length = 0;
        this.#head = 0;
        this.#bytes = 0;
        this.#credits.clear();
        if (this.#ended) {
            this.#credits.dispose();
        }
    }
    /** Returns the next event. Concurrent reads are deliberately rejected. */
    public next(): Promise<IteratorResult<T, undefined>> {
        if (this.#error !== undefined) {
            return Promise.reject(this.#error);
        }
        if (this.#head < this.#values.length) {
            const entry: Entry<T> | undefined = this.#values[this.#head];
            if (entry !== undefined) {
                this.#values[this.#head] = undefined;
                this.#head += 1;
                this.#bytes -= entry.bytes;
                this.#credits.release(entry.credit);
                if (this.#head === this.#values.length) {
                    this.#values.length = 0;
                    this.#head = 0;
                } else if (this.#head >= 128 && this.#head * 2 >= this.#values.length) {
                    this.#values = this.#values.slice(this.#head);
                    this.#head = 0;
                }
                if (this.#ended && this.#values.length === 0) {
                    this.#credits.dispose();
                }
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
