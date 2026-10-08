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

/** AgentMessage from the Nexa wire protocol. */
export type AgentMessage =
    UserMessage | AssistantMessage | ToolResultMessage | CustomMessage | CompactionSummaryMessage;

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

/** Allowed values for AskParamsreasoningEffort. */
export const AskParamsreasoningEffortValues = {
    Value0: 'high',
    Value1: 'low',
    Value2: 'max',
    Value3: 'medium',
    Value4: 'minimal',
    Value5: 'off',
    Value6: 'xhigh',
} as const;

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
    /** reasoningEffort as defined by the Nexa gateway. */
    readonly reasoningEffort?: (typeof AskParamsreasoningEffortValues)[keyof typeof AskParamsreasoningEffortValues];
    /** targetTimeSeconds as defined by the Nexa gateway. */
    readonly targetTimeSeconds?: number;
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

/** AssistantContentBlockVariant0 wire fields. */
export interface AssistantContentBlockVariant0Shape {
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'text';
}

/** AssistantContentBlockVariant1 wire fields. */
export interface AssistantContentBlockVariant1Shape {
    /** signature as defined by the Nexa gateway. */
    readonly signature?: string;
    /** thinking as defined by the Nexa gateway. */
    readonly thinking: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'thinking';
}

/** AssistantContentBlockVariant2 wire fields. */
export interface AssistantContentBlockVariant2Shape {
    /** data as defined by the Nexa gateway. */
    readonly data: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'redacted-thinking';
}

/** AssistantContentBlockVariant3 wire fields. */
export interface AssistantContentBlockVariant3Shape {
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

/** AssistantContentBlock from the Nexa wire protocol. */
export type AssistantContentBlock =
    | AssistantContentBlockVariant0Shape
    | AssistantContentBlockVariant1Shape
    | AssistantContentBlockVariant2Shape
    | AssistantContentBlockVariant3Shape;

/** AssistantMessage wire fields. */
export interface AssistantMessageShape {
    /** content as defined by the Nexa gateway. */
    readonly content: ReadonlyArray<AssistantContentBlock>;
    /** errorCode as defined by the Nexa gateway. */
    readonly errorCode?: string;
    /** errorMessage as defined by the Nexa gateway. */
    readonly errorMessage?: string;
    /** excludeFromContext as defined by the Nexa gateway. */
    readonly excludeFromContext?: boolean;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** model as defined by the Nexa gateway. */
    readonly model: string;
    /** provider as defined by the Nexa gateway. */
    readonly provider: string;
    /** responseId as defined by the Nexa gateway. */
    readonly responseId?: string;
    /** responseModel as defined by the Nexa gateway. */
    readonly responseModel?: string;
    /** role as defined by the Nexa gateway. */
    readonly role: 'assistant';
    /** stopReason as defined by the Nexa gateway. */
    readonly stopReason: StopReason;
    /** tainted as defined by the Nexa gateway. */
    readonly tainted?: boolean;
    /** timestamp as defined by the Nexa gateway. */
    readonly timestamp: number;
    /** turnId as defined by the Nexa gateway. */
    readonly turnId?: string;
    /** usage as defined by the Nexa gateway. */
    readonly usage: TokenUsage;
}

/** AssistantMessage from the Nexa wire protocol. */
export type AssistantMessage = AssistantMessageShape;

/** BackgroundProcess wire fields. */
export interface BackgroundProcessShape {
    /** command as defined by the Nexa gateway. */
    readonly command: string;
    /** cwd as defined by the Nexa gateway. */
    readonly cwd: string;
    /** endedAt as defined by the Nexa gateway. */
    readonly endedAt: null | string;
    /** exitCode as defined by the Nexa gateway. */
    readonly exitCode: null | number;
    /** foreground as defined by the Nexa gateway. */
    readonly foreground?: boolean;
    /** processId as defined by the Nexa gateway. */
    readonly processId: string;
    /** running as defined by the Nexa gateway. */
    readonly running: boolean;
    /** signal as defined by the Nexa gateway. */
    readonly signal: null | string;
    /** startedAt as defined by the Nexa gateway. */
    readonly startedAt: string;
}

/** BackgroundProcess from the Nexa wire protocol. */
export type BackgroundProcess = BackgroundProcessShape;

/** BackgroundProcessLog wire fields. */
export interface BackgroundProcessLogShape {
    /** endOffset as defined by the Nexa gateway. */
    readonly endOffset: string;
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** truncated as defined by the Nexa gateway. */
    readonly truncated: boolean;
}

/** BackgroundProcessLog from the Nexa wire protocol. */
export type BackgroundProcessLog = BackgroundProcessLogShape;

/** BackgroundProcessRef wire fields. */
export interface BackgroundProcessRefShape {
    /** processId as defined by the Nexa gateway. */
    readonly processId: string;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
}

/** BackgroundProcessRef from the Nexa wire protocol. */
export type BackgroundProcessRef = BackgroundProcessRefShape;

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

/** CommandExecutionReceipt wire fields. */
export interface CommandExecutionReceiptShape {
    /** command as defined by the Nexa gateway. */
    readonly command: string;
    /** cwd as defined by the Nexa gateway. */
    readonly cwd: string;
    /** exitCode as defined by the Nexa gateway. */
    readonly exitCode: null | number;
    /** processId as defined by the Nexa gateway. */
    readonly processId: null | string;
    /** processToken as defined by the Nexa gateway. */
    readonly processToken: null | string;
    /** remote as defined by the Nexa gateway. */
    readonly remote: boolean;
    /** running as defined by the Nexa gateway. */
    readonly running: boolean;
    /** signal as defined by the Nexa gateway. */
    readonly signal: null | string;
    /** terminalOutput as defined by the Nexa gateway. */
    readonly terminalOutput?: string;
}

/** CommandExecutionReceipt from the Nexa wire protocol. */
export type CommandExecutionReceipt = CommandExecutionReceiptShape;

/** CompactionSummaryMessage wire fields. */
export interface CompactionSummaryMessageShape {
    /** excludeFromContext as defined by the Nexa gateway. */
    readonly excludeFromContext?: boolean;
    /** firstKeptEntryId as defined by the Nexa gateway. */
    readonly firstKeptEntryId?: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** role as defined by the Nexa gateway. */
    readonly role: 'compaction-summary';
    /** summary as defined by the Nexa gateway. */
    readonly summary: string;
    /** timestamp as defined by the Nexa gateway. */
    readonly timestamp: number;
    /** tokensAfter as defined by the Nexa gateway. */
    readonly tokensAfter?: number;
    /** tokensBefore as defined by the Nexa gateway. */
    readonly tokensBefore: number;
}

/** CompactionSummaryMessage from the Nexa wire protocol. */
export type CompactionSummaryMessage = CompactionSummaryMessageShape;

/** Allowed values for ComponentCategory. */
export const ComponentCategoryValues = {
    Value0: 'agents',
    Value1: 'api',
    Value2: 'browser',
    Value3: 'cache',
    Value4: 'collection',
    Value5: 'conditions',
    Value6: 'connections',
    Value7: 'context',
    Value8: 'documents',
    Value9: 'entities',
    Value10: 'experiments',
    Value11: 'flow',
    Value12: 'human',
    Value13: 'media',
    Value14: 'messaging',
    Value15: 'models',
    Value16: 'observability',
    Value17: 'output',
    Value18: 'personas',
    Value19: 'planning',
    Value20: 'policy',
    Value21: 'programs',
    Value22: 'prompts',
    Value23: 'quality',
    Value24: 'research',
    Value25: 'resources',
    Value26: 'storage',
    Value27: 'teams',
    Value28: 'time',
    Value29: 'tools',
    Value30: 'transform',
    Value31: 'triggers',
    Value32: 'utilities',
} as const;

/** ComponentCategory from the Nexa wire protocol. */
export type ComponentCategory =
    (typeof ComponentCategoryValues)[keyof typeof ComponentCategoryValues];

/** Allowed values for ComponentDefinitionexternalFamily. */
export const ComponentDefinitionexternalFamilyValues = {
    Value0: 'application',
    Value1: 'compute',
    Value2: 'computer',
    Value3: 'database',
    Value4: 'feed',
    Value5: 'files',
    Value6: 'workspace',
} as const;

/** ComponentDefinition wire fields. */
export interface ComponentDefinitionShape {
    /** category as defined by the Nexa gateway. */
    readonly category: ComponentCategory;
    /** configuration as defined by the Nexa gateway. */
    readonly configuration: ObjectSchema;
    /** defaults as defined by the Nexa gateway. */
    readonly defaults: WorkflowObject;
    /** display as defined by the Nexa gateway. */
    readonly display: ComponentDisplay;
    /** execution as defined by the Nexa gateway. */
    readonly execution: ComponentExecution | null;
    /** externalFamily as defined by the Nexa gateway. */
    readonly externalFamily?: (typeof ComponentDefinitionexternalFamilyValues)[keyof typeof ComponentDefinitionexternalFamilyValues];
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** migratesFrom as defined by the Nexa gateway. */
    readonly migratesFrom: ReadonlyArray<string>;
    /** ports as defined by the Nexa gateway. */
    readonly ports: ReadonlyArray<ComponentPort>;
    /** resourceRole as defined by the Nexa gateway. */
    readonly resourceRole: null | string;
    /** resources as defined by the Nexa gateway. */
    readonly resources: ReadonlyArray<ComponentResourceSlot>;
    /** role as defined by the Nexa gateway. */
    readonly role: ComponentRole;
    /** version as defined by the Nexa gateway. */
    readonly version: string;
}

/** ComponentDefinition from the Nexa wire protocol. */
export type ComponentDefinition = ComponentDefinitionShape;

/** ComponentDisplay wire fields. */
export interface ComponentDisplayShape {
    /** accent as defined by the Nexa gateway. */
    readonly accent: string;
    /** card as defined by the Nexa gateway. */
    readonly card: string;
    /** compactFields as defined by the Nexa gateway. */
    readonly compactFields: ReadonlyArray<string>;
    /** description as defined by the Nexa gateway. */
    readonly description: string;
    /** example as defined by the Nexa gateway. */
    readonly example: string;
    /** inspectorFields as defined by the Nexa gateway. */
    readonly inspectorFields: ReadonlyArray<string>;
    /** tags as defined by the Nexa gateway. */
    readonly tags: ReadonlyArray<string>;
    /** title as defined by the Nexa gateway. */
    readonly title: string;
}

/** ComponentDisplay from the Nexa wire protocol. */
export type ComponentDisplay = ComponentDisplayShape;

/** Allowed values for ComponentEffect. */
export const ComponentEffectValues = {
    Value0: 'external',
    Value1: 'inference',
    Value2: 'pure',
    Value3: 'wait',
} as const;

/** ComponentEffect from the Nexa wire protocol. */
export type ComponentEffect = (typeof ComponentEffectValues)[keyof typeof ComponentEffectValues];

/** ComponentExecution wire fields. */
export interface ComponentExecutionShape {
    /** cancellation as defined by the Nexa gateway. */
    readonly cancellation: string;
    /** capabilities as defined by the Nexa gateway. */
    readonly capabilities: ReadonlyArray<string>;
    /** credits as defined by the Nexa gateway. */
    readonly credits: string;
    /** effect as defined by the Nexa gateway. */
    readonly effect: ComponentEffect;
    /** handler as defined by the Nexa gateway. */
    readonly handler: null | string;
    /** maxAttempts as defined by the Nexa gateway. */
    readonly maxAttempts: number;
    /** mock as defined by the Nexa gateway. */
    readonly mock: MockBehavior;
    /** permissions as defined by the Nexa gateway. */
    readonly permissions: ReadonlyArray<string>;
    /** persistence as defined by the Nexa gateway. */
    readonly persistence: string;
    /** retryErrors as defined by the Nexa gateway. */
    readonly retryErrors: ReadonlyArray<string>;
    /** streaming as defined by the Nexa gateway. */
    readonly streaming: boolean;
    /** timeoutMs as defined by the Nexa gateway. */
    readonly timeoutMs: string;
}

/** ComponentExecution from the Nexa wire protocol. */
export type ComponentExecution = ComponentExecutionShape;

/** ComponentPort wire fields. */
export interface ComponentPortShape {
    /** cardinality as defined by the Nexa gateway. */
    readonly cardinality: PortCardinality;
    /** direction as defined by the Nexa gateway. */
    readonly direction: PortDirection;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** incoming as defined by the Nexa gateway. */
    readonly incoming: IncomingPolicy;
    /** kind as defined by the Nexa gateway. */
    readonly kind: WorkflowEdgeKind;
    /** label as defined by the Nexa gateway. */
    readonly label: string;
    /** literalField as defined by the Nexa gateway. */
    readonly literalField: null | string;
    /** maxConnections as defined by the Nexa gateway. */
    readonly maxConnections: number;
    /** modelCapabilities as defined by the Nexa gateway. */
    readonly modelCapabilities?: ReadonlyArray<string>;
    /** required as defined by the Nexa gateway. */
    readonly required: boolean;
    /** schema as defined by the Nexa gateway. */
    readonly schema: ValueSchema;
}

/** ComponentPort from the Nexa wire protocol. */
export type ComponentPort = ComponentPortShape;

/** ComponentResourceSlot wire fields. */
export interface ComponentResourceSlotShape {
    /** family as defined by the Nexa gateway. */
    readonly family: ResourceFamily;
    /** uses as defined by the Nexa gateway. */
    readonly uses: ReadonlyArray<ResourceUse>;
}

/** ComponentResourceSlot from the Nexa wire protocol. */
export type ComponentResourceSlot = ComponentResourceSlotShape;

/** Allowed values for ComponentRole. */
export const ComponentRoleValues = {
    Value0: 'resource',
    Value1: 'step',
    Value2: 'trigger',
    Value3: 'visual',
} as const;

/** ComponentRole from the Nexa wire protocol. */
export type ComponentRole = (typeof ComponentRoleValues)[keyof typeof ComponentRoleValues];

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

/** ConversationInput wire fields. */
export interface ConversationInputShape {
    /** attachmentCount as defined by the Nexa gateway. */
    readonly attachmentCount: number;
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** ConversationInput from the Nexa wire protocol. */
export type ConversationInput = ConversationInputShape;

/** Allowed values for ConversationMessageRefkind. */
export const ConversationMessageRefkindValues = {
    Value0: 'entry',
    Value1: 'input',
    Value2: 'input-stream',
    Value3: 'response',
} as const;

/** ConversationMessageRef wire fields. */
export interface ConversationMessageRefShape {
    /** key as defined by the Nexa gateway. */
    readonly key: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: (typeof ConversationMessageRefkindValues)[keyof typeof ConversationMessageRefkindValues];
}

/** ConversationMessageRef from the Nexa wire protocol. */
export type ConversationMessageRef = ConversationMessageRefShape;

/** Allowed values for ConversationPinrole. */
export const ConversationPinroleValues = { Value0: 'assistant', Value1: 'user' } as const;

/** ConversationPin wire fields. */
export interface ConversationPinShape {
    /** createdAt as defined by the Nexa gateway. */
    readonly createdAt: number;
    /** excerpt as defined by the Nexa gateway. */
    readonly excerpt: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** message as defined by the Nexa gateway. */
    readonly message: ConversationMessageRef;
    /** role as defined by the Nexa gateway. */
    readonly role: (typeof ConversationPinroleValues)[keyof typeof ConversationPinroleValues];
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
    /** timestamp as defined by the Nexa gateway. */
    readonly timestamp: number;
    /** title as defined by the Nexa gateway. */
    readonly title: string;
}

/** ConversationPin from the Nexa wire protocol. */
export type ConversationPin = ConversationPinShape;

/** ConversationPinParams wire fields. */
export interface ConversationPinParamsShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** message as defined by the Nexa gateway. */
    readonly message: ConversationMessageRef;
}

/** ConversationPinParams from the Nexa wire protocol. */
export type ConversationPinParams = ConversationPinParamsShape;

/** ConversationPinsPage wire fields. */
export interface ConversationPinsPageShape {
    /** nextBefore as defined by the Nexa gateway. */
    readonly nextBefore?: string;
    /** pins as defined by the Nexa gateway. */
    readonly pins: ReadonlyArray<ConversationPin>;
}

/** ConversationPinsPage from the Nexa wire protocol. */
export type ConversationPinsPage = ConversationPinsPageShape;

/** ConversationPinsParams wire fields. */
export interface ConversationPinsParamsShape {
    /** before as defined by the Nexa gateway. */
    readonly before?: string;
    /** limit as defined by the Nexa gateway. */
    readonly limit?: number;
}

/** ConversationPinsParams from the Nexa wire protocol. */
export type ConversationPinsParams = ConversationPinsParamsShape;

/** ConversationRenameParams wire fields. */
export interface ConversationRenameParamsShape {
    /** expectedTitle as defined by the Nexa gateway. */
    readonly expectedTitle: null | string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** title as defined by the Nexa gateway. */
    readonly title: string;
}

/** ConversationRenameParams from the Nexa wire protocol. */
export type ConversationRenameParams = ConversationRenameParamsShape;

/** Allowed values for ConversationRetryParamsmode. */
export const ConversationRetryParamsmodeValues = { Value0: 'edit', Value1: 'regenerate' } as const;

/** Allowed values for ConversationRetryParamsreasoningEffort. */
export const ConversationRetryParamsreasoningEffortValues = {
    Value0: 'high',
    Value1: 'low',
    Value2: 'max',
    Value3: 'medium',
    Value4: 'minimal',
    Value5: 'off',
    Value6: 'xhigh',
} as const;

/** ConversationRetryParams wire fields. */
export interface ConversationRetryParamsShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** message as defined by the Nexa gateway. */
    readonly message: ConversationMessageRef;
    /** mode as defined by the Nexa gateway. */
    readonly mode: (typeof ConversationRetryParamsmodeValues)[keyof typeof ConversationRetryParamsmodeValues];
    /** reasoningEffort as defined by the Nexa gateway. */
    readonly reasoningEffort?: (typeof ConversationRetryParamsreasoningEffortValues)[keyof typeof ConversationRetryParamsreasoningEffortValues];
    /** requestId as defined by the Nexa gateway. */
    readonly requestId: string;
    /** targetTimeSeconds as defined by the Nexa gateway. */
    readonly targetTimeSeconds?: number;
    /** text as defined by the Nexa gateway. */
    readonly text?: string;
}

/** ConversationRetryParams from the Nexa wire protocol. */
export type ConversationRetryParams = ConversationRetryParamsShape;

/** ConversationRetryResult wire fields. */
export interface ConversationRetryResultShape {
    /** session as defined by the Nexa gateway. */
    readonly session: Session;
    /** started as defined by the Nexa gateway. */
    readonly started: boolean;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId: string;
}

/** ConversationRetryResult from the Nexa wire protocol. */
export type ConversationRetryResult = ConversationRetryResultShape;

/** ConversationSearchHit wire fields. */
export interface ConversationSearchHitShape {
    /** entryId as defined by the Nexa gateway. */
    readonly entryId: null | string;
    /** message as defined by the Nexa gateway. */
    readonly message?: ConversationMessageRef;
    /** role as defined by the Nexa gateway. */
    readonly role: string;
    /** session as defined by the Nexa gateway. */
    readonly session: Session;
    /** snippet as defined by the Nexa gateway. */
    readonly snippet: string;
    /** timestamp as defined by the Nexa gateway. */
    readonly timestamp: number;
}

/** ConversationSearchHit from the Nexa wire protocol. */
export type ConversationSearchHit = ConversationSearchHitShape;

/** ConversationSearchParams wire fields. */
export interface ConversationSearchParamsShape {
    /** limit as defined by the Nexa gateway. */
    readonly limit?: number;
    /** query as defined by the Nexa gateway. */
    readonly query: string;
}

/** ConversationSearchParams from the Nexa wire protocol. */
export type ConversationSearchParams = ConversationSearchParamsShape;

/** ConversationUnpinParams wire fields. */
export interface ConversationUnpinParamsShape {
    /** pinId as defined by the Nexa gateway. */
    readonly pinId: string;
}

