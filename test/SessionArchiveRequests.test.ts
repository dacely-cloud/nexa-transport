// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it, type Mock, vi } from 'vitest';
import type { NexaClient } from '../src/networking/NexaClient.js';
import { SessionArchiveRequests } from '../src/networking/SessionArchiveRequests.js';
import { TransportError, TransportErrorCode } from '../src/networking/TransportError.js';
import { Method, type SessionHistoryPage } from '../src/protocol/Protocol.js';

/** A gateway refusal issued before protected work or binary delivery starts. */
function busy(): TransportError {
    return new TransportError(TransportErrorCode.Remote, 'Archive queue full', {
        code: 'rate-limit',
        retryable: true,
        message: 'Archive queue full',
        details: { kind: 'conversation-lookup-busy' },
    });
}

it('retries only refused archive admission and preserves the original deadline', async (): Promise<void> => {
    vi.useFakeTimers();
    const call: Mock<NexaClient['call']> = vi
        .fn<NexaClient['call']>()
        .mockRejectedValueOnce(busy())
        .mockResolvedValueOnce({ format: 1, chunk: '', endCursor: '0' });
    try {
        const pending: Promise<SessionHistoryPage> = SessionArchiveRequests.call(
            { call },
            Method.SessionsTranscript,
            { id: 'chat' },
            { timeoutMs: 1000 },
        );
        await vi.advanceTimersByTimeAsync(100);
        expect(await pending).toEqual({ format: 1, chunk: '', endCursor: '0' });
        expect(call).toHaveBeenCalledTimes(2);
        expect(call.mock.calls[1]?.[2]?.timeoutMs).toBe(900);
    } finally {
        vi.useRealTimers();
    }
});

it('cancels admission backoff without making another request', async (): Promise<void> => {
    const call: Mock<NexaClient['call']> = vi.fn<NexaClient['call']>().mockRejectedValue(busy());
    const controller: AbortController = new AbortController();
    const pending: Promise<SessionHistoryPage> = SessionArchiveRequests.call(
        { call },
        Method.SessionsTranscript,
        { id: 'chat' },
        { signal: controller.signal },
    );
    const rejected: Promise<void> = expect(pending).rejects.toThrow('selection changed');
    await Promise.resolve();
    controller.abort(new Error('selection changed'));
    await rejected;
    expect(call).toHaveBeenCalledTimes(1);
});

it('ends repeated overload at the total deadline and removes its backoff timer', async (): Promise<void> => {
    vi.useFakeTimers();
    const call: Mock<NexaClient['call']> = vi.fn<NexaClient['call']>().mockRejectedValue(busy());
    try {
        const pending: Promise<SessionHistoryPage> = SessionArchiveRequests.call(
            { call },
            Method.SessionsTranscript,
            { id: 'chat' },
            { timeoutMs: 150 },
        );
        const rejected: Promise<void> = expect(pending).rejects.toMatchObject({ code: 'timeout' });
        await vi.advanceTimersByTimeAsync(150);
        await rejected;
        expect(call).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
    } finally {
        vi.useRealTimers();
    }
});

it.each(['not-found', 'auth', 'forbidden', 'rate-limit', 'timeout'] as const)(
    'never retries an untagged %s error or replays a potentially started transfer',
    async (code): Promise<void> => {
        const refusal: TransportError = new TransportError(TransportErrorCode.Remote, 'Refused', {
            code,
            retryable: false,
            message: 'Refused',
        });
        const call: Mock<NexaClient['call']> = vi
            .fn<NexaClient['call']>()
            .mockRejectedValue(refusal);
        await expect(
            SessionArchiveRequests.call({ call }, Method.SessionsDownload, {
                id: 'chat',
                attachmentId: 'file',
            }),
        ).rejects.toBe(refusal);
        expect(call).toHaveBeenCalledTimes(1);
    },
);
