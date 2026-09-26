import type { InboundAttachment } from '../src/protocol/Protocol.js';
import { BinaryMedia } from '../src/media/BinaryMedia.js';
import { BinaryEnvelope } from '../src/media/BinaryEnvelope.js';
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

// Wire codecs must reject invalid media before retaining or exposing a payload.
describe('binary wire codecs', (): void => {
    it('returns a view of a validated file rather than copying the payload', (): void => {
        const data: Uint8Array<ArrayBuffer> = new Uint8Array([1, 2, 3]);
        const frame = BinaryMedia.encode(
            {
                id: 'file',
                filename: 'file.bin',
                mimeType: 'application/octet-stream',
                byteLength: 3,
            },
            data,
        );
        const file = BinaryMedia.decode(frame.buffer, frame.byteLength);
        expect(file.data.buffer).toBe(frame.buffer);
        expect(file.data).toEqual(data);
        expect(() => BinaryMedia.decode(frame.buffer, frame.byteLength - 1)).toThrow();
        expect(() => BinaryMedia.decode(frame.slice(0, -1).buffer, frame.byteLength)).toThrow();
    });
    it('round-trips native number arrays and checks their expanded JSON limit', (): void => {
        const original = { voice: [0, 9, 10, 99, 100, 255] };
        const frame = BinaryEnvelope.encode(JSON.stringify(original));
        if (frame === null) {
            throw new Error('Missing envelope');
        }
        const length: number = new TextEncoder().encode(JSON.stringify(original)).length;
        expect(BinaryEnvelope.decode(frame.buffer, frame.byteLength, length)).toEqual(original);
        expect(() => BinaryEnvelope.decode(frame.buffer, frame.byteLength, length - 1)).toThrow();
    });
});

it('transports 3D assets and normalizes native geometry bytes', async (): Promise<void> => {
    const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(12);
    bytes.set([103, 108, 84, 70]);
    const view: DataView = new DataView(bytes.buffer);
    view.setUint32(4, 2, true);
    view.setUint32(8, 12, true);
    const upload = await NexaMedia.model3d(
        new Blob([bytes], { type: 'model/gltf-binary' }),
        'chair.glb',
    );
    expect(
        methodValidators['agent.ask'].params({
            message: 'Inspect this model',
            attachments: [upload],
        }),
    ).toBe(true);
    const received = BinaryMedia.decode(
        BinaryMedia.encode(
            { id: 'model', filename: 'chair.glb', mimeType: 'model/gltf-binary', byteLength: 12 },
            bytes,
        ).buffer,
        1024,
    );
    expect(NexaMedia.geometryFormat(received)).toBe('glb');
    expect(new Uint8Array(await NexaMedia.geometryBlob(received).arrayBuffer())).toEqual(bytes);
    expect(
        NexaMedia.nativeEvent({
            type: 'native',
            source: 'ncap',
            data: {
                content: '',
                reasoning: '',
                geometry: {
                    phase: 'chunk',
                    assetId: 0,
                    revision: 0,
                    format: 'glb',
                    offset: 0,
                    totalBytes: 2,
                    data: { '0': 0, '1': 255 },
                },
            },
        })?.geometry,
    ).toMatchObject({ data: [0, 255] });
    view.setUint32(8, 200, true);
    await expect(
        NexaMedia.model3d(new Blob([bytes], { type: 'model/gltf-binary' })),
    ).rejects.toThrow('length');
});

it('preserves browser File names without requiring a separate title', async (): Promise<void> => {
    const file: File = new File(['%PDF-1.7'], 'founders_alignment_governance_proposal (2).pdf', {
        type: 'application/pdf',
    });
    const attachment: InboundAttachment = await NexaMedia.document(file);
    expect(attachment).toMatchObject({ type: 'document', title: file.name });
    expect(await NexaMedia.document(file, 'renamed.pdf')).toMatchObject({ title: 'renamed.pdf' });
    expect(
        await NexaMedia.document(new Blob(['%PDF-1.7'], { type: 'application/pdf' })),
    ).not.toHaveProperty('title');
});
