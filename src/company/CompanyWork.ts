// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';

/** A durable project phase; proposal approval and delivery acceptance are separate decisions. */
export type CompanyWorkPhase =
    'draft' | 'planning' | 'plan-review' | 'running' | 'delivery-review' | 'accepted' | 'blocked';
/** One employee assignment in an approved dependency graph. */
export interface CompanyWorkTask {
    readonly id: string;
    readonly kind: 'plan' | 'work' | 'review';
    readonly employeeId: string;
    readonly title: string;
    readonly instructions: string;
    readonly acceptance: readonly string[];
    readonly dependsOn: readonly string[];
    readonly status: 'queued' | 'running' | 'done' | 'blocked';
}
/** A captured file is addressed by its digest, never by an arbitrary download path. */
export interface CompanyArtifact {
    readonly path: string;
    readonly digest: string;
    readonly bytes: bigint;
}
/** Actual execution history, including the evidence and delivery from that exact attempt. */
export interface CompanyWorkAttempt {
    readonly id: string;
    readonly taskId: string;
    readonly holder: string;
    readonly expires: bigint;
    readonly started: bigint;
    readonly finished: bigint;
    readonly status: 'running' | 'done' | 'blocked';
    readonly summary: string;
    readonly sessionId: string;
    readonly inputTokens: bigint;
    readonly outputTokens: bigint;
    readonly artifacts: readonly CompanyArtifact[];
    readonly evidence: readonly string[];
}
/** Private work state stored independently of the company roster and individual conversations. */
export interface CompanyWork {
    readonly projectId: string;
    readonly revision: bigint;
    readonly phase: CompanyWorkPhase;
    readonly workspaceId: string;
    readonly reviewerId: string;
    readonly plan: string;
    readonly proposedLimit: bigint;
    readonly allowanceId: string;
    readonly allowanceRevision: bigint;
    readonly limit: bigint;
    readonly concurrency: number;
    readonly maxIterations: number;
    readonly feedback: string;
    readonly decision: string;
    readonly tasks: readonly CompanyWorkTask[];
    readonly attempts: readonly CompanyWorkAttempt[];
}
/** A manager's proposal is validated before it can become executable work. */
export interface CompanyProposal {
    readonly summary: string;
    readonly limit: bigint;
    readonly tasks: readonly Omit<CompanyWorkTask, 'kind' | 'status'>[];
}

/** Owner decisions are revision-checked and idempotent; none accepts a principal from the wire. */
export type CompanyWorkCommand =
    | {
          readonly kind: 'plan';
          readonly id: string;
          readonly revision: bigint;
          readonly reviewerId: string;
          readonly limit: bigint;
          readonly allowanceRevision: bigint;
          readonly concurrency: number;
          readonly maxIterations: number;
      }
    | {
          readonly kind: 'approve';
          readonly id: string;
          readonly revision: bigint;
          readonly limit: bigint;
          readonly allowanceRevision: bigint;
          readonly concurrency: number;
          readonly maxIterations: number;
      }
    | {
          readonly kind: 'correct';
          readonly id: string;
          readonly revision: bigint;
          readonly feedback: string;
      }
    | {
          readonly kind: 'accept';
          readonly id: string;
          readonly revision: bigint;
          readonly evidence: string;
      };

