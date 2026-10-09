// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    BrowserStoragePage,
    BrowserStorageSnapshot,
    ReverseBrowserReference,
} from '../protocol/Protocol.js';
import { reverseBrowserStorage } from '../protocol/Validators.js';
import { BrowserStorageReceipt } from './BrowserStorageReceipt.js';

/** Validates gateway provenance alongside the native portable storage contract. */
export class BrowserStorageGatewayReceipt {
    /** Untrusted saved pages must match the schema, exact fields and selected row continuity. */
    public static read(input: unknown): BrowserStoragePage {
        if (
            !reverseBrowserStorage(input) ||
            Object.keys(input).some(
                (key: string): boolean =>
                    ![
                        'runId',
                        'sha256',
                        'evidenceId',
                        'captureSha256',
                        'metadata',
                        'group',
                        'cursor',
                        'nextCursor',
                        'rows',
                    ].includes(key),
            )
        ) {
            throw new TypeError('Invalid saved browser storage page');
        }
        BrowserStorageReceipt.page(input);
        return input;
    }
    /** Progress contains only metadata tied to the current run and original conversation. */
    public static snapshot(value: BrowserStorageSnapshot, runId: string, sessionId?: string): void {
        const { reference, ...metadata }: BrowserStorageSnapshot = value;
        BrowserStorageReceipt.metadata(metadata);
        const source: ReverseBrowserReference = reference;
        if (
            Object.keys(source).length !== 4 ||
            Object.keys(source).some(
                (key: string): boolean =>
                    !['sessionId', 'runId', 'evidenceId', 'captureSha256'].includes(key),
            ) ||
            source.runId !== runId ||
            !this.#uuid(source.runId) ||
            !this.#uuid(source.evidenceId) ||
            !/^[a-f0-9]{64}$/u.test(source.captureSha256) ||
            source.sessionId.length < 1 ||
            source.sessionId.length > 1024 ||
            (sessionId !== undefined && source.sessionId !== sessionId)
        ) {
            throw new TypeError('Browser storage progress references a foreign capture');
        }
    }
    static #uuid(value: string): boolean {
        return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u.test(value);
    }
}
