// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { Base64DecodeResult } from './Base64DecodeResult.js';

/** Portable feature detection contract for runtimes with a native base64 byte writer. */
export interface Base64ByteTarget {
    /** Available destination capacity shared by older and newer byte-view APIs. */
    readonly byteLength: number;
    /** Writes prevalidated canonical base64 when the runtime exposes this optional API. */
    readonly setFromBase64?: (value: string) => Base64DecodeResult;
}
