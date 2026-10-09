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

/** Owner questions suspend only their dependent branches; they never grant approval authority. */
export class HumanComponents {
    /** Registers the initial bounded text, choice and boolean question contract. */
    public static definitions(): readonly ComponentDefinition[] {
        return [
            {
                id: 'human.ask',
                version: '1',
                role: ComponentRole.Step,
                category: ComponentCategory.Human,
                display: CoreComponents.display(
                    'Ask user',
                    'Wait for an answer from the run owner.',
                    'Ask the owner a question and continue the answered or expired branch.',
                    ['question', 'human', 'input'],
                    'text',
                    ['question', 'answerType'],
                ),
                configuration: Schemas.object([
                    Schemas.field('question', { ...Schemas.text, minLength: 1, maxLength: 8000 }),
                    Schemas.field('answerType', Schemas.choice(['text', 'choice', 'boolean'])),
                    Schemas.field(
                        'choices',
                        Schemas.list({ ...Schemas.text, minLength: 1, maxLength: 160 }, 20),
                    ),
                    Schemas.field('timeoutMs', { ...Schemas.text, minLength: 4, maxLength: 8 }),
                ]),
                defaults: {
                    question: 'What would you like to do next?',
                    answerType: 'text',
                    choices: [],
                    timeoutMs: '300000',
                },
                ports: [
                    ComponentFactory.flow('in', PortDirection.Input),
                    ComponentFactory.input(
                        'question',
                        'Question',
                        { ...Schemas.text, minLength: 1, maxLength: 8000 },
                        true,
                        'question',
                    ),
                    ComponentFactory.flow('answered', PortDirection.Output, 'Answered'),
                    ComponentFactory.flow('expired', PortDirection.Output, 'Expired'),
                    ComponentFactory.output('answer', 'Answer', Schemas.json),
                    ComponentFactory.output('response', 'Response details', Schemas.json),
                ],
                resources: [],
                resourceRole: null,
                migratesFrom: [],
                execution: ComponentFactory.execution(ComponentEffect.Pure),
            },
        ];
    }
}
