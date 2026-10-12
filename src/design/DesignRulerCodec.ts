// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignRulerAxis, type DesignGuideValue, type DesignRulerGuide } from './DesignTypes.js';

/** Detached guide records are bounded, finite and unique within their page. */
export class DesignRulerCodec {
    /** One atomic guide edit has a closed payload and a world coordinate. */
    public static value(raw: unknown): DesignGuideValue {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['axis', 'position']);
        return {
            axis: V.choice(value['axis'], Object.values(DesignRulerAxis)),
            position: V.number(value['position'], -100000, 100000),
        };
    }
    /** Pages admit at most 256 unique guide identities. */
    public static guides(raw: unknown): readonly DesignRulerGuide[] {
        const seen: Set<string> = new Set();
        return V.list(raw, 256, (entry: unknown): DesignRulerGuide => {
            const value: Readonly<Record<string, unknown>> = V.record(entry, [
                'id',
                'axis',
                'position',
            ]);
            const id: string = V.id(value['id']);
            if (seen.has(id)) {
                throw new Error('Duplicate page guide identity: ' + id);
            }
            seen.add(id);
            return { id, ...this.value({ axis: value['axis'], position: value['position'] }) };
        });
    }
}
