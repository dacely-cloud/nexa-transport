// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    DesignKind,
    type DesignNode,
    type DesignStyle,
    type DesignText,
    type DesignTextRun,
    type DesignShadow,
    type DesignPathCommand,
} from './DesignTypes.js';

/** Uniform artwork metrics are shared by native selection edits and linked-instance expansion. */
export class DesignScaleMetrics {
    public static text(text: DesignText, factor: number): DesignText {
        return {
            ...text,
            size: text.size * factor,
            letterSpacing: text.letterSpacing * factor,
            runs: text.runs.map((run: DesignTextRun): DesignTextRun => ({
                ...run,
                size: run.size * factor,
            })),
        };
    }
    public static style(style: DesignStyle, factor: number): DesignStyle {
        return {
            ...style,
            blur: style.blur * factor,
            stroke:
                style.stroke === null
                    ? null
                    : {
                          ...style.stroke,
                          width: style.stroke.width * factor,
                          dash: style.stroke.dash.map((value: number): number => value * factor),
                      },
            corners: {
                topLeft: style.corners.topLeft * factor,
                topRight: style.corners.topRight * factor,
                bottomLeft: style.corners.bottomLeft * factor,
                bottomRight: style.corners.bottomRight * factor,
            },
            shadows: style.shadows.map((shadow: DesignShadow): DesignShadow => ({
                ...shadow,
                x: shadow.x * factor,
                y: shadow.y * factor,
                blur: shadow.blur * factor,
                spread: shadow.spread * factor,
            })),
        };
    }
    /** Expansion transforms source metrics without compounding an instance's saved contentScale. */
    public static node(node: DesignNode, factor: number, linked: boolean = true): DesignNode {
        if (factor === 1) {
            return node;
        }
        return {
            ...node,
            x: node.x * factor,
            y: node.y * factor,
            width: node.width * factor,
            height: node.height * factor,
            ...(linked && node.kind === DesignKind.Instance
                ? { contentScale: (node.contentScale ?? 1) * factor }
                : {}),
            style: this.style(node.style, factor),
            text: node.text === null ? null : this.text(node.text, factor),
            path: node.path.map((command: DesignPathCommand): DesignPathCommand => ({
                ...command,
                values: command.values.map((value: number): number => value * factor),
            })),
            layout: {
                ...node.layout,
                gap: node.layout.gap * factor,
                rowGap: node.layout.rowGap * factor,
                padding: {
                    top: node.layout.padding.top * factor,
                    right: node.layout.padding.right * factor,
                    bottom: node.layout.padding.bottom * factor,
                    left: node.layout.padding.left * factor,
                },
            },
            placement: {
                ...node.placement,
                minWidth: node.placement.minWidth * factor,
                minHeight: node.placement.minHeight * factor,
                maxWidth:
                    node.placement.maxWidth === 100000 ? 100000 : node.placement.maxWidth * factor,
                maxHeight:
                    node.placement.maxHeight === 100000
                        ? 100000
                        : node.placement.maxHeight * factor,
                ...(node.placement.referenceWidth === undefined
                    ? {}
                    : { referenceWidth: node.placement.referenceWidth * factor }),
                ...(node.placement.referenceHeight === undefined
                    ? {}
                    : { referenceHeight: node.placement.referenceHeight * factor }),
                ...(node.kind === DesignKind.Instance ||
                node.placement.contentReferenceWidth === undefined
                    ? {}
                    : { contentReferenceWidth: node.placement.contentReferenceWidth * factor }),
                ...(node.kind === DesignKind.Instance ||
                node.placement.contentReferenceHeight === undefined
                    ? {}
                    : { contentReferenceHeight: node.placement.contentReferenceHeight * factor }),
            },
        };
    }
}
