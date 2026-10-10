// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignKind,
    DesignFlow,
    DesignPaintKind,
    type DesignNode,
    type DesignBox,
    type DesignPathCommand,
} from './DesignTypes.js';
import { DesignBooleanGeometry } from './DesignBooleanGeometry.js';
import { DesignPaths, type DesignPathGeometry } from './DesignPaths.js';
import { DesignSelectionTree } from './DesignSelectionTree.js';
import { DesignDefaults } from './DesignDefaults.js';
import { DesignBooleanBounds } from './DesignBooleanBounds.js';
import { DesignBooleanTransforms } from './DesignBooleanTransforms.js';
import type { DesignSelectionBounds } from './DesignSelectionTypes.js';

/** Resizing a Boolean scales its editable source forest; sheared outlines become editable curves with the same identities. */
export class DesignBooleanResize {
    readonly #nodes: ReadonlyMap<string, DesignNode>;
    readonly #boxes: ReadonlyMap<string, DesignBox>;
    readonly #owner: DesignBox;
    #changes: Map<string, DesignNode> = new Map();

    /** Owns temporary resized records while retaining immutable source geometry. */
    public constructor(
        nodes: ReadonlyMap<string, DesignNode>,
        boxes: ReadonlyMap<string, DesignBox>,
        owner: DesignBox,
    ) {
        this.#nodes = nodes;
        this.#boxes = boxes;
        this.#owner = owner;
    }

