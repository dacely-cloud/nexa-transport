// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it, vi } from 'vitest';
import { BrowserRegion } from '../src/networking/BrowserRegion.js';

afterEach((): void => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

it('does not infer the user location from a server runtime', (): void => {
    vi.stubGlobal('window', undefined);
    expect(BrowserRegion.read()).toBeUndefined();
});

it('reads coarse browser hints without assigning a country from English', (): void => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', { language: 'en-US' });
    const original: Intl.ResolvedDateTimeFormatOptions = Intl.DateTimeFormat().resolvedOptions();
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
        ...original,
        timeZone: 'Europe/London',
    });
    expect(BrowserRegion.read()).toEqual({ locale: 'en-US', timeZone: 'Europe/London' });
});
