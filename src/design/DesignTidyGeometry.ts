// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignStackGeometry } from './DesignStackGeometry.js';

/** Occupied rectangles are expressed in the selection's common coordinate frame. */
export interface DesignTidyCell {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
/** Explicit spacing retains logical cell order, including intentional overlap. */
export interface DesignTidySettings {
    readonly columns: number;
    readonly gapX: number;
    readonly gapY: number;
}
/** Inference supplies stable ordered cells and identifies already regular selections. */
export interface DesignTidyLayout extends DesignTidySettings {
    readonly cells: readonly DesignTidyCell[];
    readonly regular: boolean;
}
interface Tracks {
    readonly widths: readonly number[];
    readonly heights: readonly number[];
}
interface Row {
    readonly top: number;
    height: number;
    readonly cells: DesignTidyCell[];
}

/** Bounded free-selection grids preserve source identities, dimensions and painter ordering. */
export class DesignTidyGeometry {
    /** Visual inference ignores click/painter order; an explicit column count retains known logical order. */
    public static inspect(cells: readonly DesignTidyCell[], columns?: number): DesignTidyLayout {
        this.#validate(cells, 1);
        if (columns !== undefined) {
            this.#validate(cells, columns);
            const settings: DesignTidySettings = this.#spacing(cells, columns);
            const placed: readonly DesignTidyCell[] = this.place(cells, settings);
            return { ...settings, cells, regular: !this.changed(cells, placed) };
        }
        const rows: Row[] = [];
        for (const cell of cells.toSorted(
            (a: DesignTidyCell, b: DesignTidyCell): number => a.y - b.y || a.x - b.x,
        )) {
            let row: Row | undefined = rows.at(-1);
            if (
                row === undefined ||
                cell.y - row.top >= Math.max(1e-6, Math.min(row.height, cell.height) / 2)
            ) {
                row = { top: cell.y, height: cell.height, cells: [] };
                rows.push(row);
            }
            row.height = Math.min(row.height, cell.height);
            row.cells.push(cell);
        }
        const ordered: readonly DesignTidyCell[] = rows.flatMap(
            (row: Row): readonly DesignTidyCell[] =>
                row.cells.toSorted((a: DesignTidyCell, b: DesignTidyCell): number => a.x - b.x),
        );
        const count: number = Math.max(...rows.map((row: Row): number => row.cells.length));
        const settings: DesignTidySettings = this.#spacing(ordered, count);
        return {
            ...settings,
            cells: ordered,
            regular: !this.changed(ordered, this.place(ordered, settings)),
        };
    }

    /** Track envelopes retain the original leading occupied corner for positive and negative gaps. */
    public static place(
        cells: readonly DesignTidyCell[],
        settings: DesignTidySettings,
    ): readonly DesignTidyCell[] {
        this.#validate(cells, settings.columns);
        if (
            ![settings.gapX, settings.gapY].every(
                (value: number): boolean =>
                    Number.isFinite(value) && value >= -10000 && value <= 10000,
            )
        ) {
            throw new Error('Tidy spacing must be between -10000 and 10000 pixels.');
        }
        const tracks: Tracks = this.#tracks(cells, settings.columns);
        const xs: readonly number[] = DesignStackGeometry.arrange(
            tracks.widths,
            settings.gapX,
        ).offsets;
        const ys: readonly number[] = DesignStackGeometry.arrange(
            tracks.heights,
            settings.gapY,
        ).offsets;
        const left: number = Math.min(...cells.map((cell: DesignTidyCell): number => cell.x));
        const top: number = Math.min(...cells.map((cell: DesignTidyCell): number => cell.y));
        return cells.map((cell: DesignTidyCell, index: number): DesignTidyCell => ({
            ...cell,
            x: left + (xs[index % settings.columns] ?? 0),
            y: top + (ys[Math.floor(index / settings.columns)] ?? 0),
        }));
    }

