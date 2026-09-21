import { getEventListeners } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PendingRequests } from '../src/networking/PendingRequests.js';
import { EventStream } from '../src/networking/EventStream.js';
import { BinaryChunks, type BinaryChunkBudget } from '../src/media/BinaryChunks.js';
import { BinaryEnvelope } from '../src/media/BinaryEnvelope.js';
import { NexaMedia } from '../src/media/NexaMedia.js';

afterEach((): void => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('RPC resource cleanup', (): void => {
    it.each(['resolve', 'reject', 'abort', 'timeout', 'close'] as const)(
        'releases timers, abort listeners and queue ownership on %s',
        async (action): Promise<void> => {
            vi.useFakeTimers();
            const requests: PendingRequests = new PendingRequests(1);
            const controller: AbortController = new AbortController();
            const cleanup = vi.fn();
            const pending = requests.create('1', { signal: controller.signal }, 100, cleanup);
            const observed = pending.catch((error: unknown): unknown => error);
            expect(getEventListeners(controller.signal, 'abort')).toHaveLength(1);
            switch (action) {
                case 'resolve':
                    requests.resolve('1', 'ok');
                    break;
                case 'reject':
                    requests.reject('1', new Error('failure'));
                    break;
                case 'abort':
                    controller.abort();
                    break;
                case 'timeout':
                    await vi.advanceTimersByTimeAsync(100);
                    break;
                case 'close':
                    requests.close(new Error('closed'));
                    break;
            }
            await observed;
            requests.reject('1', new Error('late failure'));
            expect(cleanup).toHaveBeenCalledTimes(1);
            expect(requests.has('1')).toBe(false);
            expect(getEventListeners(controller.signal, 'abort')).toHaveLength(0);
            expect(vi.getTimerCount()).toBe(0);
            const next = requests.create('2', {}, 100);
            requests.resolve('2', 'reused');
            expect(await next).toBe('reused');
        },
    );
    it('does not create timers or listeners for refused or pre-aborted calls', async (): Promise<void> => {
        vi.useFakeTimers();
        const requests: PendingRequests = new PendingRequests(1);
        const first = requests.create('first', {}, 100);
        const controller: AbortController = new AbortController();
        await expect(
            requests.create('overflow', { signal: controller.signal }, 100),
        ).rejects.toThrow('Too many');
        expect(getEventListeners(controller.signal, 'abort')).toHaveLength(0);
        expect(vi.getTimerCount()).toBe(1);
        requests.resolve('first', null);
        await first;
        controller.abort();
        await expect(
            requests.create('aborted', { signal: controller.signal }, 100),
        ).rejects.toThrow('aborted');
        expect(getEventListeners(controller.signal, 'abort')).toHaveLength(0);
        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('event queue ownership', (): void => {
    it('enforces bytes as well as event count and reuses consumed space', async (): Promise<void> => {
        const queue: EventStream<string> = new EventStream(2, 4);
        queue.push('abc', 3);
        expect(() => queue.push('de', 2)).toThrow('fell behind');
        expect((await queue.next()).value).toBe('abc');
        queue.push('de', 2);
        queue.push('fg', 2);
        expect(() => queue.push('', 0)).toThrow('fell behind');
        await queue.return();
        expect((await queue.next()).done).toBe(true);
    });
    it('releases waiting consumers on failure or return', async (): Promise<void> => {
        const failed: EventStream<string> = new EventStream();
        const waiting = failed.next();
        failed.end(new Error('closed'));
        await expect(waiting).rejects.toThrow('closed');
        const returned: EventStream<string> = new EventStream();
        const next = returned.next();
        await returned.return();
        expect((await next).done).toBe(true);
    });
    it('discards buffered values on failure and ignores late producers', async (): Promise<void> => {
        const queue: EventStream<string> = new EventStream();
        queue.push('retained', 8);
        queue.end(new Error('closed'));
        queue.push('late', 4);
        await expect(queue.next()).rejects.toThrow('closed');
    });
});

describe('binary transfer accounting', (): void => {
    it.each(['complete', 'cancel', 'clear', 'timeout', 'invalid'] as const)(
        'returns the full allocation on %s',
        async (action): Promise<void> => {
            vi.useFakeTimers();
            const reserve = vi.fn((_bytes: number): boolean => true);
            const release = vi.fn((_bytes: number): void => {});
            const budget: BinaryChunkBudget = { reserve, release };
            const chunks: BinaryChunks = new BinaryChunks(budget);
            const frames = [...BinaryChunks.split(new Uint8Array(1024), 512)];
            const first = frames[0];
            const second = frames[1];
            if (first === undefined || second === undefined) {
                throw new Error('Missing chunks');
            }
            expect(chunks.accept(first.buffer)).toBeNull();
            switch (action) {
                case 'complete':
                    expect(chunks.accept(second.buffer)?.byteLength).toBe(1024);
                    break;
                case 'cancel':
                    chunks.accept(BinaryChunks.cancel(first).buffer);
                    break;
                case 'clear':
                    chunks.clear();
                    break;
                case 'timeout':
                    await vi.advanceTimersByTimeAsync(30_000);
                    break;
                case 'invalid':
                    expect(() => chunks.accept(first.buffer)).toThrow();
                    break;
            }
            chunks.clear();
            expect(reserve).toHaveBeenCalledExactlyOnceWith(1024);
            expect(release).toHaveBeenCalledExactlyOnceWith(1024);
            expect(vi.getTimerCount()).toBe(0);
        },
    );
    it('does not allocate or release an unreserved transfer', (): void => {
        const release = vi.fn();
        const chunks: BinaryChunks = new BinaryChunks({ reserve: (): boolean => false, release });
        const frame = [...BinaryChunks.split(new Uint8Array(1024))][0];
        if (frame === undefined) {
            throw new Error('Missing frame');
        }
        expect(() => chunks.accept(frame.buffer)).toThrow('memory budget');
        expect(release).not.toHaveBeenCalled();
    });
});

describe('media allocation limits', (): void => {
    it('rejects excess binary fields before decoding their bytes', (): void => {
        const text: string = JSON.stringify(Array.from({ length: 129 }, () => ({ pcm: 'AQID' })));
        const decode = vi.spyOn(globalThis, 'atob');
        expect(() => BinaryEnvelope.encode(text)).toThrow('Too many binary fields');
        expect(decode).toHaveBeenCalledTimes(128);
    });
    it('rejects binary-to-JSON expansion before allocating a number array', (): void => {
        const encoded = BinaryEnvelope.encode(
            JSON.stringify({ voice: Array<number>(1024).fill(255) }),
        );
        if (encoded === null) {
            throw new Error('Missing envelope');
        }
        const arrays = vi.spyOn(Array, 'from');
        expect(() => BinaryEnvelope.decode(encoded.buffer, 65536, 1024)).toThrow(
            'Decoded binary JSON exceeds limit',
        );
        expect(arrays).not.toHaveBeenCalled();
    });
    it('bounds base64 expansion and preserves exact-limit round trips', (): void => {
        const original = { pcm: 'AQID'.repeat(1024) };
        const encoded = BinaryEnvelope.encode(JSON.stringify(original));
        if (encoded === null) {
            throw new Error('Missing envelope');
        }
        const length: number = new TextEncoder().encode(JSON.stringify(original)).length;
        expect(() => BinaryEnvelope.decode(encoded.buffer, 65536, length - 1)).toThrow(
            'Decoded binary JSON exceeds limit',
        );
        expect(BinaryEnvelope.decode(encoded.buffer, 65536, length)).toEqual(original);
    });
    it('does not allocate millions of key strings to measure a byte array', (): void => {
        const values: number[] = [0, 127, 255];
        const keys = vi.spyOn(Object, 'keys');
        const bytes = NexaMedia.bytes(values);
        expect(keys).not.toHaveBeenCalled();
        expect(bytes).toEqual(new Uint8Array(values));
        const sparse: number[] = new Array<number>(3);
        sparse[0] = 0;
        sparse[2] = 255;
        expect(() => NexaMedia.bytes(sparse)).toThrow();
    });
});
