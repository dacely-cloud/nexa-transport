/** Generated from Nexa gateway contracts. Regenerate with npm run generate. */
/** AccountCreateParams wire fields. */
export interface AccountCreateParamsShape {
    /** displayName as defined by the Nexa gateway. */
    readonly displayName: string;
    /** localId as defined by the Nexa gateway. */
    readonly localId?: string;
    /** model as defined by the Nexa gateway. */
    readonly model?: string;
    /** role as defined by the Nexa gateway. */
    readonly role?: string;
}

/** AccountCreateParams from the Nexa wire protocol. */
export type AccountCreateParams = AccountCreateParamsShape;

/** AccountRemoveParams wire fields. */
export interface AccountRemoveParamsShape {
    /** principalId as defined by the Nexa gateway. */
    readonly principalId: string;
    /** removeWorkspace as defined by the Nexa gateway. */
    readonly removeWorkspace?: boolean;
}

/** AccountRemoveParams from the Nexa wire protocol. */
export type AccountRemoveParams = AccountRemoveParamsShape;

/** AccountSummarysharesItem wire fields. */
export interface AccountSummarysharesItemShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** mode as defined by the Nexa gateway. */
    readonly mode: string;
}

/** AccountSummary wire fields. */
export interface AccountSummaryShape {
    /** createdAt as defined by the Nexa gateway. */
    readonly createdAt: number;
    /** disabled as defined by the Nexa gateway. */
    readonly disabled: boolean;
    /** displayName as defined by the Nexa gateway. */
    readonly displayName: string;
    /** model as defined by the Nexa gateway. */
    readonly model?: string;
    /** principalId as defined by the Nexa gateway. */
    readonly principalId: string;
    /** role as defined by the Nexa gateway. */
    readonly role: string;
    /** shares as defined by the Nexa gateway. */
    readonly shares: ReadonlyArray<AccountSummarysharesItemShape>;
    /** teams as defined by the Nexa gateway. */
    readonly teams: ReadonlyArray<string>;
    /** workspacePath as defined by the Nexa gateway. */
    readonly workspacePath: string;
}

/** AccountSummary from the Nexa wire protocol. */
export type AccountSummary = AccountSummaryShape;

/** AccountsUsageParams wire fields. */
export interface AccountsUsageParamsShape {
    /** fromMs as defined by the Nexa gateway. */
    readonly fromMs?: number;
    /** toMs as defined by the Nexa gateway. */
    readonly toMs?: number;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** AccountsUsageParams from the Nexa wire protocol. */
export type AccountsUsageParams = AccountsUsageParamsShape;

/** AccountsUsageResultusersItemmodelsItem wire fields. */
export interface AccountsUsageResultusersItemmodelsItemShape {
    /** inputTokens as defined by the Nexa gateway. */
    readonly inputTokens: number;
    /** microcents as defined by the Nexa gateway. */
    readonly microcents: number;
    /** model as defined by the Nexa gateway. */
    readonly model: string;
    /** outputTokens as defined by the Nexa gateway. */
    readonly outputTokens: number;
    /** provider as defined by the Nexa gateway. */
    readonly provider: string;
}

/** AccountsUsageResultusersItem wire fields. */
export interface AccountsUsageResultusersItemShape {
    /** cachedInputTokens as defined by the Nexa gateway. */
    readonly cachedInputTokens: number;
    /** displayName as defined by the Nexa gateway. */
    readonly displayName?: string;
    /** entries as defined by the Nexa gateway. */
    readonly entries: number;
    /** inputTokens as defined by the Nexa gateway. */
    readonly inputTokens: number;
    /** microcents as defined by the Nexa gateway. */
    readonly microcents: number;
    /** models as defined by the Nexa gateway. */
    readonly models: ReadonlyArray<AccountsUsageResultusersItemmodelsItemShape>;
    /** nonModelMicrocents as defined by the Nexa gateway. */
    readonly nonModelMicrocents: number;
    /** outputTokens as defined by the Nexa gateway. */
    readonly outputTokens: number;
    /** userId as defined by the Nexa gateway. */
    readonly userId: string;
}

/** AccountsUsageResult wire fields. */
export interface AccountsUsageResultShape {
    /** entries as defined by the Nexa gateway. */
    readonly entries: number;
    /** fromMs as defined by the Nexa gateway. */
    readonly fromMs: number;
    /** toMs as defined by the Nexa gateway. */
    readonly toMs: number;
    /** totalMicrocents as defined by the Nexa gateway. */
    readonly totalMicrocents: number;
    /** users as defined by the Nexa gateway. */
    readonly users: ReadonlyArray<AccountsUsageResultusersItemShape>;
}

/** AccountsUsageResult from the Nexa wire protocol. */
export type AccountsUsageResult = AccountsUsageResultShape;

/** AgentDefineParams wire fields. */
export interface AgentDefineParamsShape {
    /** agent as defined by the Nexa gateway. */
    readonly agent: AgentDefinition;
}

/** AgentDefineParams from the Nexa wire protocol. */
export type AgentDefineParams = AgentDefineParamsShape;

/** Allowed values for AgentDefinitionapprovalMode. */
export const AgentDefinitionapprovalModeValues = {
    Value0: 'cautious',
    Value1: 'permissive',
    Value2: 'standard',
    Value3: 'unattended',
} as const;

/** AgentDefinition wire fields. */
export interface AgentDefinitionShape {
    /** advertisedTools as defined by the Nexa gateway. */
    readonly advertisedTools?: ReadonlyArray<string>;
    /** approvalMode as defined by the Nexa gateway. */
    readonly approvalMode?: (typeof AgentDefinitionapprovalModeValues)[keyof typeof AgentDefinitionapprovalModeValues];
    /** excludeTools as defined by the Nexa gateway. */
    readonly excludeTools?: ReadonlyArray<string>;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** maxIterations as defined by the Nexa gateway. */
    readonly maxIterations?: number;
    /** maxTokens as defined by the Nexa gateway. */
    readonly maxTokens?: number;
    /** metadata as defined by the Nexa gateway. */
    readonly metadata?: Recordstringstring;
    /** model as defined by the Nexa gateway. */
    readonly model: string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** provider as defined by the Nexa gateway. */
    readonly provider: string;
    /** reasoning as defined by the Nexa gateway. */
    readonly reasoning?: ReasoningOptions;
    /** systemPrompt as defined by the Nexa gateway. */
    readonly systemPrompt?: string;
    /** systemPromptSuffix as defined by the Nexa gateway. */
    readonly systemPromptSuffix?: string;
    /** temperature as defined by the Nexa gateway. */
    readonly temperature?: number;
    /** tools as defined by the Nexa gateway. */
    readonly tools?: ReadonlyArray<string>;
    /** voice as defined by the Nexa gateway. */
    readonly voice?: AgentVoice;
}

/** AgentDefinition from the Nexa wire protocol. */
export type AgentDefinition = AgentDefinitionShape;

/** AgentVoice wire fields. */
export interface AgentVoiceShape {
    /** autoSpeak as defined by the Nexa gateway. */
    readonly autoSpeak?: boolean;
    /** provider as defined by the Nexa gateway. */
    readonly provider: string;
    /** voiceId as defined by the Nexa gateway. */
    readonly voiceId: string;
}

/** AgentVoice from the Nexa wire protocol. */
export type AgentVoice = AgentVoiceShape;

/** ApprovalRequestedData wire fields. */
export interface ApprovalRequestedDataShape {
    /** approvalId as defined by the Nexa gateway. */
    readonly approvalId: string;
    /** detail as defined by the Nexa gateway. */
    readonly detail?: string;
    /** expiresAt as defined by the Nexa gateway. */
    readonly expiresAt: number;
    /** principalId as defined by the Nexa gateway. */
    readonly principalId: string;
    /** requestedAt as defined by the Nexa gateway. */
    readonly requestedAt: number;
    /** risk as defined by the Nexa gateway. */
    readonly risk: RiskLevel;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: null | string;
    /** summary as defined by the Nexa gateway. */
    readonly summary: string;
    /** tool as defined by the Nexa gateway. */
    readonly tool: string;
}

/** ApprovalRequestedData from the Nexa wire protocol. */
export type ApprovalRequestedData = ApprovalRequestedDataShape;

/** ApprovalResolveParams wire fields. */
export interface ApprovalResolveParamsShape {
    /** approvalId as defined by the Nexa gateway. */
    readonly approvalId: string;
    /** approved as defined by the Nexa gateway. */
    readonly approved: boolean;
    /** reason as defined by the Nexa gateway. */
    readonly reason?: string;
}

/** ApprovalResolveParams from the Nexa wire protocol. */
export type ApprovalResolveParams = ApprovalResolveParamsShape;

/** Allowed values for ApprovalResolvedDataoutcome. */
export const ApprovalResolvedDataoutcomeValues = {
    Value0: 'answered',
    Value1: 'cancelled',
    Value2: 'expired',
} as const;

/** ApprovalResolvedData wire fields. */
export interface ApprovalResolvedDataShape {
    /** approvalId as defined by the Nexa gateway. */
    readonly approvalId: string;
    /** approved as defined by the Nexa gateway. */
    readonly approved: boolean;
    /** by as defined by the Nexa gateway. */
    readonly by: null | string;
    /** outcome as defined by the Nexa gateway. */
    readonly outcome: (typeof ApprovalResolvedDataoutcomeValues)[keyof typeof ApprovalResolvedDataoutcomeValues];
}

/** ApprovalResolvedData from the Nexa wire protocol. */
export type ApprovalResolvedData = ApprovalResolvedDataShape;

/** AskParams wire fields. */
export interface AskParamsShape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId?: string;
    /** attachments as defined by the Nexa gateway. */
    readonly attachments?: ReadonlyArray<InboundAttachment>;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId?: string;
    /** cwd as defined by the Nexa gateway. */
    readonly cwd?: string;
    /** message as defined by the Nexa gateway. */
    readonly message: string;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** AskParams from the Nexa wire protocol. */
export type AskParams = AskParamsShape;

/** AskResult wire fields. */
export interface AskResultShape {
    /** attachments as defined by the Nexa gateway. */
    readonly attachments?: ReadonlyArray<DeliveredAttachment>;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId: null | string;
    /** finishReason as defined by the Nexa gateway. */
    readonly finishReason: FinishReason;
    /** iterations as defined by the Nexa gateway. */
    readonly iterations: number;
    /** reasoning as defined by the Nexa gateway. */
    readonly reasoning: string;
    /** sessionKey as defined by the Nexa gateway. */
    readonly sessionKey: string;
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** turnId as defined by the Nexa gateway. */
    readonly turnId: string;
    /** usage as defined by the Nexa gateway. */
    readonly usage: TokenUsage;
}

/** AskResult from the Nexa wire protocol. */
export type AskResult = AskResultShape;

/** BinarySourceVariant0 wire fields. */
export interface BinarySourceVariant0Shape {
    /** data as defined by the Nexa gateway. */
    readonly data: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'base64';
    /** mediaType as defined by the Nexa gateway. */
    readonly mediaType: string;
}

/** BinarySourceVariant1 wire fields. */
export interface BinarySourceVariant1Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'url';
    /** url as defined by the Nexa gateway. */
    readonly url: string;
}

/** BinarySource from the Nexa wire protocol. */
export type BinarySource = BinarySourceVariant0Shape | BinarySourceVariant1Shape;

/** Budget wire fields. */
export interface BudgetShape {
    /** alertThresholds as defined by the Nexa gateway. */
    readonly alertThresholds?: ReadonlyArray<number>;
    /** createdAt as defined by the Nexa gateway. */
    readonly createdAt: number;
    /** enforcement as defined by the Nexa gateway. */
    readonly enforcement: BudgetEnforcement;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** limitMicrocents as defined by the Nexa gateway. */
    readonly limitMicrocents: number;
    /** period as defined by the Nexa gateway. */
    readonly period: BudgetPeriod;
    /** scope as defined by the Nexa gateway. */
    readonly scope: CreditScope;
    /** scopeId as defined by the Nexa gateway. */
    readonly scopeId: string;
    /** updatedAt as defined by the Nexa gateway. */
    readonly updatedAt: number;
}

/** Budget from the Nexa wire protocol. */
export type Budget = BudgetShape;

/** Allowed values for BudgetEnforcement. */
export const BudgetEnforcementValues = { Value0: 'block', Value1: 'warn' } as const;

/** BudgetEnforcement from the Nexa wire protocol. */
export type BudgetEnforcement =
    (typeof BudgetEnforcementValues)[keyof typeof BudgetEnforcementValues];

/** Allowed values for BudgetPeriod. */
export const BudgetPeriodValues = {
    Value0: 'daily',
    Value1: 'hourly',
    Value2: 'monthly',
    Value3: 'total',
    Value4: 'weekly',
} as const;

/** BudgetPeriod from the Nexa wire protocol. */
export type BudgetPeriod = (typeof BudgetPeriodValues)[keyof typeof BudgetPeriodValues];

/** Allowed values for ChangedDatachange. */
export const ChangedDatachangeValues = {
    Value0: 'added',
    Value1: 'defined',
    Value2: 'removed',
} as const;

/** ChangedData wire fields. */
export interface ChangedDataShape {
    /** change as defined by the Nexa gateway. */
    readonly change: (typeof ChangedDatachangeValues)[keyof typeof ChangedDatachangeValues];
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** ChangedData from the Nexa wire protocol. */
export type ChangedData = ChangedDataShape;

/** ChannelInfo wire fields. */
export interface ChannelInfoShape {
    /** actions as defined by the Nexa gateway. */
    readonly actions: ReadonlyArray<string>;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
}

/** ChannelInfo from the Nexa wire protocol. */
export type ChannelInfo = ChannelInfoShape;

/** ChannelStatusResultissuesItem wire fields. */
export interface ChannelStatusResultissuesItemShape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: string;
    /** message as defined by the Nexa gateway. */
    readonly message: string;
}

/** Allowed values for ChannelStatusResultlifecycle. */
export const ChannelStatusResultlifecycleValues = {
    Value0: 'blocked',
    Value1: 'ready',
    Value2: 'recovering',
    Value3: 'starting',
    Value4: 'stopped',
    Value5: 'unknown',
} as const;

/** ChannelStatusResult wire fields. */
export interface ChannelStatusResultShape {
    /** configured as defined by the Nexa gateway. */
    readonly configured: boolean;
    /** connected as defined by the Nexa gateway. */
    readonly connected: boolean;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** issues as defined by the Nexa gateway. */
    readonly issues: ReadonlyArray<ChannelStatusResultissuesItemShape>;
    /** lastError as defined by the Nexa gateway. */
    readonly lastError?: string;
    /** lifecycle as defined by the Nexa gateway. */
    readonly lifecycle: (typeof ChannelStatusResultlifecycleValues)[keyof typeof ChannelStatusResultlifecycleValues];
}

/** ChannelStatusResult from the Nexa wire protocol. */
export type ChannelStatusResult = ChannelStatusResultShape;

/** ConfigResult wire fields. */
export interface ConfigResultShape {
    /** config as defined by the Nexa gateway. */
    readonly config: Recordstringunknown;
    /** defaults as defined by the Nexa gateway. */
    readonly defaults: Recordstringunknown;
    /** path as defined by the Nexa gateway. */
    readonly path: null | string;
    /** redacted as defined by the Nexa gateway. */
    readonly redacted: ReadonlyArray<string>;
}

/** ConfigResult from the Nexa wire protocol. */
export type ConfigResult = ConfigResultShape;

