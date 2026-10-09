// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowTemplateFields } from './TemplateFields.js';
import type { WorkflowNode, WorkflowEdge, WorkflowObject, WorkflowValue } from './WorkflowTypes.js';

/** Minimal graph contract for checking directly submitted template inputs. */
export interface WorkflowTemplateGraph {
    readonly nodes: readonly WorkflowNode[];
    readonly edges: readonly WorkflowEdge[];
}

/** Validates templates directly started by this trigger before durable run acceptance. */
export class WorkflowTemplateInputs {
    /** Conditional and computed values remain checked at their actual invocation. */
    public static validate(
        graph: WorkflowTemplateGraph,
        trigger: string,
        input: WorkflowObject,
    ): void {
        const started: ReadonlySet<string> = new Set(
            graph.edges
                .filter(
                    (edge: WorkflowEdge): boolean =>
                        edge.kind === 'flow' && edge.from.node === trigger,
                )
                .map((edge: WorkflowEdge): string => edge.to.node),
        );
        const targets: ReadonlySet<string> = new Set(
            graph.edges
                .filter(
                    (edge: WorkflowEdge): boolean =>
                        edge.kind === 'data' &&
                        edge.from.node === trigger &&
                        edge.from.port === 'input' &&
                        edge.to.port === 'values',
                )
                .map((edge: WorkflowEdge): string => edge.to.node),
        );
        for (const node of graph.nodes) {
            if (
                node.component !== 'text.template' ||
                !started.has(node.id) ||
                !targets.has(node.id)
            ) {
                continue;
            }
            const template: WorkflowValue | undefined = node.configuration['template'];
            if (typeof template !== 'string') {
                continue;
            }
            try {
                WorkflowTemplateFields.validate(template, input);
            } catch (caught: unknown) {
                const message: string =
                    caught instanceof Error ? caught.message : 'Review template inputs';
                throw new Error(
                    `Component "${node.label}" (${node.id}, text.template): ${message}`,
                    { cause: caught },
                );
            }
        }
    }
}
