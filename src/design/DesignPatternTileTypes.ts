// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** One visible linked source is sampled at requested density within a bounded raster surface. */
export interface DesignPatternTileRequest {
    readonly id: string;
    readonly revision: string;
    readonly patternId: string;
    readonly density: number;
    readonly maxDimension: number;
    readonly offset: string;
}
/** Ephemeral PNG chunks never become published image assets and never include source text. */
export interface DesignPatternTileSlice {
    readonly id: string;
    readonly revision: string;
    readonly patternId: string;
    readonly intrinsicWidth: number;
    readonly intrinsicHeight: number;
    readonly width: number;
    readonly height: number;
    readonly byteLength: string;
    readonly sha256: string;
    readonly offset: string;
    readonly data: string;
    readonly nextOffset: string | null;
}
/** A read-only authenticated gateway method samples the saved definition at an exact revision. */
export interface DesignPatternTileMethod {
    readonly params: DesignPatternTileRequest;
    readonly result: DesignPatternTileSlice;
}
