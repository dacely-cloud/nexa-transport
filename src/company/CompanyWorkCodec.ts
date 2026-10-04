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
    CompanyBaseline,
    CompanyShowcase,
    CompanyVerificationOutcome,
    CompanyInterruptionReview,
    CompanyToolPermission,
} from './CompanyWorkTypes.js';

/** Versioned, bounded binary persistence; prompts and artifact contents are never public office data. */
export class CompanyWorkCodec {
    static readonly #outcomes: readonly CompanyVerificationOutcome[] = [
        'command-passed',
        'command-failed',
        'file-inspected',
    ];
    /** NCW2 distinguishes these records from the removed project implementation. */
    static readonly #magic: number = 0x3257434e;
    /** Encode private state with exact integer accounting and bounded lists. */
    public static encode(
        work: CompanyWork,
        verification: boolean = true,
        showcase: boolean = true,
        recovery: boolean = true,
        permissions: boolean = true,
    ): Uint8Array {
        const w: BinaryWriter = new BinaryWriter(1024);
        const version: number =
            permissions && work.attempts.some((attempt) => (attempt.permissions?.length ?? 0) > 0)
                ? 6
                : recovery &&
                    work.attempts.some((attempt) => attempt.interruptionReview !== undefined)
                  ? 5
                  : showcase && work.showcase
                    ? 4
                    : verification &&
                        work.attempts.some((attempt) =>
                            attempt.evidence.some((evidence) => evidence.outcome !== undefined),
                        )
                      ? 3
                      : work.baseline
                        ? 2
                        : 1;
        w.u32(this.#magic).u8(version);
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
                if (version >= 3) {
                    const outcome: number =
                        evidence.outcome === undefined
                            ? 0
                            : this.#outcomes.indexOf(evidence.outcome) + 1;
                    if (evidence.outcome !== undefined && outcome === 0) {
                        throw new Error('Invalid verification outcome');
                    }
                    w.u8(outcome);
                }
            });
            if (version >= 5) {
                w.u8(attempt.interruptionReview ? 1 : 0);
                if (attempt.interruptionReview) {
                    w.str(attempt.interruptionReview.id)
                        .u64(attempt.interruptionReview.at)
                        .str(attempt.interruptionReview.evidence);
                }
            }
            if (version >= 6) {
                const saved: readonly CompanyToolPermission[] = attempt.permissions ?? [];
                if (saved.length > 32) {
                    throw new Error('Too many saved tool permissions');
                }
                this.#writeList(w, saved, (permission: CompanyToolPermission): void => {
                    this.validatePermission(permission);
                    w.str(permission.id)
                        .str(permission.fingerprint)
                        .str(permission.tool)
                        .str(permission.summary)
                        .str(permission.detail)
                        .str(permission.arguments)
                        .str(permission.risk)
                        .u64(permission.requested)
                        .u64(permission.expires)
                        .str(permission.status)
                        .u64(permission.decided)
                        .str(permission.decisionId);
                });
            }
        });
        if (version >= 3) {
            w.u8(work.baseline ? 1 : 0);
        }
        if (work.baseline) {
            const base: CompanyBaseline = work.baseline;
            w.str(base.projectId).u64(base.revision).u64(base.acceptedAt);
            this.#writeList(w, base.files, (file: CompanyArtifact): void => {
                w.str(file.path).str(file.digest).u64(file.bytes);
            });
        }
        if (version >= 5) {
            w.u8(showcase && work.showcase ? 1 : 0);
        }
        if (version >= 4 && showcase && work.showcase) {
            w.str(work.showcase.name).str(work.showcase.description).u64(work.showcase.publishedAt);
        }
        const packet: Uint8Array = w.toBytes();
        this.decode(packet);
        return packet;
    }
    /** Validate storage before exposing it to scheduling or rendering. */
    public static decode(packet: Uint8Array): CompanyWork {
        const r: BinaryReader = new BinaryReader(packet);
        const magic: number = r.u32();
        const version: number = r.u8();
        if (
            magic !== this.#magic ||
            (version !== 1 &&
                version !== 2 &&
                version !== 3 &&
                version !== 4 &&
                version !== 5 &&
                version !== 6)
        ) {
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
                const attempt: CompanyWorkAttempt = {
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
                    evidence: this.#readList(r, (): CompanyEvidence => {
                        const evidence: CompanyEvidence = {
                            callId: r.str(),
                            tool: r.str(),
                            summary: r.str(),
                        };
                        const code: number = version >= 3 ? r.u8() : 0;
                        if (code > this.#outcomes.length) {
                            throw new Error('Invalid verification outcome');
                        }
                        if (
                            (code === 3 && evidence.tool !== 'read_file') ||
                            ((code === 1 || code === 2) &&
                                evidence.tool !== 'run_bash' &&
                                evidence.tool !== 'read_bash')
                        ) {
                            throw new Error('Verification outcome does not match its tool');
                        }
                        if (code === 0) {
                            return evidence;
                        }
                        const outcome: CompanyVerificationOutcome | undefined =
                            this.#outcomes[code - 1];
                        if (!outcome) {
                            throw new Error('Invalid verification outcome');
                        }
                        return { ...evidence, outcome };
                    }),
                };
                const reviewed: number = version >= 5 ? r.u8() : 0;
                if (reviewed > 1) {
                    throw new Error('Invalid interruption review presence');
                }
                let completed: CompanyWorkAttempt = attempt;
                if (reviewed === 1) {
                    const review: CompanyInterruptionReview = {
                        id: r.str(),
                        at: r.u64(),
                        evidence: r.str(),
                    };
                    if (
                        status !== 'blocked' ||
                        review.at !== finished ||
                        review.at < started ||
                        !/^[a-zA-Z0-9-]{1,64}$/.test(review.id) ||
                        !review.evidence.trim() ||
                        review.evidence.length > 8000
                    ) {
                        throw new Error('Invalid stored interruption review');
                    }
                    completed = { ...attempt, interruptionReview: review };
                }
                if (version >= 6) {
                    const permissions: readonly CompanyToolPermission[] = this.#readList(
                        r,
                        (): CompanyToolPermission => this.#readPermission(r),
                    );
                    if (
                        permissions.length > 32 ||
                        new Set(permissions.map((item) => item.id)).size !== permissions.length ||
                        permissions.some((item) => item.requested < started)
                    ) {
                        throw new Error('Invalid saved attempt permissions');
                    }
                    if (permissions.length > 0) {
                        completed = { ...completed, permissions };
                    }
                }
                return completed;
            },
        );
        const present: number = version >= 3 ? r.u8() : version === 2 ? 1 : 0;
        if (present > 1) {
            throw new Error('Invalid stored baseline presence');
        }
        const baseline: CompanyBaseline | undefined =
            present === 1
                ? {
                      projectId: r.str(),
                      revision: r.u64(),
                      acceptedAt: r.u64(),
                      files: this.#readList(r, (): CompanyArtifact => ({
                          path: r.str(),
                          digest: r.str(),
                          bytes: r.u64(),
                      })),
                  }
                : undefined;
        const showcased: number = version >= 5 ? r.u8() : version === 4 ? 1 : 0;
        if (showcased > 1) {
            throw new Error('Invalid stored public showcase presence');
        }
        const showcase: CompanyShowcase | undefined =
            showcased === 1
                ? {
                      name: r.str(),
                      description: r.str(),
                      publishedAt: r.u64(),
                  }
                : undefined;
        if (
            showcase &&
            (phase !== 'accepted' ||
                !showcase.name ||
                showcase.name.length > 64 ||
                showcase.description.length > 280 ||
                showcase.name !== showcase.name.trim() ||
                showcase.description !== showcase.description.trim() ||
                Array.from(showcase.name).some(
                    (character: string): boolean =>
                        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
                ) ||
                Array.from(showcase.description).some((character: string): boolean => {
                    const code: number = character.charCodeAt(0);
                    return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
                }))
        ) {
            throw new Error('Invalid stored public showcase');
        }
        if (baseline) {
            this.#validateBaseline(baseline, projectId);
        }
        if (r.remaining !== 0) {
            throw new Error('Trailing company work data');
        }
        return {
            projectId,
            revision,
            phase,
            workspaceId,
            ...(baseline ? { baseline } : {}),
            ...(showcase ? { showcase } : {}),
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
            case 'permission':
                w.str(command.attemptId)
                    .str(command.permissionId)
                    .str(command.fingerprint)
                    .u8(command.approved ? 1 : 0);
                break;
            case 'review-interruption':
                w.str(command.attemptId).str(command.evidence);
                break;
            case 'showcase':
                w.u8(command.published ? 1 : 0)
                    .str(command.name)
                    .str(command.description);
                break;
            case 'baseline':
                w.str(command.sourceProject).u64(command.sourceRevision);
                break;
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
            case 'permission': {
                const attemptId: string = r.str();
                const permissionId: string = r.str();
                const fingerprint: string = r.str();
                const approved: number = r.u8();
                if (
                    !/^[a-zA-Z0-9-]{1,80}$/.test(attemptId) ||
                    !/^[a-zA-Z0-9-]{1,64}$/.test(permissionId) ||
                    !/^[a-f0-9]{64}$/.test(fingerprint) ||
                    approved > 1
                ) {
                    throw new Error('Invalid tool permission decision');
                }
                command = {
                    kind,
                    id,
                    revision,
                    attemptId,
                    permissionId,
                    fingerprint,
                    approved: approved === 1,
                };
                break;
            }
            case 'review-interruption': {
                const attemptId: string = r.str();
                const evidence: string = r.str();
                if (
                    !/^[a-zA-Z0-9-]{1,80}$/.test(attemptId) ||
                    !evidence.trim() ||
                    evidence.length > 8000
                ) {
                    throw new Error('Invalid interruption review');
                }
                command = { kind, id, revision, attemptId, evidence };
                break;
            }
            case 'showcase': {
                const published: number = r.u8();
                const name: string = r.str(),
                    description: string = r.str();
                if (
                    published > 1 ||
                    name.length > 64 ||
                    description.length > 280 ||
                    (published === 0 && (name !== '' || description !== ''))
                ) {
                    throw new Error('Invalid public showcase decision');
                }
                command = { kind, id, revision, published: published === 1, name, description };
                break;
            }
            case 'baseline':
                command = { kind, id, revision, sourceProject: r.str(), sourceRevision: r.u64() };
                break;
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
    /** Validate both host-created records and decoded durable binary state. */
    public static validatePermission(permission: CompanyToolPermission): void {
        if (
            !/^[a-zA-Z0-9-]{1,64}$/.test(permission.id) ||
            !/^[a-f0-9]{64}$/.test(permission.fingerprint) ||
            !permission.tool.trim() ||
            permission.tool.length > 128 ||
            !permission.summary.trim() ||
            permission.summary.length > 2000 ||
            permission.detail.length > 8000 ||
            !permission.arguments.trim() ||
            permission.arguments.length > 16000 ||
            !['read', 'write', 'execute', 'destructive'].includes(permission.risk) ||
            !['pending', 'approved', 'denied', 'expired'].includes(permission.status) ||
            permission.requested < 0n ||
            permission.expires <= permission.requested ||
            permission.expires > 0xffffffffffffffffn ||
            permission.decided < 0n ||
            permission.decided > 0xffffffffffffffffn ||
            (permission.status === 'pending' &&
                (permission.decided !== 0n || permission.decisionId !== '')) ||
            (permission.status !== 'pending' && permission.decided < permission.requested) ||
            ((permission.status === 'approved' || permission.status === 'denied') &&
                (permission.decided >= permission.expires ||
                    !/^[a-zA-Z0-9-]{1,64}$/.test(permission.decisionId))) ||
            (permission.status === 'expired' &&
                (permission.decided < permission.expires || permission.decisionId !== ''))
        ) {
            throw new Error('Invalid saved tool permission');
        }
    }
    static #readPermission(r: BinaryReader): CompanyToolPermission {
        const id: string = r.str(),
            fingerprint: string = r.str(),
            tool: string = r.str(),
            summary: string = r.str(),
            detail: string = r.str(),
            args: string = r.str(),
            risk: string = r.str();
        const requested: bigint = r.u64(),
            expires: bigint = r.u64();
        const status: string = r.str();
        const decided: bigint = r.u64();
        const decisionId: string = r.str();
        if (
            (risk !== 'read' && risk !== 'write' && risk !== 'execute' && risk !== 'destructive') ||
            (status !== 'pending' &&
                status !== 'approved' &&
                status !== 'denied' &&
                status !== 'expired')
        ) {
            throw new Error('Invalid tool permission status or risk');
        }
        const permission: CompanyToolPermission = {
            id,
            fingerprint,
            tool,
            summary,
            detail,
            arguments: args,
            risk,
            requested,
            expires,
            status,
            decided,
            decisionId,
        };
        this.validatePermission(permission);
        return permission;
    }
    static #validateBaseline(base: CompanyBaseline, project: string): void {
        let total: bigint = 0n;
        const paths: Set<string> = new Set();
        if (
            !/^[a-zA-Z0-9-]{1,80}$/.test(base.projectId) ||
            base.projectId === project ||
            base.revision < 1n ||
            base.acceptedAt < 1n ||
            base.files.length < 1 ||
            base.files.length > 64
        ) {
            throw new Error('Invalid accepted project baseline');
        }
        for (const file of base.files) {
            if (
                !file.path ||
                file.path.length > 1024 ||
                /^[a-zA-Z]:/.test(file.path) ||
                file.path.includes('\\') ||
                file.path.split('/').some((part) => !part || part === '.' || part === '..') ||
                /[\p{Cc}\p{Cf}]/u.test(file.path) ||
                !/^[0-9a-f]{64}$/.test(file.digest) ||
                file.bytes < 0n ||
                file.bytes > 4n * 1024n * 1024n ||
                paths.has(file.path)
            ) {
                throw new Error('Invalid baseline file');
            }
            paths.add(file.path);
            total += file.bytes;
        }
        if (total > 32n * 1024n * 1024n) {
            throw new Error('Accepted baseline exceeds 32 MiB');
        }
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
