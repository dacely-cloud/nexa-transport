// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgCss, type DesignSvgDeclaration } from './DesignSvgCss.js';
import { DesignFontFamilyCodec } from './DesignFontFamilyCodec.js';
import {
    DesignFontEngine,
    type DesignFontSource,
    type DesignFontWeightRange,
} from './DesignFontEngine.js';
import { DesignFontContainer } from './DesignFontContainer.js';
import type { DesignSvgFontFace } from './DesignSvgFontTypes.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';

/** Validates a single inert embedded font declaration without external loads or global registration. */
export class DesignSvgFontSource {
    public static readonly descriptors: ReadonlySet<string> = new Set([
        'font-family',
        'font-style',
        'font-weight',
        'font-variation-settings',
        'src',
    ]);

    /** The actual bytes and variation bounds must support the advertised face before admission. */
    public static async read(
        body: string,
        remainingBytes: number = DesignFontContainer.maximum,
    ): Promise<DesignSvgFontFace> {
        const descriptors: readonly DesignSvgDeclaration[] = DesignSvgCss.declarations(
            body,
            this.descriptors,
        );
        const values: Record<string, string> = {};
        for (const declaration of descriptors) {
            if (declaration.important || Object.hasOwn(values, declaration.property)) {
                throw new Error('Ambiguous SVG font-face descriptor.');
            }
            values[declaration.property] = declaration.value.trim();
        }
        const rawFamily: string = values['font-family'] ?? '';
        const family: string = DesignFontFamilyCodec.family(
            /^(['"]).*\1$/u.test(rawFamily) ? rawFamily.slice(1, -1) : rawFamily,
        );
        const style: string = values['font-style'] ?? 'normal';
        if (!['normal', 'italic'].includes(style)) {
            throw new Error('Unsupported embedded SVG font style.');
        }
        const italic: boolean = style === 'italic';
        const weights: readonly number[] = (values['font-weight'] ?? '400')
            .split(/\s+/u)
            .map((value: string): number =>
                value === 'normal' ? 400 : value === 'bold' ? 700 : Number(value),
            );
        const minimum: number = weights[0] ?? 0;
        const maximum: number = weights[1] ?? minimum;
        if (
            weights.length > 2 ||
            !weights.every(
                (value: number): boolean => Number.isInteger(value) && value >= 1 && value <= 1000,
            ) ||
            maximum < minimum
        ) {
            throw new Error('Invalid embedded SVG font weight range.');
        }
        const match: RegExpMatchArray | null =
            /^url\(\s*(['"]?)(data:font\/(woff2?|ttf|otf);base64,([A-Za-z0-9+/=\s]+))\1\s*\)(?:\s+format\(\s*(['"])(woff2?|truetype|opentype)\5\s*\))?$/iu.exec(
                values['src'] ?? '',
            );
        if (match === null) {
            throw new Error(
                'SVG fonts require one embedded standalone font data URL; external URLs and local font lookup are unsupported.',
            );
        }
        const format: string = (match[3] ?? '').toLowerCase();
        const declared: string | undefined = match[6]?.toLowerCase();
        if (
            declared !== undefined &&
            declared !== (format === 'ttf' ? 'truetype' : format === 'otf' ? 'opentype' : format)
        ) {
            throw new Error('SVG font format declarations disagree.');
        }
        const encoded: string = (match[4] ?? '').replace(/\s/gu, '');
        let decoded: string;
        try {
            decoded = atob(encoded);
        } catch {
            throw new Error('Invalid embedded SVG font base64.');
        }
        if (decoded.length < 12 || btoa(decoded) !== encoded) {
            throw new Error('Embedded SVG font data must be canonical base64.');
        }
        const bytes: Uint8Array<ArrayBuffer> = Uint8Array.from(
            decoded,
            (character: string): number => character.charCodeAt(0),
        );
        const signature: number = new DataView(bytes.buffer).getUint32(0);
        const actual: string =
            signature === 0x774f4632
                ? 'woff2'
                : signature === 0x774f4646
                  ? 'woff'
                  : signature === 0x4f54544f
                    ? 'otf'
                    : 'ttf';
        if (format !== actual) {
            throw new Error('Embedded SVG font MIME does not match its bytes.');
        }
        const decodedBytes: number = DesignFontContainer.inspect(bytes);
        if (decodedBytes > remainingBytes) {
            throw new Error('Embedded SVG fonts exceed the combined decompression budget.');
        }
        const variations: string = values['font-variation-settings'] ?? 'normal';
        if (family.toLowerCase() === 'inter' && format === 'woff2') {
            const { DesignInterBytes }: typeof import('./DesignInterBytes.js') =
                await import('./DesignInterBytes.js');
            if (
                encoded === DesignInterBytes.encoded(italic) &&
                minimum === 100 &&
                maximum === 900 &&
                /^(['"])opsz\1\s+14$/u.test(variations)
            ) {
                return { family: 'Inter', minimum, maximum, italic, decodedBytes, source: null };
            }
        }
        if (variations !== 'normal') {
            throw new Error(
                'Embedded SVG font axes require supported exact native variation settings.',
            );
        }
        const weight: number = Math.max(minimum, Math.min(maximum, 400));
        const source: DesignFontSource = { family, italic, weight, bytes };
        const engine: DesignFontEngine = new DesignFontEngine();
        engine.add(source);
        const span: DesignTextSpanStyle = {
            family,
            italic,
            weight,
            size: 16,
            rich: false,
            color: '#000000',
            underline: false,
        };
        const range: DesignFontWeightRange = engine.weightRange(span);
        if (minimum < range.minimum || maximum > range.maximum) {
            throw new Error('Embedded SVG font weight range exceeds the exact face.');
        }
        return { family, minimum, maximum, italic, decodedBytes, source };
    }
}
