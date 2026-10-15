// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgElement } from './DesignSvgXml.js';
import type { DesignSvgImportStyles } from './DesignSvgImportStyles.js';
import type { DesignSvgMatrix, DesignSvgPoint } from './DesignSvgTransforms.js';
import type { DesignShadow } from './DesignTypes.js';
import type { DesignSvgFilterEffectsResult } from './DesignSvgFilterEffects.js';
import { DesignSvgFilterValues as Values } from './DesignSvgFilterValues.js';
import { DesignFailure, DesignFailureReason } from './DesignFailure.js';

/** Validates graph edges, not exporter-specific result names, before recovering an editable shadow stack. */
export class DesignSvgShadowGraph {
    #offset: number = 0;
    #results: Set<string> = new Set(['SourceGraphic', 'SourceAlpha']);
    public constructor(
        public readonly nodes: readonly DesignSvgElement[],
        public readonly styles: DesignSvgImportStyles,
        public readonly matrix: DesignSvgMatrix,
    ) {}
    public parse(): DesignSvgFilterEffectsResult {
        const shadows: DesignShadow[] = [];
        const outer: string[] = [];
        const inner: string[] = [];
        while (this.nodes[this.#offset]?.name === 'feMorphology') {
            if (shadows.length >= 8) {
                this.#fail('SVG shadow graph exceeds the native eight-shadow stack.');
            }
            const morphology: DesignSvgElement = this.#take('feMorphology', [
                'in',
                'operator',
                'radius',
            ]);
            this.#input(morphology, 'in', 'SourceAlpha');
            const radius: number = Values.scalar(
                morphology.attributes['radius'] ?? '0',
                this.matrix,
                1000,
            );
            const operator: string = morphology.attributes['operator'] ?? 'erode';
            if (operator !== 'dilate' && operator !== 'erode') {
                this.#fail('Unsupported SVG morphology operator.');
            }
            const spreadResult: string = this.#result(morphology);
            const gaussian: DesignSvgElement = this.#take('feGaussianBlur', ['in', 'stdDeviation']);
            this.#input(gaussian, 'in', spreadResult);
            const blur: number =
                Values.scalar(gaussian.attributes['stdDeviation'] ?? '0', this.matrix) * 2;
            const blurResult: string = this.#result(gaussian);
            const offset: DesignSvgElement = this.#take('feOffset', ['in', 'dx', 'dy']);
            this.#input(offset, 'in', blurResult);
            const shift: DesignSvgPoint = Values.offset(offset, this.matrix);
            const offsetResult: string = this.#result(offset);
            const inset: boolean = this.nodes[this.#offset]?.name === 'feComposite';
            let mask: string = offsetResult;
            if (inset) {
                const cut: DesignSvgElement = this.#take('feComposite', ['in', 'in2', 'operator']);
                this.#input(cut, 'in', 'SourceAlpha');
                this.#input(cut, 'in2', offsetResult);
                this.#input(cut, 'operator', 'out');
                mask = this.#result(cut);
            }
            const flood: DesignSvgElement = this.#take('feFlood', [
                'flood-color',
                'flood-opacity',
                'color',
            ]);
            const color: string = Values.color(this.styles.definition(flood));
            const floodResult: string = this.#result(flood);
            const paint: DesignSvgElement = this.#take('feComposite', ['in', 'in2', 'operator']);
            this.#input(paint, 'in', floodResult);
            this.#input(paint, 'in2', mask);
            this.#input(paint, 'operator', 'in');
            const result: string = this.#result(paint);
            (inset ? inner : outer).push(result);
            shadows.push({
                ...shift,
                blur,
                color,
                inner: inset,
                spread: radius * ((inset ? operator === 'erode' : operator === 'dilate') ? 1 : -1),
            });
        }
        const merge: DesignSvgElement = this.#take('feMerge', [], true);
        const members: readonly DesignSvgElement[] = merge.children.filter(
            (child): child is DesignSvgElement => typeof child !== 'string',
        );
        const expected: readonly string[] = [...outer, 'SourceGraphic', ...inner];
        if (members.length !== expected.length) {
            this.#fail(
                'SVG filter merge must retain the complete outer/source/inner painter order.',
            );
        }
        for (let index: number = 0; index < members.length; index++) {
            const member: DesignSvgElement | undefined = members[index];
            if (member?.name !== 'feMergeNode') {
                this.#fail('Unsupported SVG filter merge content.');
            }
            Values.validate(member, this.styles.definition(member), ['in']);
            this.#input(member, 'in', expected[index] ?? '');
            if (member.attributes['result'] !== undefined) {
                this.#fail('SVG merge members cannot declare graph results.');
            }
        }
        let blur: number = 0;
        if (this.#offset < this.nodes.length) {
            const merged: string = this.#result(merge);
            const gaussian: DesignSvgElement = this.#take('feGaussianBlur', ['in', 'stdDeviation']);
            this.#input(gaussian, 'in', merged);
            blur = Values.scalar(gaussian.attributes['stdDeviation'] ?? '0', this.matrix) * 2;
        }
        if (this.#offset !== this.nodes.length) {
            this.#fail('Unsupported SVG filter graph continuation.');
        }
        return { blur, shadows, graph: true };
    }
    #take(
        name: string,
        attributes: readonly string[],
        children: boolean = false,
    ): DesignSvgElement {
        const node: DesignSvgElement | undefined = this.nodes[this.#offset++];
        if (node?.name !== name) {
            this.#fail('SVG filter graph does not match native shadow operations.');
        }
        Values.validate(node, this.styles.definition(node), attributes, children);
        return node;
    }
    #result(node: DesignSvgElement): string {
        const result: string | undefined = node.attributes['result'];
        if (
            result === undefined ||
            result.length === 0 ||
            result.length > 256 ||
            this.#results.has(result)
        ) {
            this.#fail('SVG shadow graph results must be unique nonreserved identifiers.');
        }
        this.#results.add(result);
        return result;
    }
    #input(node: DesignSvgElement, attribute: string, expected: string): void {
        if (node.attributes[attribute] !== expected) {
            this.#fail('SVG shadow graph has an unsupported input or painter order.');
        }
    }
    #fail(message: string): never {
        throw new DesignFailure(DesignFailureReason.Invalid, message);
    }
}
