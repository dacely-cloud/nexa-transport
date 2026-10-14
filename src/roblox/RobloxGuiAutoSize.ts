// SPDX-License-Identifier: Apache-2.0

import {
    RobloxGuiBoxLayout,
    type RobloxGuiBoxGroup,
    type RobloxGuiSize,
} from './RobloxGuiBoxLayout';
import { RobloxGuiClasses } from './RobloxGuiClasses';
import { RobloxGuiText } from './RobloxGuiText';
import { RobloxGuiPadding, type RobloxGuiInsets } from './RobloxGuiPadding';
import { RobloxGuiSizeConstraint, type RobloxGuiSizeLimits } from './RobloxGuiSizeConstraint';
import { RobloxGuiAspectRatio, type RobloxGuiAspectConstraint } from './RobloxGuiAspectRatio';
import { RobloxProperties } from './RobloxSceneRuntime';
import {
    RobloxTextMeasurement,
    type RobloxTextBounds,
    type RobloxTextMetrics,
} from './RobloxTextMetrics';
import type { RobloxSceneNode, RobloxValue } from './RobloxSceneTypes';

/** Per-observation intrinsic layout, independent of previous seek direction or viewport. */
export class RobloxGuiAutoSize {
    readonly #children: ReadonlyMap<string | null, readonly RobloxSceneNode[]>;
    readonly #values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>;
    readonly #metrics: RobloxTextMetrics | undefined;
    readonly #cache: Map<string, Map<string, RobloxGuiSize>> = new Map();
    readonly #limits: Map<string, RobloxGuiSizeLimits | null> = new Map();
    readonly #aspects: Map<string, RobloxGuiAspectConstraint | null> = new Map();
    #work: number = 0;
    public constructor(
        children: ReadonlyMap<string | null, readonly RobloxSceneNode[]>,
        values: ReadonlyMap<string, Readonly<Record<string, RobloxValue>>>,
        metrics: RobloxTextMetrics | undefined,
    ) {
        this.#children = children;
        this.#values = values;
        this.#metrics = metrics;
    }

