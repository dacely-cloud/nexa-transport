// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Base paragraph direction is independent of physical left/center/right alignment. */
export const DesignTextDirection = { Auto: 'auto', Ltr: 'ltr', Rtl: 'rtl' } as const;
export type DesignTextDirection = (typeof DesignTextDirection)[keyof typeof DesignTextDirection];
/** Individual visual runs always have a concrete shaping direction. */
export type DesignResolvedTextDirection = Exclude<
    DesignTextDirection,
    typeof DesignTextDirection.Auto
>;
