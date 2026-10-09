// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowValue } from '../WorkflowTypes.js';
import { MappingType } from './MappingTypes.js';
import { MappingValues } from './MappingValues.js';

/** Explicit authoring conversion is separate from implicit runtime coercion. */
export class MappingLiteral {
    public static parse(text: string, type: MappingType): WorkflowValue {
        if (text.length > 4000) {
            throw new Error('Literal values are limited to 4,000 characters.');
        }
        if (type === MappingType.Text) {
            return text;
        }
        if (type === MappingType.Json) {
            const raw: unknown = JSON.parse(text);
            const value: WorkflowValue = MappingValues.validate(raw);
            if (MappingValues.hasSecret(value)) {
                throw new Error('Do not store secret fields in a mapping literal.');
            }
            return value;
        }
        if (type === MappingType.Boolean) {
            if (text === 'true') {
                return true;
            }
            if (text === 'false') {
                return false;
            }
            throw new Error('Choose true or false.');
        }
        const value: number = Number(text);
        if (
            text.trim() === '' ||
            !Number.isFinite(value) ||
            (Number.isInteger(value) && !Number.isSafeInteger(value)) ||
            (type === MappingType.Integer && !Number.isSafeInteger(value))
        ) {
            throw new Error(
                'Enter a safely represented ' +
                    type.toLowerCase() +
                    '. Store large IDs and financial amounts as Text.',
            );
        }
        return value;
    }
    public static display(value: WorkflowValue, type: MappingType): string {
        if (value === null) {
            return 'null';
        }
        return type === MappingType.Json
            ? JSON.stringify(MappingValues.redact(value))
            : MappingValues.display(value);
    }
    public static empty(type: MappingType): WorkflowValue {
        return type === MappingType.Text
            ? ''
            : type === MappingType.Boolean
              ? false
              : type === MappingType.Json
                ? {}
                : 0;
    }
}
