// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: Apache-2.0

import { SchemaValues } from '../SchemaValues.js';
import { Schemas } from '../Schemas.js';
import type { WorkflowObject, WorkflowValue } from '../WorkflowTypes.js';
import { MappingType, isMappingObject, type MappingSourceField } from './MappingTypes.js';
import { MappingPaths } from './MappingPaths.js';

interface MappingVisitBudget {
    remaining: number;
}

/** Bounded sample inspection is separate from mapping configuration and execution output. */
export class MappingValues {
    public static validate(raw: unknown): WorkflowValue {
        const value: WorkflowValue = this.#narrow(raw, 0, { remaining: 1000 });
        if (SchemaValues.inspect(Schemas.json, value).length > 0) {
            throw new Error('Expected a bounded JSON value.');
        }
        return value;
    }
    static #narrow(raw: unknown, depth: number, budget: MappingVisitBudget): WorkflowValue {
        budget.remaining -= 1;
        if (budget.remaining < 0) {
            throw new Error('Samples are limited to 1,000 values.');
        }
        if (depth > 10) {
            throw new Error('Sample nesting exceeds ten levels.');
        }
        if (raw === null || typeof raw === 'boolean') {
            return raw;
        }
        if (typeof raw === 'string') {
            if (raw.length > 4000) {
                throw new Error('Sample text exceeds 4,000 characters.');
            }
            return raw;
        }
        if (
            typeof raw === 'number' &&
            Number.isFinite(raw) &&
            (!Number.isInteger(raw) || Number.isSafeInteger(raw))
        ) {
            return raw;
        }
        if (Array.isArray(raw)) {
            if (raw.length > 100) {
                throw new Error('Samples are limited to 100 values.');
            }
            return raw.map((value: unknown): WorkflowValue =>
                this.#narrow(value, depth + 1, budget),
            );
        }
        if (raw !== null && typeof raw === 'object') {
            const keys: readonly string[] = Object.keys(raw);
            if (keys.length > 100) {
                throw new Error('Samples are limited to 100 named fields.');
            }
            const value: WorkflowObject = {};
            for (const key of keys) {
                if (['__proto__', 'prototype', 'constructor'].includes(key)) {
                    throw new Error('Unsafe sample key.');
                }
                Reflect.set(value, key, this.#narrow(Reflect.get(raw, key), depth + 1, budget));
            }
            return value;
        }
        throw new Error('Unsupported JSON value.');
    }
    public static type(value: WorkflowValue): string {
        return value === null
            ? 'Null'
            : typeof value === 'string'
              ? MappingType.Text
              : typeof value === 'boolean'
                ? MappingType.Boolean
                : typeof value === 'number'
                  ? Number.isInteger(value)
                      ? MappingType.Integer
                      : MappingType.Number
                  : MappingType.Json;
    }
    public static matches(value: WorkflowValue, type: MappingType): boolean {
        return (
            type === MappingType.Json ||
            (type === MappingType.Text
                ? typeof value === 'string'
                : type === MappingType.Boolean
                  ? typeof value === 'boolean'
                  : typeof value === 'number' &&
                    Number.isFinite(value) &&
                    (type !== MappingType.Integer || Number.isSafeInteger(value)))
        );
    }
    public static redact(value: WorkflowValue): WorkflowValue {
        if (value === null || typeof value !== 'object') {
            return value;
        }
        if (Array.isArray(value)) {
            return value.map((item: WorkflowValue): WorkflowValue => this.redact(item));
        }
        if (!isMappingObject(value)) {
            return null;
        }
        return Object.fromEntries(
            Object.entries(value).map(
                ([key, item]: [string, WorkflowValue]): [string, WorkflowValue] => [
                    key,
                    MappingPaths.secret(key) ? '[Redacted]' : this.redact(item),
                ],
            ),
        );
    }
    public static hasSecret(value: WorkflowValue): boolean {
        if (value === null || typeof value !== 'object') {
            return false;
        }
        if (Array.isArray(value)) {
            return value.some((item: WorkflowValue): boolean => this.hasSecret(item));
        }
        return (
            isMappingObject(value) &&
            Object.entries(value).some(
                ([key, item]: [string, WorkflowValue]): boolean =>
                    MappingPaths.secret(key) || this.hasSecret(item),
            )
        );
    }
    public static preview(value: WorkflowValue): string {
        const text: string = JSON.stringify(this.redact(value), null, 2);
        return text.length > 4000
            ? text.slice(0, 4000) + '\n… Preview truncated at 4,000 characters.'
            : text;
    }
    public static display(value: WorkflowValue): string {
        const safe: WorkflowValue = this.redact(value);
        const text: string = typeof safe === 'string' ? safe : JSON.stringify(safe);
        return text.length > 240 ? text.slice(0, 237) + '…' : text;
    }
    public static fields(value: WorkflowValue): readonly MappingSourceField[] {
        const fields: MappingSourceField[] = [];
        const walk: (item: WorkflowValue, path: string, depth: number) => void = (
            item: WorkflowValue,
            path: string,
            depth: number,
        ): void => {
            if (depth > 10 || fields.length >= 100) {
                return;
            }
            if (path !== '') {
                fields.push({ path, type: this.type(item), value: this.display(item) });
            }
            if (item !== null && typeof item === 'object') {
                for (const [key, nested] of Object.entries(item)) {
                    if (!MappingPaths.secret(key)) {
                        walk(nested, path + '/' + MappingPaths.encode(key), depth + 1);
                    }
                }
            }
        };
        walk(value, '', 0);
        return fields;
    }
}
