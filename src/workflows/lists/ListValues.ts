// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { MappingPaths } from '../mapping/MappingPaths.js';
import type { MappingRead } from '../mapping/MappingTypes.js';
import { ScalarConversion, ConversionKind } from '../ScalarConversion.js';
import { WorkflowJson } from '../WorkflowJson.js';
import type { WorkflowValue } from '../WorkflowTypes.js';
import { ListValueType } from './ListTypes.js';

/** Explicit key extraction and homogeneous comparisons shared by list operations. */
export class ListValues {
    /** Empty pointer means the entire item; missing and null are never collapsed. */
    public static read(item: WorkflowValue, path: string): MappingRead {
        return path === ''
            ? { value: item, missing: false, redacted: false }
            : MappingPaths.read(item, path);
    }
    /** Missing keys fail unless the selected predicate explicitly asks about their absence. */
    public static key(item: WorkflowValue, path: string): WorkflowValue {
        const read: MappingRead = this.read(item, path);
        if (read.missing) {
            throw new Error('Selected field is missing. Use an Exists filter first.');
        }
        if (read.redacted) {
            throw new Error('Secret fields cannot be used as list keys.');
        }
        return read.value;
    }
    /** Canonical object key ordering supports deterministic deep equality and deduplication. */
    public static identity(value: WorkflowValue): string {
        return JSON.stringify(WorkflowJson.object({ value })['value']);
    }
    /** No implicit text-to-number conversion occurs when sorting or comparing. */
    public static comparable(
        value: WorkflowValue,
        type: ListValueType,
    ): string | number | boolean | bigint {
        if (type === ListValueType.Integer) {
            if (typeof value !== 'string') {
                throw new Error('Integer values must be exact decimal text.');
            }
            return BigInt(String(ScalarConversion.convert(ConversionKind.Integer, value)));
        }
        if (typeof value !== type || value === null || typeof value === 'object') {
            throw new Error(
                'Expected ' + type + '; null and other value types cannot be compared.',
            );
        }
        if (
            typeof value === 'number' &&
            (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))
        ) {
            throw new Error('Number loses precision. Use exact integer text.');
        }
        return value;
    }
    /** UTF-16 code-unit ordering is independent of server locale; ties retain source order. */
    public static compare(a: WorkflowValue, b: WorkflowValue, type: ListValueType): number {
        const left: string | number | boolean | bigint = this.comparable(a, type);
        const right: string | number | boolean | bigint = this.comparable(b, type);
        return left < right ? -1 : left > right ? 1 : 0;
    }
}
