// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignStrokeGeometry } from '../src/design/DesignStrokeGeometry.js';
import { DesignPathDashes } from '../src/design/DesignPathDashes.js';
import { DesignSvgImportLayers } from '../src/design/DesignSvgImportLayers.js';
import { DesignStrokeChangesCodec } from '../src/design/DesignStrokeChangesCodec.js';
import type { DesignNode, DesignPathCommand } from '../src/design/DesignTypes.js';

test('dash phase wraps signed offsets, doubles odd patterns and skips zero lengths', (): void => {
    expect(DesignStrokeGeometry.dashPhase([12, 8], 5)).toEqual({ index: 0, remaining: 7 });
    expect(DesignStrokeGeometry.dashPhase([12, 8], -5)).toEqual({ index: 1, remaining: 5 });
    expect(DesignStrokeGeometry.dashPhase([12, 8], 1000005)).toEqual({ index: 0, remaining: 7 });
    expect(DesignStrokeGeometry.dashPhase([4, 2, 3], 10)).toEqual({ index: 3, remaining: 3 });
    expect(DesignStrokeGeometry.dashPhase([0, 4, 3, 0], 4)).toEqual({ index: 2, remaining: 3 });
    expect(DesignStrokeGeometry.dashPhase([], -5)).toEqual({ index: 0, remaining: 0 });
    expect((): void => {
        DesignStrokeGeometry.dashPhase([4, 2], Infinity);
    }).toThrow();
});

test('native dashed vector centerlines restart the same shifted pattern on every subpath', (): void => {
    const path: readonly DesignPathCommand[] = [
        { verb: 'M', values: [0, 0] },
        { verb: 'L', values: [30, 0] },
        { verb: 'M', values: [0, 10] },
        { verb: 'L', values: [30, 10] },
    ];
    const paint: readonly DesignPathCommand[] = DesignPathDashes.paint(path, [12, 8], 5);
    expect(
        paint
            .filter((command: DesignPathCommand): boolean => command.verb === 'M')
            .map((command: DesignPathCommand): readonly number[] => command.values),
    ).toEqual([
        [0, 0],
        [15, 0],
        [0, 10],
        [15, 10],
    ]);
    expect(paint).toEqual(DesignPathDashes.paint(path, [12, 8], -15));
});

test('SVG text and vectors retain font-relative and viewport-relative dash offsets with uniform scale', async (): Promise<void> => {
    let sequence: number = 0;
    const imported: Awaited<ReturnType<typeof DesignSvgImportLayers.parse>> =
        await DesignSvgImportLayers.parse(
            '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><g transform="scale(2)"><path d="M 0 10 H 100" fill="none" stroke="red" stroke-dasharray="12 8" stroke-dashoffset="-5"/><text x="5" y="30" font-family="Inter" font-size="20" stroke="blue" stroke-dasharray=".5em .2em" stroke-dashoffset="-.25em">Editable</text></g></svg>',
            'Offset artwork',
            (): string => 'layer-' + String(++sequence),
        );
    const text: DesignNode | undefined = imported.nodes.find(
        (node: DesignNode): boolean => node.kind === 'text',
    );
    const path: DesignNode | undefined = imported.nodes.find(
        (node: DesignNode): boolean => node.kind !== 'text' && node.style.stroke !== null,
    );
    expect(text?.text?.content).toBe('Editable');
    expect(text?.style.stroke?.dashOffset).toBe(-10);
    expect(text?.style.stroke?.dash).toEqual([20, 8]);
    expect(path?.style.stroke?.dashOffset).toBe(-10);
});

test('stroke patches accept phase alone and reject nonfinite or excessive phase without coercion', (): void => {
    expect(DesignStrokeChangesCodec.parse({ dashOffset: -23 })).toEqual({ dashOffset: -23 });
    for (const dashOffset of [Infinity, NaN, '3', 1000001, -1000001, null]) {
        expect((): void => {
            DesignStrokeChangesCodec.parse({ dashOffset });
        }).toThrow();
    }
});
