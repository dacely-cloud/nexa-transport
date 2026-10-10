// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignDefaults } from './DesignDefaults.js';
import { DesignKind, type DesignPaint, type DesignTextRun } from './DesignTypes.js';
import type { DesignSceneNode } from './DesignScene.js';

/** Vector masks use visible fill and border regions independently of paint color or image pixels. */
export class DesignMaskGeometry {
    static #cache: WeakMap<DesignSceneNode, DesignSceneNode> = new WeakMap();
    /** Produces immutable white coverage artwork while preserving glyphs, corners, paths and border dashes. */
    public static vector(node: DesignSceneNode): DesignSceneNode {
        const cached: DesignSceneNode | undefined = this.#cache.get(node);
        if (cached !== undefined) {
            return cached;
        }
        const white: DesignPaint = DesignDefaults.paint('#FFFFFF');
        const source: DesignSceneNode = {
            ...node,
            opacity: node.opacity > 0 ? 1 : 0,
            kind: node.kind === DesignKind.Image ? DesignKind.Rectangle : node.kind,
            image: null,
            style: {
                ...node.style,
                fills:
                    node.image !== null
                        ? [white]
                        : node.style.fills
                              .filter((paint: DesignPaint): boolean => paint.opacity > 0)
                              .map((): DesignPaint => white),
                stroke:
                    node.style.stroke === null || node.style.stroke.paint.opacity === 0
                        ? null
                        : { ...node.style.stroke, paint: white },
                shadows: [],
                blur: 0,
            },
            text:
                node.text === null
                    ? null
                    : {
                          ...node.text,
                          runs: node.text.runs.map((run: DesignTextRun): DesignTextRun => ({
                              ...run,
                              color: '#FFFFFF',
                          })),
                      },
        };
        this.#cache.set(node, source);
        return source;
    }
}
