// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { RedTeamExecutionCodec } from './RedTeamExecutionCodec.js';

import { RedTeamInput } from './RedTeamInput.js';
import { RedTeamRequestCodec } from './RedTeamRequestCodec.js';
import { RedTeamReportCodec } from './RedTeamReportCodec.js';
import {
    RedTeamLimits,
    RedTeamStatus,
    RedTeamAgentStatus,
    RedTeamTaskStatus,
    RedTeamFindingStatus,
    RedTeamSeverity,
    RedTeamCoordinationKind,
} from './RedTeamTypes.js';
import type {
    RedTeamEffort,
    RedTeamAgent,
    RedTeamTask,
    RedTeamEvidence,
    RedTeamFinding,
    RedTeamSnapshot,
    RedTeamListPage,
    RedTeamCoordinationEvent,
    RedTeamDelegatedAgent,
    RedTeamHistorySelection,
} from './RedTeamTypes.js';

/** Decodes bounded owner-scoped metadata; chat journals carry verbose agent output. */
export class RedTeamCodec {
    /** Decode bounded effort metadata and exact counters without accepting unknown fields. */
    public static effort(raw: unknown): RedTeamEffort {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(raw, [
            'effortId',
            'title',
            'source',
            'rules',
            'parallelism',
            'status',
            'revision',
            'createdAtMs',
            'updatedAtMs',
            'sessionKey',
            'taskCount',
            'findingCount',
            'error',
        ]);
        const createdAtMs: string = RedTeamInput.decimal(value['createdAtMs']);
        const updatedAtMs: string = RedTeamInput.decimal(value['updatedAtMs']);
        if (BigInt(updatedAtMs) < BigInt(createdAtMs)) {
            throw new RangeError('Red team time moved backwards');
        }
        return {
            effortId: RedTeamInput.id(value['effortId']),
            title: RedTeamInput.text(value['title'], 256),
            source: RedTeamRequestCodec.source(value['source']),
            rules: RedTeamInput.text(value['rules'], RedTeamLimits.rulesCharacters),
            parallelism: RedTeamInput.integer(
                value['parallelism'],
                1,
                RedTeamLimits.maxParallelism,
            ),
            status: RedTeamInput.choice(value['status'], RedTeamStatus),
            revision: RedTeamInput.decimal(value['revision']),
            createdAtMs,
            updatedAtMs,
            sessionKey: RedTeamInput.id(value['sessionKey']),
            taskCount: RedTeamInput.decimal(value['taskCount']),
            findingCount: RedTeamInput.decimal(value['findingCount']),
            error: value['error'] === null ? null : RedTeamInput.text(value['error'], 4096),
        };
    }
    /** Decode one worker and its saved Chat session reference. */
    public static agent(raw: unknown): RedTeamAgent {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(
            raw,
            ['agentId', 'sessionKey', 'status', 'taskId', 'activity'],
            ['name', 'historySelection'],
        );
        return {
            ...(Object.hasOwn(value, 'historySelection')
                ? {
                      historySelection: RedTeamExecutionCodec.historySelection(
                          value['historySelection'],
                      ),
                  }
                : {}),
            agentId: RedTeamInput.id(value['agentId']),
            ...(Object.hasOwn(value, 'name')
                ? { name: RedTeamInput.text(value['name'], 256) }
                : {}),
            sessionKey: this.#nullableId(value['sessionKey']),
            status: RedTeamInput.choice(value['status'], RedTeamAgentStatus),
            taskId: this.#nullableId(value['taskId']),
            activity: RedTeamInput.text(value['activity'], 4096, true),
        };
    }
    /** Native worker identities and selectors are instance identities, never persona aliases. */
    public static delegatedAgent(raw: unknown): RedTeamDelegatedAgent {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(
            raw,
            [
                'agentId',
                'sessionKey',
                'status',
                'taskId',
                'activity',
                'parentAgentId',
                'historySelection',
                'goal',
            ],
            ['name'],
        );
        const {
            parentAgentId: rawParent,
            goal: rawGoal,
            ...fields
        }: Readonly<Record<string, unknown>> = value;
        const agent: RedTeamAgent = this.agent(fields);
        const historySelection: RedTeamHistorySelection = RedTeamExecutionCodec.historySelection(
            value['historySelection'],
        );
        const parentAgentId: string = RedTeamInput.id(rawParent);
        if (
            agent.agentId !== `native:${historySelection.workerId}` ||
            agent.sessionKey === null ||
            parentAgentId === agent.agentId
        ) {
            throw new TypeError(
                'Native worker requires its original archive and distinct actual parent',
            );
        }
        return {
            ...agent,
            parentAgentId,
            historySelection,
            goal: RedTeamInput.text(rawGoal, 8192),
        };
    }
    /** Validate one real exchange without treating a paged-out ledger record as missing. */
    public static coordination(raw: unknown): RedTeamCoordinationEvent {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(
            raw,
            ['eventId', 'sequence', 'atMs', 'kind', 'agentId', 'taskId', 'findingId', 'summary'],
            ['action'],
        );
        return {
            eventId: RedTeamInput.id(value['eventId']),
            sequence: RedTeamInput.decimal(value['sequence']),
            atMs: RedTeamInput.decimal(value['atMs']),
            kind: RedTeamInput.choice(value['kind'], RedTeamCoordinationKind),
            agentId: RedTeamInput.id(value['agentId']),
            taskId: this.#nullableId(value['taskId']),
            findingId: this.#nullableId(value['findingId']),
            summary: RedTeamInput.text(value['summary'], 4096),
            ...(Object.hasOwn(value, 'action')
                ? { action: RedTeamExecutionCodec.action(value['action']) }
                : {}),
        };
    }
    /** Decode a task whose execution state remains owned by the durable runtime. */
    public static task(raw: unknown): RedTeamTask {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(raw, [
            'taskId',
            'title',
            'description',
            'status',
            'agentId',
            'updatedAtMs',
        ]);
        return {
            taskId: RedTeamInput.id(value['taskId']),
            title: RedTeamInput.text(value['title'], 256),
            description: RedTeamInput.text(value['description'], 16_384, true),
            status: RedTeamInput.choice(value['status'], RedTeamTaskStatus),
            agentId: this.#nullableId(value['agentId']),
            updatedAtMs: RedTeamInput.decimal(value['updatedAtMs']),
        };
    }
    /** Decode a bounded observation and optional retained artifact reference. */
    public static evidence(raw: unknown): RedTeamEvidence {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(
            raw,
            ['fileId', 'description'],
            ['agentId'],
        );
        return {
            ...(Object.hasOwn(value, 'agentId')
                ? { agentId: this.#nullableId(value['agentId']) }
                : {}),
            fileId: this.#nullableId(value['fileId']),
            description: RedTeamInput.text(value['description'], 4096),
        };
    }
    /** Decode a complete candidate or observed verdict without inventing report metadata. */
    public static finding(raw: unknown): RedTeamFinding {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(
            raw,
            [
                'findingId',
                'title',
                'severity',
                'status',
                'cvssScore',
                'description',
                'affectedComponent',
                'agentId',
                'evidence',
                'reproduction',
                'updatedAtMs',
            ],
            ['report'],
        );
        const cvssScore: unknown = value['cvssScore'];
        if (
            cvssScore !== null &&
            (typeof cvssScore !== 'string' ||
                !/^(?:[0-9](?:\.[0-9])?|10(?:\.0)?)$/u.test(cvssScore))
        ) {
            throw new RangeError('Invalid CVSS score');
        }
        return {
            findingId: RedTeamInput.id(value['findingId']),
            title: RedTeamInput.text(value['title'], 256),
            severity: RedTeamInput.choice(value['severity'], RedTeamSeverity),
            status: RedTeamInput.choice(value['status'], RedTeamFindingStatus),
            cvssScore,
            description: RedTeamInput.text(value['description'], 16_384),
            affectedComponent: RedTeamInput.text(value['affectedComponent'], 1024),
            agentId: this.#nullableId(value['agentId']),
            evidence: RedTeamInput.list(value['evidence'], 64, (item: unknown): RedTeamEvidence =>
                this.evidence(item),
            ),
            reproduction: RedTeamInput.list(value['reproduction'], 100, (item: unknown): string =>
                RedTeamInput.text(item, 4096),
            ),
            updatedAtMs: RedTeamInput.decimal(value['updatedAtMs']),
            ...(Object.hasOwn(value, 'report')
                ? { report: RedTeamReportCodec.parse(value['report']) }
                : {}),
        };
    }
    /** Validate a bounded revision page, known worker references and ordered coordination events. */
    public static snapshot(raw: unknown): RedTeamSnapshot {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(
            raw,
            ['effort', 'agents', 'tasks', 'findings', 'nextTaskCursor', 'nextFindingCursor'],
            ['coordination', 'delegatedAgents'],
        );
        const effort: RedTeamEffort = this.effort(value['effort']);
        const agents: readonly RedTeamAgent[] = RedTeamInput.list(
            value['agents'],
            RedTeamLimits.maxParallelism,
            (item: unknown): RedTeamAgent => this.agent(item),
        );
        const delegatedAgents: readonly RedTeamDelegatedAgent[] | undefined = Object.hasOwn(
            value,
            'delegatedAgents',
        )
            ? RedTeamInput.list(
                  value['delegatedAgents'],
                  RedTeamLimits.maxDelegatedAgents,
                  (item: unknown): RedTeamDelegatedAgent => this.delegatedAgent(item),
              )
            : undefined;
        const tasks: readonly RedTeamTask[] = RedTeamInput.list(
            value['tasks'],
            RedTeamLimits.pageSize,
            (item: unknown): RedTeamTask => this.task(item),
        );
        const findings: readonly RedTeamFinding[] = RedTeamInput.list(
            value['findings'],
            RedTeamLimits.pageSize,
            (item: unknown): RedTeamFinding => this.finding(item),
        );
        RedTeamInput.unique(
            [...agents, ...(delegatedAgents ?? [])].map(
                (item: RedTeamAgent): string => item.agentId,
            ),
        );
        RedTeamInput.unique(tasks.map((item: RedTeamTask): string => item.taskId));
        RedTeamInput.unique(findings.map((item: RedTeamFinding): string => item.findingId));
        const coordination: readonly RedTeamCoordinationEvent[] | undefined = Object.hasOwn(
            value,
            'coordination',
        )
            ? RedTeamInput.list(
                  value['coordination'],
                  RedTeamLimits.pageSize,
                  (item: unknown): RedTeamCoordinationEvent => this.coordination(item),
              )
            : undefined;
        if (coordination !== undefined) {
            RedTeamInput.unique(
                coordination.map((item: RedTeamCoordinationEvent): string => item.eventId),
            );
            const agentIds: ReadonlySet<string> = new Set([
                'orchestrator',
                ...agents.map((item: RedTeamAgent): string => item.agentId),
                ...(delegatedAgents ?? []).map((item: RedTeamAgent): string => item.agentId),
            ]);
            let previous: bigint = -1n;
            for (const event of coordination) {
                const delegated: RedTeamDelegatedAgent | undefined = delegatedAgents?.find(
                    (agent: RedTeamDelegatedAgent): boolean => agent.agentId === event.agentId,
                );
                const expectedSelection: RedTeamHistorySelection | undefined =
                    delegated?.historySelection;
                const selection: RedTeamHistorySelection | undefined =
                    event.action?.target.historySelection;
                const sequence: bigint = BigInt(event.sequence);
                if (sequence <= previous || !agentIds.has(event.agentId)) {
                    throw new TypeError(
                        'Coordination requires increasing sequences and a known agent',
                    );
                }
                if (
                    event.action &&
                    (event.action.effortId !== effort.effortId ||
                        event.action.agentId !== event.agentId ||
                        event.action.parentAgentId !==
                            (delegated?.parentAgentId ??
                                (event.agentId === 'orchestrator' ? null : 'orchestrator')) ||
                        selection?.workerId !== expectedSelection?.workerId ||
                        selection?.streamId !== expectedSelection?.streamId ||
                        event.action.target.sessionKey !==
                            (event.agentId === 'orchestrator'
                                ? effort.sessionKey
                                : (delegated?.sessionKey ??
                                  agents.find(
                                      (agent: RedTeamAgent): boolean =>
                                          agent.agentId === event.agentId,
                                  )?.sessionKey)))
                ) {
                    throw new TypeError(
                        'Execution action belongs to another effort, agent, or session',
                    );
                }
                previous = sequence;
            }
        }
        const nextTaskCursor: string | null = this.#nullableId(value['nextTaskCursor']);
        const nextFindingCursor: string | null = this.#nullableId(value['nextFindingCursor']);
        if (
            BigInt(tasks.length) > BigInt(effort.taskCount) ||
            BigInt(findings.length) > BigInt(effort.findingCount) ||
            (tasks.length === 0 && nextTaskCursor !== null) ||
            (findings.length === 0 && nextFindingCursor !== null)
        ) {
            throw new TypeError('Inconsistent red team ledger page');
        }
        return {
            effort,
            agents,
            tasks,
            findings,
            nextTaskCursor,
            nextFindingCursor,
            ...(coordination === undefined ? {} : { coordination }),
            ...(delegatedAgents === undefined ? {} : { delegatedAgents }),
        };
    }
    /** Decode one bounded owner-scoped effort directory page. */
    public static list(raw: unknown): RedTeamListPage {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(raw, [
            'items',
            'next',
        ]);
        const items: readonly RedTeamEffort[] = RedTeamInput.list(
            value['items'],
            RedTeamLimits.pageSize,
            (item: unknown): RedTeamEffort => this.effort(item),
        );
        RedTeamInput.unique(items.map((item: RedTeamEffort): string => item.effortId));
        const next: string | null = this.#nullableId(value['next']);
        if (items.length === 0 && next !== null) {
            throw new TypeError('Empty red team continuation');
        }
        return { items, next };
    }
    /** Duplicate and delayed snapshots cannot roll a rendered effort backwards. */
    public static advance(previous: RedTeamSnapshot | undefined, raw: unknown): RedTeamSnapshot {
        const next: RedTeamSnapshot = this.snapshot(raw);
        if (previous === undefined) {
            return next;
        }
        if (
            previous.effort.effortId !== next.effort.effortId ||
            previous.effort.sessionKey !== next.effort.sessionKey
        ) {
            throw new TypeError('Red team effort identity changed');
        }
        return BigInt(next.effort.revision) > BigInt(previous.effort.revision) ? next : previous;
    }
    static #nullableId(raw: unknown): string | null {
        return raw === null ? null : RedTeamInput.id(raw);
    }
}