    /** Fits content on enabled axes, respecting authored minimum and available parent capacity. */
    public resolve(
        node: RobloxSceneNode,
        minimum: RobloxGuiSize,
        capacity: RobloxGuiSize,
    ): RobloxGuiSize {
        let limits: RobloxGuiSizeLimits | null | undefined = this.#limits.get(node.id);
        if (limits === undefined) {
            limits = RobloxGuiSizeConstraint.limits(
                this.#children.get(node.id) ?? [],
                this.#values,
            );
            this.#limits.set(node.id, limits);
        }
        minimum = RobloxGuiSizeConstraint.apply(minimum, limits);
        let aspect: RobloxGuiAspectConstraint | null | undefined = this.#aspects.get(node.id);
        if (aspect === undefined) {
            aspect = RobloxGuiAspectRatio.read(this.#children.get(node.id) ?? [], this.#values);
            this.#aspects.set(node.id, aspect);
        }
        const properties: Readonly<Record<string, RobloxValue>> =
            this.#values.get(node.id) ?? node.properties;
        const value: RobloxValue | undefined = properties['AutomaticSize'];
        const automatic: number =
            typeof value === 'object' && value.kind === 'Enum' ? value.value : 0;
        if (automatic === 0) {
            return this.#constrain(minimum, capacity, limits, aspect);
        }
        const key: string = [minimum.width, minimum.height, capacity.width, capacity.height].join(
            ',',
        );
        const cache: Map<string, RobloxGuiSize> =
            this.#cache.get(node.id) ?? new Map<string, RobloxGuiSize>();
        this.#cache.set(node.id, cache);
        const cached: RobloxGuiSize | undefined = cache.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const x: boolean = automatic === 1 || automatic === 3;
        const y: boolean = automatic === 2 || automatic === 3;
        const maximum: RobloxGuiSize = RobloxGuiSizeConstraint.apply(
            {
                width: Math.max(minimum.width, capacity.width),
                height: Math.max(minimum.height, capacity.height),
            },
            limits,
        );
        let current: RobloxGuiSize = minimum;
        for (let iteration: number = 0; iteration < 64; iteration += 1) {
            this.#work += 1;
            if (this.#work > 131072) {
                throw new Error('Automatic GUI sizing exceeds the layout work budget');
            }
            const children: readonly RobloxSceneNode[] = this.#children.get(node.id) ?? [];
            const padding: RobloxGuiInsets = RobloxGuiPadding.resolve(
                children,
                this.#values,
                current.width,
                current.height,
            );
            const available: RobloxGuiSize = {
                width: Math.max(
                    0,
                    (x ? maximum.width : current.width) - padding.left - padding.right,
                ),
                height: Math.max(
                    0,
                    (y ? maximum.height : current.height) - padding.top - padding.bottom,
                ),
            };
            const group: RobloxGuiBoxGroup = RobloxGuiBoxLayout.group(
                children,
                this.#values,
                current.width,
                current.height,
                (child: RobloxSceneNode, authored: RobloxGuiSize): RobloxGuiSize =>
                    this.resolve(child, authored, available),
            );
            const bounds: RobloxTextBounds = this.#text(
                node,
                properties,
                available.width,
                automatic,
                minimum.width - padding.left - padding.right,
            );
            const next: RobloxGuiSize = RobloxGuiSizeConstraint.apply(
                {
                    width: x
                        ? Math.max(
                              minimum.width,
                              Math.min(
                                  maximum.width,
                                  Math.fround(
                                      Math.max(
                                          group.content.width,
                                          bounds.width + padding.left + padding.right,
                                      ),
                                  ),
                              ),
                          )
                        : minimum.width,
                    height: y
                        ? Math.max(
                              minimum.height,
                              Math.min(
                                  maximum.height,
                                  Math.fround(
                                      Math.max(
                                          group.content.height,
                                          bounds.height + padding.top + padding.bottom,
                                      ),
                                  ),
                              ),
                          )
                        : minimum.height,
                },
                limits,
            );
            if (next.width === current.width && next.height === current.height) {
                const result: RobloxGuiSize = this.#constrain(next, capacity, limits, aspect);
                cache.set(key, result);
                return result;
            }
            current = next;
        }
        throw new Error('Automatic GUI sizing did not converge within 64 layout passes');
    }

    #constrain(
        size: RobloxGuiSize,
        capacity: RobloxGuiSize,
        limits: RobloxGuiSizeLimits | null,
        aspect: RobloxGuiAspectConstraint | null,
    ): RobloxGuiSize {
        if (limits === null && aspect === null) {
            return size;
        }
        const result: RobloxGuiSize = RobloxGuiSizeConstraint.apply(
            RobloxGuiAspectRatio.apply(size, capacity, aspect),
            limits,
        );
        return {
            ...result,
            ...(limits === null ? {} : { limits }),
            ...(aspect === null ? {} : { aspect }),
        };
    }

    #text(
        node: RobloxSceneNode,
        properties: Readonly<Record<string, RobloxValue>>,
        width: number,
        automatic: number,
        minimumWidth: number,
    ): RobloxTextBounds {
        if (!RobloxGuiClasses.text(node.className)) {
            return { width: 0, height: 0, lines: 0 };
        }
        if (this.#metrics === undefined) {
            throw new Error('Automatic text sizing requires native font metrics');
        }
        const text: string = RobloxGuiText.content(node.className, properties);
        const size: number = RobloxProperties.number(properties, 'TextSize');
        const wrapped: boolean = properties['TextWrapped'] === true;
        const bounds: RobloxTextBounds = RobloxTextMeasurement.measure(
            this.#metrics,
            text,
            size,
            wrapped ? width : null,
        );
        if (automatic === 2 && !wrapped) {
            return { width: bounds.width, height: 0, lines: bounds.lines };
        }
        if (automatic === 3 && wrapped) {
            const final: RobloxTextBounds = RobloxTextMeasurement.measure(
                this.#metrics,
                text,
                size,
                Math.max(minimumWidth, Math.min(width, bounds.width)),
            );
            return { width: bounds.width, height: final.height, lines: final.lines };
        }
        return bounds;
    }
}
