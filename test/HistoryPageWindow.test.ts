// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { HistoryPageWindow } from '../src/networking/HistoryPageWindow.js';
import type { SessionHistoryPage } from '../src/protocol/Protocol.js';

it('preserves an actual RPC error and normalizes arbitrary thrown boundary values', async (): Promise<void> => {
    const error: Error = new Error('RPC unavailable');
    const original: HistoryPageWindow = new HistoryPageWindow(
        (): Promise<SessionHistoryPage> => {
            throw error;
        },
        'saved',
        1,
    );
    const arbitrary: HistoryPageWindow = new HistoryPageWindow(
        (): Promise<SessionHistoryPage> => {
            throw 'external failure';
        },
        'saved',
        1,
    );
    try {
        await expect(original.read('0')).rejects.toBe(error);
        await expect(arbitrary.read('0')).rejects.toMatchObject({
            message: 'History page request failed',
            cause: 'external failure',
        });
    } finally {
        original.close();
        arbitrary.close();
    }
});

it('handles oversized speculative replies before their ordered turn', async (): Promise<void> => {
    const window: HistoryPageWindow = new HistoryPageWindow(
        (): Promise<SessionHistoryPage> =>
            Promise.resolve({
                format: 1,
                endCursor: '3',
                chunk: 'A'.repeat(Math.ceil(HistoryPageWindow.pageBytes / 3) * 4 + 1),
            }),
        'saved',
        2,
    );
    try {
        window.prefetch('1', '3', 1n);
        await expect(window.read('2', '3')).rejects.toThrow(
            'History page exceeds requested byte limit',
        );
        await expect(window.read('1', '3')).rejects.toThrow(
            'History page exceeds requested byte limit',
        );
    } finally {
        window.close();
    }
});

it.each([0, 17, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid speculative concurrency %s',
    (concurrency: number): void => {
        expect(
            (): HistoryPageWindow =>
                new HistoryPageWindow(
                    (): Promise<SessionHistoryPage> =>
                        Promise.resolve({
                            format: 1,
                            endCursor: '0',
                            chunk: '',
                        }),
                    'saved',
                    concurrency,
                ),
        ).toThrow('Invalid history page concurrency');
    },
);