/** ConversationUnpinParams from the Nexa wire protocol. */
export type ConversationUnpinParams = ConversationUnpinParamsShape;

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
    /** byCategory as defined by the Nexa gateway. */
    readonly byCategory?: Recordstringnumber;
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
    /** supportedWorkloads as defined by the Nexa gateway. */
    readonly supportedWorkloads?: ReadonlyArray<string>;
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

/** CustomMessage wire fields. */
export interface CustomMessageShape {
    /** content as defined by the Nexa gateway. */
    readonly content: ReadonlyArray<UserContentBlock> | string;
    /** customType as defined by the Nexa gateway. */
    readonly customType: string;
    /** details as defined by the Nexa gateway. */
    readonly details?:
        | ReadonlyArray<JsonValue>
        | Readonly<Record<string, JsonValue>>
        | null
        | string
        | number
        | boolean;
    /** display as defined by the Nexa gateway. */
    readonly display: boolean;
    /** excludeFromContext as defined by the Nexa gateway. */
    readonly excludeFromContext?: boolean;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** role as defined by the Nexa gateway. */
    readonly role: 'custom';
    /** runtimeContextCarrier as defined by the Nexa gateway. */
    readonly runtimeContextCarrier?: boolean;
    /** timestamp as defined by the Nexa gateway. */
    readonly timestamp: number;
}

/** CustomMessage from the Nexa wire protocol. */
export type CustomMessage = CustomMessageShape;

/** DataFile wire fields. */
export interface DataFileShape {
    /** byteLength as defined by the Nexa gateway. */
    readonly byteLength: string;
    /** filename as defined by the Nexa gateway. */
    readonly filename: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** path as defined by the Nexa gateway. */
    readonly path: string;
}

/** DataFile from the Nexa wire protocol. */
export type DataFile = DataFileShape;

/** DataUpload wire fields. */
export interface DataUploadShape {
    /** byteLength as defined by the Nexa gateway. */
    readonly byteLength: string;
    /** filename as defined by the Nexa gateway. */
    readonly filename: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** DataUpload from the Nexa wire protocol. */
export type DataUpload = DataUploadShape;

/** DataUploadChunkParams wire fields. */
export interface DataUploadChunkParamsShape {
    /** data as defined by the Nexa gateway. */
    readonly data: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** offset as defined by the Nexa gateway. */
    readonly offset: string;
}

/** DataUploadChunkParams from the Nexa wire protocol. */
export type DataUploadChunkParams = DataUploadChunkParamsShape;

/** DataUploadIdParams wire fields. */
export interface DataUploadIdParamsShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** DataUploadIdParams from the Nexa wire protocol. */
export type DataUploadIdParams = DataUploadIdParamsShape;

/** DataUploadPosition wire fields. */
export interface DataUploadPositionShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** offset as defined by the Nexa gateway. */
    readonly offset: string;
}

/** DataUploadPosition from the Nexa wire protocol. */
export type DataUploadPosition = DataUploadPositionShape;

/** DataUploadStartParams wire fields. */
export interface DataUploadStartParamsShape {
    /** byteLength as defined by the Nexa gateway. */
    readonly byteLength: string;
    /** filename as defined by the Nexa gateway. */
    readonly filename: string;
}

/** DataUploadStartParams from the Nexa wire protocol. */
export type DataUploadStartParams = DataUploadStartParamsShape;

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
    Value5: 'delivery-unconfirmed',
    Value6: 'denied',
    Value7: 'forbidden',
    Value8: 'internal',
    Value9: 'invalid-request',
    Value10: 'network',
    Value11: 'not-found',
    Value12: 'protocol',
    Value13: 'rate-limit',
    Value14: 'timeout',
    Value15: 'tool-execution',
    Value16: 'tool-input',
    Value17: 'upstream',
} as const;

/** ErrorCode from the Nexa wire protocol. */
export type ErrorCode = (typeof ErrorCodeValues)[keyof typeof ErrorCodeValues];

/** Allowed values for Exclude. */
export const ExcludeValues = {
    Value0: 'audio',
    Value1: 'boolean',
    Value2: 'datetime',
    Value3: 'file',
    Value4: 'flow',
    Value5: 'image',
    Value6: 'integer',
    Value7: 'json',
    Value8: 'message',
    Value9: 'number',
    Value10: 'table',
    Value11: 'text',
    Value12: 'timestamp',
    Value13: 'video',
} as const;

/** Exclude from the Nexa wire protocol. */
export type Exclude = (typeof ExcludeValues)[keyof typeof ExcludeValues];

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

/** Allowed values for SessionEntryBasevisibility. */
export const SessionEntryBasevisibilityValues = {
    Value0: 'active',
    Value1: 'compacted',
    Value2: 'rewound',
} as const;

/** SessionEntryBase wire fields. */
export interface SessionEntryBaseShape {
    /** appendMode as defined by the Nexa gateway. */
    readonly appendMode?: 'side';
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** parentId as defined by the Nexa gateway. */
    readonly parentId: null | string;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
    /** timestamp as defined by the Nexa gateway. */
    readonly timestamp: number;
    /** visibility as defined by the Nexa gateway. */
    readonly visibility: (typeof SessionEntryBasevisibilityValues)[keyof typeof SessionEntryBasevisibilityValues];
}

/** SessionEntryBase from the Nexa wire protocol. */
export type SessionEntryBase = SessionEntryBaseShape;

/** Session wire fields. */
export interface SessionShape {
    /** activeToolFamilies as defined by the Nexa gateway. */
    readonly activeToolFamilies?: ReadonlyArray<string>;
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
    /** retryFingerprint as defined by the Nexa gateway. */
    readonly retryFingerprint?: string;
    /** retryRequestId as defined by the Nexa gateway. */
    readonly retryRequestId?: string;
    /** retrySourceId as defined by the Nexa gateway. */
    readonly retrySourceId?: string;
    /** retryState as defined by the Nexa gateway. */
    readonly retryState?: string;
    /** title as defined by the Nexa gateway. */
    readonly title: null | string;
    /** titleEdited as defined by the Nexa gateway. */
    readonly titleEdited?: boolean;
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

/** FunnelCohort wire fields. */
export interface FunnelCohortShape {
    /** configRevision as defined by the Nexa gateway. */
    readonly configRevision: string;
    /** device as defined by the Nexa gateway. */
    readonly device: string;
    /** experimentId as defined by the Nexa gateway. */
    readonly experimentId: string;
    /** observedConfig as defined by the Nexa gateway. */
    readonly observedConfig?: string;
    /** observedPerformance as defined by the Nexa gateway. */
    readonly observedPerformance?: string;
    /** placeId as defined by the Nexa gateway. */
    readonly placeId: string;
    /** placeVersion as defined by the Nexa gateway. */
    readonly placeVersion: string;
    /** variant as defined by the Nexa gateway. */
    readonly variant: string;
}

/** FunnelCohort from the Nexa wire protocol. */
export type FunnelCohort = FunnelCohortShape;

/** FunnelGroup wire fields. */
export interface FunnelGroupShape {
    /** attempts as defined by the Nexa gateway. */
    readonly attempts: number;
    /** cohort as defined by the Nexa gateway. */
    readonly cohort: FunnelCohort;
    /** conversion as defined by the Nexa gateway. */
    readonly conversion: number;
    /** reached as defined by the Nexa gateway. */
    readonly reached: ReadonlyArray<number>;
    /** sessions as defined by the Nexa gateway. */
    readonly sessions: number;
}

/** FunnelGroup from the Nexa wire protocol. */
export type FunnelGroup = FunnelGroupShape;

/** FunnelQuery wire fields. */
export interface FunnelQueryShape {
    /** appliedConfigKey as defined by the Nexa gateway. */
    readonly appliedConfigKey?: string;
    /** completionWindowMs as defined by the Nexa gateway. */
    readonly completionWindowMs: string;
    /** configLookbackMs as defined by the Nexa gateway. */
    readonly configLookbackMs?: string;
    /** fromMs as defined by the Nexa gateway. */
    readonly fromMs: string;
    /** performanceFpsThreshold as defined by the Nexa gateway. */
    readonly performanceFpsThreshold?: number;
    /** performanceLookbackMs as defined by the Nexa gateway. */
    readonly performanceLookbackMs?: string;
    /** steps as defined by the Nexa gateway. */
    readonly steps: ReadonlyArray<string>;
    /** toMs as defined by the Nexa gateway. */
    readonly toMs: string;
}

/** FunnelQuery from the Nexa wire protocol. */
export type FunnelQuery = FunnelQueryShape;

/** FunnelReport wire fields. */
export interface FunnelReportShape {
    /** caveats as defined by the Nexa gateway. */
    readonly caveats: ReadonlyArray<string>;
    /** collection as defined by the Nexa gateway. */
    readonly collection?: TelemetryHealth;
    /** duplicateEvents as defined by the Nexa gateway. */
    readonly duplicateEvents: number;
    /** generatedAtMs as defined by the Nexa gateway. */
    readonly generatedAtMs: string;
    /** groups as defined by the Nexa gateway. */
    readonly groups: ReadonlyArray<FunnelGroup>;
    /** ignoredClientEvents as defined by the Nexa gateway. */
    readonly ignoredClientEvents: number;
    /** latestMatchingEventMs as defined by the Nexa gateway. */
    readonly latestMatchingEventMs: null | string;
    /** missingAttemptEvents as defined by the Nexa gateway. */
    readonly missingAttemptEvents: number;
    /** missingStartAttempts as defined by the Nexa gateway. */
    readonly missingStartAttempts: number;
    /** mixedCohortAttempts as defined by the Nexa gateway. */
    readonly mixedCohortAttempts: number;
    /** observedUntilMs as defined by the Nexa gateway. */
    readonly observedUntilMs: string;
    /** pendingAttempts as defined by the Nexa gateway. */
    readonly pendingAttempts: number;
    /** query as defined by the Nexa gateway. */
    readonly query: FunnelQuery;
    /** repeatedStartEvents as defined by the Nexa gateway. */
    readonly repeatedStartEvents: number;
    /** unattributedConfigAttempts as defined by the Nexa gateway. */
    readonly unattributedConfigAttempts?: number;
    /** unmeasuredPerformanceAttempts as defined by the Nexa gateway. */
    readonly unmeasuredPerformanceAttempts?: number;
}

/** FunnelReport from the Nexa wire protocol. */
export type FunnelReport = FunnelReportShape;

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
    /** officeAppearance as defined by the Nexa gateway. */
    readonly officeAppearance?: true;
    /** officeCompany as defined by the Nexa gateway. */
    readonly officeCompany?: true;
    /** officeCompanyLimits as defined by the Nexa gateway. */
    readonly officeCompanyLimits?: true;
    /** officeCompanyUpdates as defined by the Nexa gateway. */
    readonly officeCompanyUpdates?: true;
    /** officeConstruction as defined by the Nexa gateway. */
    readonly officeConstruction?: true;
    /** officeDepartmentKnowledge as defined by the Nexa gateway. */
    readonly officeDepartmentKnowledge?: true;
    /** officeDepartmentTools as defined by the Nexa gateway. */
    readonly officeDepartmentTools?: true;
    /** officeDeskAssignments as defined by the Nexa gateway. */
    readonly officeDeskAssignments?: true;
    /** officeDeskPositions as defined by the Nexa gateway. */
    readonly officeDeskPositions?: true;
    /** officeEmployeeCosts as defined by the Nexa gateway. */
    readonly officeEmployeeCosts?: true;
    /** officeEmployeeDevelopment as defined by the Nexa gateway. */
    readonly officeEmployeeDevelopment?: true;
    /** officeEmployeeResults as defined by the Nexa gateway. */
    readonly officeEmployeeResults?: true;
    /** officeExecution as defined by the Nexa gateway. */
    readonly officeExecution?: true;
    /** officeExecutionHosts as defined by the Nexa gateway. */
    readonly officeExecutionHosts?: true;
    /** officeGame as defined by the Nexa gateway. */
    readonly officeGame?: true;
    /** officeGameVersion as defined by the Nexa gateway. */
    readonly officeGameVersion?: 3;
    /** officeLayout as defined by the Nexa gateway. */
    readonly officeLayout?: true;
    /** officeLayoutDesks as defined by the Nexa gateway. */
    readonly officeLayoutDesks?: true;
    /** officeProjectBaselines as defined by the Nexa gateway. */
    readonly officeProjectBaselines?: true;
    /** officeProjectPermissions as defined by the Nexa gateway. */
    readonly officeProjectPermissions?: true;
    /** officeProjectRecovery as defined by the Nexa gateway. */
    readonly officeProjectRecovery?: true;
    /** officeProjects as defined by the Nexa gateway. */
    readonly officeProjects?: true;
    /** officeShowroom as defined by the Nexa gateway. */
    readonly officeShowroom?: true;
    /** officeVerification as defined by the Nexa gateway. */
    readonly officeVerification?: true;
    /** sessionHistory as defined by the Nexa gateway. */
    readonly sessionHistory?: true;
    /** sessionHistoryUpdates as defined by the Nexa gateway. */
    readonly sessionHistoryUpdates?: true;
    /** workflowDraftsVersion as defined by the Nexa gateway. */
    readonly workflowDraftsVersion?: 1;
    /** workflowGraphVersion as defined by the Nexa gateway. */
    readonly workflowGraphVersion?: 1;
    /** workflowPlanningVersion as defined by the Nexa gateway. */
    readonly workflowPlanningVersion?: 1;
    /** workflowRunsVersion as defined by the Nexa gateway. */
    readonly workflowRunsVersion?: 1;
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

/** GatewayMethodsagent_steerresult wire fields. */
export interface GatewayMethodsagent_steerresultShape {
    /** accepted as defined by the Nexa gateway. */
    readonly accepted: boolean;
}

/** GatewayMethodsagent_steer wire fields. */
export interface GatewayMethodsagent_steerShape {
    /** params as defined by the Nexa gateway. */
    readonly params: SteerParams;
    /** result as defined by the Nexa gateway. */
    readonly result: GatewayMethodsagent_steerresultShape;
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

/** GatewayMethodsagents_personal_list wire fields. */
export interface GatewayMethodsagents_personal_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<PersonalAgent>;
}

/** GatewayMethodsagents_personal_remove wire fields. */
export interface GatewayMethodsagents_personal_removeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: IdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsagents_personal_save wire fields. */
export interface GatewayMethodsagents_personal_saveShape {
    /** params as defined by the Nexa gateway. */
    readonly params: PersonalAgentInput;
    /** result as defined by the Nexa gateway. */
    readonly result: PersonalAgent;
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

/** GatewayMethodscredit_resetAllowance wire fields. */
export interface GatewayMethodscredit_resetAllowanceShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ResetAllowanceParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ResetAllowanceResult;
}

/** GatewayMethodscredit_resetHistoryparams wire fields. */
export interface GatewayMethodscredit_resetHistoryparamsShape {
    /** before as defined by the Nexa gateway. */
    readonly before?: string;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** GatewayMethodscredit_resetHistory wire fields. */
export interface GatewayMethodscredit_resetHistoryShape {
    /** params as defined by the Nexa gateway. */
    readonly params: GatewayMethodscredit_resetHistoryparamsShape;
    /** result as defined by the Nexa gateway. */
    readonly result: ResetHistoryPage;
}

/** GatewayMethodscredit_resetsparams wire fields. */
export interface GatewayMethodscredit_resetsparamsShape {
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** GatewayMethodscredit_resets wire fields. */
export interface GatewayMethodscredit_resetsShape {
    /** params as defined by the Nexa gateway. */
    readonly params: GatewayMethodscredit_resetsparamsShape;
    /** result as defined by the Nexa gateway. */
    readonly result: ResetSnapshot | null;
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

/** GatewayMethodscredit_walletparams wire fields. */
export interface GatewayMethodscredit_walletparamsShape {
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** GatewayMethodscredit_wallet wire fields. */
export interface GatewayMethodscredit_walletShape {
    /** params as defined by the Nexa gateway. */
    readonly params: GatewayMethodscredit_walletparamsShape;
    /** result as defined by the Nexa gateway. */
    readonly result: WalletSnapshot | null;
}

/** GatewayMethodscredit_walletHistoryparams wire fields. */
export interface GatewayMethodscredit_walletHistoryparamsShape {
    /** before as defined by the Nexa gateway. */
    readonly before?: string;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** GatewayMethodscredit_walletHistory wire fields. */
export interface GatewayMethodscredit_walletHistoryShape {
    /** params as defined by the Nexa gateway. */
    readonly params: GatewayMethodscredit_walletHistoryparamsShape;
    /** result as defined by the Nexa gateway. */
    readonly result: WalletHistoryPage;
}

/** GatewayMethodsdata_upload_cancel wire fields. */
export interface GatewayMethodsdata_upload_cancelShape {
    /** params as defined by the Nexa gateway. */
    readonly params: DataUploadIdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsdata_upload_chunk wire fields. */
export interface GatewayMethodsdata_upload_chunkShape {
    /** params as defined by the Nexa gateway. */
    readonly params: DataUploadChunkParams;
    /** result as defined by the Nexa gateway. */
    readonly result: DataUploadPosition;
}

/** GatewayMethodsdata_upload_finish wire fields. */
export interface GatewayMethodsdata_upload_finishShape {
    /** params as defined by the Nexa gateway. */
    readonly params: DataUploadIdParams;
    /** result as defined by the Nexa gateway. */
    readonly result: DataFile;
}

/** GatewayMethodsdata_upload_start wire fields. */
export interface GatewayMethodsdata_upload_startShape {
    /** params as defined by the Nexa gateway. */
    readonly params: DataUploadStartParams;
    /** result as defined by the Nexa gateway. */
    readonly result: DataUpload;
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

/** GatewayMethodsoffice_ownerProofparams wire fields. */
export interface GatewayMethodsoffice_ownerProofparamsShape {
    /** accountId as defined by the Nexa gateway. */
    readonly accountId: string;
}

/** GatewayMethodsoffice_ownerProofresult wire fields. */
export interface GatewayMethodsoffice_ownerProofresultShape {
    /** proof as defined by the Nexa gateway. */
    readonly proof: string;
}

/** GatewayMethodsoffice_ownerProof wire fields. */
export interface GatewayMethodsoffice_ownerProofShape {
    /** params as defined by the Nexa gateway. */
    readonly params: GatewayMethodsoffice_ownerProofparamsShape;
    /** result as defined by the Nexa gateway. */
    readonly result: GatewayMethodsoffice_ownerProofresultShape;
}

/** GatewayMethodsprocesses_input wire fields. */
export interface GatewayMethodsprocesses_inputShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ProcessInput;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsprocesses_list wire fields. */
export interface GatewayMethodsprocesses_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: SessionRef;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<BackgroundProcess>;
}

/** GatewayMethodsprocesses_log wire fields. */
export interface GatewayMethodsprocesses_logShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ProcessLogRef;
    /** result as defined by the Nexa gateway. */
    readonly result: BackgroundProcessLog;
}

/** GatewayMethodsprocesses_resize wire fields. */
export interface GatewayMethodsprocesses_resizeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ProcessResize;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsprocesses_stop wire fields. */
export interface GatewayMethodsprocesses_stopShape {
    /** params as defined by the Nexa gateway. */
    readonly params: BackgroundProcessRef;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodsroblox_credentials_remove wire fields. */
export interface GatewayMethodsroblox_credentials_removeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: RobloxCredentialStatus;
}

/** GatewayMethodsroblox_credentials_set wire fields. */
export interface GatewayMethodsroblox_credentials_setShape {
    /** params as defined by the Nexa gateway. */
    readonly params: RobloxCredentialSetParams;
    /** result as defined by the Nexa gateway. */
    readonly result: RobloxCredentialStatus;
}

/** GatewayMethodsroblox_credentials_status wire fields. */
export interface GatewayMethodsroblox_credentials_statusShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: RobloxCredentialStatus;
}

/** GatewayMethodsroblox_telemetry_funnel wire fields. */
export interface GatewayMethodsroblox_telemetry_funnelShape {
    /** params as defined by the Nexa gateway. */
    readonly params: TelemetryFunnelParams;
    /** result as defined by the Nexa gateway. */
    readonly result: FunnelReport;
}

/** GatewayMethodsroblox_telemetry_performance wire fields. */
export interface GatewayMethodsroblox_telemetry_performanceShape {
    /** params as defined by the Nexa gateway. */
    readonly params: TelemetryPerformanceParams;
    /** result as defined by the Nexa gateway. */
    readonly result: PerformanceReport;
}

/** GatewayMethodsroblox_telemetry_projects wire fields. */
export interface GatewayMethodsroblox_telemetry_projectsShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<TelemetryProject>;
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

/** GatewayMethodssessions_history wire fields. */
export interface GatewayMethodssessions_historyShape {
    /** params as defined by the Nexa gateway. */
    readonly params: SessionHistoryParams;
    /** result as defined by the Nexa gateway. */
    readonly result: SessionHistoryPage;
}

/** GatewayMethodssessions_input wire fields. */
export interface GatewayMethodssessions_inputShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ConversationPinParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ConversationInput;
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

/** GatewayMethodssessions_pin wire fields. */
export interface GatewayMethodssessions_pinShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ConversationPinParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ConversationPin;
}

/** GatewayMethodssessions_pins wire fields. */
export interface GatewayMethodssessions_pinsShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ConversationPinsParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ConversationPinsPage;
}

/** GatewayMethodssessions_rename wire fields. */
export interface GatewayMethodssessions_renameShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ConversationRenameParams;
    /** result as defined by the Nexa gateway. */
    readonly result: Session;
}

/** GatewayMethodssessions_retry wire fields. */
export interface GatewayMethodssessions_retryShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ConversationRetryParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ConversationRetryResult;
}

/** GatewayMethodssessions_search wire fields. */
export interface GatewayMethodssessions_searchShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ConversationSearchParams;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<ConversationSearchHit>;
}

