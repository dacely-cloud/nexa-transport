// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { ValueSchema, ObjectSchema } from './SchemaTypes.js';
import type { WorkflowEdgeKind, WorkflowObject } from './WorkflowTypes.js';
import type { ResourceFamily, ResourceUse } from './ResourceTypes.js';

/** The four authoring roles have different scheduling semantics. */
export const ComponentRole = {
    Trigger: 'trigger',
    Step: 'step',
    Resource: 'resource',
    Visual: 'visual',
} as const;
export type ComponentRole = (typeof ComponentRole)[keyof typeof ComponentRole];
/** Catalog grouping retains all requested capability areas without declaring runtime support. */
export const ComponentCategory = {
    Triggers: 'triggers',
    Connections: 'connections',
    Api: 'api',
    Transform: 'transform',
    Conditions: 'conditions',
    Flow: 'flow',
    Time: 'time',
    Agents: 'agents',
    Prompts: 'prompts',
    Personas: 'personas',
    Models: 'models',
    Context: 'context',
    Research: 'research',
    Tools: 'tools',
    Programs: 'programs',
    Browser: 'browser',
    Media: 'media',
    Documents: 'documents',
    Messaging: 'messaging',
    Storage: 'storage',
    Teams: 'teams',
    Planning: 'planning',
    Human: 'human',
    Quality: 'quality',
    Cache: 'cache',
    Policy: 'policy',
    Output: 'output',
    Utilities: 'utilities',
    Resources: 'resources',
    Observability: 'observability',
    Entities: 'entities',
    Experiments: 'experiments',
    Collection: 'collection',
} as const;
export type ComponentCategory = (typeof ComponentCategory)[keyof typeof ComponentCategory];
export const PortDirection = { Input: 'input', Output: 'output' } as const;
export type PortDirection = (typeof PortDirection)[keyof typeof PortDirection];
export const PortCardinality = { Item: 'item', List: 'list', Stream: 'stream' } as const;
export type PortCardinality = (typeof PortCardinality)[keyof typeof PortCardinality];
/** Multiple inputs require an explicit collector or join. Last-writer-wins is not an option. */
export const IncomingPolicy = { Reject: 'reject', Collect: 'collect', Join: 'join' } as const;
export type IncomingPolicy = (typeof IncomingPolicy)[keyof typeof IncomingPolicy];

/** Literal inputs and wire inputs share one schema; connecting both is ambiguous and rejected. */
export interface ComponentPort {
    readonly id: string;
    readonly label: string;
    readonly direction: PortDirection;
    readonly kind: WorkflowEdgeKind;
    readonly schema: ValueSchema;
    readonly cardinality: PortCardinality;
    readonly required: boolean;
    readonly maxConnections: number;
    readonly incoming: IncomingPolicy;
    readonly literalField: string | null;
    /** Authoring hint; runtime must still verify the provider's actual supported operations. */
    readonly modelCapabilities?: readonly string[];
}
/** Inline resource bindings have the same capability requirements as exposed resource cards. */
export interface ComponentResourceSlot {
    readonly family: ResourceFamily;
    readonly uses: readonly ResourceUse[];
}
export const ComponentEffect = {
    Pure: 'pure',
    Inference: 'inference',
    External: 'external',
    Wait: 'wait',
} as const;
export type ComponentEffect = (typeof ComponentEffect)[keyof typeof ComponentEffect];
export const MockBehavior = {
    Deterministic: 'deterministic',
    Fixture: 'fixture',
    None: 'none',
} as const;
export type MockBehavior = (typeof MockBehavior)[keyof typeof MockBehavior];
/** Runtime availability is explicit; a schema definition alone cannot authorize or execute work. */
export interface ComponentExecution {
    readonly handler: string | null;
    readonly effect: ComponentEffect;
    readonly timeoutMs: string;
    readonly maxAttempts: number;
    readonly retryErrors: readonly string[];
    readonly permissions: readonly string[];
    readonly capabilities: readonly string[];
    readonly mock: MockBehavior;
    readonly streaming: boolean;
    readonly cancellation: string;
    readonly persistence: string;
    readonly credits: string;
}
/** Declarative presentation hints support family-specific cards without coupling contracts to React. */
export interface ComponentDisplay {
    readonly title: string;
    readonly description: string;
    readonly example: string;
    readonly tags: readonly string[];
    readonly card: string;
    readonly accent: string;
    readonly compactFields: readonly string[];
    readonly inspectorFields: readonly string[];
}
/** Registry version is pinned in every saved node. Runtime and UI share this exact definition. */
export interface ComponentDefinition {
    readonly id: string;
    readonly version: string;
    readonly role: ComponentRole;
    readonly category: ComponentCategory;
    readonly display: ComponentDisplay;
    readonly configuration: ObjectSchema;
    readonly defaults: WorkflowObject;
    readonly ports: readonly ComponentPort[];
    readonly resources: readonly ComponentResourceSlot[];
    readonly execution: ComponentExecution | null;
    readonly resourceRole: string | null;
    /** Present only on external resource cards, distinct from account or editor workspaces. */
    readonly externalFamily?: ResourceFamily;
    /** Older versions requiring explicit migrations; no silent rewrite is permitted. */
    readonly migratesFrom: readonly string[];
}