/** ConfigWriteParams wire fields. */
export interface ConfigWriteParamsShape {
    /** key as defined by the Nexa gateway. */
    readonly key: string;
    /** value as defined by the Nexa gateway. */
    readonly value: JsonValue;
}

/** ConfigWriteParams from the Nexa wire protocol. */
export type ConfigWriteParams = ConfigWriteParamsShape;

/** ConfigWriteResult wire fields. */
export interface ConfigWriteResultShape {
    /** key as defined by the Nexa gateway. */
    readonly key: string;
    /** ok as defined by the Nexa gateway. */
    readonly ok: true;
    /** path as defined by the Nexa gateway. */
    readonly path: string;
}

/** ConfigWriteResult from the Nexa wire protocol. */
export type ConfigWriteResult = ConfigWriteResultShape;

/** ConnectChallengeData wire fields. */
export interface ConnectChallengeDataShape {
    /** minProtocol as defined by the Nexa gateway. */
    readonly minProtocol: number;
    /** nonce as defined by the Nexa gateway. */
    readonly nonce: string;
    /** protocol as defined by the Nexa gateway. */
    readonly protocol: number;
    /** ts as defined by the Nexa gateway. */
    readonly ts: number;
}

/** ConnectChallengeData from the Nexa wire protocol. */
export type ConnectChallengeData = ConnectChallengeDataShape;

/** Allowed values for ConnectClientInfomode. */
export const ConnectClientInfomodeValues = {
    Value0: 'automation',
    Value1: 'cli',
    Value2: 'node',
    Value3: 'tui',
    Value4: 'ui',
} as const;

/** ConnectClientInfo wire fields. */
export interface ConnectClientInfoShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** mode as defined by the Nexa gateway. */
    readonly mode: (typeof ConnectClientInfomodeValues)[keyof typeof ConnectClientInfomodeValues];
    /** platform as defined by the Nexa gateway. */
    readonly platform: string;
    /** version as defined by the Nexa gateway. */
    readonly version: string;
}

/** ConnectClientInfo from the Nexa wire protocol. */
export type ConnectClientInfo = ConnectClientInfoShape;

/** ConnectParams wire fields. */
export interface ConnectParamsShape {
    /** client as defined by the Nexa gateway. */
    readonly client: ConnectClientInfo;
    /** maxProtocol as defined by the Nexa gateway. */
    readonly maxProtocol: number;
    /** minProtocol as defined by the Nexa gateway. */
    readonly minProtocol: number;
    /** nonce as defined by the Nexa gateway. */
    readonly nonce: string;
}

/** ConnectParams from the Nexa wire protocol. */
export type ConnectParams = ConnectParamsShape;

/** ContentBlockVariant0 wire fields. */
export interface ContentBlockVariant0Shape {
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'text';
}

/** ContentBlockVariant1 wire fields. */
export interface ContentBlockVariant1Shape {
    /** signature as defined by the Nexa gateway. */
    readonly signature?: string;
    /** thinking as defined by the Nexa gateway. */
    readonly thinking: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'thinking';
}

/** ContentBlockVariant2 wire fields. */
export interface ContentBlockVariant2Shape {
    /** data as defined by the Nexa gateway. */
    readonly data: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'redacted-thinking';
}

/** ContentBlockVariant3 wire fields. */
export interface ContentBlockVariant3Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'image';
}

/** ContentBlockVariant4 wire fields. */
export interface ContentBlockVariant4Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'video';
}

/** ContentBlockVariant5 wire fields. */
export interface ContentBlockVariant5Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'video-frame';
}

/** ContentBlockVariant6 wire fields. */
export interface ContentBlockVariant6Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'document';
}

/** ContentBlockVariant7 wire fields. */
export interface ContentBlockVariant7Shape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** input as defined by the Nexa gateway. */
    readonly input: JsonValue;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** signature as defined by the Nexa gateway. */
    readonly signature?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'tool-use';
}

/** ContentBlockVariant8 wire fields. */
export interface ContentBlockVariant8Shape {
    /** content as defined by the Nexa gateway. */
    readonly content: ReadonlyArray<ContentBlock> | string;
    /** inspectedMediaSha256 as defined by the Nexa gateway. */
    readonly inspectedMediaSha256?: ReadonlyArray<string>;
    /** isError as defined by the Nexa gateway. */
    readonly isError?: boolean;
    /** toolUseId as defined by the Nexa gateway. */
    readonly toolUseId: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'tool-result';
}

/** ContentBlock from the Nexa wire protocol. */
export type ContentBlock =
    | ContentBlockVariant0Shape
    | ContentBlockVariant1Shape
    | ContentBlockVariant2Shape
    | ContentBlockVariant3Shape
    | ContentBlockVariant4Shape
    | ContentBlockVariant5Shape
    | ContentBlockVariant6Shape
    | ContentBlockVariant7Shape
    | ContentBlockVariant8Shape;

/** ConversationSurface wire fields. */
export interface ConversationSurfaceShape {
    /** channel as defined by the Nexa gateway. */
    readonly channel: string;
    /** formatting as defined by the Nexa gateway. */
    readonly formatting?: SurfaceFormatting;
    /** kind as defined by the Nexa gateway. */
    readonly kind: SurfaceKind;
    /** lenders as defined by the Nexa gateway. */
    readonly lenders?: ReadonlyArray<MemoryLender>;
    /** participants as defined by the Nexa gateway. */
    readonly participants?: ReadonlyArray<SurfaceParticipant>;
    /** personalPlace as defined by the Nexa gateway. */
    readonly personalPlace?: boolean;
    /** roomId as defined by the Nexa gateway. */
    readonly roomId: string;
    /** roomTitle as defined by the Nexa gateway. */
    readonly roomTitle?: string;
    /** speaker as defined by the Nexa gateway. */
    readonly speaker?: SurfaceParticipant;
}

/** ConversationSurface from the Nexa wire protocol. */
export type ConversationSurface = ConversationSurfaceShape;

/** Allowed values for CreditScope. */
export const CreditScopeValues = {
    Value0: 'agent',
    Value1: 'conversation',
    Value2: 'global',
    Value3: 'project',
    Value4: 'user',
} as const;

/** CreditScope from the Nexa wire protocol. */
export type CreditScope = (typeof CreditScopeValues)[keyof typeof CreditScopeValues];

/** CreditSummary wire fields. */
export interface CreditSummaryShape {
    /** byKind as defined by the Nexa gateway. */
    readonly byKind: Recordstringnumber;
    /** byModel as defined by the Nexa gateway. */
    readonly byModel: Recordstringnumber;
    /** cachedInputTokens as defined by the Nexa gateway. */
    readonly cachedInputTokens: number;
    /** entries as defined by the Nexa gateway. */
    readonly entries: number;
    /** from as defined by the Nexa gateway. */
    readonly from: number;
    /** inputTokens as defined by the Nexa gateway. */
    readonly inputTokens: number;
    /** microcents as defined by the Nexa gateway. */
    readonly microcents: number;
    /** outputTokens as defined by the Nexa gateway. */
    readonly outputTokens: number;
    /** scope as defined by the Nexa gateway. */
    readonly scope: CreditScope;
    /** scopeId as defined by the Nexa gateway. */
    readonly scopeId: string;
    /** to as defined by the Nexa gateway. */
    readonly to: number;
}

/** CreditSummary from the Nexa wire protocol. */
export type CreditSummary = CreditSummaryShape;

/** Allowed values for CreditSummaryParamsscope. */
export const CreditSummaryParamsscopeValues = {
    Value0: 'agent',
    Value1: 'conversation',
    Value2: 'global',
    Value3: 'project',
    Value4: 'user',
} as const;

/** CreditSummaryParams wire fields. */
export interface CreditSummaryParamsShape {
    /** from as defined by the Nexa gateway. */
    readonly from?: number;
    /** scope as defined by the Nexa gateway. */
    readonly scope?: (typeof CreditSummaryParamsscopeValues)[keyof typeof CreditSummaryParamsscopeValues];
    /** scopeId as defined by the Nexa gateway. */
    readonly scopeId?: string;
    /** to as defined by the Nexa gateway. */
    readonly to?: number;
}

/** CreditSummaryParams from the Nexa wire protocol. */
export type CreditSummaryParams = CreditSummaryParamsShape;

/** DeadLetter wire fields. */
export interface DeadLetterShape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId: null | string;
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** channel as defined by the Nexa gateway. */
    readonly channel: string;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** messageId as defined by the Nexa gateway. */
    readonly messageId?: string;
    /** reason as defined by the Nexa gateway. */
    readonly reason: string;
    /** senderId as defined by the Nexa gateway. */
    readonly senderId: string;
    /** sessionKey as defined by the Nexa gateway. */
    readonly sessionKey: null | string;
    /** stage as defined by the Nexa gateway. */
    readonly stage: DeadLetterStage;
    /** text as defined by the Nexa gateway. */
    readonly text?: string;
    /** textHash as defined by the Nexa gateway. */
    readonly textHash: string;
    /** textLength as defined by the Nexa gateway. */
    readonly textLength: number;
    /** threadId as defined by the Nexa gateway. */
    readonly threadId?: string;
}

/** DeadLetter from the Nexa wire protocol. */
export type DeadLetter = DeadLetterShape;

/** Allowed values for DeadLetterStage. */
export const DeadLetterStageValues = {
    Value0: 'deliver',
    Value1: 'gate',
    Value2: 'route',
    Value3: 'turn',
} as const;

/** DeadLetterStage from the Nexa wire protocol. */
export type DeadLetterStage = (typeof DeadLetterStageValues)[keyof typeof DeadLetterStageValues];

/** DeliveredAttachment wire fields. */
export interface DeliveredAttachmentShape {
    /** asFile as defined by the Nexa gateway. */
    readonly asFile?: boolean;
    /** byteLength as defined by the Nexa gateway. */
    readonly byteLength: number;
    /** description as defined by the Nexa gateway. */
    readonly description?: string;
    /** filename as defined by the Nexa gateway. */
    readonly filename: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** mimeType as defined by the Nexa gateway. */
    readonly mimeType: string;
}

/** DeliveredAttachment from the Nexa wire protocol. */
export type DeliveredAttachment = DeliveredAttachmentShape;

/** DeliveryDestination wire fields. */
export interface DeliveryDestinationShape {
    /** channel as defined by the Nexa gateway. */
    readonly channel: string;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId: string;
    /** threadId as defined by the Nexa gateway. */
    readonly threadId: null | string;
}

/** DeliveryDestination from the Nexa wire protocol. */
export type DeliveryDestination = DeliveryDestinationShape;

/** DeliveryReceipt wire fields. */
export interface DeliveryReceiptShape {
    /** acknowledgment as defined by the Nexa gateway. */
    readonly acknowledgment: DeliveryDestination;
    /** at as defined by the Nexa gateway. */
    readonly at: string;
    /** byteLength as defined by the Nexa gateway. */
    readonly byteLength: string;
    /** destination as defined by the Nexa gateway. */
    readonly destination: DeliveryDestination;
    /** filename as defined by the Nexa gateway. */
    readonly filename: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** mediaId as defined by the Nexa gateway. */
    readonly mediaId: null | string;
    /** messageId as defined by the Nexa gateway. */
    readonly messageId: null | string;
    /** mimeType as defined by the Nexa gateway. */
    readonly mimeType: string;
    /** path as defined by the Nexa gateway. */
    readonly path: null | string;
    /** revision as defined by the Nexa gateway. */
    readonly revision: null | string;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
    /** sha256 as defined by the Nexa gateway. */
    readonly sha256: string;
    /** taskId as defined by the Nexa gateway. */
    readonly taskId: null | string;
    /** toolCallId as defined by the Nexa gateway. */
    readonly toolCallId: string;
    /** turnId as defined by the Nexa gateway. */
    readonly turnId: null | string;
}

/** DeliveryReceipt from the Nexa wire protocol. */
export type DeliveryReceipt = DeliveryReceiptShape;

/** DeviceApproveParams wire fields. */
export interface DeviceApproveParamsShape {
    /** requestId as defined by the Nexa gateway. */
    readonly requestId: string;
    /** scopes as defined by the Nexa gateway. */
    readonly scopes?: ReadonlyArray<Scope>;
}

/** DeviceApproveParams from the Nexa wire protocol. */
export type DeviceApproveParams = DeviceApproveParamsShape;

/** DeviceApproveResult wire fields. */
export interface DeviceApproveResultShape {
    /** device as defined by the Nexa gateway. */
    readonly device: DeviceInfo;
    /** token as defined by the Nexa gateway. */
    readonly token: string;
}

/** DeviceApproveResult from the Nexa wire protocol. */
export type DeviceApproveResult = DeviceApproveResultShape;

/** DeviceInfo wire fields. */
export interface DeviceInfoShape {
    /** approvedAt as defined by the Nexa gateway. */
    readonly approvedAt: number;
    /** deviceId as defined by the Nexa gateway. */
    readonly deviceId: string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** principalId as defined by the Nexa gateway. */
    readonly principalId?: string;
    /** scopes as defined by the Nexa gateway. */
    readonly scopes: ReadonlyArray<Scope>;
}

/** DeviceInfo from the Nexa wire protocol. */
export type DeviceInfo = DeviceInfoShape;

/** DeviceListResult wire fields. */
export interface DeviceListResultShape {
    /** approved as defined by the Nexa gateway. */
    readonly approved: ReadonlyArray<DeviceInfo>;
    /** pending as defined by the Nexa gateway. */
    readonly pending: ReadonlyArray<DeviceRequestInfo>;
}

/** DeviceListResult from the Nexa wire protocol. */
export type DeviceListResult = DeviceListResultShape;

/** DeviceRefParams wire fields. */
export interface DeviceRefParamsShape {
    /** deviceId as defined by the Nexa gateway. */
    readonly deviceId: string;
}

/** DeviceRefParams from the Nexa wire protocol. */
export type DeviceRefParams = DeviceRefParamsShape;

/** DeviceRequestInfo wire fields. */
export interface DeviceRequestInfoShape {
    /** createdAt as defined by the Nexa gateway. */
    readonly createdAt: number;
    /** deviceId as defined by the Nexa gateway. */
    readonly deviceId: string;
    /** expiresAt as defined by the Nexa gateway. */
    readonly expiresAt: number;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** remoteAddress as defined by the Nexa gateway. */
    readonly remoteAddress: string;
    /** requestId as defined by the Nexa gateway. */
    readonly requestId: string;
    /** requestedScopes as defined by the Nexa gateway. */
    readonly requestedScopes: ReadonlyArray<Scope>;
}

/** DeviceRequestInfo from the Nexa wire protocol. */
export type DeviceRequestInfo = DeviceRequestInfoShape;

/** Allowed values for ErrorCode. */
export const ErrorCodeValues = {
    Value0: 'aborted',
    Value1: 'auth',
    Value2: 'budget-exhausted',
    Value3: 'config',
    Value4: 'context-overflow',
    Value5: 'denied',
    Value6: 'forbidden',
    Value7: 'internal',
    Value8: 'invalid-request',
    Value9: 'network',
    Value10: 'not-found',
    Value11: 'protocol',
    Value12: 'rate-limit',
    Value13: 'timeout',
    Value14: 'tool-execution',
    Value15: 'tool-input',
    Value16: 'upstream',
} as const;

/** ErrorCode from the Nexa wire protocol. */
export type ErrorCode = (typeof ErrorCodeValues)[keyof typeof ErrorCodeValues];

/** Allowed values for FinishReason. */
export const FinishReasonValues = {
    Value0: 'aborted',
    Value1: 'error',
    Value2: 'length',
    Value3: 'refusal',
    Value4: 'stop',
    Value5: 'stop-sequence',
    Value6: 'tool-use',
    Value7: 'unknown',
} as const;

