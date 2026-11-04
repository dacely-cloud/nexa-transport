// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { VisualValue as Value } from './VisualValue.js';
import {
    VisualTone,
    VisualElementKind,
    VisualIcon,
    VisualSide,
    VisualLine,
    VisualArrow,
    type VisualResponse,
    type VisualElement,
    type VisualConnection,
    type VisualPoint,
    type VisualStep,
} from './VisualResponse.js';
export type {
    VisualResponse,
    VisualElement,
    VisualConnection,
    VisualPoint,
    VisualStep,
} from './VisualResponse.js';
export {
    VisualTone,
    VisualElementKind,
    VisualIcon,
    VisualSide,
    VisualLine,
    VisualArrow,
} from './VisualResponse.js';

/** One portable decoder protects native tool execution, network receipt and restored history. */
export class VisualResponses {
    /** Normalize optional presentation fields and reject geometry, references or styles that cannot be rendered. */
    public static parse(raw: unknown, complete: boolean = false): VisualResponse {
        const scene: Readonly<Record<string, unknown>> = Value.record(
            raw,
            [
                'version',
                'id',
                'title',
                'description',
                'width',
                'height',
                'elements',
                'connections',
                'steps',
            ],
            complete,
        );
        if (scene.version !== 1) {
            throw new Error('Unsupported visual response version. Expected 1.');
        }
        const width: number = Value.number(scene.width, 320, 2400);
        const height: number = Value.number(scene.height, 180, 2400);
        const elements: readonly VisualElement[] = Object.freeze(
            Value.array(scene.elements, 32).map((raw: unknown): VisualElement =>
                this.#element(raw, width, height, complete),
            ),
        );
        if (elements.length === 0) {
            throw new Error('A visual response needs at least one element.');
        }
        const ids: ReadonlySet<string> = new Set(
            elements.map((item: VisualElement): string => item.id),
        );
        if (ids.size !== elements.length) {
            throw new Error('Duplicate visual element id.');
        }
        const foreground: readonly VisualElement[] = elements.filter(
            (item: VisualElement): boolean => item.kind !== VisualElementKind.Group,
        );
        for (let index: number = 0; index < foreground.length; index++) {
            const item: VisualElement | undefined = foreground[index];
            if (item === undefined) {
                continue;
            }
            for (const other of foreground.slice(index + 1)) {
                if (
                    item.x < other.x + other.width &&
                    item.x + item.width > other.x &&
                    item.y < other.y + other.height &&
                    item.y + item.height > other.y
                ) {
                    throw new Error(
                        'Foreground visual elements overlap. Use a group for a background region and leave room between components.',
                    );
                }
            }
        }
        const targets: ReadonlySet<string> = new Set(
            elements
                .filter((item: VisualElement): boolean => item.kind !== VisualElementKind.Group)
                .map((item: VisualElement): string => item.id),
        );
        const connections: readonly VisualConnection[] = Object.freeze(
            Value.array(scene.connections, 64).map((raw: unknown): VisualConnection => {
                const item: Readonly<Record<string, unknown>> = Value.record(
                    raw,
                    [
                        'id',
                        'from',
                        'to',
                        'label',
                        'fromSide',
                        'toSide',
                        'line',
                        'arrow',
                        'animated',
                        'via',
                    ],
                    complete,
                );
                const from: string = Value.id(item.from);
                const to: string = Value.id(item.to);
                if (!targets.has(from) || !targets.has(to)) {
                    throw new Error(
                        'Visual connections must reference existing non-group elements.',
                    );
                }
                if (item.animated !== undefined && typeof item.animated !== 'boolean') {
                    throw new Error('Visual animation must be a boolean.');
                }
                return Object.freeze({
                    id: Value.id(item.id),
                    from,
                    to,
                    label: Value.text(item.label, 64, ''),
                    fromSide: Value.choice(item.fromSide, VisualSide, VisualSide.Auto),
                    toSide: Value.choice(item.toSide, VisualSide, VisualSide.Auto),
                    line: Value.choice(item.line, VisualLine, VisualLine.Solid),
                    arrow: Value.choice(item.arrow, VisualArrow, VisualArrow.Forward),
                    animated: item.animated === true,
                    via: Object.freeze(
                        Value.array(item.via, 8).map((raw: unknown): VisualPoint => {
                            const point: Readonly<Record<string, unknown>> = Value.record(
                                raw,
                                ['x', 'y'],
                                complete,
                            );
                            return Object.freeze({
                                x: Value.number(point.x, 8, width - 8),
                                y: Value.number(point.y, 8, height - 8),
                            });
                        }),
                    ),
                });
            }),
        );
        const connectionIds: ReadonlySet<string> = new Set(
            connections.map((item: VisualConnection): string => item.id),
        );
        if (connectionIds.size !== connections.length) {
            throw new Error('Duplicate visual connection id.');
        }
        const steps: readonly VisualStep[] = Object.freeze(
            Value.array(scene.steps, 8).map((raw: unknown): VisualStep => {
                const step: Readonly<Record<string, unknown>> = Value.record(
                    raw,
                    ['title', 'detail', 'elements', 'connections'],
                    complete,
                );
                return Object.freeze({
                    title: Value.text(step.title, 64),
                    detail: Value.text(step.detail, 400, ''),
                    elements: this.#references(step.elements, ids, 32),
                    connections: this.#references(step.connections, connectionIds, 64),
                });
            }),
        );
        const result: VisualResponse = Object.freeze({
            version: 1,
            id: Value.id(scene.id),
            title: Value.text(scene.title, 120),
            description: Value.text(scene.description, 600, ''),
            width,
            height,
            elements,
            connections,
            steps,
        });
        if (new TextEncoder().encode(JSON.stringify(result)).byteLength > 65536) {
            throw new Error('Visual response exceeds the 64 KiB limit.');
        }
        return result;
    }
    /** Validators reject malformed scenes without leaking an exception into socket handling. */
    public static isValid(raw: unknown): raw is VisualResponse {
        try {
            this.parse(raw, true);
            return true;
        } catch {
            return false;
        }
    }
    static #references(raw: unknown, known: ReadonlySet<string>, limit: number): readonly string[] {
        return Object.freeze(
            Value.array(raw, limit).map((entry: unknown): string => {
                const id: string = Value.id(entry);
                if (!known.has(id)) {
                    throw new Error('Visual step references a missing element or connection.');
                }
                return id;
            }),
        );
    }
    static #element(
        raw: unknown,
        canvasWidth: number,
        canvasHeight: number,
        complete: boolean,
    ): VisualElement {
        const item: Readonly<Record<string, unknown>> = Value.record(
            raw,
            [
                'id',
                'kind',
                'title',
                'detail',
                'eyebrow',
                'value',
                'icon',
                'tone',
                'x',
                'y',
                'width',
                'height',
            ],
            complete,
        );
        const kind: VisualElementKind = Value.choice(
            item.kind,
            VisualElementKind,
            VisualElementKind.Card,
        );
        const x: number = Value.number(item.x, 8, canvasWidth - 8);
        const y: number = Value.number(item.y, 8, canvasHeight - 8);
        const width: number = Value.number(
            item.width,
            kind === VisualElementKind.Text ? 120 : 180,
            1200,
        );
        const height: number = Value.number(
            item.height,
            kind === VisualElementKind.Text ? 40 : kind === VisualElementKind.Group ? 64 : 100,
            1600,
        );
        if (x + width > canvasWidth - 8 || y + height > canvasHeight - 8) {
            throw new Error('Visual elements must fit inside the scene with an 8px margin.');
        }
        return Object.freeze({
            id: Value.id(item.id),
            kind,
            x,
            y,
            width,
            height,
            title: Value.text(item.title, 80),
            detail: Value.text(item.detail, 240, ''),
            eyebrow: Value.text(item.eyebrow, 32, ''),
            value: Value.text(item.value, 32, ''),
            icon: Value.choice(item.icon, VisualIcon, VisualIcon.None),
            tone: Value.choice(item.tone, VisualTone, VisualTone.Neutral),
        });
    }
}