/** GatewayMethodssessions_subscribe wire fields. */
export interface GatewayMethodssessions_subscribeShape {
    /** params as defined by the Nexa gateway. */
    readonly params: SessionRef;
    /** result as defined by the Nexa gateway. */
    readonly result: OkResult;
}

/** GatewayMethodssessions_unpin wire fields. */
export interface GatewayMethodssessions_unpinShape {
    /** params as defined by the Nexa gateway. */
    readonly params: ConversationUnpinParams;
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

/** GatewayMethodsworkflows_catalog wire fields. */
export interface GatewayMethodsworkflows_catalogShape {
    /** params as defined by the Nexa gateway. */
    readonly params: Recordstringnever;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowCatalog;
}

/** GatewayMethodsworkflows_create wire fields. */
export interface GatewayMethodsworkflows_createShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowCreateRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowReceipt;
}

/** GatewayMethodsworkflows_list wire fields. */
export interface GatewayMethodsworkflows_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowListRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowListPage;
}

/** GatewayMethodsworkflows_models wire fields. */
export interface GatewayMethodsworkflows_modelsShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowModelsRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowModelsPage;
}

/** GatewayMethodsworkflows_models_refresh wire fields. */
export interface GatewayMethodsworkflows_models_refreshShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowModelsRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowModelsPage;
}

/** GatewayMethodsworkflows_models_resolve wire fields. */
export interface GatewayMethodsworkflows_models_resolveShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowModelResolutionRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowModelResolution;
}

/** GatewayMethodsworkflows_planning_cancel wire fields. */
export interface GatewayMethodsworkflows_planning_cancelShape {
    /** params as defined by the Nexa gateway. */
    readonly params: PlanningTurnRef;
    /** result as defined by the Nexa gateway. */
    readonly result: PlanningTurn;
}

/** GatewayMethodsworkflows_planning_history wire fields. */
export interface GatewayMethodsworkflows_planning_historyShape {
    /** params as defined by the Nexa gateway. */
    readonly params: PlanningHistoryRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: PlanningHistory;
}

/** GatewayMethodsworkflows_planning_read wire fields. */
export interface GatewayMethodsworkflows_planning_readShape {
    /** params as defined by the Nexa gateway. */
    readonly params: PlanningTurnRef;
    /** result as defined by the Nexa gateway. */
    readonly result: PlanningTurn;
}

/** GatewayMethodsworkflows_planning_send wire fields. */
export interface GatewayMethodsworkflows_planning_sendShape {
    /** params as defined by the Nexa gateway. */
    readonly params: PlanningRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: PlanningTurn;
}

/** GatewayMethodsworkflows_planning_sources wire fields. */
export interface GatewayMethodsworkflows_planning_sourcesShape {
    /** params as defined by the Nexa gateway. */
    readonly params: PlanningSourcesRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: PlanningSourcesPage;
}

/** GatewayMethodsworkflows_read wire fields. */
export interface GatewayMethodsworkflows_readShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowReadRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowManifestPage;
}

/** GatewayMethodsworkflows_record wire fields. */
export interface GatewayMethodsworkflows_recordShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowRecordRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowRecordPage;
}

/** GatewayMethodsworkflows_runs_artifact wire fields. */
export interface GatewayMethodsworkflows_runs_artifactShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowRunArtifactRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowRunArtifactPage;
}

/** GatewayMethodsworkflows_runs_cancel wire fields. */
export interface GatewayMethodsworkflows_runs_cancelShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowRunRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowRunSummary;
}

/** GatewayMethodsworkflows_runs_events wire fields. */
export interface GatewayMethodsworkflows_runs_eventsShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowRunEventsRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: ReadonlyArray<WorkflowRunEvent>;
}

/** GatewayMethodsworkflows_runs_list wire fields. */
export interface GatewayMethodsworkflows_runs_listShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowRunListRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowRunListPage;
}

/** GatewayMethodsworkflows_runs_output wire fields. */
export interface GatewayMethodsworkflows_runs_outputShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowRunOutputRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowRunOutputPage;
}

/** GatewayMethodsworkflows_runs_read wire fields. */
export interface GatewayMethodsworkflows_runs_readShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowRunRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowRunSummary;
}

/** GatewayMethodsworkflows_runs_start wire fields. */
export interface GatewayMethodsworkflows_runs_startShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowRunStartRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowRunSummary;
}

/** GatewayMethodsworkflows_runs_steps wire fields. */
export interface GatewayMethodsworkflows_runs_stepsShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowRunStepsRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowRunStepsPage;
}

/** GatewayMethodsworkflows_save wire fields. */
export interface GatewayMethodsworkflows_saveShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowSaveRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: WorkflowReceipt;
}

/** GatewayMethodsworkflows_validate wire fields. */
export interface GatewayMethodsworkflows_validateShape {
    /** params as defined by the Nexa gateway. */
    readonly params: WorkflowValidateRequest;
    /** result as defined by the Nexa gateway. */
    readonly result: GraphValidation;
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
    /** agent.steer as defined by the Nexa gateway. */
    readonly 'agent.steer': GatewayMethodsagent_steerShape;
    /** agent.stream as defined by the Nexa gateway. */
    readonly 'agent.stream': GatewayMethodsagent_streamShape;
    /** agents.define as defined by the Nexa gateway. */
    readonly 'agents.define': GatewayMethodsagents_defineShape;
    /** agents.list as defined by the Nexa gateway. */
    readonly 'agents.list': GatewayMethodsagents_listShape;
    /** agents.personal.list as defined by the Nexa gateway. */
    readonly 'agents.personal.list': GatewayMethodsagents_personal_listShape;
    /** agents.personal.remove as defined by the Nexa gateway. */
    readonly 'agents.personal.remove': GatewayMethodsagents_personal_removeShape;
    /** agents.personal.save as defined by the Nexa gateway. */
    readonly 'agents.personal.save': GatewayMethodsagents_personal_saveShape;
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
    /** credit.resetAllowance as defined by the Nexa gateway. */
    readonly 'credit.resetAllowance': GatewayMethodscredit_resetAllowanceShape;
    /** credit.resetHistory as defined by the Nexa gateway. */
    readonly 'credit.resetHistory': GatewayMethodscredit_resetHistoryShape;
    /** credit.resets as defined by the Nexa gateway. */
    readonly 'credit.resets': GatewayMethodscredit_resetsShape;
    /** credit.setBudget as defined by the Nexa gateway. */
    readonly 'credit.setBudget': GatewayMethodscredit_setBudgetShape;
    /** credit.summary as defined by the Nexa gateway. */
    readonly 'credit.summary': GatewayMethodscredit_summaryShape;
    /** credit.wallet as defined by the Nexa gateway. */
    readonly 'credit.wallet': GatewayMethodscredit_walletShape;
    /** credit.walletHistory as defined by the Nexa gateway. */
    readonly 'credit.walletHistory': GatewayMethodscredit_walletHistoryShape;
    /** data.upload.cancel as defined by the Nexa gateway. */
    readonly 'data.upload.cancel': GatewayMethodsdata_upload_cancelShape;
    /** data.upload.chunk as defined by the Nexa gateway. */
    readonly 'data.upload.chunk': GatewayMethodsdata_upload_chunkShape;
    /** data.upload.finish as defined by the Nexa gateway. */
    readonly 'data.upload.finish': GatewayMethodsdata_upload_finishShape;
    /** data.upload.start as defined by the Nexa gateway. */
    readonly 'data.upload.start': GatewayMethodsdata_upload_startShape;
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
    /** office.ownerProof as defined by the Nexa gateway. */
    readonly 'office.ownerProof': GatewayMethodsoffice_ownerProofShape;
    /** processes.input as defined by the Nexa gateway. */
    readonly 'processes.input': GatewayMethodsprocesses_inputShape;
    /** processes.list as defined by the Nexa gateway. */
    readonly 'processes.list': GatewayMethodsprocesses_listShape;
    /** processes.log as defined by the Nexa gateway. */
    readonly 'processes.log': GatewayMethodsprocesses_logShape;
    /** processes.resize as defined by the Nexa gateway. */
    readonly 'processes.resize': GatewayMethodsprocesses_resizeShape;
    /** processes.stop as defined by the Nexa gateway. */
    readonly 'processes.stop': GatewayMethodsprocesses_stopShape;
    /** roblox.credentials.remove as defined by the Nexa gateway. */
    readonly 'roblox.credentials.remove': GatewayMethodsroblox_credentials_removeShape;
    /** roblox.credentials.set as defined by the Nexa gateway. */
    readonly 'roblox.credentials.set': GatewayMethodsroblox_credentials_setShape;
    /** roblox.credentials.status as defined by the Nexa gateway. */
    readonly 'roblox.credentials.status': GatewayMethodsroblox_credentials_statusShape;
    /** roblox.telemetry.funnel as defined by the Nexa gateway. */
    readonly 'roblox.telemetry.funnel': GatewayMethodsroblox_telemetry_funnelShape;
    /** roblox.telemetry.performance as defined by the Nexa gateway. */
    readonly 'roblox.telemetry.performance': GatewayMethodsroblox_telemetry_performanceShape;
    /** roblox.telemetry.projects as defined by the Nexa gateway. */
    readonly 'roblox.telemetry.projects': GatewayMethodsroblox_telemetry_projectsShape;
    /** sessions.delete as defined by the Nexa gateway. */
    readonly 'sessions.delete': GatewayMethodssessions_deleteShape;
    /** sessions.download as defined by the Nexa gateway. */
    readonly 'sessions.download': GatewayMethodssessions_downloadShape;
    /** sessions.files as defined by the Nexa gateway. */
    readonly 'sessions.files': GatewayMethodssessions_filesShape;
    /** sessions.get as defined by the Nexa gateway. */
    readonly 'sessions.get': GatewayMethodssessions_getShape;
    /** sessions.history as defined by the Nexa gateway. */
    readonly 'sessions.history': GatewayMethodssessions_historyShape;
    /** sessions.input as defined by the Nexa gateway. */
    readonly 'sessions.input': GatewayMethodssessions_inputShape;
    /** sessions.list as defined by the Nexa gateway. */
    readonly 'sessions.list': GatewayMethodssessions_listShape;
    /** sessions.messages as defined by the Nexa gateway. */
    readonly 'sessions.messages': GatewayMethodssessions_messagesShape;
    /** sessions.pin as defined by the Nexa gateway. */
    readonly 'sessions.pin': GatewayMethodssessions_pinShape;
    /** sessions.pins as defined by the Nexa gateway. */
    readonly 'sessions.pins': GatewayMethodssessions_pinsShape;
    /** sessions.rename as defined by the Nexa gateway. */
    readonly 'sessions.rename': GatewayMethodssessions_renameShape;
    /** sessions.retry as defined by the Nexa gateway. */
    readonly 'sessions.retry': GatewayMethodssessions_retryShape;
    /** sessions.search as defined by the Nexa gateway. */
    readonly 'sessions.search': GatewayMethodssessions_searchShape;
    /** sessions.subscribe as defined by the Nexa gateway. */
    readonly 'sessions.subscribe': GatewayMethodssessions_subscribeShape;
    /** sessions.unpin as defined by the Nexa gateway. */
    readonly 'sessions.unpin': GatewayMethodssessions_unpinShape;
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
    /** workflows.catalog as defined by the Nexa gateway. */
    readonly 'workflows.catalog': GatewayMethodsworkflows_catalogShape;
    /** workflows.create as defined by the Nexa gateway. */
    readonly 'workflows.create': GatewayMethodsworkflows_createShape;
    /** workflows.list as defined by the Nexa gateway. */
    readonly 'workflows.list': GatewayMethodsworkflows_listShape;
    /** workflows.models as defined by the Nexa gateway. */
    readonly 'workflows.models': GatewayMethodsworkflows_modelsShape;
    /** workflows.models.refresh as defined by the Nexa gateway. */
    readonly 'workflows.models.refresh': GatewayMethodsworkflows_models_refreshShape;
    /** workflows.models.resolve as defined by the Nexa gateway. */
    readonly 'workflows.models.resolve': GatewayMethodsworkflows_models_resolveShape;
    /** workflows.planning.cancel as defined by the Nexa gateway. */
    readonly 'workflows.planning.cancel': GatewayMethodsworkflows_planning_cancelShape;
    /** workflows.planning.history as defined by the Nexa gateway. */
    readonly 'workflows.planning.history': GatewayMethodsworkflows_planning_historyShape;
    /** workflows.planning.read as defined by the Nexa gateway. */
    readonly 'workflows.planning.read': GatewayMethodsworkflows_planning_readShape;
    /** workflows.planning.send as defined by the Nexa gateway. */
    readonly 'workflows.planning.send': GatewayMethodsworkflows_planning_sendShape;
    /** workflows.planning.sources as defined by the Nexa gateway. */
    readonly 'workflows.planning.sources': GatewayMethodsworkflows_planning_sourcesShape;
    /** workflows.read as defined by the Nexa gateway. */
    readonly 'workflows.read': GatewayMethodsworkflows_readShape;
    /** workflows.record as defined by the Nexa gateway. */
    readonly 'workflows.record': GatewayMethodsworkflows_recordShape;
    /** workflows.runs.artifact as defined by the Nexa gateway. */
    readonly 'workflows.runs.artifact': GatewayMethodsworkflows_runs_artifactShape;
    /** workflows.runs.cancel as defined by the Nexa gateway. */
    readonly 'workflows.runs.cancel': GatewayMethodsworkflows_runs_cancelShape;
    /** workflows.runs.events as defined by the Nexa gateway. */
    readonly 'workflows.runs.events': GatewayMethodsworkflows_runs_eventsShape;
    /** workflows.runs.list as defined by the Nexa gateway. */
    readonly 'workflows.runs.list': GatewayMethodsworkflows_runs_listShape;
    /** workflows.runs.output as defined by the Nexa gateway. */
    readonly 'workflows.runs.output': GatewayMethodsworkflows_runs_outputShape;
    /** workflows.runs.read as defined by the Nexa gateway. */
    readonly 'workflows.runs.read': GatewayMethodsworkflows_runs_readShape;
    /** workflows.runs.start as defined by the Nexa gateway. */
    readonly 'workflows.runs.start': GatewayMethodsworkflows_runs_startShape;
    /** workflows.runs.steps as defined by the Nexa gateway. */
    readonly 'workflows.runs.steps': GatewayMethodsworkflows_runs_stepsShape;
    /** workflows.save as defined by the Nexa gateway. */
    readonly 'workflows.save': GatewayMethodsworkflows_saveShape;
    /** workflows.validate as defined by the Nexa gateway. */
    readonly 'workflows.validate': GatewayMethodsworkflows_validateShape;
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

/** Allowed values for GeometryFormat. */
export const GeometryFormatValues = { Value0: 'gaussian_ply', Value1: 'glb' } as const;

/** GeometryFormat from the Nexa wire protocol. */
export type GeometryFormat = (typeof GeometryFormatValues)[keyof typeof GeometryFormatValues];

/** GraphIssue wire fields. */
export interface GraphIssueShape {
    /** code as defined by the Nexa gateway. */
    readonly code: GraphIssueCode;
    /** edgeId as defined by the Nexa gateway. */
    readonly edgeId: null | string;
    /** message as defined by the Nexa gateway. */
    readonly message: string;
    /** nodeId as defined by the Nexa gateway. */
    readonly nodeId: null | string;
    /** path as defined by the Nexa gateway. */
    readonly path: null | string;
    /** severity as defined by the Nexa gateway. */
    readonly severity: GraphSeverity;
}

/** GraphIssue from the Nexa wire protocol. */
export type GraphIssue = GraphIssueShape;

/** Allowed values for GraphIssueCode. */
export const GraphIssueCodeValues = {
    Value0: 'ambiguous',
    Value1: 'cardinality',
    Value2: 'component',
    Value3: 'configuration',
    Value4: 'connection',
    Value5: 'cycle',
    Value6: 'duplicate',
    Value7: 'endpoint',
    Value8: 'required',
    Value9: 'resource',
    Value10: 'runtime',
    Value11: 'setup',
    Value12: 'trigger',
    Value13: 'unreachable',
} as const;

/** GraphIssueCode from the Nexa wire protocol. */
export type GraphIssueCode = (typeof GraphIssueCodeValues)[keyof typeof GraphIssueCodeValues];

/** Allowed values for GraphSeverity. */
export const GraphSeverityValues = { Value0: 'error', Value1: 'warning' } as const;

/** GraphSeverity from the Nexa wire protocol. */
export type GraphSeverity = (typeof GraphSeverityValues)[keyof typeof GraphSeverityValues];

/** GraphValidation wire fields. */
export interface GraphValidationShape {
    /** issues as defined by the Nexa gateway. */
    readonly issues: ReadonlyArray<GraphIssue>;
    /** order as defined by the Nexa gateway. */
    readonly order: ReadonlyArray<string>;
    /** requiredCapabilities as defined by the Nexa gateway. */
    readonly requiredCapabilities: ReadonlyArray<string>;
    /** resourceRequirements as defined by the Nexa gateway. */
    readonly resourceRequirements: number;
    /** revision as defined by the Nexa gateway. */
    readonly revision: string;
    /** totalIssues as defined by the Nexa gateway. */
    readonly totalIssues: number;
    /** truncated as defined by the Nexa gateway. */
    readonly truncated: boolean;
    /** unavailableHandlers as defined by the Nexa gateway. */
    readonly unavailableHandlers: ReadonlyArray<string>;
    /** valid as defined by the Nexa gateway. */
    readonly valid: boolean;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** GraphValidation from the Nexa wire protocol. */
export type GraphValidation = GraphValidationShape;

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

/** HistoryApprovalRequested wire fields. */
export interface HistoryApprovalRequestedShape {
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** data as defined by the Nexa gateway. */
    readonly data: ApprovalRequestedData;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'approval-requested';
    /** runId as defined by the Nexa gateway. */
    readonly runId: null | string;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId?: string;
}

/** HistoryApprovalRequested from the Nexa wire protocol. */
export type HistoryApprovalRequested = HistoryApprovalRequestedShape;

/** HistoryApprovalResolved wire fields. */
export interface HistoryApprovalResolvedShape {
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** data as defined by the Nexa gateway. */
    readonly data: ApprovalResolvedData;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'approval-resolved';
}

/** HistoryApprovalResolved from the Nexa wire protocol. */
export type HistoryApprovalResolved = HistoryApprovalResolvedShape;

/** HistoryEnd wire fields. */
export interface HistoryEndShape {
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** data as defined by the Nexa gateway. */
    readonly data: TurnEndData;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'end';
}

/** HistoryEnd from the Nexa wire protocol. */
export type HistoryEnd = HistoryEndShape;

/** HistoryEvent wire fields. */
export interface HistoryEventShape {
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** data as defined by the Nexa gateway. */
    readonly data: TurnEventData;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'event';
}

/** HistoryEvent from the Nexa wire protocol. */
export type HistoryEvent = HistoryEventShape;

/** HistoryInput wire fields. */
export interface HistoryInputShape {
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** data as defined by the Nexa gateway. */
    readonly data: SessionMessageData;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'input';
}

/** HistoryInput from the Nexa wire protocol. */
export type HistoryInput = HistoryInputShape;

/** HistoryLegacy wire fields. */
export interface HistoryLegacyShape {
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** entries as defined by the Nexa gateway. */
    readonly entries: ReadonlyArray<SessionEntry>;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'legacy';
}

/** HistoryLegacy from the Nexa wire protocol. */
export type HistoryLegacy = HistoryLegacyShape;

/** HistorySites wire fields. */
export interface HistorySitesShape {
    /** at as defined by the Nexa gateway. */
    readonly at: number;
    /** data as defined by the Nexa gateway. */
    readonly data: ToolSitesData;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'sites';
}

/** HistorySites from the Nexa wire protocol. */
export type HistorySites = HistorySitesShape;

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

/** Allowed values for IncomingPolicy. */
export const IncomingPolicyValues = {
    Value0: 'collect',
    Value1: 'join',
    Value2: 'reject',
} as const;

/** IncomingPolicy from the Nexa wire protocol. */
export type IncomingPolicy = (typeof IncomingPolicyValues)[keyof typeof IncomingPolicyValues];

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
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'company-dispatch';
}

/** JobActionVariant3 wire fields. */
export interface JobActionVariant3Shape {
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

/** Allowed values for JobActionVariant4elevation. */
export const JobActionVariant4elevationValues = {
    Value0: 'ask',
    Value1: 'full',
    Value2: 'off',
    Value3: 'on',
} as const;

/** JobActionVariant4 wire fields. */
export interface JobActionVariant4Shape {
    /** allowSelfLifecycle as defined by the Nexa gateway. */
    readonly allowSelfLifecycle?: boolean;
    /** command as defined by the Nexa gateway. */
    readonly command: string;
    /** cwd as defined by the Nexa gateway. */
    readonly cwd?: string;
    /** elevation as defined by the Nexa gateway. */
    readonly elevation?: (typeof JobActionVariant4elevationValues)[keyof typeof JobActionVariant4elevationValues];
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'shell';
    /** timeoutMs as defined by the Nexa gateway. */
    readonly timeoutMs?: number;
}

/** JobActionVariant5 wire fields. */
export interface JobActionVariant5Shape {
    /** input as defined by the Nexa gateway. */
    readonly input: JsonValue;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'tool';
    /** tool as defined by the Nexa gateway. */
    readonly tool: string;
}

/** JobActionVariant6 wire fields. */
export interface JobActionVariant6Shape {
    /** event as defined by the Nexa gateway. */
    readonly event: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'event';
    /** payload as defined by the Nexa gateway. */
    readonly payload?: JsonValue;
}

/** JobActionVariant7 wire fields. */
export interface JobActionVariant7Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'maintenance';
}

/** JobAction from the Nexa wire protocol. */
export type JobAction =
    | TelemetryMonitorAction
    | JobActionVariant1Shape
    | ReminderAction
    | JobActionVariant3Shape
    | JobActionVariant4Shape
    | JobActionVariant5Shape
    | JobActionVariant6Shape
    | JobActionVariant7Shape;

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

/** ListSchema wire fields. */
export interface ListSchemaShape {
    /** item as defined by the Nexa gateway. */
    readonly item: ValueSchema;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'list';
    /** maxItems as defined by the Nexa gateway. */
    readonly maxItems: number;
    /** minItems as defined by the Nexa gateway. */
    readonly minItems: number;
    /** nullable as defined by the Nexa gateway. */
    readonly nullable: boolean;
}

/** ListSchema from the Nexa wire protocol. */
export type ListSchema = ListSchemaShape;

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

/** Allowed values for MockBehavior. */
export const MockBehaviorValues = {
    Value0: 'deterministic',
    Value1: 'fixture',
    Value2: 'none',
} as const;

/** MockBehavior from the Nexa wire protocol. */
export type MockBehavior = (typeof MockBehaviorValues)[keyof typeof MockBehaviorValues];

/** ModelMessage wire fields. */
export interface ModelMessageShape {
    /** content as defined by the Nexa gateway. */
    readonly content: ReadonlyArray<ContentBlock> | string;
    /** identity as defined by the Nexa gateway. */
    readonly identity?: ModelMessageIdentity;
    /** role as defined by the Nexa gateway. */
    readonly role: MessageRole;
}

/** ModelMessage from the Nexa wire protocol. */
export type ModelMessage = ModelMessageShape;

/** ModelMessageIdentity wire fields. */
export interface ModelMessageIdentityShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** inputId as defined by the Nexa gateway. */
    readonly inputId?: string;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId: string;
    /** timestamp as defined by the Nexa gateway. */
    readonly timestamp: number;
}

