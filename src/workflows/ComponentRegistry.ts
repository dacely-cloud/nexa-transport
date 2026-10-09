// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentRole,
    PortDirection,
    IncomingPolicy,
    type ComponentDefinition,
    type ComponentPort,
    type ComponentResourceSlot,
} from './ComponentTypes.js';
import { ApprovalComponents } from './ApprovalComponents.js';
import { HumanComponents } from './HumanComponents.js';
import { MappingComponents } from './MappingComponents.js';
import { DataComponents } from './DataComponents.js';
import { TimeComponents } from './TimeComponents.js';
import { TimedComponents } from './TimedComponents.js';
import { CoreComponents } from './CoreComponents.js';
import { InferenceComponents } from './InferenceComponents.js';
import { ImageComponents } from './ImageComponents.js';
import { TerminalComponents } from './TerminalComponents.js';
import { AgentComponents } from './AgentComponents.js';
import { ResourceComponents } from './ResourceComponents.js';
import { WorkflowInput } from './WorkflowInput.js';
import { WorkflowJson } from './WorkflowJson.js';
import { WorkflowEdgeKind, type WorkflowNode } from './WorkflowTypes.js';
import { Schemas } from './Schemas.js';
import { SchemaCompatibility } from './SchemaCompatibility.js';
import { SchemaKind, type ValueSchema, type SchemaField } from './SchemaTypes.js';

