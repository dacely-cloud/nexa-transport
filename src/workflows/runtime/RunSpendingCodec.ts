// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { ResourceBindingCodec } from '../ResourceBindingCodec.js';
import { WorkflowInput } from '../WorkflowInput.js';
import type {
    WorkflowLoopSpending,
    WorkflowLoopSpendingRequest,
    WorkflowLoopSpendingView,
} from './RunSpendingTypes.js';

/** Portable exact-money validation at both private-service and public transport boundaries. */
export class WorkflowSpendingCodec {
    /** Requests cannot choose a principal, revision, limit or arbitrary reporting partition. */
    public static request(raw: unknown): WorkflowLoopSpendingRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'loopId',
        ]);
        return {
            runId: WorkflowInput.id(value['runId']),
            loopId: WorkflowInput.id(value['loopId']),
        };
    }
    /** Amounts stay decimal strings even beyond JavaScript's exact-number range. */
    public static amount(raw: unknown, signed: boolean = false): string {
        if (typeof raw !== 'string' || !/^(0|-?[1-9][0-9]{0,18})$/u.test(raw)) {
            throw new Error('Invalid workflow spending amount');
        }
        const amount: bigint = BigInt(raw);
        if (amount < (signed ? -9223372036854775808n : 0n) || amount > 9223372036854775807n) {
            throw new Error('Workflow spending amount exceeds its supported range');
        }
        return raw;
    }
    /** Date rendering remains inside the ECMAScript calendar range. */
    public static timestamp(raw: unknown): string {
        const value: string = this.amount(raw);
        if (BigInt(value) > 8640000000000000n) {
            throw new Error('Invalid workflow spending timestamp');
        }
        return value;
    }
    /** A bounded snapshot includes its exact scope and observation time. */
    public static report(raw: unknown): WorkflowLoopSpending {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'loopId',
            'workflowId',
            'revision',
            'observedAtMs',
            'reportedMicrocents',
            'reservedMicrocents',
            'reservationCount',
            'entries',
            'lastReportedAtMs',
            'limitMicrocents',
            'deadlineAtMs',
        ]);
        const count: unknown = value['reservationCount'];
        if (typeof count !== 'number' || !Number.isInteger(count) || count < 0 || count > 64) {
            throw new Error('Invalid workflow reservation count');
        }
        const result: WorkflowLoopSpending = {
            runId: WorkflowInput.id(value['runId']),
            loopId: WorkflowInput.id(value['loopId']),
            workflowId: WorkflowInput.id(value['workflowId']),
            revision: ResourceBindingCodec.decimal(value['revision']),
            observedAtMs: this.timestamp(value['observedAtMs']),
            reportedMicrocents:
                value['reportedMicrocents'] === null
                    ? null
                    : this.amount(value['reportedMicrocents'], true),
            reservedMicrocents: this.amount(value['reservedMicrocents']),
            reservationCount: count,
            entries: this.amount(value['entries']),
            lastReportedAtMs:
                value['lastReportedAtMs'] === null
                    ? null
                    : this.timestamp(value['lastReportedAtMs']),
            limitMicrocents:
                value['limitMicrocents'] === null ? null : this.amount(value['limitMicrocents']),
            deadlineAtMs:
                value['deadlineAtMs'] === null ? null : this.timestamp(value['deadlineAtMs']),
        };
        if (
            (result.entries === '0') !== (result.reportedMicrocents === null) ||
            (result.reportedMicrocents === null && result.lastReportedAtMs !== null) ||
            (count === 0 && result.reservedMicrocents !== '0') ||
            (result.lastReportedAtMs !== null &&
                BigInt(result.lastReportedAtMs) > BigInt(result.observedAtMs))
        ) {
            throw new Error('Inconsistent workflow spending evidence');
        }
        return result;
    }
    /** Mocked views cannot claim real charges or reservations. */
    public static view(raw: unknown): WorkflowLoopSpendingView {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'loopId',
            'workflowId',
            'revision',
            'observedAtMs',
            'reportedMicrocents',
            'reservedMicrocents',
            'reservationCount',
            'entries',
            'lastReportedAtMs',
            'limitMicrocents',
            'deadlineAtMs',
            'simulated',
        ]);
        const { simulated, ...report }: Readonly<Record<string, unknown>> = value;
        if (typeof simulated !== 'boolean') {
            throw new Error('Invalid spending simulation state');
        }
        const result: WorkflowLoopSpending = this.report(report);
        if (
            simulated &&
            (result.entries !== '0' ||
                result.reservationCount !== 0 ||
                result.deadlineAtMs !== null)
        ) {
            throw new Error('Mock execution cannot report live spending');
        }
        return { ...result, simulated };
    }
}
