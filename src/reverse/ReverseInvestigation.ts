import type {
    ReverseBrowserPage,
    BrowserStructurePage,
    BrowserSourcesPage,
    ReverseGraphPage,
    ReverseRunSnapshot,
    ReverseTaskSnapshot,
    WireTurnEvent,
    ReverseCatalogPage,
    ReverseEvidencePage,
    ReverseFunctionsPage,
    ReverseInspectResult,
    ReverseNetworkDirectoryPage,
    ReverseNetworkDetailPage,
} from '../protocol/Protocol.js';
import { BrowserStructureReceipt } from './BrowserStructureReceipt.js';
import { BrowserSourcesReceipt } from './BrowserSourcesReceipt.js';
import { BrowserAnalysisReceipt } from './BrowserAnalysisReceipt.js';
import { BrowserReceipt } from './BrowserReceipt.js';
import { reverseSnapshot } from '../protocol/Validators.js';
import { GraphReceipt } from './GraphReceipt.js';
import { ApplicationReceipt } from './ApplicationReceipt.js';
import { NetworkDetailReceipt } from './NetworkDetailReceipt.js';
import { NetworkDirectoryReceipt } from './NetworkDirectoryReceipt.js';
import { NetworkReceipt } from './NetworkReceipt.js';
import { ArchiveReceipt } from './ArchiveReceipt.js';
import { NavigationReceipt } from './NavigationReceipt.js';
import { ReverseControlFlow, type ReverseControlFlowPage } from './ControlFlow.js';
export type {
    ReverseControlFlowPage,
    ReverseControlFlowBlock,
    ReverseControlFlowInstruction,
} from './ControlFlow.js';

/** Portable investigation receipt decoding and monotonic replay for multi-agent consumers. */
export class ReverseInvestigation {
    /** Validates one immutable request representation without loading other fields or bodies. */
    public static networkDetail(input: unknown): ReverseNetworkDetailPage {
        return NetworkDetailReceipt.read(input);
    }
    /** Validates source-ordered redacted network metadata without materializing payloads. */
    public static network(input: unknown): ReverseNetworkDirectoryPage {
        return NetworkDirectoryReceipt.read(input);
    }
    /** Validates a bounded immutable graph or selected-block instruction page. */
    public static graph(input: unknown): ReverseGraphPage {
        return GraphReceipt.read(input);
    }
    /** Validates captured IDA or Ghidra basic blocks before rendering or comparing them. */
    public static controlFlow(input: unknown): ReverseControlFlowPage {
        return ReverseControlFlow.read(input);
    }
    /** Validates untrusted receipts and bounds their presentation fields before rendering. */
    public static parse(input: unknown): ReverseRunSnapshot {
        if (!reverseSnapshot(input)) {
            throw new TypeError('Invalid investigation receipt');
        }
        if (input.network !== undefined) {
            if (input.kind !== 'network') {
                throw new TypeError('Network projection requires a network target');
            }
            NetworkReceipt.validate(input.network);
        }
        if (input.browser !== undefined) {
            if (input.kind !== 'browser') {
                throw new TypeError('Browser projection requires a browser target');
            }
            BrowserReceipt.snapshot(input.browser, input.id, input.archive?.sessionId);
        }
        if (input.browserStructure !== undefined) {
            if (input.kind !== 'browser') {
                throw new TypeError('Browser structure requires a browser target');
            }
            BrowserStructureReceipt.snapshot(
                input.browserStructure,
                input.id,
                input.archive?.sessionId,
            );
        }
        if (input.browserSources !== undefined) {
            if (input.kind !== 'browser') {
                throw new TypeError('Browser sources require a browser target');
            }
            BrowserSourcesReceipt.snapshot(
                input.browserSources,
                input.id,
                input.archive?.sessionId,
            );
        }
        if (input.browserInput !== undefined) {
            if (input.kind !== 'javascript') {
                throw new RangeError('Captured browser source analysis requires a JavaScript run');
            }
            BrowserAnalysisReceipt.snapshot(input.browserInput, input.id, input.archive?.sessionId);
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
            (input.execution !== undefined &&
                (!Number.isSafeInteger(input.execution) ||
                    input.execution < 0 ||
                    input.execution > 3)) ||
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
                    this.#invalidTask(step, Math.min(2 * ((input.execution ?? 0) + 1), 6)),
            ) ||
            input.tasks.some(
                (task): boolean =>
                    task.expert.length > 128 ||
                    task.dependsOn.length > 16 ||
                    task.dependsOn.some(
                        (id: string): boolean => !experts.has(id) || id === task.expert,
                    ) ||
                    this.#invalidTask(task, Math.min(2 * ((input.execution ?? 0) + 1), 6)),
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

    /** Validates bounded saved browser metadata returned by the session-owned archive RPC. */
    public static browser(input: unknown): ReverseBrowserPage {
        return BrowserReceipt.read(input);
    }

    /** Validates one bounded saved DOM/AX or attribute directory over the session-owned gateway. */
    public static structure(input: unknown): BrowserStructurePage {
        return BrowserStructureReceipt.read(input);
    }
    /** Validates script/resource directories or independently selected immutable source text pages. */
    public static sources(input: unknown): BrowserSourcesPage {
        return BrowserSourcesReceipt.read(input);
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

    static #invalidTask(task: ReverseTaskSnapshot, maximum: number): boolean {
        return (
            !Number.isSafeInteger(task.attempts) ||
            task.attempts < 0 ||
            task.attempts > maximum ||
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
        const previousExecution: number = previous.execution ?? 0;
        const nextExecution: number = next.execution ?? 0;
        if (nextExecution < previousExecution) {
            return previous;
        }
        if (nextExecution > previousExecution && previous.state === 'done') {
            throw new Error('Completed investigation cannot resume execution');
        }
        if (
            nextExecution === previousExecution &&
            previous.state !== 'pending' &&
            previous.state !== 'running'
        ) {
            return previous;
        }
        return next;
    }
}
