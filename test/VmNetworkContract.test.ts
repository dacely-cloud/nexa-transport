// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, expectTypeOf, it } from 'vitest';
import type { NexaClient } from '../src/networking/NexaClient.js';
import { Method, type ParamsOf, type VmUsageNetworkSnapshot } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { schema } from '../src/protocol/SchemaData.js';

/** Compile-time coverage never opens a socket or grants administrator authority. */
function verifyCalls(client: NexaClient): void {
    expectTypeOf(client.call(Method.EnvironmentAdminNetwork, { cursor: null })).toEqualTypeOf<
        Promise<VmUsageNetworkSnapshot>
    >();
    expectTypeOf<ParamsOf<Method.EnvironmentAdminNetwork>>().not.toBeNullable();
}

const snapshot: VmUsageNetworkSnapshot = {
    observedAtMs: '1793750000000',
    totals: {
        runningVms: '37',
        preparingVms: '2',
        stoppedVms: '1',
        unavailableVms: '0',
        accountsWithRunningVms: '37',
        provisionedVcpus: '156',
        provisionedMemoryBytes: '9007199254740993',
    },
    rows: [
        {
            providerId: 'cloud-managed',
            userId: 'a'.repeat(64),
            environment: {
                id: 'managed-environment',
                generation: '9007199254740993',
                state: 'running',
                vcpus: 4,
                provisionedMemoryBytes: '4294967296',
                cpu: null,
                hostMemory: null,
                guestMemory: null,
                root: null,
                workspace: null,
            },
        },
    ],
    nextCursor: 'b3BhcXVlLWN1cnNvcg',
};

it('retains the required network method alongside both owner and account-administration usage methods', (): void => {
    expectTypeOf(verifyCalls).toBeFunction();
    const required: readonly string[] | undefined =
        schema.definitions?.['GatewayMethods']?.required;
    expect(required).toContain(Method.EnvironmentAdminNetwork);
    expect(required).toContain(Method.EnvironmentUsage);
    expect(required).toContain(Method.EnvironmentAdminUsage);
    expect(methodValidators[Method.EnvironmentAdminNetwork].params({ cursor: null })).toBe(true);
    expect(methodValidators[Method.EnvironmentAdminNetwork].params({ cursor: 'b3BhcXVl' })).toBe(
        true,
    );
    expect(methodValidators[Method.EnvironmentAdminNetwork].params({})).toBe(false);
    expect(methodValidators[Method.EnvironmentAdminNetwork].params({ cursor: 25 })).toBe(false);
});

it('keeps whole-network totals independent of page length and preserves exact resource quantities', (): void => {
    const decoded: unknown = JSON.parse(JSON.stringify(snapshot));
    const validate: (value: unknown) => boolean =
        methodValidators[Method.EnvironmentAdminNetwork].result;
    expect(validate(decoded)).toBe(true);
    expect(decoded).toEqual(snapshot);
    expect(validate({ ...snapshot, rows: [], nextCursor: null })).toBe(true);
    expect(validate({ ...snapshot, totals: { ...snapshot.totals, runningVms: 37 } })).toBe(false);
    expect(
        validate({
            ...snapshot,
            totals: { ...snapshot.totals, provisionedMemoryBytes: 9007199254740992 },
        }),
    ).toBe(false);
});

it('requires an observed environment in each row and rejects unknown VM states', (): void => {
    const validate: (value: unknown) => boolean =
        methodValidators[Method.EnvironmentAdminNetwork].result;
    const row: VmUsageNetworkSnapshot['rows'][number] | undefined = snapshot.rows[0];
    if (row === undefined) {
        throw new Error('Network fixture row is missing');
    }
    expect(validate({ ...snapshot, rows: [{ ...row, environment: null }] })).toBe(false);
    expect(
        validate({
            ...snapshot,
            rows: [{ ...row, environment: { ...row.environment, state: 'guaranteed-ready' } }],
        }),
    ).toBe(false);
    expect(
        validate({
            ...snapshot,
            rows: [{ ...row, environment: { ...row.environment, generation: 9007199254740992 } }],
        }),
    ).toBe(false);
});
