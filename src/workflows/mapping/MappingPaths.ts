// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowValue, WorkflowObject } from '../WorkflowTypes.js';
import { isMappingObject, type MappingRead } from './MappingTypes.js';

/** JSON pointers retain exact keys; prototype paths and unbounded traversal are rejected. */
export class MappingPaths {
    public static segments(path: string): readonly string[] {
        if (path === '' || !path.startsWith('/') || path.length > 300 || /~(?![01])/u.test(path)) {
            throw new Error('Use a JSON pointer such as /record/site.');
        }
        const parts: readonly string[] = path
            .slice(1)
            .split('/')
            .map((part: string): string => part.replaceAll('~1', '/').replaceAll('~0', '~'));
        if (
            parts.length > 10 ||
            parts.some(
                (part: string): boolean =>
                    part === '' || ['__proto__', 'prototype', 'constructor'].includes(part),
            )
        ) {
            throw new Error('This path is empty, unsafe or deeper than ten fields.');
        }
        return parts;
    }
    public static secret(key: string): boolean {
        return (
            /password|passwd|secret|authorization|cookie|api[_-]?key|private[_-]?key/iu.test(key) ||
            /token(?:[_-]?(?:value|secret))?$/iu.test(key)
        );
    }
    public static read(root: WorkflowValue, path: string): MappingRead {
        const parts: readonly string[] = this.segments(path);
        let value: WorkflowValue = root;
        for (const part of parts) {
            if (this.secret(part)) {
                return { value: null, missing: false, redacted: true };
            }
            if (value === null || typeof value !== 'object' || !Object.hasOwn(value, part)) {
                return { value: null, missing: true, redacted: false };
            }
            if (this.#list(value)) {
                if (!/^(0|[1-9][0-9]*)$/u.test(part)) {
                    return { value: null, missing: true, redacted: false };
                }
                const item: WorkflowValue | undefined = value[Number(part)];
                if (item === undefined) {
                    return { value: null, missing: true, redacted: false };
                }
                value = item;
            } else if (isMappingObject(value)) {
                value = value[part] ?? null;
            }
        }
        return { value, missing: false, redacted: false };
    }
    public static overlaps(left: string, right: string): boolean {
        const a: readonly string[] = this.segments(left);
        const b: readonly string[] = this.segments(right);
        return a
            .slice(0, Math.min(a.length, b.length))
            .every((part: string, index: number): boolean => part === b[index]);
    }
    public static write(root: WorkflowObject, path: string, value: WorkflowValue): void {
        const parts: readonly string[] = this.segments(path);
        let target: WorkflowObject = root;
        for (let index: number = 0; index < parts.length; index += 1) {
            const part: string | undefined = parts[index];
            if (part === undefined) {
                throw new Error('Destination field missing.');
            }
            if (index === parts.length - 1) {
                Reflect.set(target, part, value);
                return;
            }
            const next: WorkflowValue | undefined = Object.hasOwn(target, part)
                ? target[part]
                : undefined;
            if (next !== undefined && !isMappingObject(next)) {
                throw new Error('A parent destination is already a scalar value.');
            }
            const child: WorkflowObject = next !== undefined && isMappingObject(next) ? next : {};
            Reflect.set(target, part, child);
            target = child;
        }
    }
    static #list(value: WorkflowValue): value is readonly WorkflowValue[] {
        return Array.isArray(value);
    }
    public static encode(key: string): string {
        return key.replaceAll('~', '~0').replaceAll('/', '~1');
    }
}
