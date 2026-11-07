// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, expectTypeOf, it } from 'vitest';
import type { NexaClient } from '../src/networking/NexaClient.js';
import { Method, type ParamsOf, type VmUsageSnapshot } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { schema } from '../src/protocol/SchemaData.js';

/** Compile-time call checks never open a socket, provision a VM or request cross-account access. */
function verifyCalls(client: NexaClient): void {
    expectTypeOf(client.call(Method.EnvironmentUsage, {})).toEqualTypeOf<
        Promise<VmUsageSnapshot>
    >();
    expectTypeOf(
        client.call(Method.EnvironmentAdminUsage, { userId: 'a'.repeat(64) }),
    ).toEqualTypeOf<Promise<VmUsageSnapshot>>();
    expectTypeOf<ParamsOf<Method.EnvironmentUsage>>().not.toBeNullable();
    expectTypeOf<ParamsOf<Method.EnvironmentAdminUsage>>().not.toBeNullable();
}

const snapshot: VmUsageSnapshot = {
    userId: 'a'.repeat(64),
    observedAtMs: '1793750000000',
    environment: {
        id: 'owned-environment',
        generation: '9007199254740993',
        state: 'running',
        vcpus: 4,
        provisionedMemoryBytes: '4294967296',
        cpu: {
            source: 'hypervisor',
            observedAtMs: '1793750000000',
            freshness: 'fresh',
            cumulativeNanoseconds: '18446744073709551615',
            percentHundredths: '12345',
        },
        hostMemory: {
            observedAtMs: '1793750000000',
            freshness: 'fresh',
            residentBytes: '4831838208',
        },
        guestMemory: {
            source: 'guest',
            observedAtMs: '1793749999000',
            freshness: 'stale',
            totalBytes: '4294967296',
            availableBytes: '3221225472',
            usedBytes: '1073741824',
        },
        root: {
            source: 'guest',
            observedAtMs: '1793749999000',
            freshness: 'stale',
            totalBytes: '34359738368',
            usedBytes: '12884901888',
            availableBytes: '19327352832',
        },
        workspace: null,
    },
};

it('publishes both usage calls as required typed RPCs while keeping the owner target implicit', (): void => {
    expectTypeOf(verifyCalls).toBeFunction();
    const required: readonly string[] | undefined =
        schema.definitions?.['GatewayMethods']?.required;
    expect(required).toContain(Method.EnvironmentUsage);
    expect(required).toContain(Method.EnvironmentAdminUsage);
    expect(methodValidators[Method.EnvironmentUsage].params({})).toBe(true);
    expect(methodValidators[Method.EnvironmentUsage].params({ userId: 'b'.repeat(64) })).toBe(
        false,
    );
    expect(methodValidators[Method.EnvironmentAdminUsage].params({})).toBe(false);
    expect(methodValidators[Method.EnvironmentAdminUsage].params({ userId: 'b'.repeat(64) })).toBe(
        true,
    );
});

it('preserves exact generation and resource counters through both reply validators and JSON', (): void => {
    const decoded: unknown = JSON.parse(JSON.stringify(snapshot));
    expect(methodValidators[Method.EnvironmentUsage].result(decoded)).toBe(true);
    expect(methodValidators[Method.EnvironmentAdminUsage].result(decoded)).toBe(true);
    expect(decoded).toEqual(snapshot);
    const environment: VmUsageSnapshot['environment'] = snapshot.environment;
    if (environment === null) {
        throw new Error('Missing measured fixture');
    }
    expect(
        methodValidators[Method.EnvironmentUsage].result({
            ...snapshot,
            environment: { ...environment, generation: 9007199254740992 },
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.EnvironmentUsage].result({
            ...snapshot,
            environment: {
                ...environment,
                cpu: { ...environment.cpu, cumulativeNanoseconds: 18446744073709552000 },
            },
        }),
    ).toBe(false);
});

it('keeps absent and not-yet-measured observations nullable and rejects invented states and sources', (): void => {
    const validate: (value: unknown) => boolean = methodValidators[Method.EnvironmentUsage].result;
    expect(validate({ ...snapshot, environment: null })).toBe(true);
    const environment: VmUsageSnapshot['environment'] = snapshot.environment;
    if (environment === null) {
        throw new Error('Missing measured fixture');
    }
    expect(
        validate({
            ...snapshot,
            environment: {
                ...environment,
                vcpus: null,
                provisionedMemoryBytes: null,
                cpu: null,
                hostMemory: null,
                guestMemory: null,
                root: null,
            },
        }),
    ).toBe(true);
    expect(
        validate({ ...snapshot, environment: { ...environment, state: 'guaranteed-ready' } }),
    ).toBe(false);
    expect(
        validate({
            ...snapshot,
            environment: { ...environment, cpu: { ...environment.cpu, source: 'estimated' } },
        }),
    ).toBe(false);
    expect(validate({ ...snapshot, observedAtMs: 1793750000000 })).toBe(false);
});