/** FinishReason from the Nexa wire protocol. */
export type FinishReason = (typeof FinishReasonValues)[keyof typeof FinishReasonValues];

/** Session wire fields. */
export interface SessionShape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId: string;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId: null | string;
    /** createdAt as defined by the Nexa gateway. */
    readonly createdAt: number;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** messageCount as defined by the Nexa gateway. */
    readonly messageCount: number;
    /** participants as defined by the Nexa gateway. */
    readonly participants: ReadonlyArray<string>;
    /** projectId as defined by the Nexa gateway. */
    readonly projectId?: string;
    /** resumeCwd as defined by the Nexa gateway. */
    readonly resumeCwd?: string;
    /** resumeEligible as defined by the Nexa gateway. */
    readonly resumeEligible?: boolean;
    /** resumePending as defined by the Nexa gateway. */
    readonly resumePending?: boolean;
    /** resumePrincipal as defined by the Nexa gateway. */
    readonly resumePrincipal?: ToolPrincipal;
    /** resumeSurface as defined by the Nexa gateway. */
    readonly resumeSurface?: ConversationSurface;
    /** title as defined by the Nexa gateway. */
    readonly title: null | string;
    /** turnOpen as defined by the Nexa gateway. */
    readonly turnOpen?: boolean;
    /** updatedAt as defined by the Nexa gateway. */
    readonly updatedAt: number;
    /** usage as defined by the Nexa gateway. */
    readonly usage: TokenUsage;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
    /** workspaceId as defined by the Nexa gateway. */
    readonly workspaceId?: string;
}

/** Session from the Nexa wire protocol. */
export type Session = SessionShape;

/** GatewayFeatures wire fields. */
export interface GatewayFeaturesShape {
    /** attachments as defined by the Nexa gateway. */
    readonly attachments?: true;
    /** binaryMedia as defined by the Nexa gateway. */
    readonly binaryMedia?: true;
    /** events as defined by the Nexa gateway. */
    readonly events: ReadonlyArray<string>;
    /** methodScopes as defined by the Nexa gateway. */
    readonly methodScopes: RecordstringScope;
    /** methods as defined by the Nexa gateway. */
    readonly methods: ReadonlyArray<string>;
}

/** GatewayFeatures from the Nexa wire protocol. */
export type GatewayFeatures = GatewayFeaturesShape;

/** GatewayLimits wire fields. */
export interface GatewayLimitsShape {
    /** handshakeTimeoutMs as defined by the Nexa gateway. */
    readonly handshakeTimeoutMs: number;
    /** maxConnections as defined by the Nexa gateway. */
    readonly maxConnections: number;
    /** maxOutboundBytes as defined by the Nexa gateway. */
    readonly maxOutboundBytes: number;
    /** maxRequestBytes as defined by the Nexa gateway. */
    readonly maxRequestBytes: number;
    /** maxRequests as defined by the Nexa gateway. */
    readonly maxRequests: number;
    /** maxRequestsPerConnection as defined by the Nexa gateway. */
    readonly maxRequestsPerConnection: number;
    /** maxRequestsPerPrincipal as defined by the Nexa gateway. */
    readonly maxRequestsPerPrincipal: number;
    /** maxStreams as defined by the Nexa gateway. */
    readonly maxStreams: number;
    /** maxStreamsPerConnection as defined by the Nexa gateway. */
    readonly maxStreamsPerConnection: number;
    /** maxStreamsPerPrincipal as defined by the Nexa gateway. */
    readonly maxStreamsPerPrincipal: number;
    /** maxSubscriptionsPerConnection as defined by the Nexa gateway. */
    readonly maxSubscriptionsPerConnection: number;
}

/** GatewayLimits from the Nexa wire protocol. */
export type GatewayLimits = GatewayLimitsShape;

/** GatewayMethodsaccounts_create wire fields. */
export interface GatewayMethodsaccounts_createShape {
    /** params as defined by the Nexa gateway. */
    readonly params: AccountCreateParams;
    /** result as defined by the Nexa gateway. */
    readonly result: AccountSummary;
}

/** GatewayMethodsaccounts_list wire fields. */
export interface GatewayMethodsaccounts_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<AccountSummary>;
}

/** GatewayMethodsaccounts_remove wire fields. */
export interface GatewayMethodsaccounts_removeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: AccountRemoveParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsaccounts_usage wire fields. */
export interface GatewayMethodsaccounts_usageShape {
    /** params as defined by the Nexa gateway. */
    readonly params: AccountsUsageParams;
    /** result as defined by the Nexa gateway. */
    readonly result: AccountsUsageResult;
}

/** GatewayMethodsagent_ask wire fields. */
export interface GatewayMethodsagent_askShape {
    /** params as defined by the Nexa gateway. */
    readonly params: AskParams;
    /** result as defined by the Nexa gateway. */
    readonly result: AskResult;
}

/** GatewayMethodsagent_stream wire fields. */
export interface GatewayMethodsagent_streamShape {
    /** params as defined by the Nexa gateway. */
    readonly params: StreamParams;
    /** result as defined by the Nexa gateway. */
    readonly result: StreamAccepted;
}

/** GatewayMethodsagents_define wire fields. */
export interface GatewayMethodsagents_defineShape {
    /** params as defined by the Nexa gateway. */
    readonly params: AgentDefineParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsagents_list wire fields. */
export interface GatewayMethodsagents_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<AgentDefinition>;
}

/** GatewayMethodsapprovals_list wire fields. */
export interface GatewayMethodsapprovals_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<PendingApproval>;
}

/** GatewayMethodsapprovals_resolve wire fields. */
export interface GatewayMethodsapprovals_resolveShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ApprovalResolveParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodschannels_deadLetters_list wire fields. */
export interface GatewayMethodschannels_deadLetters_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<DeadLetter>;
}

/** GatewayMethodschannels_list wire fields. */
export interface GatewayMethodschannels_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<ChannelInfo>;
}

/** GatewayMethodschannels_status wire fields. */
export interface GatewayMethodschannels_statusShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ChannelStatusResult;
}

/** GatewayMethodsconfig_get wire fields. */
export interface GatewayMethodsconfig_getShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ConfigResult;
}

/** GatewayMethodsconfig_set wire fields. */
export interface GatewayMethodsconfig_setShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ConfigWriteParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ConfigWriteResult;
}

/** GatewayMethodsconfig_unsetparams wire fields. */
export interface GatewayMethodsconfig_unsetparamsShape {
    /** key as defined by the Nexa gateway. */
    readonly key: string;
}

/** GatewayMethodsconfig_unset wire fields. */
export interface GatewayMethodsconfig_unsetShape {
    /** params as defined by the Nexa gateway. */
    readonly params: GatewayMethodsconfig_unsetparamsShape;
    /** result as defined by the Nexa gateway. */
    readonly result: ConfigWriteResult;
}

/** GatewayMethodsconnect wire fields. */
export interface GatewayMethodsconnectShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ConnectParams;
    /** result as defined by the Nexa gateway. */
    readonly result: HelloOk;
}

/** GatewayMethodscredit_budgets wire fields. */
export interface GatewayMethodscredit_budgetsShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<Budget>;
}

/** GatewayMethodscredit_removeBudgetparams wire fields. */
export interface GatewayMethodscredit_removeBudgetparamsShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** GatewayMethodscredit_removeBudgetresult wire fields. */
export interface GatewayMethodscredit_removeBudgetresultShape {
    /** ok as defined by the Nexa gateway. */
    readonly ok: true;
}

/** GatewayMethodscredit_removeBudget wire fields. */
export interface GatewayMethodscredit_removeBudgetShape {
    /** params as defined by the Nexa gateway. */
    readonly params: GatewayMethodscredit_removeBudgetparamsShape;
    /** result as defined by the Nexa gateway. */
    readonly result: GatewayMethodscredit_removeBudgetresultShape;
}

/** GatewayMethodscredit_setBudgetparams wire fields. */
export interface GatewayMethodscredit_setBudgetparamsShape {
    /** enforcement as defined by the Nexa gateway. */
    readonly enforcement: BudgetEnforcement;
    /** id as defined by the Nexa gateway. */
    readonly id?: string;
    /** limitMicrocents as defined by the Nexa gateway. */
    readonly limitMicrocents: number;
    /** period as defined by the Nexa gateway. */
    readonly period: BudgetPeriod;
    /** scope as defined by the Nexa gateway. */
    readonly scope: CreditScope;
    /** scopeId as defined by the Nexa gateway. */
    readonly scopeId: string;
}

/** GatewayMethodscredit_setBudget wire fields. */
export interface GatewayMethodscredit_setBudgetShape {
    /** params as defined by the Nexa gateway. */
    readonly params: GatewayMethodscredit_setBudgetparamsShape;
    /** result as defined by the Nexa gateway. */
    readonly result: Budget;
}

/** GatewayMethodscredit_summary wire fields. */
export interface GatewayMethodscredit_summaryShape {
    /** params as defined by the Nexa gateway. */
    readonly params: CreditSummaryParams;
    /** result as defined by the Nexa gateway. */
    readonly result: CreditSummary;
}

/** GatewayMethodsdevices_approve wire fields. */
export interface GatewayMethodsdevices_approveShape {
    /** params as defined by the Nexa gateway. */
    readonly params: DeviceApproveParams;
    /** result as defined by the Nexa gateway. */
    readonly result: DeviceApproveResult;
}

/** GatewayMethodsdevices_list wire fields. */
export interface GatewayMethodsdevices_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: DeviceListResult;
}

/** GatewayMethodsdevices_reject wire fields. */
export interface GatewayMethodsdevices_rejectShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsdevices_revoke wire fields. */
export interface GatewayMethodsdevices_revokeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: DeviceRefParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodshealth wire fields. */
export interface GatewayMethodshealthShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: HealthResult;
}

/** GatewayMethodsjobs_add wire fields. */
export interface GatewayMethodsjobs_addShape {
    /** params as defined by the Nexa gateway. */
    readonly params: JobAddParams;
    /** result as defined by the Nexa gateway. */
    readonly result: IdParams;
}

/** GatewayMethodsjobs_list wire fields. */
export interface GatewayMethodsjobs_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<Job>;
}

/** GatewayMethodsjobs_remove wire fields. */
export interface GatewayMethodsjobs_removeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodslogs_tail wire fields. */
export interface GatewayMethodslogs_tailShape {
    /** params as defined by the Nexa gateway. */
    readonly params: LogTailParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<LogRecord>;
}

/** GatewayMethodsmedia_acknowledge wire fields. */
export interface GatewayMethodsmedia_acknowledgeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: MediaAcknowledgeParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodssessions_delete wire fields. */
export interface GatewayMethodssessions_deleteShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodssessions_download wire fields. */
export interface GatewayMethodssessions_downloadShape {
    /** params as defined by the Nexa gateway. */
    readonly params: SessionFileParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodssessions_files wire fields. */
export interface GatewayMethodssessions_filesShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<DeliveredAttachment>;
}

/** GatewayMethodssessions_get wire fields. */
export interface GatewayMethodssessions_getShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: Session | null;
}

/** GatewayMethodssessions_list wire fields. */
export interface GatewayMethodssessions_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: SessionListParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<Session>;
}

/** GatewayMethodssessions_messages wire fields. */
export interface GatewayMethodssessions_messagesShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<ModelMessage>;
}

/** GatewayMethodssessions_subscribe wire fields. */
export interface GatewayMethodssessions_subscribeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: SessionRef;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodssessions_unsubscribe wire fields. */
export interface GatewayMethodssessions_unsubscribeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: SessionRef;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsshares_create wire fields. */
export interface GatewayMethodsshares_createShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ShareCreateParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ShareSummary;
}

/** GatewayMethodsshares_list wire fields. */
export interface GatewayMethodsshares_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<ShareSummary>;
}

/** GatewayMethodsshares_remove wire fields. */
export interface GatewayMethodsshares_removeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsshares_setMember wire fields. */
export interface GatewayMethodsshares_setMemberShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ShareMemberParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ShareSummary;
}

/** GatewayMethodstasks_cancel wire fields. */
export interface GatewayMethodstasks_cancelShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodstasks_get wire fields. */
export interface GatewayMethodstasks_getShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: TaskRecord | null;
}

/** GatewayMethodstasks_list wire fields. */
export interface GatewayMethodstasks_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<TaskRecord>;
}

/** GatewayMethodsteams_create wire fields. */
export interface GatewayMethodsteams_createShape {
    /** params as defined by the Nexa gateway. */
    readonly params: TeamCreateParams;
    /** result as defined by the Nexa gateway. */
    readonly result: TeamSummary;
}

/** GatewayMethodsteams_list wire fields. */
export interface GatewayMethodsteams_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<TeamSummary>;
}

/** GatewayMethodsteams_remove wire fields. */
export interface GatewayMethodsteams_removeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsteams_setMember wire fields. */
export interface GatewayMethodsteams_setMemberShape {
    /** params as defined by the Nexa gateway. */
    readonly params: TeamMemberParams;
    /** result as defined by the Nexa gateway. */
    readonly result: TeamSummary;
}

/** GatewayMethodsvoice_audio wire fields. */
export interface GatewayMethodsvoice_audioShape {
    /** params as defined by the Nexa gateway. */
    readonly params: VoiceAudioParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsvoice_start wire fields. */
export interface GatewayMethodsvoice_startShape {
    /** params as defined by the Nexa gateway. */
    readonly params: VoiceStartParams;
    /** result as defined by the Nexa gateway. */
    readonly result: VoiceStarted;
}

/** GatewayMethodsvoice_stop wire fields. */
export interface GatewayMethodsvoice_stopShape {
    /** params as defined by the Nexa gateway. */
    readonly params: VoiceStopParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsworkspaces_create wire fields. */
export interface GatewayMethodsworkspaces_createShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkspaceCreateParams;
    /** result as defined by the Nexa gateway. */
    readonly result: Workspace;
}

/** GatewayMethodsworkspaces_describe wire fields. */
export interface GatewayMethodsworkspaces_describeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkspaceDescription;
}

/** GatewayMethodsworkspaces_destroy wire fields. */
export interface GatewayMethodsworkspaces_destroyShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkspaceDestroyParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsworkspaces_list wire fields. */
export interface GatewayMethodsworkspaces_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<Workspace>;
}

