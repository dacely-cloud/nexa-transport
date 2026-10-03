import { CompanyProtocol } from '../company/CompanyProtocol.js';
import {
    CompanyOp,
    type CompanyCommand,
    type CompanyState,
    type CompanyPacket,
} from '../company/CompanyTypes.js';

/** One bounded request waiting for an authoritative company snapshot. */
interface PendingCompany {
    readonly resolve: (state: CompanyState) => void;
    readonly reject: (error: Error) => void;
    readonly timer: ReturnType<typeof setTimeout>;
}
/** Private commands multiplexed on NexaClient's existing socket, without automatic write replay. */
export class CompanyChannel {
    readonly #pending = new Map<string, PendingCompany>();
    /** Retrying a timed-out command uses its original ID and payload for durable deduplication. */
    public request(
        command: CompanyCommand,
        send: (bytes: Uint8Array<ArrayBuffer>) => void,
    ): Promise<CompanyState> {
        if (this.#pending.size >= 8 || this.#pending.has(command.id)) {
            return Promise.reject(
                new Error('Company request is already pending or the connection is busy.'),
            );
        }
        const bytes: Uint8Array<ArrayBuffer> = CompanyProtocol.encode(command);
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.#pending.delete(command.id);
                reject(new Error('Company request timed out. Retry with the same command ID.'));
            }, 15000);
            this.#pending.set(command.id, { resolve, reject, timer });
            try {
                send(bytes);
            } catch (error: unknown) {
                clearTimeout(timer);
                this.#pending.delete(command.id);
                reject(error instanceof Error ? error : new Error('Company send failed'));
            }
        });
    }
    /** Only snapshots and errors may arrive from the gateway. */
    public receive(packet: CompanyPacket): void {
        if (packet.op !== CompanyOp.Snapshot && packet.op !== CompanyOp.Error) {
            throw new Error('Unexpected company command');
        }
        const pending: PendingCompany | undefined = this.#pending.get(packet.id);
        if (!pending) {
            return;
        }
        this.#pending.delete(packet.id);
        clearTimeout(pending.timer);
        if (packet.op === CompanyOp.Error) {
            pending.reject(new Error(packet.message));
        } else {
            pending.resolve(packet.state);
        }
    }
    /** Reject local waits on disconnect; committed commands remain deduplicated by the gateway. */
    public close(error: Error): void {
        for (const pending of this.#pending.values()) {
            clearTimeout(pending.timer);
            pending.reject(error);
        }
        this.#pending.clear();
    }
}
