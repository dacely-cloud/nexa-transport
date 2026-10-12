// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignVariantValue, DesignVariantPropertyEdit } from './DesignVariantTypes.js';
import type { DesignStyle } from './DesignTypes.js';

/** Stable component authoring actions shared by native tools and the browser. */
export const DesignComponentAction = {
    Create: 'create',
    Place: 'place',
    Swap: 'swap',
    Detach: 'detach',
    Override: 'override',
    Reset: 'reset',
    CombineVariants: 'combine-variants',
    AddVariant: 'add-variant',
    SetVariant: 'set-variant',
    EditVariant: 'edit-variant',
    VariantProperties: 'variant-properties',
    ReleaseVariants: 'release-variants',
} as const;
export type DesignComponentAction =
    (typeof DesignComponentAction)[keyof typeof DesignComponentAction];
/** Converts selected sibling layers into one reusable definition. */
export interface DesignComponentCreate {
    readonly action: typeof DesignComponentAction.Create;
    readonly selection: readonly string[];
}
/** Places a linked instance on the active page, including definitions from another page. */
export interface DesignComponentPlace {
    readonly action: typeof DesignComponentAction.Place;
    readonly componentId: string;
    readonly x: number;
    readonly y: number;
    /** Treat x/y as the instance center; omitted preserves ordinary top-left placement. */
    readonly center?: boolean;
}
/** Changes a linked definition while retaining instance geometry and unambiguous layer overrides. */
export interface DesignComponentSwap {
    readonly action: typeof DesignComponentAction.Swap;
    readonly instanceId: string;
    readonly componentId: string;
}
/** Bakes rendered overrides and nested instances into editable authored layers. */
export interface DesignComponentDetach {
    readonly action: typeof DesignComponentAction.Detach;
    readonly selection: readonly string[];
}
/** An explicit null restores inheritance for the chosen field. */
export interface DesignComponentOverrideChanges {
    readonly name?: string | null;
    readonly text?: string | null;
    readonly style?: DesignStyle | null;
    readonly visible?: boolean | null;
}
/** Edits a reachable source layer within one linked instance. */
export interface DesignComponentOverride {
    readonly action: typeof DesignComponentAction.Override;
    readonly instanceId: string;
    readonly targetId: string;
    readonly changes: DesignComponentOverrideChanges;
}
/** A null target restores all inherited values; an ID resets one layer. */
export interface DesignComponentReset {
    readonly action: typeof DesignComponentAction.Reset;
    readonly instanceId: string;
    readonly targetId: string | null;
}
/** Groups sibling component definitions without replacing their authored identities. */
export interface DesignComponentCombineVariants {
    readonly action: typeof DesignComponentAction.CombineVariants;
    readonly selection: readonly string[];
    readonly name: string;
    readonly property: string;
}
/** Copies one set definition, allocating a distinct tuple and editable source layers. */
export interface DesignComponentAddVariant {
    readonly action: typeof DesignComponentAction.AddVariant;
    readonly componentSetId: string;
    readonly componentId: string | null;
}
/** Partial named choices select an existing variant while retaining other dimensions. */
export interface DesignComponentSetVariant {
    readonly action: typeof DesignComponentAction.SetVariant;
    readonly instanceId: string;
    readonly values: readonly DesignVariantValue[];
}
/** Replaces a definition's complete dimension tuple without changing linked instance identities. */
export interface DesignComponentEditVariant {
    readonly action: typeof DesignComponentAction.EditVariant;
    readonly componentId: string;
    readonly values: readonly DesignVariantValue[];
}
/** Retains, renames, adds or removes dimensions in one atomic set and definition edit. */
export interface DesignComponentVariantProperties {
    readonly action: typeof DesignComponentAction.VariantProperties;
    readonly componentSetId: string;
    readonly properties: readonly DesignVariantPropertyEdit[];
}
/** Restores a group of standalone reusable definitions; linked instances remain intact. */
export interface DesignComponentReleaseVariants {
    readonly action: typeof DesignComponentAction.ReleaseVariants;
    readonly componentSetId: string;
}
/** Commands whose storage and geometry are planned by the shared variant editor. */
export type DesignVariantCommand =
    | DesignComponentCombineVariants
    | DesignComponentAddVariant
    | DesignComponentSetVariant
    | DesignComponentEditVariant
    | DesignComponentVariantProperties
    | DesignComponentReleaseVariants;
export type DesignComponentCommand =
    | DesignComponentCreate
    | DesignComponentPlace
    | DesignComponentSwap
    | DesignComponentDetach
    | DesignComponentOverride
    | DesignComponentReset
    | DesignVariantCommand;
/** Owner identity is supplied by the authenticated adapter, never by this command. */
export interface DesignComponentRequest {
    readonly id: string;
    readonly expectedRevision: string;
    readonly commandId: string;
    readonly pageId: string;
    readonly command: DesignComponentCommand;
}
