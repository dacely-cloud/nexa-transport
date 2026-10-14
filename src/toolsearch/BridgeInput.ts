// SPDX-License-Identifier: Apache-2.0
import type { JsonValue } from '../protocol/Protocol.js';

/** Portable bridge envelope used by execution and observation of the same call. */
export interface ToolCallInput {
    readonly name: string;
    readonly arguments?: JsonValue;
}

/** JSON dictionary retained without weakening recursive value types. */
interface BridgeJsonObject {
    readonly [key: string]: JsonValue;
}

/** JSON objects exclude arrays and null at the external envelope boundary. */
function isJsonObject(value: JsonValue | undefined): value is BridgeJsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Remove redundant bridge envelopes before risk assessment, authorization and dispatch. */
export function resolveBridgeInput(input: ToolCallInput): ToolCallInput | null {
    let target: ToolCallInput = input;
    for (let depth: number = 0; depth < 8; depth += 1) {
        if (target.name !== 'tool_call') {
            return target;
        }
        const envelope: JsonValue | undefined = target.arguments;
        if (!isJsonObject(envelope)) {
            return null;
        }
        if (typeof envelope['name'] !== 'string' || envelope['name'].length === 0) {
            return null;
        }
        if (Object.hasOwn(envelope, 'arguments')) {
            if (
                Object.keys(envelope).some(
                    (key: string): boolean => key !== 'name' && key !== 'arguments',
                )
            ) {
                return null;
            }
            target = { name: envelope['name'], arguments: envelope['arguments'] ?? {} };
        } else {
            const args: Record<string, JsonValue> = Object.fromEntries(
                Object.entries(envelope).filter(
                    ([key]: [string, JsonValue]): boolean => key !== 'name',
                ),
            );
            target = { name: envelope['name'], arguments: args };
        }
    }
    return null;
}
