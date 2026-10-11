// SPDX-License-Identifier: Apache-2.0
import type { Font, FontCollection } from 'fontkit';

/** Fontkit's browser entry accepts Uint8Array; its upstream types only declare Node Buffer. */
declare module 'fontkit' {
    export function create(buffer: Uint8Array, postscriptName?: string): Font | FontCollection;
}
