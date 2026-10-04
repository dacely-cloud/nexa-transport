import { CompanyHostProtocol } from '../company/CompanyHostProtocol.js';
import {
    HostOp,
    type CompanyHostControl,
    type CompanyHostPacket,
    type CompanyHostState,
} from '../company/CompanyHostTypes.js';
import { CompanyOp } from '../company/CompanyTypes.js';
import type { CompanyChannelFormat } from './CompanyChannelFormat.js';

/** Resource watches reuse the private channel lifecycle, without replayable execution commands. */
export class CompanyHostFormat {
    /** Ordered status updates may retain the same company configuration revision. */
    public static readonly format: CompanyChannelFormat<
        CompanyHostState,
        CompanyHostControl,
        CompanyHostPacket
    > = {
        sameRevision: true,
        encode: (packet) => CompanyHostProtocol.encode(packet),
        subscribe: (id) => CompanyHostProtocol.encode({ op: HostOp.Subscribe, id }),
        unsubscribe: (id) => CompanyHostProtocol.encode({ op: HostOp.Unsubscribe, id }),
        read: (packet, watching) => {
            if (packet.op === HostOp.Snapshot) {
                return { ...packet, op: watching ? CompanyOp.LiveSnapshot : CompanyOp.Snapshot };
            }
            if (packet.op === HostOp.Update) {
                return { ...packet, op: CompanyOp.Update };
            }
            if (packet.op === HostOp.Error || packet.op === HostOp.Stopped) {
                return {
                    ...packet,
                    op: CompanyOp.Error,
                    message: packet.message || 'Workspace resource subscription ended.',
                };
            }
            return undefined;
        },
    };
}
