// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it, vi } from 'vitest';
import { EmotionWatches } from '../src/networking/EmotionWatches.js';
import type { EmotionWatchSource } from '../src/networking/EmotionWatch.js';
import type { EmotionalSnapshot } from '../src/protocol/Protocol.js';

/** One pending RPC exposes cancellation and controlled reply ordering. */
interface EmotionRead {
    readonly signal: AbortSignal;
    readonly resolve: (state: EmotionalSnapshot) => void;
    readonly reject: (error: Error) => void;
}

/** The fixture supplies decoded server replies without a second network or an unbounded test queue. */
class WatchSource implements EmotionWatchSource {
    public readonly reads: EmotionRead[] = [];
    public readonly listenerErrors: Error[] = [];

    /** Cancellation releases the fixture's wait just as the actual client's RPC abort does. */
    public readonly read: EmotionWatchSource['read'] = (
        _agentId: string | undefined,
        signal: AbortSignal,
    ): Promise<EmotionalSnapshot> =>
        new Promise<EmotionalSnapshot>((resolve, reject): void => {
            const abort: () => void = (): void => reject(new Error('Read aborted'));
            signal.addEventListener('abort', abort, { once: true });
            this.reads.push({
                signal,
                resolve: (state: EmotionalSnapshot): void => {
                    signal.removeEventListener('abort', abort);
                    resolve(state);
                },
                reject: (error: Error): void => {
                    signal.removeEventListener('abort', abort);
                    reject(error);
                },
            });
        });

    /** Consumer exceptions do not own the watched state or other views. */
    public readonly notify: EmotionWatchSource['notify'] = (operation: () => void): void => {
        try {
            operation();
        } catch (error: unknown) {
            this.listenerErrors.push(error instanceof Error ? error : new Error('Listener failed'));
        }
    };
}

/** Each reply is a separate server snapshot, including the time projection used for display. */
function snapshot(mood: EmotionalSnapshot['mood'] = 'steady'): EmotionalSnapshot {
    return {
        agentId: 'nexa',
        asOf: '2026-10-18T12:10:00.000Z',
        updatedAt: '2026-10-18T12:00:00.000Z',
        mood,
        moodValence: 0,
        moodEnergy: 0.35,
        emotions: { gratitude: 0, hurt: 0, frustration: 0, concern: 0, curiosity: 0, joy: 0 },
        towardUser: { warmth: 0.5, trust: 0.5, caution: 0 },
        awareness: {
            kind: 'functional',
            subjectiveExperience: 'unverified',
            values: ['honesty'],
            description: 'Functional state',
        },
    };
}

afterEach((): void => {
    vi.useRealTimers();
});

it('does not replay an old successful snapshot to a new view after a read fails', async (): Promise<void> => {
    vi.useFakeTimers();
    const source: WatchSource = new WatchSource();
    const watches: EmotionWatches = new EmotionWatches(source);
    const errors: Error[] = [];
    watches.subscribe('nexa', {
        state: (): void => {},
        error: (error: Error): void => {
            errors.push(error);
        },
    });
    source.reads[0]?.resolve(snapshot('warm'));
    await vi.advanceTimersByTimeAsync(0);
    watches.refresh();
    source.reads[1]?.reject(new Error('State unavailable'));
    await vi.advanceTimersByTimeAsync(0);
    const states: EmotionalSnapshot[] = [];
    watches.subscribe('nexa', {
        state: (state: EmotionalSnapshot): void => {
            states.push(state);
        },
        error: (): void => {},
    });
    expect(errors).toHaveLength(1);
    expect(states).toEqual([]);
    expect(source.reads).toHaveLength(3);
    source.reads[2]?.resolve(snapshot('guarded'));
    await vi.advanceTimersByTimeAsync(0);
    expect(states.map((state: EmotionalSnapshot): string => state.mood)).toEqual(['guarded']);
    watches.clear();
});

