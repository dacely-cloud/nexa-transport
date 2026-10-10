// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Opaque enums belong to the initialized native module, never caller-supplied numbers. */
export interface DesignPathKitEnum {
    readonly value: number;
}
/** Explicit stroke settings mirror the centered SVG and GPU stroke model. */
export interface DesignPathKitStroke {
    readonly width: number;
    readonly miter_limit: number;
    readonly join: DesignPathKitEnum;
    readonly cap: DesignPathKitEnum;
}
/** Every native path has one owner responsible for freeing its WASM allocation. */
export interface DesignPathKitPath {
    /** Copies the handle into a separately owned native allocation. */
    copy(): DesignPathKitPath;
    /** Releases this allocation exactly once. */
    delete(): void;
    /** Native handle status supports allocation-lifetime verification. */
    isDeleted(): boolean;
    /** Chooses winding semantics before combination. */
    setFillType(type: DesignPathKitEnum): void;
    /** Native command arrays cross an FFI trust boundary. */
    toCmds(): unknown;
    /** Expands a centered stroke in place; null signals failure. */
    stroke(settings: DesignPathKitStroke): DesignPathKitPath | null;
    /** Applies a single repeating dash pair in place. */
    dash(on: number, off: number, phase: number): DesignPathKitPath | null;
    /** Retains the selected arc-length fraction in place. */
    trim(start: number, end: number, complement: boolean): DesignPathKitPath | null;
    /** Appends another path without acquiring ownership of it. */
    addPath(other: DesignPathKitPath): DesignPathKitPath;
    /** Transforms coordinates in place, including rational curves. */
    transform(matrix: readonly number[]): DesignPathKitPath | null;
}
/** Supported native set operations, obtained from the initialized module. */
export interface DesignPathKitOperations {
    readonly UNION: DesignPathKitEnum;
    readonly DIFFERENCE: DesignPathKitEnum;
    readonly INTERSECT: DesignPathKitEnum;
    readonly XOR: DesignPathKitEnum;
}
/** Filled contours use the same nonzero winding rule as SVG and the canvas. */
export interface DesignPathKitFills {
    readonly WINDING: DesignPathKitEnum;
}
/** The editor's centered borders use round joins. */
export interface DesignPathKitJoins {
    readonly ROUND: DesignPathKitEnum;
}
/** The existing vector renderer and SVG exporter use round caps. */
export interface DesignPathKitCaps {
    readonly ROUND: DesignPathKitEnum;
}
/** The minimal typed FFI surface used by editable layout geometry. */
export interface DesignPathKitLibrary {
    readonly PathOp: DesignPathKitOperations;
    readonly FillType: DesignPathKitFills;
    readonly StrokeJoin: DesignPathKitJoins;
    readonly StrokeCap: DesignPathKitCaps;
    /** Creates an owned native path from validated command rows. */
    FromCmds(commands: readonly (readonly number[])[]): DesignPathKitPath | null;
    /** Parses the canonical primitive path emitted by the design geometry layer. */
    FromSVGString(path: string): DesignPathKitPath | null;
    /** Allocates an owned empty path. */
    NewPath(): DesignPathKitPath;
    /** Allocates the result without consuming either input. */
    MakeFromOp(
        left: DesignPathKitPath,
        right: DesignPathKitPath,
        operation: DesignPathKitEnum,
    ): DesignPathKitPath | null;
}
/** Providing bytes avoids environment-specific WASM fetches or filesystem lookups. */
export interface DesignPathKitOptions {
    readonly wasmBinary: Uint8Array;
}
/** The package's default factory is validated at the external runtime boundary. */
export type DesignPathKitFactory = (options: DesignPathKitOptions) => Promise<DesignPathKitLibrary>;
