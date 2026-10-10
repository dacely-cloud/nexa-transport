// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignKind, type DesignNode } from './DesignTypes.js';
import { DesignMaskMode } from './DesignMaskTypes.js';
import { DesignSelectionTree } from './DesignSelectionTree.js';
import type { DesignSelectionContext } from './DesignSelectionContext.js';
import type { DesignSelectionPlan } from './DesignSelectionTypes.js';
import { DesignOperationKind as Op, type DesignOperation } from './DesignOperationTypes.js';

/** Non-destructive masking retains source identities, transforms and artwork. */
export class DesignMaskSelection {
    /** Uses the bottom selected sibling as the mask source; all remaining siblings become content. */
    public static create(context: DesignSelectionContext, id: string): DesignSelectionPlan {
        const source: DesignNode | undefined = context.roots[0];
        if (source === undefined || context.roots.length < 2) {
            throw new Error('Select a mask source and artwork in the same container.');
        }
        const plan: DesignSelectionPlan = DesignSelectionTree.group(context, id);
        return {
            ...plan,
            operations: [
                ...plan.operations,
                {
                    op: Op.Update,
                    id,
                    changes: {
                        kind: DesignKind.Mask,
                        name: 'Mask group',
                        mask: { mode: DesignMaskMode.Alpha, sourceId: source.id },
                    },
                },
            ],
        };
    }
    /** Releases masking without discarding either the source or the content forest. */
    public static release(context: DesignSelectionContext): DesignSelectionPlan {
        if (context.roots.some((node: DesignNode): boolean => node.kind !== DesignKind.Mask)) {
            throw new Error('Select mask groups to release.');
        }
        return {
            selection: context.roots.map((node: DesignNode): string => node.id),
            operations: context.roots.map((node: DesignNode): DesignOperation => ({
                op: Op.Update,
                id: node.id,
                changes: { kind: DesignKind.Group, mask: null },
            })),
        };
    }
}