it('shares one read and timer across views, coalesces in-flight invalidations and freezes shared state', async (): Promise<void> => {
    vi.useFakeTimers();
    const source: WatchSource = new WatchSource();
    const watches: EmotionWatches = new EmotionWatches(source);
    const first: EmotionalSnapshot[] = [];
    const second: EmotionalSnapshot[] = [];
    const errors: Error[] = [];
    const stopFirst: () => void = watches.subscribe(undefined, {
        state: (state: EmotionalSnapshot): void => {
            first.push(state);
        },
        error: (error: Error): void => {
            errors.push(error);
        },
    });
    const stopSecond: () => void = watches.subscribe(undefined, {
        state: (state: EmotionalSnapshot): void => {
            second.push(state);
        },
        error: (error: Error): void => {
            errors.push(error);
        },
    });
    expect(source.reads).toHaveLength(1);
    watches.refresh();
    watches.refresh();
    source.reads[0]?.resolve(snapshot('guarded'));
    await vi.advanceTimersByTimeAsync(0);
    expect(source.reads).toHaveLength(2);
    source.reads[1]?.resolve(snapshot('warm'));
    await vi.advanceTimersByTimeAsync(0);
    expect(first.map((state: EmotionalSnapshot): string => state.mood)).toEqual([
        'guarded',
        'warm',
    ]);
    expect(second).toEqual(first);
    expect(vi.getTimerCount()).toBe(1);
    expect(first[0]).toBe(second[0]);
    const published: EmotionalSnapshot | undefined = first[0];
    if (published === undefined) {
        throw new Error('Missing published emotional state');
    }
    expect(Reflect.set(published.emotions, 'hurt', 1)).toBe(false);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(source.reads).toHaveLength(3);
    stopFirst();
    stopFirst();
    expect(source.reads[2]?.signal.aborted).toBe(false);
    stopSecond();
    expect(source.reads[2]?.signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(watches.active).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(errors).toEqual([]);
});

it('pauses without polling while disconnected, replaces stale replies and releases all resources on close', async (): Promise<void> => {
    vi.useFakeTimers();
    const source: WatchSource = new WatchSource();
    const watches: EmotionWatches = new EmotionWatches(source);
    const states: EmotionalSnapshot[] = [];
    const errors: Error[] = [];
    watches.subscribe('nexa', {
        state: (state: EmotionalSnapshot): void => {
            states.push(state);
        },
        error: (error: Error): void => {
            errors.push(error);
        },
    });
    watches.pause(new Error('Disconnected'));
    expect(source.reads[0]?.signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(90_000);
    expect(source.reads).toHaveLength(1);
    expect(errors).toHaveLength(1);
    watches.resume();
    source.reads[1]?.resolve(snapshot('warm'));
    await vi.advanceTimersByTimeAsync(0);
    expect(states.map((state: EmotionalSnapshot): string => state.mood)).toEqual(['warm']);
    watches.clear();
    await vi.advanceTimersByTimeAsync(90_000);
    expect(source.reads).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(0);
});

it('bounds subscriptions and keeps a bad consumer from preventing delivery to other views', async (): Promise<void> => {
    vi.useFakeTimers();
    const source: WatchSource = new WatchSource();
    const watches: EmotionWatches = new EmotionWatches(source);
    const states: EmotionalSnapshot[] = [];
    for (let index: number = 0; index < 32; index++) {
        watches.subscribe('nexa', {
            state:
                index === 0
                    ? (): never => {
                          throw new Error('Consumer failed');
                      }
                    : (state: EmotionalSnapshot): void => {
                          states.push(state);
                      },
            error: (): void => {},
        });
    }
    expect(() =>
        watches.subscribe('nexa', { state: (): void => {}, error: (): void => {} }),
    ).toThrow();
    source.reads[0]?.resolve(snapshot());
    await vi.advanceTimersByTimeAsync(0);
    expect(states).toHaveLength(31);
    expect(source.listenerErrors[0]?.message).toBe('Consumer failed');
    for (let index: number = 0; index < 7; index++) {
        watches.subscribe(`other-${index}`, { state: (): void => {}, error: (): void => {} });
    }
    expect(() =>
        watches.subscribe('too-many', { state: (): void => {}, error: (): void => {} }),
    ).toThrow();
    watches.clear();
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.getTimerCount()).toBe(0);
});
