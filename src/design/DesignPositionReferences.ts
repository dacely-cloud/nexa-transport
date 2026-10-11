// SPDX-License-Identifier: Apache-2.0

import { DesignConstraint, type DesignNode } from './DesignTypes.js';
import type { DesignSize } from './DesignLayoutTypes.js';

/** Optional baselines stay within the normal placement record and legacy defaults remain usable. */
export interface DesignConstraintReferences {
    readonly referenceWidth?: number;
    readonly referenceHeight?: number;
}

/** Rebase positive dimensions while retaining the original negative stretch margin on a collapsed axis. */
export class DesignPositionReferences {
    /** Captures positive parent dimensions without reopening collapsed stretched content. */
    public static capture(
        node: DesignNode,
        parent: DesignNode | null,
        before: DesignSize | null,
        after: DesignSize | null,
        size: DesignSize,
    ): DesignConstraintReferences {
        if (parent === null || before === null || after === null) {
            return {};
        }
        const width: number | null = this.#axis(
            size.width,
            node.placement.horizontal,
            node.placement.referenceWidth ?? parent.placement.contentReferenceWidth ?? parent.width,
            before.width,
            after.width,
        );
        const height: number | null = this.#axis(
            size.height,
            node.placement.vertical,
            node.placement.referenceHeight ??
                parent.placement.contentReferenceHeight ??
                parent.height,
            before.height,
            after.height,
        );
        return {
            ...(width === null ? {} : { referenceWidth: width }),
            ...(height === null ? {} : { referenceHeight: height }),
        };
    }
    static #axis(
        size: number,
        pin: DesignConstraint,
        reference: number,
        before: number,
        after: number,
    ): number | null {
        if (after <= 0) {
            return null;
        }
        if (size > 0) {
            return after;
        }
        return pin === DesignConstraint.Stretch ? reference + after - before : null;
    }
}
