// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it, vi, type MockInstance } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { InboundCapacity } from '../src/networking/InboundCapacity.js';
import { BinaryByteBudget } from '../src/media/BinaryByteBudget.js';
import { BinaryChunks } from '../src/media/BinaryChunks.js';
import { BinaryEnvelope } from '../src/media/BinaryEnvelope.js';
import { BinaryMedia } from '../src/media/BinaryMedia.js';
import type { BinaryInputReservation } from '../src/media/BinaryInputReservation.js';
import type { BinaryChunkReceipt } from '../src/media/interface/BinaryChunkReceipt.js';
import { Method, type HelloOk } from '../src/protocol/Protocol.js';
import { TransportErrorCode } from '../src/networking/TransportError.js';
import { hello, TestGateway, type Request } from './Support.js';

/** Advertises a large transfer while allocating only the current small wire frame. */
function chunk(offset: number, bytes: number): Uint8Array<ArrayBuffer> {
    const frame: Uint8Array<ArrayBuffer> = new Uint8Array(28 + bytes);
    const view: DataView = new DataView(frame.buffer);
    view.setUint32(0, 0x4e584348);
    frame.fill(7, 4, 20);
    view.setUint32(20, BinaryChunks.MAX_TRANSFER_BYTES);
    view.setUint32(24, offset);
    return frame;
}

/** A complete unchunked file with deterministic bytes. */
function file(bytes: number): Uint8Array<ArrayBuffer> {
    return BinaryMedia.encode(
        {
            id: 'held',
            filename: 'file.bin',
            mimeType: 'application/octet-stream',
            byteLength: bytes,
        },
        new Uint8Array(bytes).fill(173),
    );
}

/** Minimal advertised surface keeps authentication inside the constrained test budget. */
const greeting: HelloOk = {
    ...hello,
    features: {
        ...hello.features,
        binaryMedia: true,
        methods: [Method.SessionsFiles, Method.MediaAcknowledge],
        methodScopes: {},
    },
};

it('rejects a foreign completed receipt without releasing its original client credit', (): void => {
    const parent: BinaryByteBudget = new BinaryByteBudget(32768);
    const first: InboundCapacity = new InboundCapacity(16384, parent);
    const second: InboundCapacity = new InboundCapacity(16384, parent);
    const frame: Uint8Array<ArrayBuffer> = file(1024);
    let receipt: BinaryChunkReceipt | null = null;
    let part: Uint8Array<ArrayBuffer>;
    for (part of BinaryChunks.split(frame, 128)) {
        receipt = first.accept(part.buffer, (): void => {});
    }
    if (receipt === null || receipt.credit === null) {
        throw new Error('Missing completed transfer');
    }
    const before: number = parent.used;
    expect((): BinaryInputReservation => second.binary(receipt)).toThrow('Foreign');
    expect(parent.used).toBe(before);
    expect(first.used).toBe(before);
    const credit: BinaryInputReservation = first.binary(receipt);
    credit.close();
    expect(parent.used).toBe(0);
});

it('shares parent credit between held files and incremental transfers on different clients', (): void => {
    const parent: BinaryByteBudget = new BinaryByteBudget(24000);
    const first: InboundCapacity = new InboundCapacity(20000, parent);
    const second: InboundCapacity = new InboundCapacity(20000, parent);
    const receipt: BinaryChunkReceipt | null = first.accept(file(6000).buffer, (): void => {});
    if (receipt === null) {
        throw new Error('Missing file receipt');
    }
    const held: BinaryInputReservation = first.binary(receipt);
    try {
        BinaryMedia.decode(receipt.buffer, BinaryChunks.MAX_TRANSFER_BYTES, held);
        const before: number = parent.used;
        expect(second.accept(chunk(0, 1).buffer, (): void => {})).toBeNull();
        expect(parent.used).toBeGreaterThan(before);
        expect((): BinaryChunkReceipt | null =>
            second.accept(chunk(1, 8192).buffer, (): void => {}),
        ).toThrow('memory budget');
        expect(second.used).toBe(0);
        expect(parent.used).toBe(before);
        first.clear();
        expect(parent.used).toBe(before);
    } finally {
        held.close();
        first.clear();
        second.clear();
    }
    expect(parent.used).toBe(0);
});

it('rejects new reassembly growth while an asynchronous attachment consumer holds the same quota', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway(greeting);
    const released: PromiseWithResolvers<undefined> = Promise.withResolvers<undefined>();
    let client: NexaClient | null = null;
    let delivered: number = 0;
    gateway.handler = (socket: WebSocket): void => {
        socket.send(file(12000));
        socket.send(chunk(0, 1));
        socket.send(chunk(1, 8192));
    };
    try {
        client = await NexaClient.connect({
            url: await gateway.url(),
            maxInboundBytes: 32768,
            reconnect: false,
        });
        client.onAttachment((): Promise<undefined> => {
            delivered += 1;
            return released.promise;
        });
        await expect(client.call(Method.SessionsFiles, { id: 'saved' })).rejects.toMatchObject({
            code: TransportErrorCode.Limit,
        });
        expect(delivered).toBe(1);
        expect(client.connected).toBe(false);
    } finally {
        released.resolve(undefined);
        client?.close();
        await gateway.close();
    }
});

it('rejects decoded JSON structure before parsing even when wire text fits the frame limit', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway(greeting);
    let client: NexaClient | null = null;
    let attack: string = '';
    let parse: MockInstance<typeof JSON.parse> | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        attack = JSON.stringify({
            id: request.id,
            ok: true,
            result: Array.from({ length: 900 }, (): readonly string[] => []),
        });
        socket.send(attack);
    };
    try {
        client = await NexaClient.connect({
            url: await gateway.url(),
            maxInboundBytes: 32768,
            reconnect: false,
        });
        parse = vi.spyOn(JSON, 'parse');
        await expect(client.call(Method.SessionsFiles, { id: 'saved' })).rejects.toMatchObject({
            code: TransportErrorCode.Limit,
        });
        expect(attack.length).toBeLessThan(4096);
        expect(parse).not.toHaveBeenCalledWith(attack);
    } finally {
        parse?.mockRestore();
        client?.close();
        await gateway.close();
    }
});

it('refuses compact binary array expansion before allocating the decoded array', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway(greeting);
    let client: NexaClient | null = null;
    let arrays: MockInstance<typeof Array.from> | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        const frame: Uint8Array<ArrayBuffer> | null = BinaryEnvelope.encodeValue({
            id: request.id,
            ok: true,
            result: { voice: new Uint8Array(2000) },
        });
        if (frame === null) {
            throw new Error('Missing compact array frame');
        }
        socket.send(frame);
    };
    try {
        client = await NexaClient.connect({
            url: await gateway.url(),
            maxInboundBytes: 32768,
            reconnect: false,
        });
        arrays = vi.spyOn(Array, 'from');
        await expect(client.call(Method.SessionsFiles, { id: 'saved' })).rejects.toMatchObject({
            code: TransportErrorCode.Limit,
        });
        expect(arrays).not.toHaveBeenCalledWith(expect.objectContaining({ byteLength: 2000 }));
    } finally {
        arrays?.mockRestore();
        client?.close();
        await gateway.close();
    }
});

it.each([0, -1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER])(
    'refuses invalid working-memory configuration before opening a socket (%s)',
    async (maxInboundBytes: number): Promise<void> => {
        await expect(
            NexaClient.connect({ url: 'ws://127.0.0.1:1', maxInboundBytes }),
        ).rejects.toThrow('inbound working memory');
    },
);
