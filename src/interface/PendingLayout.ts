// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { OfficeLayoutState } from '../office/OfficeProtocol.js';

/** One correlated layout response and its bounded waiting lifetime. */
export interface PendingLayout {
    readonly resolve: (state: OfficeLayoutState) => void;
    readonly reject: (error: Error) => void;
    readonly timer: ReturnType<typeof setTimeout>;
}
