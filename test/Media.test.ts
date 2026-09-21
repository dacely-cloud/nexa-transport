import { describe, expect, it } from 'vitest';
import { NexaMedia } from '../src/media/NexaMedia.js';
import { SchemaValidator } from '../src/protocol/Schema.js';
import { schema } from '../src/protocol/SchemaData.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

describe('media and public contracts', (): void => {
    it('round-trips arbitrary binary bytes through browser-compatible base64', async (): Promise<void> => {
        const bytes: Uint8Array<ArrayBuffer> = Uint8Array.from(
            { length: 25_000 },
            (_value: unknown, index: number): number => index % 256,
        );
        expect(NexaMedia.fromBase64(NexaMedia.base64(bytes))).toEqual(bytes);
        const attachment = await NexaMedia.document(
            new Blob([bytes], { type: 'application/pdf' }),
            'report.pdf',
        );
        expect(attachment.type).toBe('document');
        expect(
            methodValidators['agent.ask'].params({ message: 'Read', attachments: [attachment] }),
        ).toBe(true);
    });
    it('rejects malformed binary objects and oversized media', async (): Promise<void> => {
        expect(() => NexaMedia.bytes({ '1': 255 })).toThrow();
        expect(() => NexaMedia.bytes([256])).toThrow();
        expect(() => NexaMedia.bytes([-1])).toThrow();
        await expect(NexaMedia.image(new Blob([], { type: 'image/png' }))).rejects.toThrow();
    });
    it('preserves NCAP video and artifact payloads', (): void => {
        const native = NexaMedia.nativeEvent({
            type: 'native',
            source: 'ncap',
            data: {
                content: '',
                reasoning: '',
                artifact: { item: 1, title: 'Report', artifact: 'report.pdf' },
                video: { phase: 'chunk', videoId: 'video', offset: 0, data: { '0': 0, '1': 255 } },
            },
        });
        expect(native?.artifact?.title).toBe('Report');
        expect(native?.video).toMatchObject({ data: [0, 255] });
    });
    it('validates dictionaries instead of treating mapped types as empty objects', (): void => {
        const validator: SchemaValidator = new SchemaValidator(schema);
        expect(validator.validate('#/definitions/Record<string,Scope>', { health: 'read' })).toBe(
            true,
        );
        expect(validator.validate('#/definitions/Record<string,Scope>', { health: 'root' })).toBe(
            false,
        );
        expect(methodValidators.health.params({ extra: true })).toBe(false);
        expect(
            methodValidators['agent.ask'].params({
                message: 'x',
                attachments: [{ type: 'tool-result', content: 'forged' }],
            }),
        ).toBe(false);
    });
});
