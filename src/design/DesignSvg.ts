// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignKind,
    type DesignBox,
    type DesignText,
    type DesignTextRun,
    type DesignPaint,
    type DesignStroke,
} from './DesignTypes.js';
import type { DesignSceneNode } from './DesignScene.js';
import { DesignMaskMode } from './DesignMaskTypes.js';
import { DesignMaskGeometry } from './DesignMaskGeometry.js';
import { DesignSvgGeometry as Geometry } from './DesignSvgGeometry.js';
import { DesignSvgPaints } from './DesignSvgPaints.js';
import { DesignSvgCompositing } from './DesignSvgCompositing.js';
import { DesignSvgText } from './DesignSvgText.js';
import type { DesignFontEngine } from './DesignFontEngine.js';
import { DesignTextShaping, type DesignTextRunFactory } from './DesignTextShaping.js';
import { DesignTextGlyphs } from './DesignTextGlyphs.js';
import { DesignStrokeGeometry } from './DesignStrokeGeometry.js';
import { DesignSvgTextPaint } from './DesignSvgTextPaint.js';
import { DesignDefaults } from './DesignDefaults.js';
import {
    DesignSvgLimits,
    type DesignSvgImage,
    type DesignSvgSelection,
    type DesignSvgResult,
} from './DesignSvgTypes.js';
import {
    DesignTextLayout,
    type DesignTextSpanStyle,
    type DesignTextLine,
} from './DesignTextLayout.js';

