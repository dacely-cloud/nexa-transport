// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignSvgCss } from './DesignSvgCss.js';
import type { DesignSvgElement } from './DesignSvgXml.js';

/** Definitions inherit from their actual XML ancestors, independently of the element referencing them. */
export class DesignSvgImportStyles {
    #cache: WeakMap<DesignSvgElement, Readonly<Record<string, string>>> = new WeakMap();
    public constructor(
        public readonly css: DesignSvgCss,
        public readonly ancestors: ReadonlyMap<DesignSvgElement, readonly DesignSvgElement[]>,
    ) {}
    public definition(element: DesignSvgElement): Readonly<Record<string, string>> {
        const cached: Readonly<Record<string, string>> | undefined = this.#cache.get(element);
        if (cached !== undefined) {
            return cached;
        }
        const parents: readonly DesignSvgElement[] = this.ancestors.get(element) ?? [];
        const parent: DesignSvgElement | undefined = parents.at(-1);
        const inherited: Readonly<Record<string, string>> =
            parent === undefined ? {} : this.definition(parent);
        const style: Readonly<Record<string, string>> = this.css.resolve(
            element,
            parents,
            inherited,
        );
        this.#cache.set(element, style);
        return style;
    }
}
