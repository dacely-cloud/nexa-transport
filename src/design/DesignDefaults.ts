// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignBooleanMode } from './DesignBooleanTypes.js';

import {
    DesignKind,
    DesignFlow,
    DesignSizing,
    DesignAlign,
    DesignConstraint,
    DesignPaintKind,
    DesignPathVerb,
    DesignImageFit,
    type DesignImageFraming,
    type DesignNode,
    type DesignPaint,
    type DesignStyle,
    type DesignDocument,
} from './DesignTypes.js';

/** Complete defaults make tool-created and hand-created layers identical. */
export class DesignDefaults {
    /** Centered cover is the default for both image layers and legacy image paints. */
    public static framing(): DesignImageFraming {
        return { fit: DesignImageFit.Cover, cropX: 0, cropY: 0, scale: 1 };
    }
    /** One solid paint. */
    public static paint(color: string = '#8B7CF6'): DesignPaint {
        return {
            kind: DesignPaintKind.Solid,
            color,
            opacity: 1,
            angle: 0,
            stops: [],
            assetId: null,
            tokenId: null,
        };
    }
    /** Editable neutral style. */
    public static style(kind: DesignKind): DesignStyle {
        return {
            fills:
                kind === DesignKind.Group ||
                kind === DesignKind.Instance ||
                kind === DesignKind.Line
                    ? []
                    : [
                          this.paint(
                              kind === DesignKind.Text
                                  ? '#18181B'
                                  : kind === DesignKind.Frame || kind === DesignKind.Component
                                    ? '#FFFFFF'
                                    : '#8B7CF6',
                          ),
                      ],
            stroke: kind === DesignKind.Line ? { paint: this.paint(), width: 2, dash: [] } : null,
            corners: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
            shadows: [],
            blur: 0,
        };
    }
    /** A standalone layer; parent/child changes are applied atomically by DesignEdits. */
    public static node(
        id: string,
        kind: DesignKind = DesignKind.Rectangle,
        name: string = 'Rectangle',
    ): DesignNode {
        return {
            id,
            kind,
            ...(kind === DesignKind.Boolean ? { booleanMode: DesignBooleanMode.Union } : {}),
            name,
            parentId: null,
            children: [],
            x: 0,
            y: 0,
            width: kind === DesignKind.Text ? 240 : 160,
            height: kind === DesignKind.Text ? 40 : 120,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            style: this.style(kind),
            layout: {
                flow: DesignFlow.Absolute,
                wrap: false,
                gap: 16,
                rowGap: 16,
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                align: DesignAlign.Start,
                justify: DesignAlign.Start,
                columns: 3,
                clip: kind === DesignKind.Frame,
            },
            placement: {
                width: DesignSizing.Fixed,
                height: DesignSizing.Fixed,
                absolute: false,
                horizontal: DesignConstraint.Start,
                vertical: DesignConstraint.Start,
                minWidth: 0,
                maxWidth: 100000,
                minHeight: 0,
                maxHeight: 100000,
                columnSpan: 1,
                rowSpan: 1,
            },
            text:
                kind === DesignKind.Text
                    ? {
                          content: 'Text',
                          family: 'Inter',
                          size: 24,
                          weight: 400,
                          italic: false,
                          lineHeight: 1.4,
                          letterSpacing: 0,
                          align: DesignAlign.Start,
                          runs: [],
                      }
                    : null,
            path:
                kind === DesignKind.Line
                    ? [
                          { verb: DesignPathVerb.Move, values: [0, 0] },
                          { verb: DesignPathVerb.Line, values: [160, 120] },
                      ]
                    : kind === DesignKind.Polygon
                      ? [
                            { verb: DesignPathVerb.Move, values: [80, 0] },
                            { verb: DesignPathVerb.Line, values: [160, 120] },
                            { verb: DesignPathVerb.Line, values: [0, 120] },
                            { verb: DesignPathVerb.Close, values: [] },
                        ]
                      : [],
            image: null,
            componentId: null,
            overrides: [],
        };
    }
    /** A real empty document, without demo artwork or implicit external assets. */
    public static document(
        id: string,
        name: string = 'Untitled design',
        pageId: string = 'page-1',
    ): DesignDocument {
        return {
            format: 1,
            id,
            name,
            revision: '1',
            pages: [{ id: pageId, name: 'Page 1', roots: [], background: '#ECECF0' }],
            nodes: [],
            tokens: [],
            interactions: [],
            comments: [],
        };
    }
}