/** ModelMessageIdentity from the Nexa wire protocol. */
export type ModelMessageIdentity = ModelMessageIdentityShape;

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

/** NcapAsrTranscript wire fields. */
export interface NcapAsrTranscriptShape {
    /** audioSamples as defined by the Nexa gateway. */
    readonly audioSamples: number;
    /** language as defined by the Nexa gateway. */
    readonly language: string;
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** NcapAsrTranscript from the Nexa wire protocol. */
export type NcapAsrTranscript = NcapAsrTranscriptShape;

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

/** NcapDeltageometryVariant0 wire fields. */
export interface NcapDeltageometryVariant0Shape {
    /** model as defined by the Nexa gateway. */
    readonly model: string;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'accepted';
    /** seed as defined by the Nexa gateway. */
    readonly seed: number;
}

/** NcapDeltageometryVariant1 wire fields. */
export interface NcapDeltageometryVariant1Shape {
    /** completed as defined by the Nexa gateway. */
    readonly completed: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'progress';
    /** stage as defined by the Nexa gateway. */
    readonly stage: number;
    /** total as defined by the Nexa gateway. */
    readonly total: number;
}

/** Allowed values for NcapDeltageometryVariant2phase. */
export const NcapDeltageometryVariant2phaseValues = { Value0: 'chunk', Value1: 'preview' } as const;

/** NcapDeltageometryVariant2 wire fields. */
export interface NcapDeltageometryVariant2Shape {
    /** assetId as defined by the Nexa gateway. */
    readonly assetId: number;
    /** data as defined by the Nexa gateway. */
    readonly data: ReadonlyArray<number>;
    /** format as defined by the Nexa gateway. */
    readonly format: GeometryFormat;
    /** offset as defined by the Nexa gateway. */
    readonly offset: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: (typeof NcapDeltageometryVariant2phaseValues)[keyof typeof NcapDeltageometryVariant2phaseValues];
    /** revision as defined by the Nexa gateway. */
    readonly revision: number;
    /** totalBytes as defined by the Nexa gateway. */
    readonly totalBytes: number;
}

/** NcapDeltageometryVariant3 wire fields. */
export interface NcapDeltageometryVariant3Shape {
    /** assetId as defined by the Nexa gateway. */
    readonly assetId: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'end';
    /** totalBytes as defined by the Nexa gateway. */
    readonly totalBytes: number;
}

/** NcapDeltaimageVariant0 wire fields. */
export interface NcapDeltaimageVariant0Shape {
    /** data as defined by the Nexa gateway. */
    readonly data: ReadonlyArray<number>;
    /** index as defined by the Nexa gateway. */
    readonly index: number;
    /** offset as defined by the Nexa gateway. */
    readonly offset: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'chunk';
}

/** NcapDeltaimageVariant1 wire fields. */
export interface NcapDeltaimageVariant1Shape {
    /** height as defined by the Nexa gateway. */
    readonly height: number;
    /** index as defined by the Nexa gateway. */
    readonly index: number;
    /** phase as defined by the Nexa gateway. */
    readonly phase: 'end';
    /** totalBytes as defined by the Nexa gateway. */
    readonly totalBytes: number;
    /** transparent as defined by the Nexa gateway. */
    readonly transparent: boolean;
    /** width as defined by the Nexa gateway. */
    readonly width: number;
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
    /** asr as defined by the Nexa gateway. */
    readonly asr?: NcapAsrTranscript;
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
    /** geometry as defined by the Nexa gateway. */
    readonly geometry?:
        | NcapDeltageometryVariant0Shape
        | NcapDeltageometryVariant1Shape
        | NcapDeltageometryVariant2Shape
        | NcapDeltageometryVariant3Shape;
    /** graph as defined by the Nexa gateway. */
    readonly graph?: NcapGraphDelta;
    /** image as defined by the Nexa gateway. */
    readonly image?: NcapDeltaimageVariant0Shape | NcapDeltaimageVariant1Shape;
    /** preflight as defined by the Nexa gateway. */
    readonly preflight?: NcapDeltapreflightShape;
    /** reasoning as defined by the Nexa gateway. */
    readonly reasoning: string;
    /** reflection as defined by the Nexa gateway. */
    readonly reflection?: NcapDeltareflectionShape;
    /** research as defined by the Nexa gateway. */
    readonly research?: NcapResearchDelta;
    /** segmentation as defined by the Nexa gateway. */
    readonly segmentation?: SegmentationFrame;
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

/** ObjectSchema wire fields. */
export interface ObjectSchemaShape {
    /** additional as defined by the Nexa gateway. */
    readonly additional: boolean;
    /** fields as defined by the Nexa gateway. */
    readonly fields: ReadonlyArray<SchemaField>;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'object';
    /** nullable as defined by the Nexa gateway. */
    readonly nullable: boolean;
}

/** ObjectSchema from the Nexa wire protocol. */
export type ObjectSchema = ObjectSchemaShape;

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

/** PerformanceCohort wire fields. */
export interface PerformanceCohortShape {
    /** gamepadEnabled as defined by the Nexa gateway. */
    readonly gamepadEnabled: boolean;
    /** keyboardEnabled as defined by the Nexa gateway. */
    readonly keyboardEnabled: boolean;
    /** placeId as defined by the Nexa gateway. */
    readonly placeId: string;
    /** placeVersion as defined by the Nexa gateway. */
    readonly placeVersion: string;
    /** touchEnabled as defined by the Nexa gateway. */
    readonly touchEnabled: boolean;
}

/** PerformanceCohort from the Nexa wire protocol. */
export type PerformanceCohort = PerformanceCohortShape;

/** PerformanceGroup wire fields. */
export interface PerformanceGroupShape {
    /** cohort as defined by the Nexa gateway. */
    readonly cohort: PerformanceCohort;
    /** frames as defined by the Nexa gateway. */
    readonly frames: string;
    /** maximumFrameMs as defined by the Nexa gateway. */
    readonly maximumFrameMs: number;
    /** meanSessionFps as defined by the Nexa gateway. */
    readonly meanSessionFps: number;
    /** sampledDurationMs as defined by the Nexa gateway. */
    readonly sampledDurationMs: number;
    /** samples as defined by the Nexa gateway. */
    readonly samples: number;
    /** sessions as defined by the Nexa gateway. */
    readonly sessions: number;
    /** slowFrameFraction as defined by the Nexa gateway. */
    readonly slowFrameFraction: number;
    /** slowFrames as defined by the Nexa gateway. */
    readonly slowFrames: string;
    /** timeWeightedFps as defined by the Nexa gateway. */
    readonly timeWeightedFps: number;
}

/** PerformanceGroup from the Nexa wire protocol. */
export type PerformanceGroup = PerformanceGroupShape;

/** PerformanceQuery wire fields. */
export interface PerformanceQueryShape {
    /** fromMs as defined by the Nexa gateway. */
    readonly fromMs: string;
    /** toMs as defined by the Nexa gateway. */
    readonly toMs: string;
}

/** PerformanceQuery from the Nexa wire protocol. */
export type PerformanceQuery = PerformanceQueryShape;

/** PerformanceReport wire fields. */
export interface PerformanceReportShape {
    /** caveats as defined by the Nexa gateway. */
    readonly caveats: ReadonlyArray<string>;
    /** collection as defined by the Nexa gateway. */
    readonly collection?: TelemetryHealth;
    /** duplicateSamples as defined by the Nexa gateway. */
    readonly duplicateSamples: number;
    /** generatedAtMs as defined by the Nexa gateway. */
    readonly generatedAtMs: string;
    /** groups as defined by the Nexa gateway. */
    readonly groups: ReadonlyArray<PerformanceGroup>;
    /** ignoredSourceSamples as defined by the Nexa gateway. */
    readonly ignoredSourceSamples: number;
    /** invalidSamples as defined by the Nexa gateway. */
    readonly invalidSamples: number;
    /** latestSampleMs as defined by the Nexa gateway. */
    readonly latestSampleMs: null | string;
    /** query as defined by the Nexa gateway. */
    readonly query: PerformanceQuery;
}

/** PerformanceReport from the Nexa wire protocol. */
export type PerformanceReport = PerformanceReportShape;

/** PersonalAgent wire fields. */
export interface PersonalAgentShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** instructions as defined by the Nexa gateway. */
    readonly instructions: string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
}

/** PersonalAgent from the Nexa wire protocol. */
export type PersonalAgent = PersonalAgentShape;

/** PersonalAgentInput wire fields. */
export interface PersonalAgentInputShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** instructions as defined by the Nexa gateway. */
    readonly instructions: string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
}

/** PersonalAgentInput from the Nexa wire protocol. */
export type PersonalAgentInput = PersonalAgentInputShape;

/** PlanningAlignmentAnchor wire fields. */
export interface PlanningAlignmentAnchorShape {
    /** beforeHash as defined by the Nexa gateway. */
    readonly beforeHash: string;
    /** graphHash as defined by the Nexa gateway. */
    readonly graphHash: string;
    /** requirements as defined by the Nexa gateway. */
    readonly requirements: ReadonlyArray<PlanningRequirementFingerprint>;
    /** version as defined by the Nexa gateway. */
    readonly version: 1;
}

/** PlanningAlignmentAnchor from the Nexa wire protocol. */
export type PlanningAlignmentAnchor = PlanningAlignmentAnchorShape;

/** PlanningBrief wire fields. */
export interface PlanningBriefShape {
    /** assumptions as defined by the Nexa gateway. */
    readonly assumptions: ReadonlyArray<string>;
    /** boundaries as defined by the Nexa gateway. */
    readonly boundaries: ReadonlyArray<string>;
    /** budget as defined by the Nexa gateway. */
    readonly budget: null | string;
    /** goal as defined by the Nexa gateway. */
    readonly goal: string;
    /** outputs as defined by the Nexa gateway. */
    readonly outputs: ReadonlyArray<string>;
    /** questions as defined by the Nexa gateway. */
    readonly questions: ReadonlyArray<PlanningQuestion>;
    /** requirements as defined by the Nexa gateway. */
    readonly requirements: ReadonlyArray<PlanningRequirement>;
    /** schedule as defined by the Nexa gateway. */
    readonly schedule: null | string;
    /** sources as defined by the Nexa gateway. */
    readonly sources: ReadonlyArray<string>;
}

/** PlanningBrief from the Nexa wire protocol. */
export type PlanningBrief = PlanningBriefShape;

/** PlanningDocument wire fields. */
export interface PlanningDocumentShape {
    /** details as defined by the Nexa gateway. */
    readonly details: WorkflowDetails;
    /** edges as defined by the Nexa gateway. */
    readonly edges: ReadonlyArray<WorkflowEdge>;
    /** nodes as defined by the Nexa gateway. */
    readonly nodes: ReadonlyArray<WorkflowNode>;
    /** positions as defined by the Nexa gateway. */
    readonly positions: ReadonlyArray<WorkflowPosition>;
}

/** PlanningDocument from the Nexa wire protocol. */
export type PlanningDocument = PlanningDocumentShape;

/** PlanningHistory wire fields. */
export interface PlanningHistoryShape {
    /** nextRequestId as defined by the Nexa gateway. */
    readonly nextRequestId: null | string;
    /** turns as defined by the Nexa gateway. */
    readonly turns: ReadonlyArray<PlanningTurn>;
}

/** PlanningHistory from the Nexa wire protocol. */
export type PlanningHistory = PlanningHistoryShape;

