// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type {
    JsonValue,
    SessionHistoryRecord,
    ResultOf,
    Method,
    SessionFilePage,
} from '../protocol/Protocol.js';

/** A validated envelope retaining the complete JSON payload. */
export interface GatewayEvent {
    /** Catalogued event name; new server events remain observable. */
    readonly event: string;
    /** Server-supplied JSON, preserved without stripping fields. */
    readonly data: JsonValue;
    /** Monotonic per-connection sequence. */
    readonly seq: bigint;
}

/** Missing event range: refresh affected session state. */
export interface SequenceGap {
    /** Next expected event. */
    readonly expected: bigint;
    /** Actual event received. */
    readonly received: bigint;
}

/** A live mono PCM16 frame decoded from the binary transport. */
export interface ReceivedAudio {
    readonly callId: string;
    readonly sampleRate: number;
    readonly data: Uint8Array<ArrayBuffer>;
}

/** A replacement hypothesis or settled caller utterance, scoped to its call. */
export interface ReceivedTranscript {
    readonly callId: string;
    readonly text: string;
    /** False replaces the current hypothesis; true appends a settled utterance. */
    readonly final: boolean;
}

/** Validated journal records and the complete boundary of this history read. */
export interface SavedHistorySnapshot {
    /** Original validated records in journal order. */
    readonly records: readonly SessionHistoryRecord[];
    /** Complete byte boundary for the next incremental read. */
    readonly endCursor: string;
}

/** Saved history, live tasks and downloadable files for a subscribed session. */
export interface SessionSnapshot {
    readonly messages: ResultOf<Method.SessionsMessages>;
    readonly tasks: ResultOf<Method.TasksList>;
    readonly files: SessionFilePage['files'];
    /** Full presentation events when supported by the gateway. */
    readonly history?: readonly SessionHistoryRecord[];
}