    /** Matching layouts create no metadata-only transaction or history entry. */
    public static changed(
        before: readonly DesignTidyCell[],
        after: readonly DesignTidyCell[],
    ): boolean {
        return (
            before.length !== after.length ||
            before.some((cell: DesignTidyCell, index: number): boolean => {
                const target: DesignTidyCell | undefined = after[index];
                return (
                    target === undefined ||
                    target.id !== cell.id ||
                    Math.abs(target.x - cell.x) > 1e-6 ||
                    Math.abs(target.y - cell.y) > 1e-6
                );
            })
        );
    }

    static #spacing(cells: readonly DesignTidyCell[], columns: number): DesignTidySettings {
        const tracks: Tracks = this.#tracks(cells, columns);
        const horizontal: number[] = [];
        const vertical: number[] = [];
        for (let index: number = 0; index < cells.length; index++) {
            const cell: DesignTidyCell | undefined = cells[index];
            if (cell === undefined) {
                throw new Error('Missing tidy cell.');
            }
            const column: number = index % columns;
            const previous: DesignTidyCell | undefined = cells[index - 1];
            if (column > 0 && previous !== undefined) {
                horizontal.push(cell.x - previous.x - (tracks.widths[column - 1] ?? 0));
            }
            const above: DesignTidyCell | undefined = cells[index - columns];
            if (column === 0 && above !== undefined) {
                vertical.push(
                    cell.y - above.y - (tracks.heights[Math.floor(index / columns) - 1] ?? 0),
                );
            }
        }
        const gapX: number = this.#mode(horizontal, this.#mode(vertical, 0));
        const gapY: number = this.#mode(vertical, gapX);
        return { columns, gapX, gapY };
    }

    static #mode(values: readonly number[], fallback: number): number {
        if (values.length === 0) {
            return fallback;
        }
        const groups: Map<number, number[]> = new Map();
        for (const value of values) {
            const key: number = Math.round(value);
            const entries: number[] = groups.get(key) ?? [];
            entries.push(value);
            groups.set(key, entries);
        }
        const selected: readonly number[] =
            [...groups.values()].sort(
                (a: number[], b: number[]): number =>
                    b.length - a.length || Math.abs(a[0] ?? 0) - Math.abs(b[0] ?? 0),
            )[0] ?? [];
        const sorted: readonly number[] = selected.toSorted(
            (a: number, b: number): number => a - b,
        );
        return Math.max(-10000, Math.min(10000, sorted[Math.floor(sorted.length / 2)] ?? fallback));
    }

    static #tracks(cells: readonly DesignTidyCell[], columns: number): Tracks {
        const widths: number[] = Array.from({ length: columns }, (): number => 0);
        const heights: number[] = Array.from(
            { length: Math.ceil(cells.length / columns) },
            (): number => 0,
        );
        for (let index: number = 0; index < cells.length; index++) {
            const cell: DesignTidyCell | undefined = cells[index];
            if (cell === undefined) {
                throw new Error('Missing tidy cell.');
            }
            const column: number = index % columns;
            const row: number = Math.floor(index / columns);
            widths[column] = Math.max(widths[column] ?? 0, cell.width);
            heights[row] = Math.max(heights[row] ?? 0, cell.height);
        }
        return { widths, heights };
    }

    static #validate(cells: readonly DesignTidyCell[], columns: number): void {
        if (cells.length < 2 || cells.length > 128) {
            throw new Error('Tidy requires 2 to 128 visible selected roots.');
        }
        if (!Number.isInteger(columns) || columns < 1 || columns > cells.length) {
            throw new Error('Tidy columns must be a whole number within the selected root count.');
        }
        if (
            new Set(cells.map((cell: DesignTidyCell): string => cell.id)).size !== cells.length ||
            cells.some(
                (cell: DesignTidyCell): boolean =>
                    ![cell.x, cell.y, cell.width, cell.height].every(Number.isFinite) ||
                    cell.width < 0 ||
                    cell.height < 0,
            )
        ) {
            throw new Error(
                'Tidy requires distinct cells with finite coordinates and nonnegative dimensions.',
            );
        }
    }
}
