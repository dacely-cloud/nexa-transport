// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignStyle } from './DesignTypes.js';

/** Stable component authoring actions shared by native tools and the browser. */
export const DesignComponentAction = {
    Create: 'create',
    Place: 'place',
    Detach: 'detach',
    Override: 'override',
    Reset: 'reset',
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
export type DesignComponentCommand =
    | DesignComponentCreate
    | DesignComponentPlace
    | DesignComponentDetach
    | DesignComponentOverride
    | DesignComponentReset;
/** Owner identity is supplied by the authenticated adapter, never by this command. */
export interface DesignComponentRequest {
    readonly id: string;
    readonly expectedRevision: string;
    readonly commandId: string;
    readonly pageId: string;
    readonly command: DesignComponentCommand;
}
