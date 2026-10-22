// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { Method, type ParamsOf, type ResultOf } from '../protocol/Protocol.js';
import type { CallOptions } from '../interface/ClientOptions.js';
import type { NexaClient } from './NexaClient.js';
import { TransportError, TransportErrorCode } from './TransportError.js';

/** Only read operations whose admission refusal guarantees that no file bytes were sent. */
export type SessionArchiveMethod =
    Method.SessionsTranscript | Method.SessionsFiles | Method.SessionsDownload;

/** Retries tagged archive overload within one deadline without replaying accepted transfers. */
export class SessionArchiveRequests {
    /** Ownership, quota, connection and transfer failures remain immediate failures. */
    public static async call<M extends SessionArchiveMethod>(
        client: Pick<NexaClient, 'call'>,
        method: M,
        params: ParamsOf<M>,
        options: CallOptions = {},
    ): Promise<ResultOf<M>> {
        const timeout: number = options.timeoutMs ?? 60_000;
        if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 2_147_483_647) {
            throw new RangeError('Invalid archive request timeout');
        }
        const end: bigint = BigInt(Date.now()) + BigInt(timeout);
        let delay: number = 100;
        for (;;) {
            options.signal?.throwIfAborted();
            const remaining: bigint = end - BigInt(Date.now());
            if (remaining <= 0n) {
                throw new TransportError(TransportErrorCode.Timeout, 'Archive request timed out');
            }
            try {
                return await client.call(method, params, {
                    ...options,
                    timeoutMs: Number(remaining),
                });
            } catch (cause: unknown) {
                if (
                    !(cause instanceof TransportError) ||
                    cause.remote?.code !== 'rate-limit' ||
                    cause.remote.details?.['kind'] !== 'conversation-lookup-busy'
                ) {
                    throw cause;
                }
                const left: bigint = end - BigInt(Date.now());
                if (left <= 0n) {
                    throw cause;
                }
                await this.#wait(Math.min(delay, Number(left)), options.signal);
                delay = Math.min(1000, delay * 2);
            }
        }
    }

    static #wait(delay: number, signal?: AbortSignal): Promise<void> {
        signal?.throwIfAborted();
        return new Promise<void>((resolve, reject): void => {
            const finish: () => void = (): void => {
                signal?.removeEventListener('abort', abort);
                resolve();
            };
            const abort: () => void = (): void => {
                clearTimeout(timer);
                signal?.removeEventListener('abort', abort);
                const reason: unknown = signal?.reason;
                reject(
                    reason instanceof Error
                        ? reason
                        : new TransportError(
                              TransportErrorCode.Aborted,
                              'Archive request cancelled',
                          ),
                );
            };
            const timer: ReturnType<typeof setTimeout> = setTimeout(finish, delay);
            signal?.addEventListener('abort', abort, { once: true });
        });
    }
}