    /** Fits the requested bounds while retaining source border weights, paints and effects. */
    public apply(group: DesignNode, previous: DesignNode): readonly DesignNode[] {
        let x: number = group.width / previous.width;
        let y: number = group.height / previous.height;
        for (let attempt: number = 0; attempt < 32; attempt++) {
            this.#changes = new Map();
            for (const id of group.children) {
                this.#source(id, this.#owner, x, y, 0, 0);
            }
            const bounds: DesignSelectionBounds[] = [];
            for (const id of group.children) {
                bounds.push(...this.#bounds(id, this.#owner));
            }
            if (bounds.length === 0) {
                return [...this.#changes.values()];
            }
            const width: number =
                Math.max(...bounds.map((value: DesignSelectionBounds): number => value.right)) -
                Math.min(...bounds.map((value: DesignSelectionBounds): number => value.left));
            const height: number =
                Math.max(...bounds.map((value: DesignSelectionBounds): number => value.bottom)) -
                Math.min(...bounds.map((value: DesignSelectionBounds): number => value.top));
            if (Math.abs(width - group.width) < 0.001 && Math.abs(height - group.height) < 0.001) {
                return this.#fitted(group, bounds);
            }
            x *= group.width / Math.max(0.01, width);
            y *= group.height / Math.max(0.01, height);
        }
        throw new Error(
            'The requested size is too small for the source borders. Reduce the border width or choose a larger size.',
        );
    }

    #fitted(group: DesignNode, bounds: readonly DesignSelectionBounds[]): readonly DesignNode[] {
        const left: number = Math.min(
            ...bounds.map((value: DesignSelectionBounds): number => value.left),
        );
        const top: number = Math.min(
            ...bounds.map((value: DesignSelectionBounds): number => value.top),
        );
        for (const id of group.children) {
            const child: DesignNode | undefined = this.#changes.get(id);
            if (child === undefined) {
                throw new Error('Missing resized Boolean source.');
            }
            this.#changes.set(id, { ...child, x: child.x - left, y: child.y - top });
        }
        return [...this.#changes.values()];
    }

    #bounds(id: string, parent: DesignBox): readonly DesignSelectionBounds[] {
        const output: DesignSelectionBounds[] = [];
        const node: DesignNode | undefined = this.#changes.get(id);
        if (node === undefined) {
            throw new Error('Missing resized Boolean source.');
        }
        const box: DesignBox = DesignBooleanTransforms.world(id, node, parent);
        if (
            node.kind !== DesignKind.Group ||
            node.style.fills.length > 0 ||
            node.style.stroke !== null
        ) {
            output.push(DesignBooleanBounds.source(node, box, this.#owner));
        }
        if (node.kind === DesignKind.Group) {
            for (const child of node.children) {
                output.push(...this.#bounds(child, box));
            }
        }
        return output;
    }

    #source(
        id: string,
        owner: DesignBox,
        x: number,
        y: number,
        parentX: number,
        parentY: number,
    ): void {
        const node: DesignNode | undefined = this.#nodes.get(id);
        const box: DesignBox | undefined = this.#boxes.get(id);
        if (node === undefined || box === undefined) {
            throw new Error('Show Boolean sources before resizing their geometry.');
        }
        const matrix: readonly number[] = DesignBooleanGeometry.matrix(box, owner);
        const transform: (path: readonly DesignPathCommand[]) => readonly DesignPathCommand[] = (
            path: readonly DesignPathCommand[],
        ): readonly DesignPathCommand[] =>
            path.map((command: DesignPathCommand): DesignPathCommand => ({
                verb: command.verb,
                values: command.values.map((_value: number, index: number): number => {
                    const px: number = command.values[index - (index % 2)] ?? 0;
                    const py: number = command.values[index - (index % 2) + 1] ?? 0;
                    return index % 2 === 0
                        ? ((matrix[0] ?? 1) * px + (matrix[1] ?? 0) * py + (matrix[2] ?? 0)) * x -
                              parentX
                        : ((matrix[3] ?? 0) * px + (matrix[4] ?? 1) * py + (matrix[5] ?? 0)) * y -
                              parentY;
                }),
            }));
        const container: boolean =
            node.kind === DesignKind.Boolean || node.kind === DesignKind.Group;
        const controls: readonly DesignPathCommand[] = DesignBooleanGeometry.path(
            node,
            box.width,
            box.height,
        );
        if (container) {
            if (node.layout.clip) {
                throw new Error('Release clipping before resizing a Boolean source group.');
            }
            const rectangle: DesignNode = {
                ...DesignDefaults.node('bounds'),
                style: DesignDefaults.style(DesignKind.Rectangle),
            };
            const bounds: DesignPathGeometry = DesignPaths.normalize(
                transform(DesignBooleanGeometry.path(rectangle, box.width, box.height)),
            );
            this.#changes.set(id, {
                ...node,
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                rotation: 0,
                path: transform(controls).map((command: DesignPathCommand): DesignPathCommand => ({
                    verb: command.verb,
                    values: command.values.map(
                        (value: number, index: number): number =>
                            value - (index % 2 === 0 ? bounds.x : bounds.y),
                    ),
                })),
                layout: {
                    ...node.layout,
                    flow: DesignFlow.Absolute,
                    padding: { left: 0, right: 0, top: 0, bottom: 0 },
                },
                placement: DesignSelectionTree.fixed(node, true),
            });
            for (const child of node.children) {
                this.#source(child, owner, x, y, parentX + bounds.x, parentY + bounds.y);
            }
            return;
        }
        const a: number = (matrix[0] ?? 1) * x;
        const b: number = (matrix[3] ?? 0) * y;
        const c: number = (matrix[1] ?? 0) * x;
        const d: number = (matrix[4] ?? 1) * y;
        const scaleX: number = Math.hypot(a, b);
        const scaleY: number = Math.hypot(c, d);
        const orthogonal: boolean = Math.abs(a * c + b * d) < 1e-10 * scaleX * scaleY;
        const rounded: boolean = Object.values(node.style.corners).some(
            (value: number): boolean => value > 0,
        );
        if (orthogonal && (!rounded || Math.abs(scaleX - scaleY) < 1e-10)) {
            const width: number = box.width * scaleX;
            const height: number = box.height * scaleY;
            const centerX: number =
                (((matrix[0] ?? 1) * box.width) / 2 +
                    ((matrix[1] ?? 0) * box.height) / 2 +
                    (matrix[2] ?? 0)) *
                    x -
                parentX;
            const centerY: number =
                (((matrix[3] ?? 0) * box.width) / 2 +
                    ((matrix[4] ?? 1) * box.height) / 2 +
                    (matrix[5] ?? 0)) *
                    y -
                parentY;
            this.#changes.set(
                id,
                DesignPaths.resize(node, {
                    x: centerX - width / 2,
                    y: centerY - height / 2,
                    width,
                    height,
                    rotation: (Math.atan2(b, a) * 180) / Math.PI,
                    placement: DesignSelectionTree.fixed(node, true),
                    style: rounded
                        ? {
                              ...node.style,
                              corners: {
                                  topLeft: node.style.corners.topLeft * scaleX,
                                  topRight: node.style.corners.topRight * scaleX,
                                  bottomLeft: node.style.corners.bottomLeft * scaleX,
                                  bottomRight: node.style.corners.bottomRight * scaleX,
                              },
                          }
                        : node.style,
                }),
            );
        } else {
            const geometry: DesignPathGeometry = DesignPaths.normalize(transform(controls));
            this.#changes.set(id, {
                ...node,
                kind: DesignKind.Path,
                x: geometry.x,
                y: geometry.y,
                width: geometry.width,
                height: geometry.height,
                rotation: 0,
                path: geometry.path,
                image: null,
                style:
                    node.image === null
                        ? node.style
                        : {
                              ...node.style,
                              fills: [
                                  {
                                      ...DesignDefaults.paint(),
                                      kind: DesignPaintKind.Image,
                                      assetId: node.image.assetId,
                                      framing: {
                                          fit: node.image.fit,
                                          cropX: node.image.cropX,
                                          cropY: node.image.cropY,
                                          scale: node.image.scale,
                                      },
                                  },
                              ],
                          },
                placement: DesignSelectionTree.fixed(node, true),
            });
        }
    }
}
