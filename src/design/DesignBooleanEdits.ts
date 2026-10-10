// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignBooleanResize } from './DesignBooleanResize.js';
import { DesignSelectionTree } from './DesignSelectionTree.js';
import { DesignBooleanLayout } from './DesignBooleanLayout.js';
import { DesignBooleanKernel } from './DesignBooleanKernel.js';
import { DesignBooleanGeometry } from './DesignBooleanGeometry.js';
import { DesignBooleanTransforms as Transform } from './DesignBooleanTransforms.js';
import { DesignBooleanMode as Mode, type DesignBooleanOperand } from './DesignBooleanTypes.js';
import {
    DesignKind,
    type DesignDocument,
    type DesignNode,
    type DesignBox,
    type DesignPathCommand,
} from './DesignTypes.js';
import { DesignCodec } from './DesignCodec.js';
import { DesignEdits } from './DesignEdits.js';
import { DesignPaths } from './DesignPaths.js';
import { DesignEntityChanges } from './DesignEntityChanges.js';
import { DesignBooleanBounds } from './DesignBooleanBounds.js';
import type { DesignEditResult } from './DesignOperationTypes.js';
import type { DesignSelectionGeometry, DesignSelectionBounds } from './DesignSelectionTypes.js';

/** Resolves source-preserving Boolean geometry before publishing an atomic document change. */
export class DesignBooleanEdits {
    readonly #before: DesignDocument;
    readonly #edited: DesignDocument;
    readonly #nodes: Map<string, DesignNode>;
    readonly #previous: ReadonlyMap<string, DesignNode>;
    readonly #boxes: Map<string, DesignBox>;

