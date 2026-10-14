// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { NexaClient } from './NexaClient.js';
import { InboundCapacity } from './InboundCapacity.js';
import type { BinaryInputReservation } from '../media/BinaryInputReservation.js';
import { TransportError, TransportErrorCode } from './TransportError.js';
import { materializeError } from './ErrorStack.js';

/** Resource state contains counters and identities, never its owning client or socket. */
class ClientResourceState {
    readonly #streams: Set<string> = new Set();
    #frame: BinaryInputReservation | undefined;

    /** Every entry uses the capacity captured when the authenticated client was constructed. */
    public constructor(
        public readonly input: InboundCapacity,
        public readonly streamLimit: number,
    ) {
        if (!Number.isSafeInteger(streamLimit) || streamLimit < 1 || streamLimit > 2147483647) {
            throw new RangeError('Invalid active stream ceiling');
        }
        Object.freeze(this);
    }

    /** Even direct TurnStream construction must acquire the client's active-turn slot. */
    public acquire(streamId: string): () => void {
        if (this.#streams.has(streamId)) {
            throw materializeError(new TypeError('Stream id is already active'));
        }
        if (this.#streams.size >= this.streamLimit) {
            throw new TransportError(TransportErrorCode.Limit, 'Too many active streams');
        }
        this.#streams.add(streamId);
        return (): void => {
            this.#streams.delete(streamId);
        };
    }

    /** Synchronous routing exposes only this frame's credit, restoring any outer routing scope. */
    public route<T>(credit: BinaryInputReservation, operation: () => T): T {
        const previous: BinaryInputReservation | undefined = this.#frame;
        this.#frame = credit;
        try {
            return operation();
        } finally {
            this.#frame = previous;
        }
    }

    /** Queued events retain existing input rather than reserving a second copy of the same storage. */
    public readonly retain: (bytes: number) => BinaryInputReservation = (
        bytes: number,
    ): BinaryInputReservation =>
        this.#frame === undefined
            ? this.input.reserve(bytes)
            : this.#frame.retain(Math.max(bytes, this.#frame.used));
}

/** Private association lets stream constructors use client resources without expanding the public API. */
export class ClientResources {
    static readonly #clients: WeakMap<NexaClient, ClientResourceState> = new WeakMap();

    /** Registers once; network messages cannot select or replace this authority. */
    public static register(client: NexaClient, input: InboundCapacity, streamLimit: number): void {
        if (ClientResources.#clients.has(client)) {
            throw new Error('Client resources are already registered');
        }
        ClientResources.#clients.set(client, new ClientResourceState(input, streamLimit));
    }

    /** Returns immutable accounting authority without keeping a strong client reference. */
    public static input(client: NexaClient): InboundCapacity {
        return ClientResources.#state(client).input;
    }

    /** Acquires one slot across both the convenience API and direct stream constructors. */
    public static stream(client: NexaClient, id: string): () => void {
        return ClientResources.#state(client).acquire(id);
    }

    /** Captures resource state only, so completed queues do not retain disposed clients. */
    public static retainer(client: NexaClient): (bytes: number) => BinaryInputReservation {
        return ClientResources.#state(client).retain;
    }

    /** Limits a decoded frame's borrowing scope to synchronous callback dispatch. */
    public static route<T>(
        client: NexaClient,
        credit: BinaryInputReservation,
        operation: () => T,
    ): T {
        return ClientResources.#state(client).route(credit, operation);
    }

    /** An unregistered object cannot bypass host-established resource accounting. */
    static #state(client: NexaClient): ClientResourceState {
        const state: ClientResourceState | undefined = ClientResources.#clients.get(client);
        if (state === undefined) {
            throw new Error('Client resource authority is unavailable');
        }
        return state;
    }
}
