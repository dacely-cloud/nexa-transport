// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0
import { expect, it } from 'vitest';
import { OfficeLayoutProtocol, type OfficeLayoutPacket } from '../src/office/OfficeProtocol.js';

it('bounds and round-trips geometry-only and atomic desk/layout versions independently', (): void => {
    const legacy: OfficeLayoutPacket = {
        op: 2,
        id: 9,
        revision: 0xffffffffffffffffn,
        pieces: [{ id: 4, kind: 'door', floor: 5, x: -128, z: 128, rotation: 3 }],
    };
    expect(OfficeLayoutProtocol.encode(legacy)[4]).toBe(1);
    expect(OfficeLayoutProtocol.decode(OfficeLayoutProtocol.encode(legacy))).toEqual(legacy);
    const current: OfficeLayoutPacket = {
        ...legacy,
        desks: [
            { desk: 0, x: -128, z: 128 },
            { desk: 48, x: -128, z: 128 },
        ],
    };
    const bytes = OfficeLayoutProtocol.encode(current);
    expect(bytes[4]).toBe(2);
    expect(OfficeLayoutProtocol.decode(bytes)).toEqual(current);
    expect(OfficeLayoutProtocol.decode(OfficeLayoutProtocol.encode(current, 1))).toEqual(legacy);
    for (const invalid of [
        bytes.subarray(0, 21),
        bytes.subarray(0, bytes.length - 1),
        new Uint8Array([...bytes, 0]),
    ]) {
        expect(() => OfficeLayoutProtocol.decode(invalid)).toThrow();
    }
    const oversized = bytes.slice();
    new DataView(oversized.buffer).setUint16(20, 257);
    expect(() => OfficeLayoutProtocol.decode(oversized)).toThrow();
    for (const desks of [
        [
            { desk: 0, x: 0, z: 0 },
            { desk: 0, x: 10, z: 10 },
        ],
        [
            { desk: 0, x: 0, z: 0 },
            { desk: 1, x: 6, z: 6 },
        ],
        [{ desk: 256, x: 0, z: 0 }],
        [{ desk: 1, x: 129, z: 0 }],
        [{ desk: 1, x: 1.5, z: 0 }],
    ]) {
        expect(() => OfficeLayoutProtocol.encode({ ...legacy, desks })).toThrow();
    }
    const read: OfficeLayoutPacket = { op: 1, id: 1, revision: 0n, pieces: [], desks: [] };
    expect(OfficeLayoutProtocol.decode(OfficeLayoutProtocol.encode(read))).toEqual(read);
    expect(() => OfficeLayoutProtocol.encode({ ...read, desks: current.desks ?? [] })).toThrow();
    const error: OfficeLayoutPacket = {
        op: 4,
        id: 1,
        revision: 0n,
        pieces: [],
        desks: [],
        message: 'Reopen the latest layout',
    };
    expect(OfficeLayoutProtocol.decode(OfficeLayoutProtocol.encode(error))).toEqual(error);
});
