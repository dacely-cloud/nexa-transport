// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';
import { RobloxExecutionContext } from './RobloxExecutionContext';

/** The exact authorized workspace place revision used by a delivered preview. */
export interface RobloxLivePlace {
    readonly path: string;
    readonly sha256: string;
}

/** A delivered authored revision, with no installed dependency payloads. */
export interface RobloxLiveDescriptor {
    readonly executionContext: RobloxExecutionContext;
    readonly format: 'nexa.roblox.live';
    readonly version: 1;
    readonly name: string;
    readonly entry: string;
    readonly source: string;
    readonly place?: RobloxLivePlace;
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
            ['executionContext', 'place'],
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
        this.#path(entry);
        if (!/\.luau$/iu.test(entry)) {
            throw new Error('Live entry must be a project-relative Luau path');
        }
        const source: string = RobloxSceneCodec.text(fields['source'], 1024 * 1024);
        if (new TextEncoder().encode(source).byteLength > 1024 * 1024) {
            throw new Error('Live source exceeds 1 MiB');
        }
        let place: RobloxLivePlace | undefined;
        if (fields['place'] !== undefined) {
            const rawPlace: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
                fields['place'],
                ['path', 'sha256'],
            );
            const path: string = this.placePath(RobloxSceneCodec.text(rawPlace['path'], 1024));
            const sha256: unknown = rawPlace['sha256'];
            if (typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(sha256)) {
                throw new Error('Live place requires an exact SHA-256 revision');
            }
            place = Object.freeze({ path, sha256 });
        }
        return Object.freeze({
            executionContext,
            format: 'nexa.roblox.live',
            version: 1,
            name: RobloxSceneCodec.text(fields['name'], 160),
            entry,
            source,
            ...(place === undefined ? {} : { place }),
        });
    }

    /** Validates portable workspace place paths before host filesystem authorization. */
    public static placePath(path: string): string {
        this.#path(path);
        if (path.length > 1024 || !/\.rbxlx?$/iu.test(path)) {
            throw new Error('Live place must name a project-relative .rbxl or .rbxlx file');
        }
        return path;
    }

    static #path(path: string): void {
        if (
            !path ||
            path.startsWith('/') ||
            /[\\:]/u.test(path) ||
            path.includes('\0') ||
            path
                .split('/')
                .some((part: string): boolean => part === '..' || part === '.' || part === '')
        ) {
            throw new Error('Live paths must be canonical project-relative paths');
        }
    }
}
