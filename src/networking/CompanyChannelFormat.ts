import { CompanyOp, type CompanyPacket, type CompanyFailure } from '../company/CompanyTypes.js';

/** One authoritative correlated result. */
export interface ChannelSnapshot<State> {
    readonly op: typeof CompanyOp.Snapshot;
    readonly id: string;
    readonly state: State;
}
/** First ordered subscription snapshot. */
export interface ChannelLiveSnapshot<State> {
    readonly op: typeof CompanyOp.LiveSnapshot;
    readonly id: string;
    readonly state: State;
    readonly sequence: bigint;
}
/** Next contiguous subscription update. */
export interface ChannelUpdate<State> {
    readonly op: typeof CompanyOp.Update;
    readonly id: string;
    readonly state: State;
    readonly sequence: bigint;
}
/** Normalized response lets private channels share timeout, cleanup and replay guarantees. */
export type CompanyChannelReply<State> =
    ChannelSnapshot<State> | ChannelLiveSnapshot<State> | ChannelUpdate<State> | CompanyFailure;
/** Wire-specific operations remain separate from the bounded request/subscription lifecycle. */
export interface CompanyChannelFormat<State, Command, Packet = CompanyPacket> {
    readonly sameRevision: boolean;
    encode(command: Command): Uint8Array<ArrayBuffer>;
    subscribe(id: string): Uint8Array<ArrayBuffer>;
    unsubscribe(id: string): Uint8Array<ArrayBuffer>;
    read(packet: Packet, watching: boolean): CompanyChannelReply<State> | undefined;
}