/** PlanningHistoryRequest wire fields. */
export interface PlanningHistoryRequestShape {
    /** beforeRequestId as defined by the Nexa gateway. */
    readonly beforeRequestId: null | string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** PlanningHistoryRequest from the Nexa wire protocol. */
export type PlanningHistoryRequest = PlanningHistoryRequestShape;

/** PlanningQuestion wire fields. */
export interface PlanningQuestionShape {
    /** choices as defined by the Nexa gateway. */
    readonly choices: ReadonlyArray<string>;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** PlanningQuestion from the Nexa wire protocol. */
export type PlanningQuestion = PlanningQuestionShape;

/** PlanningReply wire fields. */
export interface PlanningReplyShape {
    /** alignment as defined by the Nexa gateway. */
    readonly alignment?: PlanningAlignmentAnchor;
    /** baseRevision as defined by the Nexa gateway. */
    readonly baseRevision: string;
    /** brief as defined by the Nexa gateway. */
    readonly brief: PlanningBrief;
    /** draftHash as defined by the Nexa gateway. */
    readonly draftHash: string;
    /** message as defined by the Nexa gateway. */
    readonly message: string;
    /** patch as defined by the Nexa gateway. */
    readonly patch: WorkflowPatch | null;
    /** validation as defined by the Nexa gateway. */
    readonly validation: GraphValidation;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** PlanningReply from the Nexa wire protocol. */
export type PlanningReply = PlanningReplyShape;

/** PlanningRequest wire fields. */
export interface PlanningRequestShape {
    /** baseRevision as defined by the Nexa gateway. */
    readonly baseRevision: string;
    /** document as defined by the Nexa gateway. */
    readonly document: PlanningDocument;
    /** message as defined by the Nexa gateway. */
    readonly message: string;
    /** previousRequestId as defined by the Nexa gateway. */
    readonly previousRequestId: null | string;
    /** requestId as defined by the Nexa gateway. */
    readonly requestId: string;
    /** sourceIds as defined by the Nexa gateway. */
    readonly sourceIds?: ReadonlyArray<string>;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** PlanningRequest from the Nexa wire protocol. */
export type PlanningRequest = PlanningRequestShape;

/** PlanningRequirement wire fields. */
export interface PlanningRequirementShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** nodeIds as defined by the Nexa gateway. */
    readonly nodeIds: ReadonlyArray<string>;
    /** state as defined by the Nexa gateway. */
    readonly state: RequirementState;
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** PlanningRequirement from the Nexa wire protocol. */
export type PlanningRequirement = PlanningRequirementShape;

/** PlanningRequirementFingerprint wire fields. */
export interface PlanningRequirementFingerprintShape {
    /** hash as defined by the Nexa gateway. */
    readonly hash: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** PlanningRequirementFingerprint from the Nexa wire protocol. */
export type PlanningRequirementFingerprint = PlanningRequirementFingerprintShape;

/** PlanningSource wire fields. */
export interface PlanningSourceShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** reason as defined by the Nexa gateway. */
    readonly reason: string;
    /** state as defined by the Nexa gateway. */
    readonly state: PlanningSourceState;
}

/** PlanningSource from the Nexa wire protocol. */
export type PlanningSource = PlanningSourceShape;

/** Allowed values for PlanningSourceState. */
export const PlanningSourceStateValues = {
    Value0: 'needs-adapter',
    Value1: 'unavailable',
} as const;

/** PlanningSourceState from the Nexa wire protocol. */
export type PlanningSourceState =
    (typeof PlanningSourceStateValues)[keyof typeof PlanningSourceStateValues];

/** PlanningSourcesPage wire fields. */
export interface PlanningSourcesPageShape {
    /** available as defined by the Nexa gateway. */
    readonly available: boolean;
    /** items as defined by the Nexa gateway. */
    readonly items: ReadonlyArray<PlanningSource>;
    /** next as defined by the Nexa gateway. */
    readonly next: null | string;
}

/** PlanningSourcesPage from the Nexa wire protocol. */
export type PlanningSourcesPage = PlanningSourcesPageShape;

/** PlanningSourcesRequest wire fields. */
export interface PlanningSourcesRequestShape {
    /** after as defined by the Nexa gateway. */
    readonly after: null | string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** PlanningSourcesRequest from the Nexa wire protocol. */
export type PlanningSourcesRequest = PlanningSourcesRequestShape;

/** Allowed values for PlanningStatus. */
export const PlanningStatusValues = {
    Value0: 'canceled',
    Value1: 'complete',
    Value2: 'failed',
    Value3: 'working',
} as const;

/** PlanningStatus from the Nexa wire protocol. */
export type PlanningStatus = (typeof PlanningStatusValues)[keyof typeof PlanningStatusValues];

/** PlanningTurn wire fields. */
export interface PlanningTurnShape {
    /** createdAtMs as defined by the Nexa gateway. */
    readonly createdAtMs: string;
    /** error as defined by the Nexa gateway. */
    readonly error: null | string;
    /** message as defined by the Nexa gateway. */
    readonly message: string;
    /** previousRequestId as defined by the Nexa gateway. */
    readonly previousRequestId: null | string;
    /** reply as defined by the Nexa gateway. */
    readonly reply: PlanningReply | null;
    /** requestId as defined by the Nexa gateway. */
    readonly requestId: string;
    /** sourceIds as defined by the Nexa gateway. */
    readonly sourceIds?: ReadonlyArray<string>;
    /** status as defined by the Nexa gateway. */
    readonly status: PlanningStatus;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** PlanningTurn from the Nexa wire protocol. */
export type PlanningTurn = PlanningTurnShape;

/** PlanningTurnRef wire fields. */
export interface PlanningTurnRefShape {
    /** requestId as defined by the Nexa gateway. */
    readonly requestId: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** PlanningTurnRef from the Nexa wire protocol. */
export type PlanningTurnRef = PlanningTurnRefShape;

/** Allowed values for PortCardinality. */
export const PortCardinalityValues = { Value0: 'item', Value1: 'list', Value2: 'stream' } as const;

/** PortCardinality from the Nexa wire protocol. */
export type PortCardinality = (typeof PortCardinalityValues)[keyof typeof PortCardinalityValues];

/** Allowed values for PortDirection. */
export const PortDirectionValues = { Value0: 'input', Value1: 'output' } as const;

/** PortDirection from the Nexa wire protocol. */
export type PortDirection = (typeof PortDirectionValues)[keyof typeof PortDirectionValues];

/** ProcessInput wire fields. */
export interface ProcessInputShape {
    /** data as defined by the Nexa gateway. */
    readonly data: string;
    /** processId as defined by the Nexa gateway. */
    readonly processId: string;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
}

/** ProcessInput from the Nexa wire protocol. */
export type ProcessInput = ProcessInputShape;

/** ProcessLogRef wire fields. */
export interface ProcessLogRefShape {
    /** offset as defined by the Nexa gateway. */
    readonly offset?: string;
    /** processId as defined by the Nexa gateway. */
    readonly processId: string;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
}

/** ProcessLogRef from the Nexa wire protocol. */
export type ProcessLogRef = ProcessLogRefShape;

/** ProcessResize wire fields. */
export interface ProcessResizeShape {
    /** cols as defined by the Nexa gateway. */
    readonly cols: number;
    /** processId as defined by the Nexa gateway. */
    readonly processId: string;
    /** rows as defined by the Nexa gateway. */
    readonly rows: number;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
}

/** ProcessResize from the Nexa wire protocol. */
export type ProcessResize = ProcessResizeShape;

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
export interface RecordstringScope {
    readonly [key: string]: Scope;
}

/** Recordstringnever from the Nexa wire protocol. */
export type Recordstringnever = Record<string, never>;

/** Recordstringnumber from the Nexa wire protocol. */
export interface Recordstringnumber {
    readonly [key: string]: number;
}

/** Recordstringstring from the Nexa wire protocol. */
export interface Recordstringstring {
    readonly [key: string]: string;
}

/** Recordstringstringnumberboolean from the Nexa wire protocol. */
export interface Recordstringstringnumberboolean {
    readonly [key: string]: string | number | boolean;
}

/** Recordstringunknown from the Nexa wire protocol. */
export interface Recordstringunknown {
    readonly [key: string]: JsonValue;
}

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

/** Allowed values for RequirementState. */
export const RequirementStateValues = {
    Value0: 'drafted',
    Value1: 'missing',
    Value2: 'question',
} as const;

/** RequirementState from the Nexa wire protocol. */
export type RequirementState = (typeof RequirementStateValues)[keyof typeof RequirementStateValues];

/** ResetAllowanceParams wire fields. */
export interface ResetAllowanceParamsShape {
    /** cycle as defined by the Nexa gateway. */
    readonly cycle: string;
    /** requestId as defined by the Nexa gateway. */
    readonly requestId: string;
    /** week as defined by the Nexa gateway. */
    readonly week: string;
}

/** ResetAllowanceParams from the Nexa wire protocol. */
export type ResetAllowanceParams = ResetAllowanceParamsShape;

/** ResetAllowanceResult wire fields. */
export interface ResetAllowanceResultShape {
    /** receipt as defined by the Nexa gateway. */
    readonly receipt: ResetHistoryEntry;
    /** requestId as defined by the Nexa gateway. */
    readonly requestId: string;
    /** userId as defined by the Nexa gateway. */
    readonly userId: string;
}

/** ResetAllowanceResult from the Nexa wire protocol. */
export type ResetAllowanceResult = ResetAllowanceResultShape;

/** ResetHistoryEntry wire fields. */
export interface ResetHistoryEntryShape {
    /** allowance as defined by the Nexa gateway. */
    readonly allowance: string;
    /** previousHeld as defined by the Nexa gateway. */
    readonly previousHeld: string;
    /** previousUsed as defined by the Nexa gateway. */
    readonly previousUsed: string;
    /** recordedAt as defined by the Nexa gateway. */
    readonly recordedAt: number;
    /** sequence as defined by the Nexa gateway. */
    readonly sequence: string;
    /** week as defined by the Nexa gateway. */
    readonly week: string;
}

/** ResetHistoryEntry from the Nexa wire protocol. */
export type ResetHistoryEntry = ResetHistoryEntryShape;

/** ResetHistoryPage wire fields. */
export interface ResetHistoryPageShape {
    /** entries as defined by the Nexa gateway. */
    readonly entries: ReadonlyArray<ResetHistoryEntry>;
    /** next as defined by the Nexa gateway. */
    readonly next: null | string;
    /** userId as defined by the Nexa gateway. */
    readonly userId: string;
}

/** ResetHistoryPage from the Nexa wire protocol. */
export type ResetHistoryPage = ResetHistoryPageShape;

/** Allowed values for ResetReason. */
export const ResetReasonValues = {
    Value0: 'cron-stale',
    Value1: 'daily',
    Value2: 'idle',
    Value3: 'new',
    Value4: 'reset',
} as const;

/** ResetReason from the Nexa wire protocol. */
export type ResetReason = (typeof ResetReasonValues)[keyof typeof ResetReasonValues];

/** ResetSnapshot wire fields. */
export interface ResetSnapshotShape {
    /** asOf as defined by the Nexa gateway. */
    readonly asOf: number;
    /** available as defined by the Nexa gateway. */
    readonly available: string;
    /** cycle as defined by the Nexa gateway. */
    readonly cycle: string;
    /** userId as defined by the Nexa gateway. */
    readonly userId: string;
    /** week as defined by the Nexa gateway. */
    readonly week: string;
}

/** ResetSnapshot from the Nexa wire protocol. */
export type ResetSnapshot = ResetSnapshotShape;

/** ResourceBinding wire fields. */
export interface ResourceBindingShape {
    /** alias as defined by the Nexa gateway. */
    readonly alias: string;
    /** consumerId as defined by the Nexa gateway. */
    readonly consumerId: string;
    /** family as defined by the Nexa gateway. */
    readonly family: ResourceFamily;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** limits as defined by the Nexa gateway. */
    readonly limits: ResourceLimits;
    /** maxAgeMs as defined by the Nexa gateway. */
    readonly maxAgeMs: null | string;
    /** operations as defined by the Nexa gateway. */
    readonly operations: ReadonlyArray<string>;
    /** selection as defined by the Nexa gateway. */
    readonly selection: ResourceSelection | null;
    /** use as defined by the Nexa gateway. */
    readonly use: ResourceUse;
    /** version as defined by the Nexa gateway. */
    readonly version: 1;
}

/** ResourceBinding from the Nexa wire protocol. */
export type ResourceBinding = ResourceBindingShape;

/** Allowed values for ResourceFamily. */
export const ResourceFamilyValues = {
    Value0: 'application',
    Value1: 'compute',
    Value2: 'computer',
    Value3: 'database',
    Value4: 'feed',
    Value5: 'files',
    Value6: 'workspace',
} as const;

/** ResourceFamily from the Nexa wire protocol. */
export type ResourceFamily = (typeof ResourceFamilyValues)[keyof typeof ResourceFamilyValues];

/** ResourceLimits wire fields. */
export interface ResourceLimitsShape {
    /** maxBytes as defined by the Nexa gateway. */
    readonly maxBytes: string;
    /** maxItems as defined by the Nexa gateway. */
    readonly maxItems: number;
}

/** ResourceLimits from the Nexa wire protocol. */
export type ResourceLimits = ResourceLimitsShape;

/** ResourceSchema wire fields. */
export interface ResourceSchemaShape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'resource';
    /** nullable as defined by the Nexa gateway. */
    readonly nullable: boolean;
    /** role as defined by the Nexa gateway. */
    readonly role: string;
}

/** ResourceSchema from the Nexa wire protocol. */
export type ResourceSchema = ResourceSchemaShape;

/** ResourceSelection wire fields. */
export interface ResourceSelectionShape {
    /** connectionId as defined by the Nexa gateway. */
    readonly connectionId: string;
    /** connectorId as defined by the Nexa gateway. */
    readonly connectorId: string;
    /** connectorVersion as defined by the Nexa gateway. */
    readonly connectorVersion: string;
    /** resourceId as defined by the Nexa gateway. */
    readonly resourceId: string;
    /** targetId as defined by the Nexa gateway. */
    readonly targetId: string;
}

/** ResourceSelection from the Nexa wire protocol. */
export type ResourceSelection = ResourceSelectionShape;

/** Allowed values for ResourceUse. */
export const ResourceUseValues = { Value0: 'attach', Value1: 'compute', Value2: 'read' } as const;

/** ResourceUse from the Nexa wire protocol. */
export type ResourceUse = (typeof ResourceUseValues)[keyof typeof ResourceUseValues];

/** Allowed values for RiskLevel. */
export const RiskLevelValues = {
    Value0: 'destructive',
    Value1: 'execute',
    Value2: 'read',
    Value3: 'write',
} as const;

/** RiskLevel from the Nexa wire protocol. */
export type RiskLevel = (typeof RiskLevelValues)[keyof typeof RiskLevelValues];

/** RobloxCredentialSetParams wire fields. */
export interface RobloxCredentialSetParamsShape {
    /** apiKey as defined by the Nexa gateway. */
    readonly apiKey: string;
}

/** RobloxCredentialSetParams from the Nexa wire protocol. */
export type RobloxCredentialSetParams = RobloxCredentialSetParamsShape;

/** RobloxCredentialStatus wire fields. */
export interface RobloxCredentialStatusShape {
    /** connected as defined by the Nexa gateway. */
    readonly connected: boolean;
    /** validated as defined by the Nexa gateway. */
    readonly validated: false;
}

/** RobloxCredentialStatus from the Nexa wire protocol. */
export type RobloxCredentialStatus = RobloxCredentialStatusShape;

/** ScalarSchema wire fields. */
export interface ScalarSchemaShape {
    /** choices as defined by the Nexa gateway. */
    readonly choices?: ReadonlyArray<string>;
    /** kind as defined by the Nexa gateway. */
    readonly kind: Exclude;
    /** maxLength as defined by the Nexa gateway. */
    readonly maxLength?: number;
    /** maximum as defined by the Nexa gateway. */
    readonly maximum?: number;
    /** minLength as defined by the Nexa gateway. */
    readonly minLength?: number;
    /** minimum as defined by the Nexa gateway. */
    readonly minimum?: number;
    /** nullable as defined by the Nexa gateway. */
    readonly nullable: boolean;
    /** whole as defined by the Nexa gateway. */
    readonly whole?: boolean;
}

/** ScalarSchema from the Nexa wire protocol. */
export type ScalarSchema = ScalarSchemaShape;

/** SchemaField wire fields. */
export interface SchemaFieldShape {
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** required as defined by the Nexa gateway. */
    readonly required: boolean;
    /** schema as defined by the Nexa gateway. */
    readonly schema: ValueSchema;
}

/** SchemaField from the Nexa wire protocol. */
export type SchemaField = SchemaFieldShape;

/** Allowed values for Scope. */
export const ScopeValues = { Value0: 'admin', Value1: 'read', Value2: 'write' } as const;

/** Scope from the Nexa wire protocol. */
export type Scope = (typeof ScopeValues)[keyof typeof ScopeValues];

/** SegmentationFrame wire fields. */
export interface SegmentationFrameShape {
    /** payload as defined by the Nexa gateway. */
    readonly payload: ReadonlyArray<number>;
    /** type as defined by the Nexa gateway. */
    readonly type: number;
}

/** SegmentationFrame from the Nexa wire protocol. */
export type SegmentationFrame = SegmentationFrameShape;

/** SessionEntryVariant0Part1 wire fields. */
export interface SessionEntryVariant0Part1Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'message';
    /** message as defined by the Nexa gateway. */
    readonly message: AgentMessage;
}

/** SessionEntryVariant1Part1 wire fields. */
export interface SessionEntryVariant1Part1Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'legacy-message';
    /** message as defined by the Nexa gateway. */
    readonly message: ModelMessage;
}

/** SessionEntryVariant2Part1 wire fields. */
export interface SessionEntryVariant2Part1Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'model-change';
    /** modelId as defined by the Nexa gateway. */
    readonly modelId: string;
    /** provider as defined by the Nexa gateway. */
    readonly provider: string;
}

/** SessionEntryVariant3Part1 wire fields. */
export interface SessionEntryVariant3Part1Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'thinking-level-change';
    /** thinkingLevel as defined by the Nexa gateway. */
    readonly thinkingLevel: string;
}

/** SessionEntryVariant4Part1 wire fields. */
export interface SessionEntryVariant4Part1Shape {
    /** firstKeptEntryId as defined by the Nexa gateway. */
    readonly firstKeptEntryId: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'compaction';
    /** summary as defined by the Nexa gateway. */
    readonly summary: string;
    /** tokensAfter as defined by the Nexa gateway. */
    readonly tokensAfter?: number;
    /** tokensBefore as defined by the Nexa gateway. */
    readonly tokensBefore: number;
}

/** SessionEntryVariant5Part1 wire fields. */
export interface SessionEntryVariant5Part1Shape {
    /** firstKeptEntryId as defined by the Nexa gateway. */
    readonly firstKeptEntryId?: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'reset';
    /** reason as defined by the Nexa gateway. */
    readonly reason: ResetReason;
}

/** SessionEntryVariant6Part1 wire fields. */
export interface SessionEntryVariant6Part1Shape {
    /** customType as defined by the Nexa gateway. */
    readonly customType: string;
    /** data as defined by the Nexa gateway. */
    readonly data?:
        | ReadonlyArray<JsonValue>
        | Readonly<Record<string, JsonValue>>
        | null
        | string
        | number
        | boolean;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'custom';
}

/** SessionEntryVariant7Part1 wire fields. */
export interface SessionEntryVariant7Part1Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'label';
    /** label as defined by the Nexa gateway. */
    readonly label: null | string;
    /** targetId as defined by the Nexa gateway. */
    readonly targetId: string;
}

/** SessionEntryVariant8Part1 wire fields. */
export interface SessionEntryVariant8Part1Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'session-info';
    /** name as defined by the Nexa gateway. */
    readonly name: null | string;
}

/** SessionEntryVariant9Part1 wire fields. */
export interface SessionEntryVariant9Part1Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'leaf';
    /** targetId as defined by the Nexa gateway. */
    readonly targetId: null | string;
}

/** SessionEntry from the Nexa wire protocol. */
export type SessionEntry =
    | (SessionEntryBase & SessionEntryVariant0Part1Shape)
    | (SessionEntryBase & SessionEntryVariant1Part1Shape)
    | (SessionEntryBase & SessionEntryVariant2Part1Shape)
    | (SessionEntryBase & SessionEntryVariant3Part1Shape)
    | (SessionEntryBase & SessionEntryVariant4Part1Shape)
    | (SessionEntryBase & SessionEntryVariant5Part1Shape)
    | (SessionEntryBase & SessionEntryVariant6Part1Shape)
    | (SessionEntryBase & SessionEntryVariant7Part1Shape)
    | (SessionEntryBase & SessionEntryVariant8Part1Shape)
    | (SessionEntryBase & SessionEntryVariant9Part1Shape);

