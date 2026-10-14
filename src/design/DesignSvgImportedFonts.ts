// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgFontSource } from './DesignSvgFontSource.js';
import { DesignFontCodec } from './DesignFontCodec.js';
import { DesignBuiltinFonts } from './DesignBuiltinFonts.js';
import type { DesignFontEngine, DesignFontSource } from './DesignFontEngine.js';
import type { DesignSvgFontLoader, DesignSvgFontFace } from './DesignSvgFontTypes.js';
import type { DesignTextSpanStyle } from './DesignTextLayout.js';
import type { DesignFontAsset } from './DesignFontTypes.js';
import { DesignFontContainer } from './DesignFontContainer.js';

/** Embedded resources stay local to this import and never replace global or other-owner faces. */
export class DesignSvgImportedFonts {
    #faces: DesignSvgFontFace[] = [];
    #engine: Promise<DesignFontEngine> | null = null;
    #decodedBytes: number = 0;
    /** Only an authenticated host may publish a previously unknown font. */
    public constructor(public readonly loader: DesignSvgFontLoader | null = null) {}

    /** Removes only fully validated font-face declarations; all other CSS still passes normal validation. */
    public async prepare(root: DesignSvgElement): Promise<DesignSvgElement> {
        const visit: (element: DesignSvgElement) => Promise<DesignSvgElement> = async (
            element: DesignSvgElement,
        ): Promise<DesignSvgElement> => {
            if (element.name === 'style') {
                const source: string = DesignSvgCss.clean(
                    element.children
                        .map((child): string => (typeof child === 'string' ? child : ''))
                        .join(''),
                );
                const pattern: RegExp = /@font-face\s*\{([^{}]*)\}/giu;
                const pieces: string[] = [];
                let start: number = 0;
                for (const match of source.matchAll(pattern)) {
                    if (this.#faces.length >= 64) {
                        throw new Error('SVG exceeds its embedded font-face budget.');
                    }
                    const face: DesignSvgFontFace = await DesignSvgFontSource.read(
                        match[1] ?? '',
                        DesignFontContainer.maximum - this.#decodedBytes,
                    );
                    this.#decodedBytes += face.decodedBytes;
                    if (
                        this.#faces.some(
                            (old: DesignSvgFontFace): boolean =>
                                old.family.toLowerCase() === face.family.toLowerCase() &&
                                old.italic === face.italic &&
                                old.minimum <= face.maximum &&
                                face.minimum <= old.maximum,
                        )
                    ) {
                        throw new Error(
                            'Overlapping embedded SVG font-face declarations are unsupported.',
                        );
                    }
                    if (face.source === null) {
                        this.#faces.push(face);
                    } else {
                        if (this.loader === null) {
                            throw new Error(
                                'Import embedded fonts in a connected design workspace to preserve their exact bytes.',
                            );
                        }
                        const source: DesignFontSource = {
                            ...face.source,
                            bytes: Uint8Array.from(face.source.bytes),
                        };
                        const digest: ArrayBuffer = await crypto.subtle.digest(
                            'SHA-256',
                            Uint8Array.from(source.bytes),
                        );
                        const asset: DesignFontAsset = DesignFontCodec.asset(
                            await this.loader({ ...source, bytes: Uint8Array.from(source.bytes) }),
                        );
                        const sha256: string = [...new Uint8Array(digest)]
                            .map((value: number): string => value.toString(16).padStart(2, '0'))
                            .join('');
                        if (
                            asset.family !== source.family ||
                            asset.weight !== source.weight ||
                            asset.italic !== source.italic ||
                            asset.byteLength !== BigInt(source.bytes.length).toString()
                        ) {
                            throw new Error(
                                'Embedded SVG font admission returned a different face.',
                            );
                        }
                        if (asset.sha256 !== sha256) {
                            throw new Error(
                                'Embedded SVG font admission returned different bytes.',
                            );
                        }
                        this.#faces.push({
                            ...face,
                            source: {
                                ...source,
                                binding: { id: asset.id, sha256: asset.sha256 },
                            },
                        });
                    }
                    pieces.push(source.slice(start, match.index));
                    start = match.index + match[0].length;
                }
                pieces.push(source.slice(start));
                return { ...element, children: [pieces.join('')] };
            }
            const children: (DesignSvgElement | string)[] = [];
            for (const child of element.children) {
                children.push(typeof child === 'string' ? child : await visit(child));
            }
            return { ...element, children };
        };
        return visit(root);
    }

    /** Family, weight and italic declarations select one admitted exact face. */
    public resolve(style: DesignTextSpanStyle): DesignTextSpanStyle {
        const family: readonly DesignSvgFontFace[] = this.#faces.filter(
            (face: DesignSvgFontFace): boolean =>
                face.family.toLowerCase() === style.family.toLowerCase(),
        );
        if (family.length === 0) {
            return style;
        }
        const selected: DesignSvgFontFace | undefined = family.find(
            (face: DesignSvgFontFace): boolean =>
                face.italic === style.italic &&
                style.weight >= face.minimum &&
                style.weight <= face.maximum,
        );
        if (selected === undefined) {
            throw new Error('SVG text requests a style outside its embedded exact font faces.');
        }
        return {
            ...style,
            family: selected.source?.family ?? selected.family,
            ...(selected.source?.binding === undefined ? {} : { font: selected.source.binding }),
        };
    }

    /** Imported bindings extend a private engine; bundled faces remain immutable shared data. */
    public engine(): Promise<DesignFontEngine> {
        const sources: readonly DesignFontSource[] = this.#faces.flatMap(
            (face: DesignSvgFontFace): readonly DesignFontSource[] =>
                face.source === null ? [] : [face.source],
        );
        this.#engine ??= DesignBuiltinFonts.engine(sources);
        return this.#engine;
    }
}
