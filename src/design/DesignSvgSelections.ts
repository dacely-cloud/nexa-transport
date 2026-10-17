// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgSelection } from './DesignSvgTypes.js';
import type { DesignSceneNode } from './DesignScene.js';
import type { DesignBox } from './DesignTypes.js';

/** Font and preview discovery includes linked cells without copying source bodies or whole documents. */
export class DesignSvgSelections {
    /** A shared source is visited once even when many selected paints reference it. */
    public static nodes(selection: DesignSvgSelection): readonly DesignSceneNode[] {
        const result: DesignSceneNode[] = [];
        const visited: Set<DesignSvgSelection> = new Set();
        const pending: DesignSvgSelection[] = [selection];
        while (pending.length > 0) {
            const current: DesignSvgSelection | undefined = pending.pop();
            if (current === undefined || visited.has(current)) {
                continue;
            }
            visited.add(current);
            const ids: ReadonlySet<string> = new Set(
                current.boxes.map((box: DesignBox): string => box.id),
            );
            for (const node of current.scene.nodes) {
                if (ids.has(node.id)) {
                    result.push(node);
                }
            }
            if (result.length > 40000) {
                throw new Error('SVG pattern selection exceeds its scene budget.');
            }
            for (const pattern of current.patternSources ?? []) {
                pending.push(pattern.selection);
            }
        }
        return result;
    }
}