/** SessionFileParams wire fields. */
export interface SessionFileParamsShape {
    /** attachmentId as defined by the Nexa gateway. */
    readonly attachmentId: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** SessionFileParams from the Nexa wire protocol. */
export type SessionFileParams = SessionFileParamsShape;

/** SessionHistoryData wire fields. */
export interface SessionHistoryDataShape {
    /** cursor as defined by the Nexa gateway. */
    readonly cursor: string;
    /** endCursor as defined by the Nexa gateway. */
    readonly endCursor: string;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
}

/** SessionHistoryData from the Nexa wire protocol. */
export type SessionHistoryData = SessionHistoryDataShape;

/** SessionHistoryPage wire fields. */
export interface SessionHistoryPageShape {
    /** chunk as defined by the Nexa gateway. */
    readonly chunk: string;
    /** endCursor as defined by the Nexa gateway. */
    readonly endCursor: string;
    /** format as defined by the Nexa gateway. */
    readonly format: 1;
    /** nextCursor as defined by the Nexa gateway. */
    readonly nextCursor?: string;
}

/** SessionHistoryPage from the Nexa wire protocol. */
export type SessionHistoryPage = SessionHistoryPageShape;

/** SessionHistoryParams wire fields. */
export interface SessionHistoryParamsShape {
    /** cursor as defined by the Nexa gateway. */
    readonly cursor?: string;
    /** endCursor as defined by the Nexa gateway. */
    readonly endCursor?: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** SessionHistoryParams from the Nexa wire protocol. */
export type SessionHistoryParams = SessionHistoryParamsShape;

/** SessionHistoryRecord from the Nexa wire protocol. */
export type SessionHistoryRecord =
    | HistoryInput
    | HistoryEvent
    | HistorySites
    | HistoryEnd
    | HistoryApprovalRequested
    | HistoryApprovalResolved
    | HistoryLegacy;

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

/** SitePreview wire fields. */
export interface SitePreviewShape {
    /** favicon as defined by the Nexa gateway. */
    readonly favicon: string;
    /** origin as defined by the Nexa gateway. */
    readonly origin: string;
}

/** SitePreview from the Nexa wire protocol. */
export type SitePreview = SitePreviewShape;

/** SteerParams wire fields. */
export interface SteerParamsShape {
    /** message as defined by the Nexa gateway. */
    readonly message: string;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
}

/** SteerParams from the Nexa wire protocol. */
export type SteerParams = SteerParamsShape;

/** Allowed values for StopReason. */
export const StopReasonValues = {
    Value0: 'aborted',
    Value1: 'error',
    Value2: 'length',
    Value3: 'stop',
    Value4: 'tool-use',
} as const;

/** StopReason from the Nexa wire protocol. */
export type StopReason = (typeof StopReasonValues)[keyof typeof StopReasonValues];

/** StreamAccepted wire fields. */
export interface StreamAcceptedShape {
    /** inputId as defined by the Nexa gateway. */
    readonly inputId?: string;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
    /** sessionKey as defined by the Nexa gateway. */
    readonly sessionKey?: string;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId: string;
}

/** StreamAccepted from the Nexa wire protocol. */
export type StreamAccepted = StreamAcceptedShape;

/** Allowed values for StreamParamsreasoningEffort. */
export const StreamParamsreasoningEffortValues = {
    Value0: 'high',
    Value1: 'low',
    Value2: 'max',
    Value3: 'medium',
    Value4: 'minimal',
    Value5: 'off',
    Value6: 'xhigh',
} as const;

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
    /** reasoningEffort as defined by the Nexa gateway. */
    readonly reasoningEffort?: (typeof StreamParamsreasoningEffortValues)[keyof typeof StreamParamsreasoningEffortValues];
    /** streamId as defined by the Nexa gateway. */
    readonly streamId?: string;
    /** targetTimeSeconds as defined by the Nexa gateway. */
    readonly targetTimeSeconds?: number;
    /** userId as defined by the Nexa gateway. */
    readonly userId?: string;
}

/** StreamParams from the Nexa wire protocol. */
export type StreamParams = StreamParamsShape;

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

/** TelemetryFunnelParams wire fields. */
export interface TelemetryFunnelParamsShape {
    /** appliedConfigKey as defined by the Nexa gateway. */
    readonly appliedConfigKey?: string;
    /** completionWindowMs as defined by the Nexa gateway. */
    readonly completionWindowMs: string;
    /** configLookbackMs as defined by the Nexa gateway. */
    readonly configLookbackMs?: string;
    /** fromMs as defined by the Nexa gateway. */
    readonly fromMs: string;
    /** performanceFpsThreshold as defined by the Nexa gateway. */
    readonly performanceFpsThreshold?: number;
    /** performanceLookbackMs as defined by the Nexa gateway. */
    readonly performanceLookbackMs?: string;
    /** projectId as defined by the Nexa gateway. */
    readonly projectId: string;
    /** steps as defined by the Nexa gateway. */
    readonly steps: ReadonlyArray<string>;
    /** toMs as defined by the Nexa gateway. */
    readonly toMs: string;
}

/** TelemetryFunnelParams from the Nexa wire protocol. */
export type TelemetryFunnelParams = TelemetryFunnelParamsShape;

/** TelemetryHealth wire fields. */
export interface TelemetryHealthShape {
    /** caveats as defined by the Nexa gateway. */
    readonly caveats: ReadonlyArray<string>;
    /** ingestionEnabled as defined by the Nexa gateway. */
    readonly ingestionEnabled: boolean;
    /** lastCapacityRejectionMs as defined by the Nexa gateway. */
    readonly lastCapacityRejectionMs: null | string;
    /** lastSuccessfulBatchMs as defined by the Nexa gateway. */
    readonly lastSuccessfulBatchMs: null | string;
    /** latestEventMs as defined by the Nexa gateway. */
    readonly latestEventMs: null | string;
    /** maxEvents as defined by the Nexa gateway. */
    readonly maxEvents: number;
    /** maxPayloadBytes as defined by the Nexa gateway. */
    readonly maxPayloadBytes: string;
    /** projectId as defined by the Nexa gateway. */
    readonly projectId: string;
    /** retainedFromMs as defined by the Nexa gateway. */
    readonly retainedFromMs: string;
    /** retentionDays as defined by the Nexa gateway. */
    readonly retentionDays: number;
    /** storedEvents as defined by the Nexa gateway. */
    readonly storedEvents: number;
    /** storedPayloadBytes as defined by the Nexa gateway. */
    readonly storedPayloadBytes: string;
}

/** TelemetryHealth from the Nexa wire protocol. */
export type TelemetryHealth = TelemetryHealthShape;

/** TelemetryMonitorAction wire fields. */
export interface TelemetryMonitorActionShape {
    /** destination as defined by the Nexa gateway. */
    readonly destination?: TelemetryNotificationDestination;
    /** investigate as defined by the Nexa gateway. */
    readonly investigate?: boolean;
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'roblox-monitor';
    /** rule as defined by the Nexa gateway. */
    readonly rule: TelemetryMonitorRule;
}

/** TelemetryMonitorAction from the Nexa wire protocol. */
export type TelemetryMonitorAction = TelemetryMonitorActionShape;

/** TelemetryMonitorRule wire fields. */
export interface TelemetryMonitorRuleShape {
    /** appliedConfigKey as defined by the Nexa gateway. */
    readonly appliedConfigKey?: string;
    /** completionWindowMs as defined by the Nexa gateway. */
    readonly completionWindowMs: number;
    /** configLookbackMs as defined by the Nexa gateway. */
    readonly configLookbackMs?: string;
    /** conversionBelow as defined by the Nexa gateway. */
    readonly conversionBelow: number;
    /** cooldownMs as defined by the Nexa gateway. */
    readonly cooldownMs: number;
    /** lookbackMs as defined by the Nexa gateway. */
    readonly lookbackMs: number;
    /** minimumAttempts as defined by the Nexa gateway. */
    readonly minimumAttempts: number;
    /** minimumSessions as defined by the Nexa gateway. */
    readonly minimumSessions: number;
    /** performanceFpsThreshold as defined by the Nexa gateway. */
    readonly performanceFpsThreshold?: number;
    /** performanceLookbackMs as defined by the Nexa gateway. */
    readonly performanceLookbackMs?: string;
    /** projectId as defined by the Nexa gateway. */
    readonly projectId: string;
    /** settleDelayMs as defined by the Nexa gateway. */
    readonly settleDelayMs: number;
    /** steps as defined by the Nexa gateway. */
    readonly steps: ReadonlyArray<string>;
}

/** TelemetryMonitorRule from the Nexa wire protocol. */
export type TelemetryMonitorRule = TelemetryMonitorRuleShape;

/** TelemetryNotificationDestination wire fields. */
export interface TelemetryNotificationDestinationShape {
    /** channelId as defined by the Nexa gateway. */
    readonly channelId: string;
    /** conversationId as defined by the Nexa gateway. */
    readonly conversationId: string;
    /** threadId as defined by the Nexa gateway. */
    readonly threadId?: string;
}

/** TelemetryNotificationDestination from the Nexa wire protocol. */
export type TelemetryNotificationDestination = TelemetryNotificationDestinationShape;

/** TelemetryPerformanceParams wire fields. */
export interface TelemetryPerformanceParamsShape {
    /** fromMs as defined by the Nexa gateway. */
    readonly fromMs: string;
    /** projectId as defined by the Nexa gateway. */
    readonly projectId: string;
    /** toMs as defined by the Nexa gateway. */
    readonly toMs: string;
}

/** TelemetryPerformanceParams from the Nexa wire protocol. */
export type TelemetryPerformanceParams = TelemetryPerformanceParamsShape;

/** TelemetryProject wire fields. */
export interface TelemetryProjectShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** universeId as defined by the Nexa gateway. */
    readonly universeId: string;
    /** userId as defined by the Nexa gateway. */
    readonly userId: string;
}

/** TelemetryProject from the Nexa wire protocol. */
export type TelemetryProject = TelemetryProjectShape;

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

/** ToolProgress wire fields. */
export interface ToolProgressShape {
    /** attachment as defined by the Nexa gateway. */
    readonly attachment?: ToolProgressAttachment;
    /** fraction as defined by the Nexa gateway. */
    readonly fraction?: number;
    /** status as defined by the Nexa gateway. */
    readonly status?: string;
    /** terminal as defined by the Nexa gateway. */
    readonly terminal?: ToolTerminal;
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
    /** commandExecution as defined by the Nexa gateway. */
    readonly commandExecution?: CommandExecutionReceipt;
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
    /** deliveryReceipts as defined by the Nexa gateway. */
    readonly deliveryReceipts?: ReadonlyArray<DeliveryReceipt>;
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
    /** processMissing as defined by the Nexa gateway. */
    readonly processMissing?: boolean;
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
    /** verifiedCodePaths as defined by the Nexa gateway. */
    readonly verifiedCodePaths?: ReadonlyArray<string>;
}

/** ToolResult from the Nexa wire protocol. */
export type ToolResult = ToolResultShape;

/** ToolResultContentBlockVariant0 wire fields. */
export interface ToolResultContentBlockVariant0Shape {
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'text';
}

/** ToolResultContentBlockVariant1 wire fields. */
export interface ToolResultContentBlockVariant1Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'image';
}

/** ToolResultContentBlockVariant2 wire fields. */
export interface ToolResultContentBlockVariant2Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'video';
}

/** ToolResultContentBlockVariant3 wire fields. */
export interface ToolResultContentBlockVariant3Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'video-frame';
}

/** ToolResultContentBlock from the Nexa wire protocol. */
export type ToolResultContentBlock =
    | ToolResultContentBlockVariant0Shape
    | ToolResultContentBlockVariant1Shape
    | ToolResultContentBlockVariant2Shape
    | ToolResultContentBlockVariant3Shape;

/** Allowed values for ToolResultMessageresultSource. */
export const ToolResultMessageresultSourceValues = {
    Value0: 'network',
    Value1: 'trusted',
} as const;

/** ToolResultMessage wire fields. */
export interface ToolResultMessageShape {
    /** content as defined by the Nexa gateway. */
    readonly content: ReadonlyArray<ToolResultContentBlock>;
    /** details as defined by the Nexa gateway. */
    readonly details?:
        | ReadonlyArray<JsonValue>
        | Readonly<Record<string, JsonValue>>
        | null
        | string
        | number
        | boolean;
    /** excludeFromContext as defined by the Nexa gateway. */
    readonly excludeFromContext?: boolean;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** isError as defined by the Nexa gateway. */
    readonly isError: boolean;
    /** resultSource as defined by the Nexa gateway. */
    readonly resultSource?: (typeof ToolResultMessageresultSourceValues)[keyof typeof ToolResultMessageresultSourceValues];
    /** role as defined by the Nexa gateway. */
    readonly role: 'tool-result';
    /** timestamp as defined by the Nexa gateway. */
    readonly timestamp: number;
    /** toolName as defined by the Nexa gateway. */
    readonly toolName: string;
    /** toolUseId as defined by the Nexa gateway. */
    readonly toolUseId: string;
}

/** ToolResultMessage from the Nexa wire protocol. */
export type ToolResultMessage = ToolResultMessageShape;

/** ToolSitesData wire fields. */
export interface ToolSitesDataShape {
    /** callId as defined by the Nexa gateway. */
    readonly callId: string;
    /** historyAt as defined by the Nexa gateway. */
    readonly historyAt?: number;
    /** historyId as defined by the Nexa gateway. */
    readonly historyId?: string;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId?: string;
    /** sites as defined by the Nexa gateway. */
    readonly sites: ReadonlyArray<SitePreview>;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId: string;
}

/** ToolSitesData from the Nexa wire protocol. */
export type ToolSitesData = ToolSitesDataShape;

/** Allowed values for ToolStatus. */
export const ToolStatusValues = {
    Value0: 'aborted',
    Value1: 'denied',
    Value2: 'error',
    Value3: 'ok',
} as const;

/** ToolStatus from the Nexa wire protocol. */
export type ToolStatus = (typeof ToolStatusValues)[keyof typeof ToolStatusValues];

/** ToolTerminal wire fields. */
export interface ToolTerminalShape {
    /** cols as defined by the Nexa gateway. */
    readonly cols: number;
    /** processId as defined by the Nexa gateway. */
    readonly processId: string;
    /** rows as defined by the Nexa gateway. */
    readonly rows: number;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId: string;
}

/** ToolTerminal from the Nexa wire protocol. */
export type ToolTerminal = ToolTerminalShape;

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
    /** historyAt as defined by the Nexa gateway. */
    readonly historyAt?: number;
    /** historyId as defined by the Nexa gateway. */
    readonly historyId?: string;
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
    /** historyAt as defined by the Nexa gateway. */
    readonly historyAt?: number;
    /** historyId as defined by the Nexa gateway. */
    readonly historyId?: string;
    /** sessionId as defined by the Nexa gateway. */
    readonly sessionId?: string;
    /** streamId as defined by the Nexa gateway. */
    readonly streamId: string;
}

/** TurnEventData from the Nexa wire protocol. */
export type TurnEventData = TurnEventDataShape;

/** UserContentBlockVariant0 wire fields. */
export interface UserContentBlockVariant0Shape {
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'text';
}

/** UserContentBlockVariant1 wire fields. */
export interface UserContentBlockVariant1Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'image';
}

/** UserContentBlockVariant2 wire fields. */
export interface UserContentBlockVariant2Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'video';
}

/** UserContentBlockVariant3 wire fields. */
export interface UserContentBlockVariant3Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'video-frame';
}

/** UserContentBlockVariant4 wire fields. */
export interface UserContentBlockVariant4Shape {
    /** source as defined by the Nexa gateway. */
    readonly source: BinarySource;
    /** title as defined by the Nexa gateway. */
    readonly title?: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'document';
}

/** UserContentBlock from the Nexa wire protocol. */
export type UserContentBlock =
    | UserContentBlockVariant0Shape
    | UserContentBlockVariant1Shape
    | UserContentBlockVariant2Shape
    | UserContentBlockVariant3Shape
    | UserContentBlockVariant4Shape;

/** Allowed values for UserMessagesource. */
export const UserMessagesourceValues = {
    Value0: 'channel',
    Value1: 'human',
    Value2: 'injected',
    Value3: 'resumed',
} as const;

/** UserMessage wire fields. */
export interface UserMessageShape {
    /** content as defined by the Nexa gateway. */
    readonly content: ReadonlyArray<UserContentBlock> | string;
    /** excludeFromContext as defined by the Nexa gateway. */
    readonly excludeFromContext?: boolean;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** role as defined by the Nexa gateway. */
    readonly role: 'user';
    /** runtimeContextCarrier as defined by the Nexa gateway. */
    readonly runtimeContextCarrier?: boolean;
    /** source as defined by the Nexa gateway. */
    readonly source?: (typeof UserMessagesourceValues)[keyof typeof UserMessagesourceValues];
    /** timestamp as defined by the Nexa gateway. */
    readonly timestamp: number;
}

/** UserMessage from the Nexa wire protocol. */
export type UserMessage = UserMessageShape;

/** ValueSchema from the Nexa wire protocol. */
export type ValueSchema = ScalarSchema | ObjectSchema | ListSchema | ResourceSchema;

/** VoiceAudioParams wire fields. */
export interface VoiceAudioParamsShape {
    /** callId as defined by the Nexa gateway. */
    readonly callId: string;
    /** pcm as defined by the Nexa gateway. */
    readonly pcm: string;
}

/** VoiceAudioParams from the Nexa wire protocol. */
export type VoiceAudioParams = VoiceAudioParamsShape;

/** VoiceCallEventVariant1 wire fields. */
export interface VoiceCallEventVariant1Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'heard';
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** VoiceCallEventVariant2 wire fields. */
export interface VoiceCallEventVariant2Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'said';
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** VoiceCallEventVariant3 wire fields. */
export interface VoiceCallEventVariant3Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'status';
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** VoiceCallEventVariant4 wire fields. */
export interface VoiceCallEventVariant4Shape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'error';
    /** message as defined by the Nexa gateway. */
    readonly message: string;
}

/** VoiceCallEvent from the Nexa wire protocol. */
export type VoiceCallEvent =
    | VoiceInterimEvent
    | VoiceCallEventVariant1Shape
    | VoiceCallEventVariant2Shape
    | VoiceCallEventVariant3Shape
    | VoiceCallEventVariant4Shape;

/** VoiceInterimEvent wire fields. */
export interface VoiceInterimEventShape {
    /** kind as defined by the Nexa gateway. */
    readonly kind: 'interim';
    /** text as defined by the Nexa gateway. */
    readonly text: string;
}

/** VoiceInterimEvent from the Nexa wire protocol. */
export type VoiceInterimEvent = VoiceInterimEventShape;

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

/** Allowed values for WalletHistoryEntrykind. */
export const WalletHistoryEntrykindValues = { Value0: 'purchase', Value1: 'usage' } as const;

/** WalletHistoryEntry wire fields. */
export interface WalletHistoryEntryShape {
    /** amount as defined by the Nexa gateway. */
    readonly amount: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: (typeof WalletHistoryEntrykindValues)[keyof typeof WalletHistoryEntrykindValues];
    /** paid as defined by the Nexa gateway. */
    readonly paid: string;
    /** plan as defined by the Nexa gateway. */
    readonly plan: string;
    /** recordedAt as defined by the Nexa gateway. */
    readonly recordedAt: number;
    /** sequence as defined by the Nexa gateway. */
    readonly sequence: string;
}

/** WalletHistoryEntry from the Nexa wire protocol. */
export type WalletHistoryEntry = WalletHistoryEntryShape;

/** WalletHistoryPage wire fields. */
export interface WalletHistoryPageShape {
    /** entries as defined by the Nexa gateway. */
    readonly entries: ReadonlyArray<WalletHistoryEntry>;
    /** next as defined by the Nexa gateway. */
    readonly next: null | string;
    /** userId as defined by the Nexa gateway. */
    readonly userId: string;
}

/** WalletHistoryPage from the Nexa wire protocol. */
export type WalletHistoryPage = WalletHistoryPageShape;

/** WalletSnapshot wire fields. */
export interface WalletSnapshotShape {
    /** asOf as defined by the Nexa gateway. */
    readonly asOf: number;
    /** credits as defined by the Nexa gateway. */
    readonly credits: string;
    /** creditsAvailable as defined by the Nexa gateway. */
    readonly creditsAvailable: string;
    /** creditsHeld as defined by the Nexa gateway. */
    readonly creditsHeld: string;
    /** resetsAt as defined by the Nexa gateway. */
    readonly resetsAt: number;
    /** userId as defined by the Nexa gateway. */
    readonly userId: string;
    /** weeklyAvailable as defined by the Nexa gateway. */
    readonly weeklyAvailable: string;
    /** weeklyHeld as defined by the Nexa gateway. */
    readonly weeklyHeld: string;
    /** weeklyLimit as defined by the Nexa gateway. */
    readonly weeklyLimit: string;
    /** weeklyUsed as defined by the Nexa gateway. */
    readonly weeklyUsed: string;
}

/** WalletSnapshot from the Nexa wire protocol. */
export type WalletSnapshot = WalletSnapshotShape;

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
    /** type as defined by the Nexa gateway. */
    readonly type: 'agents-status';
    /** workers as defined by the Nexa gateway. */
    readonly workers: ReadonlyArray<WorkerStatus>;
}

/** WireTurnEventVariant1 wire fields. */
export interface WireTurnEventVariant1Shape {
    /** attachment as defined by the Nexa gateway. */
    readonly attachment: DeliveredAttachment;
    /** type as defined by the Nexa gateway. */
    readonly type: 'attachment';
}

/** WireTurnEventVariant2 wire fields. */
export interface WireTurnEventVariant2Shape {
    /** turnId as defined by the Nexa gateway. */
    readonly turnId: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'turn-start';
}

/** WireTurnEventVariant3 wire fields. */
export interface WireTurnEventVariant3Shape {
    /** iteration as defined by the Nexa gateway. */
    readonly iteration: number;
    /** type as defined by the Nexa gateway. */
    readonly type: 'iteration-start';
}

