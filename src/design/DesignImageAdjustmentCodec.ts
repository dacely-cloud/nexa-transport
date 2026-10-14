// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import {
    DesignImageAdjustmentField,
    type DesignImageAdjustments,
} from './DesignImageAdjustmentTypes.js';

/** Closed finite image controls never accept CSS filters, URLs or executable fields. */
export class DesignImageAdjustmentCodec {
    /** The original image is unchanged when adjustment metadata is absent, null or neutral. */
    public static readonly neutral: DesignImageAdjustments = Object.freeze({
        exposure: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        highlights: 0,
        shadows: 0,
    });

    /** Canonical records contain every control; omitted input controls default to neutral. */
    public static parse(raw: unknown): DesignImageAdjustments {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            Object.values(DesignImageAdjustmentField),
            [],
        );
        return {
            exposure: this.#scalar(value['exposure']),
            contrast: this.#scalar(value['contrast']),
            saturation: this.#scalar(value['saturation']),
            temperature: this.#scalar(value['temperature']),
            tint: this.#scalar(value['tint']),
            highlights: this.#scalar(value['highlights']),
            shadows: this.#scalar(value['shadows']),
        };
    }

    static #scalar(value: unknown): number {
        return V.number(value === undefined ? 0 : value, -1, 1);
    }

    /** A scalar patch retains all other adjustments and rejects empty edits before mutation. */
    public static changes(raw: unknown): Partial<DesignImageAdjustments> {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            Object.values(DesignImageAdjustmentField),
            [],
        );
        if (Object.keys(value).length === 0) {
            throw new Error('Supply an image adjustment.');
        }
        const result: Partial<DesignImageAdjustments> = {};
        for (const field of Object.values(DesignImageAdjustmentField)) {
            if (value[field] !== undefined) {
                Object.assign(result, { [field]: V.number(value[field], -1, 1) });
            }
        }
        return result;
    }
}
