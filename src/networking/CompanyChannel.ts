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
interface CompanyWatch {
    readonly listener: (state: CompanyState) => void;
    readonly error: (error: Error) => void;
    sequence: bigint;
    revision: bigint;
    timer: ReturnType<typeof setTimeout> | undefined;
}
/** Private commands multiplexed on NexaClient's existing socket, without automatic write replay. */
export class CompanyChannel {
    readonly #pending = new Map<string, PendingCompany>();
    readonly #watches: Map<string, CompanyWatch> = new Map();
    #send: ((bytes: Uint8Array<ArrayBuffer>) => void) | undefined;
    /** Reconnect only read subscriptions; durable mutations require an explicit retry. */
    public resume(send: (bytes: Uint8Array<ArrayBuffer>) => void): void {
        this.#send = send;
        for (const [id, watch] of this.#watches) {
            this.#start(id, watch);
        }
    }
    /** Start a bounded private snapshot/update stream on the already connected socket. */
    public watch(
        listener: (state: CompanyState) => void,
        error: (error: Error) => void,
    ): () => void {
        if (!this.#send || this.#watches.size >= 8) {
            throw new Error('Company connection is unavailable or has too many subscriptions.');
        }
        const id: string = crypto.randomUUID();
        const watch: CompanyWatch = {
            listener,
            error,
            sequence: -1n,
            revision: -1n,
            timer: undefined,
        };
        this.#watches.set(id, watch);
        try {
            this.#start(id, watch);
        } catch (failure: unknown) {
            clearTimeout(watch.timer);
            this.#watches.delete(id);
            throw failure;
        }
        return (): void => this.#remove(id);
    }
    #start(id: string, watch: CompanyWatch): void {
        clearTimeout(watch.timer);
        watch.sequence = -1n;
        watch.revision = -1n;
        watch.timer = setTimeout((): void => {
            this.#remove(id);
            watch.error(new Error('Company subscription timed out. Reconnect the company desk.'));
        }, 15000);
        this.#send?.(CompanyProtocol.encode({ op: CompanyOp.Subscribe, id }));
    }
    #remove(id: string): void {
        const watch = this.#watches.get(id);
        if (!watch) {
            return;
        }
        clearTimeout(watch.timer);
        this.#watches.delete(id);
        try {
            this.#send?.(CompanyProtocol.encode({ op: CompanyOp.Unsubscribe, id }));
        } catch {
            /** A disconnected peer releases subscriptions when its socket closes. */
        }
    }
    /** Explicit client disposal releases all application listener references. */
    public clear(): void {
        for (const watch of this.#watches.values()) {
            clearTimeout(watch.timer);
        }
        this.#watches.clear();
        this.#send = undefined;
    }
    /** Retrying a timed-out command uses its original ID and payload for durable deduplication. */
    public request(
        command: CompanyCommand,
        send: (bytes: Uint8Array<ArrayBuffer>) => void,
    ): Promise<CompanyState> {
        if (
            this.#pending.size >= 8 ||
            this.#pending.has(command.id) ||
            this.#watches.has(command.id)
        ) {
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
        if (packet.op < CompanyOp.Snapshot) {
            throw new Error('Unexpected company command');
        }
        const watch: CompanyWatch | undefined = this.#watches.get(packet.id);
        if (watch) {
            clearTimeout(watch.timer);
            watch.timer = undefined;
            if (
                (packet.op !== CompanyOp.LiveSnapshot && packet.op !== CompanyOp.Update) ||
                packet.sequence !== watch.sequence + 1n ||
                packet.state.revision <= watch.revision ||
                (watch.sequence === -1n
                    ? packet.op !== CompanyOp.LiveSnapshot
                    : packet.op !== CompanyOp.Update)
            ) {
                this.#remove(packet.id);
                watch.error(
                    new Error(
                        packet.op === CompanyOp.Error
                            ? packet.message
                            : 'Company updates lost their sequence. Reconnect the company desk.',
                    ),
                );
                return;
            }
            watch.sequence = packet.sequence;
            watch.revision = packet.state.revision;
            watch.listener(packet.state);
            return;
        }
        const pending: PendingCompany | undefined = this.#pending.get(packet.id);
        if (!pending) {
            return;
        }
        this.#pending.delete(packet.id);
        clearTimeout(pending.timer);
        if (packet.op === CompanyOp.Error) {
            pending.reject(new Error(packet.message));
        } else if (packet.op === CompanyOp.Snapshot) {
            pending.resolve(packet.state);
        } else {
            pending.reject(new Error('Expected a company snapshot'));
        }
    }
    /** Reject local waits on disconnect; committed commands remain deduplicated by the gateway. */
    public close(error: Error): void {
        this.#send = undefined;
        for (const watch of this.#watches.values()) {
            clearTimeout(watch.timer);
            watch.timer = undefined;
            watch.sequence = -1n;
            watch.revision = -1n;
            watch.error(error);
        }
        for (const pending of this.#pending.values()) {
            clearTimeout(pending.timer);
            pending.reject(error);
        }
        this.#pending.clear();
    }
}
