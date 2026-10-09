// SPDX-License-Identifier: Apache-2.0
export const ChargeKind = {
    /** Model tokens. */
    Completion: 'completion',
    /** An embedding call. */
    Embedding: 'embedding',
    /** Text-to-speech. */
    Speech: 'speech',
    /** Speech-to-text. */
    Transcription: 'transcription',
    /** Image / video generation. */
    Media: 'media',
    /** A metered tool or third-party API call. */
    Tool: 'tool',
    /** A manual adjustment: a top-up, a refund, a correction. */
    Adjustment: 'adjustment',
} as const;
export type ChargeKind = (typeof ChargeKind)[keyof typeof ChargeKind];
