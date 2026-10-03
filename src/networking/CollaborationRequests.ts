// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    CollaborationOp,
    type CollaborationCall,
    type CollaborationPacket,
    type CollaborationReply,
    type CollaborationResponse,
} from '../company/CompanyCollaborationProtocol.js';
import { CompanyProjectOp } from '../company/CompanyProjectProtocol.js';

interface Pending {
    readonly request: CollaborationCall;
    readonly resolve: (packet: CollaborationReply) => void;
    readonly reject: (error: Error) => void;
    readonly timer: ReturnType<typeof setTimeout>;
}
interface Watch {
    readonly grantId: string;
    readonly projectId: string | undefined;
    readonly channel: 'project' | 'office';
    readonly listener: (packet: CollaborationResponse) => void;
    readonly fail: (error: Error) => void;
    readonly leave: () => void;
    readonly timer: ReturnType<typeof setTimeout>;
}

/** Correlates private scoped replies and owns bounded subscription lifetimes. Never replays commands. */
export class CollaborationRequests {
    readonly #pending = new Map<string, Pending>();
    readonly #watches = new Map<string, Watch>();

    /** Register before send, preserving a caller-supplied idempotency key for explicit retries. */
    public request(request: CollaborationCall, send: () => void): Promise<CollaborationReply> {
        if (
            this.#pending.size >= 16 ||
            this.#pending.has(request.id) ||
            this.#watches.has(request.id)
        ) {
            return Promise.reject(
                new Error('Collaboration request already pending or capacity reached'),
            );
        }
        return new Promise((resolve, reject) => {
            const timer = setTimeout(
                () =>
                    this.#reject(
                        request.id,
                        new Error('Collaboration request timed out. Retry the same request.'),
                    ),
                30000,
            );
            this.#pending.set(request.id, { request, resolve, reject, timer });
            try {
                send();
            } catch (error: unknown) {
                this.#reject(
                    request.id,
                    error instanceof Error ? error : new Error('Collaboration send failed'),
                );
            }
        });
    }

    /** Register a stream before sending; timeout and protocol failures also release server resources. */
    public listen(
        id: string,
        grantId: string,
        channel: 'project' | 'office',
        projectId: string | undefined,
        listener: (packet: CollaborationResponse) => void,
        fail: (error: Error) => void,
        send: () => void,
        leave: () => void,
    ): () => void {
        if (
            this.#watches.size >= 8 ||
            this.#watches.has(id) ||
            this.#pending.has(id) ||
            (channel === 'office' &&
                [...this.#watches.values()].some((watch) => watch.channel === 'office'))
        ) {
            throw new Error('Too many open collaboration views');
        }
        const timer = setTimeout(
            () => this.#stop(id, new Error('Collaboration subscription timed out')),
            30000,
        );
        this.#watches.set(id, { grantId, channel, projectId, listener, fail, leave, timer });
        try {
            send();
        } catch (error: unknown) {
            this.#stop(
                id,
                error instanceof Error ? error : new Error('Collaboration subscription failed'),
            );
        }
        return () => this.#stop(id);
    }

    /** Movement is permitted locally only while its subscription still exists. */
    public watching(id: string): boolean {
        return this.#watches.has(id);
    }

    /** Validate operation, invitation, project and file identity, not just the correlation ID. */
    public receive(packet: CollaborationPacket): void {
        if (packet.op < 128) {
            throw new Error('Unexpected collaboration request from server');
        }
        const response = packet as CollaborationResponse;
        const watch = this.#watches.get(packet.id);
        if (watch) {
            if (response.op === CollaborationOp.Error) {
                this.#stop(packet.id, new Error(response.message));
                return;
            }
            if (
                response.op === CollaborationOp.ProjectResult &&
                response.response.op === CompanyProjectOp.Error
            ) {
                this.#stop(packet.id, new Error(response.response.message));
                return;
            }
            const matches =
                watch.channel === 'office'
                    ? response.op === CollaborationOp.Office && response.grantId === watch.grantId
                    : response.op === CollaborationOp.ProjectResult &&
                      response.grantId === watch.grantId &&
                      response.response.op === CompanyProjectOp.Snapshot &&
                      response.response.work.projectId === watch.projectId;
            if (!matches) {
                this.#stop(packet.id, new Error('Mismatched collaboration update'));
                return;
            }
            clearTimeout(watch.timer);
            watch.listener(response);
            return;
        }
        const pending = this.#pending.get(packet.id);
        if (!pending) {
            return;
        }
        if (response.op === CollaborationOp.Error) {
            this.#reject(packet.id, new Error(response.message));
            return;
        }
        if (
            response.op === CollaborationOp.ProjectResult &&
            response.response.op === CompanyProjectOp.Error
        ) {
            this.#reject(packet.id, new Error(response.response.message));
            return;
        }
        if (response.op === CollaborationOp.Office || !this.#matches(pending.request, response)) {
            this.#reject(packet.id, new Error('Mismatched collaboration response'));
            return;
        }
        this.#pending.delete(packet.id);
        clearTimeout(pending.timer);
        pending.resolve(response);
    }

    /** Drop all pending operations on disconnection; resubscribe explicitly after reconnect. */
    public close(error: Error): void {
        for (const id of this.#pending.keys()) {
            this.#reject(id, error);
        }
        for (const id of this.#watches.keys()) {
            this.#stop(id, error, false);
        }
    }
    #matches(request: CollaborationCall, response: CollaborationReply): boolean {
        switch (request.op) {
            case CollaborationOp.Code:
                return response.op === CollaborationOp.CodeResult;
            case CollaborationOp.List:
                return (
                    response.op === CollaborationOp.Invitations &&
                    response.projectId === request.projectId &&
                    (!request.projectId ||
                        response.entries.every(
                            (entry) => entry.grant.projectId === request.projectId,
                        ))
                );
            case CollaborationOp.Invite:
                return (
                    response.op === CollaborationOp.Invitations &&
                    response.projectId === request.projectId &&
                    response.entries.length === 1 &&
                    response.entries[0]?.grant.projectId === request.projectId
                );
            case CollaborationOp.Decide:
                return (
                    response.op === CollaborationOp.Invitations &&
                    response.entries.length === 1 &&
                    response.entries[0]?.grant.id === request.grantId
                );
            case CollaborationOp.Context:
                return (
                    response.op === CollaborationOp.ContextResult &&
                    response.context.grant.id === request.grantId
                );
            case CollaborationOp.Project: {
                if (
                    response.op !== CollaborationOp.ProjectResult ||
                    response.grantId !== request.grantId
                ) {
                    return false;
                }
                const inner = request.request,
                    result = response.response;
                if (inner.op === CompanyProjectOp.Artifact) {
                    return (
                        result.op === CompanyProjectOp.File &&
                        result.projectId === inner.projectId &&
                        result.attemptId === inner.attemptId &&
                        result.path === inner.path &&
                        result.offset === inner.offset
                    );
                }
                return (
                    result.op === CompanyProjectOp.Snapshot &&
                    result.work.projectId === inner.projectId
                );
            }
        }
    }
    #reject(id: string, error: Error): void {
        const pending = this.#pending.get(id);
        if (!pending) {
            return;
        }
        this.#pending.delete(id);
        clearTimeout(pending.timer);
        pending.reject(error);
    }
    #stop(id: string, error?: Error, leave = true): void {
        const watch = this.#watches.get(id);
        if (!watch) {
            return;
        }
        this.#watches.delete(id);
        clearTimeout(watch.timer);
        try {
            if (leave) {
                watch.leave();
            }
        } finally {
            if (error) {
                watch.fail(error);
            }
        }
    }
}
