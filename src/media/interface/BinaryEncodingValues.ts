// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Literal wire encodings, kept in a named shape for explicit annotation. */
export interface BinaryEncodingValues {
    /** A canonical base64 string in the JSON-facing protocol. */
    readonly Base64: 'base64';
    /** An ordered array of byte numbers in the JSON-facing protocol. */
    readonly Array: 'array';
    /** A raw disk-upload chunk, without JSON expansion. */
    readonly Bytes: 'bytes';
}
