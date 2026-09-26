export { NexaGeometry } from './NexaGeometry.js';
export type { GeometryOptions, ImageGeometryOptions } from './NexaGeometry.js';
import type { ReceivedAttachment } from './BinaryMedia.js';
export { MeshoptDecoder } from 'meshoptimizer/decoder';
import type {
    BinarySource,
    InboundAttachment,
    JsonValue,
    NcapDelta,
    WireTurnEvent,
} from '../protocol/Protocol.js';
import { native } from '../protocol/Validators.js';
/** Creates protocol media blocks and decodes rich native payloads without platform imports. */
export class NexaMedia {
    /** Creates a 3D upload using the gateway's file carrier; bytes determine the stored asset kind. */
    public static async model3d(
        blob: Blob,
        title: string | undefined = NexaMedia.#filename(blob),
    ): Promise<InboundAttachment> {
        if (blob.size === 0 || blob.size > 100 * 1024 * 1024) {
            throw new RangeError('3D media must be between 1 byte and 100 MiB');
        }
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const format = NexaMedia.geometryFormat({ data: bytes, mimeType: blob.type });
        if (format === null) {
            throw new TypeError('Expected a GLB or PLY asset');
        }
        return NexaMedia.document(
            new Blob([bytes], {
                type: format === 'glb' ? 'model/gltf-binary' : 'application/x-ply',
            }),
            title,
        );
    }
    /** Identifies received 3D files by both their MIME type and binary header. */
    public static geometryFormat(
        file: Pick<ReceivedAttachment, 'data' | 'mimeType'>,
    ): 'glb' | 'ply' | null {
        const bytes = file.data;
        const header = new TextDecoder().decode(bytes.subarray(0, 128));
        if (
            file.mimeType === 'model/gltf-binary' &&
            bytes.length >= 12 &&
            header.startsWith('glTF')
        ) {
            const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
            if (view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.length) {
                throw new TypeError('Invalid GLB version or length');
            }
            return 'glb';
        }
        if (
            file.mimeType === 'application/x-ply' &&
            /^ply\r?\nformat (ascii|binary_little_endian|binary_big_endian) 1\.0\r?\n/.test(header)
        ) {
            return 'ply';
        }
        return null;
    }
    /** Creates a browser-renderable/downloadable Blob; callers own and revoke any object URLs. */
    public static geometryBlob(file: Pick<ReceivedAttachment, 'data' | 'mimeType'>): Blob {
        if (NexaMedia.geometryFormat(file) === null) {
            throw new TypeError('Expected GLB or PLY media');
        }
        return new Blob([file.data], { type: file.mimeType });
    }

    /** Encodes an image Blob as an inline Nexa attachment. */
    public static async image(
        blob: Blob,
        title: string | undefined = NexaMedia.#filename(blob),
    ): Promise<InboundAttachment> {
        return {
            type: 'image',
            source: await NexaMedia.#source(blob),
            ...(title === undefined ? {} : { title }),
        };
    }
    /** Encodes a video Blob as an inline Nexa attachment. */
    public static async video(
        blob: Blob,
        title: string | undefined = NexaMedia.#filename(blob),
    ): Promise<InboundAttachment> {
        return {
            type: 'video',
            source: await NexaMedia.#source(blob),
            ...(title === undefined ? {} : { title }),
        };
    }
    /** Encodes a document Blob as an inline attachment, preserving File.name unless title overrides it. */
    public static async document(
        blob: Blob,
        title: string | undefined = NexaMedia.#filename(blob),
    ): Promise<InboundAttachment> {
        return {
            type: 'document',
            source: await NexaMedia.#source(blob),
            ...(title === undefined ? {} : { title }),
        };
    }
    /** Encodes one ordered frame; consecutive frames form one clip. */
    public static async videoFrame(
        blob: Blob,
        title: string | undefined = NexaMedia.#filename(blob),
    ): Promise<InboundAttachment> {
        return {
            type: 'video-frame',
            source: await NexaMedia.#source(blob),
            ...(title === undefined ? {} : { title }),
        };
    }
    /** Decodes an NCAP event, preserving artifacts, documents, graph, video, and voice fields. */
    public static nativeEvent(event: WireTurnEvent): NcapDelta | null {
        if (event.type !== 'native' || event.source !== 'ncap') {
            return null;
        }
        if (!isJsonRecord(event.data)) {
            throw new TypeError('Expected an NCAP data object');
        }
        const data: Record<string, JsonValue> = { ...event.data };
        if (data['voice'] !== undefined) {
            data['voice'] = Array.from(NexaMedia.bytes(data['voice']));
        }
        if (isJsonRecord(data['video']) && data['video']['phase'] === 'chunk') {
            data['video'] = {
                ...data['video'],
                data: Array.from(NexaMedia.bytes(data['video']['data'])),
            };
        }
        if (
            isJsonRecord(data['geometry']) &&
            (data['geometry']['phase'] === 'chunk' || data['geometry']['phase'] === 'preview')
        ) {
            data['geometry'] = {
                ...data['geometry'],
                data: Array.from(NexaMedia.bytes(data['geometry']['data'])),
            };
        }
        if (!native(data)) {
            throw new TypeError('Invalid NCAP event payload');
        }
        return data;
    }
    /** Reconstructs bytes from JSON-serialized Uint8Array records or array payloads. */
    public static bytes(value: JsonValue | undefined): Uint8Array<ArrayBuffer> {
        if (!Array.isArray(value) && !isJsonRecord(value)) {
            throw new TypeError('Expected binary JSON');
        }
        const length: number = Array.isArray(value) ? value.length : Object.keys(value).length;
        if (length > 16 * 1024 * 1024) {
            throw new RangeError('Binary payload exceeds 16 MiB');
        }
        const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(length);
        for (let index: number = 0; index < length; index += 1) {
            const byte: unknown = Array.isArray(value)
                ? value[index]
                : Reflect.get(value, String(index));
            if (typeof byte !== 'number' || !Number.isInteger(byte) || byte < 0 || byte > 255) {
                throw new TypeError('Expected contiguous byte values');
            }
            bytes[index] = byte;
        }
        return bytes;
    }
    /** Encodes PCM16 or another binary payload for a base64 protocol field. */
    public static base64(bytes: Uint8Array): string {
        const chunks: string[] = [];
        for (let offset: number = 0; offset < bytes.length; offset += 8192) {
            chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
        }
        return btoa(chunks.join(''));
    }
    /** Decodes a base64 protocol field into bytes for playback or saving. */
    public static fromBase64(value: string): Uint8Array<ArrayBuffer> {
        const binary: string = atob(value);
        const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(binary.length);
        for (let index: number = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }
        return bytes;
    }
    /** Reads browser File metadata structurally, including Files supplied by another realm. */
    static #filename(blob: Blob): string | undefined {
        return 'name' in blob && typeof blob.name === 'string' ? blob.name : undefined;
    }

    static async #source(blob: Blob): Promise<BinarySource> {
        if (blob.size === 0 || blob.size > 100 * 1024 * 1024) {
            throw new RangeError('Inline media must be between 1 byte and 100 MiB');
        }
        if (blob.type.length === 0) {
            throw new TypeError('Media Blob needs a MIME type');
        }
        return {
            kind: 'base64',
            mediaType: blob.type,
            data: NexaMedia.base64(new Uint8Array(await blob.arrayBuffer())),
        };
    }
}
/** Narrows an extensible protocol field without discarding its contents. */
function isJsonRecord(value: JsonValue | undefined): value is Readonly<Record<string, JsonValue>> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
