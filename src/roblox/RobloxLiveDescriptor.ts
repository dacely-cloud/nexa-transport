// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';
import { RobloxExecutionContext } from './RobloxExecutionContext';

/** The exact authorized workspace place revision used by a delivered preview. */
export interface RobloxLivePlace {
    readonly path: string;
    readonly sha256: string;
}

/** One pinned project module; no filesystem or account authority travels with its source. */
export interface RobloxLiveAssetModule {
    readonly name: string;
    readonly source: string;
}
/** A reusable Studio-native module and the explicit dependency revisions used by its preview. */
export interface RobloxLiveAsset {
    readonly entry: string;
    readonly modules: readonly RobloxLiveAssetModule[];
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
    readonly asset?: RobloxLiveAsset;
}

/** Bounds executable attachment metadata before a host authorizes its project scope. */
export class RobloxLiveDescriptorCodec {
    /** Parses only the explicit live-artifact contract. */
    public static parse(text: string): RobloxLiveDescriptor {
        if (new TextEncoder().encode(text).byteLength > 4 * 1024 * 1024) {
            throw new Error('Live descriptor exceeds 4 MiB');
        }
        const raw: unknown = JSON.parse(text);
        const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
            raw,
            ['format', 'version', 'name', 'entry', 'source'],
            ['executionContext', 'place', 'asset'],
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
            ...(fields['asset'] === undefined ? {} : { asset: this.asset(fields['asset']) }),
        });
    }

    /** Validates an immutable bounded module selection before any server builds or executes it. */
    public static asset(raw: unknown): RobloxLiveAsset {
        const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(raw, [
            'entry',
            'modules',
        ]);
        const entry: string = this.modulePath(RobloxSceneCodec.text(fields['entry'], 1024));
        const names: Set<string> = new Set();
        let total: number = 0;
        const modules: readonly RobloxLiveAssetModule[] = RobloxSceneCodec.array(
            fields['modules'],
            64,
        ).map((value: unknown): RobloxLiveAssetModule => {
            const module: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(value, [
                'name',
                'source',
            ]);
            const name: string = this.modulePath(RobloxSceneCodec.text(module['name'], 1024));
            if (names.has(name)) {
                throw new Error('Duplicate live asset module');
            }
            names.add(name);
            const source: string = RobloxSceneCodec.text(module['source'], 1024 * 1024);
            const bytes: number = new TextEncoder().encode(source).byteLength;
            total += bytes;
            if (bytes > 1024 * 1024 || total > 2 * 1024 * 1024) {
                throw new Error('Live asset modules exceed their source byte budget');
            }
            return Object.freeze({ name, source });
        });
        if (!names.has(entry)) {
            throw new Error('Live asset entry must be an included module');
        }
        return Object.freeze({ entry, modules: Object.freeze(modules) });
    }

    /** Keeps source-module names portable and within one project-relative namespace. */
    public static modulePath(path: string): string {
        this.#path(path);
        if (path.length > 1024 || !/\.luau?$/iu.test(path)) {
            throw new Error('Live asset modules must name project-relative Lua/Luau files');
        }
        return path;
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
