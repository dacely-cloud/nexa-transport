// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { ResourceFamily, ResourceUse } from './ResourceTypes.js';
import type { ResourceBinding, ResourceLimits, ResourceSelection } from './ResourceTypes.js';

/** Portable boundary validation shared by import, save, and transport consumers. */
export class ResourceBindingCodec {
    /** Parses and detaches bounded draft data; rejects unknown fields including inline secrets. */
    public static parse(raw: unknown): ResourceBinding {
        const value: Readonly<Record<string, unknown>> = this.#record(raw, [
            'version',
            'id',
            'alias',
            'family',
            'use',
            'consumerId',
            'selection',
            'operations',
            'limits',
            'maxAgeMs',
        ]);
        if (value['version'] !== 1) {
            throw new Error('Unsupported resource binding version');
        }
        const operations: unknown = value['operations'];
        if (!Array.isArray(operations) || operations.length < 1 || operations.length > 32) {
            throw new Error('Choose between 1 and 32 resource operations');
        }
        const names: string[] = Array.from(operations, (item: unknown): string => this.#id(item));
        if (new Set(names).size !== names.length) {
            throw new Error('Duplicate resource operation');
        }
        return Object.freeze({
            version: 1,
            id: this.#id(value['id']),
            alias: this.#text(value['alias'], 120),
            family: this.#family(value['family']),
            use: this.#use(value['use']),
            consumerId: this.#id(value['consumerId']),
            selection: value['selection'] === null ? null : this.#selection(value['selection']),
            operations: Object.freeze(names),
            limits: this.#limits(value['limits']),
            maxAgeMs: value['maxAgeMs'] === null ? null : this.decimal(value['maxAgeMs']),
        });
    }

    /** Validates a nonnegative signed-64-bit-safe decimal without lossy numeric conversion. */
    public static decimal(raw: unknown): string {
        if (
            typeof raw !== 'string' ||
            !/^(0|[1-9][0-9]{0,18})$/u.test(raw) ||
            BigInt(raw) > 0x7fff_ffff_ffff_ffffn
        ) {
            throw new Error('Expected a nonnegative decimal within the signed 64-bit range');
        }
        return raw;
    }

    static #selection(raw: unknown): ResourceSelection {
        const value: Readonly<Record<string, unknown>> = this.#record(raw, [
            'resourceId',
            'connectionId',
            'connectorId',
            'connectorVersion',
            'targetId',
        ]);
        return Object.freeze({
            resourceId: this.#id(value['resourceId']),
            connectionId: this.#id(value['connectionId']),
            connectorId: this.#id(value['connectorId']),
            connectorVersion: this.#id(value['connectorVersion']),
            targetId: this.#id(value['targetId']),
        });
    }

    static #limits(raw: unknown): ResourceLimits {
        const value: Readonly<Record<string, unknown>> = this.#record(raw, [
            'maxItems',
            'maxBytes',
        ]);
        const maxItems: unknown = value['maxItems'];
        const maxBytes: string = this.decimal(value['maxBytes']);
        if (
            typeof maxItems !== 'number' ||
            !Number.isSafeInteger(maxItems) ||
            maxItems < 1 ||
            maxItems > 100_000 ||
            BigInt(maxBytes) < 1n
        ) {
            throw new Error('Resource limits must be positive; maxItems cannot exceed 100000');
        }
        return Object.freeze({ maxItems, maxBytes });
    }

    static #family(raw: unknown): ResourceFamily {
        for (const family of Object.values(ResourceFamily)) {
            if (raw === family) {
                return family;
            }
        }
        throw new Error('Unknown resource family');
    }

    static #use(raw: unknown): ResourceUse {
        for (const use of Object.values(ResourceUse)) {
            if (raw === use) {
                return use;
            }
        }
        throw new Error('Unknown resource use');
    }

    static #id(raw: unknown): string {
        const value: string = this.#text(raw, 256);
        if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u.test(value)) {
            throw new Error('Resource references require stable identifiers');
        }
        return value;
    }

    static #text(raw: unknown, limit: number): string {
        if (
            typeof raw !== 'string' ||
            raw.length < 1 ||
            raw.length > limit ||
            raw.trim().length === 0
        ) {
            throw new Error(`Resource text must contain 1–${limit} visible characters`);
        }
        for (const character of raw) {
            const code: number = character.charCodeAt(0);
            if (code < 32 || code === 127) {
                throw new Error('Resource text cannot contain control characters');
            }
        }
        return raw;
    }

    static #record(raw: unknown, keys: readonly string[]): Readonly<Record<string, unknown>> {
        if (!this.#plain(raw)) {
            throw new Error('Expected plain resource data');
        }
        const entries: Readonly<Record<string, unknown>> = raw;
        if (
            Object.keys(entries).length !== keys.length ||
            keys.some((key: string): boolean => !Object.hasOwn(entries, key)) ||
            Object.values(Object.getOwnPropertyDescriptors(entries)).some(
                (field: PropertyDescriptor): boolean =>
                    field.get !== undefined || field.set !== undefined,
            )
        ) {
            throw new Error('Unexpected or missing resource fields');
        }
        return entries;
    }

    static #plain(raw: unknown): raw is Readonly<Record<string, unknown>> {
        return (
            raw !== null &&
            typeof raw === 'object' &&
            !Array.isArray(raw) &&
            (Object.getPrototypeOf(raw) === Object.prototype || Object.getPrototypeOf(raw) === null)
        );
    }
}
