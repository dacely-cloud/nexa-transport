// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { EmotionalSnapshot } from '../protocol/Protocol.js';

/** Application callbacks belong to one view of the authenticated user's feelings. */
export interface EmotionListener {
    readonly state: (snapshot: EmotionalSnapshot) => void;
    readonly error: (error: Error) => void;
}

/** Client-owned transport operations are released when the last emotional view closes. */
export interface EmotionWatchSource {
    readonly read: (agentId: string | undefined, signal: AbortSignal) => Promise<EmotionalSnapshot>;
    readonly notify: (operation: () => void) => void;
}

/** One agent's views share a bounded, non-overlapping read and an idle decay refresh timer. */
export class EmotionWatch {
    readonly #listeners: Set<EmotionListener> = new Set();
    #source: EmotionWatchSource | undefined;
    #snapshot: EmotionalSnapshot | undefined;
    #controller: AbortController | undefined;
    #timer: ReturnType<typeof setTimeout> | undefined;
    #dirty: boolean = false;
    #paused: boolean = false;

    /** The caller's connection supplies identity; the selected agent never selects a user. */
    public constructor(
        public readonly agentId: string | undefined,
        source: EmotionWatchSource,
    ) {
        this.#source = source;
    }

    /** A bounded listener count also bounds one update's callback work. */
    public get size(): number {
        return this.#listeners.size;
    }

    /** Additional views reuse the current read or cached snapshot rather than issuing duplicate RPCs. */
    public add(listener: EmotionListener): void {
        if (this.#source === undefined || this.#listeners.size >= 32) {
            throw new Error('Emotional subscription is closed or has too many listeners');
        }
        this.#listeners.add(listener);
        if (this.#snapshot !== undefined && !this.#paused) {
            const snapshot: EmotionalSnapshot = this.#snapshot;
            this.#source.notify((): void => listener.state(snapshot));
        } else if (this.#controller === undefined) {
            this.refresh();
        }
    }

    /** Removing the final view synchronously stops polling, aborts waiting and releases callbacks. */
    public remove(listener: EmotionListener): void {
        this.#listeners.delete(listener);
        if (this.#listeners.size === 0) {
            this.close();
        }
    }

    /** Events arriving during a read schedule one follow-up so a reaction cannot be lost to a stale reply. */
    public refresh(): void {
        if (this.#paused || this.#source === undefined || this.#listeners.size === 0) {
            return;
        }
        clearTimeout(this.#timer);
        this.#timer = undefined;
        if (this.#controller !== undefined) {
            this.#dirty = true;
            return;
        }
        const controller: AbortController = new AbortController();
        this.#controller = controller;
        this.#dirty = false;
        void this.#read(controller, this.#source);
    }

    /** A disconnected socket owns no polling timer or pending emotional request. */
    public pause(error: Error): void {
        if (this.#paused) {
            return;
        }
        this.#paused = true;
        this.#cancel();
        this.#snapshot = undefined;
        this.#errors(error);
    }

    /** Reconnection always reads current authoritative state rather than replaying an earlier expression. */
    public resume(): void {
        this.#paused = false;
        this.refresh();
    }

    /** Permanent disposal also releases client-capturing source callbacks held by returned unsubscribe functions. */
    public close(): void {
        this.#paused = true;
        this.#cancel();
        this.#listeners.clear();
        this.#snapshot = undefined;
        this.#source = undefined;
    }

    async #read(controller: AbortController, source: EmotionWatchSource): Promise<void> {
        try {
            const snapshot: EmotionalSnapshot = await source.read(this.agentId, controller.signal);
            if (controller.signal.aborted || this.#source !== source) {
                return;
            }
            this.#snapshot = EmotionWatch.#freeze(snapshot);
            for (const listener of [...this.#listeners]) {
                if (this.#listeners.has(listener) && !controller.signal.aborted) {
                    source.notify((): void => listener.state(snapshot));
                }
            }
        } catch (error: unknown) {
            if (!controller.signal.aborted && this.#source === source) {
                this.#errors(
                    error instanceof Error ? error : new Error('Emotional state read failed'),
                );
            }
        } finally {
            if (this.#controller === controller) {
                this.#controller = undefined;
                if (this.#dirty) {
                    this.refresh();
                } else if (
                    !this.#paused &&
                    this.#source !== undefined &&
                    this.#listeners.size > 0
                ) {
                    this.#timer = setTimeout((): void => this.refresh(), 30_000);
                    if (typeof this.#timer === 'object') {
                        this.#timer.unref();
                    }
                }
            }
        }
    }

    #errors(error: Error): void {
        const source: EmotionWatchSource | undefined = this.#source;
        for (const listener of [...this.#listeners]) {
            if (source !== undefined && this.#listeners.has(listener)) {
                source.notify((): void => listener.error(error));
            }
        }
    }

    #cancel(): void {
        clearTimeout(this.#timer);
        this.#timer = undefined;
        this.#controller?.abort();
        this.#controller = undefined;
        this.#dirty = false;
    }

    static #freeze(snapshot: EmotionalSnapshot): EmotionalSnapshot {
        Object.freeze(snapshot.emotions);
        Object.freeze(snapshot.towardUser);
        for (const memory of snapshot.recentMemories) {
            Object.freeze(memory);
        }
        Object.freeze(snapshot.recentMemories);
        Object.freeze(snapshot.awareness.values);
        Object.freeze(snapshot.awareness);
        return Object.freeze(snapshot);
    }
}
