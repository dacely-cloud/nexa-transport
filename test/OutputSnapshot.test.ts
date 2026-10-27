import { expect, it } from 'vitest';
import { SchemaValidator } from '../src/protocol/Schema.js';
import { schema } from '../src/protocol/SchemaData.js';
import { turnEvent, historyRecord } from '../src/protocol/Validators.js';
import type { ToolProgress, WireTurnEvent } from '../src/protocol/Protocol.js';

const validator: SchemaValidator = new SchemaValidator(schema);

it.each(['', 'repeat\nrepeat\n', '漢'.repeat(65536), '😀'.repeat(32768)])(
    'validates bounded snapshots in actual live and saved event envelopes (%#)',
    (outputSnapshot: string): void => {
        const update: ToolProgress = { outputSnapshot };
        const event: WireTurnEvent = {
            type: 'tool-progress',
            call: { id: 'call', name: 'run_bash', input: {} },
            update,
        };
        expect(validator.validate('#/definitions/ToolProgress', update)).toBe(true);
        expect(turnEvent({ streamId: 'stream', event })).toBe(true);
        expect(
            historyRecord({
                id: 'saved',
                at: 1,
                kind: 'event',
                data: { streamId: 'stream', event },
            }),
        ).toBe(true);
    },
);

it.each([null, 42, {}, 'x'.repeat(65537), '😀'.repeat(32769)])(
    'rejects wrong types and UTF-16 length overflow in live and saved envelopes (%#)',
    (outputSnapshot: unknown): void => {
        const event: Readonly<Record<string, unknown>> = {
            type: 'tool-progress',
            call: { id: 'call', name: 'run_bash', input: {} },
            update: { outputSnapshot },
        };
        expect(validator.validate('#/definitions/ToolProgress', { outputSnapshot })).toBe(false);
        expect(turnEvent({ streamId: 'stream', event })).toBe(false);
        expect(
            historyRecord({
                id: 'saved',
                at: 1,
                kind: 'event',
                data: { streamId: 'stream', event },
            }),
        ).toBe(false);
    },
);
