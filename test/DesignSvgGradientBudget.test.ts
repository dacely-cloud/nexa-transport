// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignSvgGradientBudget } from '../src/design/DesignSvgGradientBudget.js';

test('denser text sampling reserves later ordinary paints before consuming the document budget', (): void => {
    const budget: DesignSvgGradientBudget = new DesignSvgGradientBudget();
    for (let index: number = 0; index < 5; index++) {
        budget.reserve(index.toString(), 1000, 1000, 2);
    }
    const edges: number[] = [];
    for (let index: number = 0; index < 5; index++) {
        edges.push(budget.allocate(index.toString(), 1000, 1000, 2).width);
    }
    expect(edges).toEqual([2000, 2000, 2000, 1000, 1000]);
});

test('the full previously accepted sixteen-megapixel scene remains exportable and excess still rejects', (): void => {
    const budget: DesignSvgGradientBudget = new DesignSvgGradientBudget();
    for (let index: number = 0; index < 17; index++) {
        budget.reserve(index.toString(), 1000, 1000, 2);
    }
    for (let index: number = 0; index < 16; index++) {
        expect(budget.allocate(index.toString(), 1000, 1000, 2)).toEqual({
            width: 1000,
            height: 1000,
        });
    }
    expect(() => budget.allocate('16', 1000, 1000, 2)).toThrow('16 megapixel');
});

test('large ordinary paints retain the existing per-edge limit and duplicate reservations do not consume extra headroom', (): void => {
    const budget: DesignSvgGradientBudget = new DesignSvgGradientBudget();
    budget.reserve('wide', 3000, 30, 2);
    budget.reserve('wide', 3000, 30, 1);
    expect(budget.allocate('wide', 3000, 30, 2)).toEqual({ width: 3000, height: 30 });
    expect(() => budget.allocate('oversized', 5000, 30, 2)).toThrow('4096 pixels');
});
