// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';
import type {
    CompanyTask,
    CompanyWork,
    CompanyWorkAttempt,
    CompanyWorkCommand,
    CompanyArtifact,
    CompanyEvidence,
} from './CompanyWorkTypes.js';

/** Versioned, bounded binary persistence; prompts and artifact contents are never public office data. */
export class CompanyWorkCodec {
    /** NCW2 distinguishes these records from the removed project implementation. */
    static readonly #magic: number = 0x3257434e;
    /** Encode private state with exact integer accounting and bounded lists. */
    public static encode(work: CompanyWork): Uint8Array {
        const w: BinaryWriter = new BinaryWriter(1024);
        w.u32(this.#magic).u8(1);
        w.str(work.projectId)
            .u64(work.revision)
            .str(work.phase)
            .str(work.workspaceId)
            .str(work.reviewerId);
        w.str(work.plan)
            .u64(work.proposedLimit)
            .str(work.allowanceId)
            .u64(work.allowanceRevision)
            .u64(work.limit);
        w.u32(work.concurrency)
            .u32(work.maxIterations)
            .u8(work.paused ? 1 : 0)
            .u8(work.priority);
        w.str(work.feedback).str(work.decision).u64(work.acceptedAt);
        this.#writeList(w, work.tasks, (task: CompanyTask): void => {
            w.str(task.id)
                .str(task.kind)
                .str(task.employeeId)
                .str(task.title)
                .str(task.instructions)
                .str(task.status);
            this.#writeList(w, task.acceptance, (value: string): void => {
                w.str(value);
            });
            this.#writeList(w, task.dependsOn, (value: string): void => {
                w.str(value);
            });
        });
        this.#writeList(w, work.attempts, (attempt: CompanyWorkAttempt): void => {
            w.str(attempt.id).str(attempt.taskId).str(attempt.employeeId).str(attempt.holder);
            w.u64(attempt.expires).u64(attempt.started).u64(attempt.finished).str(attempt.status);
            w.str(attempt.summary)
                .str(attempt.sessionId)
                .u64(attempt.inputTokens)
                .u64(attempt.outputTokens);
            this.#writeList(w, attempt.artifacts, (artifact: CompanyArtifact): void => {
                w.str(artifact.path).str(artifact.digest).u64(artifact.bytes);
            });
            this.#writeList(w, attempt.evidence, (evidence: CompanyEvidence): void => {
                w.str(evidence.callId).str(evidence.tool).str(evidence.summary);
            });
        });
        const packet: Uint8Array = w.toBytes();
        this.decode(packet);
        return packet;
    }
    /** Validate storage before exposing it to scheduling or rendering. */
    public static decode(packet: Uint8Array): CompanyWork {
        const r: BinaryReader = new BinaryReader(packet);
        if (r.u32() !== this.#magic || r.u8() !== 1) {
            throw new Error('Unsupported company work record');
        }
        const projectId: string = r.str();
        const revision: bigint = r.u64();
        const phase: string = r.str();
        if (
            phase !== 'draft' &&
            phase !== 'planning' &&
            phase !== 'plan-review' &&
            phase !== 'running' &&
            phase !== 'delivery-review' &&
            phase !== 'accepted' &&
            phase !== 'blocked'
        ) {
            throw new Error('Invalid stored project phase');
        }
        const workspaceId: string = r.str();
        const reviewerId: string = r.str();
        const plan: string = r.str();
        const proposedLimit: bigint = r.u64();
        const allowanceId: string = r.str();
        const allowanceRevision: bigint = r.u64();
        const limit: bigint = r.u64();
        const concurrency: number = r.u32();
        const maxIterations: number = r.u32();
        const paused: number = r.u8();
        const priority: number = r.u8();
        if (
            concurrency < 1 ||
            concurrency > 32 ||
            maxIterations < 1 ||
            maxIterations > 64 ||
            paused > 1 ||
            priority > 2
        ) {
            throw new Error('Invalid stored project limits');
        }
        const feedback: string = r.str();
        const decision: string = r.str();
        const acceptedAt: bigint = r.u64();
        const tasks: readonly CompanyTask[] = this.#readList(r, (): CompanyTask => {
            const id: string = r.str();
            const kind: string = r.str();
            const employeeId: string = r.str();
            const title: string = r.str();
            const instructions: string = r.str();
            const status: string = r.str();
            if (kind !== 'plan' && kind !== 'work' && kind !== 'review') {
                throw new Error('Invalid stored assignment');
            }
            if (
                status !== 'queued' &&
                status !== 'running' &&
                status !== 'done' &&
                status !== 'blocked'
            ) {
                throw new Error('Invalid stored task status');
            }
            return {
                id,
                kind,
                employeeId,
                title,
                instructions,
                status,
                acceptance: this.#readList(r, (): string => r.str()),
                dependsOn: this.#readList(r, (): string => r.str()),
            };
        });
        const attempts: readonly CompanyWorkAttempt[] = this.#readList(
            r,
            (): CompanyWorkAttempt => {
                const id: string = r.str();
                const taskId: string = r.str();
                const employeeId: string = r.str();
                const holder: string = r.str();
                const expires: bigint = r.u64();
                const started: bigint = r.u64();
                const finished: bigint = r.u64();
                const status: string = r.str();
                if (
                    status !== 'running' &&
                    status !== 'done' &&
                    status !== 'blocked' &&
                    status !== 'interrupted'
                ) {
                    throw new Error('Invalid stored attempt status');
                }
                return {
                    id,
                    taskId,
                    employeeId,
                    holder,
                    expires,
                    started,
                    finished,
                    status,
                    summary: r.str(),
                    sessionId: r.str(),
                    inputTokens: r.u64(),
                    outputTokens: r.u64(),
                    artifacts: this.#readList(r, (): CompanyArtifact => ({
                        path: r.str(),
                        digest: r.str(),
                        bytes: r.u64(),
                    })),
                    evidence: this.#readList(r, (): CompanyEvidence => ({
                        callId: r.str(),
                        tool: r.str(),
                        summary: r.str(),
                    })),
                };
            },
        );
        if (r.remaining !== 0) {
            throw new Error('Trailing company work data');
        }
        return {
            projectId,
            revision,
            phase,
            workspaceId,
            reviewerId,
            plan,
            proposedLimit,
            allowanceId,
            allowanceRevision,
            limit,
            concurrency,
            maxIterations,
            paused: paused === 1,
            priority,
            feedback,
            decision,
            acceptedAt,
            tasks,
            attempts,
        };
    }
    /** Canonical command bytes for durable deduplication, without JSON or an owner field. */
    public static command(command: CompanyWorkCommand): Uint8Array {
        const w: BinaryWriter = new BinaryWriter(256);
        w.str(command.kind).str(command.id).u64(command.revision);
        switch (command.kind) {
            case 'plan':
                w.str(command.reviewerId);
                w.u64(command.limit)
                    .u64(command.allowanceRevision)
                    .u32(command.concurrency)
                    .u32(command.maxIterations);
                break;
            case 'approve':
                w.u64(command.limit)
                    .u64(command.allowanceRevision)
                    .u32(command.concurrency)
                    .u32(command.maxIterations);
                break;
            case 'assign':
                w.str(command.taskId).str(command.employeeId);
                break;
            case 'schedule':
                w.u8(command.paused ? 1 : 0).u8(command.priority);
                break;
            case 'correct':
                w.str(command.feedback);
                break;
            case 'accept':
                w.str(command.evidence);
                break;
        }
        return w.toBytes();
    }
    /** Decode only owner decisions; execution results and host claims have no command representation. */
    public static decodeCommand(bytes: Uint8Array): CompanyWorkCommand {
        const r: BinaryReader = new BinaryReader(bytes);
        const kind: string = r.str();
        const id: string = r.str();
        const revision: bigint = r.u64();
        if (!/^[a-zA-Z0-9-]{1,64}$/.test(id)) {
            throw new Error('Invalid project command ID');
        }
        let command: CompanyWorkCommand;
        switch (kind) {
            case 'plan':
                command = {
                    kind,
                    id,
                    revision,
                    reviewerId: r.str(),
                    limit: r.u64(),
                    allowanceRevision: r.u64(),
                    concurrency: r.u32(),
                    maxIterations: r.u32(),
                };
                break;
            case 'approve':
                command = {
                    kind,
                    id,
                    revision,
                    limit: r.u64(),
                    allowanceRevision: r.u64(),
                    concurrency: r.u32(),
                    maxIterations: r.u32(),
                };
                break;
            case 'assign':
                command = { kind, id, revision, taskId: r.str(), employeeId: r.str() };
                break;
            case 'correct':
                command = { kind, id, revision, feedback: r.str() };
                break;
            case 'accept':
                command = { kind, id, revision, evidence: r.str() };
                break;
            case 'schedule': {
                const paused: number = r.u8();
                const priority: number = r.u8();
                if (paused > 1 || priority > 2) {
                    throw new Error('Invalid project schedule');
                }
                command = { kind, id, revision, paused: paused === 1, priority };
                break;
            }
            default:
                throw new Error('Unknown project decision');
        }
        if (r.remaining !== 0) {
            throw new Error('Trailing project decision data');
        }
        return command;
    }
    static #writeList<T>(w: BinaryWriter, values: readonly T[], write: (value: T) => void): void {
        if (values.length > 128) {
            throw new Error('Company work history requires archiving');
        }
        w.u32(values.length);
        for (const value of values) {
            write(value);
        }
    }
    static #readList<T>(r: BinaryReader, read: () => T): readonly T[] {
        const count: number = r.u32();
        if (count > 128) {
            throw new Error('Company work list exceeds limits');
        }
        return Array.from({ length: count }, read);
    }
}
