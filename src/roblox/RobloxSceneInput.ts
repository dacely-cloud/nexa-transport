// SPDX-License-Identifier: Apache-2.0
import { RobloxSceneCodec } from './RobloxSceneCodec';
import { RobloxGuiClasses } from './RobloxGuiClasses';
import {
    RobloxInputEvent,
    RobloxInputDevice,
    RobloxPointerPhase,
    type RobloxPointerInput,
    type RobloxInputRequest,
    type RobloxInputObservation,
    type RobloxSceneNode,
} from './RobloxSceneTypes';

/** Shared validation for native input requests and delivered observations, never executable source. */
export class RobloxSceneInput {
    /** One native command chooses a single targeted, coordinate or focused text channel. */
    public static exclusive(
        targeted: boolean,
        coordinate: boolean,
        editing: boolean,
        keyboard: boolean = false,
        wheel: boolean = false,
    ): void {
        if (
            Number(targeted) +
                Number(coordinate) +
                Number(editing) +
                Number(keyboard) +
                Number(wheel) >
            1
        ) {
            throw new Error(
                'Choose one targeted input, coordinate point, text edit, keyboard or wheel gesture, not both',
            );
        }
    }
    public static requests(raw: unknown): readonly RobloxInputRequest[] {
        if (!Array.isArray(raw) || raw.length > 64) {
            throw new Error('Native input budget is 64 activations');
        }
        let previous: number = 0;
        return raw.map((value: unknown): RobloxInputRequest => {
            const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
                value,
                ['nodeId', 'at'],
                ['event', 'device', 'x', 'y', 'clickCount', 'pointer'],
            );
            const input: RobloxInputRequest = this.#request(fields, 60);
            if (input.at < previous) {
                throw new Error('Native inputs must be ordered by time');
            }
            previous = input.at;
            return Object.freeze(input);
        });
    }
    public static observations(
        raw: unknown,
        duration: number,
        nodes: ReadonlyMap<string, RobloxSceneNode>,
    ): readonly RobloxInputObservation[] {
        if (raw === undefined) {
            return [];
        }
        if (!Array.isArray(raw) || raw.length > 64) {
            throw new Error('Native input budget is 64 activations');
        }
        let previous: number = 0;
        return raw.map((value: unknown): RobloxInputObservation => {
            const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
                value,
                [
                    'nodeId',
                    'at',
                    'requestedAt',
                    'event',
                    'device',
                    'x',
                    'y',
                    'clickCount',
                    'accepted',
                ],
                ['pointer'],
            );
            const input: RobloxInputRequest = this.#request(fields, duration);
            const node: RobloxSceneNode | undefined = nodes.get(input.nodeId);
            if (
                !RobloxGuiClasses.button(node?.className) ||
                typeof fields['accepted'] !== 'boolean' ||
                input.at < previous
            ) {
                throw new Error('Invalid native input observation target/order');
            }
            previous = input.at;
            const requestedAt: number = RobloxSceneCodec.number(fields['requestedAt'], 0, input.at);
            if (input.at - requestedAt > 1 / 60 + 1e-8) {
                throw new Error('Native input dispatch exceeds one simulation frame');
            }
            return Object.freeze({
                nodeId: input.nodeId,
                at: input.at,
                requestedAt,
                event: input.event ?? RobloxInputEvent.Activated,
                device: input.device ?? RobloxInputDevice.Mouse,
                x: input.x ?? 0,
                y: input.y ?? 0,
                clickCount: input.clickCount ?? 0,
                accepted: fields['accepted'],
                ...(input.pointer === undefined ? {} : { pointer: input.pointer }),
            });
        });
    }
    static #request(
        fields: Readonly<Record<string, unknown>>,
        duration: number,
    ): RobloxInputRequest {
        const nodeId: string = RobloxSceneCodec.text(fields['nodeId'], 128);
        if (!/^native_\d+$/u.test(nodeId)) {
            throw new Error('Native input target requires a captured native node id');
        }
        const event: RobloxInputEvent =
            fields['event'] === undefined || fields['event'] === RobloxInputEvent.Activated
                ? RobloxInputEvent.Activated
                : fields['event'] === RobloxInputEvent.MouseButton1Click
                  ? RobloxInputEvent.MouseButton1Click
                  : fields['event'] === RobloxInputEvent.MouseButton1Down
                    ? RobloxInputEvent.MouseButton1Down
                    : fields['event'] === RobloxInputEvent.MouseButton1Up
                      ? RobloxInputEvent.MouseButton1Up
                      : this.#invalid();
        const device: RobloxInputDevice =
            fields['device'] === undefined || fields['device'] === RobloxInputDevice.Mouse
                ? RobloxInputDevice.Mouse
                : fields['device'] === RobloxInputDevice.Touch
                  ? RobloxInputDevice.Touch
                  : fields['device'] === RobloxInputDevice.Gamepad
                    ? RobloxInputDevice.Gamepad
                    : this.#invalid();
        if (event !== RobloxInputEvent.Activated && device !== RobloxInputDevice.Mouse) {
            throw new Error('Mouse button signals require mouse input');
        }
        const pointer: RobloxPointerInput | undefined =
            fields['pointer'] === undefined ? undefined : this.#pointer(fields['pointer']);
        if (
            pointer !== undefined &&
            (event !== RobloxInputEvent.Activated || device === RobloxInputDevice.Gamepad)
        ) {
            throw new Error('Pointer gestures require default activation and mouse or touch input');
        }
        return {
            nodeId,
            at: RobloxSceneCodec.number(fields['at'], 0, duration),
            event,
            device,
            x: RobloxSceneCodec.number(fields['x'] ?? 0, -32768, 32768, true),
            y: RobloxSceneCodec.number(fields['y'] ?? 0, -32768, 32768, true),
            clickCount: RobloxSceneCodec.number(fields['clickCount'] ?? 0, 0, 64, true),
            ...(pointer === undefined ? {} : { pointer }),
        };
    }
    static #pointer(raw: unknown): RobloxPointerInput {
        const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
            'phase',
            'id',
            'over',
        ]);
        const phase: RobloxPointerPhase =
            fields['phase'] === RobloxPointerPhase.Press
                ? RobloxPointerPhase.Press
                : fields['phase'] === RobloxPointerPhase.Move
                  ? RobloxPointerPhase.Move
                  : fields['phase'] === RobloxPointerPhase.Release
                    ? RobloxPointerPhase.Release
                    : fields['phase'] === RobloxPointerPhase.Cancel
                      ? RobloxPointerPhase.Cancel
                      : this.#invalid();
        if (typeof fields['over'] !== 'boolean') {
            throw new Error('Pointer hit evidence must be boolean');
        }
        return Object.freeze({
            phase,
            id: RobloxSceneCodec.number(fields['id'], 0, 4294967295, true),
            over: fields['over'],
        });
    }
    static #invalid(): never {
        throw new Error('Invalid native input event/device');
    }
}
