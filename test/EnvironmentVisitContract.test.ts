// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, expectTypeOf, it } from 'vitest';
import {
    EnvironmentVisitState,
    Method,
    type EnvironmentVisitResult,
    type ParamsOf,
    type ResultOf,
} from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

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
