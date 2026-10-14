// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0
import { RobloxSceneCodec } from './RobloxSceneCodec';
/** Keyboard repetition reuses a held input; pointer gestures have no Repeat phase. */
export const RobloxKeyboardPhase = {
    Press: 'Press',
    Release: 'Release',
    Cancel: 'Cancel',
    Repeat: 'Repeat',
} as const;
/** Allowed phases for native held-key commands. */
export type RobloxKeyboardPhase = (typeof RobloxKeyboardPhase)[keyof typeof RobloxKeyboardPhase];

/** A physical key remains held until its matching release or cancellation. */
export interface RobloxKeyboardGesture {
    readonly phase: RobloxKeyboardPhase;
    readonly key: string;
}
/** Portable boundary validation; the native VM resolves the actual reflected KeyCode. */
export class RobloxKeyboardInput {
    /** Keyboard routing accepts no node ids, focus hints, text or client ownership fields. */
    public static parse(raw: unknown): RobloxKeyboardGesture {
        const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
            'phase',
            'key',
        ]);
        const phase: RobloxKeyboardPhase = this.#phase(fields['phase']);
        const key: string = RobloxSceneCodec.text(fields['key'], 64);
        if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(key)) {
            throw new Error('Keyboard gestures require a reflected KeyCode name');
        }
        return Object.freeze({ phase, key });
    }
    static #phase(raw: unknown): RobloxKeyboardPhase {
        for (const phase of Object.values(RobloxKeyboardPhase)) {
            if (raw === phase) {
                return phase;
            }
        }
        throw new Error('Invalid native keyboard phase');
    }
}
