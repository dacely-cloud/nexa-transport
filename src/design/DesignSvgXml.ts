// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Inert XML data; imported markup never enters the browser DOM. */
export interface DesignSvgElement {
    readonly name: string;
    readonly attributes: Readonly<Record<string, string>>;
    readonly children: readonly DesignSvgContent[];
}
/** Text remains separate from element records so text and title content retain order. */
export type DesignSvgContent = DesignSvgElement | string;

/** Bounded XML parser shared by native imports and browser previews, without external entities. */
export class DesignSvgXml {
    #offset: number = 0;
    #count: number = 0;
    public constructor(public readonly source: string) {
        if (source.length === 0 || source.length > 2 * 1024 * 1024) {
            throw new Error('SVG source must contain 1 to 2097152 characters.');
        }
        for (const char of source) {
            const code: number = char.charCodeAt(0);
            if (
                (code < 32 && code !== 9 && code !== 10 && code !== 13) ||
                code === 0xfffe ||
                code === 0xffff ||
                (char.length === 1 && code >= 0xd800 && code <= 0xdfff)
            ) {
                throw new Error('SVG contains an invalid XML character.');
            }
        }
    }
    /** Requires one complete SVG root and rejects trailing markup and truncated documents. */
    public parse(): DesignSvgElement {
        if (this.source.charCodeAt(0) === 0xfeff) {
            this.#offset++;
        }
        this.#misc();
        const root: DesignSvgElement = this.#element(0);
        this.#misc();
        if (this.#offset !== this.source.length) {
            this.#fail('Unexpected content after SVG');
        }
        if (root.name !== 'svg') {
            this.#fail('Expected an svg root');
        }
        const namespace: string | undefined = root.attributes['xmlns'];
        if (namespace !== undefined && namespace !== 'http://www.w3.org/2000/svg') {
            this.#fail('Unsupported SVG namespace');
        }
        return root;
    }
    #element(depth: number): DesignSvgElement {
        if (depth > 64 || ++this.#count > 10000) {
            this.#fail('SVG exceeds its element budget');
        }
        this.#expect('<');
        const name: string = this.#name();
        const attributes: Record<string, string> = Object.create(null) as Record<string, string>;
        let closed: boolean = false;
        while (true) {
            const before: number = this.#offset;
            this.#space();
            if (this.source.startsWith('/>', this.#offset)) {
                this.#offset += 2;
                closed = true;
                break;
            }
            if (this.source[this.#offset] === '>') {
                this.#offset++;
                break;
            }
            if (before === this.#offset) {
                this.#fail('Expected whitespace before an attribute');
            }
            const key: string = this.#name();
            if (Object.hasOwn(attributes, key)) {
                this.#fail('Duplicate attribute ' + key);
            }
            if (Object.keys(attributes).length >= 128) {
                this.#fail('Too many SVG attributes');
            }
            this.#space();
            this.#expect('=');
            this.#space();
            const quote: string | undefined = this.source[this.#offset++];
            if (quote !== '"' && quote !== "'") {
                this.#fail('Expected a quoted attribute');
            }
            const end: number = this.source.indexOf(quote, this.#offset);
            if (end < 0) {
                this.#fail('Unclosed SVG attribute');
            }
            const value: string = this.source.slice(this.#offset, end);
            if (value.includes('<')) {
                this.#fail('Invalid attribute content');
            }
            attributes[key] = this.#text(value.replace(/\r\n|[\t\r\n]/gu, ' '));
            this.#offset = end + 1;
        }
        const children: DesignSvgContent[] = [];
        if (!closed) {
            while (!this.source.startsWith('</', this.#offset)) {
                if (this.#offset >= this.source.length) {
                    this.#fail('Unclosed SVG element ' + name);
                }
                if (this.source.startsWith('<!--', this.#offset)) {
                    this.#comment();
                } else if (this.source.startsWith('<![CDATA[', this.#offset)) {
                    const end: number = this.source.indexOf(']]>', this.#offset + 9);
                    if (end < 0) {
                        this.#fail('Unclosed CDATA');
                    }
                    children.push(this.source.slice(this.#offset + 9, end));
                    this.#offset = end + 3;
                } else if (this.source.startsWith('<?', this.#offset)) {
                    this.#fail('Unsupported processing instruction');
                } else if (this.source[this.#offset] === '<') {
                    children.push(this.#element(depth + 1));
                } else {
                    const end: number = this.source.indexOf('<', this.#offset);
                    if (end < 0) {
                        this.#fail('Unclosed SVG text');
                    }
                    const value: string = this.source.slice(this.#offset, end);
                    if (value.includes(']]>')) {
                        this.#fail('Unexpected CDATA terminator');
                    }
                    children.push(this.#text(value));
                    this.#offset = end;
                }
            }
            this.#offset += 2;
            if (this.#name() !== name) {
                this.#fail('Mismatched SVG closing tag');
            }
            this.#space();
            this.#expect('>');
        }
        return { name, attributes, children };
    }
    #misc(): void {
        while (true) {
            this.#space();
            if (this.source.startsWith('<!--', this.#offset)) {
                this.#comment();
            } else if (this.source.startsWith('<?xml ', this.#offset) && this.#count === 0) {
                const end: number = this.source.indexOf('?>', this.#offset + 6);
                if (end < 0) {
                    this.#fail('Unclosed XML declaration');
                }
                this.#offset = end + 2;
            } else {
                break;
            }
        }
    }
    #comment(): void {
        const end: number = this.source.indexOf('-->', this.#offset + 4);
        if (end < 0 || this.source.slice(this.#offset + 4, end).includes('--')) {
            this.#fail('Invalid XML comment');
        }
        this.#offset = end + 3;
    }
    #text(value: string): string {
        return value.replace(/&([^;]*);|&/gu, (match: string, name: string | undefined): string => {
            const predefined: Readonly<Record<string, string>> = {
                amp: '&',
                lt: '<',
                gt: '>',
                quot: '"',
                apos: "'",
            };
            if (name !== undefined && Object.hasOwn(predefined, name)) {
                return predefined[name] ?? '';
            }
            if (name !== undefined && /^#(?:[0-9]+|x[0-9A-Fa-f]+)$/u.test(name)) {
                const code: number = name.startsWith('#x')
                    ? Number.parseInt(name.slice(2), 16)
                    : Number(name.slice(1));
                if (
                    (code === 9 || code === 10 || code === 13 || code >= 32) &&
                    code <= 0x10ffff &&
                    !(code >= 0xd800 && code <= 0xdfff) &&
                    code !== 0xfffe &&
                    code !== 0xffff
                ) {
                    return String.fromCodePoint(code);
                }
            }
            this.#fail('Unsupported or invalid XML entity ' + match);
        });
    }
    #name(): string {
        const match: RegExpMatchArray | null = /^[A-Za-z_][A-Za-z0-9_.:-]*/u.exec(
            this.source.slice(this.#offset),
        );
        const value: string | undefined = match?.[0];
        if (value === undefined) {
            this.#fail('Expected an XML name');
        }
        this.#offset += value.length;
        return value;
    }
    #space(): void {
        while (/[\t\n\r ]/u.test(this.source[this.#offset] ?? '\0')) {
            this.#offset++;
        }
    }
    #expect(value: string): void {
        if (!this.source.startsWith(value, this.#offset)) {
            this.#fail('Expected ' + value);
        }
        this.#offset += value.length;
    }
    #fail(message: string): never {
        throw new Error(`${message} at SVG character ${this.#offset}.`);
    }
}
