// SPDX-License-Identifier: Apache-2.0
import { WorkflowInput } from './WorkflowInput.js';
import { WorkflowJson } from './WorkflowJson.js';
import { WorkflowScheduleCodec } from './schedule/ScheduleCodec.js';
import type {
    WorkflowScheduleRules,
    WorkflowScheduleConfiguration,
} from './schedule/ScheduleTypes.js';
import type { WorkflowNode, WorkflowObject } from './WorkflowTypes.js';
import type { WorkflowRunSnapshot } from './runtime/RunTypes.js';

/** A timed component proposes immutable rules; saving or publishing never enables it. */
export class WorkflowTimedTrigger {
    public static readonly component = 'trigger.timed' as const;
    public static supported(node: WorkflowNode): boolean {
        return (
            node.componentVersion === '1' &&
            (node.component === 'trigger.manual' || node.component === this.component)
        );
    }
    public static read(node: WorkflowNode): WorkflowScheduleRules | null {
        if (node.component !== this.component) {
            return null;
        }
        if (node.componentVersion !== '1') {
            throw new Error('Timed Event version is unavailable');
        }
        const configuration: Readonly<Record<string, unknown>> = WorkflowInput.record(
            node.configuration,
            ['schedule'],
        );
        return WorkflowScheduleCodec.rules(configuration['schedule']);
    }
    public static configuration(rules: WorkflowScheduleRules): WorkflowObject {
        return WorkflowJson.object({ schedule: WorkflowScheduleCodec.rules(rules) });
    }
    public static selected(
        nodes: readonly WorkflowNode[],
        triggerNodeId: string,
    ): WorkflowScheduleRules | null {
        const node: WorkflowNode | undefined = nodes.find(
            (entry: WorkflowNode): boolean => entry.id === triggerNodeId,
        );
        if (node === undefined) {
            throw new Error('The selected start component is missing');
        }
        return this.read(node);
    }
    public static assert(
        snapshot: WorkflowRunSnapshot,
        configuration: WorkflowScheduleConfiguration,
    ): void {
        const rules: WorkflowScheduleRules | null = this.selected(
            snapshot.graph.nodes,
            snapshot.triggerNodeId,
        );
        if (rules === null) {
            return;
        }
        const requested: WorkflowScheduleRules = WorkflowScheduleCodec.rules({
            timing: configuration.timing,
            missed: configuration.missed,
            catchUpLimit: configuration.catchUpLimit,
            lateGraceMs: configuration.lateGraceMs,
            maxConcurrentRuns: configuration.maxConcurrentRuns,
        });
        if (JSON.stringify(rules) !== JSON.stringify(requested)) {
            throw new Error(
                'Schedule does not match the published Timed Event. Edit the draft and publish its new rules before enabling.',
            );
        }
    }
}
