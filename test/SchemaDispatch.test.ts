import { expect, it } from 'vitest';
import { SchemaValidator, type Schema } from '../src/protocol/Schema.js';

const schema: Schema = {
    definitions: {
        Event: {
            type: 'object',
            additionalProperties: false,
            properties: {
                kind: { type: 'string' },
                text: { type: 'string' },
                count: { type: 'integer' },
            },
            anyOf: [{ $ref: '#/definitions/Text' }, { $ref: '#/definitions/Count' }],
        },
        Text: {
            type: 'object',
            required: ['kind', 'text'],
            properties: { kind: { const: 'text' }, text: { type: 'string' } },
        },
        Count: {
            type: 'object',
            required: ['kind', 'count'],
            properties: { kind: { const: 'count' }, count: { type: 'integer', minimum: 0 } },
        },
        OptionalTag: {
            anyOf: [
                {
                    type: 'object',
                    properties: { kind: { const: 'first' }, text: { type: 'string' } },
                },
                {
                    type: 'object',
                    properties: { kind: { const: 'second' }, count: { type: 'integer' } },
                },
            ],
        },
        DuplicateTag: {
            anyOf: [
                {
                    type: 'object',
                    required: ['kind', 'text'],
                    properties: { kind: { const: 'same' }, text: { type: 'string' } },
                },
                {
                    type: 'object',
                    required: ['kind', 'count'],
                    properties: { kind: { const: 'same' }, count: { type: 'integer' } },
                },
            ],
        },
    },
};

it('keeps required fields, branch constraints, and enclosing constraints after dispatch', (): void => {
    const validator: SchemaValidator = new SchemaValidator(schema);
    for (let repeat: number = 0; repeat < 3; repeat++) {
        expect(validator.validate('#/definitions/Event', { kind: 'text', text: 'Café 🙂' })).toBe(
            true,
        );
        expect(validator.validate('#/definitions/Event', { kind: 'count', count: 12 })).toBe(true);
        expect(validator.validate('#/definitions/Event', { kind: 'text', count: 12 })).toBe(false);
        expect(validator.validate('#/definitions/Event', { kind: 'count', count: -1 })).toBe(false);
        expect(validator.validate('#/definitions/Event', { kind: 'count', count: 1.5 })).toBe(
            false,
        );
        expect(
            validator.validate('#/definitions/Event', { kind: 'other', text: 'wrong tag' }),
        ).toBe(false);
        expect(validator.validate('#/definitions/Event', { text: 'missing tag' })).toBe(false);
        expect(
            validator.validate('#/definitions/Event', { kind: 'text', text: 'valid', extra: true }),
        ).toBe(false);
        expect(validator.validate('#/definitions/Event', null)).toBe(false);
        expect(
            validator.validate('#/definitions/Absent', { kind: 'text', text: 'missing schema' }),
        ).toBe(false);
    }
});

it('retains normal union semantics when tags are optional or overlap', (): void => {
    const validator: SchemaValidator = new SchemaValidator(schema);
    expect(validator.validate('#/definitions/OptionalTag', { text: 'no tag needed' })).toBe(true);
    expect(
        validator.validate('#/definitions/DuplicateTag', { kind: 'same', text: 'first branch' }),
    ).toBe(true);
    expect(validator.validate('#/definitions/DuplicateTag', { kind: 'same', count: 7 })).toBe(true);
    expect(validator.validate('#/definitions/DuplicateTag', { kind: 'same' })).toBe(false);
});
