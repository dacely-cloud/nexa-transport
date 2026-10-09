import type { SessionHistoryRecord, SessionHistoryData } from '../../nexa/src/gateway/HistoryTypes';
/** Server-only generation input; never imported by the published package. */
import type {
    GatewayMethods,
    ConnectChallengeData,
    TurnEventData,
    ToolSitesData,
    TurnEndData,
    SessionMessageData,
    ApprovalRequestedData,
    ApprovalResolvedData,
    ChangedData,
    WireError,
} from '../../nexa/src/gateway/Protocol';
import type { NcapDelta } from '../../nexa/src/protocol/ncap/Delta';
import type { VoiceCallEvent } from '../../nexa/src/voice/VoiceCall';
import type { ReverseRunSnapshot } from '../../nexa/src/reverse/ProgressTypes';
import type { ReverseCatalogPage, ReverseEvidencePage } from '../../nexa/src/reverse/ArchiveTypes';
import type {
    ReverseFunctionsPage,
    ReverseInspectResult,
} from '../../nexa/src/reverse/NavigationTypes';
/** All protocol contracts reachable from the public transport. */
export interface Contract {
    readonly reverseSnapshot: ReverseRunSnapshot;
    readonly reverseCatalog: ReverseCatalogPage;
    readonly reverseEvidence: ReverseEvidencePage;
    readonly reverseFunctions: ReverseFunctionsPage;
    readonly reverseInspection: ReverseInspectResult;
    readonly historyRecord: SessionHistoryRecord;
    readonly sessionHistory: SessionHistoryData;
    readonly methods: GatewayMethods;
    readonly challenge: ConnectChallengeData;
    readonly turnEvent: TurnEventData;
    readonly toolSites: ToolSitesData;
    readonly turnEnd: TurnEndData;
    readonly sessionMessage: SessionMessageData;
    readonly approvalRequested: ApprovalRequestedData;
    readonly approvalResolved: ApprovalResolvedData;
    readonly changed: ChangedData;
    readonly error: WireError;
    readonly native: NcapDelta;
    readonly voice: VoiceCallEvent;
}
