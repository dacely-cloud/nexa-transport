// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowObject, WorkflowValue } from './WorkflowTypes.js';

/** Portable template validation shared by the editor, admission and execution. */
export class WorkflowTemplateFields {
    /** Returns unique safe paths, rejecting executable and prototype expressions. */
    public static paths(template: string): readonly string[] {
        const paths: Set<string> = new Set();
        let count: number = 0;
        for (const match of template.matchAll(/\{\{([^{}]*)\}\}/gu)) {
            count += 1;
            if (count > 100_000) {
                throw new Error('Workflow template exceeds 100,000 substitutions');
            }
            const path: string = this.path(match[1] ?? '');
            paths.add(path);
        }
        return [...paths];
    }
    /** Normalizes a named object path without allowing calls or prototype access. */
    public static path(raw: string): string {
        const path: string = raw.trim();
        if (!/^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/u.test(path)) {
            throw new Error('Template fields must be named object paths');
        }
        if (
            path
                .split('.')
                .some((key: string): boolean =>
                    ['__proto__', 'prototype', 'constructor'].includes(key),
                )
        ) {
            throw new Error(`Template field is unavailable: ${path}`);
        }
        return path;
    }
    /** Resolves own JSON fields; null, false, zero and empty text remain valid values. */
    public static value(values: WorkflowObject, path: string): WorkflowValue {
        let value: WorkflowValue = values;
        for (const key of this.path(path).split('.')) {
            if (!this.#object(value) || !Object.hasOwn(value, key)) {
                throw new Error(
                    `Template field is unavailable: ${path}. Provide it in Template values or connect an input containing it.`,
                );
            }
            const next: WorkflowValue | undefined = value[key];
            if (next === undefined) {
                throw new Error(`Template field is missing: ${path}`);
            }
            value = next;
        }
        return value;
    }
    static #object(value: WorkflowValue): value is WorkflowObject {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }
    /** Checks supplied values without allocating an expanded template. */
    public static validate(template: string, values: WorkflowObject): void {
        for (const path of this.paths(template)) {
            this.value(values, path);
        }
    }
}
