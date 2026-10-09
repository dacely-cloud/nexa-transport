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
import type { ReverseNetworkDetailPage } from '../../nexa/src/reverse/NetworkDetailTypes';
import type { ReverseBrowserPage } from '../../nexa/src/reverse/BrowserCaptureTypes';
import type { ReverseNetworkDirectoryPage } from '../../nexa/src/reverse/NetworkDirectoryTypes';
import type { ReverseGraphPage } from '../../nexa/src/reverse/GraphTypes';
import type { ReverseRunSnapshot } from '../../nexa/src/reverse/ProgressTypes';
import type { ReverseCatalogPage, ReverseEvidencePage } from '../../nexa/src/reverse/ArchiveTypes';
import type {
    ReverseFunctionsPage,
    ReverseInspectResult,
} from '../../nexa/src/reverse/NavigationTypes';
import type { BrowserStructurePage } from '../../nexa/src/reverse/BrowserStructureTypes';
import type { BrowserSourcesPage } from '../../nexa/src/reverse/BrowserSourcesDirectoryTypes';
import type { BrowserScreenshotPage } from '../../nexa/src/reverse/BrowserScreenshotTypes';
import type { BrowserStoragePage } from '../../nexa/src/reverse/BrowserStorageTypes';
import type { BrowserStorageComparisonPage } from '../../nexa/src/reverse/BrowserStorageComparisonTypes';
import type { BrowserModulePage } from '../../nexa/src/reverse/BrowserModuleDirectoryTypes';
/** All protocol contracts reachable from the public transport. */
export interface Contract {
    readonly reverseBrowser: ReverseBrowserPage;
    readonly reverseBrowserStructure: BrowserStructurePage;
    readonly reverseBrowserScreenshot: BrowserScreenshotPage;
    readonly reverseBrowserStorage: BrowserStoragePage;
    readonly reverseBrowserStorageComparison: BrowserStorageComparisonPage;
    readonly reverseBrowserSources: BrowserSourcesPage;
    readonly reverseBrowserModules: BrowserModulePage;
    readonly reverseNetworkDetail: ReverseNetworkDetailPage;
    readonly reverseNetworkDirectory: ReverseNetworkDirectoryPage;
    readonly reverseGraph: ReverseGraphPage;
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
