import { CompanyProtocol } from '../company/CompanyProtocol.js';
import { CompanyOp, type CompanyCommand, type CompanyState } from '../company/CompanyTypes.js';
import type {
    CompanyLimits,
    CompanyLimitsRead,
    CompanyLimitsConfigure,
} from '../company/CompanyLimitsTypes.js';
import type { CompanyChannelFormat } from './CompanyChannelFormat.js';

/** Wire adapters for private channels sharing one bounded lifecycle implementation. */
export class CompanyFormats {
    /** Staffing revisions advance on every visible change. */
    public static readonly staffing: CompanyChannelFormat<CompanyState, CompanyCommand> = {
        sameRevision: false,
        encode: (command) => CompanyProtocol.encode(command),
        subscribe: (id) => CompanyProtocol.encode({ op: CompanyOp.Subscribe, id }),
        unsubscribe: (id) => CompanyProtocol.encode({ op: CompanyOp.Unsubscribe, id }),
        read: (packet) => {
            if (
                packet.op === CompanyOp.Snapshot ||
                packet.op === CompanyOp.LiveSnapshot ||
                packet.op === CompanyOp.Update ||
                packet.op === CompanyOp.Error
            ) {
                return packet;
            }
            if (packet.op === CompanyOp.Stopped) {
                return {
                    op: CompanyOp.Error,
                    id: packet.id,
                    message: 'Company subscription ended.',
                };
            }
            return undefined;
        },
    };
    /** Version two adds department tools while retaining the staffing stream lifecycle. */
    public static readonly departmentTools: CompanyChannelFormat<CompanyState, CompanyCommand> = {
        ...CompanyFormats.staffing,
        encode: (command) => CompanyProtocol.encode({ ...command, version: 2 }),
        subscribe: (id) => CompanyProtocol.encode({ op: CompanyOp.Subscribe, id, version: 2 }),
        unsubscribe: (id) => CompanyProtocol.encode({ op: CompanyOp.Unsubscribe, id, version: 2 }),
    };
    /** Version three carries saved drafts and published department guidance. */
    public static readonly departmentKnowledge: CompanyChannelFormat<CompanyState, CompanyCommand> =
        {
            ...CompanyFormats.staffing,
            encode: (command) => CompanyProtocol.encode({ ...command, version: 3 }),
            subscribe: (id) => CompanyProtocol.encode({ op: CompanyOp.Subscribe, id, version: 3 }),
            unsubscribe: (id) =>
                CompanyProtocol.encode({ op: CompanyOp.Unsubscribe, id, version: 3 }),
        };
    /** Spending changes independently of the approved policy revision. */
    public static readonly limits: CompanyChannelFormat<
        CompanyLimits,
        CompanyLimitsRead | CompanyLimitsConfigure
    > = {
        sameRevision: true,
        encode: (command) => CompanyProtocol.encode(command),
        subscribe: (id) => CompanyProtocol.encode({ op: CompanyOp.SubscribeLimits, id }),
        unsubscribe: (id) => CompanyProtocol.encode({ op: CompanyOp.UnsubscribeLimits, id }),
        read: (packet, watching) => {
            if (packet.op === CompanyOp.LimitsSnapshot) {
                return { ...packet, op: watching ? CompanyOp.LiveSnapshot : CompanyOp.Snapshot };
            }
            if (packet.op === CompanyOp.LimitsUpdate) {
                return { ...packet, op: CompanyOp.Update };
            }
            if (packet.op === CompanyOp.LimitsError) {
                return { ...packet, op: CompanyOp.Error };
            }
            if (packet.op === CompanyOp.LimitsStopped) {
                return {
                    op: CompanyOp.Error,
                    id: packet.id,
                    message: 'Budget subscription ended.',
                };
            }
            return undefined;
        },
    };
}
