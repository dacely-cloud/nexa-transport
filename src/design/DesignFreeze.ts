// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    DesignDocument,
    DesignNode,
    DesignStyle,
    DesignPaint,
    DesignText,
} from './DesignTypes.js';

/** Decoded state is immutable at runtime as well as in TypeScript. */
export class DesignFreeze {
    /** Freezes the complete validated document without touching external input objects. */
    public static document(document: DesignDocument): DesignDocument {
        for (const node of document.nodes) {
            this.node(node);
        }
        for (const page of document.pages) {
            Object.freeze(page);
        }
        for (const token of document.tokens) {
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
        this.#style(node.style);
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
        for (const stop of paint.stops) {
            Object.freeze(stop);
        }
        Object.freeze(paint);
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
        for (const run of text.runs) {
            Object.freeze(run);
        }
        Object.freeze(text);
    }
}
