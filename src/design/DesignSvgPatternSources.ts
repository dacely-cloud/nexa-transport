// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignSvgInputError } from './DesignSvgInputError.js';
import { DesignSvgNumbers } from './DesignSvgNumbers.js';
import { DesignSvgTransforms as T, type DesignSvgMatrix } from './DesignSvgTransforms.js';
import type { DesignSvgPaintContext } from './DesignSvgImportPaints.js';
import type {
    DesignSvgPatternDefinition,
    DesignSvgPatternSourcePlan,
} from './DesignSvgPatternTypes.js';
import type { DesignPaint } from './DesignTypes.js';

/** Paint resolution queues linked sources; a bounded second pass imports their full editable artwork. */
export class DesignSvgPatternSources {
    readonly #sources: Map<string, DesignSvgPatternSourcePlan> = new Map();
    readonly #built: Set<string> = new Set();
    #references: readonly string[] = [];

    public constructor(
        public readonly identify: (key: string) => string,
        public readonly buildSource: (plan: DesignSvgPatternSourcePlan) => Promise<void>,
    ) {}

    /** One definition and equivalent content geometry share a component across all referring paints. */
    public get roots(): readonly string[] {
        return [...this.#sources.values()]
            .filter((plan: DesignSvgPatternSourcePlan): boolean => this.#built.has(plan.id))
            .map((plan: DesignSvgPatternSourcePlan): string => plan.id);
    }

    /** Nested sources reuse the same importer and shared image admission without recursively expanding occurrences. */
    public async build(references: () => ReadonlySet<string>): Promise<void> {
        try {
            for (;;) {
                const active: ReadonlySet<string> = references();
                const pending: readonly DesignSvgPatternSourcePlan[] = [
                    ...this.#sources.values(),
                ].filter(
                    (plan: DesignSvgPatternSourcePlan): boolean =>
                        !this.#built.has(plan.id) && active.has(plan.id),
                );
                if (pending.length === 0) {
                    break;
                }
                for (const plan of pending) {
                    this.#references = [...plan.references, plan.patternId];
                    await this.buildSource(plan);
                    this.#built.add(plan.id);
                }
            }
        } finally {
            this.#references = [];
        }
    }

    /** Cell geometry stays independent of target rotation, stroke outlines and rich text range rebasing. */
    public resolve(
        patternId: string,
        definition: DesignSvgPatternDefinition,
        style: Readonly<Record<string, string>>,
        opacity: number,
        context: DesignSvgPaintContext,
    ): DesignPaint | null {
        if (this.#references.includes(patternId) || this.#references.length >= 64) {
            throw new DesignSvgInputError('SVG pattern content reference is cyclic or too deep.');
        }
        const a: Readonly<Record<string, string>> = definition.attributes;
        const object: boolean = this.#object(a['patternUnits'] ?? 'objectBoundingBox');
        const contentObject: boolean =
            a['viewBox'] === undefined &&
            this.#object(a['patternContentUnits'] ?? 'userSpaceOnUse');
        if (
            (object || contentObject) &&
            (context.source.width <= 0 || context.source.height <= 0)
        ) {
            return null;
        }
        const width: number = DesignSvgNumbers.length(
            a['width'] ?? '0',
            object ? 1 : context.viewportWidth,
        );
        const height: number = DesignSvgNumbers.length(
            a['height'] ?? '0',
            object ? 1 : context.viewportHeight,
        );
        if (width < 0 || height < 0) {
            throw new DesignSvgInputError('SVG pattern dimensions must be nonnegative.');
        }
        if (width === 0 || height === 0) {
            return null;
        }
        const unitWidth: number = object ? context.source.width : 1;
        const unitHeight: number = object ? context.source.height : 1;
        const cellWidth: number = width * unitWidth;
        const cellHeight: number = height * unitHeight;
        if (Math.min(cellWidth, cellHeight) < 0.01 || Math.max(cellWidth, cellHeight) > 100000) {
            throw new DesignSvgInputError(
                'SVG vector pattern cell exceeds editable dimension limits.',
            );
        }
        const box: readonly number[] =
            a['viewBox'] === undefined ? [] : DesignSvgNumbers.list(a['viewBox'], 4);
        const matrix: DesignSvgMatrix =
            a['viewBox'] === undefined
                ? {
                      ...T.identity,
                      a: contentObject ? context.source.width : 1,
                      d: contentObject ? context.source.height : 1,
                  }
                : T.viewport(cellWidth, cellHeight, a['viewBox'], a['preserveAspectRatio']).matrix;
        const viewportWidth: number = box[2] ?? (contentObject ? 1 : context.viewportWidth);
        const viewportHeight: number = box[3] ?? (contentObject ? 1 : context.viewportHeight);
        const key: string = JSON.stringify([
            patternId,
            cellWidth,
            cellHeight,
            matrix,
            viewportWidth,
            viewportHeight,
        ]);
        let plan: DesignSvgPatternSourcePlan | undefined = this.#sources.get(key);
        if (plan === undefined) {
            if (this.#sources.size >= 1024) {
                throw new DesignSvgInputError('SVG exceeds the editable pattern source budget.');
            }
            plan = {
                id: this.identify('pattern-source:' + this.#sources.size.toString()),
                patternId,
                definition,
                style,
                width: cellWidth,
                height: cellHeight,
                matrix,
                viewportWidth,
                viewportHeight,
                references: this.#references,
            };
            this.#sources.set(key, plan);
        }
        const placement: DesignSvgMatrix = T.multiply(
            context.matrix,
            T.multiply(T.parse(a['patternTransform'] ?? ''), {
                a: cellWidth,
                b: 0,
                c: 0,
                d: cellHeight,
                e:
                    (object ? context.source.x : 0) +
                    DesignSvgNumbers.length(a['x'] ?? '0', object ? 1 : context.viewportWidth) *
                        unitWidth,
                f:
                    (object ? context.source.y : 0) +
                    DesignSvgNumbers.length(a['y'] ?? '0', object ? 1 : context.viewportHeight) *
                        unitHeight,
            }),
        );
        return DesignStyleCodec.paint({
            ...DesignDefaults.paint('#FFFFFF'),
            kind: 'pattern',
            patternId: plan.id,
            opacity,
            framing: {
                ...DesignDefaults.framing(),
                fit: 'tile',
                transform: {
                    a: placement.a / context.target.width,
                    b: placement.b / context.target.height,
                    c: placement.c / context.target.width,
                    d: placement.d / context.target.height,
                    tx: (placement.e - context.target.x) / context.target.width,
                    ty: (placement.f - context.target.y) / context.target.height,
                },
            },
        });
    }

    #object(value: string): boolean {
        if (value !== 'objectBoundingBox' && value !== 'userSpaceOnUse') {
            throw new DesignSvgInputError('Unsupported SVG pattern coordinate units.');
        }
        return value === 'objectBoundingBox';
    }
}
