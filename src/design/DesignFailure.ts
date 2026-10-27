// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Expected persistence failures can be exposed without leaking database diagnostics. */
export const DesignFailureReason = {
    Missing: 'missing',
    Conflict: 'conflict',
    Invalid: 'invalid',
    Unchanged: 'unchanged',
    InsertParent: 'insert-parent',
    InsertIndex: 'insert-index',
    History: 'history',
} as const;
/** Public failure category. */
export type DesignFailureReason = (typeof DesignFailureReason)[keyof typeof DesignFailureReason];
/** Server-only typed failure with a safe message and optional revision. */
export class DesignFailure extends Error {
    /** Records safe metadata independently of underlying database failures. */
    public constructor(
        public readonly reason: DesignFailureReason,
        message: string,
        public readonly actualRevision: string | null = null,
    ) {
        super(message);
    }
}