    /** Owns one derivation's working records; neither input document is mutated. */
    public constructor(before: DesignDocument, edited: DesignDocument) {
        this.#before = before;
        this.#edited = edited;
        this.#nodes = new Map(
            edited.nodes.map((node: DesignNode): readonly [string, DesignNode] => [node.id, node]),
        );
        this.#previous = new Map(
            before.nodes.map((node: DesignNode): readonly [string, DesignNode] => [node.id, node]),
        );
        this.#boxes = this.#layout(edited);
    }

    /** Derived outlines and rebased source positions belong to the same undoable commit as the user's edit. */
    public static async derive(
        before: DesignDocument,
        edited: DesignDocument,
    ): Promise<DesignEditResult> {
        if (!edited.nodes.some((node: DesignNode): boolean => node.kind === DesignKind.Boolean)) {
            return { document: edited, changes: DesignEdits.diff(before, edited) };
        }
        return new DesignBooleanEdits(before, edited).#derive();
    }

    async #derive(): Promise<DesignEditResult> {
        const before: DesignDocument = this.#before;
        const edited: DesignDocument = this.#edited;
        const nodes: Map<string, DesignNode> = this.#nodes;
        const previous: ReadonlyMap<string, DesignNode> = this.#previous;
        const boxes: Map<string, DesignBox> = this.#boxes;
        const groups: readonly DesignNode[] = edited.nodes.filter(
            (node: DesignNode): boolean => node.kind === DesignKind.Boolean,
        );
        const ordered: readonly DesignNode[] = groups.toSorted(
            (a: DesignNode, b: DesignNode): number => this.#depth(b, nodes) - this.#depth(a, nodes),
        );
        let resized: boolean = false;
        for (const group of ordered) {
            const original: DesignNode | undefined = previous.get(group.id);
            if (
                original?.kind === DesignKind.Boolean &&
                (group.width !== original.width || group.height !== original.height)
            ) {
                for (const node of nodes.values()) {
                    this.#box(node.id);
                }
                const resize: DesignBooleanResize = new DesignBooleanResize(
                    nodes,
                    boxes,
                    this.#box(group.id),
                );
                for (const changed of resize.apply(group, original)) {
                    nodes.set(changed.id, changed);
                }
                resized = true;
            }
        }
        if (resized) {
            const working: DesignDocument = DesignCodec.document({
                ...edited,
                nodes: [...nodes.values()],
            });
            boxes.clear();
            for (const [id, box] of this.#layout(working)) {
                boxes.set(id, box);
            }
        }
        const dirty: Set<string> = new Set();
        for (const node of nodes.values()) {
            if (!DesignEntityChanges.equal(previous.get(node.id), node)) {
                let current: DesignNode | undefined = node;
                while (current !== undefined) {
                    if (current.kind === DesignKind.Boolean) {
                        dirty.add(current.id);
                    }
                    current = current.parentId === null ? undefined : nodes.get(current.parentId);
                }
            }
        }
        const oldBoxes: ReadonlyMap<string, DesignBox> = this.#layout(before);
        for (const group of ordered) {
            const owner: DesignBox | undefined = boxes.get(group.id);
            const oldOwner: DesignBox | undefined = oldBoxes.get(group.id);
            if (owner === undefined || oldOwner === undefined) {
                dirty.add(group.id);
                continue;
            }
            for (const id of group.children) {
                const box: DesignBox | undefined = boxes.get(id);
                const oldBox: DesignBox | undefined = oldBoxes.get(id);
                if (
                    box !== undefined &&
                    oldBox !== undefined &&
                    !DesignEntityChanges.equal(
                        Transform.local(box, owner),
                        Transform.local(oldBox, oldOwner),
                    )
                ) {
                    dirty.add(group.id);
                }
            }
        }
        for (const group of ordered) {
            if (!dirty.has(group.id)) {
                continue;
            }
            await this.#group(group.id);
        }
        const document: DesignDocument = DesignCodec.document({
            ...edited,
            nodes: [...nodes.values()],
        });
        return { document, changes: DesignEdits.diff(before, document) };
    }

    #layout(document: DesignDocument): Map<string, DesignBox> {
        return new DesignBooleanLayout(document).resolve();
    }

    #depth(node: DesignNode, nodes: ReadonlyMap<string, DesignNode>): number {
        let depth: number = 0;
        let parent: string | null = node.parentId;
        while (parent !== null) {
            depth += 1;
            parent = nodes.get(parent)?.parentId ?? null;
        }
        return depth;
    }

    #box(id: string): DesignBox {
        const nodes: ReadonlyMap<string, DesignNode> = this.#nodes;
        const boxes: Map<string, DesignBox> = this.#boxes;
        const existing: DesignBox | undefined = boxes.get(id);
        if (existing !== undefined) {
            return existing;
        }
        const node: DesignNode | undefined = nodes.get(id);
        if (node === undefined) {
            throw new Error('Missing Boolean source layer.');
        }
        const parent: DesignBox | null = node.parentId === null ? null : this.#box(node.parentId);
        const box: DesignBox = Transform.world(id, node, parent);
        boxes.set(id, box);
        return box;
    }

    async #group(id: string): Promise<void> {
        const nodes: Map<string, DesignNode> = this.#nodes;
        const boxes: Map<string, DesignBox> = this.#boxes;
        const group: DesignNode | undefined = nodes.get(id);
        if (group === undefined || group.booleanMode === undefined) {
            throw new Error('Missing Boolean operation.');
        }
        const owner: DesignBox = this.#box(id);
        const operands: DesignBooleanOperand[] = [];
        const bounds: DesignSelectionBounds[] = [];
        for (const childId of group.children) {
            const child: DesignNode | undefined = nodes.get(childId);
            if (child === undefined) {
                throw new Error('Missing Boolean source layer.');
            }
            bounds.push(...this.#bounds(child, nodes, owner));
            if (child.visible) {
                operands.push(await this.#operand(child, nodes, owner));
            }
        }
        const path: readonly DesignPathCommand[] =
            operands.length === 0
                ? []
                : await DesignBooleanKernel.combine(operands, group.booleanMode);
        if (bounds.length === 0) {
            nodes.set(id, { ...group, path });
            return;
        }
        const left: number = Math.min(
            ...bounds.map((box: DesignSelectionBounds): number => box.left),
        );
        const top: number = Math.min(
            ...bounds.map((box: DesignSelectionBounds): number => box.top),
        );
        const width: number = Math.max(
            0.01,
            Math.max(...bounds.map((box: DesignSelectionBounds): number => box.right)) - left,
        );
        const height: number = Math.max(
            0.01,
            Math.max(...bounds.map((box: DesignSelectionBounds): number => box.bottom)) - top,
        );
        const angle: number = (owner.rotation * Math.PI) / 180;
        const dx: number = left + width / 2 - owner.width / 2;
        const dy: number = top + height / 2 - owner.height / 2;
        const nextBox: DesignBox = {
            ...owner,
            x: owner.x + owner.width / 2 + dx * Math.cos(angle) - dy * Math.sin(angle) - width / 2,
            y:
                owner.y +
                owner.height / 2 +
                dx * Math.sin(angle) +
                dy * Math.cos(angle) -
                height / 2,
            width,
            height,
        };
        const parent: DesignBox | null = group.parentId === null ? null : this.#box(group.parentId);
        const geometry: DesignSelectionGeometry = Transform.local(nextBox, parent);
        nodes.set(id, {
            ...group,
            ...geometry,
            path: path.map((command: DesignPathCommand): DesignPathCommand => ({
                verb: command.verb,
                values: command.values.map(
                    (value: number, index: number): number =>
                        value - (index % 2 === 0 ? left : top),
                ),
            })),
        });
        for (const childId of group.children) {
            const child: DesignNode | undefined = nodes.get(childId);
            if (child === undefined) {
                throw new Error('Missing Boolean source layer.');
            }
            const local: DesignSelectionGeometry = Transform.local(this.#box(childId), owner);
            nodes.set(
                childId,
                DesignPaths.resize(child, {
                    ...local,
                    x: local.x - left,
                    y: local.y - top,
                    placement: DesignSelectionTree.fixed(child, true),
                }),
            );
        }
        boxes.set(id, nextBox);
    }

    async #operand(
        node: DesignNode,
        nodes: ReadonlyMap<string, DesignNode>,
        owner: DesignBox,
    ): Promise<DesignBooleanOperand> {
        const box: DesignBox = this.#box(node.id);
        if (node.kind !== DesignKind.Group) {
            return DesignBooleanGeometry.operand(node, box, owner);
        }
        if (node.layout.clip) {
            throw new Error('Release clipping before combining a group.');
        }
        const sources: DesignBooleanOperand[] = [];
        if (node.style.fills.length > 0 || node.style.stroke !== null) {
            sources.push(DesignBooleanGeometry.operand(node, box, owner));
        }
        for (const id of node.children) {
            const child: DesignNode | undefined = nodes.get(id);
            if (child === undefined) {
                throw new Error('Missing grouped Boolean source.');
            }
            if (child.visible) {
                sources.push(await this.#operand(child, nodes, owner));
            }
        }
        const path: readonly DesignPathCommand[] =
            sources.length === 0 ? [] : await DesignBooleanKernel.combine(sources, Mode.Union);
        return {
            outline: path
                .map(
                    (command: DesignPathCommand): string => command.verb + command.values.join(' '),
                )
                .join(' '),
            filled: true,
            stroke: null,
            matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        };
    }

    #bounds(
        node: DesignNode,
        nodes: ReadonlyMap<string, DesignNode>,
        owner: DesignBox,
    ): readonly DesignSelectionBounds[] {
        const output: DesignSelectionBounds[] = [];
        if (
            node.kind !== DesignKind.Group ||
            node.style.fills.length > 0 ||
            node.style.stroke !== null
        ) {
            output.push(DesignBooleanBounds.source(node, this.#box(node.id), owner));
        }
        if (node.kind === DesignKind.Group) {
            for (const id of node.children) {
                const child: DesignNode | undefined = nodes.get(id);
                if (child === undefined) {
                    throw new Error('Missing grouped Boolean source.');
                }
                output.push(...this.#bounds(child, nodes, owner));
            }
        }
        return output;
    }
}
