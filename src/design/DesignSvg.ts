// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignKind,
    type DesignBox,
    type DesignText,
    type DesignPaint,
    type DesignStroke,
} from './DesignTypes.js';
import type { DesignSceneNode } from './DesignScene.js';
import { DesignSvgGeometry as Geometry } from './DesignSvgGeometry.js';
import { DesignSvgPaints } from './DesignSvgPaints.js';
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
    type DesignTextSegment,
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
        const clips: Map<string, string> = new Map();
        const elements: Map<string, string> = new Map();
        const needed: Set<string> = new Set();
        let characters: number = 0;
        for (const box of selection.boxes) {
            const node: DesignSceneNode | undefined = nodes.get(box.id);
            if (node === undefined) {
                continue;
            }
            let parentId: string | null = node.id;
            while (parentId !== null && !needed.has(parentId)) {
                needed.add(parentId);
                parentId = nodes.get(parentId)?.parentId ?? null;
            }
            let body: string = '';
            for (const paint of node.style.fills) {
                const attributes: string = `fill="${paints.paint(paint, box)}" fill-opacity="${paint.opacity}"`;
                if (node.text !== null) {
                    body += this.#text(node.text, paint, box, paints, measure, attributes);
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
                const attributes: string = `fill="none" stroke="${paints.paint(stroke.paint, box)}" stroke-opacity="${stroke.paint.opacity}" stroke-width="${stroke.width}" stroke-dasharray="${stroke.dash.join(' ')}" stroke-linejoin="round" stroke-linecap="round"`;
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
            const node: DesignSceneNode | undefined = nodes.get(id);
            const box: DesignBox | undefined = boxes.get(id);
            if (node === undefined || box === undefined) {
                return '';
            }
            let element: string = `<g opacity="${node.opacity}"${paints.effects(node.style, box)}>${elements.get(id) ?? ''}${node.children.map(tree).join('')}</g>`;
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
                        `<clipPath id="${clipName}" clipPathUnits="userSpaceOnUse"><g transform="translate(${clip.x} ${clip.y}) rotate(${clip.rotation} ${clip.width / 2} ${clip.height / 2})">${Geometry.shape(clipNode, clip, '')}</g></clipPath>`,
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
    ): string {
        const lines: readonly DesignTextLine[] = DesignTextLayout.lines(
            text,
            paint.color,
            box.width,
            box.height,
            measure,
        );
        const id: string = paints.identity('text-clip');
        paints.definitions.push(
            `<clipPath id="${id}"><rect width="${box.width}" height="${box.height}"/></clipPath>`,
        );
        return `<g clip-path="url(#${id})"><text xml:space="preserve" letter-spacing="${text.letterSpacing}" ${attributes}>${lines.map((line: DesignTextLine): string => line.segments.map((segment: DesignTextSegment): string => `<tspan x="${segment.x}" y="${line.y + (line.height / text.lineHeight) * 0.82}" ${segment.style.rich && richFill ? `fill="${segment.style.color}"` : ''} font-family="${Geometry.escape(segment.style.family)}" font-size="${segment.style.size}" font-weight="${segment.style.weight}" font-style="${segment.style.italic ? 'italic' : 'normal'}" text-decoration="${segment.style.underline ? 'underline' : 'none'}">${Geometry.escape(segment.text)}</tspan>`).join('')).join('')}</text></g>`;
    }
}
