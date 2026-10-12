// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Endpoint shapes match the centered SVG stroke model. */
export const DesignStrokeCap = { Butt: 'butt', Round: 'round', Square: 'square' } as const;
/** Supported endpoint shape. */
export type DesignStrokeCap = (typeof DesignStrokeCap)[keyof typeof DesignStrokeCap];
/** Corners may retain a round sector, bevel or bounded miter. */
export const DesignStrokeJoin = { Miter: 'miter', Round: 'round', Bevel: 'bevel' } as const;
/** Supported corner shape. */
export type DesignStrokeJoin = (typeof DesignStrokeJoin)[keyof typeof DesignStrokeJoin];
