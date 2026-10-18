// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { EmotionWatch, type EmotionWatchSource, type EmotionListener } from './EmotionWatch.js';
import { TransportError, TransportErrorCode } from './TransportError.js';

/** One client shares emotional reads between views without starting a second transport or a server broadcast. */
export class EmotionWatches {
    readonly #watches: Map<string | undefined, EmotionWatch> = new Map();

    /** The owning client supplies validated account-scoped RPCs and callback error isolation. */
    public constructor(public readonly source: EmotionWatchSource) {}

    /** Empty clients skip emotional event inspection on the hot text-stream path. */
    public get active(): boolean {
        return this.#watches.size > 0;
    }

    /** At most eight agents and 32 views per agent can retain timers or listener state. */
    public subscribe(agentId: string | undefined, listener: EmotionListener): () => void {
        if (agentId !== undefined && (agentId.length === 0 || agentId.length > 256)) {
            throw new TypeError('Invalid emotional state agent');
        }
        let watch: EmotionWatch | undefined = this.#watches.get(agentId);
        if (watch === undefined) {
            if (this.#watches.size >= 8) {
                throw new TransportError(
                    TransportErrorCode.Limit,
                    'Too many emotional state subscriptions',
                );
            }
            watch = new EmotionWatch(agentId, this.source);
            this.#watches.set(agentId, watch);
        }
        watch.add(listener);
        const reference: WeakRef<EmotionWatch> = new WeakRef(watch);
        const callback: WeakRef<EmotionListener> = new WeakRef(listener);
        const registry: WeakRef<Map<string | undefined, EmotionWatch>> = new WeakRef(this.#watches);
        return (): void => {
            const owned: EmotionWatch | undefined = reference.deref();
            const entry: EmotionListener | undefined = callback.deref();
            if (owned === undefined || entry === undefined) {
                return;
            }
            owned.remove(entry);
            if (owned.size === 0 && registry.deref()?.get(agentId) === owned) {
                registry.deref()?.delete(agentId);
            }
        };
    }

    /** Reaction and completion events invalidate every watched agent because their wire payload lacks agent identity. */
    public refresh(): void {
        for (const watch of [...this.#watches.values()]) {
            watch.refresh();
        }
    }

    /** Stops reads while retaining views for the client's existing reconnect lifecycle. */
    public pause(error: Error): void {
        for (const watch of [...this.#watches.values()]) {
            watch.pause(error);
        }
    }

    /** A restored connection replaces all retained views with fresh account-scoped reads. */
    public resume(): void {
        for (const watch of [...this.#watches.values()]) {
            watch.resume();
        }
    }

    /** Clears all owned timers, pending reads and callbacks on permanent client termination. */
    public clear(): void {
        for (const watch of this.#watches.values()) {
            watch.close();
        }
        this.#watches.clear();
    }
}
