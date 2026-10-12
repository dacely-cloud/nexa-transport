// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Imported references are resolved from the same inert SVG document, never from the network. */
export class DesignSvgReferences {
    public static fragment(source: string): string {
        const value: string = source.trim();
        if (!/^#[^\s#]+$/u.test(value)) {
            throw new Error('SVG references must identify an element in this document.');
        }
        return value.slice(1);
    }
    public static paint(source: string): string {
        const match: RegExpMatchArray | null = /^url\(\s*(['"]?)(#[^'"\s)]+)\1\s*\)$/iu.exec(
            source.trim(),
        );
        const value: string | undefined = match?.[2];
        if (value === undefined) {
            throw new Error('SVG clip references require a local url(#id).');
        }
        return this.fragment(value);
    }
}
