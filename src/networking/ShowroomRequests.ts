// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    ShowroomOp,
    type ShowroomRequest,
    type ShowroomPacket,
    type ShowroomCatalog,
    type ShowroomContent,
} from '../company/CompanyShowroomProtocol.js';

interface PendingShowroom {
    readonly request: ShowroomRequest;
    readonly resolve: (packet: ShowroomCatalog | ShowroomContent) => void;
    readonly reject: (error: Error) => void;
    readonly timer: ReturnType<typeof setTimeout>;
}
/** Bounded showroom requests never replay publication automatically after reconnect. */
export class ShowroomRequests {
    readonly #pending = new Map<string, PendingShowroom>();
    /** Register before sending and preserve the caller's publication identity for explicit retries. */
    public request(
        request: ShowroomRequest,
        send: () => void,
    ): Promise<ShowroomCatalog | ShowroomContent> {
        if (this.#pending.size >= 8 || this.#pending.has(request.id)) {
            return Promise.reject(
                new Error('Showroom request already pending or capacity reached'),
            );
        }
        return new Promise((resolve, reject) => {
            const timer = setTimeout(
                () =>
                    this.#reject(
                        request.id,
                        new Error('Showroom request timed out. Retry the same request.'),
                    ),
                30000,
            );
            this.#pending.set(request.id, { request, resolve, reject, timer });
            try {
                send();
            } catch (error: unknown) {
                this.#reject(
                    request.id,
                    error instanceof Error ? error : new Error('Showroom request failed'),
                );
            }
        });
    }
    /** Reject mismatched response types and preview identities before resolving the caller. */
    public receive(packet: ShowroomPacket): void {
        if (
            packet.op !== ShowroomOp.Catalog &&
            packet.op !== ShowroomOp.Content &&
            packet.op !== ShowroomOp.Error
        ) {
            throw new Error('Unexpected showroom request from server');
        }
        const pending = this.#pending.get(packet.id);
        if (!pending) {
            return;
        }
        if (packet.op === ShowroomOp.Error) {
            this.#reject(packet.id, new Error(packet.message));
            return;
        }
        const request = pending.request;
        const matches =
            request.op === ShowroomOp.Preview
                ? packet.op === ShowroomOp.Content && packet.entryId === request.entryId
                : packet.op === ShowroomOp.Catalog;
        if (!matches) {
            this.#reject(packet.id, new Error('Mismatched showroom response'));
            return;
        }
        this.#pending.delete(packet.id);
        clearTimeout(pending.timer);
        pending.resolve(packet);
    }
    /** Drop pending operations when a socket closes. */
    public close(error: Error): void {
        for (const id of this.#pending.keys()) {
            this.#reject(id, error);
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
}
