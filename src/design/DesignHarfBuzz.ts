// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { Font, GlyphPosition, Glyph } from 'fontkit';
import type { DesignResolvedFace } from './DesignFontRegistry.js';
import { DesignFontSfnt } from './DesignFontSfnt.js';
import { DesignHarfBuzzRuntime } from './DesignHarfBuzzRuntime.js';

/** Source clusters belong to a shaping result, never fontkit's shared mutable glyph cache. */
export interface DesignShapedGlyph {
    readonly glyph: Glyph;
    readonly source: string;
    readonly mark: boolean;
    readonly position: GlyphPosition;
}
interface NativeGlyph {
    readonly id: number;
    readonly cluster: number;
    readonly position: GlyphPosition;
}
interface NativeOwner {
    readonly pointer: number;
    readonly destroy: string;
}

/** Full HarfBuzz preserves contextual OpenType, legacy kerning and AAT in browser and native outlines. */
export class DesignHarfBuzz {
    static readonly #faces: WeakMap<Uint8Array, number> = new WeakMap();
    static readonly #fonts: WeakMap<Font, number> = new WeakMap();
    static readonly #owners: FinalizationRegistry<NativeOwner> = new FinalizationRegistry(
        (owner: NativeOwner): void =>
            DesignHarfBuzzRuntime.read().invoke(owner.destroy, owner.pointer),
    );
    static #buffer: number | null = null;

    /** Reuse one reset scratch buffer; private allocations follow weak source and variation owners. */
    public static shape(
        resolved: DesignResolvedFace,
        content: string,
        script: string,
        tracking: number,
    ): readonly DesignShapedGlyph[] {
        if (content.length > 100000) {
            throw new Error('Text shaping exceeds its source budget.');
        }
        const runtime: DesignHarfBuzzRuntime = DesignHarfBuzzRuntime.read();
        const font: number = this.#font(resolved, runtime);
        const buffer: number = (this.#buffer ??= runtime.integer('hb_buffer_create'));
        const input: number = runtime.allocate(Math.max(2, content.length * 2));
        runtime.invoke('hb_buffer_reset', buffer);
        try {
            const target: Uint16Array = new Uint16Array(
                runtime.memory.buffer,
                input,
                content.length,
            );
            for (let index: number = 0; index < content.length; index++) {
                target[index] = content.charCodeAt(index);
            }
            runtime.invoke('hb_buffer_add_utf16', buffer, input, content.length, 0, content.length);
            runtime.invoke('hb_buffer_set_flags', buffer, 8);
            runtime.invoke('hb_buffer_set_script', buffer, this.#tag(script));
            if (resolved.style.direction !== undefined) {
                runtime.invoke(
                    'hb_buffer_set_direction',
                    buffer,
                    resolved.style.direction === 'rtl' ? 5 : 4,
                );
            }
            runtime.invoke('hb_buffer_guess_segment_properties', buffer);
            if (tracking === 0) {
                runtime.invoke('hb_shape', font, buffer, 0, 0);
            } else {
                this.#tracked(runtime, font, buffer);
            }
            const glyphs: readonly NativeGlyph[] = this.#glyphs(
                runtime,
                buffer,
                content.length,
                resolved.face.numGlyphs,
            );
            const clusters: readonly number[] = [
                ...new Set(glyphs.map((glyph: NativeGlyph): number => glyph.cluster)),
                content.length,
            ].sort((a: number, b: number): number => a - b);
            const sources: ReadonlyMap<number, string> = new Map(
                clusters
                    .slice(0, -1)
                    .map((start: number, index: number): readonly [number, string] => [
                        start,
                        content.slice(start, clusters[index + 1]),
                    ]),
            );
            const face: number = runtime.integer('hb_font_get_face', font);
            return glyphs.map((glyph: NativeGlyph): DesignShapedGlyph => ({
                glyph: resolved.face.getGlyph(glyph.id),
                source: sources.get(glyph.cluster) ?? '',
                mark: runtime.integer('hb_ot_layout_get_glyph_class', face, glyph.id) === 3,
                position: glyph.position,
            }));
        } finally {
            runtime.invoke('free', input);
            runtime.invoke('hb_buffer_reset', buffer);
        }
    }

    static #glyphs(
        runtime: DesignHarfBuzzRuntime,
        buffer: number,
        sourceLength: number,
        maximumGlyph: number,
    ): readonly NativeGlyph[] {
        if (runtime.integer('hb_buffer_allocation_successful', buffer) === 0) {
            throw new Error('The text shaper exhausted its memory budget.');
        }
        const count: number = runtime.integer('hb_buffer_get_length', buffer);
        if (count > 100000) {
            throw new Error('Font returned oversized shaping data.');
        }
        const infos: number = runtime.integer('hb_buffer_get_glyph_infos', buffer, 0);
        const positions: number = runtime.integer('hb_buffer_get_glyph_positions', buffer, 0);
        const view: DataView = new DataView(runtime.memory.buffer);
        if (infos + count * 20 > view.byteLength || positions + count * 20 > view.byteLength) {
            throw new Error('Font returned invalid shaping offsets.');
        }
        const output: NativeGlyph[] = [];
        for (let index: number = 0; index < count; index++) {
            const id: number = view.getUint32(infos + index * 20, true);
            const cluster: number = view.getUint32(infos + index * 20 + 8, true);
            if (id >= maximumGlyph || cluster >= sourceLength) {
                throw new Error('Font returned invalid glyphs or source clusters.');
            }
            output.push({
                id,
                cluster,
                position: {
                    xAdvance: view.getInt32(positions + index * 20, true),
                    yAdvance: view.getInt32(positions + index * 20 + 4, true),
                    xOffset: view.getInt32(positions + index * 20 + 8, true),
                    yOffset: view.getInt32(positions + index * 20 + 12, true),
                },
            });
        }
        return output;
    }

    static #tracked(runtime: DesignHarfBuzzRuntime, font: number, buffer: number): void {
        const features: number = runtime.allocate(32);
        try {
            const view: DataView = new DataView(runtime.memory.buffer);
            for (const [index, tag] of ['liga', 'clig'].entries()) {
                const offset: number = features + index * 16;
                view.setUint32(offset, this.#tag(tag), true);
                view.setUint32(offset + 4, 0, true);
                view.setUint32(offset + 8, 0, true);
                view.setUint32(offset + 12, 0xffffffff, true);
            }
            runtime.invoke('hb_shape', font, buffer, features, 2);
        } finally {
            runtime.invoke('free', features);
        }
    }

    static #tag(value: string): number {
        if (!/^[A-Za-z]{4}$/u.test(value)) {
            throw new Error('Invalid text shaping script or feature tag.');
        }
        return (
            value.charCodeAt(0) * 0x1000000 +
            value.charCodeAt(1) * 0x10000 +
            value.charCodeAt(2) * 0x100 +
            value.charCodeAt(3)
        );
    }

    static #font(resolved: DesignResolvedFace, runtime: DesignHarfBuzzRuntime): number {
        const cached: number | undefined = this.#fonts.get(resolved.face);
        if (cached !== undefined) {
            return cached;
        }
        let face: number | undefined = this.#faces.get(resolved.source.bytes);
        if (face === undefined) {
            const bytes: Uint8Array = DesignFontSfnt.read(resolved.source.bytes);
            const input: number = runtime.allocate(bytes.length);
            let blob: number = 0;
            try {
                new Uint8Array(runtime.memory.buffer, input, bytes.length).set(bytes);
                blob = runtime.integer('hb_blob_create', input, bytes.length, 0, 0, 0);
                face = runtime.integer('hb_face_create', blob, 0);
                if (runtime.integer('hb_face_get_upem', face) !== resolved.face.unitsPerEm) {
                    runtime.invoke('hb_face_destroy', face);
                    throw new Error('The text shaper rejected the font face.');
                }
            } finally {
                runtime.invoke('hb_blob_destroy', blob);
                runtime.invoke('free', input);
            }
            this.#faces.set(resolved.source.bytes, face);
            this.#owners.register(resolved.source.bytes, {
                pointer: face,
                destroy: 'hb_face_destroy',
            });
        }
        const font: number = runtime.integer('hb_font_create', face);
        runtime.invoke('hb_ot_font_set_funcs', font);
        runtime.invoke(
            'hb_font_set_scale',
            font,
            resolved.face.unitsPerEm,
            resolved.face.unitsPerEm,
        );
        if (resolved.face.variationAxes['wght'] !== undefined) {
            const variation: number = runtime.allocate(8);
            try {
                const view: DataView = new DataView(runtime.memory.buffer);
                view.setUint32(variation, this.#tag('wght'), true);
                view.setFloat32(variation + 4, resolved.style.weight, true);
                runtime.invoke('hb_font_set_variations', font, variation, 1);
            } catch (error: unknown) {
                runtime.invoke('hb_font_destroy', font);
                throw error;
            } finally {
                runtime.invoke('free', variation);
            }
        }
        this.#fonts.set(resolved.face, font);
        this.#owners.register(resolved.face, { pointer: font, destroy: 'hb_font_destroy' });
        return font;
    }
}
