// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignValues as V } from './DesignValues.js';
import {
    DesignComponentAction,
    type DesignComponentRepeat as Repeat,
} from './DesignComponentTypes.js';
import {
    DesignFlow,
    DesignKind,
    DesignSizing,
    type DesignDocument,
    type DesignNode,
    type DesignPage,
} from './DesignTypes.js';
import { DesignComponentExpansion } from './DesignComponentExpansion.js';
import { DesignOperationKind, type DesignOperation } from './DesignOperationTypes.js';
import type { DesignSelectionPlan } from './DesignSelectionTypes.js';

/** Repeated artwork remains ordinary linked instances inside one editable auto-layout group. */
export class DesignComponentRepeat {
    /** One container plus at most 511 instances fits the existing 512-operation transaction. */
    public static parse(raw: unknown): Repeat {
        const value: Readonly<Record<string, unknown>> = V.fields(
            raw,
            ['action', 'componentId', 'x', 'y', 'rows', 'columns', 'gapX', 'gapY', 'center'],
            ['action', 'componentId', 'x', 'y', 'rows', 'columns', 'gapX', 'gapY'],
        );
        const rows: number = V.number(value['rows'], 1, 256, true);
        const columns: number = V.number(value['columns'], 1, 256, true);
        if (rows * columns > 511) {
            throw new Error(
                'Repeat exceeds the 512-operation transaction: use at most 511 linked instances.',
            );
        }
        return {
            action: V.choice(value['action'], [DesignComponentAction.Repeat]),
            componentId: V.id(value['componentId']),
            x: V.number(value['x']),
            y: V.number(value['y']),
            rows,
            columns,
            gapX: V.number(value['gapX'], 0, 10000),
            gapY: V.number(value['gapY'], 0, 10000),
            ...(Object.hasOwn(value, 'center') ? { center: V.boolean(value['center']) } : {}),
        };
    }

    /** Resolves source size once, retaining nested artwork and avoiding a layout solve per cell. */
    public static plan(
        document: DesignDocument,
        page: DesignPage,
        command: Repeat,
        template: DesignNode,
        identify: (sourceId: string) => string,
    ): DesignSelectionPlan {
        if (template.componentId === null) {
            throw new Error('Choose a linked component definition.');
        }
        DesignComponentExpansion.repeat(
            document,
            page,
            template.componentId,
            command.rows * command.columns,
        );
        const width: number = V.number(
            template.width * command.columns + command.gapX * (command.columns - 1),
            0,
            100000,
        );
        const height: number = V.number(
            template.height * command.rows + command.gapY * (command.rows - 1),
            0,
            100000,
        );
        if (template.width <= 0 || template.height <= 0) {
            throw new Error('Choose a component with positive resolved dimensions.');
        }
        const prefix: string = template.name.slice(0, 153);
        const base: DesignNode = DesignDefaults.node(
            identify('repeat'),
            DesignKind.Group,
            (prefix.isWellFormed() ? prefix : prefix.slice(0, -1)) + ' repeat',
        );
        const container: DesignNode = {
            ...base,
            x: V.number(command.x - (command.center === true ? width / 2 : 0)),
            y: V.number(command.y - (command.center === true ? height / 2 : 0)),
            width,
            height,
            placement: { ...base.placement, width: DesignSizing.Hug, height: DesignSizing.Hug },
            layout: {
                ...base.layout,
                flow: DesignFlow.Grid,
                columns: command.columns,
                gap: command.gapX,
                rowGap: command.gapY,
            },
        };
        const operations: DesignOperation[] = [
            {
                op: DesignOperationKind.Insert,
                node: container,
                parentId: null,
                pageId: page.id,
                index: page.roots.length,
            },
        ];
        for (let index: number = 0; index < command.rows * command.columns; index++) {
            operations.push({
                op: DesignOperationKind.Insert,
                node: {
                    ...template,
                    id: identify('repeat-cell-' + String(index)),
                    x: (index % command.columns) * (template.width + command.gapX),
                    y: Math.floor(index / command.columns) * (template.height + command.gapY),
                },
                parentId: container.id,
                pageId: page.id,
                index,
            });
        }
        return { operations, selection: [container.id] };
    }
}
