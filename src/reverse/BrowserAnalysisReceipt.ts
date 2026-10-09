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
            ...source
        }: BrowserAnalysisInput = value;
        BrowserSourcesReceipt.snapshot(source, source.reference.runId, sessionId);
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
}
