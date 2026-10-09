// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ComponentCategory,
    ComponentEffect,
    ComponentRole,
    PortDirection,
    type ComponentDefinition,
} from './ComponentTypes.js';
import { ComponentFactory } from './ComponentFactory.js';
import { CoreComponents } from './CoreComponents.js';
import { Schemas } from './Schemas.js';

/** An explicit owner decision gates the exact recorded proposal. */
export class ApprovalComponents {
    /** Owner review is a first-class component with its own in-app notification setting. */
    public static definitions(): readonly ComponentDefinition[] {
        return [
            {
                id: 'human.approval',
                version: '1',
                role: ComponentRole.Step,
                category: ComponentCategory.Human,
                display: CoreComponents.display(
                    'Request approval',
                    'Review an exact proposal before continuing.',
                    'The run owner can approve, reject or request changes. Only approval exposes the approved proposal.',
                    ['approval', 'review', 'human'],
                    'approval',
                    ['action', 'destination', 'content'],
                ),
                configuration: Schemas.object([
                    Schemas.field(
                        'action',
                        { ...Schemas.text, minLength: 1, maxLength: 240 },
                        false,
                    ),
                    Schemas.field('destination', {
                        ...Schemas.text,
                        minLength: 1,
                        maxLength: 2000,
                    }),
                    Schemas.field('content', Schemas.json, false),
                    Schemas.field('reviewer', Schemas.choice(['owner'])),
                    Schemas.field('notification', Schemas.choice(['in-app'])),
                    Schemas.field('timeoutMs', { ...Schemas.text, minLength: 4, maxLength: 8 }),
                ]),
                defaults: {
                    action: 'Review proposed result',
                    destination: 'Run owner',
                    content: { text: 'Proposed content' },
                    reviewer: 'owner',
                    notification: 'in-app',
                    timeoutMs: '300000',
                },
                ports: [
                    ComponentFactory.flow('in', PortDirection.Input),
                    ComponentFactory.input(
                        'action',
                        'Proposed action',
                        Schemas.text,
                        true,
                        'action',
                    ),
                    ComponentFactory.input(
                        'destination',
                        'Exact destination',
                        Schemas.text,
                        true,
                        'destination',
                    ),
                    ComponentFactory.input(
                        'content',
                        'Exact content',
                        Schemas.json,
                        true,
                        'content',
                    ),
                    ComponentFactory.flow('approved', PortDirection.Output, 'Approved'),
                    ComponentFactory.flow('rejected', PortDirection.Output, 'Rejected'),
                    ComponentFactory.flow(
                        'changes_requested',
                        PortDirection.Output,
                        'Changes requested',
                    ),
                    ComponentFactory.flow('expired', PortDirection.Output, 'Expired'),
                    ComponentFactory.flow('cancelled', PortDirection.Output, 'Cancelled'),
                    ComponentFactory.output('proposal', 'Approved proposal', Schemas.json),
                    ComponentFactory.output('response', 'Decision details', Schemas.json),
                ],
                resources: [],
                resourceRole: null,
                migratesFrom: [],
                execution: ComponentFactory.execution(ComponentEffect.Pure),
            },
        ];
    }
}
