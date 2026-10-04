import { CompanyChannel } from './CompanyChannel.js';
import type { CompanyChannelFormat } from './CompanyChannelFormat.js';
import { CompanyOp } from '../company/CompanyTypes.js';
import { CompanyEmployeeProtocol } from '../company/CompanyEmployeeProtocol.js';
import {
    EmployeeOp,
    type CompanyEmployeeControl,
    type CompanyEmployeePacket,
    type CompanyEmployeeResults,
} from '../company/CompanyEmployeeTypes.js';

interface EmployeeChannelEntry {
    readonly channel: CompanyChannel<
        CompanyEmployeeResults,
        CompanyEmployeeControl,
        CompanyEmployeePacket
    >;
    references: number;
}

/** At most eight employee reads/watches share the existing private channel lifecycle. */
export class EmployeeChannels {
    readonly #entries = new Map<string, EmployeeChannelEntry>();
    #references = 0;
    #version: 2 | 3 | undefined;
    #send: ((bytes: Uint8Array<ArrayBuffer>) => void) | undefined;
    /** Restore read subscriptions after authentication, never infer or dispatch work. */
    public resume(send: (bytes: Uint8Array<ArrayBuffer>) => void, version?: 2 | 3): void {
        this.#version = version;
        this.#send = send;
        for (const entry of this.#entries.values()) {
            entry.channel.resume(send);
        }
    }
    /** A report request has no mutation payload and consumes one bounded pending slot. */
    public async read(employeeId: string): Promise<CompanyEmployeeResults> {
        const send: ((bytes: Uint8Array<ArrayBuffer>) => void) | undefined = this.#send;
        if (!send) {
            throw new Error('Employee results connection is unavailable.');
        }
        const entry = this.#take(employeeId);
        try {
            return await entry.channel.request(
                { op: EmployeeOp.Read, id: crypto.randomUUID(), employeeId },
                send,
            );
        } finally {
            this.#release(employeeId, entry);
        }
    }
    /** The selected employee remains fixed for this watch, including after reconnection. */
    public watch(
        employeeId: string,
        listener: (state: CompanyEmployeeResults) => void,
        error: (error: Error) => void,
    ): () => void {
        const entry = this.#take(employeeId);
        try {
            const leave = entry.channel.watch(listener, error);
            let active = true;
            return (): void => {
                if (active) {
                    active = false;
                    leave();
                    this.#release(employeeId, entry);
                }
            };
        } catch (failure: unknown) {
            this.#release(employeeId, entry);
            throw failure;
        }
    }
    /** Ignore departed employee views; malformed traffic has already failed canonical decoding. */
    public receive(packet: CompanyEmployeePacket): void {
        this.#entries.get(packet.employeeId)?.channel.receive(packet);
    }
    /** Disconnect fails requests while retaining subscriptions for explicit client reconnect. */
    public close(error: Error): void {
        this.#send = undefined;
        for (const entry of this.#entries.values()) {
            entry.channel.close(error);
        }
    }
    /** Client disposal releases all retained references. */
    public clear(): void {
        const connected: boolean = this.#send !== undefined;
        this.#send = undefined;
        for (const entry of this.#entries.values()) {
            if (connected) {
                entry.channel.close(new Error('Employee results client disposed.'));
            }
            entry.channel.clear();
        }
        this.#entries.clear();
        this.#references = 0;
    }
    #take(employeeId: string): EmployeeChannelEntry {
        if (!this.#send || this.#references >= 8) {
            throw new Error('Employee results connection is unavailable or busy.');
        }
        let entry = this.#entries.get(employeeId);
        if (!entry) {
            const format: CompanyChannelFormat<
                CompanyEmployeeResults,
                CompanyEmployeeControl,
                CompanyEmployeePacket
            > = {
                sameRevision: true,
                encode: (packet) => this.#encode(packet),
                subscribe: (id) => this.#encode({ op: EmployeeOp.Subscribe, id, employeeId }),
                unsubscribe: (id) => this.#encode({ op: EmployeeOp.Unsubscribe, id, employeeId }),
                read: (packet, watching) => {
                    if (packet.op === EmployeeOp.Snapshot) {
                        return {
                            ...packet,
                            op: watching ? CompanyOp.LiveSnapshot : CompanyOp.Snapshot,
                        };
                    }
                    if (packet.op === EmployeeOp.Update) {
                        return { ...packet, op: CompanyOp.Update };
                    }
                    if (packet.op === EmployeeOp.Error || packet.op === EmployeeOp.Stopped) {
                        return {
                            ...packet,
                            op: CompanyOp.Error,
                            message: packet.message || 'Employee results subscription ended.',
                        };
                    }
                    return undefined;
                },
            };
            entry = { channel: new CompanyChannel(format), references: 0 };
            entry.channel.resume(this.#send);
            this.#entries.set(employeeId, entry);
        }
        entry.references++;
        this.#references++;
        return entry;
    }
    #release(employeeId: string, entry: EmployeeChannelEntry): void {
        if (this.#entries.get(employeeId) !== entry) {
            return;
        }
        entry.references--;
        this.#references--;
        if (!entry.references) {
            entry.channel.clear();
            this.#entries.delete(employeeId);
        }
    }
    #encode(packet: CompanyEmployeeControl): Uint8Array<ArrayBuffer> {
        return CompanyEmployeeProtocol.encode({
            ...packet,
            ...(this.#version ? { version: this.#version } : {}),
        });
    }
}
