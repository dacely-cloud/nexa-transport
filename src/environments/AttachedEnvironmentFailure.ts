// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { AttachedEnvironmentErrorCode } from 'nexa-protocol/environments/AttachedEnvironmentTypes.js';

/**
 * Thrown by an attached environment handler to answer with an error result.
 *
 * @remarks
 * `not-found` reports a missing path or program, `denied` a refusal, and `failed` anything else.
 * Any other error a handler throws is answered as `failed` with its message.
 */
export class AttachedEnvironmentFailure extends Error {
    /** The error code sent to Nexa. */
    public readonly code: AttachedEnvironmentErrorCode;

    /** Describes why the operation did not run or did not finish. */
    public constructor(code: AttachedEnvironmentErrorCode, message: string) {
        super(message);
        this.name = 'AttachedEnvironmentFailure';
        this.code = code;
    }
}
