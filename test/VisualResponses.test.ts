// SPDX-License-Identifier: Apache-2.0
import { expect, it } from 'vitest';
import { VisualResponses, type VisualResponse } from '../src/visuals/VisualResponses.js';
import { isEventData } from '../src/protocol/Events.js';
import type { ToolResult } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

const visual: VisualResponse = VisualResponses.parse({
    version: 1,
    id: 'explanation',
    title: 'Inference',
    width: 400,
    height: 220,
    elements: [
        {
            id: 'worker',
            kind: 'card',
            title: 'GPU worker',
            detail: 'Runs a loaded model.',
            x: 24,
            y: 24,
            width: 340,
            height: 160,
            icon: 'cpu',
            tone: 'orange',
        },
    ],
});

it('validates rich visual UI in live results and saved tool-result messages', (): void => {
    const result: ToolResult = { status: 'ok', content: 'Delivered', visual };
    expect(
        isEventData('turn.event', {
            streamId: 'stream',
            event: {
                type: 'tool-finish',
                outcome: {
                    call: { id: 'visual', name: 'render_visual', input: {} },
                    durationMs: 1,
                    result,
                },
            },
        }),
    ).toBe(true);
    expect(
        methodValidators['sessions.messages'].result([
            {
                role: 'user',
                content: [
                    { type: 'tool-result', toolUseId: 'visual', content: 'Delivered', visual },
                ],
            },
        ]),
    ).toBe(true);
    for (const invalid of [
        { ...visual, elements: null },
        { ...visual, elements: [{ ...visual.elements[0], x: -10 }] },
        { ...visual, connections: [{ id: 'dangling', from: 'worker', to: 'missing' }] },
        { ...visual, style: { css: 'unsafe' } },
    ]) {
        expect(
            isEventData('turn.event', {
                streamId: 'stream',
                event: {
                    type: 'tool-finish',
                    outcome: {
                        call: { id: 'visual', name: 'render_visual', input: {} },
                        durationMs: 1,
                        result: { status: 'ok', content: 'Delivered', visual: invalid },
                    },
                },
            }),
        ).toBe(false);
        expect(
            methodValidators['sessions.messages'].result([
                {
                    role: 'user',
                    content: [
                        {
                            type: 'tool-result',
                            toolUseId: 'visual',
                            content: 'Delivered',
                            visual: invalid,
                        },
                    ],
                },
            ]),
        ).toBe(false);
    }
});
it('bounds rendering work and returns immutable, normalized presentation fields', (): void => {
    expect(VisualResponses.parse(visual)).toEqual(visual);
    expect(Object.isFrozen(VisualResponses.parse(visual).elements[0])).toBe(true);
    expect(
        VisualResponses.isValid({
            ...visual,
            elements: Array.from(
                { length: 33 },
                (): VisualResponse['elements'][number] =>
                    visual.elements[0] ?? {
                        id: 'a',
                        kind: 'card',
                        title: 'A',
                        detail: '',
                        eyebrow: '',
                        value: '',
                        icon: 'none',
                        tone: 'neutral',
                        x: 8,
                        y: 8,
                        width: 180,
                        height: 100,
                    },
            ),
        }),
    ).toBe(false);
    expect(VisualResponses.isValid({ ...visual, width: NaN })).toBe(false);
});
