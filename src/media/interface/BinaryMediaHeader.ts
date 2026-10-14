// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DeliveredAttachment } from '../../protocol/Protocol.js';

/** Validated known NXMD fields; arbitrary untrusted metadata never becomes application properties. */
export interface BinaryMediaHeader {
    readonly attachment: DeliveredAttachment;
    readonly streamId?: string;
    readonly sessionId?: string;
}
