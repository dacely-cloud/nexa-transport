// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowValue } from '../WorkflowTypes.js';
import {
    MappingIssueKind,
    type MappingInput,
    type MappingRead,
    type MappingReference,
    type MappingExpressionResult,
    type MappingVariable,
} from './MappingTypes.js';
import { MappingPaths } from './MappingPaths.js';
import { MappingValues } from './MappingValues.js';

/** Deliberately small declarative grammar; no JavaScript or dynamic function evaluation. */
export class MappingExpressions {
    public static reference(text: string): MappingReference {
        const index: number = text.indexOf(':');
        const slot: string = text.slice(0, index).trim();
        const path: string = text.slice(index + 1).trim();
        if (index < 1 || !/^[a-z][a-z0-9_-]{0,63}$/u.test(slot)) {
            throw new Error('Name the input and path, such as source:/record/site.');
        }
        MappingPaths.segments(path);
        return { slot, path };
    }
    public static read(
        reference: MappingReference,
        inputs: readonly MappingInput[],
    ): MappingExpressionResult {
        const input: MappingInput | undefined = inputs.find(
            (item: MappingInput): boolean => item.slot === reference.slot,
        );
        if (input === undefined) {
            return this.#failure(
                MappingIssueKind.Missing,
                'Named input ' + reference.slot + ' is unavailable.',
            );
        }
        const read: MappingRead = MappingPaths.read(input.sample, reference.path);
        if (MappingValues.hasSecret(read.value)) {
            return this.#failure(
                MappingIssueKind.Secret,
                'The selected object includes secret fields. Choose individual permitted fields.',
            );
        }
        return {
            ...read,
            issue: read.redacted
                ? MappingIssueKind.Secret
                : read.missing
                  ? MappingIssueKind.Missing
                  : null,
            message: read.redacted
                ? 'This source contains a secret field. Choose a permitted non-secret value.'
                : read.missing
                  ? 'The source field is absent; it is not an explicit null.'
                  : '',
        };
    }
    public static validate(expression: string): MappingReference {
        if (expression.length > 2000) {
            throw new Error('Expression exceeds 2,000 characters.');
        }
        const parts: readonly string[] = expression
            .split('|')
            .map((part: string): string => part.trim());
        if (parts.length > 5) {
            throw new Error('Use at most four transformations.');
        }
        if (
            parts
                .slice(1)
                .some(
                    (operation: string): boolean =>
                        !['trim', 'upper', 'lower', 'json'].includes(operation),
                )
        ) {
            throw new Error('Supported transformations are trim, upper, lower and json.');
        }
        return this.reference(parts[0] ?? '');
    }
    public static evaluate(
        expression: string,
        inputs: readonly MappingInput[],
    ): MappingExpressionResult {
        const reference: MappingReference = this.validate(expression);
        const operations: readonly string[] = expression
            .split('|')
            .slice(1)
            .map((part: string): string => part.trim());
        const read: MappingExpressionResult = this.read(reference, inputs);
        if (read.issue !== null) {
            return read;
        }
        let value: WorkflowValue = read.value;
        for (const operation of operations) {
            if (operation === 'json') {
                value = JSON.stringify(value);
                continue;
            }
            if (value === null) {
                return this.#failure(
                    MappingIssueKind.Null,
                    'The source is explicitly null; text transformations need a value.',
                );
            }
            if (typeof value !== 'string') {
                return this.#failure(
                    MappingIssueKind.Type,
                    'Text transformations require Text. Use json for explicit serialization.',
                );
            }
            value =
                operation === 'trim'
                    ? value.trim()
                    : operation === 'upper'
                      ? value.toUpperCase()
                      : value.toLowerCase();
        }
        return { value, missing: false, redacted: false, issue: null, message: '' };
    }
    public static variables(template: string): readonly MappingVariable[] {
        if (template.length > 2000) {
            throw new Error('Template exceeds 2,000 characters.');
        }
        const variables: MappingVariable[] = [];
        const pattern: RegExp = /\{\{\s*([^{}]+?)\s*\}\}/gu;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(template)) !== null) {
            const expression: string | undefined = match[1];
            if (expression === undefined) {
                throw new Error('Empty template variable.');
            }
            variables.push({
                start: match.index,
                end: pattern.lastIndex,
                expression,
                reference: this.validate(expression),
            });
            if (variables.length > 24) {
                throw new Error('A template supports up to 24 variables.');
            }
        }
        let remainder: string = template;
        for (const variable of [...variables].reverse()) {
            remainder = remainder.slice(0, variable.start) + remainder.slice(variable.end);
        }
        if (remainder.includes('{{') || remainder.includes('}}')) {
            throw new Error('Close each variable with matching double braces.');
        }
        return variables;
    }
    public static template(
        template: string,
        inputs: readonly MappingInput[],
    ): MappingExpressionResult {
        const variables: readonly MappingVariable[] = this.variables(template);
        let cursor: number = 0;
        let output: string = '';
        for (const variable of variables) {
            const resolved: MappingExpressionResult = this.evaluate(variable.expression, inputs);
            if (resolved.issue !== null) {
                return resolved;
            }
            if (resolved.value === null) {
                return this.#failure(
                    MappingIssueKind.Null,
                    'Template variable is explicitly null.',
                );
            }
            if (typeof resolved.value === 'object') {
                return this.#failure(
                    MappingIssueKind.Type,
                    'Use | json to place an object or list in a text template.',
                );
            }
            output += template.slice(cursor, variable.start) + String(resolved.value);
            cursor = variable.end;
            if (output.length > 4000) {
                throw new Error('Rendered template exceeds 4,000 characters.');
            }
        }
        output += template.slice(cursor);
        if (output.length > 4000) {
            throw new Error('Rendered template exceeds 4,000 characters.');
        }
        return { value: output, missing: false, redacted: false, issue: null, message: '' };
    }
    static #failure(issue: MappingIssueKind, message: string): MappingExpressionResult {
        return {
            value: null,
            missing: issue === MappingIssueKind.Missing,
            redacted: issue === MappingIssueKind.Secret,
            issue,
            message,
        };
    }
}
