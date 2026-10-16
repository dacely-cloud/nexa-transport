// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    DesignDocument,
    DesignNode,
    DesignStyle,
    DesignPaint,
    DesignText,
    DesignImageFraming,
} from './DesignTypes.js';

/** Decoded state is immutable at runtime as well as in TypeScript. */
export class DesignFreeze {
    /** Freezes the complete validated document without touching external input objects. */
    public static document(document: DesignDocument): DesignDocument {
        for (const node of document.nodes) {
            this.node(node);
        }
        for (const page of document.pages) {
            if (page.guides !== undefined) {
                for (const guide of page.guides) {
                    Object.freeze(guide);
                }
                Object.freeze(page.guides);
            }
            Object.freeze(page);
        }
        for (const token of document.tokens) {
            if (token.typography !== undefined) {
                if (token.typography.font !== null) {
                    Object.freeze(token.typography.font);
                }
                Object.freeze(token.typography);
            }
            Object.freeze(token);
        }
        for (const interaction of document.interactions) {
            Object.freeze(interaction);
        }
        for (const comment of document.comments) {
            Object.freeze(comment);
        }
        return Object.freeze(document);
    }
    /** Freezes one detached node and each of its nested editable records. */
    public static node(node: DesignNode): DesignNode {
        if (node.arc !== undefined) {
            Object.freeze(node.arc);
        }
        if (node.polygon !== undefined) {
            Object.freeze(node.polygon);
        }
        if (node.layoutGrids !== undefined) {
            for (const grid of node.layoutGrids) {
                Object.freeze(grid);
            }
            Object.freeze(node.layoutGrids);
        }
        this.#style(node.style);
        if (node.mask !== undefined) {
            Object.freeze(node.mask);
        }
        if (node.variants !== undefined) {
            Object.freeze(node.variants.properties);
            Object.freeze(node.variants);
        }
        if (node.variant !== undefined) {
            for (const value of node.variant) {
                Object.freeze(value);
            }
            Object.freeze(node.variant);
        }
        Object.freeze(node.layout.padding);
        Object.freeze(node.layout);
        Object.freeze(node.placement);
        if (node.text !== null) {
            this.#text(node.text);
        }
        for (const command of node.path) {
            Object.freeze(command);
        }
        if (node.image !== null) {
            this.#framing(node.image);
            if (node.image.sampling != null) {
                Object.freeze(node.image.sampling);
            }
            Object.freeze(node.image);
        }
        for (const override of node.overrides) {
            if (override.style !== null) {
                this.#style(override.style);
            }
            Object.freeze(override);
        }
        return Object.freeze(node);
    }
    static #paint(paint: DesignPaint): void {
        if (paint.framing !== undefined) {
            this.#framing(paint.framing);
        }
        if (paint.gradient != null) {
            Object.freeze(paint.gradient);
        }
        for (const stop of paint.stops) {
            Object.freeze(stop);
        }
        Object.freeze(paint);
    }
    static #framing(framing: DesignImageFraming): void {
        if (framing.transform != null) {
            Object.freeze(framing.transform);
        }
        if (framing.adjustments != null) {
            Object.freeze(framing.adjustments);
        }
        if (framing.tile != null) {
            Object.freeze(framing.tile.content);
            if (framing.tile.clip != null) {
                Object.freeze(framing.tile.clip);
            }
            Object.freeze(framing.tile);
        }
        Object.freeze(framing);
    }
    static #style(style: DesignStyle): void {
        for (const paint of style.fills) {
            this.#paint(paint);
        }
        if (style.stroke !== null) {
            this.#paint(style.stroke.paint);
            Object.freeze(style.stroke);
        }
        for (const shadow of style.shadows) {
            Object.freeze(shadow);
        }
        Object.freeze(style.corners);
        Object.freeze(style);
    }
    static #text(text: DesignText): void {
        if (text.typographyStyle != null) {
            if (text.typographyStyle.overrides !== undefined) {
                if (text.typographyStyle.overrides.font != null) {
                    Object.freeze(text.typographyStyle.overrides.font);
                }
                Object.freeze(text.typographyStyle.overrides);
            }
            Object.freeze(text.typographyStyle);
        }
        for (const run of text.runs) {
            if (run.fills != null) {
                for (const paint of run.fills) {
                    this.#paint(paint);
                }
                Object.freeze(run.fills);
            }
            Object.freeze(run);
        }
        Object.freeze(text);
    }
}