/** GatewayMethods wire fields. */
export interface GatewayMethodsShape {
    /** accounts.create as defined by the Nexa gateway. */
    readonly 'accounts.create': GatewayMethodsaccounts_createShape;
    /** accounts.list as defined by the Nexa gateway. */
    readonly 'accounts.list': GatewayMethodsaccounts_listShape;
    /** accounts.remove as defined by the Nexa gateway. */
    readonly 'accounts.remove': GatewayMethodsaccounts_removeShape;
    /** accounts.usage as defined by the Nexa gateway. */
    readonly 'accounts.usage': GatewayMethodsaccounts_usageShape;
    /** agent.ask as defined by the Nexa gateway. */
    readonly 'agent.ask': GatewayMethodsagent_askShape;
    /** agent.stream as defined by the Nexa gateway. */
    readonly 'agent.stream': GatewayMethodsagent_streamShape;
    /** agents.define as defined by the Nexa gateway. */
    readonly 'agents.define': GatewayMethodsagents_defineShape;
    /** agents.list as defined by the Nexa gateway. */
    readonly 'agents.list': GatewayMethodsagents_listShape;
    /** approvals.list as defined by the Nexa gateway. */
    readonly 'approvals.list': GatewayMethodsapprovals_listShape;
    /** approvals.resolve as defined by the Nexa gateway. */
    readonly 'approvals.resolve': GatewayMethodsapprovals_resolveShape;
    /** channels.deadLetters.list as defined by the Nexa gateway. */
    readonly 'channels.deadLetters.list': GatewayMethodschannels_deadLetters_listShape;
    /** channels.list as defined by the Nexa gateway. */
    readonly 'channels.list': GatewayMethodschannels_listShape;
    /** channels.status as defined by the Nexa gateway. */
    readonly 'channels.status': GatewayMethodschannels_statusShape;
    /** config.get as defined by the Nexa gateway. */
    readonly 'config.get': GatewayMethodsconfig_getShape;
    /** config.set as defined by the Nexa gateway. */
    readonly 'config.set': GatewayMethodsconfig_setShape;
    /** config.unset as defined by the Nexa gateway. */
    readonly 'config.unset': GatewayMethodsconfig_unsetShape;
    /** connect as defined by the Nexa gateway. */
    readonly connect: GatewayMethodsconnectShape;
    /** credit.budgets as defined by the Nexa gateway. */
    readonly 'credit.budgets': GatewayMethodscredit_budgetsShape;
    /** credit.removeBudget as defined by the Nexa gateway. */
    readonly 'credit.removeBudget': GatewayMethodscredit_removeBudgetShape;
    /** credit.setBudget as defined by the Nexa gateway. */
    readonly 'credit.setBudget': GatewayMethodscredit_setBudgetShape;
    /** credit.summary as defined by the Nexa gateway. */
    readonly 'credit.summary': GatewayMethodscredit_summaryShape;
    /** devices.approve as defined by the Nexa gateway. */
    readonly 'devices.approve': GatewayMethodsdevices_approveShape;
    /** devices.list as defined by the Nexa gateway. */
    readonly 'devices.list': GatewayMethodsdevices_listShape;
    /** devices.reject as defined by the Nexa gateway. */
    readonly 'devices.reject': GatewayMethodsdevices_rejectShape;
    /** devices.revoke as defined by the Nexa gateway. */
    readonly 'devices.revoke': GatewayMethodsdevices_revokeShape;
    /** health as defined by the Nexa gateway. */
    readonly health: GatewayMethodshealthShape;
    /** jobs.add as defined by the Nexa gateway. */
    readonly 'jobs.add': GatewayMethodsjobs_addShape;
    /** jobs.list as defined by the Nexa gateway. */
    readonly 'jobs.list': GatewayMethodsjobs_listShape;
    /** jobs.remove as defined by the Nexa gateway. */
    readonly 'jobs.remove': GatewayMethodsjobs_removeShape;
    /** logs.tail as defined by the Nexa gateway. */
    readonly 'logs.tail': GatewayMethodslogs_tailShape;
    /** media.acknowledge as defined by the Nexa gateway. */
    readonly 'media.acknowledge': GatewayMethodsmedia_acknowledgeShape;
    /** sessions.delete as defined by the Nexa gateway. */
    readonly 'sessions.delete': GatewayMethodssessions_deleteShape;
    /** sessions.download as defined by the Nexa gateway. */
    readonly 'sessions.download': GatewayMethodssessions_downloadShape;
    /** sessions.files as defined by the Nexa gateway. */
    readonly 'sessions.files': GatewayMethodssessions_filesShape;
    /** sessions.get as defined by the Nexa gateway. */
    readonly 'sessions.get': GatewayMethodssessions_getShape;
    /** sessions.list as defined by the Nexa gateway. */
    readonly 'sessions.list': GatewayMethodssessions_listShape;
    /** sessions.messages as defined by the Nexa gateway. */
    readonly 'sessions.messages': GatewayMethodssessions_messagesShape;
    /** sessions.subscribe as defined by the Nexa gateway. */
    readonly 'sessions.subscribe': GatewayMethodssessions_subscribeShape;
    /** sessions.unsubscribe as defined by the Nexa gateway. */
    readonly 'sessions.unsubscribe': GatewayMethodssessions_unsubscribeShape;
    /** shares.create as defined by the Nexa gateway. */
    readonly 'shares.create': GatewayMethodsshares_createShape;
    /** shares.list as defined by the Nexa gateway. */
    readonly 'shares.list': GatewayMethodsshares_listShape;
    /** shares.remove as defined by the Nexa gateway. */
    readonly 'shares.remove': GatewayMethodsshares_removeShape;
    /** shares.setMember as defined by the Nexa gateway. */
    readonly 'shares.setMember': GatewayMethodsshares_setMemberShape;
    /** tasks.cancel as defined by the Nexa gateway. */
    readonly 'tasks.cancel': GatewayMethodstasks_cancelShape;
    /** tasks.get as defined by the Nexa gateway. */
    readonly 'tasks.get': GatewayMethodstasks_getShape;
    /** tasks.list as defined by the Nexa gateway. */
    readonly 'tasks.list': GatewayMethodstasks_listShape;
    /** teams.create as defined by the Nexa gateway. */
    readonly 'teams.create': GatewayMethodsteams_createShape;
    /** teams.list as defined by the Nexa gateway. */
    readonly 'teams.list': GatewayMethodsteams_listShape;
    /** teams.remove as defined by the Nexa gateway. */
    readonly 'teams.remove': GatewayMethodsteams_removeShape;
    /** teams.setMember as defined by the Nexa gateway. */
    readonly 'teams.setMember': GatewayMethodsteams_setMemberShape;
    /** voice.audio as defined by the Nexa gateway. */
    readonly 'voice.audio': GatewayMethodsvoice_audioShape;
    /** voice.start as defined by the Nexa gateway. */
    readonly 'voice.start': GatewayMethodsvoice_startShape;
    /** voice.stop as defined by the Nexa gateway. */
    readonly 'voice.stop': GatewayMethodsvoice_stopShape;
    /** workspaces.create as defined by the Nexa gateway. */
    readonly 'workspaces.create': GatewayMethodsworkspaces_createShape;
    /** workspaces.describe as defined by the Nexa gateway. */
    readonly 'workspaces.describe': GatewayMethodsworkspaces_describeShape;
    /** workspaces.destroy as defined by the Nexa gateway. */
    readonly 'workspaces.destroy': GatewayMethodsworkspaces_destroyShape;
    /** workspaces.list as defined by the Nexa gateway. */
    readonly 'workspaces.list': GatewayMethodsworkspaces_listShape;
}

/** GatewayMethods from the Nexa wire protocol. */
export type GatewayMethods = GatewayMethodsShape;

/** HealthResult wire fields. */
export interface HealthResultShape {
    /** connections as defined by the Nexa gateway. */
    readonly connections: number;
    /** ok as defined by the Nexa gateway. */
    readonly ok: true;
    /** protocol as defined by the Nexa gateway. */
    readonly protocol: number;
    /** uptimeMs as defined by the Nexa gateway. */
    readonly uptimeMs: number;
    /** version as defined by the Nexa gateway. */
    readonly version: string;
}

/** HealthResult from the Nexa wire protocol. */
export type HealthResult = HealthResultShape;

/** Allowed values for HelloOkauthmethod. */
export const HelloOkauthmethodValues = {
    Value0: 'device',
    Value1: 'none',
    Value2: 'token',
} as const;

/** HelloOkauth wire fields. */
export interface HelloOkauthShape {
    /** method as defined by the Nexa gateway. */
    readonly method: (typeof HelloOkauthmethodValues)[keyof typeof HelloOkauthmethodValues];
    /** principalId as defined by the Nexa gateway. */
    readonly principalId: string;
    /** scopes as defined by the Nexa gateway. */
    readonly scopes: ReadonlyArray<Scope>;
    /** token as defined by the Nexa gateway. */
    readonly token?: string;
}

/** HelloOkpolicy wire fields. */
export interface HelloOkpolicyShape {
    /** heartbeatMs as defined by the Nexa gateway. */
    readonly heartbeatMs: number;
    /** limits as defined by the Nexa gateway. */
    readonly limits?: GatewayLimits;
    /** maxBufferedBytes as defined by the Nexa gateway. */
    readonly maxBufferedBytes: number;
    /** maxPayloadBytes as defined by the Nexa gateway. */
    readonly maxPayloadBytes: number;
    /** preHandshakeMaxBytes as defined by the Nexa gateway. */
    readonly preHandshakeMaxBytes: number;
}

/** HelloOkserver wire fields. */
export interface HelloOkserverShape {
    /** connId as defined by the Nexa gateway. */
    readonly connId: string;
    /** version as defined by the Nexa gateway. */
    readonly version: string;
}

/** HelloOksnapshot wire fields. */
export interface HelloOksnapshotShape {
    /** agents as defined by the Nexa gateway. */
    readonly agents: ReadonlyArray<AgentDefinition>;
    /** uptimeMs as defined by the Nexa gateway. */
    readonly uptimeMs: number;
}

/** HelloOk wire fields. */
export interface HelloOkShape {
    /** auth as defined by the Nexa gateway. */
    readonly auth: HelloOkauthShape;
    /** features as defined by the Nexa gateway. */
    readonly features: GatewayFeatures;
    /** minProtocol as defined by the Nexa gateway. */
    readonly minProtocol: number;
    /** policy as defined by the Nexa gateway. */
    readonly policy: HelloOkpolicyShape;
    /** protocol as defined by the Nexa gateway. */
    readonly protocol: number;
    /** server as defined by the Nexa gateway. */
    readonly server: HelloOkserverShape;
    /** snapshot as defined by the Nexa gateway. */
    readonly snapshot: HelloOksnapshotShape;
    /** type as defined by the Nexa gateway. */
    readonly type: 'hello-ok';
}

/** HelloOk from the Nexa wire protocol. */
export type HelloOk = HelloOkShape;

/** IdParams wire fields. */
export interface IdParamsShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** IdParams from the Nexa wire protocol. */
export type IdParams = IdParamsShape;

/** InboundAttachmentVariant0 wire fields. */
export interface InboundAttachmentVariant0Shape {
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'text';
}

/** InboundAttachmentVariant1 wire fields. */
export interface InboundAttachmentVariant1Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'image';
}

/** InboundAttachmentVariant2 wire fields. */
export interface InboundAttachmentVariant2Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'video';
}

/** InboundAttachmentVariant3 wire fields. */
export interface InboundAttachmentVariant3Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'video-frame';
}

/** InboundAttachmentVariant4 wire fields. */
export interface InboundAttachmentVariant4Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'document';
}

/** InboundAttachment from the Nexa wire protocol. */
export type InboundAttachment =
    | InboundAttachmentVariant0Shape
    | InboundAttachmentVariant1Shape
    | InboundAttachmentVariant2Shape
    | InboundAttachmentVariant3Shape
    | InboundAttachmentVariant4Shape;

/** Job wire fields. */
export interface JobShape {
    /** action as defined by the Nexa gateway. */
    readonly action: JobAction;
    /** allowConcurrent as defined by the Nexa gateway. */
    readonly allowConcurrent?: boolean;
    /** createdAt as defined by the Nexa gateway. */
    readonly createdAt: number;
    /** enabled as defined by the Nexa gateway. */
    readonly enabled: boolean;
    /** graceMs as defined by the Nexa gateway. */
    readonly graceMs?: number;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** maxRetries as defined by the Nexa gateway. */
    readonly maxRetries?: number;
    /** misfirePolicy as defined by the Nexa gateway. */
    readonly misfirePolicy: MisfirePolicy;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** owner as defined by the Nexa gateway. */
    readonly owner?: JobOwner;
    /** tags as defined by the Nexa gateway. */
    readonly tags?: ReadonlyArray<string>;
    /** timeoutMs as defined by the Nexa gateway. */
    readonly timeoutMs?: number;
    /** trigger as defined by the Nexa gateway. */
    readonly trigger: JobTrigger;
    /** updatedAt as defined by the Nexa gateway. */
    readonly updatedAt: number;
}

/** Job from the Nexa wire protocol. */
export type Job = JobShape;

/** JobActionVariant1 wire fields. */
export interface JobActionVariant1Shape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId: string;
    /** deliverTo as defined by the Nexa gateway. */
    readonly deliverTo?: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'agent-turn';
    /** prompt as defined by the Nexa gateway. */
    readonly prompt: string;
    /** silentWhenEmpty as defined by the Nexa gateway. */
    readonly silentWhenEmpty?: boolean;
}

/** Allowed values for JobActionVariant2elevation. */
export const JobActionVariant2elevationValues = {
    Value0: 'ask',
    Value1: 'full',
    Value2: 'off',
    Value3: 'on',
} as const;

/** JobActionVariant2 wire fields. */
export interface JobActionVariant2Shape {
    /** allowSelfLifecycle as defined by the Nexa gateway. */
    readonly allowSelfLifecycle?: boolean;
    /** command as defined by the Nexa gateway. */
    readonly command: string;
    /** cwd as defined by the Nexa gateway. */
    readonly cwd?: string;
    /** elevation as defined by the Nexa gateway. */
    readonly elevation?: (typeof JobActionVariant2elevationValues)[keyof typeof JobActionVariant2elevationValues];
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'shell';
    /** timeoutMs as defined by the Nexa gateway. */
    readonly timeoutMs?: number;
}

/** JobActionVariant3 wire fields. */
export interface JobActionVariant3Shape {
    /** input as defined by the Nexa gateway. */
    readonly input: JsonValue;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'tool';
    /** tool as defined by the Nexa gateway. */
    readonly tool: string;
}

/** JobActionVariant4 wire fields. */
export interface JobActionVariant4Shape {
    /** event as defined by the Nexa gateway. */
    readonly event: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'event';
    /** payload as defined by the Nexa gateway. */
    readonly payload?: JsonValue;
}

/** JobActionVariant5 wire fields. */
export interface JobActionVariant5Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'maintenance';
}

/** JobAction from the Nexa wire protocol. */
export type JobAction =
    | ReminderAction
    | JobActionVariant1Shape
    | JobActionVariant2Shape
    | JobActionVariant3Shape
    | JobActionVariant4Shape
    | JobActionVariant5Shape;

/** JobAddParams wire fields. */
export interface JobAddParamsShape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId?: string;
    /** at as defined by the Nexa gateway. */
    readonly at?: number;
    /** command as defined by the Nexa gateway. */
    readonly command?: string;
    /** cron as defined by the Nexa gateway. */
    readonly cron?: string;
    /** deliverTo as defined by the Nexa gateway. */
    readonly deliverTo?: string;
    /** enabled as defined by the Nexa gateway. */
    readonly enabled?: boolean;
    /** intervalMs as defined by the Nexa gateway. */
    readonly intervalMs?: number;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** prompt as defined by the Nexa gateway. */
    readonly prompt?: string;
    /** silentWhenEmpty as defined by the Nexa gateway. */
    readonly silentWhenEmpty?: boolean;
    /** timezone as defined by the Nexa gateway. */
    readonly timezone?: string;
}

/** JobAddParams from the Nexa wire protocol. */
export type JobAddParams = JobAddParamsShape;

/** JobOwner wire fields. */
export interface JobOwnerShape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId?: string;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId?: string;
    /** projectId as defined by the Nexa gateway. */
    readonly projectId?: string;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** JobOwner from the Nexa wire protocol. */
export type JobOwner = JobOwnerShape;

/** JobTriggerVariant0 wire fields. */
export interface JobTriggerVariant0Shape {
    /** expression as defined by the Nexa gateway. */
    readonly expression: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'cron';
    /** timezone as defined by the Nexa gateway. */
    readonly timezone?: string;
}

