// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignFlow, type DesignNode, type DesignDocument, type DesignBox } from './DesignTypes.js';
import type { DesignFlowReorder } from './DesignOperationTypes.js';
import { DesignSelectionContext } from './DesignSelectionContext.js';
import type { DesignSelectionPoint, DesignSelectionGeometry } from './DesignSelectionTypes.js';
import type { DesignTextMeasurer } from './DesignLayoutTypes.js';
import { DesignTextMetrics } from './DesignTextMetrics.js';

interface Candidate {
    readonly id: string;
    readonly cross: number;
    readonly main: number;
}

/** Selected automatic children reorder without changing their authored geometry or leaving their parent. */
export class DesignFlowOrdering {
    /** Browser and native keyboard callers use the same exact-font selection scene. */
    public static keyboard(
        document: DesignDocument,
        pageId: string,
        selection: readonly string[],
        delta: DesignSelectionPoint,
        count: number = 1,
        measurer: DesignTextMeasurer = new DesignTextMetrics(),
    ): readonly DesignFlowReorder[] {
        return this.step(
            new DesignSelectionContext(document, pageId, selection, measurer),
            delta,
            count,
        );
    }
    /** Validates all requested slots before capturing any changed sibling list. */
    public static capture(
        context: DesignSelectionContext,
        reorders: readonly DesignFlowReorder[],
    ): ReadonlyMap<string, DesignNode> {
        const roots: ReadonlySet<string> = new Set(
            context.roots.map((node: DesignNode): string => node.id),
        );
        const seen: Set<string> = new Set();
        const parents: Map<string, DesignNode> = new Map();
        for (const reorder of reorders) {
            const node: DesignNode = context.node(reorder.id);
            if (
                !roots.has(node.id) ||
                !context.flowing(node.id) ||
                !context.boxes.has(node.id) ||
                node.parentId === null
            ) {
                throw new Error(
                    'Reorder requires a visible selected flow root in its existing parent.',
                );
            }
            if (seen.has(node.id)) {
                throw new Error('Reorder IDs must be distinct.');
            }
            seen.add(node.id);
            const parent: DesignNode = parents.get(node.parentId) ?? context.node(node.parentId);
            if (reorder.index >= parent.children.length) {
                throw new Error('Reorder index is outside the parent.');
            }
            const children: string[] = [...parent.children];
            const previous: number = children.indexOf(node.id);
            if (previous < 0) {
                throw new Error('Missing flow child ownership.');
            }
            children.splice(previous, 1);
            children.splice(reorder.index, 0, node.id);
            parents.set(parent.id, { ...parent, children });
        }
        return new Map(
            [...parents].filter(([id, parent]: [string, DesignNode]): boolean =>
                parent.children.some(
                    (child: string, index: number): boolean =>
                        child !== context.node(id).children[index],
                ),
            ),
        );
    }

    /** Arrow directions use visible parent axes; wrapped rows and grids find the nearest visible cells. */
    public static step(
        context: DesignSelectionContext,
        delta: DesignSelectionPoint,
        count: number = 1,
    ): readonly DesignFlowReorder[] {
        if (!Number.isInteger(count) || count < 1 || count > 10) {
            throw new Error('Keyboard reorder count must be 1 to 10.');
        }
        const groups: Map<string, Set<string>> = new Map();
        for (const node of context.roots) {
            if (
                node.parentId === null ||
                !context.flowing(node.id) ||
                !context.boxes.has(node.id)
            ) {
                continue;
            }
            const group: Set<string> = groups.get(node.parentId) ?? new Set();
            group.add(node.id);
            groups.set(node.parentId, group);
        }
        const result: DesignFlowReorder[] = [];
        for (const [parentId, selected] of groups) {
            const parent: DesignNode = context.node(parentId);
            const box: DesignBox = context.box(parentId);
            const angle: number = (-box.rotation * Math.PI) / 180;
            const x: number = delta.x * Math.cos(angle) - delta.y * Math.sin(angle);
            const y: number = delta.x * Math.sin(angle) + delta.y * Math.cos(angle);
            if (x === 0 && y === 0) {
                continue;
            }
            const horizontal: boolean = Math.abs(x) >= Math.abs(y);
            if (
                !parent.layout.wrap &&
                parent.layout.flow !== DesignFlow.Grid &&
                horizontal !== (parent.layout.flow === DesignFlow.Row)
            ) {
                continue;
            }
            const forward: boolean = (horizontal ? x : y) > 0;
            const ordered: readonly string[] = parent.children.filter((id: string): boolean =>
                selected.has(id),
            );
            const local: readonly DesignSelectionGeometry[] = ordered.map(
                (id: string): DesignSelectionGeometry => context.local(context.box(id), parentId),
            );
            const low: number = Math.min(
                ...local.map((value: DesignSelectionGeometry): number =>
                    horizontal ? value.x : value.y,
                ),
            );
            const high: number = Math.max(
                ...local.map((value: DesignSelectionGeometry): number =>
                    horizontal ? value.x + value.width : value.y + value.height,
                ),
            );
            const crossLow: number = Math.min(
                ...local.map((value: DesignSelectionGeometry): number =>
                    horizontal ? value.y : value.x,
                ),
            );
            const crossHigh: number = Math.max(
                ...local.map((value: DesignSelectionGeometry): number =>
                    horizontal ? value.y + value.height : value.x + value.width,
                ),
            );
            const candidates: Candidate[] = [];
            for (const id of parent.children) {
                if (selected.has(id) || !context.flowing(id) || !context.boxes.has(id)) {
                    continue;
                }
                const peer: DesignSelectionGeometry = context.local(context.box(id), parentId);
                const start: number = horizontal ? peer.x : peer.y;
                const end: number = start + (horizontal ? peer.width : peer.height);
                const main: number = forward ? (start + end) / 2 - high : low - (start + end) / 2;
                if (main < -1e-8) {
                    continue;
                }
                const crossStart: number = horizontal ? peer.y : peer.x;
                const crossEnd: number = crossStart + (horizontal ? peer.height : peer.width);
                const cross: number = Math.max(crossStart - crossHigh, crossLow - crossEnd, 0);
                candidates.push({ id, cross, main });
            }
            candidates.sort(
                (a: Candidate, b: Candidate): number => a.cross - b.cross || a.main - b.main,
            );
            const target: Candidate | undefined =
                candidates[Math.min(count, candidates.length) - 1];
            if (target === undefined) {
                continue;
            }
            const remaining: readonly string[] = parent.children.filter(
                (id: string): boolean => !selected.has(id),
            );
            const index: number = remaining.indexOf(target.id) + (forward ? 1 : 0);
            const desired: readonly string[] = [
                ...remaining.slice(0, index),
                ...ordered,
                ...remaining.slice(index),
            ];
            if (
                desired.every((id: string, index: number): boolean => id === parent.children[index])
            ) {
                continue;
            }
            const anchor: string | undefined = remaining[index];
            const current: string[] = [...parent.children];
            for (const id of ordered) {
                const previous: number = current.indexOf(id);
                current.splice(previous, 1);
                const slot: number =
                    anchor === undefined ? current.length : current.indexOf(anchor);
                current.splice(slot, 0, id);
                if (previous !== slot) {
                    result.push({ id, index: slot });
                }
            }
        }
        return result;
    }
}
