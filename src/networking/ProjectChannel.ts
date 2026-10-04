import { CompanyProjectProtocol } from '../company/CompanyProjectProtocol.js';
import {
    ProjectOp,
    type ProjectPacket,
    type ProjectClientPacket,
    type CompanyProjectState,
} from '../company/CompanyProjectTypes.js';

interface PendingProject {
    readonly project: string;
    readonly receive: (packet: ProjectPacket) => boolean;
    readonly reject: (error: Error) => void;
    readonly timer: ReturnType<typeof setTimeout>;
}
interface ProjectWatch {
    readonly project: string;
    readonly listener: (state: CompanyProjectState) => void;
    readonly error: (error: Error) => void;
    sequence: bigint;
}
/** Private state and contiguous delivery chunks multiplexed over NexaClient's current socket. */
export class ProjectChannel {
    readonly #pending: Map<string, PendingProject> = new Map();
    readonly #watches: Map<string, ProjectWatch> = new Map();
    #version: 2 | 3 | undefined;
    #send: ((bytes: Uint8Array<ArrayBuffer>) => void) | undefined;
    /** Restore read subscriptions only. A lost mutation is never automatically replayed. */
    public resume(send: (bytes: Uint8Array<ArrayBuffer>) => void, version?: 2 | 3): void {
        this.#version = version;
        this.#send = send;
        for (const [id, watch] of this.#watches) {
            watch.sequence = -1n;
            send(
                this.#encode({
                    op: ProjectOp.Subscribe,
                    id,
                    project: watch.project,
                }),
            );
        }
    }
    /** Read or decide once; an explicit retry can reuse the original durable command ID. */
    public state(packet: ProjectClientPacket): Promise<CompanyProjectState> {
        return new Promise((resolve, reject): void => {
            this.#request(
                packet,
                (response): boolean => {
                    if (response.op !== ProjectOp.Snapshot || response.sequence !== 0n) {
                        throw new Error('Expected a project snapshot');
                    }
                    resolve(response.state);
                    return true;
                },
                reject,
            );
        });
    }
    /** Assemble at most one bounded artifact, validating offsets and totals before copying. */
    public file(project: string, attempt: string, path: string): Promise<Uint8Array<ArrayBuffer>> {
        return new Promise((resolve, reject): void => {
            let result: Uint8Array<ArrayBuffer> | undefined;
            let offset: number = 0;
            this.#request(
                { op: ProjectOp.File, id: crypto.randomUUID(), project, attempt, path },
                (packet): boolean => {
                    if (
                        packet.op !== ProjectOp.Chunk ||
                        packet.offset !== offset ||
                        packet.total > CompanyProjectProtocol.fileBytes ||
                        packet.bytes.length > CompanyProjectProtocol.chunkBytes ||
                        packet.offset + packet.bytes.length > packet.total ||
                        (result && result.length !== packet.total)
                    ) {
                        throw new Error('Invalid or out-of-order delivery chunk');
                    }
                    result ??= new Uint8Array(packet.total);
                    result.set(packet.bytes, offset);
                    offset += packet.bytes.length;
                    if (offset !== result.length) {
                        return false;
                    }
                    resolve(result);
                    return true;
                },
                reject,
            );
        });
    }
    /** Each watch starts from a snapshot and detects any missing or repeated update. */
    public watch(
        project: string,
        listener: (state: CompanyProjectState) => void,
        error: (error: Error) => void,
    ): () => void {
        if (!this.#send || this.#watches.size >= 8) {
            throw new Error('Project connection is unavailable or has too many subscriptions.');
        }
        const id: string = crypto.randomUUID();
        const bytes: Uint8Array<ArrayBuffer> = this.#encode({
            op: ProjectOp.Subscribe,
            id,
            project,
        });
        this.#watches.set(id, { project, listener, error, sequence: -1n });
        try {
            this.#send(bytes);
        } catch (failure: unknown) {
            this.#watches.delete(id);
            throw failure;
        }
        return (): void => {
            if (!this.#watches.delete(id)) {
                return;
            }
            this.#send?.(this.#encode({ op: ProjectOp.Unsubscribe, id, project }));
        };
    }
    /** Discard uncorrelated late replies and verify the project identity of every matching reply. */
    public receive(packet: ProjectPacket): void {
        if (packet.op < ProjectOp.Snapshot) {
            throw new Error('Unexpected project command from gateway');
        }
        const pending: PendingProject | undefined = this.#pending.get(packet.id);
        if (pending) {
            try {
                if (pending.project !== packet.project) {
                    throw new Error('Project response identity mismatch');
                }
                if (packet.op === ProjectOp.Error) {
                    throw new Error(packet.message);
                }
                if (!pending.receive(packet)) {
                    return;
                }
            } catch (error: unknown) {
                pending.reject(
                    error instanceof Error ? error : new Error('Project response failed'),
                );
            }
            clearTimeout(pending.timer);
            this.#pending.delete(packet.id);
            return;
        }
        const watch: ProjectWatch | undefined = this.#watches.get(packet.id);
        if (!watch) {
            return;
        }
        if (
            watch.project !== packet.project ||
            (packet.op !== ProjectOp.Snapshot && packet.op !== ProjectOp.Update) ||
            packet.sequence !== watch.sequence + 1n ||
            (watch.sequence === -1n
                ? packet.op !== ProjectOp.Snapshot
                : packet.op !== ProjectOp.Update)
        ) {
            this.#watches.delete(packet.id);
            this.#send?.(
                this.#encode({
                    op: ProjectOp.Unsubscribe,
                    id: packet.id,
                    project: watch.project,
                }),
            );
            watch.error(
                new Error(
                    packet.op === ProjectOp.Error
                        ? packet.message
                        : 'Project updates lost their sequence. Reopen the project to refresh.',
                ),
            );
            return;
        }
        watch.sequence = packet.sequence;
        watch.listener(packet.state);
    }
    /** Fail outstanding requests on disconnect but retain watches for the client's normal reconnect. */
    public disconnect(error: Error): void {
        this.#send = undefined;
        for (const pending of this.#pending.values()) {
            clearTimeout(pending.timer);
            pending.reject(error);
        }
        this.#pending.clear();
        for (const watch of this.#watches.values()) {
            watch.sequence = -1n;
            watch.error(error);
        }
    }
    /** Explicit disposal drops listener references as well as pending file buffers. */
    public clear(): void {
        this.#watches.clear();
    }
    #encode(packet: ProjectClientPacket): Uint8Array<ArrayBuffer> {
        return CompanyProjectProtocol.encode(
            this.#version ? { ...packet, version: this.#version } : packet,
        );
    }
    #request(
        packet: ProjectClientPacket,
        receive: PendingProject['receive'],
        reject: PendingProject['reject'],
    ): void {
        if (
            !this.#send ||
            this.#pending.size >= 8 ||
            this.#pending.has(packet.id) ||
            this.#watches.has(packet.id)
        ) {
            reject(new Error('Project connection is unavailable or request is already pending.'));
            return;
        }
        const bytes: Uint8Array<ArrayBuffer> = this.#encode(packet);
        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
            this.#pending.delete(packet.id);
            reject(
                new Error('Project request timed out. Retry a decision with the same command ID.'),
            );
        }, 15000);
        this.#pending.set(packet.id, { project: packet.project, receive, reject, timer });
        try {
            this.#send(bytes);
        } catch (error: unknown) {
            clearTimeout(timer);
            this.#pending.delete(packet.id);
            reject(error instanceof Error ? error : new Error('Project send failed'));
        }
    }
}
