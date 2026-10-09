import type {
    ReverseRunSnapshot,
    ReverseTaskSnapshot,
    WireTurnEvent,
    ReverseCatalogPage,
    ReverseEvidencePage,
    ReverseFunctionsPage,
    ReverseInspectResult,
} from '../protocol/Protocol.js';
import { reverseSnapshot } from '../protocol/Validators.js';
import { ApplicationReceipt } from './ApplicationReceipt.js';
import { ArchiveReceipt } from './ArchiveReceipt.js';
import { NavigationReceipt } from './NavigationReceipt.js';

/** Portable investigation receipt decoding and monotonic replay for multi-agent consumers. */
export class ReverseInvestigation {
    /** Validates untrusted receipts and bounds their presentation fields before rendering. */
    public static parse(input: unknown): ReverseRunSnapshot {
        if (!reverseSnapshot(input)) {
            throw new TypeError('Invalid investigation receipt');
        }
        if (input.application !== undefined) {
            if (input.kind !== 'javascript' && input.kind !== 'source') {
                throw new TypeError(
                    'Application projection requires a source or JavaScript target',
                );
            }
            ApplicationReceipt.validate(input.application);
        }
        if (
            input.version !== 1 ||
            (input.archive !== undefined &&
                (input.archive.sessionId.length === 0 || input.archive.sessionId.length > 1024)) ||
            !/^[0-9]{1,40}$/u.test(input.revision) ||
            input.id.length > 128 ||
            input.inputName.length > 1024 ||
            input.question.length > 8000 ||
            !/^[a-f0-9]{64}$/u.test(input.sha256) ||
            input.tasks.length > 16 ||
            (input.plan?.length ?? 0) > 6 ||
            input.evidence.length > 16 ||
            !Number.isSafeInteger(input.evidenceCount) ||
            input.evidenceCount < input.evidence.length ||
            input.cleanupErrors.length > 16 ||
            input.cleanupErrors.some((error: string): boolean => error.length > 2000)
        ) {
            throw new RangeError('Investigation receipt exceeds presentation limits');
        }
        const steps: ReadonlyMap<string, readonly string[]> = new Map(
            (input.plan ?? []).map((step): [string, readonly string[]] => [
                step.id,
                step.dependsOn,
            ]),
        );
        const experts: Set<string> = new Set(input.tasks.map((task): string => task.expert));
        if (
            experts.size !== input.tasks.length ||
            steps.size !== (input.plan?.length ?? 0) ||
            !this.#acyclic(
                new Map(
                    input.tasks.map((task): [string, readonly string[]] => [
                        task.expert,
                        task.dependsOn,
                    ]),
                ),
            ) ||
            !this.#acyclic(steps) ||
            input.plan?.some(
                (step): boolean =>
                    step.id.length === 0 ||
                    step.id.length > 128 ||
                    !experts.has(step.expert) ||
                    !experts.has(step.requestedBy) ||
                    step.scope.trim().length === 0 ||
                    step.scope.length > 256 ||
                    step.objective.trim().length === 0 ||
                    step.objective.length > 2000 ||
                    step.evidenceIds.length === 0 ||
                    step.evidenceIds.length > 8 ||
                    new Set(step.evidenceIds).size !== step.evidenceIds.length ||
                    step.evidenceIds.some(
                        (id: string): boolean => id.length === 0 || id.length > 128,
                    ) ||
                    step.dependsOn.length > 6 ||
                    new Set(step.dependsOn).size !== step.dependsOn.length ||
                    step.dependsOn.some((id: string): boolean => !steps.has(id)) ||
                    this.#invalidTask(step),
            ) ||
            input.tasks.some(
                (task): boolean =>
                    task.expert.length > 128 ||
                    task.dependsOn.length > 16 ||
                    task.dependsOn.some(
                        (id: string): boolean => !experts.has(id) || id === task.expert,
                    ) ||
                    this.#invalidTask(task),
            ) ||
            input.evidence.some(
                (record): boolean =>
                    !ArchiveReceipt.validRecord(record) ||
                    (record.stepId !== undefined && !steps.has(record.stepId)) ||
                    !experts.has(record.expert),
            )
        ) {
            throw new RangeError('Invalid investigation plan or evidence provenance');
        }
        return input;
    }

    /** Validates full catalog pages returned by the session-owned archive RPC. */
    public static catalog(input: unknown): ReverseCatalogPage {
        return ArchiveReceipt.catalog(input);
    }

    /** Validates original evidence pages returned by the session-owned archive RPC. */
    public static evidence(input: unknown): ReverseEvidencePage {
        return ArchiveReceipt.evidence(input);
    }

    /** Validates bounded, address-ordered native function metadata. */
    public static functions(input: unknown): ReverseFunctionsPage {
        return NavigationReceipt.functions(input);
    }

    /** Validates immutable provenance returned by a live, owner-scoped analyzer inspection. */
    public static inspection(input: unknown): ReverseInspectResult {
        return NavigationReceipt.inspection(input);
    }

    static #invalidTask(task: ReverseTaskSnapshot): boolean {
        return (
            !Number.isSafeInteger(task.attempts) ||
            task.attempts < 0 ||
            task.attempts > 2 ||
            (task.report !== null && task.report.length > 3000) ||
            (task.error !== null && task.error.length > 2000) ||
            (task.startedAtMs !== null && !/^[0-9]{1,40}$/u.test(task.startedAtMs)) ||
            (task.finishedAtMs !== null && !/^[0-9]{1,40}$/u.test(task.finishedAtMs))
        );
    }

    static #acyclic(nodes: ReadonlyMap<string, readonly string[]>): boolean {
        const visiting: Set<string> = new Set();
        const visited: Set<string> = new Set();
        const visit: (id: string) => boolean = (id: string): boolean => {
            if (visiting.has(id)) {
                return false;
            }
            if (visited.has(id)) {
                return true;
            }
            visiting.add(id);
            for (const dependency of nodes.get(id) ?? []) {
                if (!nodes.has(dependency) || !visit(dependency)) {
                    return false;
                }
            }
            visiting.delete(id);
            visited.add(id);
            return true;
        };
        return [...nodes.keys()].every(visit);
    }

    /** Reads native progress and final receipts without inferring structure from model prose. */
    public static event(event: WireTurnEvent): ReverseRunSnapshot | undefined {
        const value: ReverseRunSnapshot | undefined =
            event.type === 'tool-progress'
                ? event.update.reverse
                : event.type === 'tool-finish'
                  ? event.outcome.result.reverse
                  : undefined;
        return value === undefined ? undefined : this.parse(value);
    }

    /** Drops duplicate and out-of-order updates and refuses to switch a call to another run. */
    public static advance(
        previous: ReverseRunSnapshot | undefined,
        input: unknown,
    ): ReverseRunSnapshot {
        const next: ReverseRunSnapshot = this.parse(input);
        if (previous === undefined) {
            return next;
        }
        if (previous.id !== next.id || previous.sha256 !== next.sha256) {
            throw new Error('Investigation identity changed within a tool call');
        }
        if (
            previous.archive !== undefined &&
            previous.archive.sessionId !== next.archive?.sessionId
        ) {
            throw new Error('Investigation archive identity changed within a tool call');
        }
        if (BigInt(next.revision) <= BigInt(previous.revision)) {
            return previous;
        }
        if (previous.state !== 'pending' && previous.state !== 'running') {
            return previous;
        }
        return next;
    }
}
