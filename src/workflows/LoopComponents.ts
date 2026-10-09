// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { WorkflowNode, WorkflowValue } from './WorkflowTypes.js';

/** Shared structural identities for explicit loop boundaries. */
export class LoopComponents {
    /** Executable loop coordinators own their body and completion ports. */
    public static isLoop(component: string): boolean {
        return component === 'flow.each' || component === 'flow.repeat';
    }
    /** Result boundaries cannot execute outside their owning loop. */
    public static isResult(component: string): boolean {
        return component === 'flow.each-result' || component === 'flow.repeat-result';
    }
    /** Different loop families cannot collect through each other's boundary. */
    public static result(component: string): string {
        return component === 'flow.repeat' ? 'flow.repeat-result' : 'flow.each-result';
    }
    /** Authored settings use names appropriate to items or stateful passes. */
    public static maximum(node: WorkflowNode): number {
        const value: WorkflowValue | undefined =
            node.configuration[node.component === 'flow.repeat' ? 'maxIterations' : 'maxItems'];
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 1000) {
            throw new Error('Loop requires a whole iteration limit between 1 and 1000');
        }
        return value;
    }
}
