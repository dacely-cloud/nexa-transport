// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it, vi } from 'vitest';
import { ShowroomRequests } from '../src/networking/ShowroomRequests.js';
import { CompanyShowroomProtocol, ShowroomOp } from '../src/company/CompanyShowroomProtocol.js';

it('bounds pending previews, correlates identities, closes promptly and never replays publication', async () => {
    const requests = new ShowroomRequests();
    const send = vi.fn();
    const pending = requests.request(
        { op: ShowroomOp.Preview, id: 'preview', entryId: 'one' },
        send,
    );
    requests.receive({
        op: ShowroomOp.Content,
        id: 'preview',
        entryId: 'other',
        digest: 'a'.repeat(64),
        bytes: new Uint8Array(),
    });
    await expect(pending).rejects.toThrow('Mismatched');
    const waits = Array.from({ length: 8 }, (_, index) =>
        requests.request({ op: ShowroomOp.Read, id: String(index) }, send),
    );
    await expect(requests.request({ op: ShowroomOp.Read, id: '9' }, send)).rejects.toThrow(
        'capacity',
    );
    const settled = Promise.all(waits.map((wait) => expect(wait).rejects.toThrow('Disconnected')));
    requests.close(new Error('Disconnected'));
    await settled;
    expect(send).toHaveBeenCalledTimes(9);
    const read = requests.request({ op: ShowroomOp.Read, id: 'fresh' }, send);
    requests.receive({
        op: ShowroomOp.Catalog,
        id: 'fresh',
        revision: 9007199254740993n,
        entries: [],
    });
    await expect(read).resolves.toMatchObject({ revision: 9007199254740993n });
});

it('validates public packet bounds and fails requests on timeout or send failure', async () => {
    const requests = new ShowroomRequests();
    await expect(
        requests.request({ op: ShowroomOp.Read, id: 'failure' }, () => {
            throw new Error('Send failed');
        }),
    ).rejects.toThrow('Send failed');
    vi.useFakeTimers();
    try {
        const pending = requests.request({ op: ShowroomOp.Read, id: 'timeout' }, () => {});
        const result = expect(pending).rejects.toThrow('timed out');
        await vi.advanceTimersByTimeAsync(30000);
        await result;
    } finally {
        vi.useRealTimers();
        requests.close(new Error('Closed'));
    }
    const packet = { op: ShowroomOp.Catalog, id: 'read', revision: 0n, entries: [] } as const;
    expect(CompanyShowroomProtocol.decode(CompanyShowroomProtocol.encode(packet))).toEqual(packet);
    const encoded = CompanyShowroomProtocol.encode(packet);
    encoded[4] = 2;
    expect(() => CompanyShowroomProtocol.decode(encoded)).toThrow('version');
});
