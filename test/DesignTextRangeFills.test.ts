// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest';
import { DesignDefaults } from '../src/design/DesignDefaults.js';
import { DesignTextStyles } from '../src/design/DesignTextStyles.js';
import { DesignStyleCodec } from '../src/design/DesignStyleCodec.js';
import { DesignFontBindings } from '../src/design/DesignFontBindings.js';
import { DesignTextShaping } from '../src/design/DesignTextShaping.js';
import { DesignTextStyleChangesCodec } from '../src/design/DesignTextStyleChangesCodec.js';
import type { DesignPaint, DesignText, DesignTextRun } from '../src/design/DesignTypes.js';

function source(): DesignText {
    const text: DesignText | null = DesignDefaults.node('caption', 'text').text;
    if (text === null) {
        throw new Error('Missing text defaults');
    }
    return { ...text, content: 'Keep 🐕 every original character.', runs: [] };
}

const gradient: DesignPaint = {
    ...DesignDefaults.paint(),
    kind: 'linear',
    opacity: 0.7,
    stops: [
        { offset: 0, color: '#FF0066' },
        { offset: 1, color: '#3366FF' },
    ],
};

test('range paint boundaries reject ambiguous colors, oversized stacks and unknown paint fields', (): void => {
    const invalid: readonly unknown[] = [
        { fills: [gradient], color: '#112233' },
        { fills: [], color: '#112233' },
        { fills: Array.from({ length: 9 }, (): DesignPaint => gradient) },
        { fills: [{ ...gradient, unsupported: true }] },
        { fills: [{ ...gradient, opacity: 2 }] },
        {
            fills: [
                {
                    ...gradient,
                    stops: [
                        { offset: 1, color: '#112233' },
                        { offset: 0, color: '#112233' },
                    ],
                },
            ],
        },
        { fills: 'linear' },
    ];
    for (const value of invalid) {
        expect((): ReturnType<typeof DesignTextStyleChangesCodec.parse> =>
            DesignTextStyleChangesCodec.parse(value),
        ).toThrow();
    }
    const original: DesignText = source();
    expect((): DesignText => DesignTextStyles.apply(original, 6, 7, { fills: [gradient] })).toThrow(
        'Unicode',
    );
    expect(original).toEqual(source());
});

test('range fill stacks preserve all source text and typography and coalesce only equal paint stacks', (): void => {
    const original: DesignText = source();
    const first: DesignText = DesignTextStyles.apply(original, 0, 4, { fills: [gradient] });
    expect(first.content).toBe(original.content);
    expect(first.runs).toMatchObject([{ start: 0, end: 4, color: null, fills: [gradient] }]);
    const joined: DesignText = DesignTextStyles.apply(first, 4, 7, { fills: [gradient] });
    expect(joined.runs).toHaveLength(1);
    expect(joined.runs[0]).toMatchObject({
        start: 0,
        end: 7,
        size: original.size,
        family: original.family,
    });
    const changed: DesignText = DesignTextStyles.apply(joined, 7, 13, {
        fills: [{ ...gradient, opacity: 0.4 }],
    });
    expect(changed.runs).toHaveLength(2);
    expect(DesignStyleCodec.text(changed)).toEqual(changed);
    expect(DesignTextStyles.apply(changed, 0, 7, { fills: [gradient] })).toBe(changed);
});

test('a solid range color replaces its explicit fill stack and clearing fills restores inheritance', (): void => {
    const painted: DesignText = DesignTextStyles.apply(source(), 0, 4, { fills: [gradient] });
    const colored: DesignText = DesignTextStyles.apply(painted, 0, 4, { color: '#00AA66' });
    expect(colored.runs[0]).toMatchObject({ color: '#00AA66', fills: null });
    const inherited: DesignText = DesignTextStyles.apply(painted, 0, 4, { fills: null });
    expect(inherited.runs[0]).toMatchObject({ color: null, fills: null });
    const invisible: DesignText = DesignTextStyles.apply(painted, 0, 4, { fills: [] });
    expect(invisible.runs[0]).toMatchObject({ color: null, fills: [] });
});

test('paint identity splits glyph paint slices without changing the selected face', (): void => {
    const text: DesignText = DesignTextStyles.apply(source(), 0, 4, { fills: [gradient] });
    const run: DesignTextRun | undefined = text.runs[0];
    if (run === undefined) {
        throw new Error('Missing range');
    }
    const other: DesignTextRun = { ...run, fills: [{ ...gradient, opacity: 0.5 }] };
    expect(
        DesignTextShaping.samePaint(
            DesignFontBindings.run(text, run),
            DesignFontBindings.run(text, other),
        ),
    ).toBe(false);
    expect(
        DesignTextShaping.samePaint(
            DesignFontBindings.run(text, run),
            DesignFontBindings.run(text, { ...run, fills: [gradient] }),
        ),
    ).toBe(true);
});
