// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignComponentAction as Action,
    type DesignComponentCommand,
    type DesignVariantCommand,
} from './DesignComponentTypes.js';
import { DesignVariantCodec } from './DesignVariantCodec.js';
import { DesignValues as V } from './DesignValues.js';

const ACTIONS: ReadonlySet<Action> = new Set([
    Action.CombineVariants,
    Action.AddVariant,
    Action.SetVariant,
    Action.EditVariant,
    Action.VariantProperties,
    Action.ReleaseVariants,
]);

/** Variant commands retain the existing native component endpoint and transaction envelope. */
export class DesignVariantCommands {
    /** Narrows both command parsing and shared planning without widening unrelated actions. */
    public static action(action: Action): action is DesignVariantCommand['action'] {
        return ACTIONS.has(action);
    }
    /** Typed command discrimination is shared by native tools and browser planners. */
    public static is(command: DesignComponentCommand): command is DesignVariantCommand {
        return this.action(command.action);
    }
    /** Each action rejects extra fields and validates values at the trust boundary. */
    public static parse(raw: unknown): DesignVariantCommand {
        const header: Readonly<Record<string, unknown>> = V.fields(
            raw,
            [
                'action',
                'selection',
                'name',
                'property',
                'componentSetId',
                'componentId',
                'instanceId',
                'values',
                'properties',
            ],
            ['action'],
        );
        const action: Action = V.choice(header['action'], [...ACTIONS]);
        if (action === Action.CombineVariants) {
            const value: Readonly<Record<string, unknown>> = V.record(raw, [
                'action',
                'selection',
                'name',
                'property',
            ]);
            return {
                action,
                selection: V.list(value['selection'], 128, (id: unknown): string => V.id(id)),
                name: V.text(value['name']),
                property: DesignVariantCodec.label(value['property']),
            };
        }
        if (action === Action.AddVariant) {
            const value: Readonly<Record<string, unknown>> = V.record(raw, [
                'action',
                'componentSetId',
                'componentId',
            ]);
            return {
                action,
                componentSetId: V.id(value['componentSetId']),
                componentId: V.optionalId(value['componentId']),
            };
        }
        if (action === Action.SetVariant) {
            const value: Readonly<Record<string, unknown>> = V.record(raw, [
                'action',
                'instanceId',
                'values',
            ]);
            return {
                action,
                instanceId: V.id(value['instanceId']),
                values: DesignVariantCodec.values(value['values']),
            };
        }
        if (action === Action.EditVariant) {
            const value: Readonly<Record<string, unknown>> = V.record(raw, [
                'action',
                'componentId',
                'values',
            ]);
            return {
                action,
                componentId: V.id(value['componentId']),
                values: DesignVariantCodec.values(value['values']),
            };
        }
        if (action === Action.VariantProperties) {
            const value: Readonly<Record<string, unknown>> = V.record(raw, [
                'action',
                'componentSetId',
                'properties',
            ]);
            return {
                action,
                componentSetId: V.id(value['componentSetId']),
                properties: DesignVariantCodec.properties(value['properties']),
            };
        }
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'action',
            'componentSetId',
        ]);
        return { action: Action.ReleaseVariants, componentSetId: V.id(value['componentSetId']) };
    }
}