/** Bounded binary persistence, reusable by the private company channel. */
export class CompanyWorkCodec {
    static readonly #decoder = new TextDecoder('utf-8', { fatal: true });
    static readonly #encoder = new TextEncoder();
    /** Encode a complete private work snapshot; file contents remain in the artifact store. */
    public static encode(work: CompanyWork): Uint8Array {
        const w = new BinaryWriter(1024);
        const text = (value: string): void => {
            if (value.length > 16000 || CompanyWorkCodec.#encoder.encode(value).length > 65536) {
                throw new Error('Company work text exceeds limits');
            }
            w.str(value);
        };
        const big = (value: bigint): void => {
            if (value < 0n || value > 0x7fffffffffffffffn) {
                throw new Error('Invalid company work integer');
            }
            w.u64(value);
        };
        const list = <T>(values: readonly T[], write: (value: T) => void): void => {
            if (values.length > 128) {
                throw new Error('Company work history requires archiving');
            }
            w.u32(values.length);
            for (const value of values) {
                write(value);
            }
        };
        w.u32(0x4b57434e).u8(1);
        text(work.projectId);
        big(work.revision);
        text(work.phase);
        text(work.workspaceId);
        text(work.reviewerId);
        text(work.plan);
        big(work.proposedLimit);
        text(work.allowanceId);
        big(work.allowanceRevision);
        big(work.limit);
        if (
            !Number.isInteger(work.concurrency) ||
            work.concurrency < 1 ||
            work.concurrency > 32 ||
            !Number.isInteger(work.maxIterations) ||
            work.maxIterations < 1 ||
            work.maxIterations > 64
        ) {
            throw new Error('Invalid company execution limits');
        }
        w.u32(work.concurrency).u32(work.maxIterations);
        text(work.feedback);
        text(work.decision);
        list(work.tasks, (task) => {
            text(task.id);
            text(task.kind);
            text(task.employeeId);
            text(task.title);
            text(task.instructions);
            text(task.status);
            list(task.acceptance, text);
            list(task.dependsOn, text);
        });
        list(work.attempts, (attempt) => {
            text(attempt.id);
            text(attempt.taskId);
            text(attempt.holder);
            big(attempt.expires);
            big(attempt.started);
            big(attempt.finished);
            text(attempt.status);
            text(attempt.summary);
            text(attempt.sessionId);
            big(attempt.inputTokens);
            big(attempt.outputTokens);
            list(attempt.artifacts, (artifact) => {
                text(artifact.path);
                text(artifact.digest);
                big(artifact.bytes);
            });
            list(attempt.evidence, text);
        });
        if (w.length > 2 * 1024 * 1024) {
            throw new Error('Company work snapshot exceeds limits');
        }
        return w.toBytes();
    }
    /** Refuse malformed or newer snapshots rather than silently dropping their state. */
    public static decode(bytes: Uint8Array): CompanyWork {
        if (bytes.length > 2 * 1024 * 1024) {
            throw new Error('Company work snapshot exceeds limits');
        }
        const r = new BinaryReader(bytes);
        const text = (): string => {
            const length = r.u32();
            if (length > 65536) {
                throw new Error('Company work text exceeds limits');
            }
            const value = CompanyWorkCodec.#decoder.decode(r.bytes(length));
            if (value.length > 16000) {
                throw new Error('Company work text exceeds limits');
            }
            return value;
        };
        const big = (): bigint => {
            const bytes = r.bytes(8);
            const value = new DataView(
                bytes.buffer,
                bytes.byteOffset,
                bytes.byteLength,
            ).getBigUint64(0, true);
            if (value > 0x7fffffffffffffffn) {
                throw new Error('Invalid company work integer');
            }
            return value;
        };
        const list = <T>(read: () => T): readonly T[] => {
            const count = r.u32();
            if (count > 128) {
                throw new Error('Too many company work records');
            }
            return Array.from({ length: count }, read);
        };
        const choice = <T extends string>(allowed: readonly T[]): T => {
            const value = text();
            const found = allowed.find((item) => item === value);
            if (found === undefined) {
                throw new Error('Invalid company work state');
            }
            return found;
        };
        if (r.u32() !== 0x4b57434e || r.u8() !== 1) {
            throw new Error('Unsupported company work snapshot');
        }
        const projectId = text();
        const revision = big();
        const phase = choice<CompanyWorkPhase>([
            'draft',
            'planning',
            'plan-review',
            'running',
            'delivery-review',
            'accepted',
            'blocked',
        ]);
        const workspaceId = text();
        const reviewerId = text();
        const plan = text();
        const proposedLimit = big();
        const allowanceId = text();
        const allowanceRevision = big();
        const limit = big();
        const concurrency = r.u32();
        const maxIterations = r.u32();
        if (concurrency < 1 || concurrency > 32 || maxIterations < 1 || maxIterations > 64) {
            throw new Error('Invalid company execution limits');
        }
        const feedback = text();
        const decision = text();
        const tasks = list<CompanyWorkTask>(() => ({
            id: text(),
            kind: choice(['plan', 'work', 'review']),
            employeeId: text(),
            title: text(),
            instructions: text(),
            status: choice(['queued', 'running', 'done', 'blocked']),
            acceptance: list(text),
            dependsOn: list(text),
        }));
        const attempts = list<CompanyWorkAttempt>(() => ({
            id: text(),
            taskId: text(),
            holder: text(),
            expires: big(),
            started: big(),
            finished: big(),
            status: choice(['running', 'done', 'blocked']),
            summary: text(),
            sessionId: text(),
            inputTokens: big(),
            outputTokens: big(),
            artifacts: list(() => ({ path: text(), digest: text(), bytes: big() })),
            evidence: list(text),
        }));
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
            feedback,
            decision,
            tasks,
            attempts,
        };
    }
}