/** WireTurnEventVariant4 wire fields. */
export interface WireTurnEventVariant4Shape {
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'text';
}

/** WireTurnEventVariant5 wire fields. */
export interface WireTurnEventVariant5Shape {
    /** text as defined by the Nexa gateway. */
    readonly text: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'reasoning';
}

/** WireTurnEventVariant6 wire fields. */
export interface WireTurnEventVariant6Shape {
    /** call as defined by the Nexa gateway. */
    readonly call: ToolCall;
    /** type as defined by the Nexa gateway. */
    readonly type: 'tool-start';
}

/** WireTurnEventVariant7 wire fields. */
export interface WireTurnEventVariant7Shape {
    /** call as defined by the Nexa gateway. */
    readonly call: ToolCall;
    /** type as defined by the Nexa gateway. */
    readonly type: 'tool-progress';
    /** update as defined by the Nexa gateway. */
    readonly update: ToolProgress;
}

/** WireTurnEventVariant8 wire fields. */
export interface WireTurnEventVariant8Shape {
    /** outcome as defined by the Nexa gateway. */
    readonly outcome: ToolOutcome;
    /** type as defined by the Nexa gateway. */
    readonly type: 'tool-finish';
}

/** WireTurnEventVariant9 wire fields. */
export interface WireTurnEventVariant9Shape {
    /** summary as defined by the Nexa gateway. */
    readonly summary: string;
    /** tool as defined by the Nexa gateway. */
    readonly tool: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'approval-required';
}

/** WireTurnEventVariant10 wire fields. */
export interface WireTurnEventVariant10Shape {
    /** droppedMessages as defined by the Nexa gateway. */
    readonly droppedMessages: number;
    /** summary as defined by the Nexa gateway. */
    readonly summary: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'compacted';
}

/** WireTurnEventVariant11 wire fields. */
export interface WireTurnEventVariant11Shape {
    /** type as defined by the Nexa gateway. */
    readonly type: 'usage';
    /** usage as defined by the Nexa gateway. */
    readonly usage: TokenUsage;
}

/** WireTurnEventVariant12 wire fields. */
export interface WireTurnEventVariant12Shape {
    /** data as defined by the Nexa gateway. */
    readonly data: JsonValue;
    /** source as defined by the Nexa gateway. */
    readonly source: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'native';
}

/** WireTurnEventVariant13 wire fields. */
export interface WireTurnEventVariant13Shape {
    /** detail as defined by the Nexa gateway. */
    readonly detail?: string;
    /** status as defined by the Nexa gateway. */
    readonly status: string;
    /** type as defined by the Nexa gateway. */
    readonly type: 'status';
}

