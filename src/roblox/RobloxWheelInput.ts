// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';

/** Native wheel rotation and host-adapted pixel travel are independent values. */
export interface RobloxWheelGesture {
    readonly x: number;
    readonly y: number;
    readonly rotation: number;
    readonly deltaX: number;
    readonly deltaY: number;
}

/** Validates untrusted wheel commands before they reach a retained native VM. */
export class RobloxWheelInput {
    /** Accepts one bounded device observation without a client-supplied target identity. */
    public static parse(raw: unknown): RobloxWheelGesture {
        const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
            'x',
            'y',
            'rotation',
            'deltaX',
            'deltaY',
        ]);
        return Object.freeze({
            x: RobloxSceneCodec.number(fields['x'], -32768, 32768, true),
            y: RobloxSceneCodec.number(fields['y'], -32768, 32768, true),
            rotation: RobloxSceneCodec.number(fields['rotation'], -64, 64),
            deltaX: RobloxSceneCodec.number(fields['deltaX'], -4096, 4096),
            deltaY: RobloxSceneCodec.number(fields['deltaY'], -4096, 4096),
        });
    }
}