/** JobTriggerVariant1 wire fields. */
export interface JobTriggerVariant1Shape {
    /** intervalMs as defined by the Nexa gateway. */
    readonly intervalMs: number;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'interval';
}

/** JobTriggerVariant2 wire fields. */
export interface JobTriggerVariant2Shape {
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'once';
}

/** JobTrigger from the Nexa wire protocol. */
export type JobTrigger =
    JobTriggerVariant0Shape | JobTriggerVariant1Shape | JobTriggerVariant2Shape;

/** Arbitrary JSON object. */
export interface JsonObject {
    readonly [key: string]: JsonValue;
}
/** Lossless JSON values carried by extensible protocol fields. */
export type JsonValue = string | number | boolean | null | ReadonlyArray<JsonValue> | JsonObject;

/** Allowed values for LogLevel. */
export const LogLevelValues = {
    Value0: 'debug',
    Value1: 'error',
    Value2: 'info',
    Value3: 'warn',
} as const;

/** LogLevel from the Nexa wire protocol. */
export type LogLevel = (typeof LogLevelValues)[keyof typeof LogLevelValues];

/** LogRecord wire fields. */
export interface LogRecordShape {
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** fields as defined by the Nexa gateway. */
    readonly fields: Recordstringstringnumberboolean;
    /** level as defined by the Nexa gateway. */
    readonly level: LogLevel;
    /** message as defined by the Nexa gateway. */
    readonly message: string;
    /** scope as defined by the Nexa gateway. */
    readonly scope: string;
}

/** LogRecord from the Nexa wire protocol. */
export type LogRecord = LogRecordShape;

/** Allowed values for LogTailParamslevel. */
export const LogTailParamslevelValues = {
    Value0: 'debug',
    Value1: 'error',
    Value2: 'info',
    Value3: 'warn',
} as const;

/** LogTailParams wire fields. */
export interface LogTailParamsShape {
    /** level as defined by the Nexa gateway. */
    readonly level?: (typeof LogTailParamslevelValues)[keyof typeof LogTailParamslevelValues];
    /** limit as defined by the Nexa gateway. */
    readonly limit?: number;
    /** scope as defined by the Nexa gateway. */
    readonly scope?: string;
    /** since as defined by the Nexa gateway. */
    readonly since?: number;
}

/** LogTailParams from the Nexa wire protocol. */
export type LogTailParams = LogTailParamsShape;

/** MediaAcknowledgeParams wire fields. */
export interface MediaAcknowledgeParamsShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** received as defined by the Nexa gateway. */
    readonly received: boolean;
}

/** MediaAcknowledgeParams from the Nexa wire protocol. */
export type MediaAcknowledgeParams = MediaAcknowledgeParamsShape;

/** Allowed values for MemoryLendermode. */
export const MemoryLendermodeValues = { Value0: 'all', Value1: 'partial' } as const;

/** MemoryLender wire fields. */
export interface MemoryLenderShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** mode as defined by the Nexa gateway. */
    readonly mode: (typeof MemoryLendermodeValues)[keyof typeof MemoryLendermodeValues];
    /** subjects as defined by the Nexa gateway. */
    readonly subjects?: ReadonlyArray<string>;
}

/** MemoryLender from the Nexa wire protocol. */
export type MemoryLender = MemoryLenderShape;

/** Allowed values for MessageRole. */
export const MessageRoleValues = {
    Value0: 'assistant',
    Value1: 'system',
    Value2: 'tool',
    Value3: 'user',
} as const;

/** MessageRole from the Nexa wire protocol. */
export type MessageRole = (typeof MessageRoleValues)[keyof typeof MessageRoleValues];

/** Allowed values for MisfirePolicy. */
export const MisfirePolicyValues = {
    Value0: 'run-all',
    Value1: 'run-if-recent',
    Value2: 'run-once',
    Value3: 'skip',
} as const;

/** MisfirePolicy from the Nexa wire protocol. */
export type MisfirePolicy = (typeof MisfirePolicyValues)[keyof typeof MisfirePolicyValues];

/** ModelMessage wire fields. */
export interface ModelMessageShape {
    /** content as defined by the Nexa gateway. */
    readonly content: ReadonlyArray<ContentBlock> | string;
    /** role as defined by the Nexa gateway. */
    readonly role: MessageRole;
}

/** ModelMessage from the Nexa wire protocol. */
export type ModelMessage = ModelMessageShape;

/** NcapAgentDelta wire fields. */
export interface NcapAgentDeltaShape {
    /** activity as defined by the Nexa gateway. */
    readonly activity: string;
    /** expert as defined by the Nexa gateway. */
    readonly expert: string;
    /** findings as defined by the Nexa gateway. */
    readonly findings: number;
    /** item as defined by the Nexa gateway. */
    readonly item: number;
    /** role as defined by the Nexa gateway. */
    readonly role: string;
    /** state as defined by the Nexa gateway. */
    readonly state: string;
    /** tokens as defined by the Nexa gateway. */
    readonly tokens: number;
    /** turn as defined by the Nexa gateway. */
    readonly turn: number;
}

/** NcapAgentDelta from the Nexa wire protocol. */
export type NcapAgentDelta = NcapAgentDeltaShape;

/** NcapAgentToolDelta wire fields. */
export interface NcapAgentToolDeltaShape {
    /** arguments as defined by the Nexa gateway. */
    readonly arguments: string;
    /** item as defined by the Nexa gateway. */
    readonly item: number;
    /** requestRef as defined by the Nexa gateway. */
    readonly requestRef: number;
    /** tool as defined by the Nexa gateway. */
    readonly tool: string;
}

/** NcapAgentToolDelta from the Nexa wire protocol. */
export type NcapAgentToolDelta = NcapAgentToolDeltaShape;

/** NcapArtifactDelta wire fields. */
export interface NcapArtifactDeltaShape {
    /** artifact as defined by the Nexa gateway. */
    readonly artifact: string;
    /** item as defined by the Nexa gateway. */
    readonly item: number;
    /** title as defined by the Nexa gateway. */
    readonly title: string;
}

/** NcapArtifactDelta from the Nexa wire protocol. */
export type NcapArtifactDelta = NcapArtifactDeltaShape;

/** Allowed values for NcapBlockDeltaphase. */
export const NcapBlockDeltaphaseValues = {
    Value0: 'begin',
    Value1: 'delta',
    Value2: 'end',
} as const;

/** NcapBlockDelta wire fields. */
export interface NcapBlockDeltaShape {
    /** blockId as defined by the Nexa gateway. */
    readonly blockId: number;
    /** blockKind as defined by the Nexa gateway. */
    readonly blockKind?: string;
    /** language as defined by the Nexa gateway. */
    readonly language?: string;
    /** path as defined by the Nexa gateway. */
    readonly path?: string;
    /** phase as defined by the Nexa gateway. */
    readonly phase: (typeof NcapBlockDeltaphaseValues)[keyof typeof NcapBlockDeltaphaseValues];
    /** query as defined by the Nexa gateway. */
    readonly query?: string;
    /** text as defined by the Nexa gateway. */
    readonly text?: string;
}

/** NcapBlockDelta from the Nexa wire protocol. */
export type NcapBlockDelta = NcapBlockDeltaShape;

/** NcapDeltabacklogVariant0 wire fields. */
export interface NcapDeltabacklogVariant0Shape {
    /** goal as defined by the Nexa gateway. */
    readonly goal: string;
    /** itemCount as defined by the Nexa gateway. */
    readonly itemCount: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'begin';
}

/** NcapDeltabacklogVariant1 wire fields. */
export interface NcapDeltabacklogVariant1Shape {
    /** acceptance as defined by the Nexa gateway. */
    readonly acceptance: ReadonlyArray<string>;
    /** dependsOn as defined by the Nexa gateway. */
    readonly dependsOn: ReadonlyArray<number>;
    /** id as defined by the Nexa gateway. */
    readonly id: number;
    /** kind as defined by the Nexa gateway. */
    readonly kind: string;
    /** parent as defined by the Nexa gateway. */
    readonly parent: null | number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'item';
    /** points as defined by the Nexa gateway. */
    readonly points: number;
    /** status as defined by the Nexa gateway. */
    readonly status: string;
    /** title as defined by the Nexa gateway. */
    readonly title: string;
}

/** NcapDeltabacklogVariant2 wire fields. */
export interface NcapDeltabacklogVariant2Shape {
    /** activity as defined by the Nexa gateway. */
    readonly activity: string;
    /** findings as defined by the Nexa gateway. */
    readonly findings: number;
    /** id as defined by the Nexa gateway. */
    readonly id: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'update';
    /** status as defined by the Nexa gateway. */
    readonly status: string;
    /** turn as defined by the Nexa gateway. */
    readonly turn: number;
}

/** NcapDeltabacklogVariant3 wire fields. */
export interface NcapDeltabacklogVariant3Shape {
    /** done as defined by the Nexa gateway. */
    readonly done: number;
    /** failed as defined by the Nexa gateway. */
    readonly failed: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'end';
    /** skipped as defined by the Nexa gateway. */
    readonly skipped: number;
    /** stoppedBy as defined by the Nexa gateway. */
    readonly stoppedBy: string;
}

/** NcapDeltaexpert wire fields. */
export interface NcapDeltaexpertShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** index as defined by the Nexa gateway. */
    readonly index: number;
    /** pass as defined by the Nexa gateway. */
    readonly pass: number;
    /** why as defined by the Nexa gateway. */
    readonly why: string;
}

/** NcapDeltapreflightitemsItem wire fields. */
export interface NcapDeltapreflightitemsItemShape {
    /** label as defined by the Nexa gateway. */
    readonly label: string;
    /** value as defined by the Nexa gateway. */
    readonly value: string;
}

/** NcapDeltapreflight wire fields. */
export interface NcapDeltapreflightShape {
    /** expertId as defined by the Nexa gateway. */
    readonly expertId: string;
    /** items as defined by the Nexa gateway. */
    readonly items: ReadonlyArray<NcapDeltapreflightitemsItemShape>;
    /** subQuestions as defined by the Nexa gateway. */
    readonly subQuestions: ReadonlyArray<string>;
}