/** Exact-version catalog shared by the planner, editor, validator and future executor. */
export class ComponentRegistry {
    readonly #definitions: ReadonlyMap<string, ComponentDefinition>;
    static #builtin: ComponentRegistry | null = null;
    public constructor(definitions: readonly ComponentDefinition[]) {
        const entries: Map<string, ComponentDefinition> = new Map();
        for (const definition of definitions) {
            WorkflowInput.id(definition.id);
            WorkflowInput.id(definition.version);
            const key: string = this.#key(definition.id, definition.version);
            if (entries.has(key)) {
                throw new Error(`Duplicate component version: ${key}`);
            }
            ComponentRegistry.#check(definition);
            entries.set(key, ComponentRegistry.#snapshot(definition));
        }
        this.#definitions = entries;
    }
    public static builtin(): ComponentRegistry {
        this.#builtin ??= new ComponentRegistry([
            ...CoreComponents.definitions(),
            TimedComponents.definition(),
            ...TimeComponents.definitions(),
            ...HumanComponents.definitions(),
            ...ApprovalComponents.definitions(),
            ...DataComponents.definitions(),
            MappingComponents.definition(),
            ...AgentComponents.definitions(),
            ...TerminalComponents.definitions(),
            ...InferenceComponents.definitions(),
            ...ImageComponents.definitions(),
            ...ResourceComponents.definitions(),
        ]);
        return this.#builtin;
    }
    public get(id: string, version: string): ComponentDefinition | null {
        return this.#definitions.get(this.#key(id, version)) ?? null;
    }
    public all(): readonly ComponentDefinition[] {
        return Object.freeze([...this.#definitions.values()]);
    }
    /** Unknown versions cannot silently inherit the current component's semantics. */
    public create(id: string, version: string, nodeId: string): WorkflowNode {
        const definition: ComponentDefinition | null = this.get(id, version);
        if (definition === null) {
            throw new Error('Component version is unavailable');
        }
        return Object.freeze({
            id: WorkflowInput.id(nodeId),
            component: id,
            componentVersion: version,
            label: definition.display.title,
            configuration: definition.defaults,
            resources: Object.freeze([]),
        });
    }
    #key(id: string, version: string): string {
        return JSON.stringify([id, version]);
    }
    static #check(definition: ComponentDefinition): void {
        WorkflowInput.unique(definition.ports.map((port: ComponentPort): string => port.id));
        if ((definition.role === ComponentRole.Resource) !== (definition.resourceRole !== null)) {
            throw new Error('Resource components require an explicit resource role');
        }
        const executable: boolean =
            definition.role === ComponentRole.Step || definition.role === ComponentRole.Trigger;
        if (executable !== (definition.execution !== null)) {
            throw new Error('Execution contracts belong only to triggers and steps');
        }
        if (definition.role === ComponentRole.Visual && definition.ports.length !== 0) {
            throw new Error('Visual elements cannot carry execution, data or resource ports');
        }
        for (const port of definition.ports) {
            WorkflowInput.id(port.id);
            if (
                !Number.isInteger(port.maxConnections) ||
                port.maxConnections < 1 ||
                port.maxConnections > 1_000
            ) {
                throw new Error('Invalid component port connection limit');
            }
            if (
                port.direction === PortDirection.Input &&
                port.incoming === IncomingPolicy.Reject &&
                port.maxConnections !== 1
            ) {
                throw new Error('Multiple inputs need an explicit aggregation policy');
            }
            if (
                (port.kind === WorkflowEdgeKind.Flow) !== (port.schema.kind === SchemaKind.Flow) ||
                (port.kind === WorkflowEdgeKind.Resource) !==
                    (port.schema.kind === SchemaKind.Resource)
            ) {
                throw new Error('Port kind and schema disagree');
            }
            if (
                definition.role === ComponentRole.Resource &&
                port.kind !== WorkflowEdgeKind.Resource
            ) {
                throw new Error('Resource components configure work rather than schedule it');
            }
            if (
                definition.role === ComponentRole.Trigger &&
                port.direction === PortDirection.Input &&
                port.kind === WorkflowEdgeKind.Flow
            ) {
                throw new Error('A trigger cannot depend on incoming execution flow');
            }
            if (
                port.literalField !== null &&
                (port.kind !== WorkflowEdgeKind.Data ||
                    port.direction !== PortDirection.Input ||
                    !definition.configuration.fields.some(
                        (field: SchemaField): boolean => field.name === port.literalField,
                    ))
            ) {
                throw new Error('Literal inputs must name a declared data configuration field');
            }
            if (port.literalField !== null) {
                const field: SchemaField | undefined = definition.configuration.fields.find(
                    (entry: SchemaField): boolean => entry.name === port.literalField,
                );
                if (
                    field === undefined ||
                    !SchemaCompatibility.accepts(port.schema, field.schema)
                ) {
                    throw new Error('Literal field schema must satisfy the input port schema');
                }
            }
        }
    }
    static #snapshot(definition: ComponentDefinition): ComponentDefinition {
        const configuration: ValueSchema = Schemas.freeze(definition.configuration);
        if (configuration.kind !== SchemaKind.Object) {
            throw new Error('Component configuration must be an object');
        }
        return Object.freeze({
            ...definition,
            configuration,
            defaults: WorkflowJson.object(definition.defaults),
            display: Object.freeze({
                ...definition.display,
                tags: Object.freeze([...definition.display.tags]),
                compactFields: Object.freeze([...definition.display.compactFields]),
                inspectorFields: Object.freeze([...definition.display.inspectorFields]),
            }),
            ports: Object.freeze(
                definition.ports.map((port: ComponentPort): ComponentPort =>
                    Object.freeze({
                        ...port,
                        schema: Schemas.freeze(port.schema),
                        ...(port.modelCapabilities === undefined
                            ? {}
                            : { modelCapabilities: Object.freeze([...port.modelCapabilities]) }),
                    }),
                ),
            ),
            resources: Object.freeze(
                definition.resources.map((slot: ComponentResourceSlot): ComponentResourceSlot =>
                    Object.freeze({ ...slot, uses: Object.freeze([...slot.uses]) }),
                ),
            ),
            execution:
                definition.execution === null
                    ? null
                    : Object.freeze({
                          ...definition.execution,
                          permissions: Object.freeze([...definition.execution.permissions]),
                          capabilities: Object.freeze([...definition.execution.capabilities]),
                          retryErrors: Object.freeze([...definition.execution.retryErrors]),
                      }),
            migratesFrom: Object.freeze([...definition.migratesFrom]),
        });
    }
}
