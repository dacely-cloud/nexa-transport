// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from '../WorkflowInput.js';
import type {
    WorkflowRunArtifact,
    WorkflowRunArtifactRequest,
    WorkflowRunArtifactPage,
    WorkflowArtifactListRequest,
    WorkflowArtifactCursor,
} from './RunArtifactTypes.js';

/** Strict bounded artifact requests cannot supply paths, URLs, media IDs or another account. */
export class WorkflowRunArtifactCodec {
    public static readonly chunkBytes: number = 262_144;
    public static readonly maxBytes: number = 32 * 1024 * 1024;
    /** A listing cannot address another account or introduce database query operators. */
    public static list(raw: unknown): WorkflowArtifactListRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'after',
            'limit',
        ]);
        const limit: unknown = value['limit'];
        if (typeof limit !== 'number' || !Number.isSafeInteger(limit) || limit < 1 || limit > 6) {
            throw new Error('List between 1 and 6 artifact publications');
        }
        let after: WorkflowArtifactCursor | null = null;
        if (value['after'] !== null) {
            const cursor: Readonly<Record<string, unknown>> = WorkflowInput.record(value['after'], [
                'nodeId',
                'invocationId',
            ]);
            after = {
                nodeId: WorkflowInput.id(cursor['nodeId']),
                invocationId: WorkflowInput.id(cursor['invocationId']),
            };
        }
        return { runId: WorkflowInput.id(value['runId']), after, limit };
    }
    /** Validates public metadata before allocating an output buffer. */
    public static artifact(raw: unknown): WorkflowRunArtifact {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'artifactId',
            'name',
            'contentType',
            'bytes',
            'sha256',
            'expiresAtMs',
        ]);
        const bytes: unknown = value['bytes'];
        const sha256: unknown = value['sha256'];
        const expires: unknown = value['expiresAtMs'];
        if (
            typeof bytes !== 'string' ||
            !/^[1-9][0-9]{0,8}$/u.test(bytes) ||
            BigInt(bytes) > BigInt(this.maxBytes) ||
            typeof sha256 !== 'string' ||
            !/^[a-f0-9]{64}$/u.test(sha256) ||
            (expires !== null &&
                (typeof expires !== 'string' || !/^(0|[1-9][0-9]{0,15})$/u.test(expires)))
        ) {
            throw new Error('Invalid workflow artifact metadata');
        }
        return {
            artifactId: WorkflowInput.id(value['artifactId']),
            name: WorkflowInput.text(value['name'], 256),
            contentType: WorkflowInput.text(value['contentType'], 128),
            bytes,
            sha256,
            expiresAtMs: expires,
        };
    }
    /** Rejects oversized or malformed wire fragments before base64 decoding. */
    public static page(raw: unknown): WorkflowRunArtifactPage {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'artifactId',
            'offset',
            'artifact',
            'base64',
            'nextOffset',
        ]);
        const request: WorkflowRunArtifactRequest = this.request({
            runId: value['runId'],
            artifactId: value['artifactId'],
            offset: value['offset'],
        });
        const base64: unknown = value['base64'];
        const nextOffset: unknown = value['nextOffset'];
        if (
            typeof base64 !== 'string' ||
            base64.length > Math.ceil(this.chunkBytes / 3) * 4 ||
            base64.length % 4 !== 0 ||
            !/^[A-Za-z0-9+/]*={0,2}$/u.test(base64) ||
            (nextOffset !== null &&
                (typeof nextOffset !== 'number' ||
                    !Number.isSafeInteger(nextOffset) ||
                    nextOffset <= request.offset ||
                    nextOffset > this.maxBytes))
        ) {
            throw new Error('Invalid workflow artifact fragment');
        }
        return { ...request, artifact: this.artifact(value['artifact']), base64, nextOffset };
    }
    /** Offsets are byte positions, not base64 character positions. */
    public static request(raw: unknown): WorkflowRunArtifactRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'artifactId',
            'offset',
        ]);
        const offset: unknown = value['offset'];
        if (
            typeof offset !== 'number' ||
            !Number.isSafeInteger(offset) ||
            offset < 0 ||
            offset > this.maxBytes
        ) {
            throw new Error('Invalid workflow artifact offset');
        }
        return {
            runId: WorkflowInput.id(value['runId']),
            artifactId: WorkflowInput.id(value['artifactId']),
            offset,
        };
    }
}
