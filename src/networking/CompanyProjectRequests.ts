// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    CompanyProjectOp,
    type CompanyProjectRequest,
    type CompanyProjectPacket,
    type CompanyProjectSnapshot,
    type CompanyProjectFile,
    type CompanyEmployeeHistory,
    type CompanySpending,
} from '../company/CompanyProjectProtocol.js';

interface PendingProject {
    readonly request: CompanyProjectRequest;
    readonly resolve: (
        response:
            CompanyProjectSnapshot | CompanyProjectFile | CompanyEmployeeHistory | CompanySpending,
    ) => void;
    readonly reject: (error: Error) => void;
    readonly timer: ReturnType<typeof setTimeout>;
}
/** Bounded owner requests; reconnect never automatically replays a spending decision. */
export class CompanyProjectRequests {
    readonly #pending = new Map<string, PendingProject>();
    readonly #watches = new Map<
        string,
        {
            readonly project: string;
            readonly listener: (snapshot: CompanyProjectSnapshot) => void;
            readonly fail: (error: Error) => void;
            readonly timer: ReturnType<typeof setTimeout>;
        }
    >();
    /** Register a bounded live stream before sending its subscribe packet. */
    public listen(
        id: string,
        project: string,
        listener: (snapshot: CompanyProjectSnapshot) => void,
        fail: (error: Error) => void,
        send: () => void,
        leave: () => void,
    ): () => void {
        if (this.#watches.size >= 8 || this.#watches.has(id)) {
            throw new Error('Too many open projects');
        }
        const reject = (error: Error): void => {
            const watch = this.#watches.get(id);
            if (!watch) {
                return;
            }
            this.#watches.delete(id);
            clearTimeout(watch.timer);
            fail(error);
        };
        const timer = setTimeout(() => {
            reject(new Error('Project subscription timed out'));
            leave();
        }, 30000);
        this.#watches.set(id, { project, listener, fail: reject, timer });
        try {
            send();
        } catch (error: unknown) {
            reject(error instanceof Error ? error : new Error('Project subscription failed'));
        }
        return () => {
            const watch = this.#watches.get(id);
            if (!watch) {
                return;
            }
            this.#watches.delete(id);
            clearTimeout(watch.timer);
            leave();
        };
    }
    /** Register before sending, retaining the caller's stable mutation identity. */
    public request(
        request: CompanyProjectRequest,
        send: () => void,
    ): Promise<
        CompanyProjectSnapshot | CompanyProjectFile | CompanyEmployeeHistory | CompanySpending
    > {
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
            packet.op !== CompanyProjectOp.History &&
            packet.op !== CompanyProjectOp.Spending &&
            packet.op !== CompanyProjectOp.Error
        ) {
            throw new Error('Unexpected project request from server');
        }
        const watch = this.#watches.get(packet.id);
        if (watch !== undefined) {
            if (packet.op === CompanyProjectOp.Error) {
                watch.fail(new Error(packet.message));
            } else if (
                packet.op !== CompanyProjectOp.Snapshot ||
                packet.work.projectId !== watch.project
            ) {
                watch.fail(new Error('Mismatched project update'));
            } else {
                clearTimeout(watch.timer);
                watch.listener(packet);
            }
            return;
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
            packet.op === CompanyProjectOp.Spending
                ? (request.op === CompanyProjectOp.Ledger ||
                      request.op === CompanyProjectOp.Recover) &&
                  packet.projectId === request.projectId
                : packet.op === CompanyProjectOp.History
                  ? request.op === CompanyProjectOp.Employee &&
                    packet.employeeId === request.employeeId
                  : packet.op === CompanyProjectOp.Snapshot
                    ? request.op !== CompanyProjectOp.Employee &&
                      request.op !== CompanyProjectOp.Artifact &&
                      request.op !== CompanyProjectOp.Ledger &&
                      request.op !== CompanyProjectOp.Recover &&
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
        for (const watch of this.#watches.values()) {
            watch.fail(error);
        }
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
