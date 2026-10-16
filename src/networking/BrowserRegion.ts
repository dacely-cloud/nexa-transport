// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { UserRegion } from '../protocol/Protocol.js';

/** Coarse browser preferences only; never requests GPS, IP lookup, or browser permission. */
export class BrowserRegion {
    public static read(): UserRegion | undefined {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') {
            return undefined;
        }
        let locale: string | undefined;
        let timeZone: string | undefined;
        try {
            locale = new Intl.Locale(navigator.language).baseName;
        } catch {
            /** Optional locale unavailable. */
        }
        try {
            timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            /** Optional timezone unavailable. */
        }
        if (locale === undefined && timeZone === undefined) {
            return undefined;
        }
        return {
            ...(locale === undefined ? {} : { locale }),
            ...(timeZone === undefined ? {} : { timeZone }),
        };
    }
}
