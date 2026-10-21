import { expect, it } from 'vitest';
import { Graphics, GraphicKind, GraphicStyle, type Graphic } from '../src/graphics/Graphic.js';
import { isEventData } from '../src/protocol/Events.js';
import * as validators from '../src/protocol/Validators.js';

const graphic: Graphic = {
    version: 1,
    id: 'test',
    title: 'Measurements',
    description: '',
    kind: 'line',
    style: 'studio',
    xLabel: 'Day',
    yLabel: 'Latency',
    unit: 'ms',
    source: 'Measured locally',
    series: [
        {
            name: 'API',
            points: [
                { label: 'Mon', value: 2, x: 1 },
                { label: 'Tue', value: 4, x: 2 },
                { label: 'Wed', value: 3, x: 3 },
            ],
        },
    ],
};
const call = { id: 'call', name: 'render_graphic', input: {} };
it('accepts all native graphic packets and retains graphics through results and history validation', (): void => {
    for (const kind of Object.values(GraphicKind)) {
        for (const style of Object.values(GraphicStyle)) {
            const value: Graphic = { ...graphic, kind, style };
            const event = { type: 'graphic', call, graphic: value };
            expect(isEventData('turn.event', { streamId: 'stream', event })).toBe(true);
            const outcome = {
                type: 'tool-finish',
                outcome: {
                    call,
                    durationMs: 1,
                    result: { status: 'ok', content: 'Delivered', graphic: value },
                },
            };
            expect(validators.turnEvent({ streamId: 'stream', event: outcome })).toBe(true);
            expect(
                validators.historyRecord({
                    id: 'saved',
                    at: 1,
                    kind: 'event',
                    data: { streamId: 'stream', event },
                }),
            ).toBe(true);
            expect(Graphics.parse(value)).toEqual(value);
        }
    }
});
it('rejects invalid semantic data through the actual network validators, including nested history and outcomes', (): void => {
    for (const value of [
        { ...graphic, version: 2 },
        { ...graphic, extra: 'x'.repeat(256 * 1024) },
        { ...graphic, style: 'invented' },
        { ...graphic, kind: 'donut', series: [{ name: 'A', points: [{ label: 'A', value: -1 }] }] },
        { ...graphic, title: 'x'.repeat(161) },
        {
            ...graphic,
            series: [
                {
                    name: 'A',
                    points: Array.from({ length: 257 }, (_entry: unknown, index: number) => ({
                        label: String(index),
                        value: 1,
                    })),
                },
            ],
        },
        { ...graphic, series: [{ name: 'A', points: [{ label: 'A', value: NaN }] }] },
        {
            ...graphic,
            series: [
                { name: 'A', points: [{ label: 'A', value: 1 }] },
                { name: 'B', points: [{ label: 'B', value: 2 }] },
            ],
        },
    ]) {
        const event = { type: 'graphic', call, graphic: value };
        expect(isEventData('turn.event', { streamId: 'stream', event })).toBe(false);
        expect(
            validators.historyRecord({
                id: 'saved',
                at: 1,
                kind: 'event',
                data: { streamId: 'stream', event },
            }),
        ).toBe(false);
        expect(
            validators.turnEvent({
                streamId: 'stream',
                event: {
                    type: 'tool-finish',
                    outcome: {
                        call,
                        durationMs: 1,
                        result: { status: 'ok', content: 'Delivered', graphic: value },
                    },
                },
            }),
        ).toBe(false);
    }
});