/** WireTurnEventVariant14 wire fields. */
export interface WireTurnEventVariant14Shape {
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

/** WireTurnEventVariant15 wire fields. */
export interface WireTurnEventVariant15Shape {
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
    | WireTurnEventVariant14Shape
    | WireTurnEventVariant15Shape;

/** Allowed values for WorkerState. */
export const WorkerState = {
    Aborted: 'aborted',
    Done: 'done',
    Failed: 'failed',
    Queued: 'queued',
    Refused: 'refused',
    Stopping: 'stopping',
    Working: 'working',
} as const;

/** WorkerState from the Nexa wire protocol. */
export type WorkerState = (typeof WorkerState)[keyof typeof WorkerState];

/** WorkerStatus wire fields. */
export interface WorkerStatusShape {
    /** activity as defined by the Nexa gateway. */
    readonly activity: string;
    /** agentId as defined by the Nexa gateway. */
    readonly agentId: string;
    /** depth as defined by the Nexa gateway. */
    readonly depth: number;
    /** goal as defined by the Nexa gateway. */
    readonly goal: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** lastActivityAt as defined by the Nexa gateway. */
    readonly lastActivityAt: string;
    /** parentId as defined by the Nexa gateway. */
    readonly parentId: string;
    /** rootId as defined by the Nexa gateway. */
    readonly rootId: string;
    /** startedAt as defined by the Nexa gateway. */
    readonly startedAt: string;
    /** state as defined by the Nexa gateway. */
    readonly state: WorkerState;
}

/** WorkerStatus from the Nexa wire protocol. */
export type WorkerStatus = WorkerStatusShape;

/** WorkflowCatalog wire fields. */
export interface WorkflowCatalogShape {
    /** components as defined by the Nexa gateway. */
    readonly components: ReadonlyArray<ComponentDefinition>;
    /** format as defined by the Nexa gateway. */
    readonly format: 1;
}

/** WorkflowCatalog from the Nexa wire protocol. */
export type WorkflowCatalog = WorkflowCatalogShape;

/** WorkflowCatalogObservation wire fields. */
export interface WorkflowCatalogObservationShape {
    /** checkedAt as defined by the Nexa gateway. */
    readonly checkedAt: null | string;
    /** refreshAvailable as defined by the Nexa gateway. */
    readonly refreshAvailable: boolean;
    /** refreshFailed as defined by the Nexa gateway. */
    readonly refreshFailed: boolean;
}

/** WorkflowCatalogObservation from the Nexa wire protocol. */
export type WorkflowCatalogObservation = WorkflowCatalogObservationShape;

/** WorkflowCreateRequest wire fields. */
export interface WorkflowCreateRequestShape {
    /** commandId as defined by the Nexa gateway. */
    readonly commandId: string;
    /** details as defined by the Nexa gateway. */
    readonly details: WorkflowDetails;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowCreateRequest from the Nexa wire protocol. */
export type WorkflowCreateRequest = WorkflowCreateRequestShape;

/** WorkflowDetails wire fields. */
export interface WorkflowDetailsShape {
    /** description as defined by the Nexa gateway. */
    readonly description: string;
    /** folder as defined by the Nexa gateway. */
    readonly folder: null | string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** tags as defined by the Nexa gateway. */
    readonly tags: ReadonlyArray<string>;
}

/** WorkflowDetails from the Nexa wire protocol. */
export type WorkflowDetails = WorkflowDetailsShape;

/** WorkflowEdge wire fields. */
export interface WorkflowEdgeShape {
    /** from as defined by the Nexa gateway. */
    readonly from: WorkflowEndpoint;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: WorkflowEdgeKind;
    /** to as defined by the Nexa gateway. */
    readonly to: WorkflowEndpoint;
}

/** WorkflowEdge from the Nexa wire protocol. */
export type WorkflowEdge = WorkflowEdgeShape;

/** Allowed values for WorkflowEdgeKind. */
export const WorkflowEdgeKindValues = {
    Value0: 'data',
    Value1: 'flow',
    Value2: 'resource',
} as const;

/** WorkflowEdgeKind from the Nexa wire protocol. */
export type WorkflowEdgeKind = (typeof WorkflowEdgeKindValues)[keyof typeof WorkflowEdgeKindValues];

/** WorkflowEdgeReference wire fields. */
export interface WorkflowEdgeReferenceShape {
    /** content as defined by the Nexa gateway. */
    readonly content: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
}

/** WorkflowEdgeReference from the Nexa wire protocol. */
export type WorkflowEdgeReference = WorkflowEdgeReferenceShape;

/** WorkflowEndpoint wire fields. */
export interface WorkflowEndpointShape {
    /** node as defined by the Nexa gateway. */
    readonly node: string;
    /** port as defined by the Nexa gateway. */
    readonly port: string;
}

/** WorkflowEndpoint from the Nexa wire protocol. */
export type WorkflowEndpoint = WorkflowEndpointShape;

/** WorkflowListCursor wire fields. */
export interface WorkflowListCursorShape {
    /** updatedAtMs as defined by the Nexa gateway. */
    readonly updatedAtMs: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowListCursor from the Nexa wire protocol. */
export type WorkflowListCursor = WorkflowListCursorShape;

/** WorkflowListPage wire fields. */
export interface WorkflowListPageShape {
    /** items as defined by the Nexa gateway. */
    readonly items: ReadonlyArray<WorkflowSummary>;
    /** next as defined by the Nexa gateway. */
    readonly next: WorkflowListCursor | null;
}

/** WorkflowListPage from the Nexa wire protocol. */
export type WorkflowListPage = WorkflowListPageShape;

/** WorkflowListRequest wire fields. */
export interface WorkflowListRequestShape {
    /** cursor as defined by the Nexa gateway. */
    readonly cursor: WorkflowListCursor | null;
    /** limit as defined by the Nexa gateway. */
    readonly limit: number;
}

/** WorkflowListRequest from the Nexa wire protocol. */
export type WorkflowListRequest = WorkflowListRequestShape;

/** WorkflowManifestPage wire fields. */
export interface WorkflowManifestPageShape {
    /** details as defined by the Nexa gateway. */
    readonly details: WorkflowDetails;
    /** edges as defined by the Nexa gateway. */
    readonly edges: ReadonlyArray<WorkflowEdgeReference>;
    /** format as defined by the Nexa gateway. */
    readonly format: 1;
    /** nextEdgeOffset as defined by the Nexa gateway. */
    readonly nextEdgeOffset: null | number;
    /** nextNodeOffset as defined by the Nexa gateway. */
    readonly nextNodeOffset: null | number;
    /** nodes as defined by the Nexa gateway. */
    readonly nodes: ReadonlyArray<WorkflowNodeReference>;
    /** revision as defined by the Nexa gateway. */
    readonly revision: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowManifestPage from the Nexa wire protocol. */
export type WorkflowManifestPage = WorkflowManifestPageShape;

/** Allowed values for WorkflowModelCapability. */
export const WorkflowModelCapabilityValues = { Value0: 'reasoning', Value1: 'text' } as const;

/** WorkflowModelCapability from the Nexa wire protocol. */
export type WorkflowModelCapability =
    (typeof WorkflowModelCapabilityValues)[keyof typeof WorkflowModelCapabilityValues];

/** WorkflowModelChoice wire fields. */
export interface WorkflowModelChoiceShape {
    /** availableAtCheck as defined by the Nexa gateway. */
    readonly availableAtCheck?: null | boolean;
    /** compatible as defined by the Nexa gateway. */
    readonly compatible: boolean;
    /** contextWindow as defined by the Nexa gateway. */
    readonly contextWindow: null | number;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** input as defined by the Nexa gateway. */
    readonly input: ReadonlyArray<string>;
    /** maxOutputTokens as defined by the Nexa gateway. */
    readonly maxOutputTokens: null | number;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** price as defined by the Nexa gateway. */
    readonly price: WorkflowModelPrice | null;
    /** provider as defined by the Nexa gateway. */
    readonly provider: string;
    /** reason as defined by the Nexa gateway. */
    readonly reason: null | string;
    /** reasoning as defined by the Nexa gateway. */
    readonly reasoning: null | boolean;
    /** source as defined by the Nexa gateway. */
    readonly source: string;
    /** status as defined by the Nexa gateway. */
    readonly status: string;
}

/** WorkflowModelChoice from the Nexa wire protocol. */
export type WorkflowModelChoice = WorkflowModelChoiceShape;

/** Allowed values for WorkflowModelFeature. */
export const WorkflowModelFeatureValues = {
    Value0: 'documents',
    Value1: 'reasoning',
    Value2: 'structuredOutput',
    Value3: 'tools',
    Value4: 'vision',
} as const;

/** WorkflowModelFeature from the Nexa wire protocol. */
export type WorkflowModelFeature =
    (typeof WorkflowModelFeatureValues)[keyof typeof WorkflowModelFeatureValues];

/** WorkflowModelPolicy wire fields. */
export interface WorkflowModelPolicyShape {
    /** allowPreview as defined by the Nexa gateway. */
    readonly allowPreview: boolean;
    /** allowUnpriced as defined by the Nexa gateway. */
    readonly allowUnpriced: boolean;
    /** maxCatalogAgeMs as defined by the Nexa gateway. */
    readonly maxCatalogAgeMs: string;
    /** maxInputUsdPerMillion as defined by the Nexa gateway. */
    readonly maxInputUsdPerMillion: null | string;
    /** maxOutputUsdPerMillion as defined by the Nexa gateway. */
    readonly maxOutputUsdPerMillion: null | string;
    /** region as defined by the Nexa gateway. */
    readonly region: null | string;
    /** requiredFeatures as defined by the Nexa gateway. */
    readonly requiredFeatures: ReadonlyArray<WorkflowModelFeature>;
}

/** WorkflowModelPolicy from the Nexa wire protocol. */
export type WorkflowModelPolicy = WorkflowModelPolicyShape;

/** WorkflowModelPolicyEvidence wire fields. */
export interface WorkflowModelPolicyEvidenceShape {
    /** capabilityDigest as defined by the Nexa gateway. */
    readonly capabilityDigest: string;
    /** catalogCheckedAtMs as defined by the Nexa gateway. */
    readonly catalogCheckedAtMs: string;
    /** eligibilityReference as defined by the Nexa gateway. */
    readonly eligibilityReference: string;
    /** eligibilityVerifiedAtMs as defined by the Nexa gateway. */
    readonly eligibilityVerifiedAtMs: string;
    /** format as defined by the Nexa gateway. */
    readonly format: 1;
    /** policy as defined by the Nexa gateway. */
    readonly policy: WorkflowModelPolicy;
    /** releaseAtMs as defined by the Nexa gateway. */
    readonly releaseAtMs: string;
    /** releaseReference as defined by the Nexa gateway. */
    readonly releaseReference: string;
}

/** WorkflowModelPolicyEvidence from the Nexa wire protocol. */
export type WorkflowModelPolicyEvidence = WorkflowModelPolicyEvidenceShape;

/** WorkflowModelPrice wire fields. */
export interface WorkflowModelPriceShape {
    /** inputUsdPerMillion as defined by the Nexa gateway. */
    readonly inputUsdPerMillion: null | string;
    /** outputUsdPerMillion as defined by the Nexa gateway. */
    readonly outputUsdPerMillion: null | string;
}

/** WorkflowModelPrice from the Nexa wire protocol. */
export type WorkflowModelPrice = WorkflowModelPriceShape;

/** WorkflowModelResolution wire fields. */
export interface WorkflowModelResolutionShape {
    /** candidate as defined by the Nexa gateway. */
    readonly candidate: WorkflowModelChoice | null;
    /** evidence as defined by the Nexa gateway. */
    readonly evidence: WorkflowModelPolicyEvidence | null;
    /** reason as defined by the Nexa gateway. */
    readonly reason: null | string;
}

/** WorkflowModelResolution from the Nexa wire protocol. */
export type WorkflowModelResolution = WorkflowModelResolutionShape;

/** WorkflowModelResolutionRequest wire fields. */
export interface WorkflowModelResolutionRequestShape {
    /** capability as defined by the Nexa gateway. */
    readonly capability: WorkflowModelCapability;
    /** maxOutputTokens as defined by the Nexa gateway. */
    readonly maxOutputTokens: number;
    /** policy as defined by the Nexa gateway. */
    readonly policy: WorkflowModelPolicy;
    /** provider as defined by the Nexa gateway. */
    readonly provider: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowModelResolutionRequest from the Nexa wire protocol. */
export type WorkflowModelResolutionRequest = WorkflowModelResolutionRequestShape;

/** WorkflowModelsPage wire fields. */
export interface WorkflowModelsPageShape {
    /** freshness as defined by the Nexa gateway. */
    readonly freshness: 'not-reported';
    /** items as defined by the Nexa gateway. */
    readonly items: ReadonlyArray<WorkflowModelChoice>;
    /** next as defined by the Nexa gateway. */
    readonly next: null | string;
    /** observation as defined by the Nexa gateway. */
    readonly observation?: WorkflowCatalogObservation;
    /** providers as defined by the Nexa gateway. */
    readonly providers: ReadonlyArray<string>;
}

/** WorkflowModelsPage from the Nexa wire protocol. */
export type WorkflowModelsPage = WorkflowModelsPageShape;

/** WorkflowModelsRequest wire fields. */
export interface WorkflowModelsRequestShape {
    /** after as defined by the Nexa gateway. */
    readonly after: null | string;
    /** capability as defined by the Nexa gateway. */
    readonly capability: WorkflowModelCapability;
    /** compatibleOnly as defined by the Nexa gateway. */
    readonly compatibleOnly: boolean;
    /** favorites as defined by the Nexa gateway. */
    readonly favorites: ReadonlyArray<string> | null;
    /** provider as defined by the Nexa gateway. */
    readonly provider: null | string;
    /** query as defined by the Nexa gateway. */
    readonly query: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowModelsRequest from the Nexa wire protocol. */
export type WorkflowModelsRequest = WorkflowModelsRequestShape;

/** WorkflowNode wire fields. */
export interface WorkflowNodeShape {
    /** component as defined by the Nexa gateway. */
    readonly component: string;
    /** componentVersion as defined by the Nexa gateway. */
    readonly componentVersion: string;
    /** configuration as defined by the Nexa gateway. */
    readonly configuration: WorkflowObject;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** label as defined by the Nexa gateway. */
    readonly label: string;
    /** resources as defined by the Nexa gateway. */
    readonly resources: ReadonlyArray<ResourceBinding>;
}

/** WorkflowNode from the Nexa wire protocol. */
export type WorkflowNode = WorkflowNodeShape;

/** WorkflowNodeReference wire fields. */
export interface WorkflowNodeReferenceShape {
    /** content as defined by the Nexa gateway. */
    readonly content: string;
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** position as defined by the Nexa gateway. */
    readonly position: string;
}

/** WorkflowNodeReference from the Nexa wire protocol. */
export type WorkflowNodeReference = WorkflowNodeReferenceShape;

/** WorkflowObject from the Nexa wire protocol. */
export interface WorkflowObject {
    readonly [key: string]: WorkflowValue;
}

/** WorkflowPatch wire fields. */
export interface WorkflowPatchShape {
    /** details as defined by the Nexa gateway. */
    readonly details: WorkflowDetails | null;
    /** edges as defined by the Nexa gateway. */
    readonly edges: ReadonlyArray<WorkflowEdge>;
    /** nodes as defined by the Nexa gateway. */
    readonly nodes: ReadonlyArray<WorkflowNode>;
    /** positions as defined by the Nexa gateway. */
    readonly positions: ReadonlyArray<WorkflowPosition>;
    /** removeEdges as defined by the Nexa gateway. */
    readonly removeEdges: ReadonlyArray<string>;
    /** removeNodes as defined by the Nexa gateway. */
    readonly removeNodes: ReadonlyArray<string>;
}

/** WorkflowPatch from the Nexa wire protocol. */
export type WorkflowPatch = WorkflowPatchShape;

/** WorkflowPosition wire fields. */
export interface WorkflowPositionShape {
    /** id as defined by the Nexa gateway. */
    readonly id: string;
    /** x as defined by the Nexa gateway. */
    readonly x: number;
    /** y as defined by the Nexa gateway. */
    readonly y: number;
}

/** WorkflowPosition from the Nexa wire protocol. */
export type WorkflowPosition = WorkflowPositionShape;

/** WorkflowReadRequest wire fields. */
export interface WorkflowReadRequestShape {
    /** edgeOffset as defined by the Nexa gateway. */
    readonly edgeOffset: number;
    /** nodeOffset as defined by the Nexa gateway. */
    readonly nodeOffset: number;
    /** revision as defined by the Nexa gateway. */
    readonly revision: null | string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowReadRequest from the Nexa wire protocol. */
export type WorkflowReadRequest = WorkflowReadRequestShape;

/** WorkflowReceipt wire fields. */
export interface WorkflowReceiptShape {
    /** revision as defined by the Nexa gateway. */
    readonly revision: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowReceipt from the Nexa wire protocol. */
export type WorkflowReceipt = WorkflowReceiptShape;

/** WorkflowRecordPage wire fields. */
export interface WorkflowRecordPageShape {
    /** content as defined by the Nexa gateway. */
    readonly content: string;
    /** nextOffset as defined by the Nexa gateway. */
    readonly nextOffset: null | number;
    /** offset as defined by the Nexa gateway. */
    readonly offset: number;
    /** reference as defined by the Nexa gateway. */
    readonly reference: string;
    /** totalCharacters as defined by the Nexa gateway. */
    readonly totalCharacters: number;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowRecordPage from the Nexa wire protocol. */
export type WorkflowRecordPage = WorkflowRecordPageShape;

/** WorkflowRecordRequest wire fields. */
export interface WorkflowRecordRequestShape {
    /** offset as defined by the Nexa gateway. */
    readonly offset: number;
    /** reference as defined by the Nexa gateway. */
    readonly reference: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowRecordRequest from the Nexa wire protocol. */
export type WorkflowRecordRequest = WorkflowRecordRequestShape;

/** WorkflowRunArtifact wire fields. */
export interface WorkflowRunArtifactShape {
    /** artifactId as defined by the Nexa gateway. */
    readonly artifactId: string;
    /** bytes as defined by the Nexa gateway. */
    readonly bytes: string;
    /** contentType as defined by the Nexa gateway. */
    readonly contentType: string;
    /** expiresAtMs as defined by the Nexa gateway. */
    readonly expiresAtMs: null | string;
    /** name as defined by the Nexa gateway. */
    readonly name: string;
    /** sha256 as defined by the Nexa gateway. */
    readonly sha256: string;
}

/** WorkflowRunArtifact from the Nexa wire protocol. */
export type WorkflowRunArtifact = WorkflowRunArtifactShape;

/** WorkflowRunArtifactPage wire fields. */
export interface WorkflowRunArtifactPageShape {
    /** artifact as defined by the Nexa gateway. */
    readonly artifact: WorkflowRunArtifact;
    /** artifactId as defined by the Nexa gateway. */
    readonly artifactId: string;
    /** base64 as defined by the Nexa gateway. */
    readonly base64: string;
    /** nextOffset as defined by the Nexa gateway. */
    readonly nextOffset: null | number;
    /** offset as defined by the Nexa gateway. */
    readonly offset: number;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
}

/** WorkflowRunArtifactPage from the Nexa wire protocol. */
export type WorkflowRunArtifactPage = WorkflowRunArtifactPageShape;

/** WorkflowRunArtifactRequest wire fields. */
export interface WorkflowRunArtifactRequestShape {
    /** artifactId as defined by the Nexa gateway. */
    readonly artifactId: string;
    /** offset as defined by the Nexa gateway. */
    readonly offset: number;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
}

/** WorkflowRunArtifactRequest from the Nexa wire protocol. */
export type WorkflowRunArtifactRequest = WorkflowRunArtifactRequestShape;

/** Allowed values for WorkflowRunEventstatus. */
export const WorkflowRunEventstatusValues = {
    Value0: 'cancelled',
    Value1: 'failed',
    Value2: 'interrupted',
    Value3: 'queued',
    Value4: 'running',
    Value5: 'skipped',
    Value6: 'succeeded',
    Value7: 'uncertain',
} as const;

/** WorkflowRunEvent wire fields. */
export interface WorkflowRunEventShape {
    /** atMs as defined by the Nexa gateway. */
    readonly atMs: string;
    /** invocationId as defined by the Nexa gateway. */
    readonly invocationId: null | string;
    /** kind as defined by the Nexa gateway. */
    readonly kind: WorkflowRunEventKind;
    /** message as defined by the Nexa gateway. */
    readonly message: null | string;
    /** nodeId as defined by the Nexa gateway. */
    readonly nodeId: null | string;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
    /** sequence as defined by the Nexa gateway. */
    readonly sequence: string;
    /** status as defined by the Nexa gateway. */
    readonly status: (typeof WorkflowRunEventstatusValues)[keyof typeof WorkflowRunEventstatusValues];
}

/** WorkflowRunEvent from the Nexa wire protocol. */
export type WorkflowRunEvent = WorkflowRunEventShape;

/** Allowed values for WorkflowRunEventKind. */
export const WorkflowRunEventKindValues = {
    Value0: 'accepted',
    Value1: 'cancelled',
    Value2: 'claimed',
    Value3: 'finished',
    Value4: 'step-finished',
    Value5: 'step-started',
} as const;

/** WorkflowRunEventKind from the Nexa wire protocol. */
export type WorkflowRunEventKind =
    (typeof WorkflowRunEventKindValues)[keyof typeof WorkflowRunEventKindValues];

/** WorkflowRunEventsRequest wire fields. */
export interface WorkflowRunEventsRequestShape {
    /** after as defined by the Nexa gateway. */
    readonly after: string;
    /** limit as defined by the Nexa gateway. */
    readonly limit: number;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
}

/** WorkflowRunEventsRequest from the Nexa wire protocol. */
export type WorkflowRunEventsRequest = WorkflowRunEventsRequestShape;

/** WorkflowRunListPage wire fields. */
export interface WorkflowRunListPageShape {
    /** items as defined by the Nexa gateway. */
    readonly items: ReadonlyArray<WorkflowRunSummary>;
    /** next as defined by the Nexa gateway. */
    readonly next: null | string;
}

/** WorkflowRunListPage from the Nexa wire protocol. */
export type WorkflowRunListPage = WorkflowRunListPageShape;

/** WorkflowRunListRequest wire fields. */
export interface WorkflowRunListRequestShape {
    /** afterRunId as defined by the Nexa gateway. */
    readonly afterRunId: null | string;
    /** limit as defined by the Nexa gateway. */
    readonly limit: number;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowRunListRequest from the Nexa wire protocol. */
export type WorkflowRunListRequest = WorkflowRunListRequestShape;

/** Allowed values for WorkflowRunMode. */
export const WorkflowRunModeValues = { Value0: 'live-test', Value1: 'mock-test' } as const;

/** WorkflowRunMode from the Nexa wire protocol. */
export type WorkflowRunMode = (typeof WorkflowRunModeValues)[keyof typeof WorkflowRunModeValues];

/** WorkflowRunOutputPage wire fields. */
export interface WorkflowRunOutputPageShape {
    /** content as defined by the Nexa gateway. */
    readonly content: string;
    /** invocationId as defined by the Nexa gateway. */
    readonly invocationId: string;
    /** nextOffset as defined by the Nexa gateway. */
    readonly nextOffset: null | number;
    /** nodeId as defined by the Nexa gateway. */
    readonly nodeId: string;
    /** offset as defined by the Nexa gateway. */
    readonly offset: number;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
    /** totalCharacters as defined by the Nexa gateway. */
    readonly totalCharacters: number;
}

/** WorkflowRunOutputPage from the Nexa wire protocol. */
export type WorkflowRunOutputPage = WorkflowRunOutputPageShape;

/** WorkflowRunOutputRequest wire fields. */
export interface WorkflowRunOutputRequestShape {
    /** invocationId as defined by the Nexa gateway. */
    readonly invocationId: string;
    /** nodeId as defined by the Nexa gateway. */
    readonly nodeId: string;
    /** offset as defined by the Nexa gateway. */
    readonly offset: number;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
}

/** WorkflowRunOutputRequest from the Nexa wire protocol. */
export type WorkflowRunOutputRequest = WorkflowRunOutputRequestShape;

/** WorkflowRunRequest wire fields. */
export interface WorkflowRunRequestShape {
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
}

/** WorkflowRunRequest from the Nexa wire protocol. */
export type WorkflowRunRequest = WorkflowRunRequestShape;

/** WorkflowRunStartRequest wire fields. */
export interface WorkflowRunStartRequestShape {
    /** input as defined by the Nexa gateway. */
    readonly input: WorkflowObject;
    /** maxConcurrency as defined by the Nexa gateway. */
    readonly maxConcurrency: number;
    /** mode as defined by the Nexa gateway. */
    readonly mode: WorkflowRunMode;
    /** revision as defined by the Nexa gateway. */
    readonly revision: string;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
    /** timeoutMs as defined by the Nexa gateway. */
    readonly timeoutMs: string;
    /** triggerNodeId as defined by the Nexa gateway. */
    readonly triggerNodeId: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowRunStartRequest from the Nexa wire protocol. */
export type WorkflowRunStartRequest = WorkflowRunStartRequestShape;

/** Allowed values for WorkflowRunStatus. */
export const WorkflowRunStatusValues = {
    Value0: 'cancelled',
    Value1: 'failed',
    Value2: 'queued',
    Value3: 'running',
    Value4: 'succeeded',
} as const;

/** WorkflowRunStatus from the Nexa wire protocol. */
export type WorkflowRunStatus =
    (typeof WorkflowRunStatusValues)[keyof typeof WorkflowRunStatusValues];

/** WorkflowRunStepsPage wire fields. */
export interface WorkflowRunStepsPageShape {
    /** items as defined by the Nexa gateway. */
    readonly items: ReadonlyArray<WorkflowStepView>;
    /** next as defined by the Nexa gateway. */
    readonly next: null | string;
}

/** WorkflowRunStepsPage from the Nexa wire protocol. */
export type WorkflowRunStepsPage = WorkflowRunStepsPageShape;

/** WorkflowRunStepsRequest wire fields. */
export interface WorkflowRunStepsRequestShape {
    /** afterNodeId as defined by the Nexa gateway. */
    readonly afterNodeId: null | string;
    /** limit as defined by the Nexa gateway. */
    readonly limit: number;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
}

/** WorkflowRunStepsRequest from the Nexa wire protocol. */
export type WorkflowRunStepsRequest = WorkflowRunStepsRequestShape;

/** WorkflowRunSummary wire fields. */
export interface WorkflowRunSummaryShape {
    /** createdAtMs as defined by the Nexa gateway. */
    readonly createdAtMs: string;
    /** message as defined by the Nexa gateway. */
    readonly message: null | string;
    /** mode as defined by the Nexa gateway. */
    readonly mode: WorkflowRunMode;
    /** runId as defined by the Nexa gateway. */
    readonly runId: string;
    /** sequence as defined by the Nexa gateway. */
    readonly sequence: string;
    /** status as defined by the Nexa gateway. */
    readonly status: WorkflowRunStatus;
    /** updatedAtMs as defined by the Nexa gateway. */
    readonly updatedAtMs: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
    /** workflowRevision as defined by the Nexa gateway. */
    readonly workflowRevision: string;
}

/** WorkflowRunSummary from the Nexa wire protocol. */
export type WorkflowRunSummary = WorkflowRunSummaryShape;

/** WorkflowSaveRequest wire fields. */
export interface WorkflowSaveRequestShape {
    /** commandId as defined by the Nexa gateway. */
    readonly commandId: string;
    /** expectedRevision as defined by the Nexa gateway. */
    readonly expectedRevision: string;
    /** patch as defined by the Nexa gateway. */
    readonly patch: WorkflowPatch;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowSaveRequest from the Nexa wire protocol. */
export type WorkflowSaveRequest = WorkflowSaveRequestShape;

/** Allowed values for WorkflowStepStatus. */
export const WorkflowStepStatusValues = {
    Value0: 'cancelled',
    Value1: 'failed',
    Value2: 'interrupted',
    Value3: 'running',
    Value4: 'skipped',
    Value5: 'succeeded',
    Value6: 'uncertain',
} as const;

/** WorkflowStepStatus from the Nexa wire protocol. */
export type WorkflowStepStatus =
    (typeof WorkflowStepStatusValues)[keyof typeof WorkflowStepStatusValues];

/** WorkflowStepView wire fields. */
export interface WorkflowStepViewShape {
    /** attempt as defined by the Nexa gateway. */
    readonly attempt: number;
    /** component as defined by the Nexa gateway. */
    readonly component: string;
    /** finishedAtMs as defined by the Nexa gateway. */
    readonly finishedAtMs: null | string;
    /** hasResult as defined by the Nexa gateway. */
    readonly hasResult: boolean;
    /** invocationId as defined by the Nexa gateway. */
    readonly invocationId: string;
    /** label as defined by the Nexa gateway. */
    readonly label: string;
    /** message as defined by the Nexa gateway. */
    readonly message: null | string;
    /** nodeId as defined by the Nexa gateway. */
    readonly nodeId: string;
    /** startedAtMs as defined by the Nexa gateway. */
    readonly startedAtMs: string;
    /** status as defined by the Nexa gateway. */
    readonly status: WorkflowStepStatus;
}

/** WorkflowStepView from the Nexa wire protocol. */
export type WorkflowStepView = WorkflowStepViewShape;

/** WorkflowSummary wire fields. */
export interface WorkflowSummaryShape {
    /** createdAtMs as defined by the Nexa gateway. */
    readonly createdAtMs: string;
    /** details as defined by the Nexa gateway. */
    readonly details: WorkflowDetails;
    /** edgeCount as defined by the Nexa gateway. */
    readonly edgeCount: number;
    /** nodeCount as defined by the Nexa gateway. */
    readonly nodeCount: number;
    /** revision as defined by the Nexa gateway. */
    readonly revision: string;
    /** updatedAtMs as defined by the Nexa gateway. */
    readonly updatedAtMs: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowSummary from the Nexa wire protocol. */
export type WorkflowSummary = WorkflowSummaryShape;

/** WorkflowValidateRequest wire fields. */
export interface WorkflowValidateRequestShape {
    /** revision as defined by the Nexa gateway. */
    readonly revision: string;
    /** workflowId as defined by the Nexa gateway. */
    readonly workflowId: string;
}

/** WorkflowValidateRequest from the Nexa wire protocol. */
export type WorkflowValidateRequest = WorkflowValidateRequestShape;

/** WorkflowValue from the Nexa wire protocol. */
export type WorkflowValue =
    WorkflowObject | ReadonlyArray<WorkflowValue> | null | string | number | boolean;

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
    /** Calls agent.steer. */
    AgentSteer = 'agent.steer',
    /** Calls agent.stream. */
    AgentStream = 'agent.stream',
    /** Calls agents.define. */
    AgentsDefine = 'agents.define',
    /** Calls agents.list. */
    AgentsList = 'agents.list',
    /** Calls agents.personal.list. */
    AgentsPersonalList = 'agents.personal.list',
    /** Calls agents.personal.remove. */
    AgentsPersonalRemove = 'agents.personal.remove',
    /** Calls agents.personal.save. */
    AgentsPersonalSave = 'agents.personal.save',
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
    /** Calls credit.resetAllowance. */
    CreditResetAllowance = 'credit.resetAllowance',
    /** Calls credit.resetHistory. */
    CreditResetHistory = 'credit.resetHistory',
    /** Calls credit.resets. */
    CreditResets = 'credit.resets',
    /** Calls credit.setBudget. */
    CreditSetBudget = 'credit.setBudget',
    /** Calls credit.summary. */
    CreditSummary = 'credit.summary',
    /** Calls credit.wallet. */
    CreditWallet = 'credit.wallet',
    /** Calls credit.walletHistory. */
    CreditWalletHistory = 'credit.walletHistory',
    /** Calls data.upload.cancel. */
    DataUploadCancel = 'data.upload.cancel',
    /** Calls data.upload.chunk. */
    DataUploadChunk = 'data.upload.chunk',
    /** Calls data.upload.finish. */
    DataUploadFinish = 'data.upload.finish',
    /** Calls data.upload.start. */
    DataUploadStart = 'data.upload.start',
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
    /** Calls office.ownerProof. */
    OfficeOwnerProof = 'office.ownerProof',
    /** Calls processes.input. */
    ProcessesInput = 'processes.input',
    /** Calls processes.list. */
    ProcessesList = 'processes.list',
    /** Calls processes.log. */
    ProcessesLog = 'processes.log',
    /** Calls processes.resize. */
    ProcessesResize = 'processes.resize',
    /** Calls processes.stop. */
    ProcessesStop = 'processes.stop',
    /** Calls roblox.credentials.remove. */
    RobloxCredentialsRemove = 'roblox.credentials.remove',
    /** Calls roblox.credentials.set. */
    RobloxCredentialsSet = 'roblox.credentials.set',
    /** Calls roblox.credentials.status. */
    RobloxCredentialsStatus = 'roblox.credentials.status',
    /** Calls roblox.telemetry.funnel. */
    RobloxTelemetryFunnel = 'roblox.telemetry.funnel',
    /** Calls roblox.telemetry.performance. */
    RobloxTelemetryPerformance = 'roblox.telemetry.performance',
    /** Calls roblox.telemetry.projects. */
    RobloxTelemetryProjects = 'roblox.telemetry.projects',
    /** Calls sessions.delete. */
    SessionsDelete = 'sessions.delete',
    /** Calls sessions.download. */
    SessionsDownload = 'sessions.download',
    /** Calls sessions.files. */
    SessionsFiles = 'sessions.files',
    /** Calls sessions.get. */
    SessionsGet = 'sessions.get',
    /** Calls sessions.history. */
    SessionsHistory = 'sessions.history',
    /** Calls sessions.input. */
    SessionsInput = 'sessions.input',
    /** Calls sessions.list. */
    SessionsList = 'sessions.list',
    /** Calls sessions.messages. */
    SessionsMessages = 'sessions.messages',
    /** Calls sessions.pin. */
    SessionsPin = 'sessions.pin',
    /** Calls sessions.pins. */
    SessionsPins = 'sessions.pins',
    /** Calls sessions.rename. */
    SessionsRename = 'sessions.rename',
    /** Calls sessions.retry. */
    SessionsRetry = 'sessions.retry',
    /** Calls sessions.search. */
    SessionsSearch = 'sessions.search',
    /** Calls sessions.subscribe. */
    SessionsSubscribe = 'sessions.subscribe',
    /** Calls sessions.unpin. */
    SessionsUnpin = 'sessions.unpin',
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
    /** Calls workflows.catalog. */
    WorkflowsCatalog = 'workflows.catalog',
    /** Calls workflows.create. */
    WorkflowsCreate = 'workflows.create',
    /** Calls workflows.list. */
    WorkflowsList = 'workflows.list',
    /** Calls workflows.models. */
    WorkflowsModels = 'workflows.models',
    /** Calls workflows.models.refresh. */
    WorkflowsModelsRefresh = 'workflows.models.refresh',
    /** Calls workflows.models.resolve. */
    WorkflowsModelsResolve = 'workflows.models.resolve',
    /** Calls workflows.planning.cancel. */
    WorkflowsPlanningCancel = 'workflows.planning.cancel',
    /** Calls workflows.planning.history. */
    WorkflowsPlanningHistory = 'workflows.planning.history',
    /** Calls workflows.planning.read. */
    WorkflowsPlanningRead = 'workflows.planning.read',
    /** Calls workflows.planning.send. */
    WorkflowsPlanningSend = 'workflows.planning.send',
    /** Calls workflows.planning.sources. */
    WorkflowsPlanningSources = 'workflows.planning.sources',
    /** Calls workflows.read. */
    WorkflowsRead = 'workflows.read',
    /** Calls workflows.record. */
    WorkflowsRecord = 'workflows.record',
    /** Calls workflows.runs.artifact. */
    WorkflowsRunsArtifact = 'workflows.runs.artifact',
    /** Calls workflows.runs.cancel. */
    WorkflowsRunsCancel = 'workflows.runs.cancel',
    /** Calls workflows.runs.events. */
    WorkflowsRunsEvents = 'workflows.runs.events',
    /** Calls workflows.runs.list. */
    WorkflowsRunsList = 'workflows.runs.list',
    /** Calls workflows.runs.output. */
    WorkflowsRunsOutput = 'workflows.runs.output',
    /** Calls workflows.runs.read. */
    WorkflowsRunsRead = 'workflows.runs.read',
    /** Calls workflows.runs.start. */
    WorkflowsRunsStart = 'workflows.runs.start',
    /** Calls workflows.runs.steps. */
    WorkflowsRunsSteps = 'workflows.runs.steps',
    /** Calls workflows.save. */
    WorkflowsSave = 'workflows.save',
    /** Calls workflows.validate. */
    WorkflowsValidate = 'workflows.validate',
    /** Calls workspaces.create. */
    WorkspacesCreate = 'workspaces.create',
    /** Calls workspaces.describe. */
    WorkspacesDescribe = 'workspaces.describe',
    /** Calls workspaces.destroy. */
    WorkspacesDestroy = 'workspaces.destroy',
    /** Calls workspaces.list. */
    WorkspacesList = 'workspaces.list',
}
