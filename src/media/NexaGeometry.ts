import type { StreamParams } from '../protocol/Protocol.js';
import { NexaMedia } from './NexaMedia.js';

/** Sampling controls shared by text and image generation. */
export interface GeometryOptions {
    readonly seed?: number;
    readonly steps?: number;
}

/** Image-conditioned generation controls. */
export interface ImageGeometryOptions extends GeometryOptions {
    readonly resolution?: 512 | 1024;
}

/** Builds agent-mediated generation turns for client.stream; it does not bypass tool policy. */
export class NexaGeometry {
    /** Requests a new asset from text and delivery of the GLB and rendered previews. */
    public static text(prompt: string, options: GeometryOptions = {}): StreamParams {
        if (!prompt.trim() || prompt.length > 16384) {
            throw new RangeError('3D prompt must contain 1–16384 characters');
        }
        NexaGeometry.#validate(options);
        return {
            message: `Use generate_3d with these arguments: ${JSON.stringify({ prompt, ...options, formats: ['glb'] })}. Deliver the generated GLB with send_media(asFile=true) and the PNG previews.`,
        };
    }

    /** Uploads a PNG/JPEG reference through the normal authenticated attachment carrier. */
    public static async image(
        image: Blob,
        options: ImageGeometryOptions = {},
    ): Promise<StreamParams> {
        NexaGeometry.#validate(options);
        if (options.resolution !== undefined && ![512, 1024].includes(options.resolution)) {
            throw new RangeError('3D resolution must be 512 or 1024');
        }
        if (!['image/png', 'image/jpeg'].includes(image.type)) {
            throw new TypeError('3D reference must be PNG or JPEG');
        }
        if (image.size === 0 || image.size > 16 * 1024 * 1024) {
            throw new RangeError('3D reference must be between 1 byte and 16 MiB');
        }
        return {
            message: `Use generate_3d with image set to the attached reference's workspace path and these additional arguments: ${JSON.stringify({ ...options, formats: ['glb'] })}. Do not substitute a text prompt. Deliver the generated GLB with send_media(asFile=true) and the PNG previews.`,
            attachments: [await NexaMedia.image(image, '3D reference')],
        };
    }

    static #validate(options: GeometryOptions): void {
        if (
            options.seed !== undefined &&
            (!Number.isInteger(options.seed) || options.seed < 0 || options.seed > 4294967295)
        ) {
            throw new RangeError('3D seed must be an unsigned 32-bit integer');
        }
        if (
            options.steps !== undefined &&
            (!Number.isInteger(options.steps) || options.steps < 1 || options.steps > 100)
        ) {
            throw new RangeError('3D steps must be between 1 and 100');
        }
    }
}
