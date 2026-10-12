// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignTypographyStyleCodec } from './DesignTypographyStyleCodec.js';
import type { DesignTypographyChanges } from './DesignOperationTypes.js';

/** Base typography and saved-style overrides share one source-free scalar contract. */
export class DesignTypographyChangesCodec {
    /** Empty patches, text replacement and unsupported properties remain invalid. */
    public static parse(raw: unknown): DesignTypographyChanges {
        return DesignTypographyStyleCodec.changes(raw);
    }
}
