// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from './WorkflowInput.js';
import type { WorkflowValue, WorkflowObject } from './WorkflowTypes.js';

/** Detached canonical JSON with explicit depth, count, and content budgets. */
export class WorkflowJson {
    #values: number = 0;
    #characters: number = 0;
    /** Parses component data; execution schemas are a separate registry validation gate. */
    public static object(raw: unknown): WorkflowObject {
        return new WorkflowJson().#object(raw, 0);
    }
    #value(raw: unknown, depth: number): WorkflowValue {
        this.#values += 1;
        if (depth > 32 || this.#values > 100_000) {
            throw new Error('Workflow configuration is too deeply nested or has too many values');
        }
        if (raw === null || typeof raw === 'boolean') {
            return raw;
        }
        if (typeof raw === 'string') {
            this.#text(raw);
            if (raw.startsWith('data:') && raw.includes(';base64,')) {
                throw new Error('Use managed artifact references instead of inline media');
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
            return WorkflowInput.list(raw, 10_000, (entry: unknown): WorkflowValue =>
                this.#value(entry, depth + 1),
            );
        }
        return this.#object(raw, depth);
    }
    #object(raw: unknown, depth: number): WorkflowObject {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.object(raw);
        const keys: string[] = Object.keys(value).sort();
        if (keys.length > 10_000) {
            throw new Error('Too many workflow configuration fields');
        }
        const entries: [string, WorkflowValue][] = [];
        for (const key of keys) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                throw new Error('Unsafe workflow configuration key');
            }
            this.#text(key);
            entries.push([key, this.#value(value[key], depth + 1)]);
        }
        return Object.freeze(Object.fromEntries(entries));
    }
    #text(value: string): void {
        this.#characters += value.length;
        if (value.length > 32 * 1024 * 1024 || this.#characters > 64 * 1024 * 1024) {
            throw new Error(
                'Workflow configuration exceeds its content budget; use a managed artifact',
            );
        }
    }
}
