// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Native data visualization families. Relationship diagrams use render_graph. */
export const GraphicKind = {
    Line: 'line',
    Area: 'area',
    Bar: 'bar',
    StackedBar: 'stacked-bar',
    Scatter: 'scatter',
    Pie: 'pie',
    Donut: 'donut',
    Radar: 'radar',
    Heatmap: 'heatmap',
    Treemap: 'treemap',
    Funnel: 'funnel',
    Metric: 'metric',
} as const;
/** Supported visualization family. */
export type GraphicKind = (typeof GraphicKind)[keyof typeof GraphicKind];
/** Curated palettes and surface treatments, with Nerva's homepage as the default. */
export const GraphicStyle = {
    Studio: 'studio',
    Midnight: 'midnight',
    Blueprint: 'blueprint',
    Aurora: 'aurora',
    Minimal: 'minimal',
} as const;
/** Supported visual treatment. */
export type GraphicStyle = (typeof GraphicStyle)[keyof typeof GraphicStyle];
/** One bounded measurement. x is required only for a scatter plot. */
export interface GraphicMeasurement {
    readonly label: string;
    readonly value: number;
    readonly x?: number;
}
/** Immutable JSON measurement, with an optional continuous scatter coordinate. */
export type GraphicPoint = Readonly<GraphicMeasurement>;
/** A named series of measurements. */
export interface GraphicSeries extends Readonly<Record<string, string | readonly GraphicPoint[]>> {
    readonly name: string;
    readonly points: readonly GraphicPoint[];
}
/** An inert, versioned visual specification. Text never becomes markup or code. */
export interface Graphic extends Readonly<
    Record<string, string | number | readonly GraphicSeries[]>
> {
    readonly version: 1;
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly kind: GraphicKind;
    readonly style: GraphicStyle;
    readonly xLabel: string;
    readonly yLabel: string;
    readonly unit: string;
    readonly source: string;
    readonly series: readonly GraphicSeries[];
}

