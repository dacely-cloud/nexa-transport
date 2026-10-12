// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues } from './DesignValues.js';

/** Font display names cannot be arbitrary CSS expressions. */
export class DesignFontFamilyCodec {
    /** All typography boundaries use the same bounded family-name rules. */
    public static family(raw: unknown): string {
        const family: string = DesignValues.text(raw, 96);
        if (!/^[\p{L}\p{N} ._-]+$/u.test(family)) {
            throw new Error('Invalid design font family');
        }
        return family;
    }
}
