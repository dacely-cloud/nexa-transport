// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { ResourceFamily, ResourceUse, type ResourceBinding } from './ResourceTypes.js';
import { ResourceBindingCodec } from './ResourceBindingCodec.js';
import {
    ComponentRole,
    ComponentCategory,
    PortDirection,
    type ComponentDefinition,
} from './ComponentTypes.js';
import { ComponentFactory } from './ComponentFactory.js';
import { CoreComponents } from './CoreComponents.js';
import { Schemas } from './Schemas.js';
import type { ObjectSchema } from './SchemaTypes.js';
import type { WorkflowNode } from './WorkflowTypes.js';

/** External environment resources remain first-class cards even before new connectors exist. */
export class ResourceComponents {
    public static readonly names: Readonly<Record<ResourceFamily, string>> = Object.freeze({
        workspace: 'Workspace',
        computer: 'Server or computer',
        application: 'Application',
        database: 'External data source',
        files: 'File collection',
        feed: 'Data feed',
        compute: 'Compute target',
    });
    public static readonly configuration: ObjectSchema = Schemas.object([
        Schemas.field('selection', {
            ...Schemas.object([
                Schemas.field('resourceId', Schemas.text),
                Schemas.field('connectionId', Schemas.text),
                Schemas.field('connectorId', Schemas.text),
                Schemas.field('connectorVersion', Schemas.text),
                Schemas.field('targetId', Schemas.text),
            ]),
            nullable: true,
        }),
        Schemas.field('operations', Schemas.list(Schemas.text, 32, 1)),
        Schemas.field('maxItems', { ...Schemas.number, whole: true, minimum: 1, maximum: 100_000 }),
        Schemas.field('maxBytes', Schemas.integer),
        Schemas.field('maxAgeMs', { ...Schemas.timestamp, nullable: true }),
    ]);
    public static definitions(): readonly ComponentDefinition[] {
        return Object.values(ResourceFamily).map((family: ResourceFamily): ComponentDefinition => ({
            id: `resource.${family}`,
            version: '1',
            role: ComponentRole.Resource,
            category: ComponentCategory.Resources,
            display: {
                ...CoreComponents.display(
                    this.names[family],
                    'Expose only a selected environment or dataset and named operations.',
                    family === ResourceFamily.Database
                        ? 'Attach only the monthly reports view to an analysis agent.'
                        : 'Bind this exact resource to a selected step.',
                    [family, 'resource', 'connection'],
                    `resource-${family}`,
                    ['selection'],
                ),
                accent: 'teal',
                inspectorFields: ['selection', 'operations', 'maxItems', 'maxBytes', 'maxAgeMs'],
            },
            configuration: this.configuration,
            defaults: {
                selection: null,
                operations: [family === ResourceFamily.Compute ? 'execute' : 'read'],
                maxItems: 100,
                maxBytes: '1048576',
                maxAgeMs: null,
            },
            ports: [
                ComponentFactory.resource(
                    'resource',
                    this.names[family],
                    `external.${family}`,
                    PortDirection.Output,
                ),
            ],
            resources: [],
            execution: null,
            resourceRole: `external.${family}`,
            externalFamily: family,
            migratesFrom: [],
        }));
    }
    /** One explicit attachment produces one consumer-specific binding, with no inherited access. */
    public static binding(
        node: WorkflowNode,
        family: ResourceFamily,
        consumerId: string,
        bindingId: string,
        use: ResourceUse,
    ): ResourceBinding {
        return ResourceBindingCodec.parse({
            version: 1,
            id: bindingId,
            alias: node.label,
            family,
            use,
            consumerId,
            selection: node.configuration['selection'],
            operations: node.configuration['operations'],
            limits: {
                maxItems: node.configuration['maxItems'],
                maxBytes: node.configuration['maxBytes'],
            },
            maxAgeMs: node.configuration['maxAgeMs'],
        });
    }
}
