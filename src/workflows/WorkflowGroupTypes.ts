// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { PortDirection } from './ComponentTypes.js';
import type { WorkflowEndpoint } from './WorkflowTypes.js';

/** Published ports retain the original executable endpoint and explicit direction. */
export interface WorkflowGroupPort {
    readonly id: string;
    readonly label: string;
    readonly direction: PortDirection;
    readonly endpoint: WorkflowEndpoint;
}
/** Saved hierarchy owns parent-local geometry; collapse and viewport remain editor preferences. */
export interface WorkflowGroup {
    readonly id: string;
    readonly title: string;
    readonly objective: string;
    readonly parent: string | null;
    readonly x: number;
    readonly y: number;
    readonly nodes: readonly string[];
    readonly ports: readonly WorkflowGroupPort[];
}
/** Each revision references an immutable group body independently from executable node content. */
export interface WorkflowGroupReference {
    readonly id: string;
    readonly content: string;
}
