// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignFlex } from './DesignFlex.js';
import { DesignSizing, type DesignLayout } from './DesignTypes.js';
import type {
    DesignAllocatedMeasurer,
    DesignFlowItem,
    DesignLocalBox,
} from './DesignLayoutTypes.js';

/** Flex widths must reach nested Hug content before its height sizes the parent. */
export class DesignFlowMeasurement {
    public static atWidth(
        items: readonly DesignFlowItem[],
        layout: DesignLayout,
        width: number,
        height: number,
        measure: DesignAllocatedMeasurer,
    ): readonly DesignFlowItem[] {
        const boxes: readonly DesignLocalBox[] = DesignFlex.arrange(items, layout, width, height);
        const widths: ReadonlyMap<string, number> = new Map(
            boxes.map((box: DesignLocalBox): [string, number] => [box.id, box.width]),
        );
        return items.map((item: DesignFlowItem): DesignFlowItem =>
            item.node.placement.height !== DesignSizing.Hug
                ? item
                : {
                      ...item,
                      height: measure(item.node, widths.get(item.node.id) ?? item.width).height,
                  },
        );
    }
}
