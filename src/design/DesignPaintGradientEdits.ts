// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import { DesignPaintLayerEdit } from './DesignPaintLayerEdit.js';
import { DesignStyleCodec } from './DesignStyleCodec.js';
import { DesignGradientGeometry } from './DesignGradientGeometry.js';
import { DesignGradientCodec } from './DesignGradientCodec.js';
import { DesignPaintKind, type DesignNode, type DesignPaint } from './DesignTypes.js';
import type { DesignGradientTransform } from './DesignGradientTypes.js';
import type {
    DesignPaintGradientOperation,
    DesignPaintGradientChanges,
} from './DesignOperationTypes.js';

/** Shared compact geometry is used by tools, numeric fields and interactive canvas handles. */
export class DesignPaintGradientEdits {
    /** Authored paint authority enforces ownership, locked ancestry and instance-root isolation. */
    public static apply(
        authority: DesignLayerAuthority,
        operation: DesignPaintGradientOperation,
    ): DesignNode {
        return DesignPaintLayerEdit.apply(authority, operation, (paint: DesignPaint): DesignPaint =>
            this.paint(paint, operation.changes),
        );
    }
    /** Omitted fields survive; null restores the legacy geometry, and angle rotates an explicit transform. */
    public static paint(source: DesignPaint, changes: DesignPaintGradientChanges): DesignPaint {
        const kind: DesignPaintKind = changes.kind ?? source.kind;
        if (kind !== DesignPaintKind.Linear && kind !== DesignPaintKind.Radial) {
            throw new Error('Choose a linear or radial gradient paint.');
        }
        const { gradient: previous, ...rest }: DesignPaint = source;
        let gradient: DesignGradientTransform | null | undefined = previous;
        if (changes.gradient === null) {
            gradient = null;
        } else {
            if (changes.angle !== undefined && gradient != null) {
                gradient = DesignGradientGeometry.rotate(gradient, kind, changes.angle);
            }
            if (changes.gradient !== undefined) {
                gradient = DesignGradientCodec.parse({
                    ...DesignGradientGeometry.resolve({
                        ...source,
                        kind,
                        angle: changes.angle ?? source.angle,
                        ...(gradient === undefined ? {} : { gradient }),
                    }),
                    ...changes.gradient,
                });
            }
        }
        return DesignStyleCodec.paint({
            ...rest,
            kind,
            angle:
                gradient != null && kind === DesignPaintKind.Linear
                    ? DesignGradientGeometry.angle(gradient)
                    : (changes.angle ?? source.angle),
            stops:
                changes.stops ??
                (source.stops.length >= 2
                    ? source.stops
                    : [
                          { offset: 0, color: source.color },
                          { offset: 1, color: '#FFFFFF' },
                      ]),
            ...(gradient === undefined ? {} : { gradient }),
        });
    }
}
