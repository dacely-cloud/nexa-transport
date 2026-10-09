// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowScheduleCodec } from './schedule/ScheduleCodec.js';
import type { WorkflowObject } from './WorkflowTypes.js';
import type { WorkflowStepResult } from './runtime/RunTypes.js';

/** Exactly one timing input is resolved before entering durable suspension. */
export interface WorkflowWaitRequest {
    readonly durationMs: string | null;
    readonly atMs: string | null;
}
/** Portable validation shared by the editor and the live wait handlers. */
export class WorkflowWaitCodec {
    /** Accepts exact decimal milliseconds, never floating point durations. */
    public static duration(raw: unknown): string {
        if (typeof raw !== 'string' || !/^[1-9]\d{0,7}$/u.test(raw) || BigInt(raw) > 86400000n) {
            throw new Error('Choose a wait from 1 millisecond to 24 hours.');
        }
        return raw;
    }
    /** Normalizes an exact timestamp within the supported date range. */
    public static instant(raw: unknown): string {
        return WorkflowScheduleCodec.instant(raw);
    }
    /** Resolves the component's declared input, including mapped values. */
    public static request(component: string, inputs: WorkflowObject): WorkflowWaitRequest {
        if (component === 'time.delay') {
            return { durationMs: this.duration(inputs['duration']), atMs: null };
        }
        if (component === 'time.until') {
            return { durationMs: null, atMs: this.instant(inputs['at']) };
        }
        throw new Error('Unsupported workflow wait component');
    }
    /** Relative waits retain the original entry timestamp across interrupted attempts. */
    public static target(request: WorkflowWaitRequest, startedAt: bigint): bigint {
        if (request.durationMs !== null && request.atMs === null) {
            return startedAt + BigInt(this.duration(request.durationMs));
        }
        if (request.atMs !== null && request.durationMs === null) {
            return BigInt(this.instant(request.atMs));
        }
        throw new Error('A wait needs exactly one duration or target time');
    }
    /** Records intended and actual continuation times without pretending a sample really waited. */
    public static result(intended: bigint, resumed: bigint, sample: boolean): WorkflowStepResult {
        return {
            outputs: {
                timing: {
                    intendedAtMs: intended.toString(),
                    resumedAtMs: resumed.toString(),
                    sample,
                },
            },
            routes: ['out'],
            result: null,
        };
    }
}