/** NcapDeltareflectionstagesItem wire fields. */
export interface NcapDeltareflectionstagesItemShape {
    /** label as defined by the Nexa gateway. */
    readonly label: string;
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** NcapDeltareflection wire fields. */
export interface NcapDeltareflectionShape {
    /** stages as defined by the Nexa gateway. */
    readonly stages: ReadonlyArray<NcapDeltareflectionstagesItemShape>;
}

/** NcapDeltavideoVariant0 wire fields. */
export interface NcapDeltavideoVariant0Shape {
    /** fps as defined by the Nexa gateway. */
    readonly fps: number;
    /** frames as defined by the Nexa gateway. */
    readonly frames: number;
    /** height as defined by the Nexa gateway. */
    readonly height: number;
    /** model as defined by the Nexa gateway. */
    readonly model: string;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'accepted';
    /** videoId as defined by the Nexa gateway. */
    readonly videoId: string;
    /** width as defined by the Nexa gateway. */
    readonly width: number;
}

/** NcapDeltavideoVariant1 wire fields. */
export interface NcapDeltavideoVariant1Shape {
    /** completed as defined by the Nexa gateway. */
    readonly completed: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'progress';
    /** stage as defined by the Nexa gateway. */
    readonly stage: number;
    /** total as defined by the Nexa gateway. */
    readonly total: number;
    /** videoId as defined by the Nexa gateway. */
    readonly videoId: string;
}

/** NcapDeltavideoVariant2 wire fields. */
export interface NcapDeltavideoVariant2Shape {
    /** data as defined by the Nexa gateway. */
    readonly data: ReadonlyArray<number>;
    /** offset as defined by the Nexa gateway. */
    readonly offset: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'chunk';
    /** videoId as defined by the Nexa gateway. */
    readonly videoId: string;
}

/** NcapDeltavideoVariant3 wire fields. */
export interface NcapDeltavideoVariant3Shape {
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'end';
    /** totalBytes as defined by the Nexa gateway. */
    readonly totalBytes: number;
    /** videoId as defined by the Nexa gateway. */
    readonly videoId: string;
}

/** NcapDelta wire fields. */
export interface NcapDeltaShape {
    /** agent as defined by the Nexa gateway. */
    readonly agent?: NcapAgentDelta;
    /** agentId as defined by the Nexa gateway. */
    readonly agentId?: number;
    /** agentTool as defined by the Nexa gateway. */
    readonly agentTool?: NcapAgentToolDelta;
    /** artifact as defined by the Nexa gateway. */
    readonly artifact?: NcapArtifactDelta;
    /** backlog as defined by the Nexa gateway. */
    readonly backlog?:
        | NcapDeltabacklogVariant0Shape
        | NcapDeltabacklogVariant1Shape
        | NcapDeltabacklogVariant2Shape
        | NcapDeltabacklogVariant3Shape;
    /** block as defined by the Nexa gateway. */
    readonly block?: NcapBlockDelta;
    /** content as defined by the Nexa gateway. */
    readonly content: string;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId?: string;
    /** expert as defined by the Nexa gateway. */
    readonly expert?: NcapDeltaexpertShape;
    /** finding as defined by the Nexa gateway. */
    readonly finding?: NcapFindingDelta;
    /** graph as defined by the Nexa gateway. */
    readonly graph?: NcapGraphDelta;
    /** preflight as defined by the Nexa gateway. */
    readonly preflight?: NcapDeltapreflightShape;
    /** reasoning as defined by the Nexa gateway. */
    readonly reasoning: string;
    /** reflection as defined by the Nexa gateway. */
    readonly reflection?: NcapDeltareflectionShape;
    /** research as defined by the Nexa gateway. */
    readonly research?: NcapResearchDelta;
    /** skill as defined by the Nexa gateway. */
    readonly skill?: NcapSkillDelta;
    /** status as defined by the Nexa gateway. */
    readonly status?: string;
    /** steer as defined by the Nexa gateway. */
    readonly steer?: NcapSteerDelta;
    /** tool as defined by the Nexa gateway. */
    readonly tool?: NcapToolCall;
    /** usage as defined by the Nexa gateway. */
    readonly usage?: NcapUsage;
    /** video as defined by the Nexa gateway. */
    readonly video?:
        | NcapDeltavideoVariant0Shape
        | NcapDeltavideoVariant1Shape
        | NcapDeltavideoVariant2Shape
        | NcapDeltavideoVariant3Shape;
    /** voice as defined by the Nexa gateway. */
    readonly voice?: ReadonlyArray<number>;
}

/** NcapDelta from the Nexa wire protocol. */
export type NcapDelta = NcapDeltaShape;

/** NcapFindingDelta wire fields. */
export interface NcapFindingDeltaShape {
    /** claim as defined by the Nexa gateway. */
    readonly claim: string;
    /** evidence as defined by the Nexa gateway. */
    readonly evidence: string;
    /** location as defined by the Nexa gateway. */
    readonly location: string;
    /** reporters as defined by the Nexa gateway. */
    readonly reporters: ReadonlyArray<number>;
    /** seen as defined by the Nexa gateway. */
    readonly seen: number;
    /** severity as defined by the Nexa gateway. */
    readonly severity: string;
}

/** NcapFindingDelta from the Nexa wire protocol. */
export type NcapFindingDelta = NcapFindingDeltaShape;

/** Allowed values for NcapGraphDeltaphase. */
export const NcapGraphDeltaphaseValues = {
    Value0: 'begin',
    Value1: 'edge',
    Value2: 'end',
    Value3: 'grounding',
    Value4: 'node',
} as const;

/** NcapGraphDelta wire fields. */
export interface NcapGraphDeltaShape {
    /** edge as defined by the Nexa gateway. */
    readonly edge?: NcapGraphEdge;
    /** grounding as defined by the Nexa gateway. */
    readonly grounding?: NcapGrounding;
    /** node as defined by the Nexa gateway. */
    readonly node?: NcapGraphNode;
    /** phase as defined by the Nexa gateway. */
    readonly phase: (typeof NcapGraphDeltaphaseValues)[keyof typeof NcapGraphDeltaphaseValues];
    /** session as defined by the Nexa gateway. */
    readonly session?: string;
}

/** NcapGraphDelta from the Nexa wire protocol. */
export type NcapGraphDelta = NcapGraphDeltaShape;

/** NcapGraphEdge wire fields. */
export interface NcapGraphEdgeShape {
    /** confidence as defined by the Nexa gateway. */
    readonly confidence: number;
    /** kind as defined by the Nexa gateway. */
    readonly kind: string;
    /** source as defined by the Nexa gateway. */
    readonly source: string;
    /** span as defined by the Nexa gateway. */
    readonly span: NcapGraphSpan | null;
    /** target as defined by the Nexa gateway. */
    readonly target: string;
}

/** NcapGraphEdge from the Nexa wire protocol. */
export type NcapGraphEdge = NcapGraphEdgeShape;

/** NcapGraphNode wire fields. */
export interface NcapGraphNodeShape {
    /** generated as defined by the Nexa gateway. */
    readonly generated: boolean;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: string;
    /** label as defined by the Nexa gateway. */
    readonly label: string;
    /** language as defined by the Nexa gateway. */
    readonly language: string;
    /** overlayDirty as defined by the Nexa gateway. */
    readonly overlayDirty: boolean;
    /** owner as defined by the Nexa gateway. */
    readonly owner: null | string;
    /** parent as defined by the Nexa gateway. */
    readonly parent: null | string;
    /** recentChange as defined by the Nexa gateway. */
    readonly recentChange: null | string;
    /** resolution as defined by the Nexa gateway. */
    readonly resolution: string;
    /** span as defined by the Nexa gateway. */
    readonly span: NcapGraphSpan | null;
    /** summary as defined by the Nexa gateway. */
    readonly summary: null | string;
}

/** NcapGraphNode from the Nexa wire protocol. */
export type NcapGraphNode = NcapGraphNodeShape;

/** NcapGraphSpan wire fields. */
export interface NcapGraphSpanShape {
    /** line as defined by the Nexa gateway. */
    readonly line: number;
    /** path as defined by the Nexa gateway. */
    readonly path: string;
}

/** NcapGraphSpan from the Nexa wire protocol. */
export type NcapGraphSpan = NcapGraphSpanShape;

/** NcapGrounding wire fields. */
export interface NcapGroundingShape {
    /** activeReferences as defined by the Nexa gateway. */
    readonly activeReferences: ReadonlyArray<string>;
    /** anchors as defined by the Nexa gateway. */
    readonly anchors: ReadonlyArray<string>;
    /** mode as defined by the Nexa gateway. */
    readonly mode: string;
    /** overlayChanges as defined by the Nexa gateway. */
    readonly overlayChanges: number;
    /** snapshot as defined by the Nexa gateway. */
    readonly snapshot: string;
    /** verification as defined by the Nexa gateway. */
    readonly verification: string;
}

/** NcapGrounding from the Nexa wire protocol. */
export type NcapGrounding = NcapGroundingShape;

/** NcapResearchDelta wire fields. */
export interface NcapResearchDeltaShape {
    /** claim as defined by the Nexa gateway. */
    readonly claim: string;
    /** detail as defined by the Nexa gateway. */
    readonly detail: string;
    /** disputed as defined by the Nexa gateway. */
    readonly disputed: boolean;
    /** line as defined by the Nexa gateway. */
    readonly line: string;
    /** lines as defined by the Nexa gateway. */
    readonly lines: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: string;
    /** problem as defined by the Nexa gateway. */
    readonly problem: string;
    /** round as defined by the Nexa gateway. */
    readonly round: number;
    /** roundsTotal as defined by the Nexa gateway. */
    readonly roundsTotal: number;
    /** status as defined by the Nexa gateway. */
    readonly status: null | string;
    /** tokens as defined by the Nexa gateway. */
    readonly tokens: number;
}

/** NcapResearchDelta from the Nexa wire protocol. */
export type NcapResearchDelta = NcapResearchDeltaShape;

/** NcapSkillDelta wire fields. */
export interface NcapSkillDeltaShape {
    /** always as defined by the Nexa gateway. */
    readonly always: boolean;
    /** applied as defined by the Nexa gateway. */
    readonly applied: number;
    /** checkable as defined by the Nexa gateway. */
    readonly checkable: boolean;
    /** description as defined by the Nexa gateway. */
    readonly description: string;
    /** detail as defined by the Nexa gateway. */
    readonly detail: string;
    /** file as defined by the Nexa gateway. */
    readonly file: string;
    /** matched as defined by the Nexa gateway. */
    readonly matched: number;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** source as defined by the Nexa gateway. */
    readonly source: string;
    /** state as defined by the Nexa gateway. */
    readonly state: string;
}

/** NcapSkillDelta from the Nexa wire protocol. */
export type NcapSkillDelta = NcapSkillDeltaShape;

/** NcapSteerDeltadirectivesItem wire fields. */
export interface NcapSteerDeltadirectivesItemShape {
    /** item as defined by the Nexa gateway. */
    readonly item: null | number;
    /** kind as defined by the Nexa gateway. */
    readonly kind: string;
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** NcapSteerDelta wire fields. */
export interface NcapSteerDeltaShape {
    /** directives as defined by the Nexa gateway. */
    readonly directives: ReadonlyArray<NcapSteerDeltadirectivesItemShape>;
    /** round as defined by the Nexa gateway. */
    readonly round: number;
    /** summary as defined by the Nexa gateway. */
    readonly summary: string;
}

/** NcapSteerDelta from the Nexa wire protocol. */
export type NcapSteerDelta = NcapSteerDeltaShape;

/** NcapToolCall wire fields. */
export interface NcapToolCallShape {
    /** arguments as defined by the Nexa gateway. */
    readonly arguments: string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** partial as defined by the Nexa gateway. */
    readonly partial?: boolean;
    /** toolCallId as defined by the Nexa gateway. */
    readonly toolCallId: number;
}

/** NcapToolCall from the Nexa wire protocol. */
export type NcapToolCall = NcapToolCallShape;

/** NcapUsage wire fields. */
export interface NcapUsageShape {
    /** cachedTokens as defined by the Nexa gateway. */
    readonly cachedTokens: number;
    /** completionTokens as defined by the Nexa gateway. */
    readonly completionTokens: number;
    /** maxTokens as defined by the Nexa gateway. */
    readonly maxTokens: number;
    /** promptTokens as defined by the Nexa gateway. */
    readonly promptTokens: number;
}

/** NcapUsage from the Nexa wire protocol. */
export type NcapUsage = NcapUsageShape;

/** OkResult wire fields. */
export interface OkResultShape {
    /** ok as defined by the Nexa gateway. */
    readonly ok: true;
}

/** OkResult from the Nexa wire protocol. */
export type OkResult = OkResultShape;

/** PendingApproval wire fields. */
export interface PendingApprovalShape {
    /** approvalId as defined by the Nexa gateway. */
    readonly approvalId: string;
    /** detail as defined by the Nexa gateway. */
    readonly detail?: string;
    /** expiresAt as defined by the Nexa gateway. */
    readonly expiresAt: number;
    /** principalId as defined by the Nexa gateway. */
    readonly principalId: string;
    /** requestedAt as defined by the Nexa gateway. */
    readonly requestedAt: number;
    /** risk as defined by the Nexa gateway. */
    readonly risk: RiskLevel;
    /** runId as defined by the Nexa gateway. */
    readonly runId: null | string;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: null | string;
    /** summary as defined by the Nexa gateway. */
    readonly summary: string;
    /** tool as defined by the Nexa gateway. */
    readonly tool: string;
}

/** PendingApproval from the Nexa wire protocol. */
export type PendingApproval = PendingApprovalShape;

/** Allowed values for ReasoningOptionseffort. */
export const ReasoningOptionseffortValues = {
    Value0: 'high',
    Value1: 'low',
    Value2: 'max',
    Value3: 'medium',
    Value4: 'minimal',
    Value5: 'off',
    Value6: 'xhigh',
} as const;

/** ReasoningOptions wire fields. */
export interface ReasoningOptionsShape {
    /** effort as defined by the Nexa gateway. */
    readonly effort?: (typeof ReasoningOptionseffortValues)[keyof typeof ReasoningOptionseffortValues];
    /** include as defined by the Nexa gateway. */
    readonly include?: boolean;
    /** maxTokens as defined by the Nexa gateway. */
    readonly maxTokens?: number;
}

/** ReasoningOptions from the Nexa wire protocol. */
export type ReasoningOptions = ReasoningOptionsShape;

/** RecordstringScope from the Nexa wire protocol. */
export type RecordstringScope = Readonly<Record<string, Scope>>;

/** Recordstringnever from the Nexa wire protocol. */
export type Recordstringnever = Record<string, never>;

/** Recordstringnumber from the Nexa wire protocol. */
export type Recordstringnumber = Readonly<Record<string, number>>;

/** Recordstringstring from the Nexa wire protocol. */
export type Recordstringstring = Readonly<Record<string, string>>;

/** Recordstringstringnumberboolean from the Nexa wire protocol. */
export type Recordstringstringnumberboolean = Readonly<Record<string, string | number | boolean>>;

/** Recordstringunknown from the Nexa wire protocol. */
export type Recordstringunknown = Readonly<Record<string, JsonValue>>;

/** ReminderAction wire fields. */
export interface ReminderActionShape {
    /** channelId as defined by the Nexa gateway. */
    readonly channelId: string;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'reminder';
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** threadId as defined by the Nexa gateway. */
    readonly threadId?: string;
}

/** ReminderAction from the Nexa wire protocol. */
export type ReminderAction = ReminderActionShape;

/** Allowed values for RiskLevel. */
export const RiskLevelValues = {
    Value0: 'destructive',
    Value1: 'execute',
    Value2: 'read',
    Value3: 'write',
} as const;

/** RiskLevel from the Nexa wire protocol. */
export type RiskLevel = (typeof RiskLevelValues)[keyof typeof RiskLevelValues];

/** Allowed values for Scope. */
export const ScopeValues = { Value0: 'admin', Value1: 'read', Value2: 'write' } as const;

/** Scope from the Nexa wire protocol. */
export type Scope = (typeof ScopeValues)[keyof typeof ScopeValues];

/** SessionFileParams wire fields. */
export interface SessionFileParamsShape {
    /** attachmentId as defined by the Nexa gateway. */
    readonly attachmentId: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** SessionFileParams from the Nexa wire protocol. */
export type SessionFileParams = SessionFileParamsShape;

/** SessionListParams wire fields. */
export interface SessionListParamsShape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId?: string;
    /** limit as defined by the Nexa gateway. */
    readonly limit?: number;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** SessionListParams from the Nexa wire protocol. */
export type SessionListParams = SessionListParamsShape;

/** Allowed values for SessionMessageDatarole. */
export const SessionMessageDataroleValues = { Value0: 'assistant', Value1: 'user' } as const;

/** SessionMessageData wire fields. */
export interface SessionMessageDataShape {
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** attachments as defined by the Nexa gateway. */
    readonly attachments?: ReadonlyArray<InboundAttachment>;
    /** principalId as defined by the Nexa gateway. */
    readonly principalId: string;
    /** role as defined by the Nexa gateway. */
    readonly role: (typeof SessionMessageDataroleValues)[keyof typeof SessionMessageDataroleValues];
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId?: string;
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** SessionMessageData from the Nexa wire protocol. */
export type SessionMessageData = SessionMessageDataShape;

/** SessionRef wire fields. */
export interface SessionRefShape {
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
}

/** SessionRef from the Nexa wire protocol. */
export type SessionRef = SessionRefShape;

/** ShareCreateParams wire fields. */
export interface ShareCreateParamsShape {
    /** description as defined by the Nexa gateway. */
    readonly description?: string;
    /** id as defined by the Nexa gateway. */
    readonly id?: string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** path as defined by the Nexa gateway. */
    readonly path?: string;
}

/** ShareCreateParams from the Nexa wire protocol. */
export type ShareCreateParams = ShareCreateParamsShape;

/** ShareMemberParams wire fields. */
export interface ShareMemberParamsShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** mode as defined by the Nexa gateway. */
    readonly mode: null | string;
    /** shareId as defined by the Nexa gateway. */
    readonly shareId: string;
    /** subject as defined by the Nexa gateway. */
    readonly subject: string;
}

/** ShareMemberParams from the Nexa wire protocol. */
export type ShareMemberParams = ShareMemberParamsShape;

/** ShareSummarymembersItem wire fields. */
export interface ShareSummarymembersItemShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** mode as defined by the Nexa gateway. */
    readonly mode: string;
    /** subject as defined by the Nexa gateway. */
    readonly subject: string;
}

/** ShareSummary wire fields. */
export interface ShareSummaryShape {
    /** createdAt as defined by the Nexa gateway. */
    readonly createdAt: number;
    /** description as defined by the Nexa gateway. */
    readonly description?: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** members as defined by the Nexa gateway. */
    readonly members: ReadonlyArray<ShareSummarymembersItemShape>;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** path as defined by the Nexa gateway. */
    readonly path: string;
}

/** ShareSummary from the Nexa wire protocol. */
export type ShareSummary = ShareSummaryShape;

/** StreamAccepted wire fields. */
export interface StreamAcceptedShape {
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId: string;
}

/** StreamAccepted from the Nexa wire protocol. */
export type StreamAccepted = StreamAcceptedShape;

/** StreamParams wire fields. */
export interface StreamParamsShape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId?: string;
    /** attachments as defined by the Nexa gateway. */
    readonly attachments?: ReadonlyArray<InboundAttachment>;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId?: string;
    /** cwd as defined by the Nexa gateway. */
    readonly cwd?: string;
    /** message as defined by the Nexa gateway. */
    readonly message: string;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId?: string;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** StreamParams from the Nexa wire protocol. */
export type StreamParams = StreamParamsShape;

/** Allowed values for SurfaceFormattingmarkup. */
export const SurfaceFormattingmarkupValues = {
    Value0: 'commonmark',
    Value1: 'plain',
    Value2: 'slack',
    Value3: 'telegram',
} as const;

/** SurfaceFormatting wire fields. */
export interface SurfaceFormattingShape {
    /** markup as defined by the Nexa gateway. */
    readonly markup: (typeof SurfaceFormattingmarkupValues)[keyof typeof SurfaceFormattingmarkupValues];
    /** maxChars as defined by the Nexa gateway. */
    readonly maxChars?: number;
    /** tables as defined by the Nexa gateway. */
    readonly tables: boolean;
}

/** SurfaceFormatting from the Nexa wire protocol. */
export type SurfaceFormatting = SurfaceFormattingShape;

/** Allowed values for SurfaceKind. */
export const SurfaceKindValues = { Value0: 'direct', Value1: 'group' } as const;

/** SurfaceKind from the Nexa wire protocol. */
export type SurfaceKind = (typeof SurfaceKindValues)[keyof typeof SurfaceKindValues];

/** Allowed values for SurfaceParticipantrole. */
export const SurfaceParticipantroleValues = {
    Value0: 'admin',
    Value1: 'guest',
    Value2: 'member',
    Value3: 'owner',
} as const;

/** SurfaceParticipant wire fields. */
export interface SurfaceParticipantShape {
    /** displayName as defined by the Nexa gateway. */
    readonly displayName: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** role as defined by the Nexa gateway. */
    readonly role?: (typeof SurfaceParticipantroleValues)[keyof typeof SurfaceParticipantroleValues];
}

/** SurfaceParticipant from the Nexa wire protocol. */
export type SurfaceParticipant = SurfaceParticipantShape;

/** TaskRecord wire fields. */
export interface TaskRecordShape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId: null | string;
    /** cancelling as defined by the Nexa gateway. */
    readonly cancelling: boolean;
    /** connectionId as defined by the Nexa gateway. */
    readonly connectionId: string;
    /** principalId as defined by the Nexa gateway. */
    readonly principalId: string;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: null | string;
    /** startedAt as defined by the Nexa gateway. */
    readonly startedAt: number;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId: string;
}

/** TaskRecord from the Nexa wire protocol. */
export type TaskRecord = TaskRecordShape;

/** TeamCreateParams wire fields. */
export interface TeamCreateParamsShape {
    /** description as defined by the Nexa gateway. */
    readonly description?: string;
    /** id as defined by the Nexa gateway. */
    readonly id?: string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
}

/** TeamCreateParams from the Nexa wire protocol. */
export type TeamCreateParams = TeamCreateParamsShape;

/** TeamMemberParams wire fields. */
export interface TeamMemberParamsShape {
    /** member as defined by the Nexa gateway. */
    readonly member: boolean;
    /** principalId as defined by the Nexa gateway. */
    readonly principalId: string;
    /** teamId as defined by the Nexa gateway. */
    readonly teamId: string;
}

/** TeamMemberParams from the Nexa wire protocol. */
export type TeamMemberParams = TeamMemberParamsShape;

/** TeamSummary wire fields. */
export interface TeamSummaryShape {
    /** createdAt as defined by the Nexa gateway. */
    readonly createdAt: number;
    /** description as defined by the Nexa gateway. */
    readonly description?: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** members as defined by the Nexa gateway. */
    readonly members: ReadonlyArray<string>;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
}

/** TeamSummary from the Nexa wire protocol. */
export type TeamSummary = TeamSummaryShape;

/** TokenUsage wire fields. */
export interface TokenUsageShape {
    /** cacheWriteLongTokens as defined by the Nexa gateway. */
    readonly cacheWriteLongTokens?: number;
    /** cacheWriteTokens as defined by the Nexa gateway. */
    readonly cacheWriteTokens?: number;
    /** cachedInputTokens as defined by the Nexa gateway. */
    readonly cachedInputTokens?: number;
    /** contextTokens as defined by the Nexa gateway. */
    readonly contextTokens?: number;
    /** inputTokens as defined by the Nexa gateway. */
    readonly inputTokens: number;
    /** outputTokens as defined by the Nexa gateway. */
    readonly outputTokens: number;
    /** reasoningTokens as defined by the Nexa gateway. */
    readonly reasoningTokens?: number;
}

/** TokenUsage from the Nexa wire protocol. */
export type TokenUsage = TokenUsageShape;

/** ToolCall wire fields. */
export interface ToolCallShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** input as defined by the Nexa gateway. */
    readonly input: JsonValue;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
}

