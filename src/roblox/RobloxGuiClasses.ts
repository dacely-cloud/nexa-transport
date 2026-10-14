// SPDX-License-Identifier: Apache-2.0

import type { RobloxClass } from './RobloxSceneTypes';

/** Shared projected GuiObject identities, independent of image/text painting. */
export class RobloxGuiClasses {
    /** Classes that participate in GUI parenting and layout. */
    public static readonly objects: readonly RobloxClass[] = [
        'Frame',
        'ScrollingFrame',
        'TextLabel',
        'TextButton',
        'TextBox',
        'ImageLabel',
        'ImageButton',
    ];
    /** Native GuiButton subclasses accept logical activations and timeline triggers. */
    public static button(className: RobloxClass | undefined): boolean {
        return className === 'TextButton' || className === 'ImageButton';
    }
    /** Image controls share sprite, sampling and scale properties. */
    public static image(className: RobloxClass): boolean {
        return className === 'ImageLabel' || className === 'ImageButton';
    }
    /** Only text controls read text properties or use contextual text strokes. */
    public static text(className: RobloxClass): boolean {
        return className === 'TextLabel' || className === 'TextButton' || className === 'TextBox';
    }
}
