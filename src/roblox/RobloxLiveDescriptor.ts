// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';
import { RobloxExecutionContext } from './RobloxExecutionContext';

/** A delivered authored revision, with no installed dependency payloads. */
export interface RobloxLiveDescriptor {
    readonly executionContext: RobloxExecutionContext;
    readonly format: 'nexa.roblox.live';
    readonly version: 1;
    readonly name: string;
    readonly entry: string;
    readonly source: string;
}

/** Bounds executable attachment metadata before a host authorizes its project scope. */
export class RobloxLiveDescriptorCodec {
    /** Parses only the explicit live-artifact contract. */
    public static parse(text: string): RobloxLiveDescriptor {
        if (new TextEncoder().encode(text).byteLength > 2 * 1024 * 1024) {
            throw new Error('Live descriptor exceeds 2 MiB');
        }
        const raw: unknown = JSON.parse(text);
        const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
            raw,
            ['format', 'version', 'name', 'entry', 'source'],
            ['executionContext'],
        );
        if (fields['format'] !== 'nexa.roblox.live' || fields['version'] !== 1) {
            throw new Error('Invalid live descriptor');
        }
        const executionContext: unknown =
            fields['executionContext'] === undefined
                ? RobloxExecutionContext.Server
                : fields['executionContext'];
        if (
            executionContext !== RobloxExecutionContext.Server &&
            executionContext !== RobloxExecutionContext.Client
        ) {
            throw new Error('Live execution context must be server or client');
        }
        const entry: string = RobloxSceneCodec.text(fields['entry'], 1024);
        if (
            entry.startsWith('/') ||
            entry.includes('\\') ||
            entry.includes('\0') ||
            entry.split('/').some((part: string): boolean => part === '..' || part === '') ||
            !entry.endsWith('.luau')
        ) {
            throw new Error('Live entry must be a project-relative Luau path');
        }
        const source: string = RobloxSceneCodec.text(fields['source'], 1024 * 1024);
        if (new TextEncoder().encode(source).byteLength > 1024 * 1024) {
            throw new Error('Live source exceeds 1 MiB');
        }
        return Object.freeze({
            executionContext,
            format: 'nexa.roblox.live',
            version: 1,
            name: RobloxSceneCodec.text(fields['name'], 160),
            entry,
            source,
        });
    }
}