/** ToolCall from the Nexa wire protocol. */
export type ToolCall = ToolCallShape;

/** ToolOutcome wire fields. */
export interface ToolOutcomeShape {
    /** call as defined by the Nexa gateway. */
    readonly call: ToolCall;
    /** durationMs as defined by the Nexa gateway. */
    readonly durationMs: number;
    /** result as defined by the Nexa gateway. */
    readonly result: ToolResult;
}

/** ToolOutcome from the Nexa wire protocol. */
export type ToolOutcome = ToolOutcomeShape;

/** Allowed values for ToolPrincipalchannelAccessLevel. */
export const ToolPrincipalchannelAccessLevelValues = {
    Value0: 'admin',
    Value1: 'denied',
    Value2: 'member',
    Value3: 'owner',
} as const;

/** Allowed values for ToolPrincipalmaxRisk. */
export const ToolPrincipalmaxRiskValues = {
    Value0: 'destructive',
    Value1: 'execute',
    Value2: 'read',
    Value3: 'write',
} as const;

/** ToolPrincipal wire fields. */
export interface ToolPrincipalShape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId: string;
    /** channelAccessLevel as defined by the Nexa gateway. */
    readonly channelAccessLevel?: (typeof ToolPrincipalchannelAccessLevelValues)[keyof typeof ToolPrincipalchannelAccessLevelValues];
    /** channelConversationId as defined by the Nexa gateway. */
    readonly channelConversationId?: string;
    /** channelGuildId as defined by the Nexa gateway. */
    readonly channelGuildId?: string;
    /** channelPlatformAdministrator as defined by the Nexa gateway. */
    readonly channelPlatformAdministrator?: boolean;
    /** channelPlatformRoleIds as defined by the Nexa gateway. */
    readonly channelPlatformRoleIds?: ReadonlyArray<string>;
    /** channelPlatformUserId as defined by the Nexa gateway. */
    readonly channelPlatformUserId?: string;
    /** channelThreadId as defined by the Nexa gateway. */
    readonly channelThreadId?: string;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId?: string;
    /** machineId as defined by the Nexa gateway. */
    readonly machineId?: string;
    /** maxRisk as defined by the Nexa gateway. */
    readonly maxRisk?: (typeof ToolPrincipalmaxRiskValues)[keyof typeof ToolPrincipalmaxRiskValues];
    /** projectId as defined by the Nexa gateway. */
    readonly projectId?: string;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** ToolPrincipal from the Nexa wire protocol. */
export type ToolPrincipal = ToolPrincipalShape;

/** ToolProgress wire fields. */
export interface ToolProgressShape {
    /** attachment as defined by the Nexa gateway. */
    readonly attachment?: ToolProgressAttachment;
    /** fraction as defined by the Nexa gateway. */
    readonly fraction?: number;
    /** status as defined by the Nexa gateway. */
    readonly status?: string;
    /** text as defined by the Nexa gateway. */
    readonly text?: string;
}

/** ToolProgress from the Nexa wire protocol. */
export type ToolProgress = ToolProgressShape;

/** ToolProgressAttachment wire fields. */
export interface ToolProgressAttachmentShape {
    /** data as defined by the Nexa gateway. */
    readonly data: ReadonlyArray<number> | Readonly<Record<string, number>>;
    /** description as defined by the Nexa gateway. */
    readonly description?: string;
    /** filename as defined by the Nexa gateway. */
    readonly filename: string;
    /** mimeType as defined by the Nexa gateway. */
    readonly mimeType: string;
}

/** ToolProgressAttachment from the Nexa wire protocol. */
export type ToolProgressAttachment = ToolProgressAttachmentShape;

/** ToolQuestion wire fields. */
export interface ToolQuestionShape {
    /** choices as defined by the Nexa gateway. */
    readonly choices?: ReadonlyArray<ToolQuestionChoice>;
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** ToolQuestion from the Nexa wire protocol. */
export type ToolQuestion = ToolQuestionShape;

/** ToolQuestionChoice wire fields. */
export interface ToolQuestionChoiceShape {
    /** description as defined by the Nexa gateway. */
    readonly description?: string;
    /** label as defined by the Nexa gateway. */
    readonly label: string;
    /** value as defined by the Nexa gateway. */
    readonly value?: string;
}

/** ToolQuestionChoice from the Nexa wire protocol. */
export type ToolQuestionChoice = ToolQuestionChoiceShape;

/** Allowed values for ToolResultsource. */
export const ToolResultsourceValues = {
    Value0: 'external-model',
    Value1: 'local',
    Value2: 'model',
    Value3: 'network',
} as const;

/** ToolResult wire fields. */
export interface ToolResultShape {
    /** content as defined by the Nexa gateway. */
    readonly content: ReadonlyArray<ContentBlock> | string;
    /** continuation as defined by the Nexa gateway. */
    readonly continuation?: string;
    /** deliveredMedia as defined by the Nexa gateway. */
    readonly deliveredMedia?: boolean;
    /** deliveredText as defined by the Nexa gateway. */
    readonly deliveredText?: string;
    /** deliveryReceipt as defined by the Nexa gateway. */
    readonly deliveryReceipt?: DeliveryReceipt;
    /** display as defined by the Nexa gateway. */
    readonly display?:
        | ReadonlyArray<JsonValue>
        | Readonly<Record<string, JsonValue>>
        | null
        | string
        | number
        | boolean;
    /** inspectedMediaSha256 as defined by the Nexa gateway. */
    readonly inspectedMediaSha256?: ReadonlyArray<string>;
    /** label as defined by the Nexa gateway. */
    readonly label?: string;
    /** protocolPayload as defined by the Nexa gateway. */
    readonly protocolPayload?: boolean;
    /** question as defined by the Nexa gateway. */
    readonly question?: ToolQuestion;
    /** source as defined by the Nexa gateway. */
    readonly source?: (typeof ToolResultsourceValues)[keyof typeof ToolResultsourceValues];
    /** status as defined by the Nexa gateway. */
    readonly status: ToolStatus;
    /** terminate as defined by the Nexa gateway. */
    readonly terminate?: boolean;
    /** truncation as defined by the Nexa gateway. */
    readonly truncation?: TruncationRecord;
}

/** ToolResult from the Nexa wire protocol. */
export type ToolResult = ToolResultShape;

/** Allowed values for ToolStatus. */
export const ToolStatusValues = {
    Value0: 'aborted',
    Value1: 'denied',
    Value2: 'error',
    Value3: 'ok',
} as const;

/** ToolStatus from the Nexa wire protocol. */
export type ToolStatus = (typeof ToolStatusValues)[keyof typeof ToolStatusValues];

/** TruncationRecord wire fields. */
export interface TruncationRecordShape {
    /** continuation as defined by the Nexa gateway. */
    readonly continuation?: string;
    /** lastLinePartial as defined by the Nexa gateway. */
    readonly lastLinePartial: boolean;
    /** shownChars as defined by the Nexa gateway. */
    readonly shownChars: number;
    /** shownLines as defined by the Nexa gateway. */
    readonly shownLines: number;
    /** spillPath as defined by the Nexa gateway. */
    readonly spillPath?: string;
    /** strategy as defined by the Nexa gateway. */
    readonly strategy: TruncationStrategy;
    /** totalChars as defined by the Nexa gateway. */
    readonly totalChars: number;
    /** totalLines as defined by the Nexa gateway. */
    readonly totalLines: number;
}

/** TruncationRecord from the Nexa wire protocol. */
export type TruncationRecord = TruncationRecordShape;

/** Allowed values for TruncationStrategy. */
export const TruncationStrategyValues = {
    Value0: 'head',
    Value1: 'head-tail',
    Value2: 'hunk-head',
    Value3: 'summary-head',
    Value4: 'tail',
} as const;

/** TruncationStrategy from the Nexa wire protocol. */
export type TruncationStrategy =
    (typeof TruncationStrategyValues)[keyof typeof TruncationStrategyValues];

/** TurnEndData wire fields. */
export interface TurnEndDataShape {
    /** error as defined by the Nexa gateway. */
    readonly error?: WireError;
    /** ok as defined by the Nexa gateway. */
    readonly ok: boolean;
    /** result as defined by the Nexa gateway. */
    readonly result?: AskResult;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId?: string;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId: string;
}

/** TurnEndData from the Nexa wire protocol. */
export type TurnEndData = TurnEndDataShape;

/** TurnEventData wire fields. */
export interface TurnEventDataShape {
    /** event as defined by the Nexa gateway. */
    readonly event: WireTurnEvent;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId?: string;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId: string;
}

/** TurnEventData from the Nexa wire protocol. */
export type TurnEventData = TurnEventDataShape;

/** VoiceAudioParams wire fields. */
export interface VoiceAudioParamsShape {
    /** callId as defined by the Nexa gateway. */
    readonly callId: string;
    /** pcm as defined by the Nexa gateway. */
    readonly pcm: string;
}

/** VoiceAudioParams from the Nexa wire protocol. */
export type VoiceAudioParams = VoiceAudioParamsShape;

/** VoiceCallEventVariant0 wire fields. */
export interface VoiceCallEventVariant0Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'heard';
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** VoiceCallEventVariant1 wire fields. */
export interface VoiceCallEventVariant1Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'said';
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** VoiceCallEventVariant2 wire fields. */
export interface VoiceCallEventVariant2Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'status';
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** VoiceCallEventVariant3 wire fields. */
export interface VoiceCallEventVariant3Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'error';
    /** message as defined by the Nexa gateway. */
    readonly message: string;
}

/** VoiceCallEvent from the Nexa wire protocol. */
export type VoiceCallEvent =
    | VoiceCallEventVariant0Shape
    | VoiceCallEventVariant1Shape
    | VoiceCallEventVariant2Shape
    | VoiceCallEventVariant3Shape;

/** VoiceStartParams wire fields. */
export interface VoiceStartParamsShape {
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId?: string;
}

/** VoiceStartParams from the Nexa wire protocol. */
export type VoiceStartParams = VoiceStartParamsShape;

/** VoiceStarted wire fields. */
export interface VoiceStartedShape {
    /** callId as defined by the Nexa gateway. */
    readonly callId: string;
    /** frameBytes as defined by the Nexa gateway. */
    readonly frameBytes: number;
    /** sampleRate as defined by the Nexa gateway. */
    readonly sampleRate: number;
}

/** VoiceStarted from the Nexa wire protocol. */
export type VoiceStarted = VoiceStartedShape;

/** VoiceStopParams wire fields. */
export interface VoiceStopParamsShape {
    /** callId as defined by the Nexa gateway. */
    readonly callId: string;
}

/** VoiceStopParams from the Nexa wire protocol. */
export type VoiceStopParams = VoiceStopParamsShape;

/** WireError wire fields. */
export interface WireErrorShape {
    /** code as defined by the Nexa gateway. */
    readonly code: ErrorCode;
    /** details as defined by the Nexa gateway. */
    readonly details?: Recordstringunknown;
    /** message as defined by the Nexa gateway. */
    readonly message: string;
    /** retryAfterMs as defined by the Nexa gateway. */
    readonly retryAfterMs?: number;
    /** retryable as defined by the Nexa gateway. */
    readonly retryable: boolean;
}

/** WireError from the Nexa wire protocol. */
export type WireError = WireErrorShape;

/** WireTurnEventVariant0 wire fields. */
export interface WireTurnEventVariant0Shape {
    /** attachment as defined by the Nexa gateway. */
    readonly attachment: DeliveredAttachment;
    /** type as defined by the Nexa gateway. */
    readonly type: 'attachment';
}

/** WireTurnEventVariant1 wire fields. */
export interface WireTurnEventVariant1Shape {
    /** turnId as defined by the Nexa gateway. */
    readonly turnId: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'turn-start';
}

/** WireTurnEventVariant2 wire fields. */
export interface WireTurnEventVariant2Shape {
    /** iteration as defined by the Nexa gateway. */
    readonly iteration: number;
    /** type as defined by the Nexa gateway. */
    readonly type: 'iteration-start';
}

/** WireTurnEventVariant3 wire fields. */
export interface WireTurnEventVariant3Shape {
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'text';
}

/** WireTurnEventVariant4 wire fields. */
export interface WireTurnEventVariant4Shape {
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'reasoning';
}

/** WireTurnEventVariant5 wire fields. */
export interface WireTurnEventVariant5Shape {
    /** call as defined by the Nexa gateway. */
    readonly call: ToolCall;
    /** type as defined by the Nexa gateway. */
    readonly type: 'tool-start';
}

