// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
    DesignPaths,
    type DesignPathAnchor,
    type DesignPathGeometry,
} from '../src/design/DesignPaths.js';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignEdits } from '../src/design/DesignEdits.js';
import {
    DesignKind,
    DesignPathVerb as Verb,
    type DesignNode,
    type DesignDocument,
} from '../src/design/DesignTypes.js';
import type { DesignEditResult } from '../src/design/DesignOperationTypes.js';

describe('shared vector authoring and durable resize', (): void => {
    it('uses true curve extrema rather than tangent control bounds', (): void => {
        const cubic: DesignPathGeometry = DesignPaths.normalize([
            { verb: Verb.Move, values: [10, 20] },
            { verb: Verb.Cubic, values: [10, 120, 110, 120, 110, 20] },
        ]);
        expect(cubic).toMatchObject({ x: 10, y: 20, width: 100, height: 75 });
        expect(cubic.path[1]?.values).toEqual([0, 100, 100, 100, 100, 0]);
        const quadratic: DesignPathGeometry = DesignPaths.normalize([
            { verb: Verb.Move, values: [-10, -20] },
            { verb: Verb.Quadratic, values: [40, 80, 90, -20] },
        ]);
        expect(quadratic).toMatchObject({ x: -10, y: -20, width: 100, height: 50 });
    });
    it('retains pen tangents and closes the final curved segment without joining subpaths', (): void => {
        const anchors: readonly DesignPathAnchor[] = [
            { x: 10, y: 20, incomingX: 0, incomingY: 20, outgoingX: 20, outgoingY: 20 },
            { x: 110, y: 70, incomingX: 100, incomingY: 70, outgoingX: 120, outgoingY: 70 },
        ];
        const drawn: DesignPathGeometry = DesignPaths.draw(anchors, true);
        expect(drawn.path.map((command): string => command.verb)).toEqual([
            Verb.Move,
            Verb.Cubic,
            Verb.Cubic,
            Verb.Close,
        ]);
        expect((): DesignPathGeometry =>
            DesignPaths.draw(
                [
                    {
                        x: 10,
                        y: 20,
                        incomingX: null,
                        incomingY: 20,
                        outgoingX: null,
                        outgoingY: null,
                    },
                    {
                        x: 110,
                        y: 70,
                        incomingX: null,
                        incomingY: null,
                        outgoingX: null,
                        outgoingY: null,
                    },
                ],
                false,
            ),
        ).toThrow();
        const subpaths: DesignPathGeometry = DesignPaths.normalize([
            { verb: Verb.Move, values: [10, 20] },
            { verb: Verb.Line, values: [20, 30] },
            { verb: Verb.Close, values: [] },
            { verb: Verb.Move, values: [100, 200] },
            { verb: Verb.Line, values: [120, 220] },
        ]);
        expect(subpaths).toMatchObject({ x: 10, y: 20, width: 110, height: 200 });
        expect(subpaths.path[3]?.values).toEqual([90, 180]);
    });
    it('resizes endpoints and controls atomically and restores them through undo', (): void => {
        const node: DesignNode = {
            ...DesignDefaults.node('vector', DesignKind.Path),
            path: [
                { verb: Verb.Move, values: [0, 0] },
                { verb: Verb.Cubic, values: [40, 20, 120, 80, 160, 120] },
            ],
        };
        const source: DesignDocument = DesignEdits.apply(DesignDefaults.document('paths'), [
            { op: 'insert', node, parentId: null, pageId: 'page-1', index: 0 },
        ]).document;
        const resized: DesignEditResult = DesignEdits.apply(source, [
            { op: 'update', id: 'vector', changes: { width: 320, height: 60 } },
        ]);
        expect(
            resized.document.nodes.find((layer: DesignNode): boolean => layer.id === 'vector')
                ?.path[1]?.values,
        ).toEqual([80, 10, 240, 40, 320, 60]);
        expect(
            DesignEdits.restore(resized.document, resized.changes, true).document.nodes,
        ).toEqual(source.nodes);
        const explicit: DesignNode = DesignPaths.resize(node, {
            width: 320,
            path: [{ verb: Verb.Move, values: [5, 6] }],
        });
        expect(explicit.path[0]?.values).toEqual([5, 6]);
    });
    it('provides visible line and closed polygon templates', (): void => {
        const line: DesignNode = DesignDefaults.node('line', DesignKind.Line);
        expect(line.style.fills).toEqual([]);
        expect(line.style.stroke?.width).toBe(2);
        expect(line.path.at(-1)).toEqual({ verb: Verb.Line, values: [160, 120] });
        expect(DesignDefaults.node('polygon', DesignKind.Polygon).path.at(-1)?.verb).toBe(
            Verb.Close,
        );
    });
});
