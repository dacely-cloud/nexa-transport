// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignSvgInputError } from './DesignSvgInputError.js';
import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgTextContext } from './DesignSvgImportLabel.js';
import { DesignSvgCss } from './DesignSvgCss.js';
import { DesignSvgImportTextStyles as Styles } from './DesignSvgImportTextStyles.js';
import { DesignSvgImportAppearance } from './DesignSvgImportAppearance.js';

/** One absolute SVG text chunk owns its anchor and retains its rich child styles. */
export interface DesignSvgTextChunk {
    readonly x: number | null;
    readonly y: number | null;
    readonly element: DesignSvgElement;
}
interface TextChunkPart {
    content: string;
    readonly style: Readonly<Record<string, string>>;
}
interface TextChunkDraft {
    readonly x: number | null;
    readonly y: number | null;
    readonly style: Readonly<Record<string, string>>;
    readonly parts: TextChunkPart[];
}

/** Resolves the original CSS ancestry before splitting positioned labels into editable chunks. */
export class DesignSvgTextChunks {
    /** The inert stylesheet is shared with ordinary text and shape import. */
    public constructor(public readonly css: DesignSvgCss) {}

    /** Unpositioned rich labels keep their original single-layer representation. */
    public read(
        element: DesignSvgElement,
        context: DesignSvgTextContext,
    ): readonly DesignSvgTextChunk[] | null {
        const drafts: TextChunkDraft[] = [];
        let positioned: boolean = false;
        let current: TextChunkDraft | null = null;
        let space: string = 'default';
        for (const parent of [...context.ancestors, element]) {
            space = parent.attributes['xml:space'] ?? space;
        }
        if (!['default', 'preserve'].includes(space)) {
            throw new DesignSvgInputError('Unsupported SVG xml:space.');
        }
        const visit: (
            node: DesignSvgElement,
            ancestors: readonly DesignSvgElement[],
            root: boolean,
        ) => void = (
            node: DesignSvgElement,
            ancestors: readonly DesignSvgElement[],
            root: boolean,
        ): void => {
            const styles: Styles = new Styles(this.css);
            const resolved: Readonly<Record<string, string>> = styles.resolve(node, ancestors);
            const tracking: string | undefined = resolved['letter-spacing'];
            if (tracking?.trim().endsWith('%')) {
                throw new DesignSvgInputError(
                    'SVG percentage tracking requires per-glyph spacing support.',
                );
            }
            const style: Readonly<Record<string, string>> = {
                ...resolved,
                ...(tracking === undefined || tracking === 'normal'
                    ? {}
                    : {
                          'letter-spacing': Styles.length(
                              tracking,
                              Number(resolved['font-size'] ?? 16),
                              styles.rootSize,
                          ).toString(),
                      }),
            };
            Styles.validate(node, style);
            if (style['display'] === 'none') {
                return;
            }
            if (!root) {
                for (const property of ['dx', 'dy', 'transform', 'clip-path', 'mask']) {
                    if (style[property] !== undefined || node.attributes[property] !== undefined) {
                        throw new DesignSvgInputError(
                            'SVG tspan ' +
                                property +
                                ' requires independent editable text support.',
                        );
                    }
                }
                if (
                    DesignSvgImportAppearance.opacity(style['opacity']) !== 1 ||
                    (node.attributes['xml:space'] ?? space) !== space
                ) {
                    throw new DesignSvgInputError(
                        'SVG tspan opacity and whitespace changes require separate text groups.',
                    );
                }
            }
            const rawX: string | undefined = root
                ? undefined
                : (style['x'] ?? node.attributes['x']);
            const rawY: string | undefined = root
                ? undefined
                : (style['y'] ?? node.attributes['y']);
            if (rawX !== undefined || rawY !== undefined) {
                positioned = true;
                const size: number = Number(style['font-size'] ?? 16);
                current = {
                    x:
                        rawX === undefined
                            ? null
                            : Styles.position(rawX, size, styles.rootSize, context.width),
                    y:
                        rawY === undefined
                            ? null
                            : Styles.position(rawY, size, styles.rootSize, context.height),
                    style,
                    parts: [],
                };
                drafts.push(current);
            }
            for (const child of node.children) {
                if (typeof child === 'string') {
                    if (current === null) {
                        current = { x: null, y: null, style, parts: [] };
                        drafts.push(current);
                    }
                    current.parts.push({ content: child, style });
                } else if (child.name === 'tspan') {
                    visit(child, [...ancestors, node], false);
                } else if (!['title', 'desc', 'metadata'].includes(child.name)) {
                    throw new DesignSvgInputError('Unsupported SVG text child ' + child.name + '.');
                }
            }
        };
        visit(element, context.ancestors, true);
        if (!positioned) {
            return null;
        }
        let empty: boolean = true;
        let trailing: boolean = false;
        const parts: TextChunkPart[] = drafts.flatMap(
            (draft: TextChunkDraft): TextChunkPart[] => draft.parts,
        );
        if (
            parts.reduce(
                (length: number, part: TextChunkPart): number => length + part.content.length,
                0,
            ) > 100000
        ) {
            throw new DesignSvgInputError('SVG text exceeds the native text layer budget.');
        }
        for (const part of parts) {
            let content: string =
                space === 'preserve'
                    ? part.content.replace(/[\t\r\n]/gu, ' ')
                    : part.content.replace(/[ \t\r\n]+/gu, ' ');
            if (space === 'default' && (empty || trailing)) {
                content = content.trimStart();
            }
            if (content !== '') {
                empty = false;
                trailing = content.endsWith(' ');
            }
            part.content = content;
        }
        if (space === 'default') {
            for (const part of parts.toReversed()) {
                part.content = part.content.trimEnd();
                if (part.content !== '') {
                    break;
                }
            }
        }
        const result: DesignSvgTextChunk[] = [];
        for (const draft of drafts) {
            const actual: readonly TextChunkPart[] = draft.parts.filter(
                (part: TextChunkPart): boolean => part.content !== '',
            );
            const attrs: Readonly<Record<string, string>> = this.#attributes(draft.style);
            result.push({
                x: draft.x,
                y: draft.y,
                element: {
                    name: 'text',
                    attributes: { ...attrs, 'xml:space': 'preserve' },
                    children: actual.map((part: TextChunkPart): DesignSvgElement => ({
                        name: 'tspan',
                        attributes: this.#attributes(part.style),
                        children: [part.content],
                    })),
                },
            });
        }
        return result;
    }

    #attributes(style: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(style)) {
            if (DesignSvgCss.inherited.has(key)) {
                result[key] = value;
            }
        }
        return result;
    }
}
