// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Dependent UTF-8 and int64 limits complement the public JSON schema at the client boundary. */
export class ConnectorInstructionsChecks {
    static readonly #encoder: TextEncoder = new TextEncoder();

    /** Instruction edits cannot exceed exact storage revisions or the UTF-8 byte budget. */
    public static update(raw: unknown): boolean {
        return (
            this.#text(this.#field(raw, 'instructions')) &&
            this.#revision(this.#field(raw, 'expectedRevision'))
        );
    }

    /** Returned user preferences obey the same bounds as an accepted edit. */
    public static view(raw: unknown): boolean {
        return (
            this.#text(this.#field(raw, 'instructions')) &&
            this.#revision(this.#field(raw, 'revision'))
        );
    }

    /** Every inventory item carries bounded account-owned text alongside untrusted hardware metadata. */
    public static inventory(raw: unknown): boolean {
        const items: unknown = this.#field(raw, 'items');
        return (
            Array.isArray(items) &&
            items.every(
                (item: unknown): boolean =>
                    this.#text(this.#field(item, 'instructions')) &&
                    this.#revision(this.#field(item, 'instructionsRevision')),
            )
        );
    }

    static #field(raw: unknown, key: string): unknown {
        if (typeof raw !== 'object' || raw === null) {
            return undefined;
        }
        const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
            raw,
            key,
        );
        return descriptor !== undefined && Object.hasOwn(descriptor, 'value')
            ? descriptor.value
            : undefined;
    }

    static #text(raw: unknown): boolean {
        return (
            typeof raw === 'string' &&
            raw.length <= 16384 &&
            raw.isWellFormed() &&
            this.#encoder.encode(raw).byteLength <= 16384 &&
            !Array.from(raw).some((character: string): boolean => {
                const code: number = character.charCodeAt(0);
                return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
            })
        );
    }

    static #revision(raw: unknown): boolean {
        return (
            typeof raw === 'string' &&
            /^(0|[1-9][0-9]{0,18})$/u.test(raw) &&
            BigInt(raw) <= 9223372036854775807n
        );
    }
}
