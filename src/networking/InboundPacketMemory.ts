// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { CompanyHostProtocol } from '../company/CompanyHostProtocol.js';
import { CompanyEmployeeProtocol } from '../company/CompanyEmployeeProtocol.js';
import { CompanyProjectProtocol } from '../company/CompanyProjectProtocol.js';
import { CompanyProtocol } from '../company/CompanyProtocol.js';
import { OfficeProtocol, OfficeLayoutProtocol } from '../office/OfficeProtocol.js';
import type { BinaryInputReservation } from '../media/BinaryInputReservation.js';
import { BinaryAdmissionError } from '../media/BinaryAdmissionError.js';

/** Charges fixed-schema string, container and record working storage before specialized decoding. */
export class InboundPacketMemory {
    /** Family decoders still validate their own sizes, operation directions and record counts. */
    public static reserve(bytes: Uint8Array, credit: BinaryInputReservation): void {
        if (
            (CompanyHostProtocol.isFrame(bytes) ||
                CompanyEmployeeProtocol.isFrame(bytes) ||
                CompanyProjectProtocol.isFrame(bytes) ||
                CompanyProtocol.isFrame(bytes) ||
                OfficeProtocol.isFrame(bytes) ||
                OfficeLayoutProtocol.isFrame(bytes)) &&
            !credit.reserve(64 * bytes.byteLength + 4096)
        ) {
            throw new BinaryAdmissionError();
        }
    }
}
