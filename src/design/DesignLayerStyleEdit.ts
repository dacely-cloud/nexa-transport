// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import {
    DesignKind,
    type DesignNode,
    type DesignStyle,
    type DesignOverride,
} from './DesignTypes.js';

/** A direct style edit enforces page and locking rules and isolates an instance-root override. */
export class DesignLayerStyleEdit {
    /** Only the transformed style changes; component definitions and other instance override fields survive. */
    public static apply(
        authority: DesignLayerAuthority,
        id: string,
        pageId: string,
        edit: (style: DesignStyle) => DesignStyle,
    ): DesignNode {
        const node: DesignNode = authority.node(id, pageId);
        const component: DesignNode | undefined =
            node.kind === DesignKind.Instance
                ? authority.nodes.get(node.componentId ?? '')
                : undefined;
        const override: DesignOverride | undefined =
            component === undefined
                ? undefined
                : node.overrides.find(
                      (entry: DesignOverride): boolean => entry.nodeId === component.id,
                  );
        const style: DesignStyle =
            component === undefined ? node.style : (override?.style ?? component.style);
        const next: DesignStyle = edit(style);
        if (component === undefined) {
            return { ...node, style: next };
        }
        const replaced: DesignOverride =
            override === undefined
                ? { nodeId: component.id, name: null, text: null, style: next, visible: null }
                : { ...override, style: next };
        return {
            ...node,
            overrides:
                override === undefined
                    ? [...node.overrides, replaced]
                    : node.overrides.map((entry: DesignOverride): DesignOverride =>
                          entry.nodeId === component.id ? replaced : entry,
                      ),
        };
    }
}
