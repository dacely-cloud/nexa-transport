// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Portable feature contract for runtimes with a direct native base64 encoder. */
export interface Base64ByteSource {
    /** Byte capacity common to older and newer runtimes. */
    readonly byteLength: number;
    /** Encodes directly without a full intermediate binary string when supported. */
    readonly toBase64?: () => string;
}
