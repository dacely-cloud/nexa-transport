// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, expectTypeOf, it } from 'vitest';
import { NexaClient } from '../src/networking/NexaClient.js';
import {
    Method,
    type ParamsOf,
    type VmAdministrationMutation,
    type VmAdministrationView,
} from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

/** Type-checking a call never opens a socket or performs a VM mutation. */
function verifyCalls(client: NexaClient, mutation: VmAdministrationMutation): void {
    expectTypeOf(
        client.call(Method.EnvironmentAdminInspect, { userId: 'a'.repeat(64) }),
    ).toEqualTypeOf<Promise<VmAdministrationView>>();
    expectTypeOf(client.call(Method.EnvironmentAdminMutate, mutation)).toEqualTypeOf<
        Promise<VmAdministrationView>
    >();
    expectTypeOf<ParamsOf<Method.EnvironmentAdminInspect>>().not.toBeNullable();
    expectTypeOf<ParamsOf<Method.EnvironmentAdminMutate>>().not.toBeNullable();
}

it('registers both administrative methods as required, typed public contracts', (): void => {
    expectTypeOf(verifyCalls).toBeFunction();
    expect(
        methodValidators[Method.EnvironmentAdminInspect].params({ userId: 'a'.repeat(64) }),
    ).toBe(true);
    expect(methodValidators[Method.EnvironmentAdminInspect].params({})).toBe(false);
});

it('requires captured mutation metadata and preserves exact generation strings', (): void => {
    const mutation: VmAdministrationMutation = {
        userId: 'a'.repeat(64),
        action: 'stop',
        environmentId: 'owned-environment',
        generation: '9007199254740993',
        requestId: '12345678-1111-4111-8111-111111111111',
    };
    const validate: (value: unknown) => boolean =
        methodValidators[Method.EnvironmentAdminMutate].params;
    expect(validate(mutation)).toBe(true);
    expect(validate({ ...mutation, generation: 9007199254740992 })).toBe(false);
    expect(validate({ ...mutation, requestId: undefined })).toBe(false);
    expect(validate({ ...mutation, action: 'execute' })).toBe(false);
});

it('retains exact profile quantities and refuses unknown lifecycle states in replies', (): void => {
    const snapshot: VmAdministrationView = {
        userId: 'a'.repeat(64),
        providerId: 'cloud-managed',
        observedAtMs: '1793750000000',
        acceptedOperationId: null,
        defaultProfile: {
            id: 'cpu',
            revision: '2',
            architecture: 'x86_64',
            runtime: 'qemu-cpu',
            vcpus: 4,
            memoryBytes: '4294967296',
            gpuCount: 0,
            gpuMinimumMemoryBytes: '0',
        },
        environment: {
            id: 'owned-environment',
            generation: '9007199254740993',
            state: 'stopped',
            resourcesReserved: false,
            operation: null,
            profile: null,
        },
    };
    const validate: (value: unknown) => boolean =
        methodValidators[Method.EnvironmentAdminInspect].result;
    expect(validate(snapshot)).toBe(true);
    expect(validate({ ...snapshot, observedAtMs: 1793750000000 })).toBe(false);
    expect(
        validate({
            ...snapshot,
            defaultProfile: { ...snapshot.defaultProfile, memoryBytes: 4294967296 },
        }),
    ).toBe(false);
    expect(
        validate({
            ...snapshot,
            environment: { ...snapshot.environment, state: 'guaranteed-ready' },
        }),
    ).toBe(false);
});
