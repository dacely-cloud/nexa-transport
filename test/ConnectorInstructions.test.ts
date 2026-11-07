// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import {
    Method,
    type ConnectorInstructionsUpdateParams,
    type ConnectorInstructionsView,
} from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { NexaClient } from '../src/networking/NexaClient.js';
import type { WebSocket } from 'ws';
import { TestGateway, type Request } from './Support.js';

/** One exact retained edit crosses browser and Node clients without floating-point revision conversion. */
const original: ConnectorInstructionsUpdateParams = {
    enrollmentId: 'conn_' + 'a'.repeat(64),
    instructions: 'Use D:\\Projects\nWindows Studio',
    expectedRevision: '9007199254740993',
    requestId: 'edit-instructions',
};

it('exposes get/update contracts with closed account-owned identities and exact revisions', (): void => {
    expect(
        methodValidators[Method.ConnectorsInstructionsGet].params({
            enrollmentId: original.enrollmentId,
        }),
    ).toBe(true);
    expect(
        methodValidators[Method.ConnectorsInstructionsGet].params({
            enrollmentId: original.enrollmentId,
            userId: 'foreign',
        }),
    ).toBe(false);
    const validate: (raw: unknown) => boolean =
        methodValidators[Method.ConnectorsInstructionsUpdate].params;
    expect(validate(original)).toBe(true);
    expect(validate({ ...original, instructions: '' })).toBe(true);
    for (const fields of [
        { userId: 'foreign' },
        { host: 'localhost' },
        { expectedRevision: 1 },
        { expectedRevision: '01' },
        { expectedRevision: '9223372036854775808' },
        { instructions: '界'.repeat(5462) },
        { instructions: '\ud800' },
        { instructions: '\u0001' },
    ]) {
        expect(validate({ ...original, ...fields })).toBe(false);
    }
    const view: ConnectorInstructionsView = {
        enrollmentId: original.enrollmentId,
        instructions: original.instructions,
        revision: '9007199254740994',
    };
    expect(methodValidators[Method.ConnectorsInstructionsUpdate].result(view)).toBe(true);
    expect(
        methodValidators[Method.ConnectorsInstructionsGet].result({
            ...view,
            revision: '9223372036854775808',
        }),
    ).toBe(false);
});

it('the public client reads and updates standing instructions over its existing authenticated socket', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    let client: NexaClient | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        expect([
            Method.ConnectorsInstructionsGet.valueOf(),
            Method.ConnectorsInstructionsUpdate.valueOf(),
        ]).toContain(request.method);
        const updated: boolean = request.method === Method.ConnectorsInstructionsUpdate.valueOf();
        socket.send(
            JSON.stringify({
                id: request.id,
                ok: true,
                result: {
                    enrollmentId: original.enrollmentId,
                    instructions: updated ? original.instructions : '',
                    revision: updated ? '9007199254740994' : original.expectedRevision,
                },
            }),
        );
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect(
            (
                await client.call(Method.ConnectorsInstructionsGet, {
                    enrollmentId: original.enrollmentId,
                })
            ).revision,
        ).toBe(original.expectedRevision);
        expect(
            (await client.call(Method.ConnectorsInstructionsUpdate, original)).instructions,
        ).toBe(original.instructions);
        expect(
            gateway.requests.filter(
                (request: Request): boolean =>
                    request.method === Method.ConnectorsInstructionsUpdate.valueOf(),
            ),
        ).toHaveLength(1);
    } finally {
        client?.close();
        await gateway.close();
    }
});
