// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignFailure, DesignFailureReason } from './DesignFailure.js';

/** Explicit SVG validation failures are recoverable input errors, including in asynchronous conversion. */
export class DesignSvgInputError extends DesignFailure {
    /** Bound source-derived diagnostics without exposing unrelated decoder, publisher or storage errors. */
    public constructor(message: string) {
        super(
            DesignFailureReason.Invalid,
            message.length > 512 ? message.slice(0, 509) + '...' : message,
        );
        this.name = 'DesignSvgInputError';
    }
}
