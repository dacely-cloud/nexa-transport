// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** A named dimension and one retained definition's authored value. */
export interface DesignVariantValue {
    readonly property: string;
    readonly value: string;
}
/** Ordered dimensions and the identity used when placing this reusable set. */
export interface DesignVariantSet {
    readonly properties: readonly string[];
    readonly defaultId: string | null;
}
/** A null source adds a property; existing names can be retained, renamed or omitted. */
export interface DesignVariantPropertyEdit {
    readonly from: string | null;
    readonly name: string;
}
