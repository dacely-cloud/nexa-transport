// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Server-only generator for the portable media codec; Nexa owns its canonical source. */
export class MediaSources {
    /** Complete codec dependency graph, including the decomposed encoder's interfaces. */
    public static readonly FILES: readonly string[] = Object.freeze([
        'Base64.ts',
        'interface/BinaryChunkBudget.ts',
        'interface/BinaryChunkReceipt.ts',
        'BinaryChunkCredit.ts',
        'BinaryByteBudget.ts',
        'BinaryInputReservation.ts',
        'BinaryAllocationCredit.ts',
        'JsonSerializedBytes.ts',
        'interface/JsonSerializedValue.ts',
        'interface/JsonSerializedObject.ts',
        'BinaryChunkTransfer.ts',
        'BinaryChunks.ts',
        'BinaryEnvelope.ts',
        'BinaryUploadHeader.ts',
        'BinaryUploadSizing.ts',
        'BinaryAdmissionError.ts',
        'BinaryEnvelopeDecodePlan.ts',
        'BinaryEnvelopeDecoder.ts',
        'BinaryJsonValidation.ts',
        'BinaryRequestMemory.ts',
        'JsonFrameMemory.ts',
        'BinaryMedia.ts',
        'interface/BinaryMediaHeader.ts',
        'BinaryCarrierFactory.ts',
        'BinaryEnvelopeEncoder.ts',
        'BinaryEnvelopePlan.ts',
        'BinaryMetadataMeasure.ts',
        'JsonStringBytes.ts',
        'Utf8Bytes.ts',
        'interface/Base64ByteTarget.ts',
        'interface/Base64DecodeResult.ts',
        'interface/BinaryCarrier.ts',
        'interface/Base64ByteSource.ts',
        'interface/BinaryDecodeAdmission.ts',
        'interface/BinaryDecodedCarrier.ts',
        'interface/BinaryEncoding.ts',
        'interface/BinaryEncodingValues.ts',
        'interface/BinaryJsonObject.ts',
        'interface/BinaryJsonValue.ts',
        'interface/BinaryPart.ts',
    ]);

    /** Returns canonical portable source with the SDK's generated attachment contract binding. */
    public static source(name: string): string {
        if (!MediaSources.FILES.includes(name)) {
            throw new TypeError('Unknown portable media source');
        }
        return readFileSync(new URL('../../nexa/src/media/' + name, import.meta.url), 'utf8')
            .replace("'./DeliveredAttachment'", "'../protocol/Protocol.js'")
            .replace("'../DeliveredAttachment'", "'../../protocol/Protocol.js'")
            .replace(
                /from '([.][.\/][^']+)'/gu,
                (_match: string, path: string): string =>
                    "from '" + (path.endsWith('.js') ? path : path + '.js') + "'",
            );
    }

    /** Refreshes current source files without regenerating unrelated contracts or build outputs. */
    public static sync(): void {
        const sources: ReadonlyMap<string, string> = new Map(
            MediaSources.FILES.map((name: string): readonly [string, string] => [
                name,
                MediaSources.source(name),
            ]),
        );
        const names: readonly string[] = MediaSources.FILES.filter(
            (name: string): boolean => name !== 'BinaryEnvelope.ts',
        ).concat('BinaryEnvelope.ts');
        let name: string;
        for (name of names) {
            const source: string | undefined = sources.get(name);
            if (source === undefined) {
                throw new Error('Missing canonical media source');
            }
            const target: URL = new URL('../src/media/' + name, import.meta.url);
            mkdirSync(dirname(fileURLToPath(target)), { recursive: true });
            writeFileSync(target, source);
        }
    }
}
