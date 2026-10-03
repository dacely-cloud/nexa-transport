// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    CompanyProjectOp,
    type CompanyProjectRequest,
    type CompanyProjectPacket,
    type CompanyProjectSnapshot,
    type CompanyProjectFile,
} from '../company/CompanyProjectProtocol.js';

interface PendingProject {
    readonly request: CompanyProjectRequest;
    readonly resolve: (response: CompanyProjectSnapshot | CompanyProjectFile) => void;
    readonly reject: (error: Error) => void;
    readonly timer: ReturnType<typeof setTimeout>;
}
/** Bounded owner requests; reconnect never automatically replays a spending decision. */
export class CompanyProjectRequests {
    readonly #pending = new Map<string, PendingProject>();
    /** Register before sending, retaining the caller's stable mutation identity. */
    public request(
        request: CompanyProjectRequest,
        send: () => void,
    ): Promise<CompanyProjectSnapshot | CompanyProjectFile> {
        if (this.#pending.size >= 16 || this.#pending.has(request.id)) {
            return Promise.reject(new Error('Project request already pending or capacity reached'));
        }
        return new Promise((resolve, reject) => {
            const timer = setTimeout(
                () =>
                    this.#reject(
                        request.id,
                        new Error(
                            'Project request timed out. Retry the same command to check its result.',
                        ),
                    ),
                30000,
            );
            this.#pending.set(request.id, { request, resolve, reject, timer });
            try {
                send();
            } catch (error: unknown) {
                this.#reject(
                    request.id,
                    error instanceof Error ? error : new Error('Project request failed'),
                );
            }
        });
    }
    /** Correlate type, project, and file identity as well as the request ID. */
    public receive(packet: CompanyProjectPacket): void {
        if (
            packet.op !== CompanyProjectOp.Snapshot &&
            packet.op !== CompanyProjectOp.File &&
            packet.op !== CompanyProjectOp.Error
        ) {
            throw new Error('Unexpected project request from server');
        }
        const pending = this.#pending.get(packet.id);
        if (pending === undefined) {
            return;
        }
        if (packet.op === CompanyProjectOp.Error) {
            this.#reject(packet.id, new Error(packet.message));
            return;
        }
        const request = pending.request;
        const matches =
            packet.op === CompanyProjectOp.Snapshot
                ? request.op !== CompanyProjectOp.Artifact &&
                  packet.work.projectId === request.projectId
                : request.op === CompanyProjectOp.Artifact &&
                  packet.projectId === request.projectId &&
                  packet.attemptId === request.attemptId &&
                  packet.path === request.path &&
                  packet.offset === request.offset;
        if (!matches) {
            this.#reject(packet.id, new Error('Mismatched project response'));
            return;
        }
        this.#pending.delete(packet.id);
        clearTimeout(pending.timer);
        pending.resolve(packet);
    }
    /** Fail outstanding requests when their connection ends. */
    public close(error: Error): void {
        for (const id of this.#pending.keys()) {
            this.#reject(id, error);
        }
    }
    #reject(id: string, error: Error): void {
        const pending = this.#pending.get(id);
        if (pending === undefined) {
            return;
        }
        this.#pending.delete(id);
        clearTimeout(pending.timer);
        pending.reject(error);
    }
}
