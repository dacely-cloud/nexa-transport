// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { RedTeamInput } from './RedTeamInput.js';
import { RedTeamLimits, RedTeamSourceKind } from './RedTeamTypes.js';
import type {
    RedTeamSource,
    RedTeamStartRequest,
    RedTeamEffortRequest,
    RedTeamGetRequest,
    RedTeamUpdateRequest,
    RedTeamListRequest,
} from './RedTeamTypes.js';

/** Validates controls without accepting caller-supplied ownership or tool permissions. */
export class RedTeamRequestCodec {
    /** Admit exact GitHub repository roots or a bounded selection of uploaded file identities. */
    public static source(raw: unknown): RedTeamSource {
        const shape: Readonly<Record<string, unknown>> = RedTeamInput.record(
            raw,
            ['kind'],
            ['url', 'fileIds'],
        );
        if (shape['kind'] === RedTeamSourceKind.GitHub) {
            const value: Readonly<Record<string, unknown>> = RedTeamInput.record(raw, [
                'kind',
                'url',
            ]);
            const url: string = RedTeamInput.text(value['url'], 2048);
            /** Repository roots are admitted; the server enforces fetch and checkout policy. */
            if (
                !/^https:\/\/github\.com\/[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9._-]{1,100}\/?$/u.test(
                    url,
                )
            ) {
                throw new TypeError('Expected an HTTPS GitHub repository URL');
            }
            const parsed: URL = new URL(url);
            if (parsed.href !== url) {
                throw new TypeError('Invalid GitHub repository path');
            }
            return { kind: RedTeamSourceKind.GitHub, url };
        }
        if (shape['kind'] === RedTeamSourceKind.Files) {
            const value: Readonly<Record<string, unknown>> = RedTeamInput.record(raw, [
                'kind',
                'fileIds',
            ]);
            const fileIds: readonly string[] = RedTeamInput.list(
                value['fileIds'],
                RedTeamLimits.maxFiles,
                (file: unknown): string => RedTeamInput.id(file),
            );
            if (fileIds.length === 0) {
                throw new RangeError('Select at least one uploaded file');
            }
            RedTeamInput.unique(fileIds);
            return { kind: RedTeamSourceKind.Files, fileIds };
        }
        throw new TypeError('Unsupported red team source');
    }
    /** Default parallelism is applied at the boundary, not left to each consumer. */
    public static start(raw: unknown): RedTeamStartRequest {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(
            raw,
            ['effortId', 'title', 'source', 'rules'],
            ['parallelism'],
        );
        return {
            effortId: RedTeamInput.id(value['effortId']),
            title: RedTeamInput.text(value['title'], 256),
            source: this.source(value['source']),
            rules: RedTeamInput.text(value['rules'], RedTeamLimits.rulesCharacters),
            parallelism: Object.hasOwn(value, 'parallelism')
                ? RedTeamInput.integer(value['parallelism'], 1, RedTeamLimits.maxParallelism)
                : RedTeamLimits.defaultParallelism,
        };
    }
    /** Decode an effort identity without accepting caller-selected account or session authority. */
    public static effort(raw: unknown): RedTeamEffortRequest {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(raw, ['effortId']);
        return { effortId: RedTeamInput.id(value['effortId']) };
    }
    /** Latest reads use null cursors; continuing pages must name their saved revision. */
    public static get(raw: unknown): RedTeamGetRequest {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(raw, [
            'effortId',
            'revision',
            'taskCursor',
            'findingCursor',
        ]);
        const revision: string | null =
            value['revision'] === null ? null : RedTeamInput.decimal(value['revision']);
        const taskCursor: string | null =
            value['taskCursor'] === null ? null : RedTeamInput.id(value['taskCursor']);
        const findingCursor: string | null =
            value['findingCursor'] === null ? null : RedTeamInput.id(value['findingCursor']);
        if (revision === null && (taskCursor !== null || findingCursor !== null)) {
            throw new TypeError('Red team continuations require a pinned revision');
        }
        return {
            effortId: RedTeamInput.id(value['effortId']),
            revision,
            taskCursor,
            findingCursor,
        };
    }
    /** Require an exact expected revision and at least one bounded owner-selected change. */
    public static update(raw: unknown): RedTeamUpdateRequest {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(
            raw,
            ['effortId', 'expectedRevision'],
            ['parallelism', 'rules'],
        );
        const parallelism: number | undefined = Object.hasOwn(value, 'parallelism')
            ? RedTeamInput.integer(value['parallelism'], 1, RedTeamLimits.maxParallelism)
            : undefined;
        const rules: string | undefined = Object.hasOwn(value, 'rules')
            ? RedTeamInput.text(value['rules'], RedTeamLimits.rulesCharacters)
            : undefined;
        if (parallelism === undefined && rules === undefined) {
            throw new TypeError('Red team update is empty');
        }
        return {
            effortId: RedTeamInput.id(value['effortId']),
            expectedRevision: RedTeamInput.decimal(value['expectedRevision']),
            ...(parallelism === undefined ? {} : { parallelism }),
            ...(rules === undefined ? {} : { rules }),
        };
    }
    /** Decode a bounded effort directory request with an exclusive identity cursor. */
    public static list(raw: unknown): RedTeamListRequest {
        const value: Readonly<Record<string, unknown>> = RedTeamInput.record(raw, [
            'afterEffortId',
            'limit',
        ]);
        return {
            afterEffortId:
                value['afterEffortId'] === null ? null : RedTeamInput.id(value['afterEffortId']),
            limit: RedTeamInput.integer(value['limit'], 1, RedTeamLimits.pageSize),
        };
    }
}
