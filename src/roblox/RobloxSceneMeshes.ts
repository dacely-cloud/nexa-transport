// SPDX-License-Identifier: Apache-2.0

import { RobloxSceneCodec } from './RobloxSceneCodec';
import { RobloxMeshDecoder } from './RobloxMeshDecoder';
import type { RobloxMeshData } from './RobloxMeshTypes';
import type { RobloxScene } from './RobloxSceneTypes';
import { RobloxContentId } from './RobloxContentId';

/** Original FileMesh content, with authenticated download provenance retained separately from geometry. */
export interface RobloxSceneMeshResource {
    readonly base64: string;
    readonly sha256: string;
}
/** One bounded immutable resource set shared by every MeshPart in a portable scene. */
export type RobloxSceneMeshTable = Readonly<Record<string, RobloxSceneMeshResource>>;

/** Portable mesh trust boundary and request-local decoded buffers; no asset network or disk access. */
export class RobloxSceneMeshes {
    public static readonly maximumBytes: number = 2 * 1024 * 1024;
    static readonly #decoded: WeakMap<RobloxSceneMeshResource, RobloxMeshData> = new WeakMap();
    static readonly #validated: WeakMap<
        Readonly<Record<string, unknown>>,
        RobloxSceneMeshResource
    > = new WeakMap();

    /** Only real Roblox mesh content identities are accepted, with no traversal or arbitrary URLs. */
    public static uri(value: string): boolean {
        return (
            RobloxContentId.asset(value) !== null ||
            (value.length <= 512 &&
                /^rbxasset:\/\/(?:meshes|heads|avatar|models)\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.mesh$/iu.test(
                    value,
                ) &&
                !value.includes('..'))
        );
    }

    /** Checks all file contents once, before captures or GPU allocations can consume them. */
    public static decode(raw: unknown): RobloxSceneMeshTable | undefined {
        if (raw === undefined) {
            return undefined;
        }
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
            throw new Error('Invalid Roblox scene mesh table');
        }
        const fields: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(
            raw,
            [],
            Object.keys(raw),
        );
        const entries: readonly [string, unknown][] = Object.entries(fields);
        if (entries.length > 16) {
            throw new Error('Roblox scene mesh resource budget exceeds 16 assets');
        }
        const output: Record<string, RobloxSceneMeshResource> = {};
        let bytes: number = 0;
        for (const [uri, value] of entries) {
            if (!this.uri(uri)) {
                throw new Error('Invalid Roblox scene mesh URI');
            }
            const record: Readonly<Record<string, unknown>> = RobloxSceneCodec.record(value, [
                'base64',
                'sha256',
            ]);
            const base64: string = RobloxSceneCodec.text(record['base64'], 2800000);
            const sha256: string = RobloxSceneCodec.text(record['sha256'], 64);
            if (
                base64.length % 4 !== 0 ||
                !/^[A-Za-z0-9+/]*={0,2}$/u.test(base64) ||
                !/^[a-f0-9]{64}$/u.test(sha256)
            ) {
                throw new Error('Invalid Roblox scene mesh encoding or provenance');
            }
            bytes +=
                (base64.length / 4) * 3 -
                (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
            if (bytes > this.maximumBytes) {
                throw new Error('Roblox scene meshes exceed 2 MiB');
            }
            const cached: RobloxSceneMeshResource | undefined = this.#validated.get(record);
            const resource: RobloxSceneMeshResource =
                cached?.base64 === base64 && cached.sha256 === sha256
                    ? cached
                    : Object.freeze({ base64, sha256 });
            if (!this.#decoded.has(resource)) {
                const binary: string = atob(base64);
                const data: Uint8Array<ArrayBuffer> = Uint8Array.from(
                    binary,
                    (character: string): number => character.charCodeAt(0),
                );
                this.#decoded.set(resource, RobloxMeshDecoder.decode(data));
            }
            this.#validated.set(record, resource);
            // Normalized descriptors can pass through live-state decoding without reallocating geometry.
            this.#validated.set(RobloxSceneCodec.record(resource, ['base64', 'sha256']), resource);
            output[uri] = resource;
        }
        return Object.freeze(output);
    }

    /** Returns the shared decoded source; missing bytes fail rather than drawing a placeholder block. */
    public static get(scene: RobloxScene, uri: string): RobloxMeshData {
        const resource: RobloxSceneMeshResource | undefined = scene.meshes?.[uri];
        const decoded: RobloxMeshData | undefined =
            resource === undefined ? undefined : this.#decoded.get(resource);
        if (decoded === undefined) {
            throw new Error('Original Roblox mesh bytes are missing: ' + uri);
        }
        return decoded;
    }
}
