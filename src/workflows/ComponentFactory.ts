// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentEffect,
    MockBehavior,
    IncomingPolicy,
    PortDirection,
    PortCardinality,
    type ComponentExecution,
    type ComponentPort,
} from './ComponentTypes.js';
import { WorkflowEdgeKind } from './WorkflowTypes.js';
import type { ValueSchema } from './SchemaTypes.js';
import { Schemas } from './Schemas.js';

/** Shared conservative defaults. Families override explicit behavior rather than duplicating contracts. */
export class ComponentFactory {
    public static input(
        id: string,
        label: string,
        schema: ValueSchema,
        required: boolean = true,
        literalField: string | null = null,
    ): ComponentPort {
        return {
            id,
            label,
            direction: PortDirection.Input,
            kind: WorkflowEdgeKind.Data,
            schema,
            cardinality: PortCardinality.Item,
            required,
            maxConnections: 1,
            incoming: IncomingPolicy.Reject,
            literalField,
        };
    }
    public static output(id: string, label: string, schema: ValueSchema): ComponentPort {
        return {
            ...this.input(id, label, schema, false),
            direction: PortDirection.Output,
            maxConnections: 1_000,
        };
    }
    public static flow(
        id: string,
        direction: PortDirection,
        label: string = 'Continue',
    ): ComponentPort {
        return {
            ...this.input(id, label, Schemas.flow),
            direction,
            kind: WorkflowEdgeKind.Flow,
            required: direction === PortDirection.Input,
            maxConnections: direction === PortDirection.Input ? 1 : 1_000,
        };
    }
    public static resource(
        id: string,
        label: string,
        role: string,
        direction: PortDirection,
        required: boolean = false,
    ): ComponentPort {
        return {
            ...this.input(id, label, Schemas.resource(role), required),
            direction,
            kind: WorkflowEdgeKind.Resource,
            maxConnections: direction === PortDirection.Input ? 32 : 1_000,
            incoming: IncomingPolicy.Collect,
        };
    }
    public static execution(
        effect: ComponentEffect,
        capabilities: readonly string[] = [],
    ): ComponentExecution {
        return {
            handler: null,
            effect,
            timeoutMs: '60000',
            maxAttempts: 1,
            retryErrors: [],
            permissions: [],
            capabilities,
            mock:
                effect === ComponentEffect.Pure ? MockBehavior.Deterministic : MockBehavior.Fixture,
            streaming: false,
            cancellation: 'Stop dependent work; preserve completed effects and recorded usage.',
            persistence:
                'Each invocation requires durable identity and status; graph position has no runtime meaning.',
            credits:
                effect === ComponentEffect.Inference
                    ? 'Record actual funded-provider usage against the invocation.'
                    : 'No model usage is implied by this definition.',
        };
    }
}
