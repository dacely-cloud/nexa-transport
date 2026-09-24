import { expect, it } from 'vitest';
import { NexaGeometry, NexaMedia } from '../src/media/NexaMedia.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

it('creates schema-valid text generation turns with explicit sampling controls', (): void => {
    const turn = NexaGeometry.text('A wooden chair', { seed: 7, steps: 25 });
    expect(methodValidators['agent.stream'].params(turn)).toBe(true);
    expect(turn.message).toContain('"prompt":"A wooden chair"');
    expect(turn.message).toContain('"seed":7');
    expect(turn.attachments).toBeUndefined();
});

it('preserves reference bytes and image controls through the attachment carrier', async (): Promise<void> => {
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const turn = await NexaGeometry.image(new Blob([bytes], { type: 'image/png' }), {
        resolution: 512,
        seed: 42,
    });
    expect(methodValidators['agent.stream'].params(turn)).toBe(true);
    expect(turn.message).toContain('"resolution":512');
    const attachment = turn.attachments?.[0];
    expect(attachment?.type).toBe('image');
    if (attachment?.type !== 'image' || attachment.source.kind !== 'base64') {
        throw new Error('Missing image bytes');
    }
    expect(NexaMedia.fromBase64(attachment.source.data)).toEqual(bytes);
});

it('rejects invalid controls and unsupported reference carriers before a request', async (): Promise<void> => {
    expect(() => NexaGeometry.text(' ')).toThrow();
    expect(() => NexaGeometry.text('chair', { seed: -1 })).toThrow();
    expect(() => NexaGeometry.text('chair', { steps: 101 })).toThrow();
    await expect(NexaGeometry.image(new Blob(['gif'], { type: 'image/gif' }))).rejects.toThrow(
        'PNG or JPEG',
    );
    await expect(NexaGeometry.image(new Blob([], { type: 'image/png' }))).rejects.toThrow('16 MiB');
});