/** Shared browser-safe validation before native delivery, wire acceptance and history rendering. */
export class Graphics {
    /** Copy validated fields into an immutable specification with bounded aggregate work. */
    public static parse(raw: unknown): Graphic {
        this.#record(raw, [
            'version',
            'id',
            'title',
            'description',
            'kind',
            'style',
            'xLabel',
            'yLabel',
            'unit',
            'source',
            'series',
        ]);
        if (Reflect.get(raw, 'version') !== 1) {
            throw new Error('Unsupported graphic version. Expected 1.');
        }
        const kind: GraphicKind | undefined = Object.values(GraphicKind).find(
            (entry: GraphicKind): boolean => entry === Reflect.get(raw, 'kind'),
        );
        const style: GraphicStyle | undefined = Object.values(GraphicStyle).find(
            (entry: GraphicStyle): boolean => entry === Reflect.get(raw, 'style'),
        );
        if (kind === undefined || style === undefined) {
            throw new Error('Unsupported graphic kind or style.');
        }
        const id: string = this.#text(Reflect.get(raw, 'id'), 80, false);
        if (!/^[a-zA-Z0-9_-]+$/u.test(id)) {
            throw new Error('Graphic id must use letters, numbers, underscores or hyphens.');
        }
        const entries: unknown = Reflect.get(raw, 'series');
        if (!Array.isArray(entries) || entries.length < 1 || entries.length > 8) {
            throw new Error('A graphic requires 1–8 series.');
        }
        const single: boolean = ['pie', 'donut', 'treemap', 'funnel', 'metric'].includes(kind);
        if (single && entries.length !== 1) {
            throw new Error(`${kind} requires exactly one series.`);
        }
        const names: Set<string> = new Set();
        const series: readonly GraphicSeries[] = Object.freeze(
            entries.map((entry: unknown): GraphicSeries => {
                this.#record(entry, ['name', 'points']);
                const name: string = this.#text(Reflect.get(entry, 'name'), 100, false);
                if (names.has(name)) {
                    throw new Error('Series names must be unique.');
                }
                names.add(name);
                const values: unknown = Reflect.get(entry, 'points');
                const limit: number = kind === 'radar' ? 24 : kind === 'metric' ? 12 : 256;
                if (!Array.isArray(values) || values.length < 1 || values.length > limit) {
                    throw new Error(`Each ${kind} series requires 1–${limit} points.`);
                }
                if (kind === 'radar' && values.length < 3) {
                    throw new Error('Radar charts require at least three axes.');
                }
                const labels: Set<string> = new Set();
                const points: readonly GraphicPoint[] = Object.freeze(
                    values.map((point: unknown): GraphicPoint => {
                        this.#record(point, ['label', 'value', 'x']);
                        const label: string = this.#text(Reflect.get(point, 'label'), 100, false);
                        if (labels.has(label)) {
                            throw new Error('Point labels must be unique within a series.');
                        }
                        labels.add(label);
                        const value: number = this.#number(Reflect.get(point, 'value'));
                        if (
                            ['pie', 'donut', 'treemap', 'funnel', 'radar'].includes(kind) &&
                            value < 0
                        ) {
                            throw new Error(`${kind} values must be nonnegative.`);
                        }
                        const x: unknown = Reflect.get(point, 'x');
                        if (kind === GraphicKind.Scatter && x === undefined) {
                            throw new Error('Scatter points require numeric x coordinates.');
                        }
                        return Object.freeze({
                            label,
                            value,
                            ...(x === undefined ? {} : { x: this.#number(x) }),
                        });
                    }),
                );
                return Object.freeze({ name, points });
            }),
        );
        const first: GraphicSeries | undefined = series[0];
        if (kind !== GraphicKind.Scatter && first !== undefined) {
            for (const entry of series) {
                if (
                    entry.points.length !== first.points.length ||
                    entry.points.some(
                        (point: GraphicPoint, index: number): boolean =>
                            point.label !== first.points[index]?.label,
                    )
                ) {
                    throw new Error(
                        'Categorical series must use the same labels in the same order.',
                    );
                }
            }
        }
        const result: Graphic = Object.freeze({
            version: 1,
            id,
            kind,
            style,
            title: this.#text(Reflect.get(raw, 'title'), 160, false),
            description: this.#text(Reflect.get(raw, 'description'), 1000, true),
            xLabel: this.#text(Reflect.get(raw, 'xLabel'), 100, true),
            yLabel: this.#text(Reflect.get(raw, 'yLabel'), 100, true),
            unit: this.#text(Reflect.get(raw, 'unit'), 24, true),
            source: this.#text(Reflect.get(raw, 'source'), 500, true),
            series,
        });
        if (new TextEncoder().encode(JSON.stringify(result)).byteLength > 256 * 1024) {
            throw new Error('Graphic exceeds the 256 KiB delivery limit.');
        }
        return result;
    }
    /** A predicate for network validators that must reject rather than throw. */
    public static isValid(raw: unknown): raw is Graphic {
        try {
            this.parse(raw);
            return true;
        } catch {
            return false;
        }
    }
    static #record(
        raw: unknown,
        fields: readonly string[],
    ): asserts raw is Readonly<Record<string, unknown>> {
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
            throw new Error('Expected a graphic record.');
        }
        const keys: readonly string[] = Object.keys(raw);
        if (
            keys.length > fields.length ||
            keys.some((key: string): boolean => !fields.includes(key))
        ) {
            throw new Error('Unexpected graphic fields. Only the documented fields are accepted.');
        }
    }
    static #text(raw: unknown, limit: number, empty: boolean): string {
        if (typeof raw !== 'string' || raw.length > limit || (!empty && raw.trim().length === 0)) {
            throw new Error(`Graphic text must contain ${empty ? '0' : '1'}–${limit} characters.`);
        }
        return raw;
    }
    static #number(raw: unknown): number {
        if (typeof raw !== 'number' || !Number.isFinite(raw) || Math.abs(raw) > 1e15) {
            throw new Error(
                'Graphic measurements must be finite numbers between -1e15 and 1e15. Use scaled units for larger quantities.',
            );
        }
        return raw;
    }
}