/** Shared native and browser serializer exports actual editable geometry, with no screenshot dependency. */
export class DesignSvg {
    /** Embeds only explicitly selected assets and bounds markup before returning a complete document. */
    public static render(
        selection: DesignSvgSelection,
        images: ReadonlyMap<string, DesignSvgImage> = new Map(),
        measure: (style: DesignTextSpanStyle, content: string) => number = (
            style: DesignTextSpanStyle,
            content: string,
        ): number => DesignTextLayout.estimate(style, content),
        outlines: DesignFontEngine | null = null,
        prepare: DesignTextRunFactory | null = null,
    ): DesignSvgResult {
        let imageBytes: bigint = 0n;
        for (const id of selection.assetIds) {
            const image: DesignSvgImage | undefined = images.get(id);
            if (image === undefined) {
                throw new Error('Missing export image: ' + id);
            }
            imageBytes += BigInt(image.asset.byteLength);
        }
        if (imageBytes > DesignSvgLimits.imageBytes) {
            throw new Error('Export individual frames to keep embedded images under 32 MiB.');
        }
        const nodes: ReadonlyMap<string, DesignSceneNode> = new Map(
            selection.scene.nodes.map(
                (node: DesignSceneNode): readonly [string, DesignSceneNode] => [node.id, node],
            ),
        );
        const boxes: ReadonlyMap<string, DesignBox> = new Map(
            selection.scene.boxes.map((box: DesignBox): readonly [string, DesignBox] => [
                box.id,
                box,
            ]),
        );
        const paints: DesignSvgPaints = new DesignSvgPaints(images);
        for (const box of selection.boxes) {
            const node: DesignSceneNode | undefined = nodes.get(box.id);
            if (node === undefined) {
                continue;
            }
            const density: number = node.text === null ? 1 : 2;
            for (const paint of [
                ...node.style.fills,
                ...(node.text?.runs.flatMap(
                    (run: DesignTextRun): readonly DesignPaint[] => run.fills ?? [],
                ) ?? []),
            ]) {
                paints.reserve(paint, box, 0, density);
            }
            if (node.style.stroke !== null) {
                paints.reserve(node.style.stroke.paint, box, this.#paintPadding(node), density);
            }
        }
        const clips: Map<string, string> = new Map();
        const elements: Map<string, string> = new Map();
        const needed: Set<string> = new Set();
        let characters: number = 0;
        for (const box of selection.boxes) {
            const original: DesignSceneNode | undefined = nodes.get(box.id);
            const node: DesignSceneNode | undefined =
                original?.maskOwner !== undefined &&
                nodes.get(original.maskOwner)?.mask?.mode === DesignMaskMode.Vector
                    ? DesignMaskGeometry.vector(original)
                    : original;
            if (node === undefined) {
                continue;
            }
            let parentId: string | null = node.id;
            while (parentId !== null && !needed.has(parentId)) {
                needed.add(parentId);
                parentId = nodes.get(parentId)?.parentId ?? null;
            }
            let body: string = '';
            const rangeFills: boolean =
                node.text?.runs.some((run: DesignTextRun): boolean => run.fills != null) === true;
            if (rangeFills && node.text !== null) {
                body += this.#text(
                    node.text,
                    DesignDefaults.paint(),
                    box,
                    paints,
                    measure,
                    '',
                    true,
                    outlines,
                    prepare,
                    0,
                    node.style.fills,
                );
            }
            for (const paint of rangeFills ? [] : node.style.fills) {
                const attributes: string = `fill="${paints.paint(paint, box, 0, node.text === null ? 1 : 2)}" fill-opacity="${paint.opacity}"`;
                if (node.text !== null) {
                    body += this.#text(
                        node.text,
                        paint,
                        box,
                        paints,
                        measure,
                        attributes,
                        true,
                        outlines,
                        prepare,
                    );
                } else if (node.kind !== DesignKind.Line) {
                    body += Geometry.shape(node, box, attributes);
                }
            }
            if (node.image !== null) {
                const id: string = paints.identity('image-clip');
                paints.definitions.push(
                    `<clipPath id="${id}" clipPathUnits="userSpaceOnUse">${Geometry.shape(node, box, '')}</clipPath>`,
                );
                body += `<g clip-path="url(#${id})">${paints.image(node.image, box)}</g>`;
            }
            if (node.style.stroke !== null) {
                const stroke: DesignStroke = node.style.stroke;
                const attributes: string = `fill="none" stroke="${paints.paint(stroke.paint, box, this.#paintPadding(node), node.text === null ? 1 : 2)}" stroke-opacity="${stroke.paint.opacity}" stroke-width="${stroke.width}" stroke-dasharray="${stroke.dash.join(' ')}" stroke-linejoin="${stroke.join ?? 'round'}" stroke-linecap="${stroke.cap ?? 'round'}"${stroke.miterLimit === undefined ? '' : ` stroke-miterlimit="${stroke.miterLimit}"`}`;
                body +=
                    node.text === null
                        ? Geometry.shape(node, box, attributes)
                        : this.#text(
                              node.text,
                              stroke.paint,
                              box,
                              paints,
                              measure,
                              attributes,
                              false,
                              outlines,
                              prepare,
                              DesignStrokeGeometry.padding(stroke),
                          );
            }
            const element: string = `<g transform="translate(${box.x} ${box.y}) rotate(${box.rotation} ${box.width / 2} ${box.height / 2})"><title>${Geometry.escape(node.name)}</title>${body}</g>`;
            characters += element.length;
            if (characters > DesignSvgLimits.characters) {
                throw new Error('Export individual frames to keep the SVG size bounded.');
            }
            elements.set(node.id, element);
        }
        const tree: (id: string) => string = (id: string): string => {
            if (!needed.has(id)) {
                return '';
            }
            const original: DesignSceneNode | undefined = nodes.get(id);
            const node: DesignSceneNode | undefined =
                original?.maskOwner !== undefined &&
                nodes.get(original.maskOwner)?.mask?.mode === DesignMaskMode.Vector
                    ? DesignMaskGeometry.vector(original)
                    : original;
            const box: DesignBox | undefined = boxes.get(id);
            if (node === undefined || box === undefined) {
                return '';
            }
            const children: string =
                node.kind === DesignKind.Boolean && elements.has(id)
                    ? ''
                    : node.children
                          .filter((child: string): boolean => child !== node.mask?.sourceId)
                          .map(tree)
                          .join('');
            let content: string = `${elements.get(id) ?? ''}${children}`;
            if (node.kind === DesignKind.Mask) {
                const maskId: string = paints.identity('mask');
                const source: string =
                    node.mask?.sourceId === null || node.mask?.sourceId === undefined
                        ? ''
                        : tree(node.mask.sourceId);
                const mode: string =
                    node.mask?.mode === DesignMaskMode.Luminance ? 'luminance' : 'alpha';
                paints.definitions.push(
                    `<mask id="${maskId}" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="${selection.x}" y="${selection.y}" width="${selection.width}" height="${selection.height}" style="mask-type:${mode};color-interpolation:sRGB">${source}</mask>`,
                );
                content = `<g mask="url(#${maskId})">${content}</g>`;
            }
            let element: string = `<g opacity="${node.opacity}"${DesignSvgCompositing.attributes(node.style)}${paints.effects(node.style, box)}>${content}</g>`;
            let clipId: string | null = box.clipId;
            while (clipId !== null) {
                const clip: DesignBox | undefined = boxes.get(clipId);
                const clipNode: DesignSceneNode | undefined = nodes.get(clipId);
                if (clip === undefined || clipNode === undefined) {
                    break;
                }
                let clipName: string | undefined = clips.get(clipId);
                if (clipName === undefined) {
                    clipName = paints.identity('clip');
                    clips.set(clipId, clipName);
                    paints.definitions.push(
                        `<clipPath id="${clipName}" clipPathUnits="userSpaceOnUse" transform="translate(${clip.x} ${clip.y}) rotate(${clip.rotation} ${clip.width / 2} ${clip.height / 2})">${Geometry.shape(clipNode, clip, '')}</clipPath>`,
                    );
                }
                element = `<g clip-path="url(#${clipName})">${element}</g>`;
                clipId = clip.clipId;
            }
            if (element.length > DesignSvgLimits.characters) {
                throw new Error('Export individual frames to keep the SVG size bounded.');
            }
            return element;
        };
        const body: string = selection.scene.nodes
            .filter((node: DesignSceneNode): boolean => node.parentId === null)
            .map((node: DesignSceneNode): string => tree(node.id))
            .join('');
        const svg: string = `<svg xmlns="http://www.w3.org/2000/svg" width="${selection.width}" height="${selection.height}" viewBox="${selection.x} ${selection.y} ${selection.width} ${selection.height}"><defs>${paints.definitions.join('')}</defs>${body}</svg>`;
        if (svg.length > DesignSvgLimits.characters) {
            throw new Error('Export individual frames to keep the SVG size bounded.');
        }
        return { svg, width: selection.width, height: selection.height };
    }
    static #text(
        text: DesignText,
        paint: DesignPaint,
        box: DesignBox,
        paints: DesignSvgPaints,
        measure: (style: DesignTextSpanStyle, content: string) => number,
        attributes: string,
        richFill: boolean = true,
        outlines: DesignFontEngine | null = null,
        prepare: DesignTextRunFactory | null = null,
        padding: number = 0,
        fills: readonly DesignPaint[] | null = null,
    ): string {
        const lines: readonly DesignTextLine[] = DesignTextLayout.lines(
            text,
            paint.color,
            box.width,
            box.height,
            measure,
            prepare ?? (outlines === null ? null : DesignTextShaping.factory(outlines)),
        );
        const id: string = paints.identity('text-clip');
        paints.definitions.push(
            `<clipPath id="${id}"><rect x="${-padding}" y="${-padding}" width="${box.width + padding * 2}" height="${box.height + padding * 2}"/></clipPath>`,
        );
        const textPaint: DesignSvgTextPaint | null =
            fills === null && outlines !== null
                ? null
                : new DesignSvgTextPaint(paints, box, paints.paint(paint, box, 0, 2), fills);
        if (outlines !== null) {
            const shapes: string[] = [];
            for (const line of lines) {
                const baseline: number = DesignTextLayout.baseline(line, text.lineHeight);
                for (const segment of line.segments) {
                    if (!outlines.supports(segment.style)) {
                        throw new Error(
                            'Visual preview requires a saved matching font for ' +
                                segment.style.family +
                                '. Import that font or use bundled Inter.',
                        );
                    }
                    const color: string =
                        richFill && textPaint?.fill(segment.style) != null
                            ? `fill="${textPaint.fill(segment.style)}"`
                            : segment.style.rich && richFill
                              ? `fill="${segment.style.color}"`
                              : '';
                    for (const piece of DesignTextGlyphs.paths(
                        segment,
                        outlines,
                        baseline,
                        text.letterSpacing,
                    )) {
                        const path: string = piece.path
                            .map((command): string => command.verb + command.values.join(' '))
                            .join(' ');
                        let clip: string = '';
                        if (piece.clip !== undefined) {
                            const clipId: string = paints.identity('text-paint-clip');
                            const left: number = piece.clip.left ?? -padding;
                            const right: number = piece.clip.right ?? box.width + padding;
                            paints.definitions.push(
                                `<clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${left}" y="${-padding}" width="${Math.max(0, right - left)}" height="${box.height + padding * 2}"/></clipPath>`,
                            );
                            clip = `clip-path="url(#${clipId})"`;
                        }
                        shapes.push(`<path d="${path}" ${color} ${clip}/>`);
                    }
                    if (segment.style.underline && richFill) {
                        shapes.push(
                            `<rect x="${segment.x}" y="${baseline + Math.max(1, segment.style.size / 12)}" width="${segment.width}" height="${Math.max(1, segment.style.size / 16)}" ${color}/>`,
                        );
                    }
                }
            }
            return `<g clip-path="url(#${id})" ${attributes}>${shapes.join('')}</g>`;
        }
        return DesignSvgText.render(lines, text, attributes, id, richFill, textPaint);
    }
    static #paintPadding(node: DesignSceneNode): number {
        const stroke: DesignStroke | null = node.style.stroke;
        return stroke === null
            ? 0
            : node.text !== null
              ? DesignStrokeGeometry.padding(stroke)
              : stroke.width *
                ((stroke.join ?? 'round') === 'miter' ? (stroke.miterLimit ?? 4) : 1);
    }
}
