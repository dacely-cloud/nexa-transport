// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import {
    CompanyOp,
    type CompanyCommand,
    type CompanyPacket,
    type CompanyState,
} from '../company/CompanyProtocol.js';

interface PendingCompany {
    readonly resolve: (state: CompanyState) => void;
    readonly reject: (error: Error) => void;
    readonly timer: ReturnType<typeof setTimeout>;
}
/** Correlates bounded private commands without replaying mutations across reconnects. */
export class CompanyRequests {
    readonly #pending = new Map<string, PendingCompany>();
    /** Callers retain the command ID when retrying an uncertain write. */
    public request(command: CompanyCommand, send: () => void): Promise<CompanyState> {
        if (this.#pending.size >= 16 || this.#pending.has(command.id)) {
            return Promise.reject(
                new Error('Company command already pending or request limit reached'),
            );
        }
        return new Promise<CompanyState>((resolve, reject) => {
            const timer = setTimeout(
                () =>
                    this.#reject(
                        command.id,
                        new Error(
                            'Company request timed out. Retry the same command to check its result.',
                        ),
                    ),
                30000,
            );
            this.#pending.set(command.id, { resolve, reject, timer });
            try {
                send();
            } catch (error: unknown) {
                this.#reject(
                    command.id,
                    error instanceof Error ? error : new Error('Company request failed'),
                );
            }
        });
    }
    /** Match only replies; incoming commands are a protocol violation. */
    public receive(packet: CompanyPacket): void {
        if (packet.op !== CompanyOp.Snapshot && packet.op !== CompanyOp.Error) {
            throw new Error('Unexpected company command from server');
        }
        const pending = this.#pending.get(packet.id);
        if (!pending) {
            return;
        }
        this.#pending.delete(packet.id);
        clearTimeout(pending.timer);
        if (packet.op === CompanyOp.Snapshot) {
            pending.resolve(packet.state);
        } else {
            pending.reject(new Error(packet.message));
        }
    }
    /** Pending requests fail on disconnect; their IDs remain safe for explicit retries. */
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
