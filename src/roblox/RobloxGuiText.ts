// SPDX-License-Identifier: Apache-2.0

import type { RobloxClass, RobloxValue } from './RobloxSceneTypes';

/** TextBox placeholders share painting and measurement with their displayed text. */
export class RobloxGuiText {
    /** Selects the placeholder only when a TextBox's actual text is empty. */
    public static placeholder(
        className: RobloxClass,
        properties: Readonly<Record<string, RobloxValue>>,
    ): boolean {
        return className === 'TextBox' && properties['Text'] === '';
    }
    /** Returns the text currently visible on a native text control. */
    public static content(
        className: RobloxClass,
        properties: Readonly<Record<string, RobloxValue>>,
    ): string {
        const value: RobloxValue | undefined =
            properties[this.placeholder(className, properties) ? 'PlaceholderText' : 'Text'];
        return typeof value === 'string' ? value : '';
    }
}
