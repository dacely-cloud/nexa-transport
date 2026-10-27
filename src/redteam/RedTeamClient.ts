// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { CallOptions } from '../interface/ClientOptions.js';
import { RedTeamCodec } from './RedTeamCodec.js';
import { RedTeamRequestCodec } from './RedTeamRequestCodec.js';
import { RedTeamMethod, RedTeamStatus } from './RedTeamTypes.js';
import type {
    RedTeamEffort,
    RedTeamSnapshot,
    RedTeamListPage,
    RedTeamStartRequest,
    RedTeamEffortRequest,
    RedTeamGetRequest,
    RedTeamListRequest,
    RedTeamUpdateRequest,
} from './RedTeamTypes.js';

/** Exact operation parameters for an authenticated gateway adapter. */
export interface RedTeamRequestMap {
    readonly 'redteam.start': RedTeamStartRequest;
    readonly 'redteam.list': RedTeamListRequest;
    readonly 'redteam.get': RedTeamGetRequest;
    readonly 'redteam.stop': RedTeamEffortRequest;
    readonly 'redteam.update': RedTeamUpdateRequest;
}
/** Network replies are untrusted until decoded. The adapter owns connection and cancellation. */
export interface RedTeamGateway {
    request<M extends RedTeamMethod>(
        method: M,
        params: RedTeamRequestMap[M],
        options: CallOptions,
    ): Promise<unknown>;
}

/** Validated effort controls over one authenticated connection; mutations are never replayed. */
export class RedTeamClient {
    readonly #gateway: RedTeamGateway;

    /** Borrow one authenticated gateway adapter and preserve its cancellation lifecycle. */
    public constructor(gateway: RedTeamGateway) {
        this.#gateway = gateway;
    }

    /** Validate and start an effort once; retries require the same durable effort identity. */
    public async start(
        request: RedTeamStartRequest,
        options: CallOptions = {},
    ): Promise<RedTeamEffort> {
        const params: RedTeamStartRequest = RedTeamRequestCodec.start(request);
        options.signal?.throwIfAborted();
        const effort: RedTeamEffort = RedTeamCodec.effort(
            await this.#gateway.request(RedTeamMethod.Start, params, options),
        );
        this.#identity(params.effortId, effort);
        return effort;
    }
    /** Read a bounded owner-scoped directory page and validate its continuation. */
    public async list(
        request: RedTeamListRequest,
        options: CallOptions = {},
    ): Promise<RedTeamListPage> {
        const params: RedTeamListRequest = RedTeamRequestCodec.list(request);
        options.signal?.throwIfAborted();
        const page: RedTeamListPage = RedTeamCodec.list(
            await this.#gateway.request(RedTeamMethod.List, params, options),
        );
        if (
            page.items.length > params.limit ||
            (page.next !== null && page.next === params.afterEffortId)
        ) {
            throw new TypeError('Invalid red team list continuation');
        }
        return page;
    }
    /** Read one exact revision page while preserving independent task and finding cursors. */
    public async get(
        request: RedTeamGetRequest,
        options: CallOptions = {},
    ): Promise<RedTeamSnapshot> {
        const params: RedTeamGetRequest = RedTeamRequestCodec.get(request);
        options.signal?.throwIfAborted();
        const snapshot: RedTeamSnapshot = RedTeamCodec.snapshot(
            await this.#gateway.request(RedTeamMethod.Get, params, options),
        );
        this.#identity(params.effortId, snapshot.effort);
        if (
            (params.revision !== null && snapshot.effort.revision !== params.revision) ||
            (snapshot.nextTaskCursor !== null && snapshot.nextTaskCursor === params.taskCursor) ||
            (snapshot.nextFindingCursor !== null &&
                snapshot.nextFindingCursor === params.findingCursor)
        ) {
            throw new TypeError('Red team ledger revision or cursor changed');
        }
        return snapshot;
    }
    /** Request durable Stop and validate the acknowledged effort lifecycle. */
    public async stop(
        request: RedTeamEffortRequest,
        options: CallOptions = {},
    ): Promise<RedTeamEffort> {
        const params: RedTeamEffortRequest = RedTeamRequestCodec.effort(request);
        options.signal?.throwIfAborted();
        const effort: RedTeamEffort = RedTeamCodec.effort(
            await this.#gateway.request(RedTeamMethod.Stop, params, options),
        );
        this.#identity(params.effortId, effort);
        if (effort.status !== RedTeamStatus.Stopping && effort.status !== RedTeamStatus.Stopped) {
            throw new TypeError('Red team stop was not acknowledged');
        }
        return effort;
    }
    /** Publish an owner change against its exact expected revision and validate the result. */
    public async update(
        request: RedTeamUpdateRequest,
        options: CallOptions = {},
    ): Promise<RedTeamEffort> {
        const params: RedTeamUpdateRequest = RedTeamRequestCodec.update(request);
        options.signal?.throwIfAborted();
        const effort: RedTeamEffort = RedTeamCodec.effort(
            await this.#gateway.request(RedTeamMethod.Update, params, options),
        );
        this.#identity(params.effortId, effort);
        if (BigInt(effort.revision) <= BigInt(params.expectedRevision)) {
            throw new TypeError('Red team update did not advance its revision');
        }
        return effort;
    }
    #identity(effortId: string, effort: RedTeamEffort): void {
        if (effort.effortId !== effortId) {
            throw new TypeError('Red team reply belongs to another effort');
        }
    }
}