/** WireTurnEventVariant6 wire fields. */
export interface WireTurnEventVariant6Shape {
    /** call as defined by the Nexa gateway. */
    readonly call: ToolCall;
    /** type as defined by the Nexa gateway. */
    readonly type: 'tool-progress';
    /** update as defined by the Nexa gateway. */
    readonly update: ToolProgress;
}

/** WireTurnEventVariant7 wire fields. */
export interface WireTurnEventVariant7Shape {
    /** outcome as defined by the Nexa gateway. */
    readonly outcome: ToolOutcome;
    /** type as defined by the Nexa gateway. */
    readonly type: 'tool-finish';
}

/** WireTurnEventVariant8 wire fields. */
export interface WireTurnEventVariant8Shape {
    /** summary as defined by the Nexa gateway. */
    readonly summary: string;
    /** tool as defined by the Nexa gateway. */
    readonly tool: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'approval-required';
}

/** WireTurnEventVariant9 wire fields. */
export interface WireTurnEventVariant9Shape {
    /** droppedMessages as defined by the Nexa gateway. */
    readonly droppedMessages: number;
    /** summary as defined by the Nexa gateway. */
    readonly summary: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'compacted';
}

/** WireTurnEventVariant10 wire fields. */
export interface WireTurnEventVariant10Shape {
    /** type as defined by the Nexa gateway. */
    readonly type: 'usage';
    /** usage as defined by the Nexa gateway. */
    readonly usage: TokenUsage;
}

/** WireTurnEventVariant11 wire fields. */
export interface WireTurnEventVariant11Shape {
    /** data as defined by the Nexa gateway. */
    readonly data: JsonValue;
    /** source as defined by the Nexa gateway. */
    readonly source: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'native';
}

/** WireTurnEventVariant12 wire fields. */
export interface WireTurnEventVariant12Shape {
    /** detail as defined by the Nexa gateway. */
    readonly detail?: string;
    /** status as defined by the Nexa gateway. */
    readonly status: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'status';
}

/** WireTurnEventVariant13 wire fields. */
export interface WireTurnEventVariant13Shape {
    /** iterations as defined by the Nexa gateway. */
    readonly iterations: number;
    /** reason as defined by the Nexa gateway. */
    readonly reason: FinishReason;
    /** turnId as defined by the Nexa gateway. */
    readonly turnId: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'turn-finish';
    /** usage as defined by the Nexa gateway. */
    readonly usage: TokenUsage;
}

/** WireTurnEventVariant14 wire fields. */
export interface WireTurnEventVariant14Shape {
    /** error as defined by the Nexa gateway. */
    readonly error: WireError;
    /** retryable as defined by the Nexa gateway. */
    readonly retryable: boolean;
    /** type as defined by the Nexa gateway. */
    readonly type: 'error';
}

/** WireTurnEvent from the Nexa wire protocol. */
export type WireTurnEvent =
    | WireTurnEventVariant0Shape
    | WireTurnEventVariant1Shape
    | WireTurnEventVariant2Shape
    | WireTurnEventVariant3Shape
    | WireTurnEventVariant4Shape
    | WireTurnEventVariant5Shape
    | WireTurnEventVariant6Shape
    | WireTurnEventVariant7Shape
    | WireTurnEventVariant8Shape
    | WireTurnEventVariant9Shape
    | WireTurnEventVariant10Shape
    | WireTurnEventVariant11Shape
    | WireTurnEventVariant12Shape
    | WireTurnEventVariant13Shape
    | WireTurnEventVariant14Shape;

/** Allowed values for Workspacestate. */
export const WorkspacestateValues = {
    Value0: 'active',
    Value1: 'creating',
    Value2: 'destroyed',
    Value3: 'destroying',
    Value4: 'draining',
    Value5: 'expired',
} as const;

/** Workspaceworktree wire fields. */
export interface WorkspaceworktreeShape {
    /** branch as defined by the Nexa gateway. */
    readonly branch: string;
    /** deleteBranchOnDestroy as defined by the Nexa gateway. */
    readonly deleteBranchOnDestroy?: boolean;
    /** repo as defined by the Nexa gateway. */
    readonly repo: string;
}

/** Workspace wire fields. */
export interface WorkspaceShape {
    /** createdAt as defined by the Nexa gateway. */
    readonly createdAt: number;
    /** destroyedAt as defined by the Nexa gateway. */
    readonly destroyedAt?: number;
    /** expiresAt as defined by the Nexa gateway. */
    readonly expiresAt?: number;
    /** extraRoots as defined by the Nexa gateway. */
    readonly extraRoots?: ReadonlyArray<string>;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: WorkspaceKind;
    /** leases as defined by the Nexa gateway. */
    readonly leases?: ReadonlyArray<WorkspaceLeaseRecord>;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** owner as defined by the Nexa gateway. */
    readonly owner?: WorkspaceOwner;
    /** quota as defined by the Nexa gateway. */
    readonly quota?: WorkspaceQuota;
    /** root as defined by the Nexa gateway. */
    readonly root: string;
    /** state as defined by the Nexa gateway. */
    readonly state?: (typeof WorkspacestateValues)[keyof typeof WorkspacestateValues];
    /** tags as defined by the Nexa gateway. */
    readonly tags?: ReadonlyArray<string>;
    /** updatedAt as defined by the Nexa gateway. */
    readonly updatedAt: number;
    /** usage as defined by the Nexa gateway. */
    readonly usage?: WorkspaceUsage;
    /** worktree as defined by the Nexa gateway. */
    readonly worktree?: WorkspaceworktreeShape;
}

/** Workspace from the Nexa wire protocol. */
export type Workspace = WorkspaceShape;

/** WorkspaceCreateParams wire fields. */
export interface WorkspaceCreateParamsShape {
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** tags as defined by the Nexa gateway. */
    readonly tags?: ReadonlyArray<string>;
    /** ttlMs as defined by the Nexa gateway. */
    readonly ttlMs?: number;
}

/** WorkspaceCreateParams from the Nexa wire protocol. */
export type WorkspaceCreateParams = WorkspaceCreateParamsShape;

/** WorkspaceDescriptionworktree wire fields. */
export interface WorkspaceDescriptionworktreeShape {
    /** branch as defined by the Nexa gateway. */
    readonly branch: string;
    /** deleteBranchOnDestroy as defined by the Nexa gateway. */
    readonly deleteBranchOnDestroy?: boolean;
    /** repo as defined by the Nexa gateway. */
    readonly repo: string;
}

/** WorkspaceDescription wire fields. */
export interface WorkspaceDescriptionShape {
    /** createdAt as defined by the Nexa gateway. */
    readonly createdAt: number;
    /** destroyedAt as defined by the Nexa gateway. */
    readonly destroyedAt?: number;
    /** expiresAt as defined by the Nexa gateway. */
    readonly expiresAt?: number;
    /** extraRoots as defined by the Nexa gateway. */
    readonly extraRoots?: ReadonlyArray<string>;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: WorkspaceKind;
    /** leases as defined by the Nexa gateway. */
    readonly leases: ReadonlyArray<WorkspaceLeaseRecord>;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** owner as defined by the Nexa gateway. */
    readonly owner?: WorkspaceOwner;
    /** quota as defined by the Nexa gateway. */
    readonly quota?: WorkspaceQuota;
    /** root as defined by the Nexa gateway. */
    readonly root: string;
    /** state as defined by the Nexa gateway. */
    readonly state: WorkspaceState;
    /** tags as defined by the Nexa gateway. */
    readonly tags?: ReadonlyArray<string>;
    /** updatedAt as defined by the Nexa gateway. */
    readonly updatedAt: number;
    /** usage as defined by the Nexa gateway. */
    readonly usage: WorkspaceUsage;
    /** worktree as defined by the Nexa gateway. */
    readonly worktree?: WorkspaceDescriptionworktreeShape;
}

/** WorkspaceDescription from the Nexa wire protocol. */
export type WorkspaceDescription = WorkspaceDescriptionShape;

/** WorkspaceDestroyParams wire fields. */
export interface WorkspaceDestroyParamsShape {
    /** force as defined by the Nexa gateway. */
    readonly force?: boolean;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** WorkspaceDestroyParams from the Nexa wire protocol. */
export type WorkspaceDestroyParams = WorkspaceDestroyParamsShape;

/** Allowed values for WorkspaceKind. */
export const WorkspaceKindValues = {
    Value0: 'attached',
    Value1: 'ephemeral',
    Value2: 'managed',
} as const;

/** WorkspaceKind from the Nexa wire protocol. */
export type WorkspaceKind = (typeof WorkspaceKindValues)[keyof typeof WorkspaceKindValues];

/** WorkspaceLeaseRecord wire fields. */
export interface WorkspaceLeaseRecordShape {
    /** acquiredAt as defined by the Nexa gateway. */
    readonly acquiredAt: number;
    /** expiresAt as defined by the Nexa gateway. */
    readonly expiresAt: number;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
}

/** WorkspaceLeaseRecord from the Nexa wire protocol. */
export type WorkspaceLeaseRecord = WorkspaceLeaseRecordShape;

/** WorkspaceOwner wire fields. */
export interface WorkspaceOwnerShape {
    /** agentId as defined by the Nexa gateway. */
    readonly agentId?: string;
    /** projectId as defined by the Nexa gateway. */
    readonly projectId?: string;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** WorkspaceOwner from the Nexa wire protocol. */
export type WorkspaceOwner = WorkspaceOwnerShape;

/** WorkspaceQuota wire fields. */
export interface WorkspaceQuotaShape {
    /** maxBytes as defined by the Nexa gateway. */
    readonly maxBytes?: number;
    /** maxFiles as defined by the Nexa gateway. */
    readonly maxFiles?: number;
}

/** WorkspaceQuota from the Nexa wire protocol. */
export type WorkspaceQuota = WorkspaceQuotaShape;

/** Allowed values for WorkspaceState. */
export const WorkspaceStateValues = {
    Value0: 'active',
    Value1: 'creating',
    Value2: 'destroyed',
    Value3: 'destroying',
    Value4: 'draining',
    Value5: 'expired',
} as const;

/** WorkspaceState from the Nexa wire protocol. */
export type WorkspaceState = (typeof WorkspaceStateValues)[keyof typeof WorkspaceStateValues];

/** WorkspaceUsage wire fields. */
export interface WorkspaceUsageShape {
    /** bytes as defined by the Nexa gateway. */
    readonly bytes: number;
    /** files as defined by the Nexa gateway. */
    readonly files: number;
    /** reconciledAt as defined by the Nexa gateway. */
    readonly reconciledAt: number;
}

/** WorkspaceUsage from the Nexa wire protocol. */
export type WorkspaceUsage = WorkspaceUsageShape;

/** Supported RPC names. */
export type MethodName = keyof GatewayMethods;
/** Parameters for a particular RPC. */
export type ParamsOf<M extends MethodName> = GatewayMethods[M]['params'];
/** Result for a particular RPC. */
export type ResultOf<M extends MethodName> = GatewayMethods[M]['result'];

/** Nexa RPC method enum, generated from the complete gateway catalog. */
export enum Method {
    /** Calls accounts.create. */
    AccountsCreate = 'accounts.create',
    /** Calls accounts.list. */
    AccountsList = 'accounts.list',
    /** Calls accounts.remove. */
    AccountsRemove = 'accounts.remove',
    /** Calls accounts.usage. */
    AccountsUsage = 'accounts.usage',
    /** Calls agent.ask. */
    AgentAsk = 'agent.ask',
    /** Calls agent.stream. */
    AgentStream = 'agent.stream',
    /** Calls agents.define. */
    AgentsDefine = 'agents.define',
    /** Calls agents.list. */
    AgentsList = 'agents.list',
    /** Calls approvals.list. */
    ApprovalsList = 'approvals.list',
    /** Calls approvals.resolve. */
    ApprovalsResolve = 'approvals.resolve',
    /** Calls channels.deadLetters.list. */
    ChannelsDeadLettersList = 'channels.deadLetters.list',
    /** Calls channels.list. */
    ChannelsList = 'channels.list',
    /** Calls channels.status. */
    ChannelsStatus = 'channels.status',
    /** Calls config.get. */
    ConfigGet = 'config.get',
    /** Calls config.set. */
    ConfigSet = 'config.set',
    /** Calls config.unset. */
    ConfigUnset = 'config.unset',
    /** Calls connect. */
    Connect = 'connect',
    /** Calls credit.budgets. */
    CreditBudgets = 'credit.budgets',
    /** Calls credit.removeBudget. */
    CreditRemoveBudget = 'credit.removeBudget',
    /** Calls credit.setBudget. */
    CreditSetBudget = 'credit.setBudget',
    /** Calls credit.summary. */
    CreditSummary = 'credit.summary',
    /** Calls devices.approve. */
    DevicesApprove = 'devices.approve',
    /** Calls devices.list. */
    DevicesList = 'devices.list',
    /** Calls devices.reject. */
    DevicesReject = 'devices.reject',
    /** Calls devices.revoke. */
    DevicesRevoke = 'devices.revoke',
    /** Calls health. */
    Health = 'health',
    /** Calls jobs.add. */
    JobsAdd = 'jobs.add',
    /** Calls jobs.list. */
    JobsList = 'jobs.list',
    /** Calls jobs.remove. */
    JobsRemove = 'jobs.remove',
    /** Calls logs.tail. */
    LogsTail = 'logs.tail',
    /** Calls media.acknowledge. */
    MediaAcknowledge = 'media.acknowledge',
    /** Calls sessions.delete. */
    SessionsDelete = 'sessions.delete',
    /** Calls sessions.download. */
    SessionsDownload = 'sessions.download',
    /** Calls sessions.files. */
    SessionsFiles = 'sessions.files',
    /** Calls sessions.get. */
    SessionsGet = 'sessions.get',
    /** Calls sessions.list. */
    SessionsList = 'sessions.list',
    /** Calls sessions.messages. */
    SessionsMessages = 'sessions.messages',
    /** Calls sessions.subscribe. */
    SessionsSubscribe = 'sessions.subscribe',
    /** Calls sessions.unsubscribe. */
    SessionsUnsubscribe = 'sessions.unsubscribe',
    /** Calls shares.create. */
    SharesCreate = 'shares.create',
    /** Calls shares.list. */
    SharesList = 'shares.list',
    /** Calls shares.remove. */
    SharesRemove = 'shares.remove',
    /** Calls shares.setMember. */
    SharesSetMember = 'shares.setMember',
    /** Calls tasks.cancel. */
    TasksCancel = 'tasks.cancel',
    /** Calls tasks.get. */
    TasksGet = 'tasks.get',
    /** Calls tasks.list. */
    TasksList = 'tasks.list',
    /** Calls teams.create. */
    TeamsCreate = 'teams.create',
    /** Calls teams.list. */
    TeamsList = 'teams.list',
    /** Calls teams.remove. */
    TeamsRemove = 'teams.remove',
    /** Calls teams.setMember. */
    TeamsSetMember = 'teams.setMember',
    /** Calls voice.audio. */
    VoiceAudio = 'voice.audio',
    /** Calls voice.start. */
    VoiceStart = 'voice.start',
    /** Calls voice.stop. */
    VoiceStop = 'voice.stop',
    /** Calls workspaces.create. */
    WorkspacesCreate = 'workspaces.create',
    /** Calls workspaces.describe. */
    WorkspacesDescribe = 'workspaces.describe',
    /** Calls workspaces.destroy. */
    WorkspacesDestroy = 'workspaces.destroy',
    /** Calls workspaces.list. */
    WorkspacesList = 'workspaces.list',
}
