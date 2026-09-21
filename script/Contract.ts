/** Server-only generation input; never imported by the published package. */
import type {
    GatewayMethods,
    ConnectChallengeData,
    TurnEventData,
    TurnEndData,
    SessionMessageData,
    ApprovalRequestedData,
    ApprovalResolvedData,
    ChangedData,
    WireError,
} from '../../nexa/src/gateway/Protocol';
import type { NcapDelta } from '../../nexa/src/protocol/ncap/Delta';
import type { VoiceCallEvent } from '../../nexa/src/voice/VoiceCall';
/** All protocol contracts reachable from the public transport. */
export interface Contract {
    readonly methods: GatewayMethods;
    readonly challenge: ConnectChallengeData;
    readonly turnEvent: TurnEventData;
    readonly turnEnd: TurnEndData;
    readonly sessionMessage: SessionMessageData;
    readonly approvalRequested: ApprovalRequestedData;
    readonly approvalResolved: ApprovalResolvedData;
    readonly changed: ChangedData;
    readonly error: WireError;
    readonly native: NcapDelta;
    readonly voice: VoiceCallEvent;
}
