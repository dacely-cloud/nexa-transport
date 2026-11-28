// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type {
    AttachedEnvironmentExecResult,
    AttachedEnvironmentResult,
} from 'nexa-protocol/environments/AttachedEnvironmentTypes.js';

/**
 * Fits answers inside the wire schema and one gateway frame.
 *
 * @remarks
 * Command output keeps its end, where failures usually are, and says how much was dropped. A file
 * or listing too large for one frame becomes a `failed` answer instead of a frame the gateway
 * would refuse, so the waiting operation always learns what happened.
 */
export class AttachedEnvironmentResults {
    /** Schema limit of one output stream, in characters. */
    public static readonly maximumOutputChars: number = 16_000_000;
    /** Schema limit of base64 file data, in characters. */
    public static readonly maximumDataChars: number = 64_000_000;
    /** Schema limit of one directory listing. */
    public static readonly maximumEntries: number = 100_000;
    /** Bytes reserved for the request envelope around the answer. */
    static readonly #envelope: number = 1024;
    static readonly #encoder: TextEncoder = new TextEncoder();

    /** The answer, reduced where needed to fit `frameBytes`. */
    public static fit(
        result: AttachedEnvironmentResult,
        frameBytes: number,
    ): AttachedEnvironmentResult {
        const budget: number = Math.max(0, frameBytes - AttachedEnvironmentResults.#envelope);
        switch (result.kind) {
            case 'exec':
                return AttachedEnvironmentResults.#exec(result, budget);
            case 'read':
                return result.data.length >
                    Math.min(budget, AttachedEnvironmentResults.maximumDataChars)
                    ? AttachedEnvironmentResults.#tooLarge(
                          `The file is ${String(Math.floor((result.data.length * 3) / 4))} bytes, more than one ${String(frameBytes)}-byte gateway frame can carry`,
                      )
                    : result;
            case 'list':
                return result.entries.length > AttachedEnvironmentResults.maximumEntries ||
                    AttachedEnvironmentResults.#bytes(JSON.stringify(result)) > budget
                    ? AttachedEnvironmentResults.#tooLarge(
                          `The directory has ${String(result.entries.length)} entries, more than one answer can carry`,
                      )
                    : result;
            case 'error':
                return {
                    kind: 'error',
                    code: result.code,
                    message: result.message.slice(0, 4000),
                };
            case 'done':
            case 'stat':
                return result;
        }
    }

    static #exec(
        result: AttachedEnvironmentExecResult,
        budget: number,
    ): AttachedEnvironmentExecResult {
        const signal: string | null = result.signal === null ? null : result.signal.slice(0, 64);
        let stdout: string = AttachedEnvironmentResults.#tail(
            result.stdout,
            AttachedEnvironmentResults.maximumOutputChars,
        );
        let stderr: string = AttachedEnvironmentResults.#tail(
            result.stderr,
            AttachedEnvironmentResults.maximumOutputChars,
        );
        const fixed: number = 256 + (signal?.length ?? 0);
        if ((stdout.length + stderr.length) * 6 + fixed <= budget) {
            return { ...result, signal, stdout, stderr };
        }
        const available: number = Math.max(0, budget - fixed);
        for (;;) {
            const out: number = AttachedEnvironmentResults.#bytes(JSON.stringify(stdout));
            const err: number = AttachedEnvironmentResults.#bytes(JSON.stringify(stderr));
            if (out + err <= available || (stdout.length === 0 && stderr.length === 0)) {
                return { ...result, signal, stdout, stderr };
            }
            if (out >= err) {
                stdout = AttachedEnvironmentResults.#shrink(stdout, out, available, err);
            } else {
                stderr = AttachedEnvironmentResults.#shrink(stderr, err, available, out);
            }
        }
    }

    /** Shortens the larger stream to what the other leaves, never below half of the budget. */
    static #shrink(text: string, bytes: number, available: number, other: number): string {
        const target: number = Math.max(available / 2, available - other);
        return AttachedEnvironmentResults.#tail(
            text,
            Math.min(text.length - 1, Math.floor((text.length * target * 0.95) / bytes)),
        );
    }

    /** The last `limit` characters, prefixed with how many were dropped. */
    static #tail(text: string, limit: number): string {
        if (text.length <= limit) {
            return text;
        }
        let kept: number = limit;
        let marker: string = '';
        for (;;) {
            marker = `[${String(text.length - kept)} earlier characters omitted]\n`;
            if (kept + marker.length <= limit) {
                break;
            }
            kept = limit - marker.length;
            if (kept <= 0) {
                return '';
            }
        }
        let start: number = text.length - kept;
        const unit: number = text.charCodeAt(start);
        if (unit >= 0xdc00 && unit <= 0xdfff) {
            start += 1;
        }
        return marker + text.slice(start);
    }

    static #bytes(text: string): number {
        return AttachedEnvironmentResults.#encoder.encode(text).byteLength;
    }

    static #tooLarge(message: string): AttachedEnvironmentResult {
        return { kind: 'error', code: 'failed', message };
    }
}
