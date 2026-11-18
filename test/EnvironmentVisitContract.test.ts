// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { expect, expectTypeOf, it } from 'vitest';
import {
    EnvironmentVisitState,
    type EnvironmentVisitResult,
} from 'nexa-protocol/dataplane/EnvironmentVisitTypes.js';
import { Method } from 'nexa-protocol/gateway/Method.js';
import type { ParamsOf, ResultOf } from 'nexa-protocol/gateway/ProtocolTypes.js';
import { methodValidators } from 'nexa-protocol/schema/MethodValidators.js';

it('permits an authenticated visit without accepting account or VM selectors', (): void => {
    expect(methodValidators[Method.EnvironmentVisit].params({})).toBe(true);
    for (const raw of [
        null,
        [],
        'visit',
        { userId: 'other' },
        { create: true },
        { machineId: 'vm' },
    ]) {
        expect(methodValidators[Method.EnvironmentVisit].params(raw)).toBe(false);
    }
    expectTypeOf<ParamsOf<Method.EnvironmentVisit>>().toEqualTypeOf<Record<string, never>>();
    expectTypeOf<ResultOf<Method.EnvironmentVisit>>().toEqualTypeOf<EnvironmentVisitResult>();
});

it('classifies existing environments without asserting that boot or tooling is ready', (): void => {
    for (const state of [EnvironmentVisitState.Existing, EnvironmentVisitState.SetupRequired]) {
        expect(methodValidators[Method.EnvironmentVisit].result({ state })).toBe(true);
    }
    for (const raw of [
        null,
        {},
        { state: 'ready' },
        { state: 'running' },
        { state: EnvironmentVisitState.Existing, ready: true },
    ]) {
        expect(methodValidators[Method.EnvironmentVisit].result(raw)).toBe(false);
    }
});
