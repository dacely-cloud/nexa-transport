// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';

/** Host editing operations act on the current native focus without accepting target ids. */
export const RobloxTextEditKind = {
    Insert: 'Insert',
    Selection: 'Selection',
    Key: 'Key',
} as const;
/** Supported logical editing keys; complete physical keyboard routing is separate. */
export const RobloxTextEditKey = {
    Left: 'Left',
    Right: 'Right',
    Home: 'Home',
    End: 'End',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Return: 'Return',
    Escape: 'Escape',
} as const;
/** Known editing-key values. */
export type RobloxTextEditKey = (typeof RobloxTextEditKey)[keyof typeof RobloxTextEditKey];
/** Inserted Unicode text replaces the native selection or inserts at its cursor. */
export interface RobloxTextInsertion {
    readonly kind: typeof RobloxTextEditKind.Insert;
    readonly text: string;
}
/** Selection positions are one-based UTF-8 bytes; -1 removes the anchor. */
export interface RobloxTextSelection {
    readonly kind: typeof RobloxTextEditKind.Selection;
    readonly cursor: number;
    readonly selectionStart: number;
}
/** A complete logical key gesture emits native Begin/End with one real InputObject. */
export interface RobloxTextKeyGesture {
    readonly kind: typeof RobloxTextEditKind.Key;
    readonly key: RobloxTextEditKey;
    readonly shift?: boolean;
}
/** The same edit contract is consumed by tools, native processes and the gateway. */
export type RobloxTextEditRequest =
    RobloxTextInsertion | RobloxTextSelection | RobloxTextKeyGesture;

/** Portable trust-boundary validation for a bounded native text edit. */
export class RobloxTextEdit {
    /** Rejects unknown fields, fake target hints, invalid offsets and unsupported keys. */
    public static parse(raw: unknown): RobloxTextEditRequest {
        if (raw === null || typeof raw !== 'object' || !('kind' in raw)) {
            throw new Error('Invalid native text edit');
        }
        if (raw.kind === RobloxTextEditKind.Insert) {
            const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
                'kind',
                'text',
            ]);
            const text: string = RobloxSceneCodec.text(fields['text'], 4096, true);
            return Object.freeze({ kind: RobloxTextEditKind.Insert, text });
        }
        if (raw.kind === RobloxTextEditKind.Selection) {
            const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
                'kind',
                'cursor',
                'selectionStart',
            ]);
            const selectionStart: number = RobloxSceneCodec.number(
                fields['selectionStart'],
                -1,
                16385,
                true,
            );
            if (selectionStart === 0) {
                throw new Error('Text selection starts at byte 1 or -1');
            }
            return Object.freeze({
                kind: RobloxTextEditKind.Selection,
                cursor: RobloxSceneCodec.number(fields['cursor'], 1, 16385, true),
                selectionStart,
            });
        }
        if (raw.kind === RobloxTextEditKind.Key) {
            const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
                raw,
                ['kind', 'key'],
                ['shift'],
            );
            const key: RobloxTextEditKey = this.#key(fields['key']);
            if (fields['shift'] !== undefined && typeof fields['shift'] !== 'boolean') {
                throw new Error('Text key shift must be boolean');
            }
            return Object.freeze({
                kind: RobloxTextEditKind.Key,
                key,
                shift: fields['shift'] === true,
            });
        }
        throw new Error('Unsupported native text edit');
    }
    static #key(raw: unknown): RobloxTextEditKey {
        for (const key of Object.values(RobloxTextEditKey)) {
            if (key === raw) {
                return key;
            }
        }
        throw new Error('Unsupported native editing key');
    }
}
