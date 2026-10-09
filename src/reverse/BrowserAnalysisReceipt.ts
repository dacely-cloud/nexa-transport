// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { BrowserAnalysisInput } from '../protocol/Protocol.js';
import { BrowserSourcesReceipt } from './BrowserSourcesReceipt.js';
import { BrowserSourcesValues } from './BrowserSourcesValues.js';

/** Preserves the original source identity separately from the derived static analysis input. */
export class BrowserAnalysisReceipt {
    /** Validates body-free provenance before displaying specialist progress or reading source pages. */
    public static snapshot(
        value: BrowserAnalysisInput,
        childRunId: string,
        sessionId?: string,
    ): void {
        const {
            sourceRunSha256,
            manifestSha256,
            manifestBytes,
            exportedFiles,
            importMap,
            ...source
        }: BrowserAnalysisInput = value;
        BrowserSourcesReceipt.snapshot(source, source.reference.runId, sessionId);
        if (importMap !== undefined) {
            this.#map(importMap);
        }
        if (
            source.reference.runId === childRunId ||
            !source.includeSources ||
            source.coverage.capturedSources === '0' ||
            !BrowserSourcesValues.hash(sourceRunSha256) ||
            !BrowserSourcesValues.hash(manifestSha256) ||
            !BrowserSourcesValues.count(manifestBytes, 67108864n) ||
            manifestBytes === '0' ||
            !BrowserSourcesValues.count(exportedFiles, BigInt(source.coverage.capturedSources)) ||
            exportedFiles === '0'
        ) {
            throw new RangeError('Invalid captured browser analysis provenance');
        }
    }
    static #map(value: NonNullable<BrowserAnalysisInput['importMap']>): void {
        if (
            Object.keys(value).some(
                (key: string): boolean => !['selector', 'baseUrl', 'sha256', 'bytes'].includes(key),
            ) ||
            !value.selector.startsWith('nexa-import-map-') ||
            !value.selector.endsWith('.json') ||
            !BrowserSourcesValues.uuid(value.selector.slice(16, -5)) ||
            !BrowserSourcesValues.hash(value.sha256) ||
            !BrowserSourcesValues.count(value.bytes, 4194304n) ||
            value.bytes === '0' ||
            value.baseUrl.length > 8192 ||
            !value.baseUrl.isWellFormed()
        ) {
            throw new RangeError('Invalid selected analysis import map');
        }
        const base: URL = new URL(value.baseUrl);
        if (
            !['http:', 'https:'].includes(base.protocol) ||
            base.username !== '' ||
            base.password !== '' ||
            base.href !== value.baseUrl
        ) {
            throw new RangeError('Invalid selected import map base URL');
        }
    }
}
