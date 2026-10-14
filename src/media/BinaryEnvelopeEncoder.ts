// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryEnvelopePlan } from './BinaryEnvelopePlan';
import { Utf8Bytes } from './Utf8Bytes';
import type { BinaryCarrier } from './interface/BinaryCarrier';
import type { BinaryPart } from './interface/BinaryPart';

/** Allocates one admitted NXBF frame and writes carriers into it without a temporary full payload. */
export class BinaryEnvelopeEncoder {
    /** Preserves plaintext fallback and the existing byte order, part order and JSON placeholders. */
    public static encode(raw: unknown): Uint8Array<ArrayBuffer> | null {
        const plan: BinaryEnvelopePlan = new BinaryEnvelopePlan(raw);
        if (plan.carriers.length === 0) {
            return null;
        }
        const parts: readonly BinaryPart[] = plan.carriers.map(
            (carrier: BinaryCarrier): BinaryPart => carrier.part,
        );
        const text: string = JSON.stringify({ json: plan.metadata(), parts });
        if (Utf8Bytes.measure(text, BinaryEnvelopePlan.MAX_HEADER_BYTES) !== plan.headerBytes) {
            throw new RangeError('Binary envelope metadata changed during encoding');
        }
        const header: Uint8Array<ArrayBuffer> = new TextEncoder().encode(text);
        if (
            header.byteLength !== plan.headerBytes ||
            header.byteLength > BinaryEnvelopePlan.MAX_HEADER_BYTES
        ) {
            throw new RangeError('Binary envelope metadata changed during encoding');
        }
        const frame: Uint8Array<ArrayBuffer> = new Uint8Array(
            8 + header.length + plan.payloadBytes,
        );
        const view: DataView = new DataView(frame.buffer);
        view.setUint32(0, 0x4e584246);
        view.setUint32(4, header.length);
        frame.set(header, 8);
        let offset: number = 8 + header.length;
        let carrier: BinaryCarrier;
        for (carrier of plan.carriers) {
            carrier.mutateFrameBytes(frame, offset);
            offset += carrier.part.length;
        }
        return frame;
    }
}
