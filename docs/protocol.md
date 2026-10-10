# Protocol types

Field reference generated from the bundled protocol contract. Optional fields may be absent. Union variants list their own required fields. Import the corresponding named TypeScript types from `nexa-transport/protocol`; inline object variants also have generated `Shape` interfaces in that module. See [RPC usage](methods.md) and the [guide](guide.md).

## AccountCreateParams

How the UI creates an account.

| Field         | Required | Type     | Description |
| ------------- | -------- | -------- | ----------- |
| `displayName` | Yes      | `string` |             |
| `localId`     | No       | `string` |             |
| `model`       | No       | `string` |             |
| `role`        | No       | `string` |             |

## AccountRemoveParams

How the UI removes one.

| Field             | Required | Type      | Description                                                  |
| ----------------- | -------- | --------- | ------------------------------------------------------------ |
| `principalId`     | Yes      | `string`  |                                                              |
| `removeWorkspace` | No       | `boolean` | Whether the workspace directory goes too. Defaults to FALSE. |

## AccountSummary

One account, as the control UI lists it.

| Field           | Required | Type                           | Description                                           |
| --------------- | -------- | ------------------------------ | ----------------------------------------------------- |
| `createdAt`     | Yes      | `number`                       |                                                       |
| `disabled`      | Yes      | `boolean`                      |                                                       |
| `displayName`   | Yes      | `string`                       |                                                       |
| `model`         | No       | `string`                       | The model this user chose, when they chose one.       |
| `principalId`   | Yes      | `string`                       |                                                       |
| `role`          | Yes      | `string`                       | The role its grants match, or a count of custom ones. |
| `shares`        | Yes      | Array of Object (fields below) | Share ids they reach, with the mode they get.         |
| `teams`         | Yes      | Array of `string`              | Team ids they belong to.                              |
| `workspacePath` | Yes      | `string`                       |                                                       |

**shares**

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `id`   | Yes      | `string` |             |
| `mode` | Yes      | `string` |             |

## AccountsUsageParams

What window to report spend over.

| Field    | Required | Type     | Description                                |
| -------- | -------- | -------- | ------------------------------------------ |
| `fromMs` | No       | `number` |                                            |
| `toMs`   | No       | `number` |                                            |
| `userId` | No       | `string` | One account, or every account when absent. |

## AccountsUsageResult

Per-user, per-model spend. Mirrors `AccountsUsageReport` over the wire.

| Field             | Required | Type                           | Description |
| ----------------- | -------- | ------------------------------ | ----------- |
| `entries`         | Yes      | `number`                       |             |
| `fromMs`          | Yes      | `number`                       |             |
| `toMs`            | Yes      | `number`                       |             |
| `totalMicrocents` | Yes      | `number`                       |             |
| `users`           | Yes      | Array of Object (fields below) |             |

**users**

| Field                | Required | Type                           | Description |
| -------------------- | -------- | ------------------------------ | ----------- |
| `cachedInputTokens`  | Yes      | `number`                       |             |
| `displayName`        | No       | `string`                       |             |
| `entries`            | Yes      | `number`                       |             |
| `inputTokens`        | Yes      | `number`                       |             |
| `microcents`         | Yes      | `number`                       |             |
| `models`             | Yes      | Array of Object (fields below) |             |
| `nonModelMicrocents` | Yes      | `number`                       |             |
| `outputTokens`       | Yes      | `number`                       |             |
| `userId`             | Yes      | `string`                       |             |

**users.models**

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `inputTokens`  | Yes      | `number` |             |
| `microcents`   | Yes      | `number` |             |
| `model`        | Yes      | `string` |             |
| `outputTokens` | Yes      | `number` |             |
| `provider`     | Yes      | `string` |             |

## AgentDefineParams

Registers or replaces an agent.

| Field   | Required | Type                                           | Description |
| ------- | -------- | ---------------------------------------------- | ----------- |
| `agent` | Yes      | [AgentDefinition](protocol.md#agentdefinition) |             |

## AgentDefinition

One agent's configuration.

| Field                | Required | Type                                                          | Description                                                                               |
| -------------------- | -------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `advertisedTools`    | No       | Array of `string`                                             | The subset of `tools` whose DEFINITIONS are sent to the model.                            |
| `approvalMode`       | No       | `"cautious"` / `"permissive"` / `"standard"` / `"unattended"` | How the agent asks before acting.                                                         |
| `excludeTools`       | No       | Array of `string`                                             | Tools this agent may never use, applied after `tools`.                                    |
| `id`                 | Yes      | `string`                                                      |                                                                                           |
| `maxIterations`      | No       | `number`                                                      | How many model round-trips one turn may take before it is stopped.                        |
| `maxTokens`          | No       | `number`                                                      |                                                                                           |
| `metadata`           | No       | [Recordstringstring](protocol.md#recordstringstring)          | Free-form metadata a deployment attaches.                                                 |
| `model`              | Yes      | `string`                                                      |                                                                                           |
| `name`               | Yes      | `string`                                                      | What the agent calls itself. User-changeable at runtime ("call yourself Ada").            |
| `provider`           | Yes      | `string`                                                      |                                                                                           |
| `reasoning`          | No       | [ReasoningOptions](protocol.md#reasoningoptions)              | Reasoning configuration for a request.                                                    |
| `systemPrompt`       | No       | `string`                                                      | The agent's own system prompt, replacing the default persona entirely when set.           |
| `systemPromptSuffix` | No       | `string`                                                      | Appended to the assembled system prompt, for a tweak that should not discard the default. |
| `temperature`        | No       | `number`                                                      |                                                                                           |
| `tools`              | No       | Array of `string`                                             | Tools this agent may use. Absent means every registered tool.                             |
| `voice`              | No       | [AgentVoice](protocol.md#agentvoice)                          | Voice settings, when the agent speaks.                                                    |

## AgentVoice

How an agent speaks.

| Field       | Required | Type      | Description                             |
| ----------- | -------- | --------- | --------------------------------------- |
| `autoSpeak` | No       | `boolean` | Whether replies are spoken by default.  |
| `provider`  | Yes      | `string`  | The TTS provider id, e.g. `elevenlabs`. |
| `voiceId`   | Yes      | `string`  | The provider's voice id.                |

## ApplicationBoundary

| Field       | Required | Type                                                           | Description |
| ----------- | -------- | -------------------------------------------------------------- | ----------- |
| `id`        | Yes      | `string`                                                       |             |
| `kind`      | Yes      | [ApplicationBoundaryKind](protocol.md#applicationboundarykind) |             |
| `location`  | Yes      | [ApplicationLocation](protocol.md#applicationlocation)         |             |
| `operation` | Yes      | `string`                                                       |             |
| `value`     | Yes      | `null,string`                                                  |             |

## ApplicationBoundaryKind

Observed call sites, never claims that an IPC channel, route or native addon was exercised.

Type: `"browser-window"` / `"context-bridge"` / `"ipc"` / `"native-addon"` / `"preload"` / `"route"`.

## ApplicationConnection

Type: `"connected"` / `"setup-required"` / `"unavailable"`.

## ApplicationIssue

Explicit incomplete coverage rather than silently omitted files or unsupported syntax.

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `message` | Yes      | `string` |             |
| `path`    | Yes      | `string` |             |

## ApplicationLocation

Exact generated-source location of a static observation. Columns and offsets are zero-based.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `column`    | Yes      | `number` |             |
| `end`       | Yes      | `number` |             |
| `endColumn` | Yes      | `number` |             |
| `endLine`   | Yes      | `number` |             |
| `line`      | Yes      | `number` |             |
| `module`    | Yes      | `string` |             |
| `start`     | Yes      | `number` |             |

## ApplicationModule

An inventoried module with a digest of the exact bytes parsed, including syntax failures.

| Field        | Required | Type                                                  | Description                                                                         |
| ------------ | -------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bytes`      | Yes      | `string`                                              |                                                                                     |
| `functions`  | Yes      | `number`                                              |                                                                                     |
| `id`         | Yes      | `string`                                              |                                                                                     |
| `imports`    | Yes      | `number`                                              |                                                                                     |
| `language`   | No       | `"c"` / `"cpp"` / `"javascript"` / `"lua"` / `"luau"` | Source grammars are explicit; bytecode formats use separate version-aware adapters. |
| `parseError` | Yes      | `null,string`                                         |                                                                                     |
| `path`       | Yes      | `string`                                              |                                                                                     |
| `sha256`     | Yes      | `string`                                              |                                                                                     |
| `sourceMap`  | Yes      | `null,string`                                         |                                                                                     |

## ApprovalRequestedData

The payload of a {@link GATEWAY_EVENTS.ApprovalRequested} event.

| Field         | Required | Type                               | Description                                                                |
| ------------- | -------- | ---------------------------------- | -------------------------------------------------------------------------- |
| `approvalId`  | Yes      | `string`                           |                                                                            |
| `detail`      | No       | `string`                           | The exact command or path, so an operator approves what will actually run. |
| `expiresAt`   | Yes      | `number`                           |                                                                            |
| `principalId` | Yes      | `string`                           |                                                                            |
| `requestedAt` | Yes      | `number`                           |                                                                            |
| `risk`        | Yes      | [RiskLevel](protocol.md#risklevel) |                                                                            |
| `sessionId`   | Yes      | `null,string`                      |                                                                            |
| `summary`     | Yes      | `string`                           |                                                                            |
| `tool`        | Yes      | `string`                           |                                                                            |

## ApprovalResolveParams

An operator's answer to one approval.

| Field        | Required | Type      | Description |
| ------------ | -------- | --------- | ----------- |
| `approvalId` | Yes      | `string`  |             |
| `approved`   | Yes      | `boolean` |             |
| `reason`     | No       | `string`  |             |

## ApprovalResolvedData

The payload of a {@link GATEWAY_EVENTS.ApprovalResolved} event.

| Field        | Required | Type                                       | Description                                                                                |
| ------------ | -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `approvalId` | Yes      | `string`                                   |                                                                                            |
| `approved`   | Yes      | `boolean`                                  |                                                                                            |
| `by`         | Yes      | `null,string`                              |                                                                                            |
| `outcome`    | Yes      | `"answered"` / `"cancelled"` / `"expired"` | `expired` distinguishes "nobody answered" from "somebody said no", which read differently. |

## AskParams

What one turn is asked for.

| Field               | Required | Type                                                                          | Description                                                                 |
| ------------------- | -------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `agentId`           | No       | `string`                                                                      |                                                                             |
| `attachments`       | No       | Array of [InboundAttachment](protocol.md#inboundattachment)                   | User-authored image, video, document, and text blocks, in display order.    |
| `conversationId`    | No       | `string`                                                                      | Continues an existing conversation.                                         |
| `cwd`               | No       | `string`                                                                      | Where tools operate.                                                        |
| `message`           | Yes      | `string`                                                                      | User text; may be blank when at least one attachment contains content.      |
| `reasoningEffort`   | No       | `"high"` / `"low"` / `"max"` / `"medium"` / `"minimal"` / `"off"` / `"xhigh"` | Per-turn reasoning preference; never changes the saved agent configuration. |
| `targetTimeSeconds` | No       | `integer`                                                                     | Soft task time target in seconds; never a cancellation deadline.            |
| `userId`            | No       | `string`                                                                      | The principal the turn is billed and authorized as.                         |

## AskResult

What a finished turn produced.

| Field              | Required | Type                                                            | Description                                                                           |
| ------------------ | -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `attachments`      | No       | Array of [DeliveredAttachment](protocol.md#deliveredattachment) | Delivered files; IDs match attachment events so clients can deduplicate.              |
| `conversationId`   | Yes      | `null,string`                                                   |                                                                                       |
| `finishReason`     | Yes      | [FinishReason](protocol.md#finishreason)                        |                                                                                       |
| `incompleteReason` | No       | `string`                                                        | A stopped response may leave the task unfinished and its background resources active. |
| `iterations`       | Yes      | `number`                                                        |                                                                                       |
| `reasoning`        | Yes      | `string`                                                        |                                                                                       |
| `sessionKey`       | Yes      | `string`                                                        | The session id this turn was filed under — `sessions.get`'s id, not the provider's.   |
| `text`             | Yes      | `string`                                                        |                                                                                       |
| `turnId`           | Yes      | `string`                                                        |                                                                                       |
| `usage`            | Yes      | [TokenUsage](protocol.md#tokenusage)                            |                                                                                       |

## BackgroundProcess

Browser-safe background job receipt, without host pids or log paths.

| Field        | Required | Type          | Description                                                            |
| ------------ | -------- | ------------- | ---------------------------------------------------------------------- |
| `command`    | Yes      | `string`      |                                                                        |
| `cwd`        | Yes      | `string`      |                                                                        |
| `endedAt`    | Yes      | `null,string` |                                                                        |
| `exitCode`   | Yes      | `null,number` |                                                                        |
| `foreground` | No       | `boolean`     | A command still attached to its launching tool has an inline terminal. |
| `processId`  | Yes      | `string`      |                                                                        |
| `running`    | Yes      | `boolean`     |                                                                        |
| `signal`     | Yes      | `null,string` |                                                                        |
| `startedAt`  | Yes      | `string`      |                                                                        |

## BackgroundProcessLog

A bounded tail and complete byte boundary, represented losslessly on the wire.

| Field       | Required | Type      | Description |
| ----------- | -------- | --------- | ----------- |
| `endOffset` | Yes      | `string`  |             |
| `text`      | Yes      | `string`  |             |
| `truncated` | Yes      | `boolean` |             |

## BackgroundProcessRef

A process must always be addressed inside its owning conversation.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `processId` | Yes      | `string` |             |
| `sessionId` | Yes      | `string` |             |

## BinarySource

Where binary content comes from: inline base64, or a URL the provider fetches.

Variant 1: Object (fields below)

| Field       | Required | Type       | Description |
| ----------- | -------- | ---------- | ----------- |
| `data`      | Yes      | `string`   |             |
| `kind`      | Yes      | `"base64"` |             |
| `mediaType` | Yes      | `string`   |             |

Variant 2: Object (fields below)

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `kind` | Yes      | `"url"`  |             |
| `url`  | Yes      | `string` |             |

## BrowserAccessibilityNode

Accessibility node identity and backend links never imply that names or values were read.

| Field             | Required | Type              | Description |
| ----------------- | -------- | ----------------- | ----------- |
| `backendNodeId`   | Yes      | `null,string`     |             |
| `childCount`      | Yes      | `string`          |             |
| `depth`           | Yes      | `null,number`     |             |
| `id`              | Yes      | `string`          |             |
| `ignored`         | Yes      | `boolean`         |             |
| `kind`            | Yes      | `"accessibility"` |             |
| `missingChildren` | Yes      | `string`          |             |
| `parentId`        | Yes      | `null,string`     |             |
| `role`            | Yes      | `null,string`     |             |

## BrowserActivityConsole

Delivered console argument types and an optional validated source, without primitive values.

| Field           | Required | Type                                                                    | Description |
| --------------- | -------- | ----------------------------------------------------------------------- | ----------- |
| `argumentTypes` | Yes      | Array of `string`                                                       |             |
| `callType`      | Yes      | `string`                                                                |             |
| `kind`          | Yes      | `"console"`                                                             |             |
| `ordinal`       | Yes      | `number`                                                                |             |
| `source`        | Yes      | [BrowserActivityLocation](protocol.md#browseractivitylocation) / `null` |             |
| `timestamp`     | Yes      | `string`                                                                |             |

## BrowserActivityCoverage

Coverage describes attach-window evidence and explicitly accounts for missing observations.

| Field                         | Required | Type      | Description |
| ----------------------------- | -------- | --------- | ----------- |
| `excluded`                    | Yes      | `string`  |             |
| `missingPredecessors`         | Yes      | `string`  |             |
| `networkCompleteWithinWindow` | Yes      | `boolean` |             |
| `priorActivityAvailable`      | Yes      | `false`   |             |
| `reusedRequestIds`            | Yes      | `string`  |             |
| `truncated`                   | Yes      | `boolean` |             |
| `unfinishedRequests`          | Yes      | `string`  |             |

## BrowserActivityLocation

A CDP source location is attributed only to the selected origin.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `column` | Yes      | `number` |             |
| `line`   | Yes      | `number` |             |
| `url`    | Yes      | `string` |             |

## BrowserActivityNavigation

Same-origin main-frame navigations are observed without driving the page.

| Field          | Required | Type           | Description |
| -------------- | -------- | -------------- | ----------- |
| `kind`         | Yes      | `"navigation"` |             |
| `ordinal`      | Yes      | `number`       |             |
| `sameDocument` | Yes      | `boolean`      |             |
| `url`          | Yes      | `string`       |             |

## BrowserActivityRecord

Records form one ordered, bounded capture with independent request-generation identity.

Variant 1: [BrowserActivityRequest](protocol.md#browseractivityrequest)

| Field                   | Required | Type                                                                    | Description |
| ----------------------- | -------- | ----------------------------------------------------------------------- | ----------- |
| `encodedBytes`          | Yes      | `null,string`                                                           |             |
| `failed`                | Yes      | `boolean`                                                               |             |
| `finished`              | Yes      | `boolean`                                                               |             |
| `frameId`               | Yes      | `string`                                                                |             |
| `initiator`             | Yes      | [BrowserActivityLocation](protocol.md#browseractivitylocation) / `null` |             |
| `kind`                  | Yes      | `"request"`                                                             |             |
| `method`                | Yes      | `string`                                                                |             |
| `mimeType`              | Yes      | `null,string`                                                           |             |
| `ordinal`               | Yes      | `number`                                                                |             |
| `redirectedTo`          | Yes      | `null,number`                                                           |             |
| `requestId`             | Yes      | `string`                                                                |             |
| `resourceType`          | Yes      | `string`                                                                |             |
| `reusedWithoutRedirect` | Yes      | `boolean`                                                               |             |
| `status`                | Yes      | `null,number`                                                           |             |
| `timestamp`             | Yes      | `string`                                                                |             |
| `url`                   | Yes      | `string`                                                                |             |

Variant 2: [BrowserActivityConsole](protocol.md#browseractivityconsole)

| Field           | Required | Type                                                                    | Description |
| --------------- | -------- | ----------------------------------------------------------------------- | ----------- |
| `argumentTypes` | Yes      | Array of `string`                                                       |             |
| `callType`      | Yes      | `string`                                                                |             |
| `kind`          | Yes      | `"console"`                                                             |             |
| `ordinal`       | Yes      | `number`                                                                |             |
| `source`        | Yes      | [BrowserActivityLocation](protocol.md#browseractivitylocation) / `null` |             |
| `timestamp`     | Yes      | `string`                                                                |             |

Variant 3: [BrowserActivitySocket](protocol.md#browseractivitysocket)

| Field       | Required | Type          | Description |
| ----------- | -------- | ------------- | ----------- |
| `bytes`     | Yes      | `string`      |             |
| `direction` | Yes      | `string`      |             |
| `kind`      | Yes      | `"websocket"` |             |
| `opcode`    | Yes      | `number`      |             |
| `ordinal`   | Yes      | `number`      |             |
| `requestId` | Yes      | `string`      |             |
| `timestamp` | Yes      | `string`      |             |
| `url`       | Yes      | `string`      |             |

Variant 4: [BrowserActivityNavigation](protocol.md#browseractivitynavigation)

| Field          | Required | Type           | Description |
| -------------- | -------- | -------------- | ----------- |
| `kind`         | Yes      | `"navigation"` |             |
| `ordinal`      | Yes      | `number`       |             |
| `sameDocument` | Yes      | `boolean`      |             |
| `url`          | Yes      | `string`       |             |

## BrowserActivityRequest

One request generation; reused CDP IDs retain distinct predecessors.

| Field                   | Required | Type                                                                    | Description |
| ----------------------- | -------- | ----------------------------------------------------------------------- | ----------- |
| `encodedBytes`          | Yes      | `null,string`                                                           |             |
| `failed`                | Yes      | `boolean`                                                               |             |
| `finished`              | Yes      | `boolean`                                                               |             |
| `frameId`               | Yes      | `string`                                                                |             |
| `initiator`             | Yes      | [BrowserActivityLocation](protocol.md#browseractivitylocation) / `null` |             |
| `kind`                  | Yes      | `"request"`                                                             |             |
| `method`                | Yes      | `string`                                                                |             |
| `mimeType`              | Yes      | `null,string`                                                           |             |
| `ordinal`               | Yes      | `number`                                                                |             |
| `redirectedTo`          | Yes      | `null,number`                                                           |             |
| `requestId`             | Yes      | `string`                                                                |             |
| `resourceType`          | Yes      | `string`                                                                |             |
| `reusedWithoutRedirect` | Yes      | `boolean`                                                               |             |
| `status`                | Yes      | `null,number`                                                           |             |
| `timestamp`             | Yes      | `string`                                                                |             |
| `url`                   | Yes      | `string`                                                                |             |

## BrowserActivitySocket

WebSocket payloads are reduced immediately to direction, opcode and byte count.

| Field       | Required | Type          | Description |
| ----------- | -------- | ------------- | ----------- |
| `bytes`     | Yes      | `string`      |             |
| `direction` | Yes      | `string`      |             |
| `kind`      | Yes      | `"websocket"` |             |
| `opcode`    | Yes      | `number`      |             |
| `ordinal`   | Yes      | `number`      |             |
| `requestId` | Yes      | `string`      |             |
| `timestamp` | Yes      | `string`      |             |
| `url`       | Yes      | `string`      |             |

## BrowserAnalysisInput

Body-free provenance links a derived shared analysis to the exact original browser capture.

| Field                    | Required | Type                                                           | Description                                                                   |
| ------------------------ | -------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `capturedAt`             | Yes      | `string`                                                       |                                                                               |
| `coverage`               | Yes      | [BrowserSourcesCoverage](protocol.md#browsersourcescoverage)   |                                                                               |
| `exportedFiles`          | Yes      | `string`                                                       |                                                                               |
| `frameId`                | Yes      | `string`                                                       |                                                                               |
| `importMap`              | No       | [BrowserAnalysisMapInput](protocol.md#browseranalysismapinput) | Body-free identity of an exact map member in the immutable analysis snapshot. |
| `includeSources`         | Yes      | `boolean`                                                      |                                                                               |
| `manifestBytes`          | Yes      | `string`                                                       |                                                                               |
| `manifestSha256`         | Yes      | `string`                                                       |                                                                               |
| `origin`                 | Yes      | `string`                                                       |                                                                               |
| `priorActivityAvailable` | Yes      | `false`                                                        |                                                                               |
| `provider`               | Yes      | `"cdp-passive"`                                                |                                                                               |
| `reference`              | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference) |                                                                               |
| `resourceCount`          | Yes      | `string`                                                       |                                                                               |
| `scriptCount`            | Yes      | `string`                                                       |                                                                               |
| `sourceRunSha256`        | Yes      | `string`                                                       |                                                                               |
| `targetId`               | Yes      | `string`                                                       |                                                                               |

## BrowserAnalysisMapInput

Body-free identity of an exact map member in the immutable analysis snapshot.

| Field      | Required | Type     | Description |
| ---------- | -------- | -------- | ----------- |
| `baseUrl`  | Yes      | `string` |             |
| `bytes`    | Yes      | `string` |             |
| `selector` | Yes      | `string` |             |
| `sha256`   | Yes      | `string` |             |

## BrowserAttributeName

An attribute directory contains names only.

| Field    | Required | Type          | Description |
| -------- | -------- | ------------- | ----------- |
| `index`  | Yes      | `number`      |             |
| `kind`   | Yes      | `"attribute"` |             |
| `name`   | Yes      | `string`      |             |
| `nodeId` | Yes      | `string`      |             |

## BrowserDomNode

DOM node identity is local to this capture, with attribute values and text excluded.

| Field             | Required | Type                                                 | Description |
| ----------------- | -------- | ---------------------------------------------------- | ----------- |
| `attributeCount`  | Yes      | `string`                                             |             |
| `backendNodeId`   | Yes      | `null,string`                                        |             |
| `childCount`      | Yes      | `string`                                             |             |
| `depth`           | Yes      | `number`                                             |             |
| `id`              | Yes      | `string`                                             |             |
| `kind`            | Yes      | `"dom"`                                              |             |
| `localName`       | Yes      | `string`                                             |             |
| `missingChildren` | Yes      | `string`                                             |             |
| `name`            | Yes      | `string`                                             |             |
| `nodeType`        | Yes      | `number`                                             |             |
| `parentId`        | Yes      | `null,string`                                        |             |
| `relation`        | Yes      | [BrowserDomRelation](protocol.md#browserdomrelation) |             |
| `valueLength`     | Yes      | `string`                                             |             |

## BrowserDomRelation

The containment relation preserves the difference between light DOM, shadow and embedded documents.

Type: `"child"` / `"content-document"` / `"document"` / `"imported-document"` / `"pseudo-element"` / `"shadow-root"` / `"template-content"`.

## BrowserModuleCandidateRow

Candidate metadata points to original source pages and never carries captured code.

| Field           | Required | Type                                                             | Description |
| --------------- | -------- | ---------------------------------------------------------------- | ----------- |
| `frameId`       | Yes      | `string`                                                         |             |
| `hasSourceUrl`  | Yes      | `boolean`                                                        |             |
| `id`            | Yes      | `string`                                                         |             |
| `isModule`      | Yes      | `boolean`                                                        |             |
| `kind`          | Yes      | `"candidate"`                                                    |             |
| `match`         | Yes      | [BrowserModuleMatch](protocol.md#browsermodulematch)             |             |
| `sourceBytes`   | Yes      | `null,string`                                                    |             |
| `sourceSha256`  | Yes      | `null,string`                                                    |             |
| `startColumn`   | Yes      | `number`                                                         |             |
| `startLine`     | Yes      | `number`                                                         |             |
| `state`         | Yes      | [BrowserScriptSourceState](protocol.md#browserscriptsourcestate) |             |
| `url`           | Yes      | `string`                                                         |             |
| `urlCharacters` | Yes      | `string`                                                         |             |

## BrowserModuleContext

Importer selection provenance never claims an observed installed runtime base.

Type: `"explicit-importer-url"` / `"reported-source-url"`.

## BrowserModuleDirectoryRow

One finite row in the selected saved directory.

Variant 1: [BrowserModuleImportRow](protocol.md#browsermoduleimportrow)

| Field                  | Required | Type                                                             | Description |
| ---------------------- | -------- | ---------------------------------------------------------------- | ----------- |
| `candidateCount`       | Yes      | `number`                                                         |             |
| `errorCharacters`      | Yes      | `null,string`                                                    |             |
| `errorMessage`         | Yes      | `null,string`                                                    |             |
| `errorName`            | Yes      | `null,string`                                                    |             |
| `execution`            | Yes      | `"unknown"`                                                      |             |
| `expression`           | Yes      | `null,string`                                                    |             |
| `expressionCharacters` | Yes      | `null,string`                                                    |             |
| `expressionTruncated`  | Yes      | `boolean`                                                        |             |
| `id`                   | Yes      | `string`                                                         |             |
| `kind`                 | Yes      | `"import"`                                                       |             |
| `location`             | Yes      | [BrowserModulePosition](protocol.md#browsermoduleposition)       |             |
| `specifier`            | Yes      | `null,string`                                                    |             |
| `specifierCharacters`  | Yes      | `null,string`                                                    |             |
| `status`               | Yes      | [BrowserModuleTraceStatus](protocol.md#browsermoduletracestatus) |             |
| `syntax`               | Yes      | `string`                                                         |             |
| `url`                  | Yes      | `null,string`                                                    |             |
| `urlCharacters`        | Yes      | `null,string`                                                    |             |

Variant 2: [BrowserModuleCandidateRow](protocol.md#browsermodulecandidaterow)

| Field           | Required | Type                                                             | Description |
| --------------- | -------- | ---------------------------------------------------------------- | ----------- |
| `frameId`       | Yes      | `string`                                                         |             |
| `hasSourceUrl`  | Yes      | `boolean`                                                        |             |
| `id`            | Yes      | `string`                                                         |             |
| `isModule`      | Yes      | `boolean`                                                        |             |
| `kind`          | Yes      | `"candidate"`                                                    |             |
| `match`         | Yes      | [BrowserModuleMatch](protocol.md#browsermodulematch)             |             |
| `sourceBytes`   | Yes      | `null,string`                                                    |             |
| `sourceSha256`  | Yes      | `null,string`                                                    |             |
| `startColumn`   | Yes      | `number`                                                         |             |
| `startLine`     | Yes      | `number`                                                         |             |
| `state`         | Yes      | [BrowserScriptSourceState](protocol.md#browserscriptsourcestate) |             |
| `url`           | Yes      | `string`                                                         |             |
| `urlCharacters` | Yes      | `string`                                                         |             |

## BrowserModuleImportRow

Literal identity and native errors are previews; exact fields are independently paged.

| Field                  | Required | Type                                                             | Description |
| ---------------------- | -------- | ---------------------------------------------------------------- | ----------- |
| `candidateCount`       | Yes      | `number`                                                         |             |
| `errorCharacters`      | Yes      | `null,string`                                                    |             |
| `errorMessage`         | Yes      | `null,string`                                                    |             |
| `errorName`            | Yes      | `null,string`                                                    |             |
| `execution`            | Yes      | `"unknown"`                                                      |             |
| `expression`           | Yes      | `null,string`                                                    |             |
| `expressionCharacters` | Yes      | `null,string`                                                    |             |
| `expressionTruncated`  | Yes      | `boolean`                                                        |             |
| `id`                   | Yes      | `string`                                                         |             |
| `kind`                 | Yes      | `"import"`                                                       |             |
| `location`             | Yes      | [BrowserModulePosition](protocol.md#browsermoduleposition)       |             |
| `specifier`            | Yes      | `null,string`                                                    |             |
| `specifierCharacters`  | Yes      | `null,string`                                                    |             |
| `status`               | Yes      | [BrowserModuleTraceStatus](protocol.md#browsermoduletracestatus) |             |
| `syntax`               | Yes      | `string`                                                         |             |
| `url`                  | Yes      | `null,string`                                                    |             |
| `urlCharacters`        | Yes      | `null,string`                                                    |             |

## BrowserModuleMatch

Captured URL match strength is independent of execution and content identity.

Type: `"exact-reported-url"` / `"response-url-without-fragment"`.

## BrowserModuleMetadata

Compact context previews identify exact text available through the text representation.

| Field                     | Required | Type                                                                          | Description |
| ------------------------- | -------- | ----------------------------------------------------------------------------- | ----------- |
| `context`                 | Yes      | [BrowserModuleContext](protocol.md#browsermodulecontext)                      |             |
| `engine`                  | Yes      | `"chromium-import-meta-resolve"`                                              |             |
| `engineVersion`           | Yes      | `null,string`                                                                 |             |
| `excludedNonEs`           | Yes      | `string`                                                                      |             |
| `excludedTypeOnly`        | Yes      | `string`                                                                      |             |
| `importCount`             | Yes      | `string`                                                                      |             |
| `importMapBaseCharacters` | Yes      | `null,string`                                                                 |             |
| `importMapBaseUrl`        | Yes      | `null,string`                                                                 |             |
| `importMapBytes`          | Yes      | `null,string`                                                                 |             |
| `importMapSha256`         | Yes      | `null,string`                                                                 |             |
| `importerCharacters`      | Yes      | `string`                                                                      |             |
| `importerUrl`             | Yes      | `string`                                                                      |             |
| `module`                  | Yes      | `string`                                                                      |             |
| `moduleCharacters`        | Yes      | `string`                                                                      |             |
| `parseError`              | Yes      | `null,string`                                                                 |             |
| `parseErrorCharacters`    | Yes      | `null,string`                                                                 |             |
| `sourceBytes`             | Yes      | `string`                                                                      |             |
| `sourceCapture`           | Yes      | [BrowserModuleSourceCapture](protocol.md#browsermodulesourcecapture) / `null` |             |
| `sourceSha256`            | Yes      | `string`                                                                      |             |

## BrowserModulePage

At most twenty previews or one bounded UTF-16 range, with immutable provenance.

| Field          | Required | Type                                                                                                                                                | Description |
| -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `cursor`       | Yes      | `string`                                                                                                                                            |             |
| `evidenceId`   | Yes      | `string`                                                                                                                                            |             |
| `field`        | Yes      | `"error-message"` / `"expression"` / `"importer-url"` / `"map-base-url"` / `"module"` / `"parse-error"` / `"resolved-url"` / `"specifier"` / `null` |             |
| `metadata`     | Yes      | [BrowserModuleMetadata](protocol.md#browsermodulemetadata)                                                                                          |             |
| `nextCursor`   | Yes      | `null,string`                                                                                                                                       |             |
| `records`      | Yes      | Array of [BrowserModuleDirectoryRow](protocol.md#browsermoduledirectoryrow)                                                                         |             |
| `reportSha256` | Yes      | `string`                                                                                                                                            |             |
| `runId`        | Yes      | `string`                                                                                                                                            |             |
| `selector`     | Yes      | `null,string`                                                                                                                                       |             |
| `sha256`       | Yes      | `string`                                                                                                                                            |             |
| `text`         | Yes      | `null,string`                                                                                                                                       |             |
| `textSha256`   | Yes      | `null,string`                                                                                                                                       |             |
| `total`        | Yes      | `string`                                                                                                                                            |             |
| `view`         | Yes      | [BrowserModuleView](protocol.md#browsermoduleview)                                                                                                  |             |

## BrowserModulePosition

Coordinates identify the exact selected source without repeating a long path in every row.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `column`    | Yes      | `number` |             |
| `end`       | Yes      | `number` |             |
| `endColumn` | Yes      | `number` |             |
| `endLine`   | Yes      | `number` |             |
| `line`      | Yes      | `number` |             |
| `start`     | Yes      | `number` |             |

## BrowserModuleQuery

Requests contain archive IDs, never workspace paths or URLs to fetch.

| Field        | Required | Type                                                                                                                                       | Description                                                         |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `cursor`     | No       | `string`                                                                                                                                   |                                                                     |
| `evidenceId` | Yes      | `string`                                                                                                                                   |                                                                     |
| `field`      | No       | `"error-message"` / `"expression"` / `"importer-url"` / `"map-base-url"` / `"module"` / `"parse-error"` / `"resolved-url"` / `"specifier"` | Full fields are read only after selecting an import or its context. |
| `id`         | Yes      | `string`                                                                                                                                   |                                                                     |
| `runId`      | Yes      | `string`                                                                                                                                   |                                                                     |
| `selector`   | No       | `string`                                                                                                                                   |                                                                     |
| `view`       | Yes      | [BrowserModuleView](protocol.md#browsermoduleview)                                                                                         |                                                                     |

## BrowserModuleSourceCapture

Original capture identity remains separate from derived analysis and report identities.

| Field           | Required | Type     | Description |
| --------------- | -------- | -------- | ----------- |
| `captureSha256` | Yes      | `string` |             |
| `evidenceId`    | Yes      | `string` |             |
| `runId`         | Yes      | `string` |             |
| `sha256`        | Yes      | `string` |             |

## BrowserModuleTraceStatus

Native URL evidence is distinct from computed syntax and runtime execution.

Type: `"computed-specifier"` / `"native-resolution"` / `"unsupported-literal"`.

## BrowserModuleView

Metadata directories and exact text have independent bounded cursors.

Type: `"candidates"` / `"imports"` / `"text"`.

## BrowserPageProjection

One passive structure inspection tied to a stable selected document.

| Field                    | Required | Type                                                                 | Description |
| ------------------------ | -------- | -------------------------------------------------------------------- | ----------- |
| `accessibility`          | Yes      | [BrowserStructureProjection](protocol.md#browserstructureprojection) |             |
| `capturedAt`             | Yes      | `string`                                                             |             |
| `dom`                    | Yes      | [BrowserStructureProjection](protocol.md#browserstructureprojection) |             |
| `frameId`                | Yes      | `string`                                                             |             |
| `limitations`            | Yes      | Array of `string`                                                    |             |
| `origin`                 | Yes      | `string`                                                             |             |
| `priorActivityAvailable` | Yes      | `false`                                                              |             |
| `provider`               | Yes      | `"cdp-passive"`                                                      |             |
| `targetId`               | Yes      | `string`                                                             |             |
| `url`                    | Yes      | `string`                                                             |             |

## BrowserPixelBounds

Pixel rectangle uses inclusive left/top and exclusive right/bottom coordinates.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `height` | Yes      | `number` |             |
| `width`  | Yes      | `number` |             |
| `x`      | Yes      | `number` |             |
| `y`      | Yes      | `number` |             |

## BrowserPixelComparison

Counts are decimal strings; averages retain all RGBA deltas, including tolerated pixels.

| Field                      | Required | Type                                                          | Description |
| -------------------------- | -------- | ------------------------------------------------------------- | ----------- |
| `absoluteChannelDelta`     | Yes      | `null,string`                                                 |             |
| `afterHeight`              | Yes      | `number`                                                      |             |
| `afterWidth`               | Yes      | `number`                                                      |             |
| `algorithm`                | Yes      | `"rgba-channel-v1"`                                           |             |
| `beforeHeight`             | Yes      | `number`                                                      |             |
| `beforeWidth`              | Yes      | `number`                                                      |             |
| `bounds`                   | Yes      | [BrowserPixelBounds](protocol.md#browserpixelbounds) / `null` |             |
| `changedPixels`            | Yes      | `null,string`                                                 |             |
| `changedRatio`             | Yes      | `null,number`                                                 |             |
| `channelThreshold`         | Yes      | `number`                                                      |             |
| `comparedPixels`           | Yes      | `string`                                                      |             |
| `maximumChannelDelta`      | Yes      | `null,number`                                                 |             |
| `meanAbsoluteChannelDelta` | Yes      | `null,number`                                                 |             |
| `status`                   | Yes      | [BrowserPixelStatus](protocol.md#browserpixelstatus)          |             |

## BrowserPixelStatus

Pixel outcomes keep tolerated changes separate from exact equality.

Type: `"different"` / `"dimension-mismatch"` / `"identical"` / `"within-threshold"`.

## BrowserSchemaProperty

Schema keys are retained as escaped JSON pointers; leaf values are excluded.

| Field          | Required | Type                                                        | Description |
| -------------- | -------- | ----------------------------------------------------------- | ----------- |
| `id`           | Yes      | `string`                                                    |             |
| `observations` | Yes      | `string`                                                    |             |
| `path`         | Yes      | `string`                                                    |             |
| `types`        | Yes      | Array of [BrowserSchemaType](protocol.md#browserschematype) |             |

## BrowserSchemaSummary

Structural coverage reports a finite observed schema traversal rather than parameter validation.

| Field           | Required | Type                                               | Description |
| --------------- | -------- | -------------------------------------------------- | ----------- |
| `complete`      | Yes      | `boolean`                                          |             |
| `maximumDepth`  | Yes      | `number`                                           |             |
| `nodeCount`     | Yes      | `string`                                           |             |
| `propertyCount` | Yes      | `string`                                           |             |
| `rootType`      | Yes      | [BrowserSchemaType](protocol.md#browserschematype) |             |

## BrowserSchemaType

Value-free schema summaries use the native JSON value vocabulary.

Type: `"array"` / `"boolean"` / `"null"` / `"number"` / `"object"` / `"string"`.

## BrowserScreenshotComparisonSnapshot

Body-free progress also identifies the archived comparison report.

| Field       | Required | Type                                                                               | Description |
| ----------- | -------- | ---------------------------------------------------------------------------------- | ----------- |
| `after`     | Yes      | [BrowserScreenshotComparisonSource](protocol.md#browserscreenshotcomparisonsource) |             |
| `before`    | Yes      | [BrowserScreenshotComparisonSource](protocol.md#browserscreenshotcomparisonsource) |             |
| `metrics`   | Yes      | [BrowserPixelComparison](protocol.md#browserpixelcomparison)                       |             |
| `reference` | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference)                     |             |

## BrowserScreenshotComparisonSource

Comparison retains each original capture and image digest separately.

| Field       | Required | Type                                                               | Description |
| ----------- | -------- | ------------------------------------------------------------------ | ----------- |
| `metadata`  | Yes      | [BrowserScreenshotMetadata](protocol.md#browserscreenshotmetadata) |             |
| `reference` | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference)     |             |
| `sha256`    | Yes      | `string`                                                           |             |

## BrowserScreenshotMetadata

Image-free historical receipt for one explicitly requested visible viewport.

| Field        | Required | Type                                                               | Description |
| ------------ | -------- | ------------------------------------------------------------------ | ----------- |
| `bytes`      | Yes      | `string`                                                           |             |
| `capturedAt` | Yes      | `string`                                                           |             |
| `coverage`   | Yes      | `"visible-viewport"`                                               |             |
| `frameId`    | Yes      | `string`                                                           |             |
| `height`     | Yes      | `number`                                                           |             |
| `mimeType`   | Yes      | `"image/png"`                                                      |             |
| `origin`     | Yes      | `string`                                                           |             |
| `provider`   | Yes      | `"cdp-passive"`                                                    |             |
| `sha256`     | Yes      | `string`                                                           |             |
| `targetId`   | Yes      | `string`                                                           |             |
| `viewport`   | Yes      | [BrowserScreenshotViewport](protocol.md#browserscreenshotviewport) |             |
| `width`      | Yes      | `number`                                                           |             |

## BrowserScreenshotPage

Capture and PNG digests identify different immutable artifacts.

| Field           | Required | Type                                                               | Description |
| --------------- | -------- | ------------------------------------------------------------------ | ----------- |
| `captureSha256` | Yes      | `string`                                                           |             |
| `cursor`        | Yes      | `string`                                                           |             |
| `data`          | Yes      | `null,string`                                                      |             |
| `evidenceId`    | Yes      | `string`                                                           |             |
| `metadata`      | Yes      | [BrowserScreenshotMetadata](protocol.md#browserscreenshotmetadata) |             |
| `nextCursor`    | Yes      | `null,string`                                                      |             |
| `runId`         | Yes      | `string`                                                           |             |
| `sha256`        | Yes      | `string`                                                           |             |
| `view`          | Yes      | [BrowserScreenshotView](protocol.md#browserscreenshotview)         |             |

## BrowserScreenshotQuery

Saved image reads accept archive IDs and canonical byte offsets, never URLs or files.

| Field        | Required | Type                                                       | Description |
| ------------ | -------- | ---------------------------------------------------------- | ----------- |
| `cursor`     | No       | `string`                                                   |             |
| `evidenceId` | Yes      | `string`                                                   |             |
| `id`         | Yes      | `string`                                                   |             |
| `runId`      | Yes      | `string`                                                   |             |
| `view`       | Yes      | [BrowserScreenshotView](protocol.md#browserscreenshotview) |             |

## BrowserScreenshotSnapshot

Progress retains an owner-bound archive identity without any image data.

| Field        | Required | Type                                                               | Description |
| ------------ | -------- | ------------------------------------------------------------------ | ----------- |
| `bytes`      | Yes      | `string`                                                           |             |
| `capturedAt` | Yes      | `string`                                                           |             |
| `coverage`   | Yes      | `"visible-viewport"`                                               |             |
| `frameId`    | Yes      | `string`                                                           |             |
| `height`     | Yes      | `number`                                                           |             |
| `mimeType`   | Yes      | `"image/png"`                                                      |             |
| `origin`     | Yes      | `string`                                                           |             |
| `provider`   | Yes      | `"cdp-passive"`                                                    |             |
| `reference`  | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference)     |             |
| `sha256`     | Yes      | `string`                                                           |             |
| `targetId`   | Yes      | `string`                                                           |             |
| `viewport`   | Yes      | [BrowserScreenshotViewport](protocol.md#browserscreenshotviewport) |             |
| `width`      | Yes      | `number`                                                           |             |

## BrowserScreenshotView

Metadata reads contain no pixels; selected image pages contain at most 49152 decoded bytes.

Type: `"image"` / `"metadata"`.

## BrowserScreenshotViewport

CSS viewport coordinates are separate from the PNG's physical pixel dimensions.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `height` | Yes      | `number` |             |
| `pageX`  | Yes      | `number` |             |
| `pageY`  | Yes      | `number` |             |
| `scale`  | Yes      | `number` |             |
| `width`  | Yes      | `number` |             |

## BrowserScriptSourceMap

A source-map declaration is retained independently of fetched or decoded map coverage.

| Field               | Required | Type          | Description |
| ------------------- | -------- | ------------- | ----------- |
| `declarationLength` | Yes      | `string`      |             |
| `declarationSha256` | Yes      | `string`      |             |
| `inline`            | Yes      | `boolean`     |             |
| `url`               | Yes      | `null,string` |             |

## BrowserScriptSourceState

Source coverage is separate from script inventory and resource presence.

Type: `"budget-exhausted"` / `"captured"` / `"non-javascript"` / `"not-selected"`.

## BrowserSourceDirectoryRow

Finite source directory rows are independently paged from text.

Variant 1: [BrowserSourceScriptRow](protocol.md#browsersourcescriptrow)

| Field              | Required | Type                                                                   | Description |
| ------------------ | -------- | ---------------------------------------------------------------------- | ----------- |
| `cdpHash`          | Yes      | `null,string`                                                          |             |
| `endColumn`        | Yes      | `number`                                                               |             |
| `endLine`          | Yes      | `number`                                                               |             |
| `frameId`          | Yes      | `string`                                                               |             |
| `hasSourceUrl`     | Yes      | `boolean`                                                              |             |
| `id`               | Yes      | `string`                                                               |             |
| `isModule`         | Yes      | `boolean`                                                              |             |
| `kind`             | Yes      | `"script"`                                                             |             |
| `language`         | Yes      | `string`                                                               |             |
| `length`           | Yes      | `null,string`                                                          |             |
| `resourceIds`      | Yes      | Array of `string`                                                      |             |
| `source`           | Yes      | [OmitBrowserScriptSourcetext](protocol.md#omitbrowserscriptsourcetext) |             |
| `sourceMap`        | Yes      | [BrowserScriptSourceMap](protocol.md#browserscriptsourcemap) / `null`  |             |
| `sourceMapOmitted` | Yes      | `boolean`                                                              |             |
| `startColumn`      | Yes      | `number`                                                               |             |
| `startLine`        | Yes      | `number`                                                               |             |
| `url`              | Yes      | `string`                                                               |             |

Variant 2: [BrowserSourceResourceRow](protocol.md#browsersourceresourcerow)

| Field         | Required | Type          | Description |
| ------------- | -------- | ------------- | ----------- |
| `canceled`    | Yes      | `boolean`     |             |
| `contentSize` | Yes      | `null,string` |             |
| `failed`      | Yes      | `boolean`     |             |
| `frameId`     | Yes      | `string`      |             |
| `id`          | Yes      | `string`      |             |
| `kind`        | Yes      | `"resource"`  |             |
| `mimeType`    | Yes      | `string`      |             |
| `type`        | Yes      | `string`      |             |
| `url`         | Yes      | `string`      |             |

## BrowserSourceResourceRow

Resource metadata remains distinct from a script artifact or execution observation.

| Field         | Required | Type          | Description |
| ------------- | -------- | ------------- | ----------- |
| `canceled`    | Yes      | `boolean`     |             |
| `contentSize` | Yes      | `null,string` |             |
| `failed`      | Yes      | `boolean`     |             |
| `frameId`     | Yes      | `string`      |             |
| `id`          | Yes      | `string`      |             |
| `kind`        | Yes      | `"resource"`  |             |
| `mimeType`    | Yes      | `string`      |             |
| `type`        | Yes      | `string`      |             |
| `url`         | Yes      | `string`      |             |

## BrowserSourceScriptRow

A directory script row has source identity and coverage, without the source body.

| Field              | Required | Type                                                                   | Description |
| ------------------ | -------- | ---------------------------------------------------------------------- | ----------- |
| `cdpHash`          | Yes      | `null,string`                                                          |             |
| `endColumn`        | Yes      | `number`                                                               |             |
| `endLine`          | Yes      | `number`                                                               |             |
| `frameId`          | Yes      | `string`                                                               |             |
| `hasSourceUrl`     | Yes      | `boolean`                                                              |             |
| `id`               | Yes      | `string`                                                               |             |
| `isModule`         | Yes      | `boolean`                                                              |             |
| `kind`             | Yes      | `"script"`                                                             |             |
| `language`         | Yes      | `string`                                                               |             |
| `length`           | Yes      | `null,string`                                                          |             |
| `resourceIds`      | Yes      | Array of `string`                                                      |             |
| `source`           | Yes      | [OmitBrowserScriptSourcetext](protocol.md#omitbrowserscriptsourcetext) |             |
| `sourceMap`        | Yes      | [BrowserScriptSourceMap](protocol.md#browserscriptsourcemap) / `null`  |             |
| `sourceMapOmitted` | Yes      | `boolean`                                                              |             |
| `startColumn`      | Yes      | `number`                                                               |             |
| `startLine`        | Yes      | `number`                                                               |             |
| `url`              | Yes      | `string`                                                               |             |

## BrowserSourcesCoverage

Coverage counters describe observations, including repeats rejected before identity retention.

| Field                        | Required | Type      | Description |
| ---------------------------- | -------- | --------- | ----------- |
| `capturedSources`            | Yes      | `string`  |             |
| `excludedFrames`             | Yes      | `boolean` |             |
| `excludedResources`          | Yes      | `string`  |             |
| `excludedScriptObservations` | Yes      | `string`  |             |
| `omittedScriptObservations`  | Yes      | `string`  |             |
| `partial`                    | Yes      | `boolean` |             |
| `sourceBytes`                | Yes      | `string`  |             |

## BrowserSourcesPage

Source pages use exact UTF-16 offsets and retain the complete source's UTF-8 digest/byte count.

| Field           | Required | Type                                                                        | Description |
| --------------- | -------- | --------------------------------------------------------------------------- | ----------- |
| `captureSha256` | Yes      | `string`                                                                    |             |
| `cursor`        | Yes      | `string`                                                                    |             |
| `evidenceId`    | Yes      | `string`                                                                    |             |
| `metadata`      | Yes      | [BrowserSourcesProjection](protocol.md#browsersourcesprojection)            |             |
| `nextCursor`    | Yes      | `null,string`                                                               |             |
| `records`       | Yes      | Array of [BrowserSourceDirectoryRow](protocol.md#browsersourcedirectoryrow) |             |
| `runId`         | Yes      | `string`                                                                    |             |
| `selector`      | Yes      | `null,string`                                                               |             |
| `sha256`        | Yes      | `string`                                                                    |             |
| `sourceBytes`   | Yes      | `null,string`                                                               |             |
| `sourceSha256`  | Yes      | `null,string`                                                               |             |
| `text`          | Yes      | `null,string`                                                               |             |
| `total`         | Yes      | `string`                                                                    |             |
| `view`          | Yes      | [BrowserSourcesView](protocol.md#browsersourcesview)                        |             |

## BrowserSourcesProjection

Source progress carries coverage and counts without code or full inventories.

| Field                    | Required | Type                                                         | Description |
| ------------------------ | -------- | ------------------------------------------------------------ | ----------- |
| `capturedAt`             | Yes      | `string`                                                     |             |
| `coverage`               | Yes      | [BrowserSourcesCoverage](protocol.md#browsersourcescoverage) |             |
| `frameId`                | Yes      | `string`                                                     |             |
| `includeSources`         | Yes      | `boolean`                                                    |             |
| `origin`                 | Yes      | `string`                                                     |             |
| `priorActivityAvailable` | Yes      | `false`                                                      |             |
| `provider`               | Yes      | `"cdp-passive"`                                              |             |
| `resourceCount`          | Yes      | `string`                                                     |             |
| `scriptCount`            | Yes      | `string`                                                     |             |
| `targetId`               | Yes      | `string`                                                     |             |

## BrowserSourcesQuery

Saved source selectors carry IDs and offsets, never sockets, capabilities or workspace paths.

| Field        | Required | Type                                                 | Description |
| ------------ | -------- | ---------------------------------------------------- | ----------- |
| `cursor`     | No       | `string`                                             |             |
| `evidenceId` | Yes      | `string`                                             |             |
| `id`         | Yes      | `string`                                             |             |
| `runId`      | Yes      | `string`                                             |             |
| `selector`   | No       | `string`                                             |             |
| `view`       | Yes      | [BrowserSourcesView](protocol.md#browsersourcesview) |             |

## BrowserSourcesSnapshot

A native source capture references one immutable owner-scoped archive.

| Field                    | Required | Type                                                           | Description |
| ------------------------ | -------- | -------------------------------------------------------------- | ----------- |
| `capturedAt`             | Yes      | `string`                                                       |             |
| `coverage`               | Yes      | [BrowserSourcesCoverage](protocol.md#browsersourcescoverage)   |             |
| `frameId`                | Yes      | `string`                                                       |             |
| `includeSources`         | Yes      | `boolean`                                                      |             |
| `origin`                 | Yes      | `string`                                                       |             |
| `priorActivityAvailable` | Yes      | `false`                                                        |             |
| `provider`               | Yes      | `"cdp-passive"`                                                |             |
| `reference`              | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference) |             |
| `resourceCount`          | Yes      | `string`                                                       |             |
| `scriptCount`            | Yes      | `string`                                                       |             |
| `targetId`               | Yes      | `string`                                                       |             |

## BrowserSourcesView

Metadata and source content are selected independently, with distinct cursors.

Type: `"resources"` / `"scripts"` / `"source"`.

## BrowserStorageChange

Stable comparison ordinals refer to the original saved rows without returning their values.

| Field    | Required | Type                                                             | Description |
| -------- | -------- | ---------------------------------------------------------------- | ----------- |
| `after`  | Yes      | [BrowserStorageRow](protocol.md#browserstoragerow) / `null`      |             |
| `before` | Yes      | [BrowserStorageRow](protocol.md#browserstoragerow) / `null`      |             |
| `change` | Yes      | [BrowserStorageChangeKind](protocol.md#browserstoragechangekind) |             |
| `group`  | Yes      | [BrowserStorageGroup](protocol.md#browserstoragegroup)           |             |
| `id`     | Yes      | `string`                                                         |             |

## BrowserStorageChangeKind

Absence becomes a change only when both inventories are complete.

Type: `"added"` / `"modified"` / `"removed"`.

## BrowserStorageCompareMode

Independent opt-ins determine whether content or only a name inventory can be compared.

Type: `"fingerprints"` / `"names"` / `"unavailable"`.

## BrowserStorageCompareStatus

Matching observations prove equality only within their declared complete coverage.

Type: `"changed"` / `"unchanged"` / `"unknown"`.

## BrowserStorageComparison

Progress includes counters and provenance while changes stay in independently paged evidence.

| Field             | Required | Type                                                                                                                         | Description |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `after`           | Yes      | [BrowserStorageComparisonSource](protocol.md#browserstoragecomparisonsource)                                                 |             |
| `algorithm`       | Yes      | `"storage-observations-v1"`                                                                                                  |             |
| `before`          | Yes      | [BrowserStorageComparisonSource](protocol.md#browserstoragecomparisonsource)                                                 |             |
| `complete`        | Yes      | `boolean`                                                                                                                    |             |
| `detailsComplete` | Yes      | `boolean`                                                                                                                    |             |
| `groups`          | Yes      | [RecordBrowserStorageGroupBrowserStorageGroupComparison](protocol.md#recordbrowserstoragegroupbrowserstoragegroupcomparison) |             |
| `limitations`     | Yes      | Array of `string`                                                                                                            |             |
| `quota`           | Yes      | [BrowserStorageQuotaComparison](protocol.md#browserstoragequotacomparison)                                                   |             |
| `status`          | Yes      | [BrowserStorageCompareStatus](protocol.md#browserstoragecomparestatus)                                                       |             |

## BrowserStorageComparisonPage

Header reads contain no changes; store reads return at most twenty directly indexed differences.

| Field           | Required | Type                                                                                                | Description |
| --------------- | -------- | --------------------------------------------------------------------------------------------------- | ----------- |
| `captureSha256` | Yes      | `string`                                                                                            |             |
| `changes`       | Yes      | Array of [BrowserStorageChange](protocol.md#browserstoragechange)                                   |             |
| `comparison`    | Yes      | [BrowserStorageComparison](protocol.md#browserstoragecomparison)                                    |             |
| `cursor`        | Yes      | `string`                                                                                            |             |
| `evidenceId`    | Yes      | `string`                                                                                            |             |
| `group`         | Yes      | `"cache-storage"` / `"cookies"` / `"indexed-db"` / `"local-storage"` / `"session-storage"` / `null` |             |
| `nextCursor`    | Yes      | `null,string`                                                                                       |             |
| `runId`         | Yes      | `string`                                                                                            |             |
| `sha256`        | Yes      | `string`                                                                                            |             |

## BrowserStorageComparisonQuery

A comparison directory selects one store and a retained-change ordinal, independently from text offsets.

| Field        | Required | Type                                                                                       | Description                                                 |
| ------------ | -------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `cursor`     | No       | `string`                                                                                   |                                                             |
| `evidenceId` | Yes      | `string`                                                                                   |                                                             |
| `group`      | No       | `"cache-storage"` / `"cookies"` / `"indexed-db"` / `"local-storage"` / `"session-storage"` | Each storage authority has independently reported coverage. |
| `id`         | Yes      | `string`                                                                                   |                                                             |
| `runId`      | Yes      | `string`                                                                                   |                                                             |

## BrowserStorageComparisonSnapshot

Archived progress binds the report itself independently of its two source captures.

| Field             | Required | Type                                                                                                                         | Description |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `after`           | Yes      | [BrowserStorageComparisonSource](protocol.md#browserstoragecomparisonsource)                                                 |             |
| `algorithm`       | Yes      | `"storage-observations-v1"`                                                                                                  |             |
| `before`          | Yes      | [BrowserStorageComparisonSource](protocol.md#browserstoragecomparisonsource)                                                 |             |
| `complete`        | Yes      | `boolean`                                                                                                                    |             |
| `detailsComplete` | Yes      | `boolean`                                                                                                                    |             |
| `groups`          | Yes      | [RecordBrowserStorageGroupBrowserStorageGroupComparison](protocol.md#recordbrowserstoragegroupbrowserstoragegroupcomparison) |             |
| `limitations`     | Yes      | Array of `string`                                                                                                            |             |
| `quota`           | Yes      | [BrowserStorageQuotaComparison](protocol.md#browserstoragequotacomparison)                                                   |             |
| `reference`       | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference)                                                               |             |
| `status`          | Yes      | [BrowserStorageCompareStatus](protocol.md#browserstoragecomparestatus)                                                       |             |

## BrowserStorageComparisonSource

Body-free source provenance retains the independent run and original capture hashes.

| Field       | Required | Type                                                           | Description |
| ----------- | -------- | -------------------------------------------------------------- | ----------- |
| `metadata`  | Yes      | [BrowserStorageMetadata](protocol.md#browserstoragemetadata)   |             |
| `reference` | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference) |             |
| `sha256`    | Yes      | `string`                                                       |             |

## BrowserStorageCoverage

Omitted rows or observed mutations prevent completeness claims.

| Field                  | Required | Type      | Description |
| ---------------------- | -------- | --------- | ----------- |
| `available`            | Yes      | `boolean` |             |
| `changedDuringCapture` | Yes      | `boolean` |             |
| `complete`             | Yes      | `boolean` |             |
| `omitted`              | Yes      | `string`  |             |
| `rows`                 | Yes      | `string`  |             |
| `selected`             | Yes      | `boolean` |             |

## BrowserStorageGroup

Each storage authority has independently reported coverage.

Type: `"cache-storage"` / `"cookies"` / `"indexed-db"` / `"local-storage"` / `"session-storage"`.

## BrowserStorageGroupComparison

Decimal counts cover all proven differences even if the bounded detail inventory is truncated.

| Field                 | Required | Type                                                                   | Description |
| --------------------- | -------- | ---------------------------------------------------------------------- | ----------- |
| `added`               | Yes      | `string`                                                               |             |
| `ambiguousIdentities` | Yes      | `string`                                                               |             |
| `complete`            | Yes      | `boolean`                                                              |             |
| `mode`                | Yes      | [BrowserStorageCompareMode](protocol.md#browserstoragecomparemode)     |             |
| `modified`            | Yes      | `string`                                                               |             |
| `omittedChanges`      | Yes      | `string`                                                               |             |
| `reason`              | Yes      | `null,string`                                                          |             |
| `removed`             | Yes      | `string`                                                               |             |
| `retainedChanges`     | Yes      | `string`                                                               |             |
| `status`              | Yes      | [BrowserStorageCompareStatus](protocol.md#browserstoragecomparestatus) |             |
| `totalChanges`        | Yes      | `string`                                                               |             |
| `unchanged`           | Yes      | `string`                                                               |             |

## BrowserStorageKind

A row distinguishes store existence, schema and record fingerprints.

Type: `"cache-entry"` / `"name"` / `"record"` / `"schema"` / `"value"`.

## BrowserStorageMetadata

Projected capture identity includes no key/value bodies or unselected names.

| Field                  | Required | Type                                                                                                           | Description |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| `capturedAt`           | Yes      | `string`                                                                                                       |             |
| `coverage`             | Yes      | [RecordBrowserStorageGroupBrowserStorageCoverage](protocol.md#recordbrowserstoragegroupbrowserstoragecoverage) |             |
| `fingerprintAlgorithm` | Yes      | `"sha256-canonical-json-v1"`                                                                                   |             |
| `fingerprintsComplete` | Yes      | `boolean`                                                                                                      |             |
| `frameId`              | Yes      | `string`                                                                                                       |             |
| `includeFingerprints`  | Yes      | `boolean`                                                                                                      |             |
| `includeNames`         | Yes      | `boolean`                                                                                                      |             |
| `limitations`          | Yes      | Array of `string`                                                                                              |             |
| `origin`               | Yes      | `string`                                                                                                       |             |
| `provider`             | Yes      | `"cdp-passive"`                                                                                                |             |
| `quota`                | Yes      | [BrowserStorageQuota](protocol.md#browserstoragequota)                                                         |             |
| `targetId`             | Yes      | `string`                                                                                                       |             |
| `url`                  | Yes      | `string`                                                                                                       |             |
| `valuesRedacted`       | Yes      | `true`                                                                                                         |             |

## BrowserStoragePage

Metadata-only reads omit a group; selected groups contain at most twenty rows.

| Field           | Required | Type                                                                                                | Description |
| --------------- | -------- | --------------------------------------------------------------------------------------------------- | ----------- |
| `captureSha256` | Yes      | `string`                                                                                            |             |
| `cursor`        | Yes      | `string`                                                                                            |             |
| `evidenceId`    | Yes      | `string`                                                                                            |             |
| `group`         | Yes      | `"cache-storage"` / `"cookies"` / `"indexed-db"` / `"local-storage"` / `"session-storage"` / `null` |             |
| `metadata`      | Yes      | [BrowserStorageMetadata](protocol.md#browserstoragemetadata)                                        |             |
| `nextCursor`    | Yes      | `null,string`                                                                                       |             |
| `rows`          | Yes      | Array of [BrowserStorageRow](protocol.md#browserstoragerow)                                         |             |
| `runId`         | Yes      | `string`                                                                                            |             |
| `sha256`        | Yes      | `string`                                                                                            |             |

## BrowserStorageQuery

Saved rows select one storage group with independent ordinal paging.

| Field        | Required | Type                                                                                       | Description                                                 |
| ------------ | -------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `cursor`     | No       | `string`                                                                                   |                                                             |
| `evidenceId` | Yes      | `string`                                                                                   |                                                             |
| `group`      | No       | `"cache-storage"` / `"cookies"` / `"indexed-db"` / `"local-storage"` / `"session-storage"` | Each storage authority has independently reported coverage. |
| `id`         | Yes      | `string`                                                                                   |                                                             |
| `runId`      | Yes      | `string`                                                                                   |                                                             |

## BrowserStorageQuota

Quota byte counts retain exact validated integer representations.

| Field        | Required | Type          | Description |
| ------------ | -------- | ------------- | ----------- |
| `available`  | Yes      | `boolean`     |             |
| `quotaBytes` | Yes      | `null,string` |             |
| `usageBytes` | Yes      | `null,string` |             |

## BrowserStorageQuotaComparison

Byte deltas are exact signed integers and are available only for the same reported origin.

| Field             | Required | Type                                                                   | Description |
| ----------------- | -------- | ---------------------------------------------------------------------- | ----------- |
| `quotaDeltaBytes` | Yes      | `null,string`                                                          |             |
| `status`          | Yes      | [BrowserStorageCompareStatus](protocol.md#browserstoragecomparestatus) |             |
| `usageDeltaBytes` | Yes      | `null,string`                                                          |             |

## BrowserStorageRow

Names appear only when selected; hashes identify data without returning its values.

| Field            | Required | Type                                                   | Description |
| ---------------- | -------- | ------------------------------------------------------ | ----------- |
| `complete`       | Yes      | `boolean`                                              |             |
| `group`          | Yes      | [BrowserStorageGroup](protocol.md#browserstoragegroup) |             |
| `id`             | Yes      | `string`                                               |             |
| `identitySha256` | Yes      | `null,string`                                          |             |
| `kind`           | Yes      | [BrowserStorageKind](protocol.md#browserstoragekind)   |             |
| `name`           | Yes      | `null,string`                                          |             |
| `valueSha256`    | Yes      | `null,string`                                          |             |

## BrowserStorageSnapshot

Progress identifies a saved redacted capture without embedding its rows.

| Field                  | Required | Type                                                                                                           | Description |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| `capturedAt`           | Yes      | `string`                                                                                                       |             |
| `coverage`             | Yes      | [RecordBrowserStorageGroupBrowserStorageCoverage](protocol.md#recordbrowserstoragegroupbrowserstoragecoverage) |             |
| `fingerprintAlgorithm` | Yes      | `"sha256-canonical-json-v1"`                                                                                   |             |
| `fingerprintsComplete` | Yes      | `boolean`                                                                                                      |             |
| `frameId`              | Yes      | `string`                                                                                                       |             |
| `includeFingerprints`  | Yes      | `boolean`                                                                                                      |             |
| `includeNames`         | Yes      | `boolean`                                                                                                      |             |
| `limitations`          | Yes      | Array of `string`                                                                                              |             |
| `origin`               | Yes      | `string`                                                                                                       |             |
| `provider`             | Yes      | `"cdp-passive"`                                                                                                |             |
| `quota`                | Yes      | [BrowserStorageQuota](protocol.md#browserstoragequota)                                                         |             |
| `reference`            | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference)                                                 |             |
| `targetId`             | Yes      | `string`                                                                                                       |             |
| `url`                  | Yes      | `string`                                                                                                       |             |
| `valuesRedacted`       | Yes      | `true`                                                                                                         |             |

## BrowserStructureCount

Value-free DOM tag and accessibility role counts.

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `count` | Yes      | `string` |             |
| `name`  | Yes      | `string` |             |

## BrowserStructurePage

One independently selected, bounded topology or attribute directory.

| Field           | Required | Type                                                            | Description |
| --------------- | -------- | --------------------------------------------------------------- | ----------- |
| `captureSha256` | Yes      | `string`                                                        |             |
| `cursor`        | Yes      | `string`                                                        |             |
| `evidenceId`    | Yes      | `string`                                                        |             |
| `metadata`      | Yes      | [BrowserPageProjection](protocol.md#browserpageprojection)      |             |
| `nextCursor`    | Yes      | `null,string`                                                   |             |
| `records`       | Yes      | Array of [BrowserStructureRow](protocol.md#browserstructurerow) |             |
| `runId`         | Yes      | `string`                                                        |             |
| `selector`      | Yes      | `string`                                                        |             |
| `sha256`        | Yes      | `string`                                                        |             |
| `total`         | Yes      | `string`                                                        |             |
| `view`          | Yes      | [BrowserStructureView](protocol.md#browserstructureview)        |             |

## BrowserStructureProjection

Bounded structure coverage does not imply that page text or earlier activity was inspected.

| Field                 | Required | Type                                                                | Description |
| --------------------- | -------- | ------------------------------------------------------------------- | ----------- |
| `available`           | Yes      | `boolean`                                                           |             |
| `countPreviewPartial` | Yes      | `boolean`                                                           |             |
| `counts`              | Yes      | Array of [BrowserStructureCount](protocol.md#browserstructurecount) |             |
| `nodes`               | Yes      | `string`                                                            |             |
| `partial`             | Yes      | `boolean`                                                           |             |

## BrowserStructureQuery

Selectors are all, roots, node:ID, children:ID or attributes:ID; authority is never supplied by a selector.

| Field        | Required | Type                                                     | Description |
| ------------ | -------- | -------------------------------------------------------- | ----------- |
| `cursor`     | No       | `string`                                                 |             |
| `evidenceId` | Yes      | `string`                                                 |             |
| `id`         | Yes      | `string`                                                 |             |
| `runId`      | Yes      | `string`                                                 |             |
| `selector`   | No       | `string`                                                 |             |
| `view`       | Yes      | [BrowserStructureView](protocol.md#browserstructureview) |             |

## BrowserStructureRow

Each response row has an explicit representation discriminator.

Variant 1: [BrowserDomNode](protocol.md#browserdomnode)

| Field             | Required | Type                                                 | Description |
| ----------------- | -------- | ---------------------------------------------------- | ----------- |
| `attributeCount`  | Yes      | `string`                                             |             |
| `backendNodeId`   | Yes      | `null,string`                                        |             |
| `childCount`      | Yes      | `string`                                             |             |
| `depth`           | Yes      | `number`                                             |             |
| `id`              | Yes      | `string`                                             |             |
| `kind`            | Yes      | `"dom"`                                              |             |
| `localName`       | Yes      | `string`                                             |             |
| `missingChildren` | Yes      | `string`                                             |             |
| `name`            | Yes      | `string`                                             |             |
| `nodeType`        | Yes      | `number`                                             |             |
| `parentId`        | Yes      | `null,string`                                        |             |
| `relation`        | Yes      | [BrowserDomRelation](protocol.md#browserdomrelation) |             |
| `valueLength`     | Yes      | `string`                                             |             |

Variant 2: [BrowserAccessibilityNode](protocol.md#browseraccessibilitynode)

| Field             | Required | Type              | Description |
| ----------------- | -------- | ----------------- | ----------- |
| `backendNodeId`   | Yes      | `null,string`     |             |
| `childCount`      | Yes      | `string`          |             |
| `depth`           | Yes      | `null,number`     |             |
| `id`              | Yes      | `string`          |             |
| `ignored`         | Yes      | `boolean`         |             |
| `kind`            | Yes      | `"accessibility"` |             |
| `missingChildren` | Yes      | `string`          |             |
| `parentId`        | Yes      | `null,string`     |             |
| `role`            | Yes      | `null,string`     |             |

Variant 3: [BrowserAttributeName](protocol.md#browserattributename)

| Field    | Required | Type          | Description |
| -------- | -------- | ------------- | ----------- |
| `index`  | Yes      | `number`      |             |
| `kind`   | Yes      | `"attribute"` |             |
| `name`   | Yes      | `string`      |             |
| `nodeId` | Yes      | `string`      |             |

## BrowserStructureSnapshot

A progress receipt references structure without carrying complete trees.

| Field                    | Required | Type                                                                 | Description |
| ------------------------ | -------- | -------------------------------------------------------------------- | ----------- |
| `accessibility`          | Yes      | [BrowserStructureProjection](protocol.md#browserstructureprojection) |             |
| `capturedAt`             | Yes      | `string`                                                             |             |
| `dom`                    | Yes      | [BrowserStructureProjection](protocol.md#browserstructureprojection) |             |
| `frameId`                | Yes      | `string`                                                             |             |
| `limitations`            | Yes      | Array of `string`                                                    |             |
| `origin`                 | Yes      | `string`                                                             |             |
| `priorActivityAvailable` | Yes      | `false`                                                              |             |
| `provider`               | Yes      | `"cdp-passive"`                                                      |             |
| `reference`              | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference)       |             |
| `targetId`               | Yes      | `string`                                                             |             |
| `url`                    | Yes      | `string`                                                             |             |

## BrowserStructureView

Independent tree representations use the same immutable document capture.

Type: `"accessibility"` / `"dom"`.

## BrowserWebMcpAnnotations

Page-provided booleans remain untrusted annotations, never authorization decisions.

| Field              | Required | Type           | Description |
| ------------------ | -------- | -------------- | ----------- |
| `autosubmit`       | Yes      | `null,boolean` |             |
| `consequential`    | Yes      | `null,boolean` |             |
| `debugging`        | Yes      | `null,boolean` |             |
| `readOnly`         | Yes      | `null,boolean` |             |
| `untrustedContent` | Yes      | `null,boolean` |             |

## BrowserWebMcpDeclaration

Declarations are inventory evidence; they never become executable Nexa tools.

Type: `"declarative"` / `"imperative"`.

## BrowserWebMcpDescriptor

A directory row excludes its separately paged structural schema properties.

| Field                | Required | Type                                                              | Description |
| -------------------- | -------- | ----------------------------------------------------------------- | ----------- |
| `annotations`        | Yes      | [BrowserWebMcpAnnotations](protocol.md#browserwebmcpannotations)  |             |
| `declaration`        | Yes      | [BrowserWebMcpDeclaration](protocol.md#browserwebmcpdeclaration)  |             |
| `description`        | Yes      | `string`                                                          |             |
| `frameId`            | Yes      | `string`                                                          |             |
| `frameUrl`           | Yes      | `string`                                                          |             |
| `id`                 | Yes      | `string`                                                          |             |
| `inputSchema`        | Yes      | [BrowserSchemaSummary](protocol.md#browserschemasummary) / `null` |             |
| `key`                | Yes      | `string`                                                          |             |
| `name`               | Yes      | `string`                                                          |             |
| `origin`             | Yes      | `string`                                                          |             |
| `registrationSource` | Yes      | [BrowserWebMcpSource](protocol.md#browserwebmcpsource) / `null`   |             |
| `trust`              | Yes      | `"page-declared-untrusted"`                                       |             |

## BrowserWebMcpMetadata

Captured scope distinguishes unsupported protocols and explicit retention/authority gaps.

| Field                    | Required | Type              | Description |
| ------------------------ | -------- | ----------------- | ----------- |
| `allowedOrigins`         | Yes      | Array of `string` |             |
| `available`              | Yes      | `boolean`         |             |
| `capturedAt`             | Yes      | `string`          |             |
| `complete`               | Yes      | `boolean`         |             |
| `dropped`                | Yes      | `string`          |             |
| `frameCoverageComplete`  | Yes      | `boolean`         |             |
| `frameId`                | Yes      | `string`          |             |
| `invocationAvailable`    | Yes      | `false`           |             |
| `limitations`            | Yes      | Array of `string` |             |
| `observationMs`          | Yes      | `number`          |             |
| `origin`                 | Yes      | `string`          |             |
| `provider`               | Yes      | `"cdp-passive"`   |             |
| `schemaCoverageComplete` | Yes      | `boolean`         |             |
| `schemaValuesExcluded`   | Yes      | `true`            |             |
| `targetId`               | Yes      | `string`          |             |
| `toolCount`              | Yes      | `string`          |             |
| `url`                    | Yes      | `string`          |             |

## BrowserWebMcpPage

Only selected rows are transferred; schema leaves and complete originals remain host-side.

| Field           | Required | Type                                                                    | Description |
| --------------- | -------- | ----------------------------------------------------------------------- | ----------- |
| `captureSha256` | Yes      | `string`                                                                |             |
| `cursor`        | Yes      | `string`                                                                |             |
| `evidenceId`    | Yes      | `string`                                                                |             |
| `metadata`      | Yes      | [BrowserWebMcpMetadata](protocol.md#browserwebmcpmetadata)              |             |
| `nextCursor`    | Yes      | `null,string`                                                           |             |
| `properties`    | Yes      | Array of [BrowserSchemaProperty](protocol.md#browserschemaproperty)     |             |
| `runId`         | Yes      | `string`                                                                |             |
| `selectedTool`  | Yes      | [BrowserWebMcpDescriptor](protocol.md#browserwebmcpdescriptor) / `null` |             |
| `selector`      | Yes      | `null,string`                                                           |             |
| `sha256`        | Yes      | `string`                                                                |             |
| `tools`         | Yes      | Array of [BrowserWebMcpDescriptor](protocol.md#browserwebmcpdescriptor) |             |
| `view`          | Yes      | [BrowserWebMcpView](protocol.md#browserwebmcpview)                      |             |

## BrowserWebMcpQuery

Gateway authority is checked against the original owner and conversation before any index read.

| Field        | Required | Type                                  | Description                                                                           |
| ------------ | -------- | ------------------------------------- | ------------------------------------------------------------------------------------- |
| `cursor`     | No       | `string`                              |                                                                                       |
| `evidenceId` | Yes      | `string`                              |                                                                                       |
| `id`         | Yes      | `string`                              |                                                                                       |
| `runId`      | Yes      | `string`                              |                                                                                       |
| `selector`   | No       | `string`                              |                                                                                       |
| `view`       | No       | `"metadata"` / `"schema"` / `"tools"` | Metadata, declaration rows and one selected schema have independent transfer budgets. |

## BrowserWebMcpSnapshot

Progress binds metadata to the original report without tool/schema arrays.

| Field                    | Required | Type                                                           | Description |
| ------------------------ | -------- | -------------------------------------------------------------- | ----------- |
| `allowedOrigins`         | Yes      | Array of `string`                                              |             |
| `available`              | Yes      | `boolean`                                                      |             |
| `capturedAt`             | Yes      | `string`                                                       |             |
| `complete`               | Yes      | `boolean`                                                      |             |
| `dropped`                | Yes      | `string`                                                       |             |
| `frameCoverageComplete`  | Yes      | `boolean`                                                      |             |
| `frameId`                | Yes      | `string`                                                       |             |
| `invocationAvailable`    | Yes      | `false`                                                        |             |
| `limitations`            | Yes      | Array of `string`                                              |             |
| `observationMs`          | Yes      | `number`                                                       |             |
| `origin`                 | Yes      | `string`                                                       |             |
| `provider`               | Yes      | `"cdp-passive"`                                                |             |
| `reference`              | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference) |             |
| `schemaCoverageComplete` | Yes      | `boolean`                                                      |             |
| `schemaValuesExcluded`   | Yes      | `true`                                                         |             |
| `targetId`               | Yes      | `string`                                                       |             |
| `toolCount`              | Yes      | `string`                                                       |             |
| `url`                    | Yes      | `string`                                                       |             |

## BrowserWebMcpSource

A registration call frame is exposed only for an admitted HTTP(S) source origin.

| Field    | Required | Type          | Description |
| -------- | -------- | ------------- | ----------- |
| `column` | Yes      | `null,number` |             |
| `line`   | Yes      | `null,number` |             |
| `url`    | Yes      | `string`      |             |

## BrowserWebMcpView

Metadata, declaration rows and one selected schema have independent transfer budgets.

Type: `"metadata"` / `"schema"` / `"tools"`.

## Budget

A spending limit over one scope.

| Field             | Required | Type                                               | Description                                                              |
| ----------------- | -------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| `alertThresholds` | No       | Array of `number`                                  | Fractions of the limit at which to raise a warning (e.g. `[0.8, 0.95]`). |
| `createdAt`       | Yes      | `number`                                           |                                                                          |
| `enforcement`     | Yes      | [BudgetEnforcement](protocol.md#budgetenforcement) | What happens at the cap.                                                 |
| `id`              | Yes      | `string`                                           |                                                                          |
| `limitMicrocents` | Yes      | `number`                                           | The cap in micro-cents for the window.                                   |
| `period`          | Yes      | [BudgetPeriod](protocol.md#budgetperiod)           | The window the cap applies over.                                         |
| `scope`           | Yes      | [CreditScope](protocol.md#creditscope)             |                                                                          |
| `scopeId`         | Yes      | `string`                                           | The scope's id (a user id, an agent id…). Ignored for `global`.          |
| `updatedAt`       | Yes      | `number`                                           |                                                                          |

## BudgetEnforcement

What a budget does when its limit is reached.

Type: `"block"` / `"warn"`.

## BudgetPeriod

The window a budget's limit applies over.

Type: `"daily"` / `"hourly"` / `"monthly"` / `"total"` / `"weekly"`.

## ChangedData

The payload of a {@link GATEWAY_EVENTS.JobsChanged} or {@link GATEWAY_EVENTS.AgentsChanged}.

| Field    | Required | Type                                  | Description                                                               |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------- |
| `change` | Yes      | `"added"` / `"defined"` / `"removed"` | What happened, so a client can decide whether a full re-read is worth it. |
| `id`     | Yes      | `string`                              | The record's id.                                                          |

## ChannelInfo

One channel account the deployment is running.

| Field     | Required | Type              | Description                                                     |
| --------- | -------- | ----------------- | --------------------------------------------------------------- |
| `actions` | Yes      | Array of `string` | The message actions the platform's adapter actually implements. |
| `id`      | Yes      | `string`          |                                                                 |
| `name`    | Yes      | `string`          |                                                                 |

## ChannelStatusResult

A channel's live health, as its own adapter reports it.

| Field        | Required | Type                                                                                | Description |
| ------------ | -------- | ----------------------------------------------------------------------------------- | ----------- |
| `configured` | Yes      | `boolean`                                                                           |             |
| `connected`  | Yes      | `boolean`                                                                           |             |
| `id`         | Yes      | `string`                                                                            |             |
| `issues`     | Yes      | Array of Object (fields below)                                                      |             |
| `lastError`  | No       | `string`                                                                            |             |
| `lifecycle`  | Yes      | `"blocked"` / `"ready"` / `"recovering"` / `"starting"` / `"stopped"` / `"unknown"` |             |

**issues**

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `kind`    | Yes      | `string` |             |
| `message` | Yes      | `string` |             |

## ChargeKind

Type: `"adjustment"` / `"completion"` / `"embedding"` / `"media"` / `"speech"` / `"tool"` / `"transcription"`.

## ChatGraph

A non-executable graph delivered directly into a conversation.

| Field         | Required | Type                                                | Description |
| ------------- | -------- | --------------------------------------------------- | ----------- |
| `description` | Yes      | `string`                                            |             |
| `edges`       | Yes      | Array of [ChatGraphEdge](protocol.md#chatgraphedge) |             |
| `id`          | Yes      | `string`                                            |             |
| `nodes`       | Yes      | Array of [ChatGraphNode](protocol.md#chatgraphnode) |             |
| `title`       | Yes      | `string`                                            |             |

## ChatGraphColor

Available semantic colors, shared by the agent and workflow-based chat renderer.

Type: `"blue"` / `"gray"` / `"green"` / `"orange"` / `"purple"` / `"red"`.

## ChatGraphEdge

A directed, labelled relationship between two existing nodes.

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `from`  | Yes      | `string` |             |
| `id`    | Yes      | `string` |             |
| `label` | Yes      | `string` |             |
| `to`    | Yes      | `string` |             |

## ChatGraphNode

A named idea or capability; descriptions are plain text.

| Field         | Required | Type                                         | Description |
| ------------- | -------- | -------------------------------------------- | ----------- |
| `color`       | Yes      | [ChatGraphColor](protocol.md#chatgraphcolor) |             |
| `description` | Yes      | `string`                                     |             |
| `id`          | Yes      | `string`                                     |             |
| `label`       | Yes      | `string`                                     |             |

## CommandExecutionReceipt

Host-produced command termination evidence, separate from model-visible output.

| Field            | Required | Type          | Description                                                          |
| ---------------- | -------- | ------------- | -------------------------------------------------------------------- |
| `command`        | Yes      | `string`      |                                                                      |
| `cwd`            | Yes      | `string`      |                                                                      |
| `exitCode`       | Yes      | `null,number` |                                                                      |
| `processId`      | Yes      | `null,string` |                                                                      |
| `processToken`   | Yes      | `null,string` |                                                                      |
| `remote`         | Yes      | `boolean`     |                                                                      |
| `running`        | Yes      | `boolean`     |                                                                      |
| `signal`         | Yes      | `null,string` |                                                                      |
| `terminalOutput` | No       | `string`      | Original terminal stream, including ANSI styles and cursor controls. |

## ComponentCategory

Catalog grouping retains all requested capability areas without declaring runtime support.

Type: `"agents"` / `"api"` / `"browser"` / `"cache"` / `"collection"` / `"conditions"` / `"connections"` / `"context"` / `"documents"` / `"entities"` / `"experiments"` / `"flow"` / `"human"` / `"media"` / `"messaging"` / `"models"` / `"observability"` / `"output"` / `"personas"` / `"planning"` / `"policy"` / `"programs"` / `"prompts"` / `"quality"` / `"research"` / `"resources"` / `"storage"` / `"teams"` / `"time"` / `"tools"` / `"transform"` / `"triggers"` / `"utilities"`.

## ComponentDefinition

Registry version is pinned in every saved node. Runtime and UI share this exact definition.

| Field            | Required | Type                                                                                               | Description                                                                          |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `category`       | Yes      | [ComponentCategory](protocol.md#componentcategory)                                                 |                                                                                      |
| `configuration`  | Yes      | [ObjectSchema](protocol.md#objectschema)                                                           |                                                                                      |
| `defaults`       | Yes      | [WorkflowObject](protocol.md#workflowobject)                                                       |                                                                                      |
| `display`        | Yes      | [ComponentDisplay](protocol.md#componentdisplay)                                                   |                                                                                      |
| `execution`      | Yes      | [ComponentExecution](protocol.md#componentexecution) / `null`                                      |                                                                                      |
| `externalFamily` | No       | `"application"` / `"compute"` / `"computer"` / `"database"` / `"feed"` / `"files"` / `"workspace"` | Present only on external resource cards, distinct from account or editor workspaces. |
| `id`             | Yes      | `string`                                                                                           |                                                                                      |
| `migratesFrom`   | Yes      | Array of `string`                                                                                  | Older versions requiring explicit migrations; no silent rewrite is permitted.        |
| `ports`          | Yes      | Array of [ComponentPort](protocol.md#componentport)                                                |                                                                                      |
| `resourceRole`   | Yes      | `null,string`                                                                                      |                                                                                      |
| `resources`      | Yes      | Array of [ComponentResourceSlot](protocol.md#componentresourceslot)                                |                                                                                      |
| `role`           | Yes      | [ComponentRole](protocol.md#componentrole)                                                         |                                                                                      |
| `version`        | Yes      | `string`                                                                                           |                                                                                      |

## ComponentDisplay

Declarative presentation hints support family-specific cards without coupling contracts to React.

| Field             | Required | Type              | Description |
| ----------------- | -------- | ----------------- | ----------- |
| `accent`          | Yes      | `string`          |             |
| `card`            | Yes      | `string`          |             |
| `compactFields`   | Yes      | Array of `string` |             |
| `description`     | Yes      | `string`          |             |
| `example`         | Yes      | `string`          |             |
| `inspectorFields` | Yes      | Array of `string` |             |
| `tags`            | Yes      | Array of `string` |             |
| `title`           | Yes      | `string`          |             |

## ComponentEffect

Type: `"external"` / `"inference"` / `"pure"` / `"wait"`.

## ComponentExecution

Runtime availability is explicit; a schema definition alone cannot authorize or execute work.

| Field          | Required | Type                                           | Description |
| -------------- | -------- | ---------------------------------------------- | ----------- |
| `cancellation` | Yes      | `string`                                       |             |
| `capabilities` | Yes      | Array of `string`                              |             |
| `credits`      | Yes      | `string`                                       |             |
| `effect`       | Yes      | [ComponentEffect](protocol.md#componenteffect) |             |
| `handler`      | Yes      | `null,string`                                  |             |
| `maxAttempts`  | Yes      | `number`                                       |             |
| `mock`         | Yes      | [MockBehavior](protocol.md#mockbehavior)       |             |
| `permissions`  | Yes      | Array of `string`                              |             |
| `persistence`  | Yes      | `string`                                       |             |
| `retryErrors`  | Yes      | Array of `string`                              |             |
| `streaming`    | Yes      | `boolean`                                      |             |
| `timeoutMs`    | Yes      | `string`                                       |             |

## ComponentPort

Literal inputs and wire inputs share one schema; connecting both is ambiguous and rejected.

| Field               | Required | Type                                             | Description                                                                           |
| ------------------- | -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `cardinality`       | Yes      | [PortCardinality](protocol.md#portcardinality)   |                                                                                       |
| `direction`         | Yes      | [PortDirection](protocol.md#portdirection)       |                                                                                       |
| `id`                | Yes      | `string`                                         |                                                                                       |
| `incoming`          | Yes      | [IncomingPolicy](protocol.md#incomingpolicy)     |                                                                                       |
| `kind`              | Yes      | [WorkflowEdgeKind](protocol.md#workflowedgekind) |                                                                                       |
| `label`             | Yes      | `string`                                         |                                                                                       |
| `literalField`      | Yes      | `null,string`                                    |                                                                                       |
| `maxConnections`    | Yes      | `number`                                         |                                                                                       |
| `modelCapabilities` | No       | Array of `string`                                | Authoring hint; runtime must still verify the provider's actual supported operations. |
| `required`          | Yes      | `boolean`                                        |                                                                                       |
| `schema`            | Yes      | [ValueSchema](protocol.md#valueschema)           |                                                                                       |

## ComponentResourceSlot

Inline resource bindings have the same capability requirements as exposed resource cards.

| Field    | Required | Type                                            | Description |
| -------- | -------- | ----------------------------------------------- | ----------- |
| `family` | Yes      | [ResourceFamily](protocol.md#resourcefamily)    |             |
| `uses`   | Yes      | Array of [ResourceUse](protocol.md#resourceuse) |             |

## ComponentRole

The four authoring roles have different scheduling semantics.

Type: `"resource"` / `"step"` / `"trigger"` / `"visual"`.

## ConfigResult

The effective configuration, with secrets removed.

| Field      | Required | Type                                                   | Description                                                                          |
| ---------- | -------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `config`   | Yes      | [Recordstringunknown](protocol.md#recordstringunknown) | The merged config as JSON. Redacted — see `redactConfig` in the server.              |
| `defaults` | Yes      | [Recordstringunknown](protocol.md#recordstringunknown) | The configuration as it would be with no file and no environment at all.             |
| `path`     | Yes      | `null,string`                                          | The file it was loaded from, or null when everything came from defaults and the env. |
| `redacted` | Yes      | Array of `string`                                      | Field paths whose values were replaced by a placeholder, so a UI can say so.         |

## ConfigWriteParams

One setting, by dotted path.

| Field   | Required | Type     | Description                |
| ------- | -------- | -------- | -------------------------- |
| `key`   | Yes      | `string` |                            |
| `value` | Yes      | `JSON`   | The value, already parsed. |

## ConfigWriteResult

What a write did.

| Field  | Required | Type     | Description                |
| ------ | -------- | -------- | -------------------------- |
| `key`  | Yes      | `string` |                            |
| `ok`   | Yes      | `true`   |                            |
| `path` | Yes      | `string` | The file that was written. |

## ConnectChallengeData

The payload of a {@link GATEWAY_EVENTS.ConnectChallenge}.

| Field         | Required | Type     | Description                                       |
| ------------- | -------- | -------- | ------------------------------------------------- |
| `minProtocol` | Yes      | `number` |                                                   |
| `nonce`       | Yes      | `string` | Echoed back in {@link ConnectParams.nonce}.       |
| `protocol`    | Yes      | `number` |                                                   |
| `ts`          | Yes      | `number` | The server's clock when the challenge was issued. |

## ConnectClientInfo

How a client identifies itself in the handshake.

| Field                     | Required | Type                                                   | Description                                                                |
| ------------------------- | -------- | ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `id`                      | Yes      | `string`                                               | Stable per install, so a reconnect is recognisable in the logs.            |
| `metadataOnlyAttachments` | No       | `boolean`                                              | Deliver saved file descriptors; clients explicitly request original bytes. |
| `mode`                    | Yes      | `"automation"` / `"cli"` / `"node"` / `"tui"` / `"ui"` |                                                                            |
| `platform`                | Yes      | `string`                                               |                                                                            |
| `version`                 | Yes      | `string`                                               |                                                                            |

## ConnectParams

The `connect` frame's params.

| Field         | Required | Type                                               | Description                                                            |
| ------------- | -------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `client`      | Yes      | [ConnectClientInfo](protocol.md#connectclientinfo) |                                                                        |
| `maxProtocol` | Yes      | `number`                                           | The newest protocol the client can speak.                              |
| `minProtocol` | Yes      | `number`                                           | The oldest protocol the client can speak.                              |
| `nonce`       | Yes      | `string`                                           | The challenge nonce, proving the client read the server's first frame. |

## ContentBlock

One block of a message's content.

Variant 1: Object (fields below)

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `text` | Yes      | `string` |             |
| `type` | Yes      | `"text"` |             |

Variant 2: Object (fields below)

| Field       | Required | Type         | Description                                                                         |
| ----------- | -------- | ------------ | ----------------------------------------------------------------------------------- |
| `signature` | No       | `string`     |                                                                                     |
| `thinking`  | Yes      | `string`     |                                                                                     |
| `type`      | Yes      | `"thinking"` | The model's reasoning trace. `signature` is Anthropic's integrity token: it MUST be |

Variant 3: Object (fields below)

| Field  | Required | Type                  | Description                                                        |
| ------ | -------- | --------------------- | ------------------------------------------------------------------ |
| `data` | Yes      | `string`              |                                                                    |
| `type` | Yes      | `"redacted-thinking"` | Reasoning the provider encrypted. Opaque, and round-tripped as-is. |

Variant 4: Object (fields below)

| Field    | Required | Type                                     | Description |
| -------- | -------- | ---------------------------------------- | ----------- |
| `source` | Yes      | [BinarySource](protocol.md#binarysource) |             |
| `title`  | No       | `string`                                 |             |
| `type`   | Yes      | `"image"`                                |             |

Variant 5: Object (fields below)

| Field    | Required | Type                                     | Description                                                                     |
| -------- | -------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| `source` | Yes      | [BinarySource](protocol.md#binarysource) |                                                                                 |
| `title`  | No       | `string`                                 |                                                                                 |
| `type`   | Yes      | `"video"`                                | An encoded video or animation container decoded natively by a multimodal model. |

Variant 6: Object (fields below)

| Field    | Required | Type                                     | Description                                                                  |
| -------- | -------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `source` | Yes      | [BinarySource](protocol.md#binarysource) |                                                                              |
| `title`  | No       | `string`                                 |                                                                              |
| `type`   | Yes      | `"video-frame"`                          | One ordered frame of a video or animation. Consecutive frames form one clip. |

Variant 7: Object (fields below)

| Field    | Required | Type                                     | Description |
| -------- | -------- | ---------------------------------------- | ----------- |
| `source` | Yes      | [BinarySource](protocol.md#binarysource) |             |
| `title`  | No       | `string`                                 |             |
| `type`   | Yes      | `"document"`                             |             |

Variant 8: Object (fields below)

| Field       | Required | Type                               | Description                                                                          |
| ----------- | -------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| `id`        | Yes      | `string`                           |                                                                                      |
| `input`     | Yes      | [JsonValue](protocol.md#jsonvalue) |                                                                                      |
| `name`      | Yes      | `string`                           |                                                                                      |
| `signature` | No       | `string`                           | An integrity token some providers attach to a tool call made while reasoning.        |
| `type`      | Yes      | `"tool-use"`                       | The model asking for a tool to run. `id` is the provider's own call id and is what a |

Variant 9: Object (fields below)

| Field                  | Required | Type                                                         | Description                                                           |
| ---------------------- | -------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `chatGraph`            | No       | [ChatGraph](protocol.md#chatgraph)                           | Saved visual delivery; providers only consume the ordinary content.   |
| `content`              | Yes      | Array of [ContentBlock](protocol.md#contentblock) / `string` |                                                                       |
| `inspectedMediaSha256` | No       | Array of `string`                                            | Host-authored observation evidence; never inferred from result prose. |
| `isError`              | No       | `boolean`                                                    |                                                                       |
| `toolUseId`            | Yes      | `string`                                                     |                                                                       |
| `type`                 | Yes      | `"tool-result"`                                              | The outcome of a tool call, sent back on the next turn.               |

## ConversationInput

Only editable text and a media count cross the wire when opening the message editor.

| Field             | Required | Type     | Description |
| ----------------- | -------- | -------- | ----------- |
| `attachmentCount` | Yes      | `number` |             |
| `text`            | Yes      | `string` |             |

## ConversationMessageRef

A stable input, response stream, or canonical entry in a saved conversation.

| Field  | Required | Type                                                    | Description |
| ------ | -------- | ------------------------------------------------------- | ----------- |
| `key`  | Yes      | `string`                                                |             |
| `kind` | Yes      | `"entry"` / `"input"` / `"input-stream"` / `"response"` |             |

## ConversationPin

A private, durable bookmark with an authoritative saved excerpt.

| Field       | Required | Type                                                         | Description |
| ----------- | -------- | ------------------------------------------------------------ | ----------- |
| `createdAt` | Yes      | `number`                                                     |             |
| `excerpt`   | Yes      | `string`                                                     |             |
| `id`        | Yes      | `string`                                                     |             |
| `message`   | Yes      | [ConversationMessageRef](protocol.md#conversationmessageref) |             |
| `role`      | Yes      | `"assistant"` / `"user"`                                     |             |
| `sessionId` | Yes      | `string`                                                     |             |
| `timestamp` | Yes      | `number`                                                     |             |
| `title`     | Yes      | `string`                                                     |             |

## ConversationPinParams

A message selected from an owned saved conversation.

| Field     | Required | Type                                                         | Description |
| --------- | -------- | ------------------------------------------------------------ | ----------- |
| `id`      | Yes      | `string`                                                     |             |
| `message` | Yes      | [ConversationMessageRef](protocol.md#conversationmessageref) |             |

## ConversationPinsPage

A page of owned pins, with the continuation cursor if more records exist.

| Field        | Required | Type                                                    | Description |
| ------------ | -------- | ------------------------------------------------------- | ----------- |
| `nextBefore` | No       | `string`                                                |             |
| `pins`       | Yes      | Array of [ConversationPin](protocol.md#conversationpin) |             |

## ConversationPinsParams

Bounded newest-first bookmarks, with an opaque owned-record cursor.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `before` | No       | `string` |             |
| `limit`  | No       | `number` |             |

## ConversationRenameParams

Changes a title only if the editor still sees the current title.

| Field           | Required | Type          | Description |
| --------------- | -------- | ------------- | ----------- |
| `expectedTitle` | Yes      | `null,string` |             |
| `id`            | Yes      | `string`      |             |
| `title`         | Yes      | `string`      |             |

## ConversationRetryParams

Edits a human prompt or repeats its response in a separate saved version.

| Field               | Required | Type                                                                          | Description |
| ------------------- | -------- | ----------------------------------------------------------------------------- | ----------- |
| `id`                | Yes      | `string`                                                                      |             |
| `message`           | Yes      | [ConversationMessageRef](protocol.md#conversationmessageref)                  |             |
| `mode`              | Yes      | `"edit"` / `"regenerate"`                                                     |             |
| `reasoningEffort`   | No       | `"high"` / `"low"` / `"max"` / `"medium"` / `"minimal"` / `"off"` / `"xhigh"` |             |
| `requestId`         | Yes      | `string`                                                                      |             |
| `targetTimeSeconds` | No       | `number`                                                                      |             |
| `text`              | No       | `string`                                                                      |             |

## ConversationRetryResult

A saved version is returned even when its model run was already started by a lost acknowledgement.

| Field      | Required | Type                           | Description |
| ---------- | -------- | ------------------------------ | ----------- |
| `session`  | Yes      | [Session](protocol.md#session) |             |
| `started`  | Yes      | `boolean`                      |             |
| `streamId` | Yes      | `string`                       |             |

## ConversationUnpinParams

Removes only a bookmark belonging to the current authenticated principal.

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `pinId` | Yes      | `string` |             |

## CreditScope

The scopes a balance or budget can be defined over.

Type: `"agent"` / `"conversation"` / `"global"` / `"project"` / `"user"`.

## CreditSummary

Spend totals over some slice of the ledger.

| Field                | Required | Type                                                 | Description                                                                 |
| -------------------- | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `byCategory`         | No       | [Recordstringnumber](protocol.md#recordstringnumber) | Missing on older authorities; other includes historical unclassified usage. |
| `byKind`             | Yes      | [Recordstringnumber](protocol.md#recordstringnumber) | Totals split by charge kind, so "how much of this was voice" is answerable. |
| `byModel`            | Yes      | [Recordstringnumber](protocol.md#recordstringnumber) | Totals split by model.                                                      |
| `cachedInputTokens`  | Yes      | `number`                                             |                                                                             |
| `entries`            | Yes      | `number`                                             |                                                                             |
| `from`               | Yes      | `number`                                             |                                                                             |
| `inputTokens`        | Yes      | `number`                                             |                                                                             |
| `microcents`         | Yes      | `number`                                             |                                                                             |
| `outputTokens`       | Yes      | `number`                                             |                                                                             |
| `scope`              | Yes      | [CreditScope](protocol.md#creditscope)               |                                                                             |
| `scopeId`            | Yes      | `string`                                             |                                                                             |
| `supportedWorkloads` | No       | Array of `string`                                    | Classified reports this authority accepts; absent on earlier deployments.   |
| `to`                 | Yes      | `number`                                             |                                                                             |

## CreditSummaryParams

A spend query.

| Field     | Required | Type                                                               | Description                                         |
| --------- | -------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| `from`    | No       | `number`                                                           |                                                     |
| `scope`   | No       | `"agent"` / `"conversation"` / `"global"` / `"project"` / `"user"` | The scopes a balance or budget can be defined over. |
| `scopeId` | No       | `string`                                                           |                                                     |
| `to`      | No       | `number`                                                           |                                                     |

## DataFile

A complete source file the agent can process directly in its workspace.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `byteLength` | Yes      | `string` |             |
| `filename`   | Yes      | `string` |             |
| `id`         | Yes      | `string` |             |
| `path`       | Yes      | `string` |             |

## DataUpload

A disk-backed upload; byte counts use decimal strings on the wire.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `byteLength` | Yes      | `string` |             |
| `filename`   | Yes      | `string` |             |
| `id`         | Yes      | `string` |             |

## DataUploadChunkParams

One bounded base64 chunk with an exact byte offset.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `data`   | Yes      | `string` |             |
| `id`     | Yes      | `string` |             |
| `offset` | Yes      | `string` |             |

## DataUploadIdParams

Addresses an upload owned by the authenticated principal.

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

## DataUploadPosition

The durable position acknowledged after one bounded upload chunk.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `id`     | Yes      | `string` |             |
| `offset` | Yes      | `string` |             |

## DataUploadStartParams

Starts an upload without embedding source bytes in an agent request.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `byteLength` | Yes      | `string` |             |
| `filename`   | Yes      | `string` |             |

## DeadLetter

One recorded failure.

| Field            | Required | Type                                           | Description                                                                           |
| ---------------- | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `agentId`        | Yes      | `null,string`                                  | The agent the route picked, or null when routing never got that far.                  |
| `at`             | Yes      | `number`                                       |                                                                                       |
| `channel`        | Yes      | `string`                                       |                                                                                       |
| `conversationId` | Yes      | `string`                                       |                                                                                       |
| `id`             | Yes      | `string`                                       |                                                                                       |
| `messageId`      | No       | `string`                                       |                                                                                       |
| `reason`         | Yes      | `string`                                       |                                                                                       |
| `senderId`       | Yes      | `string`                                       |                                                                                       |
| `sessionKey`     | Yes      | `null,string`                                  |                                                                                       |
| `stage`          | Yes      | [DeadLetterStage](protocol.md#deadletterstage) |                                                                                       |
| `text`           | No       | `string`                                       | Present only when the sink was built with `retainContent`.                            |
| `textHash`       | Yes      | `string`                                       | SHA-256 of the message text, hex. See this file's comment for why it is not the text. |
| `textLength`     | Yes      | `number`                                       |                                                                                       |
| `threadId`       | No       | `string`                                       |                                                                                       |

## DeadLetterStage

How far a message got before it failed.

Type: `"deliver"` / `"gate"` / `"route"` / `"turn"`.

## DeliveredAttachment

A file delivered to an application through the gateway.

| Field         | Required | Type      | Description                                                         |
| ------------- | -------- | --------- | ------------------------------------------------------------------- |
| `asFile`      | No       | `boolean` |                                                                     |
| `byteLength`  | Yes      | `number`  | Size of the accompanying binary WebSocket payload.                  |
| `description` | No       | `string`  |                                                                     |
| `filename`    | Yes      | `string`  |                                                                     |
| `id`          | Yes      | `string`  | Stable delivery identifier shared by the event and terminal result. |
| `mimeType`    | Yes      | `string`  |                                                                     |

## DeliveryDestination

A destination excludes response tokens and distinguishes threaded conversations.

| Field            | Required | Type          | Description |
| ---------------- | -------- | ------------- | ----------- |
| `channel`        | Yes      | `string`      |             |
| `conversationId` | Yes      | `string`      |             |
| `threadId`       | Yes      | `null,string` |             |

## DeliveryReceipt

Host receipt for the exact bytes submitted to an acknowledged channel send.

| Field            | Required | Type                                                   | Description |
| ---------------- | -------- | ------------------------------------------------------ | ----------- |
| `acknowledgment` | Yes      | [DeliveryDestination](protocol.md#deliverydestination) |             |
| `at`             | Yes      | `string`                                               |             |
| `byteLength`     | Yes      | `string`                                               |             |
| `destination`    | Yes      | [DeliveryDestination](protocol.md#deliverydestination) |             |
| `filename`       | Yes      | `string`                                               |             |
| `id`             | Yes      | `string`                                               |             |
| `mediaId`        | Yes      | `null,string`                                          |             |
| `messageId`      | Yes      | `null,string`                                          |             |
| `mimeType`       | Yes      | `string`                                               |             |
| `path`           | Yes      | `null,string`                                          |             |
| `revision`       | Yes      | `null,string`                                          |             |
| `sessionId`      | Yes      | `string`                                               |             |
| `sha256`         | Yes      | `string`                                               |             |
| `taskId`         | Yes      | `null,string`                                          |             |
| `toolCallId`     | Yes      | `string`                                               |             |
| `turnId`         | Yes      | `null,string`                                          |             |

## DesignAction

Prototype actions.

Type: `"back"` / `"navigate"` / `"overlay"`.

## DesignAlign

Alignment within the available layout space.

Type: `"between"` / `"center"` / `"end"` / `"start"` / `"stretch"`.

## DesignAsset

Published assets are immutable, and all byte counts remain decimal strings.

| Field        | Required | Type                                           | Description |
| ------------ | -------- | ---------------------------------------------- | ----------- |
| `byteLength` | Yes      | `string`                                       |             |
| `height`     | Yes      | `number`                                       |             |
| `id`         | Yes      | `string`                                       |             |
| `mime`       | Yes      | [DesignAssetMime](protocol.md#designassetmime) |             |
| `name`       | Yes      | `string`                                       |             |
| `sha256`     | Yes      | `string`                                       |             |
| `width`      | Yes      | `number`                                       |             |

## DesignAssetCancelMethod

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignAssetIdRequest](protocol.md#designassetidrequest) |             |
| `result` | Yes      | `null`                                                   |             |

## DesignAssetChunkMethod

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignAssetChunkRequest](protocol.md#designassetchunkrequest) |             |
| `result` | Yes      | [DesignAssetPosition](protocol.md#designassetposition)         |             |

## DesignAssetChunkRequest

One canonical base64 slice, addressed by exact byte position.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `data`   | Yes      | `string` |             |
| `id`     | Yes      | `string` |             |
| `offset` | Yes      | `string` |             |

## DesignAssetFinishMethod

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignAssetIdRequest](protocol.md#designassetidrequest) |             |
| `result` | Yes      | [DesignAsset](protocol.md#designasset)                   |             |

## DesignAssetIdRequest

Asset addressing is independent of document ownership; both are authorized by the server.

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

## DesignAssetListMethod

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignAssetListRequest](protocol.md#designassetlistrequest) |             |
| `result` | Yes      | [DesignAssetListPage](protocol.md#designassetlistpage)       |             |

## DesignAssetListPage

| Field       | Required | Type                                            | Description |
| ----------- | -------- | ----------------------------------------------- | ----------- |
| `items`     | Yes      | Array of [DesignAsset](protocol.md#designasset) |             |
| `nextAfter` | Yes      | `null,string`                                   |             |

## DesignAssetListRequest

Library projections are metadata only.

| Field   | Required | Type          | Description |
| ------- | -------- | ------------- | ----------- |
| `after` | Yes      | `null,string` |             |
| `limit` | Yes      | `number`      |             |

## DesignAssetMime

Raster formats are identified from bytes before becoming usable design assets.

Type: `"image/gif"` / `"image/jpeg"` / `"image/png"` / `"image/webp"`.

## DesignAssetPosition

Receipts carry progress without echoing source bytes.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `byteLength` | Yes      | `string` |             |
| `id`         | Yes      | `string` |             |
| `offset`     | Yes      | `string` |             |

## DesignAssetReadMethod

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignAssetReadRequest](protocol.md#designassetreadrequest) |             |
| `result` | Yes      | [DesignAssetSlice](protocol.md#designassetslice)             |             |

## DesignAssetReadRequest

Reads transfer only a bounded slice of a completed immutable image.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `id`     | Yes      | `string` |             |
| `offset` | Yes      | `string` |             |

## DesignAssetRemoveMethod

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignAssetIdRequest](protocol.md#designassetidrequest) |             |
| `result` | Yes      | `null`                                                   |             |

## DesignAssetSlice

The browser pins the metadata identity while assembling slices.

| Field        | Required | Type                                   | Description |
| ------------ | -------- | -------------------------------------- | ----------- |
| `asset`      | Yes      | [DesignAsset](protocol.md#designasset) |             |
| `data`       | Yes      | `string`                               |             |
| `nextOffset` | Yes      | `null,string`                          |             |
| `offset`     | Yes      | `string`                               |             |

## DesignAssetStartMethod

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignAssetStartRequest](protocol.md#designassetstartrequest) |             |
| `result` | Yes      | [DesignAssetPosition](protocol.md#designassetposition)         |             |

## DesignAssetStartRequest

Retried admission uses the same client-chosen identity. Ownership comes from the host.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `byteLength` | Yes      | `string` |             |
| `id`         | Yes      | `string` |             |
| `name`       | Yes      | `string` |             |
| `sha256`     | Yes      | `string` |             |

## DesignBox

Resolved layout boxes are separate from authored values and never written back implicitly.

| Field      | Required | Type          | Description |
| ---------- | -------- | ------------- | ----------- |
| `clipId`   | Yes      | `null,string` |             |
| `depth`    | Yes      | `number`      |             |
| `height`   | Yes      | `number`      |             |
| `id`       | Yes      | `string`      |             |
| `rotation` | Yes      | `number`      |             |
| `width`    | Yes      | `number`      |             |
| `x`        | Yes      | `number`      |             |
| `y`        | Yes      | `number`      |             |

## DesignChangesMethod

Forward delta RPC contract.

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignChangesRequest](protocol.md#designchangesrequest) |             |
| `result` | Yes      | [DesignRecordPage](protocol.md#designrecordpage)         |             |

## DesignChangesRequest

Changed entities exclude undo preimages.

| Field       | Required | Type                                              | Description |
| ----------- | -------- | ------------------------------------------------- | ----------- |
| `commandId` | Yes      | `string`                                          |             |
| `cursor`    | Yes      | [DesignCursor](protocol.md#designcursor) / `null` |             |
| `id`        | Yes      | `string`                                          |             |
| `limit`     | Yes      | `number`                                          |             |

## DesignComment

Anchored comments can refer to exact layers or canvas coordinates.

| Field      | Required | Type          | Description |
| ---------- | -------- | ------------- | ----------- |
| `author`   | Yes      | `string`      |             |
| `id`       | Yes      | `string`      |             |
| `nodeId`   | Yes      | `null,string` |             |
| `resolved` | Yes      | `boolean`     |             |
| `text`     | Yes      | `string`      |             |
| `x`        | Yes      | `number`      |             |
| `y`        | Yes      | `number`      |             |

## DesignCommentRecord

Comment record.

| Field   | Required | Type                                                | Description |
| ------- | -------- | --------------------------------------------------- | ----------- |
| `id`    | Yes      | `string`                                            |             |
| `kind`  | Yes      | `"comment"`                                         |             |
| `value` | Yes      | [DesignComment](protocol.md#designcomment) / `null` |             |

## DesignConstraint

Absolute children retain a chosen relation to a resized parent.

Type: `"center"` / `"end"` / `"scale"` / `"start"` / `"stretch"`.

## DesignCorners

Four independent corner radii, in clockwise order.

| Field         | Required | Type     | Description |
| ------------- | -------- | -------- | ----------- |
| `bottomLeft`  | Yes      | `number` |             |
| `bottomRight` | Yes      | `number` |             |
| `topLeft`     | Yes      | `number` |             |
| `topRight`    | Yes      | `number` |             |

## DesignCreateMethod

Create-document RPC contract.

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignCreateRequest](protocol.md#designcreaterequest) |             |
| `result` | Yes      | [DesignReceipt](protocol.md#designreceipt)             |             |

## DesignCreateRequest

Empty document creation is durable and idempotent.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `commandId` | Yes      | `string` |             |
| `id`        | Yes      | `string` |             |
| `name`      | Yes      | `string` |             |

## DesignCursor

Record and UTF-16 character offsets allow large entities to remain bounded on the wire.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `character` | Yes      | `number` |             |
| `record`    | Yes      | `number` |             |

## DesignDeleteMethod

Owner-scoped revision-safe document deletion.

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignDeleteRequest](protocol.md#designdeleterequest) |             |
| `result` | Yes      | [DesignDeleteReceipt](protocol.md#designdeletereceipt) |             |

## DesignDeleteReceipt

Host confirmation that the exact document revision was removed.

| Field      | Required | Type     | Description |
| ---------- | -------- | -------- | ----------- |
| `deleted`  | Yes      | `true`   |             |
| `id`       | Yes      | `string` |             |
| `revision` | Yes      | `string` |             |

## DesignDeleteRequest

Revision-fenced document removal with an exact retry identity.

| Field              | Required | Type     | Description |
| ------------------ | -------- | -------- | ----------- |
| `commandId`        | Yes      | `string` |             |
| `expectedRevision` | Yes      | `string` |             |
| `id`               | Yes      | `string` |             |

## DesignEventsMethod

Revision-journal RPC contract.

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignEventsRequest](protocol.md#designeventsrequest) |             |
| `result` | Yes      | [DesignEventsPage](protocol.md#designeventspage)       |             |

## DesignEventsPage

A missed retained revision requires a fresh paged snapshot.

| Field     | Required | Type                                                | Description |
| --------- | -------- | --------------------------------------------------- | ----------- |
| `commits` | Yes      | Array of [DesignReceipt](protocol.md#designreceipt) |             |
| `reset`   | Yes      | `boolean`                                           |             |
| `summary` | Yes      | [DesignSummary](protocol.md#designsummary)          |             |

## DesignEventsRequest

Users and agents consume the same durable revision journal.

| Field           | Required | Type     | Description |
| --------------- | -------- | -------- | ----------- |
| `afterRevision` | Yes      | `string` |             |
| `id`            | Yes      | `string` |             |
| `limit`         | Yes      | `number` |             |

## DesignFlow

Free positioning and responsive container layouts.

Type: `"absolute"` / `"column"` / `"grid"` / `"row"`.

## DesignGradientStop

Color stop in a normalized gradient.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `color`  | Yes      | `string` |             |
| `offset` | Yes      | `number` |             |

## DesignImage

Workspace image reference and crop transform.

| Field     | Required | Type                                         | Description |
| --------- | -------- | -------------------------------------------- | ----------- |
| `assetId` | Yes      | `string`                                     |             |
| `cropX`   | Yes      | `number`                                     |             |
| `cropY`   | Yes      | `number`                                     |             |
| `fit`     | Yes      | [DesignImageFit](protocol.md#designimagefit) |             |
| `scale`   | Yes      | `number`                                     |             |

## DesignImageFit

Image scaling mode.

Type: `"contain"` / `"cover"`.

## DesignInsert

Insert a standalone node at a precise location in a page or container.

| Field      | Required | Type                                 | Description |
| ---------- | -------- | ------------------------------------ | ----------- |
| `index`    | Yes      | `number`                             |             |
| `node`     | Yes      | [DesignNode](protocol.md#designnode) |             |
| `op`       | Yes      | `"insert"`                           |             |
| `pageId`   | Yes      | `string`                             |             |
| `parentId` | Yes      | `null,string`                        |             |

## DesignInsets

Box padding.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `bottom` | Yes      | `number` |             |
| `left`   | Yes      | `number` |             |
| `right`  | Yes      | `number` |             |
| `top`    | Yes      | `number` |             |

## DesignInteraction

Click, hover and timed prototype links are independent of editable layout.

| Field        | Required | Type                                             | Description |
| ------------ | -------- | ------------------------------------------------ | ----------- |
| `action`     | Yes      | [DesignAction](protocol.md#designaction)         |             |
| `durationMs` | Yes      | `number`                                         |             |
| `id`         | Yes      | `string`                                         |             |
| `nodeId`     | Yes      | `string`                                         |             |
| `targetId`   | Yes      | `string`                                         |             |
| `transition` | Yes      | [DesignTransition](protocol.md#designtransition) |             |
| `trigger`    | Yes      | [DesignTrigger](protocol.md#designtrigger)       |             |

## DesignInteractionRecord

Prototype record.

| Field   | Required | Type                                                        | Description |
| ------- | -------- | ----------------------------------------------------------- | ----------- |
| `id`    | Yes      | `string`                                                    |             |
| `kind`  | Yes      | `"interaction"`                                             |             |
| `value` | Yes      | [DesignInteraction](protocol.md#designinteraction) / `null` |             |

## DesignKind

Editable scene primitives, including reusable component definitions and instances.

Type: `"component"` / `"ellipse"` / `"frame"` / `"group"` / `"image"` / `"instance"` / `"line"` / `"path"` / `"polygon"` / `"rectangle"` / `"text"`.

## DesignLayout

Container layout, including wrapping, grid tracks and content alignment.

| Field     | Required | Type                                     | Description |
| --------- | -------- | ---------------------------------------- | ----------- |
| `align`   | Yes      | [DesignAlign](protocol.md#designalign)   |             |
| `clip`    | Yes      | `boolean`                                |             |
| `columns` | Yes      | `number`                                 |             |
| `flow`    | Yes      | [DesignFlow](protocol.md#designflow)     |             |
| `gap`     | Yes      | `number`                                 |             |
| `justify` | Yes      | [DesignAlign](protocol.md#designalign)   |             |
| `padding` | Yes      | [DesignInsets](protocol.md#designinsets) |             |
| `rowGap`  | Yes      | `number`                                 |             |
| `wrap`    | Yes      | `boolean`                                |             |

## DesignLayoutMethod

Computed-geometry RPC contract.

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignLayoutRequest](protocol.md#designlayoutrequest) |             |
| `result` | Yes      | [DesignLayoutPage](protocol.md#designlayoutpage)       |             |

## DesignLayoutPage

Native geometry uses the same layout engine as the canvas.

| Field        | Required | Type                                        | Description |
| ------------ | -------- | ------------------------------------------- | ----------- |
| `boxes`      | Yes      | Array of [DesignBox](protocol.md#designbox) |             |
| `nextOffset` | Yes      | `null,number`                               |             |
| `summary`    | Yes      | [DesignSummary](protocol.md#designsummary)  |             |

## DesignLayoutRequest

Agent geometry inspection is revision-pinned and separately paged.

| Field      | Required | Type     | Description |
| ---------- | -------- | -------- | ----------- |
| `id`       | Yes      | `string` |             |
| `limit`    | Yes      | `number` |             |
| `offset`   | Yes      | `number` |             |
| `pageId`   | Yes      | `string` |             |
| `revision` | Yes      | `string` |             |

## DesignListMethod

Owner-scoped library RPC contract.

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignListRequest](protocol.md#designlistrequest) |             |
| `result` | Yes      | [DesignListPage](protocol.md#designlistpage)       |             |

## DesignListPage

Bounded library page.

| Field       | Required | Type                                                | Description |
| ----------- | -------- | --------------------------------------------------- | ----------- |
| `items`     | Yes      | Array of [DesignSummary](protocol.md#designsummary) |             |
| `nextAfter` | Yes      | `null,string`                                       |             |

## DesignListRequest

Owner-scoped document listing.

| Field   | Required | Type          | Description |
| ------- | -------- | ------------- | ----------- |
| `after` | Yes      | `null,string` |             |
| `limit` | Yes      | `number`      |             |

## DesignMetadata

Document properties and supporting design-system or collaboration records.

| Field          | Required | Type                                                        | Description |
| -------------- | -------- | ----------------------------------------------------------- | ----------- |
| `comments`     | No       | Array of [DesignComment](protocol.md#designcomment)         |             |
| `interactions` | No       | Array of [DesignInteraction](protocol.md#designinteraction) |             |
| `name`         | No       | `string`                                                    |             |
| `op`           | Yes      | `"metadata"`                                                |             |
| `tokens`       | No       | Array of [DesignToken](protocol.md#designtoken)             |             |

## DesignMove

Reparent or reorder without breaking both sides of the tree.

| Field      | Required | Type          | Description |
| ---------- | -------- | ------------- | ----------- |
| `id`       | Yes      | `string`      |             |
| `index`    | Yes      | `number`      |             |
| `op`       | Yes      | `"move"`      |             |
| `pageId`   | Yes      | `string`      |             |
| `parentId` | Yes      | `null,string` |             |

## DesignNode

All layer state is explicit and editable; no generated markup is the source of truth.

| Field         | Required | Type                                                        | Description |
| ------------- | -------- | ----------------------------------------------------------- | ----------- |
| `children`    | Yes      | Array of `string`                                           |             |
| `componentId` | Yes      | `null,string`                                               |             |
| `height`      | Yes      | `number`                                                    |             |
| `id`          | Yes      | `string`                                                    |             |
| `image`       | Yes      | [DesignImage](protocol.md#designimage) / `null`             |             |
| `kind`        | Yes      | [DesignKind](protocol.md#designkind)                        |             |
| `layout`      | Yes      | [DesignLayout](protocol.md#designlayout)                    |             |
| `locked`      | Yes      | `boolean`                                                   |             |
| `name`        | Yes      | `string`                                                    |             |
| `opacity`     | Yes      | `number`                                                    |             |
| `overrides`   | Yes      | Array of [DesignOverride](protocol.md#designoverride)       |             |
| `parentId`    | Yes      | `null,string`                                               |             |
| `path`        | Yes      | Array of [DesignPathCommand](protocol.md#designpathcommand) |             |
| `placement`   | Yes      | [DesignPlacement](protocol.md#designplacement)              |             |
| `rotation`    | Yes      | `number`                                                    |             |
| `style`       | Yes      | [DesignStyle](protocol.md#designstyle)                      |             |
| `text`        | Yes      | [DesignText](protocol.md#designtext) / `null`               |             |
| `visible`     | Yes      | `boolean`                                                   |             |
| `width`       | Yes      | `number`                                                    |             |
| `x`           | Yes      | `number`                                                    |             |
| `y`           | Yes      | `number`                                                    |             |

## DesignNodeChanges

Editable properties exclude identity and tree links, which have dedicated operations.

| Field         | Required | Type                                                                                                                                          | Description                                                                        |
| ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `componentId` | No       | `null,string`                                                                                                                                 |                                                                                    |
| `height`      | No       | `number`                                                                                                                                      |                                                                                    |
| `image`       | No       | [DesignImage](protocol.md#designimage) / `null`                                                                                               |                                                                                    |
| `kind`        | No       | `"component"` / `"ellipse"` / `"frame"` / `"group"` / `"image"` / `"instance"` / `"line"` / `"path"` / `"polygon"` / `"rectangle"` / `"text"` | Editable scene primitives, including reusable component definitions and instances. |
| `layout`      | No       | [DesignLayout](protocol.md#designlayout)                                                                                                      | Container layout, including wrapping, grid tracks and content alignment.           |
| `locked`      | No       | `boolean`                                                                                                                                     |                                                                                    |
| `name`        | No       | `string`                                                                                                                                      |                                                                                    |
| `opacity`     | No       | `number`                                                                                                                                      |                                                                                    |
| `overrides`   | No       | Array of [DesignOverride](protocol.md#designoverride)                                                                                         |                                                                                    |
| `path`        | No       | Array of [DesignPathCommand](protocol.md#designpathcommand)                                                                                   |                                                                                    |
| `placement`   | No       | [DesignPlacement](protocol.md#designplacement)                                                                                                | Child sizing and positioning relative to its parent.                               |
| `rotation`    | No       | `number`                                                                                                                                      |                                                                                    |
| `style`       | No       | [DesignStyle](protocol.md#designstyle)                                                                                                        | Style can be shared across arbitrary primitives.                                   |
| `text`        | No       | [DesignText](protocol.md#designtext) / `null`                                                                                                 |                                                                                    |
| `visible`     | No       | `boolean`                                                                                                                                     |                                                                                    |
| `width`       | No       | `number`                                                                                                                                      |                                                                                    |
| `x`           | No       | `number`                                                                                                                                      |                                                                                    |
| `y`           | No       | `number`                                                                                                                                      |                                                                                    |

## DesignNodeRecord

Layer record.

| Field   | Required | Type                                          | Description |
| ------- | -------- | --------------------------------------------- | ----------- |
| `id`    | Yes      | `string`                                      |             |
| `kind`  | Yes      | `"node"`                                      |             |
| `value` | Yes      | [DesignNode](protocol.md#designnode) / `null` |             |

## DesignOperation

A transaction can contain different operation types.

Variant 1: [DesignInsert](protocol.md#designinsert)

| Field      | Required | Type                                 | Description |
| ---------- | -------- | ------------------------------------ | ----------- |
| `index`    | Yes      | `number`                             |             |
| `node`     | Yes      | [DesignNode](protocol.md#designnode) |             |
| `op`       | Yes      | `"insert"`                           |             |
| `pageId`   | Yes      | `string`                             |             |
| `parentId` | Yes      | `null,string`                        |             |

Variant 2: [DesignUpdate](protocol.md#designupdate)

| Field     | Required | Type                                               | Description |
| --------- | -------- | -------------------------------------------------- | ----------- |
| `changes` | Yes      | [DesignNodeChanges](protocol.md#designnodechanges) |             |
| `id`      | Yes      | `string`                                           |             |
| `op`      | Yes      | `"update"`                                         |             |

Variant 3: [DesignMove](protocol.md#designmove)

| Field      | Required | Type          | Description |
| ---------- | -------- | ------------- | ----------- |
| `id`       | Yes      | `string`      |             |
| `index`    | Yes      | `number`      |             |
| `op`       | Yes      | `"move"`      |             |
| `pageId`   | Yes      | `string`      |             |
| `parentId` | Yes      | `null,string` |             |

Variant 4: [DesignRemove](protocol.md#designremove)

| Field | Required | Type       | Description |
| ----- | -------- | ---------- | ----------- |
| `id`  | Yes      | `string`   |             |
| `op`  | Yes      | `"remove"` |             |

Variant 5: [DesignPageOperation](protocol.md#designpageoperation)

| Field        | Required | Type          | Description |
| ------------ | -------- | ------------- | ----------- |
| `background` | Yes      | `string`      |             |
| `id`         | Yes      | `string`      |             |
| `name`       | Yes      | `null,string` |             |
| `op`         | Yes      | `"page"`      |             |

Variant 6: [DesignMetadata](protocol.md#designmetadata)

| Field          | Required | Type                                                        | Description |
| -------------- | -------- | ----------------------------------------------------------- | ----------- |
| `comments`     | No       | Array of [DesignComment](protocol.md#designcomment)         |             |
| `interactions` | No       | Array of [DesignInteraction](protocol.md#designinteraction) |             |
| `name`         | No       | `string`                                                    |             |
| `op`           | Yes      | `"metadata"`                                                |             |
| `tokens`       | No       | Array of [DesignToken](protocol.md#designtoken)             |             |

## DesignOverride

Instance overrides target a source layer without modifying its component definition.

| Field     | Required | Type                                            | Description |
| --------- | -------- | ----------------------------------------------- | ----------- |
| `name`    | Yes      | `null,string`                                   |             |
| `nodeId`  | Yes      | `string`                                        |             |
| `style`   | Yes      | [DesignStyle](protocol.md#designstyle) / `null` |             |
| `text`    | Yes      | `null,string`                                   |             |
| `visible` | Yes      | `null,boolean`                                  |             |

## DesignPage

A page has its own root layers and viewport.

| Field        | Required | Type              | Description |
| ------------ | -------- | ----------------- | ----------- |
| `background` | Yes      | `string`          |             |
| `id`         | Yes      | `string`          |             |
| `name`       | Yes      | `string`          |             |
| `roots`      | Yes      | Array of `string` |             |

## DesignPageOperation

Create, rename or remove a page. Root lists are managed by tree operations.

| Field        | Required | Type          | Description |
| ------------ | -------- | ------------- | ----------- |
| `background` | Yes      | `string`      |             |
| `id`         | Yes      | `string`      |             |
| `name`       | Yes      | `null,string` |             |
| `op`         | Yes      | `"page"`      |             |

## DesignPageRecord

Page record.

| Field   | Required | Type                                          | Description |
| ------- | -------- | --------------------------------------------- | ----------- |
| `id`    | Yes      | `string`                                      |             |
| `kind`  | Yes      | `"page"`                                      |             |
| `value` | Yes      | [DesignPage](protocol.md#designpage) / `null` |             |

## DesignPaint

Layer paint. Colors are validated hex values, never arbitrary CSS.

| Field     | Required | Type                                                          | Description |
| --------- | -------- | ------------------------------------------------------------- | ----------- |
| `angle`   | Yes      | `number`                                                      |             |
| `assetId` | Yes      | `null,string`                                                 |             |
| `color`   | Yes      | `string`                                                      |             |
| `kind`    | Yes      | [DesignPaintKind](protocol.md#designpaintkind)                |             |
| `opacity` | Yes      | `number`                                                      |             |
| `stops`   | Yes      | Array of [DesignGradientStop](protocol.md#designgradientstop) |             |
| `tokenId` | Yes      | `null,string`                                                 |             |

## DesignPaintKind

Supported paint sources. Image assets use workspace references.

Type: `"image"` / `"linear"` / `"radial"` / `"solid"`.

## DesignPathCommand

A vector instruction in layer-local coordinates.

| Field    | Required | Type                                         | Description |
| -------- | -------- | -------------------------------------------- | ----------- |
| `values` | Yes      | Array of `number`                            |             |
| `verb`   | Yes      | [DesignPathVerb](protocol.md#designpathverb) |             |

## DesignPathVerb

Path verbs use explicit coordinates; cubic curves are preserved as editable geometry.

Type: `"C"` / `"L"` / `"M"` / `"Q"` / `"Z"`.

## DesignPlacement

Child sizing and positioning relative to its parent.

| Field        | Required | Type                                             | Description |
| ------------ | -------- | ------------------------------------------------ | ----------- |
| `absolute`   | Yes      | `boolean`                                        |             |
| `columnSpan` | Yes      | `number`                                         |             |
| `height`     | Yes      | [DesignSizing](protocol.md#designsizing)         |             |
| `horizontal` | Yes      | [DesignConstraint](protocol.md#designconstraint) |             |
| `maxHeight`  | Yes      | `number`                                         |             |
| `maxWidth`   | Yes      | `number`                                         |             |
| `minHeight`  | Yes      | `number`                                         |             |
| `minWidth`   | Yes      | `number`                                         |             |
| `rowSpan`    | Yes      | `number`                                         |             |
| `vertical`   | Yes      | [DesignConstraint](protocol.md#designconstraint) |             |
| `width`      | Yes      | [DesignSizing](protocol.md#designsizing)         |             |

## DesignReadMethod

Bounded snapshot RPC contract.

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignReadRequest](protocol.md#designreadrequest) |             |
| `result` | Yes      | [DesignRecordPage](protocol.md#designrecordpage)   |             |

## DesignReadRequest

Strictly revision-pinned pagination prevents merging chunks from different documents.

| Field      | Required | Type                                              | Description |
| ---------- | -------- | ------------------------------------------------- | ----------- |
| `cursor`   | Yes      | [DesignCursor](protocol.md#designcursor) / `null` |             |
| `id`       | Yes      | `string`                                          |             |
| `limit`    | Yes      | `number`                                          |             |
| `revision` | Yes      | `null,string`                                     |             |

## DesignReceipt

Commit acknowledgements contain no large text or scene snapshot.

| Field              | Required | Type                                       | Description |
| ------------------ | -------- | ------------------------------------------ | ----------- |
| `actor`            | Yes      | `string`                                   |             |
| `commandId`        | Yes      | `string`                                   |             |
| `previousRevision` | Yes      | `null,string`                              |             |
| `summary`          | Yes      | [DesignSummary](protocol.md#designsummary) |             |
| `undoable`         | Yes      | `boolean`                                  |             |

## DesignRecord

One complete entity, or a tombstone in a delta page.

Variant 1: [DesignNodeRecord](protocol.md#designnoderecord)

| Field   | Required | Type                                          | Description |
| ------- | -------- | --------------------------------------------- | ----------- |
| `id`    | Yes      | `string`                                      |             |
| `kind`  | Yes      | `"node"`                                      |             |
| `value` | Yes      | [DesignNode](protocol.md#designnode) / `null` |             |

Variant 2: [DesignPageRecord](protocol.md#designpagerecord)

| Field   | Required | Type                                          | Description |
| ------- | -------- | --------------------------------------------- | ----------- |
| `id`    | Yes      | `string`                                      |             |
| `kind`  | Yes      | `"page"`                                      |             |
| `value` | Yes      | [DesignPage](protocol.md#designpage) / `null` |             |

Variant 3: [DesignTokenRecord](protocol.md#designtokenrecord)

| Field   | Required | Type                                            | Description |
| ------- | -------- | ----------------------------------------------- | ----------- |
| `id`    | Yes      | `string`                                        |             |
| `kind`  | Yes      | `"token"`                                       |             |
| `value` | Yes      | [DesignToken](protocol.md#designtoken) / `null` |             |

Variant 4: [DesignInteractionRecord](protocol.md#designinteractionrecord)

| Field   | Required | Type                                                        | Description |
| ------- | -------- | ----------------------------------------------------------- | ----------- |
| `id`    | Yes      | `string`                                                    |             |
| `kind`  | Yes      | `"interaction"`                                             |             |
| `value` | Yes      | [DesignInteraction](protocol.md#designinteraction) / `null` |             |

Variant 5: [DesignCommentRecord](protocol.md#designcommentrecord)

| Field   | Required | Type                                                | Description |
| ------- | -------- | --------------------------------------------------- | ----------- |
| `id`    | Yes      | `string`                                            |             |
| `kind`  | Yes      | `"comment"`                                         |             |
| `value` | Yes      | [DesignComment](protocol.md#designcomment) / `null` |             |

## DesignRecordFragment

Large records use contiguous fragments, decoded only after complete assembly.

| Field    | Required | Type                                             | Description |
| -------- | -------- | ------------------------------------------------ | ----------- |
| `id`     | Yes      | `string`                                         |             |
| `kind`   | Yes      | [DesignRecordKind](protocol.md#designrecordkind) |             |
| `offset` | Yes      | `number`                                         |             |
| `text`   | Yes      | `string`                                         |             |
| `total`  | Yes      | `number`                                         |             |

## DesignRecordKind

Scene entities have independent transport identities.

Type: `"comment"` / `"interaction"` / `"node"` / `"page"` / `"token"`.

## DesignRecordPage

Independently bounded entity page with at most one partial record.

| Field        | Required | Type                                                              | Description |
| ------------ | -------- | ----------------------------------------------------------------- | ----------- |
| `fragment`   | Yes      | [DesignRecordFragment](protocol.md#designrecordfragment) / `null` |             |
| `nextCursor` | Yes      | [DesignCursor](protocol.md#designcursor) / `null`                 |             |
| `records`    | Yes      | Array of [DesignRecord](protocol.md#designrecord)                 |             |
| `summary`    | Yes      | [DesignSummary](protocol.md#designsummary)                        |             |

## DesignRemove

Delete a subtree and its anchored comments and prototype links.

| Field | Required | Type       | Description |
| ----- | -------- | ---------- | ----------- |
| `id`  | Yes      | `string`   |             |
| `op`  | Yes      | `"remove"` |             |

## DesignSaveMethod

Atomic editing RPC contract.

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignSaveRequest](protocol.md#designsaverequest) |             |
| `result` | Yes      | [DesignReceipt](protocol.md#designreceipt)         |             |

## DesignSaveRequest

Patch uses optimistic concurrency and a durable retry identity.

| Field              | Required | Type                                                    | Description |
| ------------------ | -------- | ------------------------------------------------------- | ----------- |
| `commandId`        | Yes      | `string`                                                |             |
| `expectedRevision` | Yes      | `string`                                                |             |
| `id`               | Yes      | `string`                                                |             |
| `operations`       | Yes      | Array of [DesignOperation](protocol.md#designoperation) |             |

## DesignShadow

Drop or inner shadow.

| Field    | Required | Type      | Description |
| -------- | -------- | --------- | ----------- |
| `blur`   | Yes      | `number`  |             |
| `color`  | Yes      | `string`  |             |
| `inner`  | Yes      | `boolean` |             |
| `spread` | Yes      | `number`  |             |
| `x`      | Yes      | `number`  |             |
| `y`      | Yes      | `number`  |             |

## DesignSizing

Sizing relative to the parent and content.

Type: `"fill"` / `"fixed"` / `"hug"`.

## DesignStroke

Outline properties.

| Field   | Required | Type                                   | Description |
| ------- | -------- | -------------------------------------- | ----------- |
| `dash`  | Yes      | Array of `number`                      |             |
| `paint` | Yes      | [DesignPaint](protocol.md#designpaint) |             |
| `width` | Yes      | `number`                               |             |

## DesignStyle

Style can be shared across arbitrary primitives.

| Field     | Required | Type                                              | Description |
| --------- | -------- | ------------------------------------------------- | ----------- |
| `blur`    | Yes      | `number`                                          |             |
| `corners` | Yes      | [DesignCorners](protocol.md#designcorners)        |             |
| `fills`   | Yes      | Array of [DesignPaint](protocol.md#designpaint)   |             |
| `shadows` | Yes      | Array of [DesignShadow](protocol.md#designshadow) |             |
| `stroke`  | Yes      | [DesignStroke](protocol.md#designstroke) / `null` |             |

## DesignSummary

Tiny management projection. Timestamps and revisions retain full integer precision.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `id`        | Yes      | `string` |             |
| `name`      | Yes      | `string` |             |
| `nodeCount` | Yes      | `number` |             |
| `pageCount` | Yes      | `number` |             |
| `revision`  | Yes      | `string` |             |
| `updatedAt` | Yes      | `string` |             |

## DesignText

Text layout is shared by the canvas, tools and exported designs.

| Field           | Required | Type                                                | Description |
| --------------- | -------- | --------------------------------------------------- | ----------- |
| `align`         | Yes      | [DesignAlign](protocol.md#designalign)              |             |
| `content`       | Yes      | `string`                                            |             |
| `family`        | Yes      | `string`                                            |             |
| `italic`        | Yes      | `boolean`                                           |             |
| `letterSpacing` | Yes      | `number`                                            |             |
| `lineHeight`    | Yes      | `number`                                            |             |
| `runs`          | Yes      | Array of [DesignTextRun](protocol.md#designtextrun) |             |
| `size`          | Yes      | `number`                                            |             |
| `weight`        | Yes      | `number`                                            |             |

## DesignTextRun

Rich text range. Offsets are UTF-16 indices into the layer's text.

| Field       | Required | Type      | Description |
| ----------- | -------- | --------- | ----------- |
| `color`     | Yes      | `string`  |             |
| `end`       | Yes      | `number`  |             |
| `family`    | Yes      | `string`  |             |
| `italic`    | Yes      | `boolean` |             |
| `size`      | Yes      | `number`  |             |
| `start`     | Yes      | `number`  |             |
| `underline` | Yes      | `boolean` |             |
| `weight`    | Yes      | `number`  |             |

## DesignToken

Named design-system values.

| Field      | Required | Type                                                   | Description |
| ---------- | -------- | ------------------------------------------------------ | ----------- |
| `category` | Yes      | [DesignTokenCategory](protocol.md#designtokencategory) |             |
| `id`       | Yes      | `string`                                               |             |
| `name`     | Yes      | `string`                                               |             |
| `value`    | Yes      | `string`                                               |             |

## DesignTokenCategory

Token families.

Type: `"color"` / `"spacing"` / `"typography"`.

## DesignTokenRecord

Token record.

| Field   | Required | Type                                            | Description |
| ------- | -------- | ----------------------------------------------- | ----------- |
| `id`    | Yes      | `string`                                        |             |
| `kind`  | Yes      | `"token"`                                       |             |
| `value` | Yes      | [DesignToken](protocol.md#designtoken) / `null` |             |

## DesignTransition

Prototype transitions.

Type: `"dissolve"` / `"instant"` / `"slide"`.

## DesignTrigger

Prototype triggers.

Type: `"after"` / `"click"` / `"hover"`.

## DesignUndoMethod

Conflict-safe undo RPC contract.

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignUndoRequest](protocol.md#designundorequest) |             |
| `result` | Yes      | [DesignReceipt](protocol.md#designreceipt)         |             |

## DesignUndoRequest

Undo names the committed transaction rather than accepting an untrusted state snapshot.

| Field              | Required | Type     | Description |
| ------------------ | -------- | -------- | ----------- |
| `commandId`        | Yes      | `string` |             |
| `expectedRevision` | Yes      | `string` |             |
| `id`               | Yes      | `string` |             |
| `targetCommandId`  | Yes      | `string` |             |

## DesignUpdate

Update only chosen properties, preserving unrelated edits.

| Field     | Required | Type                                               | Description |
| --------- | -------- | -------------------------------------------------- | ----------- |
| `changes` | Yes      | [DesignNodeChanges](protocol.md#designnodechanges) |             |
| `id`      | Yes      | `string`                                           |             |
| `op`      | Yes      | `"update"`                                         |             |

## DeviceApproveParams

Approving a device, optionally overriding the scopes it asked for.

| Field       | Required | Type                                | Description                                                                                   |
| ----------- | -------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `requestId` | Yes      | `string`                            |                                                                                               |
| `scopes`    | No       | Array of [Scope](protocol.md#scope) | Absent grants exactly what the device requested. A list here REPLACES that, and may widen it. |

## DeviceApproveResult

What `devices.approve` hands back. The token is plaintext exactly once.

| Field    | Required | Type                                 | Description |
| -------- | -------- | ------------------------------------ | ----------- |
| `device` | Yes      | [DeviceInfo](protocol.md#deviceinfo) |             |
| `token`  | Yes      | `string`                             |             |

## DeviceInfo

A paired device, without the credential.

| Field         | Required | Type                                | Description |
| ------------- | -------- | ----------------------------------- | ----------- |
| `approvedAt`  | Yes      | `number`                            |             |
| `deviceId`    | Yes      | `string`                            |             |
| `name`        | Yes      | `string`                            |             |
| `principalId` | No       | `string`                            |             |
| `scopes`      | Yes      | Array of [Scope](protocol.md#scope) |             |

## DeviceListResult

The device roster: what is paired and what is asking to be.

| Field      | Required | Type                                                        | Description |
| ---------- | -------- | ----------------------------------------------------------- | ----------- |
| `approved` | Yes      | Array of [DeviceInfo](protocol.md#deviceinfo)               |             |
| `pending`  | Yes      | Array of [DeviceRequestInfo](protocol.md#devicerequestinfo) |             |

## DeviceRefParams

Names a device.

| Field      | Required | Type     | Description |
| ---------- | -------- | -------- | ----------- |
| `deviceId` | Yes      | `string` |             |

## DeviceRequestInfo

A device waiting for an operator, as it appears on the wire.

| Field             | Required | Type                                | Description |
| ----------------- | -------- | ----------------------------------- | ----------- |
| `createdAt`       | Yes      | `number`                            |             |
| `deviceId`        | Yes      | `string`                            |             |
| `expiresAt`       | Yes      | `number`                            |             |
| `name`            | Yes      | `string`                            |             |
| `remoteAddress`   | Yes      | `string`                            |             |
| `requestId`       | Yes      | `string`                            |             |
| `requestedScopes` | Yes      | Array of [Scope](protocol.md#scope) |             |

## ErrorCode

A stable, machine-readable failure classification.

Type: `"aborted"` / `"auth"` / `"budget-exhausted"` / `"config"` / `"context-overflow"` / `"delivery-unconfirmed"` / `"denied"` / `"forbidden"` / `"internal"` / `"invalid-request"` / `"network"` / `"not-found"` / `"protocol"` / `"rate-limit"` / `"timeout"` / `"tool-execution"` / `"tool-input"` / `"upstream"`.

## Exclude

Type: `"reasoning"` / `"text"`.

## Exclude_1

Type: `"audio"` / `"boolean"` / `"datetime"` / `"file"` / `"flow"` / `"image"` / `"integer"` / `"json"` / `"message"` / `"number"` / `"table"` / `"text"` / `"timestamp"` / `"video"`.

## FinishReason

Why a turn stopped.

Type: `"aborted"` / `"error"` / `"length"` / `"refusal"` / `"stop"` / `"stop-sequence"` / `"tool-use"` / `"unknown"`.

## Session

Collapses the required/optional intersection into one object type.

| Field                | Required | Type                                 | Description |
| -------------------- | -------- | ------------------------------------ | ----------- |
| `activeToolFamilies` | No       | Array of `string`                    |             |
| `agentId`            | Yes      | `string`                             |             |
| `conversationId`     | Yes      | `null,string`                        |             |
| `createdAt`          | Yes      | `number`                             |             |
| `id`                 | Yes      | `string`                             |             |
| `messageCount`       | Yes      | `number`                             |             |
| `participants`       | Yes      | Array of `string`                    |             |
| `projectId`          | No       | `string`                             |             |
| `retryFingerprint`   | No       | `string`                             |             |
| `retryRequestId`     | No       | `string`                             |             |
| `retrySourceId`      | No       | `string`                             |             |
| `retryState`         | No       | `string`                             |             |
| `title`              | Yes      | `null,string`                        |             |
| `titleEdited`        | No       | `boolean`                            |             |
| `turnOpen`           | No       | `boolean`                            |             |
| `updatedAt`          | Yes      | `number`                             |             |
| `usage`              | Yes      | [TokenUsage](protocol.md#tokenusage) |             |
| `userId`             | No       | `string`                             |             |
| `workspaceId`        | No       | `string`                             |             |

## FunnelCohort

Exact cohort dimensions; games are already separated by owner/project in storage.

| Field                 | Required | Type     | Description |
| --------------------- | -------- | -------- | ----------- |
| `configRevision`      | Yes      | `string` |             |
| `device`              | Yes      | `string` |             |
| `experimentId`        | Yes      | `string` |             |
| `observedConfig`      | No       | `string` |             |
| `observedPerformance` | No       | `string` |             |
| `placeId`             | Yes      | `string` |             |
| `placeVersion`        | Yes      | `string` |             |
| `variant`             | Yes      | `string` |             |

## FunnelGroup

Bounded attempt counts, not unique users; each stage count is cumulative from the first step.

| Field        | Required | Type                                     | Description |
| ------------ | -------- | ---------------------------------------- | ----------- |
| `attempts`   | Yes      | `number`                                 |             |
| `cohort`     | Yes      | [FunnelCohort](protocol.md#funnelcohort) |             |
| `conversion` | Yes      | `number`                                 |             |
| `reached`    | Yes      | Array of `number`                        |             |
| `sessions`   | Yes      | `number`                                 |             |

## FunnelQuery

First-step cohort window and maximum allowed time to complete a funnel. Decimal milliseconds.

| Field                     | Required | Type              | Description |
| ------------------------- | -------- | ----------------- | ----------- |
| `appliedConfigKey`        | No       | `string`          |             |
| `completionWindowMs`      | Yes      | `string`          |             |
| `configLookbackMs`        | No       | `string`          |             |
| `fromMs`                  | Yes      | `string`          |             |
| `performanceFpsThreshold` | No       | `number`          |             |
| `performanceLookbackMs`   | No       | `string`          |             |
| `steps`                   | Yes      | Array of `string` |             |
| `toMs`                    | Yes      | `string`          |             |

## FunnelReport

Evidence returned to the model; raw player/session identifiers are not included.

| Field                           | Required | Type                                            | Description                                                                                    |
| ------------------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `caveats`                       | Yes      | Array of `string`                               |                                                                                                |
| `collection`                    | No       | [TelemetryHealth](protocol.md#telemetryhealth)  | Owner-visible collection evidence, not a guarantee that the game emitted every required event. |
| `duplicateEvents`               | Yes      | `number`                                        |                                                                                                |
| `generatedAtMs`                 | Yes      | `string`                                        |                                                                                                |
| `groups`                        | Yes      | Array of [FunnelGroup](protocol.md#funnelgroup) |                                                                                                |
| `ignoredClientEvents`           | Yes      | `number`                                        |                                                                                                |
| `latestMatchingEventMs`         | Yes      | `null,string`                                   |                                                                                                |
| `missingAttemptEvents`          | Yes      | `number`                                        |                                                                                                |
| `missingStartAttempts`          | Yes      | `number`                                        |                                                                                                |
| `mixedCohortAttempts`           | Yes      | `number`                                        |                                                                                                |
| `observedUntilMs`               | Yes      | `string`                                        |                                                                                                |
| `pendingAttempts`               | Yes      | `number`                                        |                                                                                                |
| `query`                         | Yes      | [FunnelQuery](protocol.md#funnelquery)          |                                                                                                |
| `repeatedStartEvents`           | Yes      | `number`                                        |                                                                                                |
| `unattributedConfigAttempts`    | No       | `number`                                        |                                                                                                |
| `unmeasuredPerformanceAttempts` | No       | `number`                                        |                                                                                                |

## GatewayFeatures

Methods, events, and additive capabilities supported by this gateway.

| Field                       | Required | Type                                               | Description                                                                                    |
| --------------------------- | -------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `attachments`               | No       | `true`                                             | User media attachments are validated and forwarded to the agent.                               |
| `binaryMedia`               | No       | `true`                                             | NXMD frames carry outbound file bytes; JSON results contain matching metadata.                 |
| `events`                    | Yes      | Array of `string`                                  |                                                                                                |
| `methodScopes`              | Yes      | [RecordstringScope](protocol.md#recordstringscope) | The scope each method requires.                                                                |
| `methods`                   | Yes      | Array of `string`                                  |                                                                                                |
| `officeAppearance`          | No       | `true`                                             | Stable employee cosmetics in NGOP v7.                                                          |
| `officeCompany`             | No       | `true`                                             | NCO2 persistent company staffing and project briefs.                                           |
| `officeCompanyLimits`       | No       | `true`                                             | Private company-wide funding and capacity over the existing connection.                        |
| `officeCompanyUpdates`      | No       | `true`                                             | Ordered private company subscriptions over the existing socket.                                |
| `officeConstruction`        | No       | `true`                                             | NCMP v4 owner construction and NGOP v5 public floor plans.                                     |
| `officeDepartmentKnowledge` | No       | `true`                                             | Private owner-reviewed department knowledge.                                                   |
| `officeDepartmentTools`     | No       | `true`                                             | NCO2 version two carries owner-approved department tool ceilings.                              |
| `officeDeskAssignments`     | No       | `true`                                             | Accepts NGOP v4 with saved visual desk assignments.                                            |
| `officeDeskPositions`       | No       | `true`                                             | Saved physical workstation positions in NGOP v8 and NCMP v8.                                   |
| `officeEmployeeCosts`       | No       | `true`                                             | Private employee results include exact original-attempt ledger costs.                          |
| `officeEmployeeDevelopment` | No       | `true`                                             | NCE1 version 4 supplies evidence-based accepted delivery history on the private owner channel. |
| `officeEmployeeResults`     | No       | `true`                                             | Read-only employee evidence on the existing private office connection.                         |
| `officeExecution`           | No       | `true`                                             | Scheduler workload summaries in NGOP v6.                                                       |
| `officeExecutionHosts`      | No       | `true`                                             | Passive owner-scoped workspace resources in the private NCH1 binary channel.                   |
| `officeGame`                | No       | `true`                                             | NGOP office state and player input share the authenticated gateway socket.                     |
| `officeGameVersion`         | No       | `3`                                                | NGOP version supporting server-issued acceptance celebrations.                                 |
| `officeLayout`              | No       | `true`                                             | Owner-only OLAY geometry commands.                                                             |
| `officeLayoutDesks`         | No       | `true`                                             | OLAY v2 atomically saves construction and permanent workstation coordinates.                   |
| `officeProjectBaselines`    | No       | `true`                                             | NCP2 version 2 with accepted-product baselines for new projects.                               |
| `officeProjectPermissions`  | No       | `true`                                             | Owner-only NCP2 v6 exact-call tool permissions tied to a live execution attempt.               |
| `officeProjectRecovery`     | No       | `true`                                             | Owner-only NCP2 v5 interruption reviews, with independently enforced financial recovery.       |
| `officeProjects`            | No       | `true`                                             | NCP2 private project decisions, subscriptions, and delivery chunks.                            |
| `officeShowroom`            | No       | `true`                                             | Owner-published accepted product labels in NGOP v9 and private NCP2 v4.                        |
| `officeVerification`        | No       | `true`                                             | Versioned host verification evidence on private project and employee channels.                 |
| `sessionHistory`            | No       | `true`                                             | Durable complete presentation history and binary restoration.                                  |
| `sessionHistoryUpdates`     | No       | `true`                                             | Session subscriptions notify exact journal ranges for live catch-up.                           |
| `transcriptBlocks`          | No       | `true`                                             | Compact persisted NDJSON blocks, read in bounded byte pages.                                   |
| `workflowDraftsVersion`     | No       | `1`                                                |                                                                                                |
| `workflowGraphVersion`      | No       | `1`                                                | Exact component catalog and structural validation of pinned drafts.                            |
| `workflowGroupsVersion`     | No       | `1`                                                | Saved parent-local groups, published aliases and paginated immutable group records.            |
| `workflowPlanningVersion`   | No       | `1`                                                | Owner-scoped draft storage with bounded reads and revision-safe direct patches.                |
| `workflowRunsVersion`       | No       | `1`                                                | Durable core workflow test runs and bounded output inspection.                                 |

## GatewayLimits

Configurable bounds on gateway-owned work and memory.

| Field                           | Required | Type     | Description                                                                 |
| ------------------------------- | -------- | -------- | --------------------------------------------------------------------------- |
| `handshakeTimeoutMs`            | Yes      | `number` | Time after the WebSocket upgrade to complete the application handshake.     |
| `maxConnections`                | Yes      | `number` | Active sockets plus upgrades awaiting authentication.                       |
| `maxOutboundBytes`              | Yes      | `number` | Estimated queued outbound storage and writes awaiting completion callbacks. |
| `maxRequestBytes`               | Yes      | `number` | Incoming RPC bytes plus estimated input retained by active streams.         |
| `maxRequests`                   | Yes      | `number` | Admitted RPC handlers across the process.                                   |
| `maxRequestsPerConnection`      | Yes      | `number` | Admitted RPC handlers on one socket.                                        |
| `maxRequestsPerPrincipal`       | Yes      | `number` | Admitted RPC handlers across an authenticated principal's sockets.          |
| `maxStreams`                    | Yes      | `number` | Streaming runs that have not finished cleanup.                              |
| `maxStreamsPerConnection`       | Yes      | `number` | Streaming runs owned by one socket.                                         |
| `maxStreamsPerPrincipal`        | Yes      | `number` | Streaming runs owned by one authenticated principal.                        |
| `maxSubscriptionsPerConnection` | Yes      | `number` | Distinct session subscriptions on one socket.                               |

## GatewayMethods

| Field                                | Required | Type                  | Description                                                                                |
| ------------------------------------ | -------- | --------------------- | ------------------------------------------------------------------------------------------ |
| `accounts.create`                    | Yes      | Object (fields below) |                                                                                            |
| `accounts.list`                      | Yes      | Object (fields below) |                                                                                            |
| `accounts.remove`                    | Yes      | Object (fields below) |                                                                                            |
| `accounts.usage`                     | Yes      | Object (fields below) |                                                                                            |
| `agent.ask`                          | Yes      | Object (fields below) |                                                                                            |
| `agent.steer`                        | Yes      | Object (fields below) |                                                                                            |
| `agent.stream`                       | Yes      | Object (fields below) |                                                                                            |
| `agents.define`                      | Yes      | Object (fields below) |                                                                                            |
| `agents.list`                        | Yes      | Object (fields below) |                                                                                            |
| `approvals.list`                     | Yes      | Object (fields below) |                                                                                            |
| `approvals.resolve`                  | Yes      | Object (fields below) |                                                                                            |
| `channels.deadLetters.list`          | Yes      | Object (fields below) |                                                                                            |
| `channels.list`                      | Yes      | Object (fields below) |                                                                                            |
| `channels.status`                    | Yes      | Object (fields below) |                                                                                            |
| `config.get`                         | Yes      | Object (fields below) |                                                                                            |
| `config.set`                         | Yes      | Object (fields below) |                                                                                            |
| `config.unset`                       | Yes      | Object (fields below) |                                                                                            |
| `connect`                            | Yes      | Object (fields below) |                                                                                            |
| `credit.budgets`                     | Yes      | Object (fields below) |                                                                                            |
| `credit.removeBudget`                | Yes      | Object (fields below) |                                                                                            |
| `credit.resetAllowance`              | Yes      | Object (fields below) |                                                                                            |
| `credit.resetHistory`                | Yes      | Object (fields below) |                                                                                            |
| `credit.resets`                      | Yes      | Object (fields below) |                                                                                            |
| `credit.setBudget`                   | Yes      | Object (fields below) |                                                                                            |
| `credit.summary`                     | Yes      | Object (fields below) |                                                                                            |
| `credit.wallet`                      | Yes      | Object (fields below) |                                                                                            |
| `credit.walletHistory`               | Yes      | Object (fields below) |                                                                                            |
| `data.upload.cancel`                 | Yes      | Object (fields below) |                                                                                            |
| `data.upload.chunk`                  | Yes      | Object (fields below) |                                                                                            |
| `data.upload.finish`                 | Yes      | Object (fields below) |                                                                                            |
| `data.upload.start`                  | Yes      | Object (fields below) |                                                                                            |
| `design.asset.cancel`                | Yes      | Object (fields below) |                                                                                            |
| `design.asset.chunk`                 | Yes      | Object (fields below) |                                                                                            |
| `design.asset.finish`                | Yes      | Object (fields below) |                                                                                            |
| `design.asset.list`                  | Yes      | Object (fields below) |                                                                                            |
| `design.asset.read`                  | Yes      | Object (fields below) |                                                                                            |
| `design.asset.remove`                | Yes      | Object (fields below) |                                                                                            |
| `design.asset.start`                 | Yes      | Object (fields below) |                                                                                            |
| `design.changes`                     | Yes      | Object (fields below) | Forward delta RPC contract.                                                                |
| `design.create`                      | Yes      | Object (fields below) | Create-document RPC contract.                                                              |
| `design.delete`                      | Yes      | Object (fields below) | Owner-scoped revision-safe document deletion.                                              |
| `design.events`                      | Yes      | Object (fields below) | Revision-journal RPC contract.                                                             |
| `design.layout`                      | Yes      | Object (fields below) | Computed-geometry RPC contract.                                                            |
| `design.list`                        | Yes      | Object (fields below) | Owner-scoped library RPC contract.                                                         |
| `design.read`                        | Yes      | Object (fields below) | Bounded snapshot RPC contract.                                                             |
| `design.save`                        | Yes      | Object (fields below) | Atomic editing RPC contract.                                                               |
| `design.undo`                        | Yes      | Object (fields below) | Conflict-safe undo RPC contract.                                                           |
| `devices.approve`                    | Yes      | Object (fields below) |                                                                                            |
| `devices.list`                       | Yes      | Object (fields below) |                                                                                            |
| `devices.reject`                     | Yes      | Object (fields below) |                                                                                            |
| `devices.revoke`                     | Yes      | Object (fields below) |                                                                                            |
| `health`                             | Yes      | Object (fields below) |                                                                                            |
| `jobs.add`                           | Yes      | Object (fields below) |                                                                                            |
| `jobs.list`                          | Yes      | Object (fields below) |                                                                                            |
| `jobs.remove`                        | Yes      | Object (fields below) |                                                                                            |
| `logs.tail`                          | Yes      | Object (fields below) |                                                                                            |
| `media.acknowledge`                  | Yes      | Object (fields below) |                                                                                            |
| `office.ownerProof`                  | Yes      | Object (fields below) | Bind an invitation to the authenticated socket's office, using a short-lived signed proof. |
| `processes.input`                    | Yes      | Object (fields below) |                                                                                            |
| `processes.list`                     | Yes      | Object (fields below) |                                                                                            |
| `processes.log`                      | Yes      | Object (fields below) |                                                                                            |
| `processes.resize`                   | Yes      | Object (fields below) |                                                                                            |
| `processes.stop`                     | Yes      | Object (fields below) |                                                                                            |
| `reverse.browser`                    | Yes      | Object (fields below) |                                                                                            |
| `reverse.browser.modules`            | Yes      | Object (fields below) |                                                                                            |
| `reverse.browser.screenshot`         | Yes      | Object (fields below) |                                                                                            |
| `reverse.browser.sources`            | Yes      | Object (fields below) |                                                                                            |
| `reverse.browser.storage`            | Yes      | Object (fields below) |                                                                                            |
| `reverse.browser.storage.comparison` | Yes      | Object (fields below) |                                                                                            |
| `reverse.browser.structure`          | Yes      | Object (fields below) |                                                                                            |
| `reverse.browser.webmcp`             | Yes      | Object (fields below) |                                                                                            |
| `reverse.catalog`                    | Yes      | Object (fields below) |                                                                                            |
| `reverse.evidence`                   | Yes      | Object (fields below) |                                                                                            |
| `reverse.functions`                  | Yes      | Object (fields below) |                                                                                            |
| `reverse.graph`                      | Yes      | Object (fields below) |                                                                                            |
| `reverse.inspect`                    | Yes      | Object (fields below) |                                                                                            |
| `reverse.network`                    | Yes      | Object (fields below) |                                                                                            |
| `reverse.network.detail`             | Yes      | Object (fields below) |                                                                                            |
| `roblox.credentials.remove`          | Yes      | Object (fields below) |                                                                                            |
| `roblox.credentials.set`             | Yes      | Object (fields below) |                                                                                            |
| `roblox.credentials.status`          | Yes      | Object (fields below) |                                                                                            |
| `roblox.telemetry.funnel`            | Yes      | Object (fields below) |                                                                                            |
| `roblox.telemetry.performance`       | Yes      | Object (fields below) |                                                                                            |
| `roblox.telemetry.projects`          | Yes      | Object (fields below) |                                                                                            |
| `sessions.delete`                    | Yes      | Object (fields below) |                                                                                            |
| `sessions.download`                  | Yes      | Object (fields below) |                                                                                            |
| `sessions.files`                     | Yes      | Object (fields below) |                                                                                            |
| `sessions.get`                       | Yes      | Object (fields below) |                                                                                            |
| `sessions.input`                     | Yes      | Object (fields below) |                                                                                            |
| `sessions.list`                      | Yes      | Object (fields below) |                                                                                            |
| `sessions.messages`                  | Yes      | Object (fields below) |                                                                                            |
| `sessions.pin`                       | Yes      | Object (fields below) |                                                                                            |
| `sessions.pins`                      | Yes      | Object (fields below) |                                                                                            |
| `sessions.rename`                    | Yes      | Object (fields below) |                                                                                            |
| `sessions.retry`                     | Yes      | Object (fields below) |                                                                                            |
| `sessions.subscribe`                 | Yes      | Object (fields below) |                                                                                            |
| `sessions.transcript`                | Yes      | Object (fields below) | Compact transcript blocks with original journal byte cursors.                              |
| `sessions.unpin`                     | Yes      | Object (fields below) |                                                                                            |
| `sessions.unsubscribe`               | Yes      | Object (fields below) |                                                                                            |
| `shares.create`                      | Yes      | Object (fields below) |                                                                                            |
| `shares.list`                        | Yes      | Object (fields below) |                                                                                            |
| `shares.remove`                      | Yes      | Object (fields below) |                                                                                            |
| `shares.setMember`                   | Yes      | Object (fields below) |                                                                                            |
| `tasks.cancel`                       | Yes      | Object (fields below) |                                                                                            |
| `tasks.get`                          | Yes      | Object (fields below) |                                                                                            |
| `tasks.list`                         | Yes      | Object (fields below) |                                                                                            |
| `teams.create`                       | Yes      | Object (fields below) |                                                                                            |
| `teams.list`                         | Yes      | Object (fields below) |                                                                                            |
| `teams.remove`                       | Yes      | Object (fields below) |                                                                                            |
| `teams.setMember`                    | Yes      | Object (fields below) |                                                                                            |
| `voice.audio`                        | Yes      | Object (fields below) |                                                                                            |
| `voice.start`                        | Yes      | Object (fields below) |                                                                                            |
| `voice.stop`                         | Yes      | Object (fields below) |                                                                                            |
| `workflows.attention.list`           | Yes      | Object (fields below) |                                                                                            |
| `workflows.catalog`                  | Yes      | Object (fields below) |                                                                                            |
| `workflows.create`                   | Yes      | Object (fields below) |                                                                                            |
| `workflows.delete`                   | Yes      | Object (fields below) |                                                                                            |
| `workflows.list`                     | Yes      | Object (fields below) |                                                                                            |
| `workflows.models`                   | Yes      | Object (fields below) |                                                                                            |
| `workflows.models.image.quote`       | Yes      | Object (fields below) |                                                                                            |
| `workflows.models.image.resolve`     | Yes      | Object (fields below) |                                                                                            |
| `workflows.models.refresh`           | Yes      | Object (fields below) |                                                                                            |
| `workflows.models.resolve`           | Yes      | Object (fields below) |                                                                                            |
| `workflows.planning.cancel`          | Yes      | Object (fields below) |                                                                                            |
| `workflows.planning.history`         | Yes      | Object (fields below) |                                                                                            |
| `workflows.planning.read`            | Yes      | Object (fields below) |                                                                                            |
| `workflows.planning.send`            | Yes      | Object (fields below) |                                                                                            |
| `workflows.planning.sources`         | Yes      | Object (fields below) |                                                                                            |
| `workflows.publications.check`       | Yes      | Object (fields below) |                                                                                            |
| `workflows.publications.list`        | Yes      | Object (fields below) |                                                                                            |
| `workflows.publications.publish`     | Yes      | Object (fields below) |                                                                                            |
| `workflows.publications.read`        | Yes      | Object (fields below) |                                                                                            |
| `workflows.publications.run`         | Yes      | Object (fields below) |                                                                                            |
| `workflows.read`                     | Yes      | Object (fields below) |                                                                                            |
| `workflows.record`                   | Yes      | Object (fields below) |                                                                                            |
| `workflows.records`                  | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.agent.control`       | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.agent.input`         | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.agent.read`          | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.applications.check`  | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.applications.setup`  | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.approval.decide`     | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.artifact`            | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.artifacts`           | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.attempts`            | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.cancel`              | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.events`              | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.inputs`              | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.list`                | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.loopPricing`         | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.loopSpending`        | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.output`              | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.question.answer`     | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.question.read`       | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.questions`           | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.read`                | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.start`               | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.steps`               | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.terminal.command`    | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.terminal.read`       | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.usage`               | Yes      | Object (fields below) |                                                                                            |
| `workflows.runs.usageBreakdown`      | Yes      | Object (fields below) |                                                                                            |
| `workflows.save`                     | Yes      | Object (fields below) |                                                                                            |
| `workflows.schedules.disable`        | Yes      | Object (fields below) |                                                                                            |
| `workflows.schedules.enable`         | Yes      | Object (fields below) |                                                                                            |
| `workflows.schedules.preview`        | Yes      | Object (fields below) |                                                                                            |
| `workflows.schedules.read`           | Yes      | Object (fields below) |                                                                                            |
| `workflows.validate`                 | Yes      | Object (fields below) |                                                                                            |
| `workspaces.create`                  | Yes      | Object (fields below) |                                                                                            |
| `workspaces.describe`                | Yes      | Object (fields below) |                                                                                            |
| `workspaces.destroy`                 | Yes      | Object (fields below) |                                                                                            |
| `workspaces.list`                    | Yes      | Object (fields below) |                                                                                            |

**accounts.create**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [AccountCreateParams](protocol.md#accountcreateparams) |             |
| `result` | Yes      | [AccountSummary](protocol.md#accountsummary)           |             |

**accounts.list**

| Field    | Required | Type                                                  | Description |
| -------- | -------- | ----------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever)    |             |
| `result` | Yes      | Array of [AccountSummary](protocol.md#accountsummary) |             |

**accounts.remove**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [AccountRemoveParams](protocol.md#accountremoveparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)                       |             |

**accounts.usage**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [AccountsUsageParams](protocol.md#accountsusageparams) |             |
| `result` | Yes      | [AccountsUsageResult](protocol.md#accountsusageresult) |             |

**agent.ask**

| Field    | Required | Type                               | Description |
| -------- | -------- | ---------------------------------- | ----------- |
| `params` | Yes      | [AskParams](protocol.md#askparams) |             |
| `result` | Yes      | [AskResult](protocol.md#askresult) |             |

**agent.steer**

| Field    | Required | Type                                   | Description |
| -------- | -------- | -------------------------------------- | ----------- |
| `params` | Yes      | [SteerParams](protocol.md#steerparams) |             |
| `result` | Yes      | Object (fields below)                  |             |

**agent.steer.result**

| Field      | Required | Type      | Description |
| ---------- | -------- | --------- | ----------- |
| `accepted` | Yes      | `boolean` |             |

**agent.stream**

| Field    | Required | Type                                         | Description |
| -------- | -------- | -------------------------------------------- | ----------- |
| `params` | Yes      | [StreamParams](protocol.md#streamparams)     |             |
| `result` | Yes      | [StreamAccepted](protocol.md#streamaccepted) |             |

**agents.define**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [AgentDefineParams](protocol.md#agentdefineparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)                   |             |

**agents.list**

| Field    | Required | Type                                                    | Description |
| -------- | -------- | ------------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever)      |             |
| `result` | Yes      | Array of [AgentDefinition](protocol.md#agentdefinition) |             |

**approvals.list**

| Field    | Required | Type                                                    | Description |
| -------- | -------- | ------------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever)      |             |
| `result` | Yes      | Array of [PendingApproval](protocol.md#pendingapproval) |             |

**approvals.resolve**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [ApprovalResolveParams](protocol.md#approvalresolveparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)                           |             |

**channels.deadLetters.list**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | Array of [DeadLetter](protocol.md#deadletter)      |             |

**channels.list**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | Array of [ChannelInfo](protocol.md#channelinfo)    |             |

**channels.status**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams)                       |             |
| `result` | Yes      | [ChannelStatusResult](protocol.md#channelstatusresult) |             |

**config.get**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | [ConfigResult](protocol.md#configresult)           |             |

**config.set**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [ConfigWriteParams](protocol.md#configwriteparams) |             |
| `result` | Yes      | [ConfigWriteResult](protocol.md#configwriteresult) |             |

**config.unset**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | Object (fields below)                              |             |
| `result` | Yes      | [ConfigWriteResult](protocol.md#configwriteresult) |             |

**config.unset.params**

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `key` | Yes      | `string` |             |

**connect**

| Field    | Required | Type                                       | Description |
| -------- | -------- | ------------------------------------------ | ----------- |
| `params` | Yes      | [ConnectParams](protocol.md#connectparams) |             |
| `result` | Yes      | [HelloOk](protocol.md#hellook)             |             |

**credit.budgets**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | Array of [Budget](protocol.md#budget)              |             |

**credit.removeBudget**

| Field    | Required | Type                  | Description |
| -------- | -------- | --------------------- | ----------- |
| `params` | Yes      | Object (fields below) |             |
| `result` | Yes      | Object (fields below) |             |

**credit.removeBudget.params**

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

**credit.removeBudget.result**

| Field | Required | Type   | Description |
| ----- | -------- | ------ | ----------- |
| `ok`  | Yes      | `true` |             |

**credit.resetAllowance**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [ResetAllowanceParams](protocol.md#resetallowanceparams) |             |
| `result` | Yes      | [ResetAllowanceResult](protocol.md#resetallowanceresult) |             |

**credit.resetHistory**

| Field    | Required | Type                                             | Description |
| -------- | -------- | ------------------------------------------------ | ----------- |
| `params` | Yes      | Object (fields below)                            |             |
| `result` | Yes      | [ResetHistoryPage](protocol.md#resethistorypage) |             |

**credit.resetHistory.params**

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `before` | No       | `string` |             |
| `userId` | No       | `string` |             |

**credit.resets**

| Field    | Required | Type                                                | Description |
| -------- | -------- | --------------------------------------------------- | ----------- |
| `params` | Yes      | Object (fields below)                               |             |
| `result` | Yes      | [ResetSnapshot](protocol.md#resetsnapshot) / `null` |             |

**credit.resets.params**

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `userId` | No       | `string` |             |

**credit.setBudget**

| Field    | Required | Type                         | Description |
| -------- | -------- | ---------------------------- | ----------- |
| `params` | Yes      | Object (fields below)        |             |
| `result` | Yes      | [Budget](protocol.md#budget) |             |

**credit.setBudget.params**

| Field             | Required | Type                                               | Description |
| ----------------- | -------- | -------------------------------------------------- | ----------- |
| `enforcement`     | Yes      | [BudgetEnforcement](protocol.md#budgetenforcement) |             |
| `id`              | No       | `string`                                           |             |
| `limitMicrocents` | Yes      | `number`                                           |             |
| `period`          | Yes      | [BudgetPeriod](protocol.md#budgetperiod)           |             |
| `scope`           | Yes      | [CreditScope](protocol.md#creditscope)             |             |
| `scopeId`         | Yes      | `string`                                           |             |

**credit.summary**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [CreditSummaryParams](protocol.md#creditsummaryparams) |             |
| `result` | Yes      | [CreditSummary](protocol.md#creditsummary)             |             |

**credit.wallet**

| Field    | Required | Type                                                  | Description |
| -------- | -------- | ----------------------------------------------------- | ----------- |
| `params` | Yes      | Object (fields below)                                 |             |
| `result` | Yes      | [WalletSnapshot](protocol.md#walletsnapshot) / `null` |             |

**credit.wallet.params**

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `userId` | No       | `string` |             |

**credit.walletHistory**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | Object (fields below)                              |             |
| `result` | Yes      | [WalletHistoryPage](protocol.md#wallethistorypage) |             |

**credit.walletHistory.params**

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `before` | No       | `string` |             |
| `userId` | No       | `string` |             |

**data.upload.cancel**

| Field    | Required | Type                                                 | Description |
| -------- | -------- | ---------------------------------------------------- | ----------- |
| `params` | Yes      | [DataUploadIdParams](protocol.md#datauploadidparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)                     |             |

**data.upload.chunk**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [DataUploadChunkParams](protocol.md#datauploadchunkparams) |             |
| `result` | Yes      | [DataUploadPosition](protocol.md#datauploadposition)       |             |

**data.upload.finish**

| Field    | Required | Type                                                 | Description |
| -------- | -------- | ---------------------------------------------------- | ----------- |
| `params` | Yes      | [DataUploadIdParams](protocol.md#datauploadidparams) |             |
| `result` | Yes      | [DataFile](protocol.md#datafile)                     |             |

**data.upload.start**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [DataUploadStartParams](protocol.md#datauploadstartparams) |             |
| `result` | Yes      | [DataUpload](protocol.md#dataupload)                       |             |

**design.asset.cancel**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignAssetIdRequest](protocol.md#designassetidrequest) |             |
| `result` | Yes      | `null`                                                   |             |

**design.asset.chunk**

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignAssetChunkRequest](protocol.md#designassetchunkrequest) |             |
| `result` | Yes      | [DesignAssetPosition](protocol.md#designassetposition)         |             |

**design.asset.finish**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignAssetIdRequest](protocol.md#designassetidrequest) |             |
| `result` | Yes      | [DesignAsset](protocol.md#designasset)                   |             |

**design.asset.list**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignAssetListRequest](protocol.md#designassetlistrequest) |             |
| `result` | Yes      | [DesignAssetListPage](protocol.md#designassetlistpage)       |             |

**design.asset.read**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignAssetReadRequest](protocol.md#designassetreadrequest) |             |
| `result` | Yes      | [DesignAssetSlice](protocol.md#designassetslice)             |             |

**design.asset.remove**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignAssetIdRequest](protocol.md#designassetidrequest) |             |
| `result` | Yes      | `null`                                                   |             |

**design.asset.start**

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignAssetStartRequest](protocol.md#designassetstartrequest) |             |
| `result` | Yes      | [DesignAssetPosition](protocol.md#designassetposition)         |             |

**design.changes**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignChangesRequest](protocol.md#designchangesrequest) |             |
| `result` | Yes      | [DesignRecordPage](protocol.md#designrecordpage)         |             |

**design.create**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignCreateRequest](protocol.md#designcreaterequest) |             |
| `result` | Yes      | [DesignReceipt](protocol.md#designreceipt)             |             |

**design.delete**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignDeleteRequest](protocol.md#designdeleterequest) |             |
| `result` | Yes      | [DesignDeleteReceipt](protocol.md#designdeletereceipt) |             |

**design.events**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignEventsRequest](protocol.md#designeventsrequest) |             |
| `result` | Yes      | [DesignEventsPage](protocol.md#designeventspage)       |             |

**design.layout**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [DesignLayoutRequest](protocol.md#designlayoutrequest) |             |
| `result` | Yes      | [DesignLayoutPage](protocol.md#designlayoutpage)       |             |

**design.list**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignListRequest](protocol.md#designlistrequest) |             |
| `result` | Yes      | [DesignListPage](protocol.md#designlistpage)       |             |

**design.read**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignReadRequest](protocol.md#designreadrequest) |             |
| `result` | Yes      | [DesignRecordPage](protocol.md#designrecordpage)   |             |

**design.save**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignSaveRequest](protocol.md#designsaverequest) |             |
| `result` | Yes      | [DesignReceipt](protocol.md#designreceipt)         |             |

**design.undo**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [DesignUndoRequest](protocol.md#designundorequest) |             |
| `result` | Yes      | [DesignReceipt](protocol.md#designreceipt)         |             |

**devices.approve**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [DeviceApproveParams](protocol.md#deviceapproveparams) |             |
| `result` | Yes      | [DeviceApproveResult](protocol.md#deviceapproveresult) |             |

**devices.list**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | [DeviceListResult](protocol.md#devicelistresult)   |             |

**devices.reject**

| Field    | Required | Type                             | Description |
| -------- | -------- | -------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult) |             |

**devices.revoke**

| Field    | Required | Type                                           | Description |
| -------- | -------- | ---------------------------------------------- | ----------- |
| `params` | Yes      | [DeviceRefParams](protocol.md#devicerefparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)               |             |

**health**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | [HealthResult](protocol.md#healthresult)           |             |

**jobs.add**

| Field    | Required | Type                                     | Description |
| -------- | -------- | ---------------------------------------- | ----------- |
| `params` | Yes      | [JobAddParams](protocol.md#jobaddparams) |             |
| `result` | Yes      | [IdParams](protocol.md#idparams)         |             |

**jobs.list**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | Array of [Job](protocol.md#job)                    |             |

**jobs.remove**

| Field    | Required | Type                             | Description |
| -------- | -------- | -------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult) |             |

**logs.tail**

| Field    | Required | Type                                        | Description |
| -------- | -------- | ------------------------------------------- | ----------- |
| `params` | Yes      | [LogTailParams](protocol.md#logtailparams)  |             |
| `result` | Yes      | Array of [LogRecord](protocol.md#logrecord) |             |

**media.acknowledge**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [MediaAcknowledgeParams](protocol.md#mediaacknowledgeparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)                             |             |

**office.ownerProof**

| Field    | Required | Type                  | Description |
| -------- | -------- | --------------------- | ----------- |
| `params` | Yes      | Object (fields below) |             |
| `result` | Yes      | Object (fields below) |             |

**office.ownerProof.params**

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `accountId` | Yes      | `string` |             |

**office.ownerProof.result**

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `proof` | Yes      | `string` |             |

**processes.input**

| Field    | Required | Type                                     | Description |
| -------- | -------- | ---------------------------------------- | ----------- |
| `params` | Yes      | [ProcessInput](protocol.md#processinput) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)         |             |

**processes.list**

| Field    | Required | Type                                                        | Description |
| -------- | -------- | ----------------------------------------------------------- | ----------- |
| `params` | Yes      | [SessionRef](protocol.md#sessionref)                        |             |
| `result` | Yes      | Array of [BackgroundProcess](protocol.md#backgroundprocess) |             |

**processes.log**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [ProcessLogRef](protocol.md#processlogref)               |             |
| `result` | Yes      | [BackgroundProcessLog](protocol.md#backgroundprocesslog) |             |

**processes.resize**

| Field    | Required | Type                                       | Description |
| -------- | -------- | ------------------------------------------ | ----------- |
| `params` | Yes      | [ProcessResize](protocol.md#processresize) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)           |             |

**processes.stop**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [BackgroundProcessRef](protocol.md#backgroundprocessref) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)                         |             |

**reverse.browser**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [ReverseBrowserQuery](protocol.md#reversebrowserquery) |             |
| `result` | Yes      | [ReverseBrowserPage](protocol.md#reversebrowserpage)   |             |

**reverse.browser.modules**

| Field    | Required | Type                                                 | Description |
| -------- | -------- | ---------------------------------------------------- | ----------- |
| `params` | Yes      | [BrowserModuleQuery](protocol.md#browsermodulequery) |             |
| `result` | Yes      | [BrowserModulePage](protocol.md#browsermodulepage)   |             |

**reverse.browser.screenshot**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [BrowserScreenshotQuery](protocol.md#browserscreenshotquery) |             |
| `result` | Yes      | [BrowserScreenshotPage](protocol.md#browserscreenshotpage)   |             |

**reverse.browser.sources**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [BrowserSourcesQuery](protocol.md#browsersourcesquery) |             |
| `result` | Yes      | [BrowserSourcesPage](protocol.md#browsersourcespage)   |             |

**reverse.browser.storage**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [BrowserStorageQuery](protocol.md#browserstoragequery) |             |
| `result` | Yes      | [BrowserStoragePage](protocol.md#browserstoragepage)   |             |

**reverse.browser.storage.comparison**

| Field    | Required | Type                                                                       | Description |
| -------- | -------- | -------------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [BrowserStorageComparisonQuery](protocol.md#browserstoragecomparisonquery) |             |
| `result` | Yes      | [BrowserStorageComparisonPage](protocol.md#browserstoragecomparisonpage)   |             |

**reverse.browser.structure**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [BrowserStructureQuery](protocol.md#browserstructurequery) |             |
| `result` | Yes      | [BrowserStructurePage](protocol.md#browserstructurepage)   |             |

**reverse.browser.webmcp**

| Field    | Required | Type                                                 | Description |
| -------- | -------- | ---------------------------------------------------- | ----------- |
| `params` | Yes      | [BrowserWebMcpQuery](protocol.md#browserwebmcpquery) |             |
| `result` | Yes      | [BrowserWebMcpPage](protocol.md#browserwebmcppage)   |             |

**reverse.catalog**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [ReverseCatalogQuery](protocol.md#reversecatalogquery) |             |
| `result` | Yes      | [ReverseCatalogPage](protocol.md#reversecatalogpage)   |             |

**reverse.evidence**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [ReverseEvidenceQuery](protocol.md#reverseevidencequery) |             |
| `result` | Yes      | [ReverseEvidencePage](protocol.md#reverseevidencepage)   |             |

**reverse.functions**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [ReverseFunctionsQuery](protocol.md#reversefunctionsquery) |             |
| `result` | Yes      | [ReverseFunctionsPage](protocol.md#reversefunctionspage)   |             |

**reverse.graph**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [ReverseGraphQuery](protocol.md#reversegraphquery) |             |
| `result` | Yes      | [ReverseGraphPage](protocol.md#reversegraphpage)   |             |

**reverse.inspect**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [ReverseInspectQuery](protocol.md#reverseinspectquery)   |             |
| `result` | Yes      | [ReverseInspectResult](protocol.md#reverseinspectresult) |             |

**reverse.network**

| Field    | Required | Type                                                                     | Description |
| -------- | -------- | ------------------------------------------------------------------------ | ----------- |
| `params` | Yes      | [ReverseNetworkDirectoryQuery](protocol.md#reversenetworkdirectoryquery) |             |
| `result` | Yes      | [ReverseNetworkDirectoryPage](protocol.md#reversenetworkdirectorypage)   |             |

**reverse.network.detail**

| Field    | Required | Type                                                               | Description |
| -------- | -------- | ------------------------------------------------------------------ | ----------- |
| `params` | Yes      | [ReverseNetworkDetailQuery](protocol.md#reversenetworkdetailquery) |             |
| `result` | Yes      | [ReverseNetworkDetailPage](protocol.md#reversenetworkdetailpage)   |             |

**roblox.credentials.remove**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever)           |             |
| `result` | Yes      | [RobloxCredentialStatus](protocol.md#robloxcredentialstatus) |             |

**roblox.credentials.set**

| Field    | Required | Type                                                               | Description |
| -------- | -------- | ------------------------------------------------------------------ | ----------- |
| `params` | Yes      | [RobloxCredentialSetParams](protocol.md#robloxcredentialsetparams) |             |
| `result` | Yes      | [RobloxCredentialStatus](protocol.md#robloxcredentialstatus)       |             |

**roblox.credentials.status**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever)           |             |
| `result` | Yes      | [RobloxCredentialStatus](protocol.md#robloxcredentialstatus) |             |

**roblox.telemetry.funnel**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [TelemetryFunnelParams](protocol.md#telemetryfunnelparams) |             |
| `result` | Yes      | [FunnelReport](protocol.md#funnelreport)                   |             |

**roblox.telemetry.performance**

| Field    | Required | Type                                                                 | Description |
| -------- | -------- | -------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [TelemetryPerformanceParams](protocol.md#telemetryperformanceparams) |             |
| `result` | Yes      | [PerformanceReport](protocol.md#performancereport)                   |             |

**roblox.telemetry.projects**

| Field    | Required | Type                                                      | Description |
| -------- | -------- | --------------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever)        |             |
| `result` | Yes      | Array of [TelemetryProject](protocol.md#telemetryproject) |             |

**sessions.delete**

| Field    | Required | Type                             | Description |
| -------- | -------- | -------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult) |             |

**sessions.download**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [SessionFileParams](protocol.md#sessionfileparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)                   |             |

**sessions.files**

| Field    | Required | Type                                                            | Description |
| -------- | -------- | --------------------------------------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams)                                |             |
| `result` | Yes      | Array of [DeliveredAttachment](protocol.md#deliveredattachment) |             |

**sessions.get**

| Field    | Required | Type                                    | Description |
| -------- | -------- | --------------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams)        |             |
| `result` | Yes      | [Session](protocol.md#session) / `null` |             |

**sessions.input**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [ConversationPinParams](protocol.md#conversationpinparams) |             |
| `result` | Yes      | [ConversationInput](protocol.md#conversationinput)         |             |

**sessions.list**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [SessionListParams](protocol.md#sessionlistparams) |             |
| `result` | Yes      | Array of [Session](protocol.md#session)            |             |

**sessions.messages**

| Field    | Required | Type                                              | Description |
| -------- | -------- | ------------------------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams)                  |             |
| `result` | Yes      | Array of [ModelMessage](protocol.md#modelmessage) |             |

**sessions.pin**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [ConversationPinParams](protocol.md#conversationpinparams) |             |
| `result` | Yes      | [ConversationPin](protocol.md#conversationpin)             |             |

**sessions.pins**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [ConversationPinsParams](protocol.md#conversationpinsparams) |             |
| `result` | Yes      | [ConversationPinsPage](protocol.md#conversationpinspage)     |             |

**sessions.rename**

| Field    | Required | Type                                                             | Description |
| -------- | -------- | ---------------------------------------------------------------- | ----------- |
| `params` | Yes      | [ConversationRenameParams](protocol.md#conversationrenameparams) |             |
| `result` | Yes      | [Session](protocol.md#session)                                   |             |

**sessions.retry**

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [ConversationRetryParams](protocol.md#conversationretryparams) |             |
| `result` | Yes      | [ConversationRetryResult](protocol.md#conversationretryresult) |             |

**sessions.subscribe**

| Field    | Required | Type                                 | Description |
| -------- | -------- | ------------------------------------ | ----------- |
| `params` | Yes      | [SessionRef](protocol.md#sessionref) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)     |             |

**sessions.transcript**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [SessionHistoryParams](protocol.md#sessionhistoryparams) |             |
| `result` | Yes      | [SessionHistoryPage](protocol.md#sessionhistorypage)     |             |

**sessions.unpin**

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [ConversationUnpinParams](protocol.md#conversationunpinparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)                               |             |

**sessions.unsubscribe**

| Field    | Required | Type                                 | Description |
| -------- | -------- | ------------------------------------ | ----------- |
| `params` | Yes      | [SessionRef](protocol.md#sessionref) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)     |             |

**shares.create**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [ShareCreateParams](protocol.md#sharecreateparams) |             |
| `result` | Yes      | [ShareSummary](protocol.md#sharesummary)           |             |

**shares.list**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | Array of [ShareSummary](protocol.md#sharesummary)  |             |

**shares.remove**

| Field    | Required | Type                             | Description |
| -------- | -------- | -------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult) |             |

**shares.setMember**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [ShareMemberParams](protocol.md#sharememberparams) |             |
| `result` | Yes      | [ShareSummary](protocol.md#sharesummary)           |             |

**tasks.cancel**

| Field    | Required | Type                             | Description |
| -------- | -------- | -------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult) |             |

**tasks.get**

| Field    | Required | Type                                          | Description |
| -------- | -------- | --------------------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams)              |             |
| `result` | Yes      | [TaskRecord](protocol.md#taskrecord) / `null` |             |

**tasks.list**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | Array of [TaskRecord](protocol.md#taskrecord)      |             |

**teams.create**

| Field    | Required | Type                                             | Description |
| -------- | -------- | ------------------------------------------------ | ----------- |
| `params` | Yes      | [TeamCreateParams](protocol.md#teamcreateparams) |             |
| `result` | Yes      | [TeamSummary](protocol.md#teamsummary)           |             |

**teams.list**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | Array of [TeamSummary](protocol.md#teamsummary)    |             |

**teams.remove**

| Field    | Required | Type                             | Description |
| -------- | -------- | -------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult) |             |

**teams.setMember**

| Field    | Required | Type                                             | Description |
| -------- | -------- | ------------------------------------------------ | ----------- |
| `params` | Yes      | [TeamMemberParams](protocol.md#teammemberparams) |             |
| `result` | Yes      | [TeamSummary](protocol.md#teamsummary)           |             |

**voice.audio**

| Field    | Required | Type                                             | Description |
| -------- | -------- | ------------------------------------------------ | ----------- |
| `params` | Yes      | [VoiceAudioParams](protocol.md#voiceaudioparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)                 |             |

**voice.start**

| Field    | Required | Type                                             | Description |
| -------- | -------- | ------------------------------------------------ | ----------- |
| `params` | Yes      | [VoiceStartParams](protocol.md#voicestartparams) |             |
| `result` | Yes      | [VoiceStarted](protocol.md#voicestarted)         |             |

**voice.stop**

| Field    | Required | Type                                           | Description |
| -------- | -------- | ---------------------------------------------- | ----------- |
| `params` | Yes      | [VoiceStopParams](protocol.md#voicestopparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)               |             |

**workflows.attention.list**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowAttentionQuery](protocol.md#workflowattentionquery) |             |
| `result` | Yes      | [WorkflowAttentionPage](protocol.md#workflowattentionpage)   |             |

**workflows.catalog**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | [WorkflowCatalog](protocol.md#workflowcatalog)     |             |

**workflows.create**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowCreateRequest](protocol.md#workflowcreaterequest) |             |
| `result` | Yes      | [WorkflowReceipt](protocol.md#workflowreceipt)             |             |

**workflows.delete**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowDeleteRequest](protocol.md#workflowdeleterequest) |             |
| `result` | Yes      | [WorkflowDeleteReceipt](protocol.md#workflowdeletereceipt) |             |

**workflows.list**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowListRequest](protocol.md#workflowlistrequest) |             |
| `result` | Yes      | [WorkflowListPage](protocol.md#workflowlistpage)       |             |

**workflows.models**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowModelsRequest](protocol.md#workflowmodelsrequest) |             |
| `result` | Yes      | [WorkflowModelsPage](protocol.md#workflowmodelspage)       |             |

**workflows.models.image.quote**

| Field    | Required | Type                                                               | Description |
| -------- | -------- | ------------------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowImageQuoteRequest](protocol.md#workflowimagequoterequest) |             |
| `result` | Yes      | [WorkflowImageQuote](protocol.md#workflowimagequote)               |             |

**workflows.models.image.resolve**

| Field    | Required | Type                                                                         | Description |
| -------- | -------- | ---------------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowImageResolutionRequest](protocol.md#workflowimageresolutionrequest) |             |
| `result` | Yes      | [WorkflowImageResolution](protocol.md#workflowimageresolution)               |             |

**workflows.models.refresh**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowModelsRequest](protocol.md#workflowmodelsrequest) |             |
| `result` | Yes      | [WorkflowModelsPage](protocol.md#workflowmodelspage)       |             |

**workflows.models.resolve**

| Field    | Required | Type                                                                         | Description |
| -------- | -------- | ---------------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowModelResolutionRequest](protocol.md#workflowmodelresolutionrequest) |             |
| `result` | Yes      | [WorkflowModelResolution](protocol.md#workflowmodelresolution)               |             |

**workflows.planning.cancel**

| Field    | Required | Type                                           | Description |
| -------- | -------- | ---------------------------------------------- | ----------- |
| `params` | Yes      | [PlanningTurnRef](protocol.md#planningturnref) |             |
| `result` | Yes      | [PlanningTurn](protocol.md#planningturn)       |             |

**workflows.planning.history**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [PlanningHistoryRequest](protocol.md#planninghistoryrequest) |             |
| `result` | Yes      | [PlanningHistory](protocol.md#planninghistory)               |             |

**workflows.planning.read**

| Field    | Required | Type                                           | Description |
| -------- | -------- | ---------------------------------------------- | ----------- |
| `params` | Yes      | [PlanningTurnRef](protocol.md#planningturnref) |             |
| `result` | Yes      | [PlanningTurn](protocol.md#planningturn)       |             |

**workflows.planning.send**

| Field    | Required | Type                                           | Description |
| -------- | -------- | ---------------------------------------------- | ----------- |
| `params` | Yes      | [PlanningRequest](protocol.md#planningrequest) |             |
| `result` | Yes      | [PlanningTurn](protocol.md#planningturn)       |             |

**workflows.planning.sources**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [PlanningSourcesRequest](protocol.md#planningsourcesrequest) |             |
| `result` | Yes      | [PlanningSourcesPage](protocol.md#planningsourcespage)       |             |

**workflows.publications.check**

| Field    | Required | Type                                                                           | Description |
| -------- | -------- | ------------------------------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowPublicationCheckRequest](protocol.md#workflowpublicationcheckrequest) |             |
| `result` | Yes      | [WorkflowPublicationCheck](protocol.md#workflowpublicationcheck)               |             |

**workflows.publications.list**

| Field    | Required | Type                                                                         | Description |
| -------- | -------- | ---------------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowPublicationListRequest](protocol.md#workflowpublicationlistrequest) |             |
| `result` | Yes      | [WorkflowPublicationPage](protocol.md#workflowpublicationpage)               |             |

**workflows.publications.publish**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowPublishRequest](protocol.md#workflowpublishrequest) |             |
| `result` | Yes      | [WorkflowPublishResult](protocol.md#workflowpublishresult)   |             |

**workflows.publications.read**

| Field    | Required | Type                                                                         | Description |
| -------- | -------- | ---------------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowPublicationReadRequest](protocol.md#workflowpublicationreadrequest) |             |
| `result` | Yes      | [WorkflowPublication](protocol.md#workflowpublication) / `null`              |             |

**workflows.publications.run**

| Field    | Required | Type                                                                   | Description |
| -------- | -------- | ---------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowPublishedRunRequest](protocol.md#workflowpublishedrunrequest) |             |
| `result` | Yes      | [WorkflowRunSummary](protocol.md#workflowrunsummary)                   |             |

**workflows.read**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowReadRequest](protocol.md#workflowreadrequest)   |             |
| `result` | Yes      | [WorkflowManifestPage](protocol.md#workflowmanifestpage) |             |

**workflows.record**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRecordRequest](protocol.md#workflowrecordrequest) |             |
| `result` | Yes      | [WorkflowRecordPage](protocol.md#workflowrecordpage)       |             |

**workflows.records**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowRecordsRequest](protocol.md#workflowrecordsrequest) |             |
| `result` | Yes      | [WorkflowRecordsPage](protocol.md#workflowrecordspage)       |             |

**workflows.runs.agent.control**

| Field    | Required | Type                                                                   | Description |
| -------- | -------- | ---------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowAgentControlRequest](protocol.md#workflowagentcontrolrequest) |             |
| `result` | Yes      | [WorkflowAgentSession](protocol.md#workflowagentsession)               |             |

**workflows.runs.agent.input**

| Field    | Required | Type                                                               | Description |
| -------- | -------- | ------------------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowAgentInputRequest](protocol.md#workflowagentinputrequest) |             |
| `result` | Yes      | [WorkflowAgentSession](protocol.md#workflowagentsession)           |             |

**workflows.runs.agent.read**

| Field    | Required | Type                                                                   | Description |
| -------- | -------- | ---------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowAgentSessionRequest](protocol.md#workflowagentsessionrequest) |             |
| `result` | Yes      | [WorkflowAgentSession](protocol.md#workflowagentsession)               |             |

**workflows.runs.applications.check**

| Field    | Required | Type                                                                        | Description |
| -------- | -------- | --------------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowApplicationRequest](protocol.md#workflowapplicationrequest)        |             |
| `result` | Yes      | Array of [WorkflowApplicationStatus](protocol.md#workflowapplicationstatus) |             |

**workflows.runs.applications.setup**

| Field    | Required | Type                                                                           | Description |
| -------- | -------- | ------------------------------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowApplicationSetupRequest](protocol.md#workflowapplicationsetuprequest) |             |
| `result` | Yes      | [WorkflowTerminalSnapshot](protocol.md#workflowterminalsnapshot)               |             |

**workflows.runs.approval.decide**

| Field    | Required | Type                                                             | Description |
| -------- | -------- | ---------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowApprovalDecision](protocol.md#workflowapprovaldecision) |             |
| `result` | Yes      | [WorkflowHumanRequest](protocol.md#workflowhumanrequest)         |             |

**workflows.runs.artifact**

| Field    | Required | Type                                                                 | Description |
| -------- | -------- | -------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunArtifactRequest](protocol.md#workflowrunartifactrequest) |             |
| `result` | Yes      | [WorkflowRunArtifactPage](protocol.md#workflowrunartifactpage)       |             |

**workflows.runs.artifacts**

| Field    | Required | Type                                                                   | Description |
| -------- | -------- | ---------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowArtifactListRequest](protocol.md#workflowartifactlistrequest) |             |
| `result` | Yes      | [WorkflowArtifactListPage](protocol.md#workflowartifactlistpage)       |             |

**workflows.runs.attempts**

| Field    | Required | Type                                                                 | Description |
| -------- | -------- | -------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunAttemptsRequest](protocol.md#workflowrunattemptsrequest) |             |
| `result` | Yes      | [WorkflowRunAttemptsPage](protocol.md#workflowrunattemptspage)       |             |

**workflows.runs.cancel**

| Field    | Required | Type                                                 | Description |
| -------- | -------- | ---------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunRequest](protocol.md#workflowrunrequest) |             |
| `result` | Yes      | [WorkflowRunSummary](protocol.md#workflowrunsummary) |             |

**workflows.runs.events**

| Field    | Required | Type                                                             | Description |
| -------- | -------- | ---------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunEventsRequest](protocol.md#workflowruneventsrequest) |             |
| `result` | Yes      | Array of [WorkflowRunEvent](protocol.md#workflowrunevent)        |             |

**workflows.runs.inputs**

| Field    | Required | Type                                                                | Description |
| -------- | -------- | ------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunOutputRequest](protocol.md#workflowrunoutputrequest)    |             |
| `result` | Yes      | [WorkflowRunOutputPage](protocol.md#workflowrunoutputpage) / `null` |             |

**workflows.runs.list**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowRunListRequest](protocol.md#workflowrunlistrequest) |             |
| `result` | Yes      | [WorkflowRunListPage](protocol.md#workflowrunlistpage)       |             |

**workflows.runs.loopPricing**

| Field    | Required | Type                                                                   | Description |
| -------- | -------- | ---------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowLoopSpendingRequest](protocol.md#workflowloopspendingrequest) |             |
| `result` | Yes      | [WorkflowLoopSpendingView](protocol.md#workflowloopspendingview)       |             |

**workflows.runs.loopSpending**

| Field    | Required | Type                                                                   | Description |
| -------- | -------- | ---------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowLoopSpendingRequest](protocol.md#workflowloopspendingrequest) |             |
| `result` | Yes      | [WorkflowLoopSpendingView](protocol.md#workflowloopspendingview)       |             |

**workflows.runs.output**

| Field    | Required | Type                                                             | Description |
| -------- | -------- | ---------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunOutputRequest](protocol.md#workflowrunoutputrequest) |             |
| `result` | Yes      | [WorkflowRunOutputPage](protocol.md#workflowrunoutputpage)       |             |

**workflows.runs.question.answer**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowHumanAnswer](protocol.md#workflowhumananswer)   |             |
| `result` | Yes      | [WorkflowHumanRequest](protocol.md#workflowhumanrequest) |             |

**workflows.runs.question.read**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowHumanIdentity](protocol.md#workflowhumanidentity) |             |
| `result` | Yes      | [WorkflowHumanRequest](protocol.md#workflowhumanrequest)   |             |

**workflows.runs.questions**

| Field    | Required | Type                                                 | Description |
| -------- | -------- | ---------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunRequest](protocol.md#workflowrunrequest) |             |
| `result` | Yes      | [WorkflowHumanPage](protocol.md#workflowhumanpage)   |             |

**workflows.runs.read**

| Field    | Required | Type                                                 | Description |
| -------- | -------- | ---------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunRequest](protocol.md#workflowrunrequest) |             |
| `result` | Yes      | [WorkflowRunSummary](protocol.md#workflowrunsummary) |             |

**workflows.runs.start**

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunStartRequest](protocol.md#workflowrunstartrequest) |             |
| `result` | Yes      | [WorkflowRunSummary](protocol.md#workflowrunsummary)           |             |

**workflows.runs.steps**

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunStepsRequest](protocol.md#workflowrunstepsrequest) |             |
| `result` | Yes      | [WorkflowRunStepsPage](protocol.md#workflowrunstepspage)       |             |

**workflows.runs.terminal.command**

| Field    | Required | Type                                                             | Description |
| -------- | -------- | ---------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowTerminalCommand](protocol.md#workflowterminalcommand)   |             |
| `result` | Yes      | [WorkflowTerminalSnapshot](protocol.md#workflowterminalsnapshot) |             |

**workflows.runs.terminal.read**

| Field    | Required | Type                                                             | Description |
| -------- | -------- | ---------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowTerminalRequest](protocol.md#workflowterminalrequest)   |             |
| `result` | Yes      | [WorkflowTerminalSnapshot](protocol.md#workflowterminalsnapshot) |             |

**workflows.runs.usage**

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunUsageRequest](protocol.md#workflowrunusagerequest) |             |
| `result` | Yes      | [WorkflowRunUsageView](protocol.md#workflowrunusageview)       |             |

**workflows.runs.usageBreakdown**

| Field    | Required | Type                                                                   | Description |
| -------- | -------- | ---------------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowRunBreakdownRequest](protocol.md#workflowrunbreakdownrequest) |             |
| `result` | Yes      | [WorkflowRunBreakdownView](protocol.md#workflowrunbreakdownview)       |             |

**workflows.save**

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowSaveRequest](protocol.md#workflowsaverequest) |             |
| `result` | Yes      | [WorkflowReceipt](protocol.md#workflowreceipt)         |             |

**workflows.schedules.disable**

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowScheduleCommand](protocol.md#workflowschedulecommand) |             |
| `result` | Yes      | [WorkflowScheduleView](protocol.md#workflowscheduleview)       |             |

**workflows.schedules.enable**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkflowScheduleEnable](protocol.md#workflowscheduleenable) |             |
| `result` | Yes      | [WorkflowScheduleView](protocol.md#workflowscheduleview)     |             |

**workflows.schedules.preview**

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowSchedulePreview](protocol.md#workflowschedulepreview) |             |
| `result` | Yes      | Array of `string`                                              |             |

**workflows.schedules.read**

| Field    | Required | Type                                                              | Description |
| -------- | -------- | ----------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowScheduleRead](protocol.md#workflowscheduleread)          |             |
| `result` | Yes      | [WorkflowScheduleView](protocol.md#workflowscheduleview) / `null` |             |

**workflows.validate**

| Field    | Required | Type                                                           | Description |
| -------- | -------- | -------------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkflowValidateRequest](protocol.md#workflowvalidaterequest) |             |
| `result` | Yes      | [GraphValidation](protocol.md#graphvalidation)                 |             |

**workspaces.create**

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `params` | Yes      | [WorkspaceCreateParams](protocol.md#workspacecreateparams) |             |
| `result` | Yes      | [Workspace](protocol.md#workspace)                         |             |

**workspaces.describe**

| Field    | Required | Type                                                     | Description |
| -------- | -------- | -------------------------------------------------------- | ----------- |
| `params` | Yes      | [IdParams](protocol.md#idparams)                         |             |
| `result` | Yes      | [WorkspaceDescription](protocol.md#workspacedescription) |             |

**workspaces.destroy**

| Field    | Required | Type                                                         | Description |
| -------- | -------- | ------------------------------------------------------------ | ----------- |
| `params` | Yes      | [WorkspaceDestroyParams](protocol.md#workspacedestroyparams) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)                             |             |

**workspaces.list**

| Field    | Required | Type                                               | Description |
| -------- | -------- | -------------------------------------------------- | ----------- |
| `params` | Yes      | [Recordstringnever](protocol.md#recordstringnever) |             |
| `result` | Yes      | Array of [Workspace](protocol.md#workspace)        |             |

## GeometryFormat

Supported serialized 3D asset formats; radiance fields remain unspecified.

Type: `"gaussian_ply"` / `"glb"`.

## GraphIssue

Stable identities let all surfaces focus the same problem without parsing its message.

| Field      | Required | Type                                         | Description |
| ---------- | -------- | -------------------------------------------- | ----------- |
| `code`     | Yes      | [GraphIssueCode](protocol.md#graphissuecode) |             |
| `edgeId`   | Yes      | `null,string`                                |             |
| `message`  | Yes      | `string`                                     |             |
| `nodeId`   | Yes      | `null,string`                                |             |
| `path`     | Yes      | `null,string`                                |             |
| `severity` | Yes      | [GraphSeverity](protocol.md#graphseverity)   |             |

## GraphIssueCode

Type: `"ambiguous"` / `"cardinality"` / `"component"` / `"configuration"` / `"connection"` / `"cycle"` / `"duplicate"` / `"endpoint"` / `"required"` / `"resource"` / `"runtime"` / `"setup"` / `"trigger"` / `"unreachable"`.

## GraphSeverity

Type: `"error"` / `"warning"`.

## GraphValidation

A structural result is never an execution grant or a connection authorization snapshot.

| Field                  | Required | Type                                          | Description |
| ---------------------- | -------- | --------------------------------------------- | ----------- |
| `issues`               | Yes      | Array of [GraphIssue](protocol.md#graphissue) |             |
| `order`                | Yes      | Array of `string`                             |             |
| `requiredCapabilities` | Yes      | Array of `string`                             |             |
| `resourceRequirements` | Yes      | `number`                                      |             |
| `revision`             | Yes      | `string`                                      |             |
| `totalIssues`          | Yes      | `number`                                      |             |
| `truncated`            | Yes      | `boolean`                                     |             |
| `unavailableHandlers`  | Yes      | Array of `string`                             |             |
| `valid`                | Yes      | `boolean`                                     |             |
| `workflowId`           | Yes      | `string`                                      |             |

## HealthResult

Liveness and identity.

| Field         | Required | Type     | Description |
| ------------- | -------- | -------- | ----------- |
| `connections` | Yes      | `number` |             |
| `ok`          | Yes      | `true`   |             |
| `protocol`    | Yes      | `number` |             |
| `uptimeMs`    | Yes      | `number` |             |
| `version`     | Yes      | `string` |             |

## HelloOk

| Field         | Required | Type                                           | Description                                                                       |
| ------------- | -------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `auth`        | Yes      | Object (fields below)                          |                                                                                   |
| `features`    | Yes      | [GatewayFeatures](protocol.md#gatewayfeatures) |                                                                                   |
| `minProtocol` | Yes      | `number`                                       |                                                                                   |
| `policy`      | Yes      | Object (fields below)                          |                                                                                   |
| `protocol`    | Yes      | `number`                                       |                                                                                   |
| `server`      | Yes      | Object (fields below)                          |                                                                                   |
| `snapshot`    | Yes      | Object (fields below)                          | State the first screen needs, so a client renders something before its first RPC. |
| `type`        | Yes      | `"hello-ok"`                                   |                                                                                   |

**auth**

| Field         | Required | Type                                | Description                                                                                  |
| ------------- | -------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `method`      | Yes      | `"device"` / `"none"` / `"token"`   |                                                                                              |
| `principalId` | Yes      | `string`                            |                                                                                              |
| `scopes`      | Yes      | Array of [Scope](protocol.md#scope) |                                                                                              |
| `token`       | No       | `string`                            | Newly issued device credential, delivered to browser clients unable to read upgrade headers. |

**policy**

| Field                  | Required | Type                                       | Description                                                           |
| ---------------------- | -------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `heartbeatMs`          | Yes      | `number`                                   | How often the server pings. 0 means the heartbeat is off.             |
| `limits`               | No       | [GatewayLimits](protocol.md#gatewaylimits) | Resource budgets advertised by gateways supporting bounded admission. |
| `maxBufferedBytes`     | Yes      | `number`                                   |                                                                       |
| `maxPayloadBytes`      | Yes      | `number`                                   |                                                                       |
| `preHandshakeMaxBytes` | Yes      | `number`                                   |                                                                       |

**server**

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `connId`  | Yes      | `string` |             |
| `version` | Yes      | `string` |             |

**snapshot**

| Field      | Required | Type                                                    | Description |
| ---------- | -------- | ------------------------------------------------------- | ----------- |
| `agents`   | Yes      | Array of [AgentDefinition](protocol.md#agentdefinition) |             |
| `uptimeMs` | Yes      | `number`                                                |             |

## HistoryApprovalRequested

Approval controls retain their original request identity.

| Field      | Required | Type                                                       | Description                                                       |
| ---------- | -------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| `at`       | Yes      | `number`                                                   |                                                                   |
| `data`     | Yes      | [ApprovalRequestedData](protocol.md#approvalrequesteddata) |                                                                   |
| `id`       | Yes      | `string`                                                   |                                                                   |
| `kind`     | Yes      | `"approval-requested"`                                     |                                                                   |
| `runId`    | Yes      | `null,string`                                              |                                                                   |
| `streamId` | No       | `string`                                                   | Owning stream, retained when multiple turns share a conversation. |

## HistoryApprovalResolved

Settled approvals must not become actionable again when restored.

| Field  | Required | Type                                                     | Description |
| ------ | -------- | -------------------------------------------------------- | ----------- |
| `at`   | Yes      | `number`                                                 |             |
| `data` | Yes      | [ApprovalResolvedData](protocol.md#approvalresolveddata) |             |
| `id`   | Yes      | `string`                                                 |             |
| `kind` | Yes      | `"approval-resolved"`                                    |             |

## HistoryEnd

Terminal outcome, session identity, and final usage.

| Field  | Required | Type                                   | Description |
| ------ | -------- | -------------------------------------- | ----------- |
| `at`   | Yes      | `number`                               |             |
| `data` | Yes      | [TurnEndData](protocol.md#turnenddata) |             |
| `id`   | Yes      | `string`                               |             |
| `kind` | Yes      | `"end"`                                |             |

## HistoryEvent

Complete wire event, including native worker and media events.

| Field  | Required | Type                                       | Description |
| ------ | -------- | ------------------------------------------ | ----------- |
| `at`   | Yes      | `number`                                   |             |
| `data` | Yes      | [TurnEventData](protocol.md#turneventdata) |             |
| `id`   | Yes      | `string`                                   |             |
| `kind` | Yes      | `"event"`                                  |             |

## HistoryInput

Original user input, including attachments and steering messages.

| Field  | Required | Type                                                 | Description |
| ------ | -------- | ---------------------------------------------------- | ----------- |
| `at`   | Yes      | `number`                                             |             |
| `data` | Yes      | [SessionMessageData](protocol.md#sessionmessagedata) |             |
| `id`   | Yes      | `string`                                             |             |
| `kind` | Yes      | `"input"`                                            |             |

## HistorySites

Site decorations arrive separately from the tool result.

| Field  | Required | Type                                       | Description |
| ------ | -------- | ------------------------------------------ | ----------- |
| `at`   | Yes      | `number`                                   |             |
| `data` | Yes      | [ToolSitesData](protocol.md#toolsitesdata) |             |
| `id`   | Yes      | `string`                                   |             |
| `kind` | Yes      | `"sites"`                                  |             |

## IdParams

Names one record.

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

## InboundAttachment

A user attachment cannot inject tool results or provider reasoning into history.

Variant 1: Object (fields below)

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `text` | Yes      | `string` |             |
| `type` | Yes      | `"text"` |             |

Variant 2: Object (fields below)

| Field    | Required | Type                                     | Description |
| -------- | -------- | ---------------------------------------- | ----------- |
| `source` | Yes      | [BinarySource](protocol.md#binarysource) |             |
| `title`  | No       | `string`                                 |             |
| `type`   | Yes      | `"image"`                                |             |

Variant 3: Object (fields below)

| Field    | Required | Type                                     | Description                                                                     |
| -------- | -------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| `source` | Yes      | [BinarySource](protocol.md#binarysource) |                                                                                 |
| `title`  | No       | `string`                                 |                                                                                 |
| `type`   | Yes      | `"video"`                                | An encoded video or animation container decoded natively by a multimodal model. |

Variant 4: Object (fields below)

| Field    | Required | Type                                     | Description                                                                  |
| -------- | -------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `source` | Yes      | [BinarySource](protocol.md#binarysource) |                                                                              |
| `title`  | No       | `string`                                 |                                                                              |
| `type`   | Yes      | `"video-frame"`                          | One ordered frame of a video or animation. Consecutive frames form one clip. |

Variant 5: Object (fields below)

| Field    | Required | Type                                     | Description |
| -------- | -------- | ---------------------------------------- | ----------- |
| `source` | Yes      | [BinarySource](protocol.md#binarysource) |             |
| `title`  | No       | `string`                                 |             |
| `type`   | Yes      | `"document"`                             |             |

## IncomingPolicy

Multiple inputs require an explicit collector or join. Last-writer-wins is not an option.

Type: `"collect"` / `"join"` / `"reject"`.

## Job

A scheduled job as it is stored.

| Field             | Required | Type                                       | Description                                                                     |
| ----------------- | -------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| `action`          | Yes      | [JobAction](protocol.md#jobaction)         |                                                                                 |
| `allowConcurrent` | No       | `boolean`                                  | Whether a new run may start while a previous one is still going.                |
| `createdAt`       | Yes      | `number`                                   |                                                                                 |
| `enabled`         | Yes      | `boolean`                                  | Disabled jobs stay stored and stop firing.                                      |
| `graceMs`         | No       | `number`                                   | For {@link MisfirePolicy.RunIfRecent}: how stale a missed occurrence may be.    |
| `id`              | Yes      | `string`                                   |                                                                                 |
| `maxRetries`      | No       | `number`                                   | How many times a failed run is retried before the occurrence is abandoned.      |
| `misfirePolicy`   | Yes      | [MisfirePolicy](protocol.md#misfirepolicy) |                                                                                 |
| `name`            | Yes      | `string`                                   |                                                                                 |
| `owner`           | No       | [JobOwner](protocol.md#jobowner)           | Who owns this job, for permissions and for credit attribution.                  |
| `tags`            | No       | Array of `string`                          | Free-form labels for querying.                                                  |
| `timeoutMs`       | No       | `number`                                   | A hard ceiling on one run, after which it is aborted and recorded as timed out. |
| `trigger`         | Yes      | [JobTrigger](protocol.md#jobtrigger)       |                                                                                 |
| `updatedAt`       | Yes      | `number`                                   |                                                                                 |

## JobAction

What a job does when it fires.

Variant 1: [TelemetryMonitorAction](protocol.md#telemetrymonitoraction)

| Field         | Required | Type                                                                             | Description                                                                     |
| ------------- | -------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `destination` | No       | [TelemetryNotificationDestination](protocol.md#telemetrynotificationdestination) | Host-captured private channel destination; never accepted from model arguments. |
| `investigate` | No       | `boolean`                                                                        |                                                                                 |
| `kind`        | Yes      | `"roblox-monitor"`                                                               |                                                                                 |
| `rule`        | Yes      | [TelemetryMonitorRule](protocol.md#telemetrymonitorrule)                         |                                                                                 |

Variant 2: Object (fields below)

| Field  | Required | Type                 | Description |
| ------ | -------- | -------------------- | ----------- |
| `kind` | Yes      | `"company-dispatch"` |             |

Variant 3: [ReminderAction](protocol.md#reminderaction)

| Field            | Required | Type         | Description |
| ---------------- | -------- | ------------ | ----------- |
| `channelId`      | Yes      | `string`     |             |
| `conversationId` | Yes      | `string`     |             |
| `kind`           | Yes      | `"reminder"` |             |
| `text`           | Yes      | `string`     |             |
| `threadId`       | No       | `string`     |             |

Variant 4: Object (fields below)

| Field             | Required | Type           | Description                                                               |
| ----------------- | -------- | -------------- | ------------------------------------------------------------------------- |
| `agentId`         | Yes      | `string`       |                                                                           |
| `deliverTo`       | No       | `string`       | Where the reply goes: a channel id, or absent to leave it in the session. |
| `kind`            | Yes      | `"agent-turn"` | Run an agent turn with this prompt. The ordinary case.                    |
| `prompt`          | Yes      | `string`       |                                                                           |
| `silentWhenEmpty` | No       | `boolean`      | Suppress delivery when the turn produced nothing worth sending.           |

Variant 5: Object (fields below)

| Field                | Required | Type                                  | Description                                                    |
| -------------------- | -------- | ------------------------------------- | -------------------------------------------------------------- |
| `allowSelfLifecycle` | No       | `boolean`                             | Allow a command that stops or restarts Nexa itself.            |
| `command`            | Yes      | `string`                              |                                                                |
| `cwd`                | No       | `string`                              |                                                                |
| `elevation`          | No       | `"ask"` / `"full"` / `"off"` / `"on"` | Run this command outside the sandbox, if the policy allows it. |
| `kind`               | Yes      | `"shell"`                             | Run a shell command. Its stdout becomes the run's output.      |
| `timeoutMs`          | No       | `number`                              |                                                                |

Variant 6: Object (fields below)

| Field   | Required | Type                               | Description                                                 |
| ------- | -------- | ---------------------------------- | ----------------------------------------------------------- |
| `input` | Yes      | [JsonValue](protocol.md#jsonvalue) |                                                             |
| `kind`  | Yes      | `"tool"`                           | Call a registered tool directly, with no model in the loop. |
| `tool`  | Yes      | `string`                           |                                                             |

Variant 7: Object (fields below)

| Field     | Required | Type                               | Description                                  |
| --------- | -------- | ---------------------------------- | -------------------------------------------- |
| `event`   | Yes      | `string`                           |                                              |
| `kind`    | Yes      | `"event"`                          | Emit an event other subsystems subscribe to. |
| `payload` | No       | [JsonValue](protocol.md#jsonvalue) |                                              |

Variant 8: Object (fields below)

| Field  | Required | Type            | Description                                                               |
| ------ | -------- | --------------- | ------------------------------------------------------------------------- |
| `kind` | Yes      | `"maintenance"` | Housekeeping: expired media, expired workspaces, memories past their TTL. |

## JobAddParams

A scheduled job, in the two shapes an operator actually creates.

| Field             | Required | Type      | Description                                                                    |
| ----------------- | -------- | --------- | ------------------------------------------------------------------------------ |
| `agentId`         | No       | `string`  |                                                                                |
| `at`              | No       | `number`  |                                                                                |
| `command`         | No       | `string`  | A shell command to run.                                                        |
| `cron`            | No       | `string`  | A cron expression. Exactly one of `cron`, `intervalMs` and `at` must be given. |
| `deliverTo`       | No       | `string`  | Where the answer goes, as `channel:conversation` — `telegram:12345`.           |
| `enabled`         | No       | `boolean` |                                                                                |
| `intervalMs`      | No       | `number`  |                                                                                |
| `name`            | Yes      | `string`  |                                                                                |
| `prompt`          | No       | `string`  | An agent turn to run. Exactly one of `prompt` and `command` must be given.     |
| `silentWhenEmpty` | No       | `boolean` | Say nothing when the turn produced nothing. A quiet night should be quiet.     |
| `timezone`        | No       | `string`  |                                                                                |

## JobOwner

Who a job belongs to — the four scopes credit is tracked against.

| Field            | Required | Type     | Description |
| ---------------- | -------- | -------- | ----------- |
| `agentId`        | No       | `string` |             |
| `conversationId` | No       | `string` |             |
| `projectId`      | No       | `string` |             |
| `userId`         | No       | `string` |             |

## JobTrigger

When a job fires.

Variant 1: Object (fields below)

| Field        | Required | Type     | Description                                                       |
| ------------ | -------- | -------- | ----------------------------------------------------------------- |
| `expression` | Yes      | `string` | A five- or six-field cron expression, or an `@daily`-style alias. |
| `kind`       | Yes      | `"cron"` |                                                                   |
| `timezone`   | No       | `string` | An IANA timezone; occurrences are local wall-clock times in it.   |

Variant 2: Object (fields below)

| Field        | Required | Type         | Description                                            |
| ------------ | -------- | ------------ | ------------------------------------------------------ |
| `intervalMs` | Yes      | `number`     |                                                        |
| `kind`       | Yes      | `"interval"` | Every `intervalMs`, measured from the last completion. |

Variant 3: Object (fields below)

| Field  | Required | Type     | Description            |
| ------ | -------- | -------- | ---------------------- |
| `at`   | Yes      | `number` |                        |
| `kind` | Yes      | `"once"` | Exactly once, at `at`. |

## JsonValue

Variant 1: `null`

Type: `null`.

Variant 2: `boolean`

Type: `boolean`.

Variant 3: `string`

Type: `string`.

Variant 4: `number`

Type: `number`.

Variant 5: Array of [JsonValue](protocol.md#jsonvalue)

Type: Array of [JsonValue](protocol.md#jsonvalue).

Variant 6: Dictionary

Type: Dictionary.

## ListSchema

A list is a finalized collection; it is not a stream.

| Field      | Required | Type                                   | Description |
| ---------- | -------- | -------------------------------------- | ----------- |
| `item`     | Yes      | [ValueSchema](protocol.md#valueschema) |             |
| `kind`     | Yes      | `"list"`                               |             |
| `maxItems` | Yes      | `number`                               |             |
| `minItems` | Yes      | `number`                               |             |
| `nullable` | Yes      | `boolean`                              |             |

## LogLevel

Log severity, least → most severe.

Type: `"debug"` / `"error"` / `"info"` / `"warn"`.

## LogRecord

One log line.

| Field     | Required | Type                                                                           | Description |
| --------- | -------- | ------------------------------------------------------------------------------ | ----------- |
| `at`      | Yes      | `number`                                                                       |             |
| `fields`  | Yes      | [Recordstringstringnumberboolean](protocol.md#recordstringstringnumberboolean) |             |
| `level`   | Yes      | [LogLevel](protocol.md#loglevel)                                               |             |
| `message` | Yes      | `string`                                                                       |             |
| `scope`   | Yes      | `string`                                                                       |             |

## LogTailParams

A window over the recent log.

| Field   | Required | Type                                        | Description                                                                     |
| ------- | -------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| `level` | No       | `"debug"` / `"error"` / `"info"` / `"warn"` | Only lines at or above this level.                                              |
| `limit` | No       | `number`                                    | How many lines back to read. Absent reads everything the buffer still holds.    |
| `scope` | No       | `string`                                    | Only lines from this subsystem, e.g. `gateway`.                                 |
| `since` | No       | `number`                                    | Only lines newer than this timestamp, so a poller does not re-read what it has. |

## MediaAcknowledgeParams

Client attachment handler outcome; receipt does not assert that a human viewed it.

| Field      | Required | Type      | Description |
| ---------- | -------- | --------- | ----------- |
| `id`       | Yes      | `string`  |             |
| `received` | Yes      | `boolean` |             |

## MessageRole

Who authored a message.

Type: `"assistant"` / `"system"` / `"tool"` / `"user"`.

## MisfirePolicy

What to do about occurrences that elapsed while the process was down.

Type: `"run-all"` / `"run-if-recent"` / `"run-once"` / `"skip"`.

## MockBehavior

Type: `"deterministic"` / `"fixture"` / `"none"`.

## ModelMessage

| Field      | Required | Type                                                         | Description                                                                        |
| ---------- | -------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `content`  | Yes      | Array of [ContentBlock](protocol.md#contentblock) / `string` |                                                                                    |
| `identity` | No       | [ModelMessageIdentity](protocol.md#modelmessageidentity)     | Durable host metadata; provider adapters send only the role and content to models. |
| `role`     | Yes      | [MessageRole](protocol.md#messagerole)                       |                                                                                    |

## ModelMessageIdentity

Durable host metadata; provider adapters send only the role and content to models.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `id`        | Yes      | `string` |             |
| `inputId`   | No       | `string` |             |
| `streamId`  | Yes      | `string` |             |
| `timestamp` | Yes      | `number` |             |

## NcapAgentDelta

One agent's own record from a live fan-out, for the roster.

| Field      | Required | Type     | Description                                                                                  |
| ---------- | -------- | -------- | -------------------------------------------------------------------------------------------- |
| `activity` | Yes      | `string` |                                                                                              |
| `expert`   | Yes      | `string` | The expert it is running as, which the planner assigned per item.                            |
| `findings` | Yes      | `number` |                                                                                              |
| `item`     | Yes      | `number` | The item this agent is working.                                                              |
| `role`     | Yes      | `string` | Its role on the team, when the engine names one. Empty otherwise.                            |
| `state`    | Yes      | `string` | `working` \| `done` \| `failed` \| `retired`. Retired means it stood down and a fresh agent  |
| `tokens`   | Yes      | `number` | Completion tokens this agent has spent, as the engine measured them.                         |
| `turn`     | Yes      | `number` | Which turn this agent is on. There is NO `turnsAllowed` beside it: nothing bounds an agent's |

## NcapAgentToolDelta

A sub-agent asking for a tool to be run on its behalf, answered on the data-response channel.

| Field        | Required | Type     | Description                                                        |
| ------------ | -------- | -------- | ------------------------------------------------------------------ |
| `arguments`  | Yes      | `string` | Raw JSON arguments, exactly as the agent wrote them.               |
| `item`       | Yes      | `number` | The backlog item whose agent is asking, for attribution in the UI. |
| `requestRef` | Yes      | `number` |                                                                    |
| `tool`       | Yes      | `string` |                                                                    |

## NcapArtifactDelta

One item's DELIVERABLE, as it closes — the counterpart to a finding for work that MAKES rather

| Field      | Required | Type     | Description                                                                         |
| ---------- | -------- | -------- | ----------------------------------------------------------------------------------- |
| `artifact` | Yes      | `string` |                                                                                     |
| `item`     | Yes      | `number` |                                                                                     |
| `title`    | Yes      | `string` | The item's own title. An artifact carries no location and no severity to anchor it. |

## NcapAsrTranscript

Native ASR result over exact mono 16 kHz input.

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `audioSamples` | Yes      | `number` |             |
| `language`     | Yes      | `string` |             |
| `text`         | Yes      | `string` |             |

## NcapBlockDelta

A rich block the server decoded from the model stream, streamed in three phases.

| Field       | Required | Type                            | Description                                                                                |
| ----------- | -------- | ------------------------------- | ------------------------------------------------------------------------------------------ |
| `blockId`   | Yes      | `number`                        | Server-assigned numeric id, stable across the block's begin/delta/end.                     |
| `blockKind` | No       | `string`                        | The block kind on `begin`: `code`, `bash`, `file_write`, `read`, `search`, `list`, `diff`, |
| `language`  | No       | `string`                        | The language on a `begin` for a code block.                                                |
| `path`      | No       | `string`                        | The target path on a `begin` for a `file_write` / `read` / `list` block.                   |
| `phase`     | Yes      | `"begin"` / `"delta"` / `"end"` | `begin` opens the block, `delta` appends to it, `end` closes it.                           |
| `query`     | No       | `string`                        | The query on a `begin` for a `search` block.                                               |
| `text`      | No       | `string`                        | The appended text on a `delta`.                                                            |

## NcapDelta

A single streamed delta from the engine.

| Field            | Required | Type                                                                                          | Description                                                                                 |
| ---------------- | -------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `agent`          | No       | [NcapAgentDelta](protocol.md#ncapagentdelta)                                                  | One agent's own record from the live fan-out, for the roster.                               |
| `agentId`        | No       | `number`                                                                                      | The response's numeric `agent_id`. `0` for a plain turn; in a batch it is the sub-request's |
| `agentTool`      | No       | [NcapAgentToolDelta](protocol.md#ncapagenttooldelta)                                          | A sub-agent asking for a tool to be run on its behalf.                                      |
| `artifact`       | No       | [NcapArtifactDelta](protocol.md#ncapartifactdelta)                                            | One item's DELIVERABLE, as that item closes.                                                |
| `asr`            | No       | [NcapAsrTranscript](protocol.md#ncapasrtranscript)                                            | Native transcription, separate from assistant content.                                      |
| `backlog`        | No       | Object (fields below) / Object (fields below) / Object (fields below) / Object (fields below) | A live backlog the ENGINE built for this turn: the goal decomposed and fanned out.          |
| `block`          | No       | [NcapBlockDelta](protocol.md#ncapblockdelta)                                                  | A live rich-block phase (begin/delta/end) decoded server-side.                              |
| `content`        | Yes      | `string`                                                                                      | Answer content for this chunk (empty on a non-content chunk).                               |
| `conversationId` | No       | `string`                                                                                      | The server-owned conversation id for this turn, surfaced early (from `AgentBegin`).         |
| `expert`         | No       | Object (fields below)                                                                         | The EXPERT the server's pre-flight reflection chose to handle this turn.                    |
| `finding`        | No       | [NcapFindingDelta](protocol.md#ncapfindingdelta)                                              | One DEDUPED finding from a closed fan-out, with its words.                                  |
| `geometry`       | No       | Object (fields below) / Object (fields below) / Object (fields below) / Object (fields below) | Native 3D generation event; binary asset data stays outside model text.                     |
| `graph`          | No       | [NcapGraphDelta](protocol.md#ncapgraphdelta)                                                  | A live project-graph event for the knowledge-graph view.                                    |
| `image`          | No       | Object (fields below) / Object (fields below)                                                 |                                                                                             |
| `preflight`      | No       | Object (fields below)                                                                         | The full pre-flight reflection for the panel shown before the answer streams.               |
| `reasoning`      | Yes      | `string`                                                                                      | Reasoning / thinking-trace text for this chunk (empty on a non-reasoning chunk).            |
| `reflection`     | No       | Object (fields below)                                                                         | The reflection stage's reasoning. Display-only: it never becomes part of the persisted      |
| `research`       | No       | [NcapResearchDelta](protocol.md#ncapresearchdelta)                                            | One step of working an UNSOLVED problem.                                                    |
| `segmentation`   | No       | [SegmentationFrame](protocol.md#segmentationframe)                                            |                                                                                             |
| `skill`          | No       | [NcapSkillDelta](protocol.md#ncapskilldelta)                                                  | One skill the engine ingested.                                                              |
| `status`         | No       | `string`                                                                                      | An out-of-band engine lifecycle status carried by a chunk with no text.                     |
| `steer`          | No       | [NcapSteerDelta](protocol.md#ncapsteerdelta)                                                  | One SUPERVISION ROUND of a decomposed run.                                                  |
| `tool`           | No       | [NcapToolCall](protocol.md#ncaptoolcall)                                                      | A tool call the client must execute.                                                        |
| `usage`          | No       | [NcapUsage](protocol.md#ncapusage)                                                            | A live, non-terminal token-usage / progress update.                                         |
| `video`          | No       | Object (fields below) / Object (fields below) / Object (fields below) / Object (fields below) | One accepted/progress/content/end event from native video generation.                       |
| `voice`          | No       | Array of `number`                                                                             | 80 ms of the model speaking, 24 kHz mono PCM16.                                             |

**backlog — variant 1**

| Field       | Required | Type      | Description |
| ----------- | -------- | --------- | ----------- |
| `goal`      | Yes      | `string`  |             |
| `itemCount` | Yes      | `number`  |             |
| `phase`     | Yes      | `"begin"` |             |

**backlog — variant 2**

| Field        | Required | Type              | Description                                                           |
| ------------ | -------- | ----------------- | --------------------------------------------------------------------- |
| `acceptance` | Yes      | Array of `string` | The criteria this item is judged against, in the planner's own words. |
| `dependsOn`  | Yes      | Array of `number` |                                                                       |
| `id`         | Yes      | `number`          |                                                                       |
| `kind`       | Yes      | `string`          |                                                                       |
| `parent`     | Yes      | `null,number`     |                                                                       |
| `phase`      | Yes      | `"item"`          |                                                                       |
| `points`     | Yes      | `number`          | The planner's estimate. Drives a client's Definition-of-Ready model.  |
| `status`     | Yes      | `string`          |                                                                       |
| `title`      | Yes      | `string`          |                                                                       |

**backlog — variant 3**

| Field      | Required | Type       | Description                                                                             |
| ---------- | -------- | ---------- | --------------------------------------------------------------------------------------- |
| `activity` | Yes      | `string`   | What the agent said it is doing this turn, in its own words. Empty until it says.       |
| `findings` | Yes      | `number`   |                                                                                         |
| `id`       | Yes      | `number`   |                                                                                         |
| `phase`    | Yes      | `"update"` |                                                                                         |
| `status`   | Yes      | `string`   |                                                                                         |
| `turn`     | Yes      | `number`   | Which turn this item's agent is on. `0` before it has taken one. There is no ceiling to |

**backlog — variant 4**

| Field       | Required | Type     | Description                                                                 |
| ----------- | -------- | -------- | --------------------------------------------------------------------------- |
| `done`      | Yes      | `number` |                                                                             |
| `failed`    | Yes      | `number` |                                                                             |
| `phase`     | Yes      | `"end"`  |                                                                             |
| `skipped`   | Yes      | `number` |                                                                             |
| `stoppedBy` | Yes      | `string` | Why the run stopped, in words, so a PARTIAL run can say that it is partial. |

**expert**

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `id`    | Yes      | `string` |             |
| `index` | Yes      | `number` |             |
| `pass`  | Yes      | `number` |             |
| `why`   | Yes      | `string` |             |

**geometry — variant 1**

| Field   | Required | Type         | Description |
| ------- | -------- | ------------ | ----------- |
| `model` | Yes      | `string`     |             |
| `phase` | Yes      | `"accepted"` |             |
| `seed`  | Yes      | `number`     |             |

**geometry — variant 2**

| Field       | Required | Type         | Description |
| ----------- | -------- | ------------ | ----------- |
| `completed` | Yes      | `number`     |             |
| `phase`     | Yes      | `"progress"` |             |
| `stage`     | Yes      | `number`     |             |
| `total`     | Yes      | `number`     |             |

**geometry — variant 3**

| Field        | Required | Type                                         | Description |
| ------------ | -------- | -------------------------------------------- | ----------- |
| `assetId`    | Yes      | `number`                                     |             |
| `data`       | Yes      | Array of `number`                            |             |
| `format`     | Yes      | [GeometryFormat](protocol.md#geometryformat) |             |
| `offset`     | Yes      | `number`                                     |             |
| `phase`      | Yes      | `"chunk"` / `"preview"`                      |             |
| `revision`   | Yes      | `number`                                     |             |
| `totalBytes` | Yes      | `number`                                     |             |

**geometry — variant 4**

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `assetId`    | Yes      | `number` |             |
| `phase`      | Yes      | `"end"`  |             |
| `totalBytes` | Yes      | `number` |             |

**image — variant 1**

| Field    | Required | Type              | Description |
| -------- | -------- | ----------------- | ----------- |
| `data`   | Yes      | Array of `number` |             |
| `index`  | Yes      | `number`          |             |
| `offset` | Yes      | `number`          |             |
| `phase`  | Yes      | `"chunk"`         |             |

**image — variant 2**

| Field         | Required | Type      | Description |
| ------------- | -------- | --------- | ----------- |
| `height`      | Yes      | `number`  |             |
| `index`       | Yes      | `number`  |             |
| `phase`       | Yes      | `"end"`   |             |
| `totalBytes`  | Yes      | `number`  |             |
| `transparent` | Yes      | `boolean` |             |
| `width`       | Yes      | `number`  |             |

**preflight**

| Field          | Required | Type                           | Description |
| -------------- | -------- | ------------------------------ | ----------- |
| `expertId`     | Yes      | `string`                       |             |
| `items`        | Yes      | Array of Object (fields below) |             |
| `subQuestions` | Yes      | Array of `string`              |             |

**preflight.items**

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `label` | Yes      | `string` |             |
| `value` | Yes      | `string` |             |

**reflection**

| Field    | Required | Type                           | Description |
| -------- | -------- | ------------------------------ | ----------- |
| `stages` | Yes      | Array of Object (fields below) |             |

**reflection.stages**

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `label` | Yes      | `string` |             |
| `text`  | Yes      | `string` |             |

**video — variant 1**

| Field     | Required | Type         | Description |
| --------- | -------- | ------------ | ----------- |
| `fps`     | Yes      | `number`     |             |
| `frames`  | Yes      | `number`     |             |
| `height`  | Yes      | `number`     |             |
| `model`   | Yes      | `string`     |             |
| `phase`   | Yes      | `"accepted"` |             |
| `videoId` | Yes      | `string`     |             |
| `width`   | Yes      | `number`     |             |

**video — variant 2**

| Field       | Required | Type         | Description |
| ----------- | -------- | ------------ | ----------- |
| `completed` | Yes      | `number`     |             |
| `phase`     | Yes      | `"progress"` |             |
| `stage`     | Yes      | `number`     |             |
| `total`     | Yes      | `number`     |             |
| `videoId`   | Yes      | `string`     |             |

**video — variant 3**

| Field     | Required | Type              | Description |
| --------- | -------- | ----------------- | ----------- |
| `data`    | Yes      | Array of `number` |             |
| `offset`  | Yes      | `number`          |             |
| `phase`   | Yes      | `"chunk"`         |             |
| `videoId` | Yes      | `string`          |             |

**video — variant 4**

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `phase`      | Yes      | `"end"`  |             |
| `totalBytes` | Yes      | `number` |             |
| `videoId`    | Yes      | `string` |             |

## NcapFindingDelta

One deduped finding a decomposed run produced, as the engine holds it.

| Field       | Required | Type              | Description                                                                                 |
| ----------- | -------- | ----------------- | ------------------------------------------------------------------------------------------- |
| `claim`     | Yes      | `string`          |                                                                                             |
| `evidence`  | Yes      | `string`          | The worker's own supporting quote. Empty when it gave none.                                 |
| `location`  | Yes      | `string`          | `path:line`, or whatever locator the worker gave. One string: the engine does not guarantee |
| `reporters` | Yes      | Array of `number` | EVERY item that reported it, not just the copy that survived the dedup.                     |
| `seen`      | Yes      | `number`          | How many workers reported this same defect.                                                 |
| `severity`  | Yes      | `string`          | `info` \| `low` \| `medium` \| `high` \| `critical`, worst last.                            |

## NcapGraphDelta

A live project-graph event decoded from a `Graph*` frame. The server streams the codebase graph as

| Field       | Required | Type                                                      | Description                               |
| ----------- | -------- | --------------------------------------------------------- | ----------------------------------------- |
| `edge`      | No       | [NcapGraphEdge](protocol.md#ncapgraphedge)                | `edge`: the appended relation.            |
| `grounding` | No       | [NcapGrounding](protocol.md#ncapgrounding)                | `grounding`: the active-subgraph overlay. |
| `node`      | No       | [NcapGraphNode](protocol.md#ncapgraphnode)                | `node`: the appended entity.              |
| `phase`     | Yes      | `"begin"` / `"edge"` / `"end"` / `"grounding"` / `"node"` |                                           |
| `session`   | No       | `string`                                                  | `begin`: the graph session id.            |

## NcapGraphEdge

One relation decoded from a `GraphEdge` frame.

| Field        | Required | Type                                                | Description                                                                      |
| ------------ | -------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| `confidence` | Yes      | `number`                                            |                                                                                  |
| `kind`       | Yes      | `string`                                            | An edge-kind string; exact kinds carry confidence 1, probabilistic ones below 1. |
| `source`     | Yes      | `string`                                            |                                                                                  |
| `span`       | Yes      | [NcapGraphSpan](protocol.md#ncapgraphspan) / `null` |                                                                                  |
| `target`     | Yes      | `string`                                            |                                                                                  |

## NcapGraphNode

One code entity decoded from a `GraphNode` frame.

| Field          | Required | Type                                                | Description                                                           |
| -------------- | -------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| `generated`    | Yes      | `boolean`                                           |                                                                       |
| `id`           | Yes      | `string`                                            |                                                                       |
| `kind`         | Yes      | `string`                                            | A node-kind string (e.g. `file`, `function`); the store validates it. |
| `label`        | Yes      | `string`                                            |                                                                       |
| `language`     | Yes      | `string`                                            |                                                                       |
| `overlayDirty` | Yes      | `boolean`                                           |                                                                       |
| `owner`        | Yes      | `null,string`                                       |                                                                       |
| `parent`       | Yes      | `null,string`                                       |                                                                       |
| `recentChange` | Yes      | `null,string`                                       |                                                                       |
| `resolution`   | Yes      | `string`                                            | A node-resolution string (`package` / `module` / `symbol`).           |
| `span`         | Yes      | [NcapGraphSpan](protocol.md#ncapgraphspan) / `null` |                                                                       |
| `summary`      | Yes      | `null,string`                                       |                                                                       |

## NcapGraphSpan

A source location decoded from a graph frame: where an entity or relation is evidenced.

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `line` | Yes      | `number` |             |
| `path` | Yes      | `string` |             |

## NcapGrounding

The grounding overlay decoded from a `GroundingUpdate` frame (the active/highlighted subgraph).

| Field              | Required | Type              | Description                                      |
| ------------------ | -------- | ----------------- | ------------------------------------------------ |
| `activeReferences` | Yes      | Array of `string` |                                                  |
| `anchors`          | Yes      | Array of `string` |                                                  |
| `mode`             | Yes      | `string`          | `off` \| `local` \| `auto` \| `deep` \| `audit`. |
| `overlayChanges`   | Yes      | `number`          |                                                  |
| `snapshot`         | Yes      | `string`          |                                                  |
| `verification`     | Yes      | `string`          | `none` \| `pending` \| `passed` \| `failed`.     |

## NcapResearchDelta

One step of a research run on an unsolved problem.

| Field         | Required | Type          | Description                                                                                        |
| ------------- | -------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `claim`       | Yes      | `string`      | The claim in one line, when the frame carries one.                                                 |
| `detail`      | Yes      | `string`      | The engine's own line for this frame.                                                              |
| `disputed`    | Yes      | `boolean`     | True when ANOTHER line settled this same claim the OTHER way. Orthogonal to `status`.              |
| `line`        | Yes      | `string`      | The line of attack this frame is about, or empty when it is about the run itself.                  |
| `lines`       | Yes      | `number`      | How many lines of attack are open.                                                                 |
| `phase`       | Yes      | `string`      | `opened` \| `working` \| `reported` \| `again` \| `settled` \| `bare`, or `unknown` from a newer   |
| `problem`     | Yes      | `string`      | The problem being worked, as the user stated it. Never empty.                                      |
| `round`       | Yes      | `number`      | The round within this run.                                                                         |
| `roundsTotal` | Yes      | `number`      | Rounds across EVERY run this machine has done on this problem.                                     |
| `status`      | Yes      | `null,string` | `failed` \| `inconclusive` \| `cases` \| `reduced` \| `refuted` \| `proved`, or null before a line |
| `tokens`      | Yes      | `number`      | What the run has cost so far, as the engine estimates it.                                          |

## NcapSkillDelta

One skill the engine ingested, and what it has done this run.

| Field         | Required | Type      | Description                                                                              |
| ------------- | -------- | --------- | ---------------------------------------------------------------------------------------- |
| `always`      | Yes      | `boolean` | Whether it bypasses matching and applies to every item.                                  |
| `applied`     | Yes      | `number`  | How many it was actually injected into. Lower than `matched` means the budget bit.       |
| `checkable`   | Yes      | `boolean` | Whether it carries a `requires:`/`forbids:` clause the engine can CHECK rather than only |
| `description` | Yes      | `string`  |                                                                                          |
| `detail`      | Yes      | `string`  |                                                                                          |
| `file`        | Yes      | `string`  |                                                                                          |
| `matched`     | Yes      | `number`  | How many items it matched this run.                                                      |
| `name`        | Yes      | `string`  |                                                                                          |
| `source`      | Yes      | `string`  | `project` \| `claude` \| `user` — where it was found, which is also its precedence.      |
| `state`       | Yes      | `string`  | `ingested` \| `applied` \| `squeezed` \| `enforced` \| `refused` \| `unknown`.           |

## NcapSteerDelta

One supervision round of a decomposed run: what the supervisor concluded and every directive.

| Field        | Required | Type                           | Description                                                                       |
| ------------ | -------- | ------------------------------ | --------------------------------------------------------------------------------- |
| `directives` | Yes      | Array of Object (fields below) |                                                                                   |
| `round`      | Yes      | `number`                       |                                                                                   |
| `summary`    | Yes      | `string`                       | The supervisor's own statement of what was achieved, when it signed the goal off. |

**directives**

| Field  | Required | Type          | Description                                                                             |
| ------ | -------- | ------------- | --------------------------------------------------------------------------------------- |
| `item` | Yes      | `null,number` | The item it names, or null for a directive that names none. Item id 0 is a REAL id.     |
| `kind` | Yes      | `string`      | `plan` \| `depend` \| `accept` \| `reject` \| `done`, or `unknown` from a newer server. |
| `text` | Yes      | `string`      |                                                                                         |

## NcapToolCall

A tool the server asked the client to execute, decoded from the model stream.

| Field        | Required | Type      | Description                                                                              |
| ------------ | -------- | --------- | ---------------------------------------------------------------------------------------- |
| `arguments`  | Yes      | `string`  | JSON-encoded arguments (may be partial JSON while `partial` is true).                    |
| `name`       | Yes      | `string`  |                                                                                          |
| `partial`    | No       | `boolean` | A live preview of a call the model is still typing: render the forming action but do NOT |
| `toolCallId` | Yes      | `number`  |                                                                                          |

## NcapUsage

Live, non-terminal token usage for the whole turn.

| Field              | Required | Type     | Description                                                |
| ------------------ | -------- | -------- | ---------------------------------------------------------- |
| `cachedTokens`     | Yes      | `number` | The subset of `promptTokens` served from the prefix cache. |
| `completionTokens` | Yes      | `number` |                                                            |
| `maxTokens`        | Yes      | `number` | The max-token ceiling; `0` means uncapped.                 |
| `promptTokens`     | Yes      | `number` |                                                            |

## NetworkBody

Metadata for an observed payload, independently of whether its text is available.

| Field        | Required | Type          | Description |
| ------------ | -------- | ------------- | ----------- |
| `binary`     | Yes      | `boolean`     |             |
| `bytes`      | Yes      | `null,string` |             |
| `captured`   | Yes      | `boolean`     |             |
| `characters` | Yes      | `number`      |             |
| `mimeType`   | Yes      | `string`      |             |
| `redacted`   | Yes      | `boolean`     |             |
| `sha256`     | Yes      | `null,string` |             |

## NetworkDetailView

Request detail views share stable source pointers and independently paged text.

Type: `"query"` / `"reported"` / `"request-body"` / `"request-headers"` / `"response-body"` / `"response-headers"` / `"timings"`.

## NetworkFormat

Source formats decoded without replaying captured traffic.

Type: `"har"` / `"mitmproxy"`.

## NetworkIssue

Explicit missing or rejected capture coverage.

| Field      | Required | Type     | Description |
| ---------- | -------- | -------- | ----------- |
| `location` | Yes      | `string` |             |
| `message`  | Yes      | `string` |             |

## NetworkNativeSource

Native coordinates are exact decimal byte offsets in the immutable input.

| Field          | Required | Type          | Description |
| -------------- | -------- | ------------- | ----------- |
| `end`          | Yes      | `string`      |             |
| `flowId`       | Yes      | `null,string` |             |
| `flowType`     | Yes      | `null,string` |             |
| `ordinal`      | Yes      | `string`      |             |
| `start`        | Yes      | `string`      |             |
| `stateVersion` | Yes      | `null,string` |             |

## NetworkRequest

Compact request directory row with an immutable HAR JSON pointer.

| Field             | Required | Type                                                   | Description                                                               |
| ----------------- | -------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `durationMs`      | Yes      | `null,number`                                          |                                                                           |
| `id`              | Yes      | `string`                                               |                                                                           |
| `location`        | Yes      | `string`                                               |                                                                           |
| `method`          | Yes      | `null,string`                                          |                                                                           |
| `mimeType`        | Yes      | `string`                                               |                                                                           |
| `native`          | No       | [NetworkNativeSource](protocol.md#networknativesource) | Native coordinates are exact decimal byte offsets in the immutable input. |
| `requestBody`     | Yes      | [NetworkBody](protocol.md#networkbody)                 |                                                                           |
| `responseBody`    | Yes      | [NetworkBody](protocol.md#networkbody)                 |                                                                           |
| `startedDateTime` | Yes      | `null,string`                                          |                                                                           |
| `status`          | Yes      | `null,number`                                          |                                                                           |
| `url`             | Yes      | `null,string`                                          |                                                                           |
| `urlTruncated`    | Yes      | `boolean`                                              |                                                                           |

## ObjectSchema

Closed objects reject accidental fields, while open objects retain extension data.

| Field        | Required | Type                                            | Description |
| ------------ | -------- | ----------------------------------------------- | ----------- |
| `additional` | Yes      | `boolean`                                       |             |
| `fields`     | Yes      | Array of [SchemaField](protocol.md#schemafield) |             |
| `kind`       | Yes      | `"object"`                                      |             |
| `nullable`   | Yes      | `boolean`                                       |             |

## OkResult

The answer to a method that only reports success.

| Field | Required | Type   | Description |
| ----- | -------- | ------ | ----------- |
| `ok`  | Yes      | `true` |             |

## OmitBrowserScriptSourcetext

| Field    | Required | Type                                                             | Description |
| -------- | -------- | ---------------------------------------------------------------- | ----------- |
| `bytes`  | Yes      | `null,string`                                                    |             |
| `sha256` | Yes      | `null,string`                                                    |             |
| `state`  | Yes      | [BrowserScriptSourceState](protocol.md#browserscriptsourcestate) |             |

## PendingApproval

One approval waiting for a human.

| Field         | Required | Type                               | Description                                                                |
| ------------- | -------- | ---------------------------------- | -------------------------------------------------------------------------- |
| `approvalId`  | Yes      | `string`                           |                                                                            |
| `detail`      | No       | `string`                           | The exact command or path, so an operator approves what will actually run. |
| `expiresAt`   | Yes      | `number`                           |                                                                            |
| `principalId` | Yes      | `string`                           |                                                                            |
| `requestedAt` | Yes      | `number`                           |                                                                            |
| `risk`        | Yes      | [RiskLevel](protocol.md#risklevel) |                                                                            |
| `runId`       | Yes      | `null,string`                      |                                                                            |
| `sessionId`   | Yes      | `null,string`                      |                                                                            |
| `summary`     | Yes      | `string`                           |                                                                            |
| `tool`        | Yes      | `string`                           |                                                                            |

## PerformanceCohort

Input capability reports are not hardware or operating-system identification.

| Field             | Required | Type      | Description |
| ----------------- | -------- | --------- | ----------- |
| `gamepadEnabled`  | Yes      | `boolean` |             |
| `keyboardEnabled` | Yes      | `boolean` |             |
| `placeId`         | Yes      | `string`  |             |
| `placeVersion`    | Yes      | `string`  |             |
| `touchEnabled`    | Yes      | `boolean` |             |

## PerformanceGroup

Aggregate metrics expose no player/session identifiers. Counts are decimal strings.

| Field               | Required | Type                                               | Description |
| ------------------- | -------- | -------------------------------------------------- | ----------- |
| `cohort`            | Yes      | [PerformanceCohort](protocol.md#performancecohort) |             |
| `frames`            | Yes      | `string`                                           |             |
| `maximumFrameMs`    | Yes      | `number`                                           |             |
| `meanSessionFps`    | Yes      | `number`                                           |             |
| `sampledDurationMs` | Yes      | `number`                                           |             |
| `samples`           | Yes      | `number`                                           |             |
| `sessions`          | Yes      | `number`                                           |             |
| `slowFrameFraction` | Yes      | `number`                                           |             |
| `slowFrames`        | Yes      | `string`                                           |             |
| `timeWeightedFps`   | Yes      | `number`                                           |             |

## PerformanceQuery

End-exclusive server-observed report timestamps; sample windows can begin before fromMs.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `fromMs` | Yes      | `string` |             |
| `toMs`   | Yes      | `string` |             |

## PerformanceReport

Complete bounded selection with quality counts and collection diagnostics.

| Field                  | Required | Type                                                      | Description                                                                                    |
| ---------------------- | -------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `caveats`              | Yes      | Array of `string`                                         |                                                                                                |
| `collection`           | No       | [TelemetryHealth](protocol.md#telemetryhealth)            | Owner-visible collection evidence, not a guarantee that the game emitted every required event. |
| `duplicateSamples`     | Yes      | `number`                                                  |                                                                                                |
| `generatedAtMs`        | Yes      | `string`                                                  |                                                                                                |
| `groups`               | Yes      | Array of [PerformanceGroup](protocol.md#performancegroup) |                                                                                                |
| `ignoredSourceSamples` | Yes      | `number`                                                  |                                                                                                |
| `invalidSamples`       | Yes      | `number`                                                  |                                                                                                |
| `latestSampleMs`       | Yes      | `null,string`                                             |                                                                                                |
| `query`                | Yes      | [PerformanceQuery](protocol.md#performancequery)          |                                                                                                |

## PlanningAlignmentAnchor

Server-created semantic anchors for the request and the proposed graph.

| Field          | Required | Type                                                                                  | Description |
| -------------- | -------- | ------------------------------------------------------------------------------------- | ----------- |
| `beforeHash`   | Yes      | `string`                                                                              |             |
| `graphHash`    | Yes      | `string`                                                                              |             |
| `requirements` | Yes      | Array of [PlanningRequirementFingerprint](protocol.md#planningrequirementfingerprint) |             |
| `version`      | Yes      | `1`                                                                                   |             |

## PlanningBrief

A bounded product brief; unanswered operational choices remain explicit.

| Field          | Required | Type                                                            | Description |
| -------------- | -------- | --------------------------------------------------------------- | ----------- |
| `assumptions`  | Yes      | Array of `string`                                               |             |
| `boundaries`   | Yes      | Array of `string`                                               |             |
| `budget`       | Yes      | `null,string`                                                   |             |
| `goal`         | Yes      | `string`                                                        |             |
| `outputs`      | Yes      | Array of `string`                                               |             |
| `questions`    | Yes      | Array of [PlanningQuestion](protocol.md#planningquestion)       |             |
| `requirements` | Yes      | Array of [PlanningRequirement](protocol.md#planningrequirement) |             |
| `schedule`     | Yes      | `null,string`                                                   |             |
| `sources`      | Yes      | Array of `string`                                               |             |

## PlanningDocument

Unsaved editor state is planning context, never an execution plan or permission grant.

| Field       | Required | Type                                                      | Description |
| ----------- | -------- | --------------------------------------------------------- | ----------- |
| `details`   | Yes      | [WorkflowDetails](protocol.md#workflowdetails)            |             |
| `edges`     | Yes      | Array of [WorkflowEdge](protocol.md#workflowedge)         |             |
| `nodes`     | Yes      | Array of [WorkflowNode](protocol.md#workflownode)         |             |
| `positions` | Yes      | Array of [WorkflowPosition](protocol.md#workflowposition) |             |

## PlanningHistory

| Field           | Required | Type                                              | Description |
| --------------- | -------- | ------------------------------------------------- | ----------- |
| `nextRequestId` | Yes      | `null,string`                                     |             |
| `turns`         | Yes      | Array of [PlanningTurn](protocol.md#planningturn) |             |

## PlanningHistoryRequest

| Field             | Required | Type          | Description |
| ----------------- | -------- | ------------- | ----------- |
| `beforeRequestId` | Yes      | `null,string` |             |
| `workflowId`      | Yes      | `string`      |             |

## PlanningQuestion

| Field     | Required | Type              | Description |
| --------- | -------- | ----------------- | ----------- |
| `choices` | Yes      | Array of `string` |             |
| `id`      | Yes      | `string`          |             |
| `text`    | Yes      | `string`          |             |

## PlanningReply

Fingerprint pins the proposal to unsaved state as well as the persisted base revision.

| Field          | Required | Type                                                           | Description                                                   |
| -------------- | -------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| `alignment`    | No       | [PlanningAlignmentAnchor](protocol.md#planningalignmentanchor) | Omitted on older stored replies; never supplied by the model. |
| `baseRevision` | Yes      | `string`                                                       |                                                               |
| `brief`        | Yes      | [PlanningBrief](protocol.md#planningbrief)                     |                                                               |
| `draftHash`    | Yes      | `string`                                                       |                                                               |
| `message`      | Yes      | `string`                                                       |                                                               |
| `patch`        | Yes      | [WorkflowPatch](protocol.md#workflowpatch) / `null`            |                                                               |
| `validation`   | Yes      | [GraphValidation](protocol.md#graphvalidation)                 |                                                               |
| `workflowId`   | Yes      | `string`                                                       |                                                               |

## PlanningRequest

| Field               | Required | Type                                             | Description                                                                    |
| ------------------- | -------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `baseRevision`      | Yes      | `string`                                         |                                                                                |
| `document`          | Yes      | [PlanningDocument](protocol.md#planningdocument) |                                                                                |
| `message`           | Yes      | `string`                                         |                                                                                |
| `previousRequestId` | Yes      | `null,string`                                    |                                                                                |
| `requestId`         | Yes      | `string`                                         |                                                                                |
| `sourceIds`         | No       | Array of `string`                                | Explicit metadata selections; never resource grants. Omitted by older clients. |
| `workflowId`        | Yes      | `string`                                         |                                                                                |

## PlanningRequirement

Links the user's intent to stable component identities without claiming execution readiness.

| Field     | Required | Type                                             | Description |
| --------- | -------- | ------------------------------------------------ | ----------- |
| `id`      | Yes      | `string`                                         |             |
| `nodeIds` | Yes      | Array of `string`                                |             |
| `state`   | Yes      | [RequirementState](protocol.md#requirementstate) |             |
| `text`    | Yes      | `string`                                         |             |

## PlanningRequirementFingerprint

A fingerprint detects graph drift; it never proves a requirement is fulfilled or runnable.

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `hash` | Yes      | `string` |             |
| `id`   | Yes      | `string` |             |

## PlanningSource

Metadata only. No filesystem paths, credentials, file contents, or host telemetry.

| Field    | Required | Type                                                   | Description |
| -------- | -------- | ------------------------------------------------------ | ----------- |
| `id`     | Yes      | `string`                                               |             |
| `name`   | Yes      | `string`                                               |             |
| `reason` | Yes      | `string`                                               |             |
| `state`  | Yes      | [PlanningSourceState](protocol.md#planningsourcestate) |             |

## PlanningSourceState

Discovery of a registered source is not a grant or an executable resource binding.

Type: `"needs-adapter"` / `"unavailable"`.

## PlanningSourcesPage

| Field       | Required | Type                                                  | Description |
| ----------- | -------- | ----------------------------------------------------- | ----------- |
| `available` | Yes      | `boolean`                                             |             |
| `items`     | Yes      | Array of [PlanningSource](protocol.md#planningsource) |             |
| `next`      | Yes      | `null,string`                                         |             |

## PlanningSourcesRequest

Owner-scoped catalog pagination; a cursor is an opaque source identity, not a path.

| Field        | Required | Type          | Description |
| ------------ | -------- | ------------- | ----------- |
| `after`      | Yes      | `null,string` |             |
| `workflowId` | Yes      | `string`      |             |

## PlanningStatus

Type: `"canceled"` / `"complete"` / `"failed"` / `"working"`.

## PlanningTurn

A turn is a separate bounded record, not an ever-growing workflow field.

| Field               | Required | Type                                                | Description                                                        |
| ------------------- | -------- | --------------------------------------------------- | ------------------------------------------------------------------ |
| `createdAtMs`       | Yes      | `string`                                            |                                                                    |
| `error`             | Yes      | `null,string`                                       |                                                                    |
| `message`           | Yes      | `string`                                            |                                                                    |
| `previousRequestId` | Yes      | `null,string`                                       |                                                                    |
| `reply`             | Yes      | [PlanningReply](protocol.md#planningreply) / `null` |                                                                    |
| `requestId`         | Yes      | `string`                                            |                                                                    |
| `sourceIds`         | No       | Array of `string`                                   | Explicit metadata selections retained with this conversation turn. |
| `status`            | Yes      | [PlanningStatus](protocol.md#planningstatus)        |                                                                    |
| `workflowId`        | Yes      | `string`                                            |                                                                    |

## PlanningTurnRef

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `requestId`  | Yes      | `string` |             |
| `workflowId` | Yes      | `string` |             |

## PortCardinality

Type: `"item"` / `"list"` / `"stream"`.

## PortDirection

Type: `"input"` / `"output"`.

## PricingCalculation

Versions describe existing calculations, including their rounding behavior.

Type: `"report-tokens-v1"` / `"report-units-v1"` / `"wallet-tokens-v1"`.

## PricingTariff

Original decimal USD rates; absence retains the calculation's existing fallback semantics.

| Field                   | Required | Type                                                 | Description |
| ----------------------- | -------- | ---------------------------------------------------- | ----------- |
| `cacheWritePerMillion`  | No       | `string`                                             |             |
| `cachedInputPerMillion` | No       | `string`                                             |             |
| `calculation`           | Yes      | [PricingCalculation](protocol.md#pricingcalculation) |             |
| `inputPerMillion`       | No       | `string`                                             |             |
| `outputPerMillion`      | No       | `string`                                             |             |
| `perCall`               | No       | `string`                                             |             |
| `perThousandUnits`      | No       | `string`                                             |             |

## ProcessInput

Keystrokes are bounded and addressed through the owning session.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `data`      | Yes      | `string` |             |
| `processId` | Yes      | `string` |             |
| `sessionId` | Yes      | `string` |             |

## ProcessLogRef

Incremental reads share the same bounded log endpoint as background job tails.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `offset`    | No       | `string` |             |
| `processId` | Yes      | `string` |             |
| `sessionId` | Yes      | `string` |             |

## ProcessResize

Terminal dimensions are small positive integers.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `cols`      | Yes      | `number` |             |
| `processId` | Yes      | `string` |             |
| `rows`      | Yes      | `number` |             |
| `sessionId` | Yes      | `string` |             |

## ReasoningOptions

Reasoning configuration for a request.

| Field       | Required | Type                                                                          | Description                                                                  |
| ----------- | -------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `effort`    | No       | `"high"` / `"low"` / `"max"` / `"medium"` / `"minimal"` / `"off"` / `"xhigh"` | How hard the model should think before answering.                            |
| `include`   | No       | `boolean`                                                                     | Whether the reasoning trace should be streamed back at all.                  |
| `maxTokens` | No       | `number`                                                                      | A hard token budget for the reasoning trace, where the provider accepts one. |

## RecordBrowserStorageGroupBrowserStorageCoverage

| Field             | Required | Type                                                         | Description |
| ----------------- | -------- | ------------------------------------------------------------ | ----------- |
| `cache-storage`   | Yes      | [BrowserStorageCoverage](protocol.md#browserstoragecoverage) |             |
| `cookies`         | Yes      | [BrowserStorageCoverage](protocol.md#browserstoragecoverage) |             |
| `indexed-db`      | Yes      | [BrowserStorageCoverage](protocol.md#browserstoragecoverage) |             |
| `local-storage`   | Yes      | [BrowserStorageCoverage](protocol.md#browserstoragecoverage) |             |
| `session-storage` | Yes      | [BrowserStorageCoverage](protocol.md#browserstoragecoverage) |             |

## RecordBrowserStorageGroupBrowserStorageGroupComparison

| Field             | Required | Type                                                                       | Description |
| ----------------- | -------- | -------------------------------------------------------------------------- | ----------- |
| `cache-storage`   | Yes      | [BrowserStorageGroupComparison](protocol.md#browserstoragegroupcomparison) |             |
| `cookies`         | Yes      | [BrowserStorageGroupComparison](protocol.md#browserstoragegroupcomparison) |             |
| `indexed-db`      | Yes      | [BrowserStorageGroupComparison](protocol.md#browserstoragegroupcomparison) |             |
| `local-storage`   | Yes      | [BrowserStorageGroupComparison](protocol.md#browserstoragegroupcomparison) |             |
| `session-storage` | Yes      | [BrowserStorageGroupComparison](protocol.md#browserstoragegroupcomparison) |             |

## RecordstringScope

Type: Dictionary.

## Recordstringnever

Type: Dictionary.

## Recordstringnumber

Type: Dictionary.

## Recordstringstring

Type: Dictionary.

## Recordstringstringnumberboolean

Type: Dictionary.

## Recordstringunknown

Type: Dictionary.

## ReminderAction

A durable message to the conversation that requested it; no model execution.

| Field            | Required | Type         | Description |
| ---------------- | -------- | ------------ | ----------- |
| `channelId`      | Yes      | `string`     |             |
| `conversationId` | Yes      | `string`     |             |
| `kind`           | Yes      | `"reminder"` |             |
| `text`           | Yes      | `string`     |             |
| `threadId`       | No       | `string`     |             |

## RequirementState

Type: `"drafted"` / `"missing"` / `"question"`.

## ResetAllowanceParams

A confirmed reset always applies to the exact displayed allowance generation.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `cycle`     | Yes      | `string` |             |
| `requestId` | Yes      | `string` |             |
| `week`      | Yes      | `string` |             |

## ResetAllowanceResult

A successful mutation carries its immutable receipt, including on retries.

| Field       | Required | Type                                               | Description |
| ----------- | -------- | -------------------------------------------------- | ----------- |
| `receipt`   | Yes      | [ResetHistoryEntry](protocol.md#resethistoryentry) |             |
| `requestId` | Yes      | `string`                                           |             |
| `userId`    | Yes      | `string`                                           |             |

## ResetHistoryEntry

Owner-scoped reset evidence without operator grant/payment identifiers.

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `allowance`    | Yes      | `string` |             |
| `previousHeld` | Yes      | `string` |             |
| `previousUsed` | Yes      | `string` |             |
| `recordedAt`   | Yes      | `number` |             |
| `sequence`     | Yes      | `string` |             |
| `week`         | Yes      | `string` |             |

## ResetHistoryPage

Stable descending pagination.

| Field     | Required | Type                                                        | Description |
| --------- | -------- | ----------------------------------------------------------- | ----------- |
| `entries` | Yes      | Array of [ResetHistoryEntry](protocol.md#resethistoryentry) |             |
| `next`    | Yes      | `null,string`                                               |             |
| `userId`  | Yes      | `string`                                                    |             |

## ResetSnapshot

JSON-safe reset state; generation tokens prevent stale tabs consuming another entitlement.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `asOf`      | Yes      | `number` |             |
| `available` | Yes      | `string` |             |
| `cycle`     | Yes      | `string` |             |
| `userId`    | Yes      | `string` |             |
| `week`      | Yes      | `string` |             |

## ResourceBinding

Saved requirement, including incomplete drafts. Never stores credentials or telemetry.

| Field        | Required | Type                                                        | Description                                                                             |
| ------------ | -------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `alias`      | Yes      | `string`                                                    |                                                                                         |
| `consumerId` | Yes      | `string`                                                    | Stable node/group identity controls which agent or step receives access.                |
| `family`     | Yes      | [ResourceFamily](protocol.md#resourcefamily)                |                                                                                         |
| `id`         | Yes      | `string`                                                    |                                                                                         |
| `limits`     | Yes      | [ResourceLimits](protocol.md#resourcelimits)                |                                                                                         |
| `maxAgeMs`   | Yes      | `null,string`                                               | Null allows unknown freshness. Otherwise runtime requires a fresh observed source time. |
| `operations` | Yes      | Array of `string`                                           |                                                                                         |
| `selection`  | Yes      | [ResourceSelection](protocol.md#resourceselection) / `null` |                                                                                         |
| `use`        | Yes      | [ResourceUse](protocol.md#resourceuse)                      |                                                                                         |
| `version`    | Yes      | `1`                                                         |                                                                                         |

## ResourceFamily

External resource identity; these families never confer access themselves.

Type: `"application"` / `"compute"` / `"computer"` / `"database"` / `"feed"` / `"files"` / `"workspace"`.

## ResourceLimits

Bounded read or job outputs, not a grant to ingest a whole source.

| Field      | Required | Type     | Description                                            |
| ---------- | -------- | -------- | ------------------------------------------------------ |
| `maxBytes` | Yes      | `string` | Unsigned canonical decimal, lossless on the JSON wire. |
| `maxItems` | Yes      | `number` |                                                        |

## ResourceSchema

Resource roles are nominal identities, not implicit runtime permissions.

| Field      | Required | Type         | Description |
| ---------- | -------- | ------------ | ----------- |
| `kind`     | Yes      | `"resource"` |             |
| `nullable` | Yes      | `boolean`    |             |
| `role`     | Yes      | `string`     |             |

## ResourceSelection

An exact dataset/endpoint selection; paths never act as implicit permission prefixes.

| Field              | Required | Type     | Description |
| ------------------ | -------- | -------- | ----------- |
| `connectionId`     | Yes      | `string` |             |
| `connectorId`      | Yes      | `string` |             |
| `connectorVersion` | Yes      | `string` |             |
| `resourceId`       | Yes      | `string` |             |
| `targetId`         | Yes      | `string` |             |

## ResourceUse

Attaching access, reading data, and placing computation are different operations.

Type: `"attach"` / `"compute"` / `"read"`.

## ReverseApplicationSnapshot

Bounded projection for live Chat events; complete indexes are paged by the native query tool.

| Field              | Required | Type                                                            | Description |
| ------------------ | -------- | --------------------------------------------------------------- | ----------- |
| `boundaries`       | Yes      | Array of [ApplicationBoundary](protocol.md#applicationboundary) |             |
| `functionCount`    | Yes      | `number`                                                        |             |
| `importCount`      | Yes      | `number`                                                        |             |
| `ipcCount`         | Yes      | `number`                                                        |             |
| `issueCount`       | Yes      | `number`                                                        |             |
| `issues`           | Yes      | Array of [ApplicationIssue](protocol.md#applicationissue)       |             |
| `languages`        | No       | Array of [SourceLanguage](protocol.md#sourcelanguage)           |             |
| `moduleCount`      | Yes      | `number`                                                        |             |
| `modules`          | Yes      | Array of [ApplicationModule](protocol.md#applicationmodule)     |             |
| `nativeAddonCount` | Yes      | `number`                                                        |             |
| `referenceCount`   | No       | `number`                                                        |             |
| `routeCount`       | Yes      | `number`                                                        |             |
| `sourceMapCount`   | Yes      | `number`                                                        |             |
| `symbolCount`      | No       | `number`                                                        |             |

## ReverseArchiveRef

A session-owned archive, without query tokens or analyzer handles.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `sessionId` | Yes      | `string` |             |

## ReverseBrowserMetadata

Immutable observation metadata, separate from retained event rows.

| Field           | Required | Type                                                           | Description |
| --------------- | -------- | -------------------------------------------------------------- | ----------- |
| `coverage`      | Yes      | [BrowserActivityCoverage](protocol.md#browseractivitycoverage) |             |
| `endedAt`       | Yes      | `string`                                                       |             |
| `observationMs` | Yes      | `number`                                                       |             |
| `origin`        | Yes      | `string`                                                       |             |
| `provider`      | Yes      | `"cdp-passive"`                                                |             |
| `startedAt`     | Yes      | `string`                                                       |             |
| `targetId`      | Yes      | `string`                                                       |             |
| `url`           | Yes      | `string`                                                       |             |

## ReverseBrowserPage

One bounded archive page proves both investigation and capture identity.

| Field           | Required | Type                                                                | Description |
| --------------- | -------- | ------------------------------------------------------------------- | ----------- |
| `captureSha256` | Yes      | `string`                                                            |             |
| `cursor`        | Yes      | `string`                                                            |             |
| `evidenceId`    | Yes      | `string`                                                            |             |
| `metadata`      | Yes      | [ReverseBrowserMetadata](protocol.md#reversebrowsermetadata)        |             |
| `nextCursor`    | Yes      | `null,string`                                                       |             |
| `records`       | Yes      | Array of [BrowserActivityRecord](protocol.md#browseractivityrecord) |             |
| `runId`         | Yes      | `string`                                                            |             |
| `sha256`        | Yes      | `string`                                                            |             |
| `total`         | Yes      | `number`                                                            |             |

## ReverseBrowserQuery

Only an archived evidence identity can select saved browser activity.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `cursor`     | No       | `string` |             |
| `evidenceId` | Yes      | `string` |             |
| `id`         | Yes      | `string` |             |
| `runId`      | Yes      | `string` |             |

## ReverseBrowserReference

Saved browser provenance identifies the original conversation, run and evidence content.

| Field           | Required | Type     | Description |
| --------------- | -------- | -------- | ----------- |
| `captureSha256` | Yes      | `string` |             |
| `evidenceId`    | Yes      | `string` |             |
| `runId`         | Yes      | `string` |             |
| `sessionId`     | Yes      | `string` |             |

## ReverseBrowserSnapshot

A live run carries capture metadata and an event count, never all event rows.

| Field           | Required | Type                                                           | Description |
| --------------- | -------- | -------------------------------------------------------------- | ----------- |
| `coverage`      | Yes      | [BrowserActivityCoverage](protocol.md#browseractivitycoverage) |             |
| `endedAt`       | Yes      | `string`                                                       |             |
| `observationMs` | Yes      | `number`                                                       |             |
| `origin`        | Yes      | `string`                                                       |             |
| `provider`      | Yes      | `"cdp-passive"`                                                |             |
| `recordCount`   | Yes      | `number`                                                       |             |
| `reference`     | Yes      | [ReverseBrowserReference](protocol.md#reversebrowserreference) |             |
| `startedAt`     | Yes      | `string`                                                       |             |
| `targetId`      | Yes      | `string`                                                       |             |
| `url`           | Yes      | `string`                                                       |             |

## ReverseCatalogPage

An append-only catalog page; cursors are exact decimal record offsets.

| Field        | Required | Type                                                                | Description |
| ------------ | -------- | ------------------------------------------------------------------- | ----------- |
| `cursor`     | Yes      | `string`                                                            |             |
| `evidence`   | Yes      | Array of [ReverseEvidenceRecord](protocol.md#reverseevidencerecord) |             |
| `nextCursor` | Yes      | `null,string`                                                       |             |
| `runId`      | Yes      | `string`                                                            |             |
| `sha256`     | Yes      | `string`                                                            |             |
| `total`      | Yes      | `string`                                                            |             |

## ReverseCatalogQuery

Reads only an authenticated session's indexed investigation, never a workspace path.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `cursor` | No       | `string` |             |
| `id`     | Yes      | `string` |             |
| `runId`  | Yes      | `string` |             |

## ReverseControlFlowInstruction

One actual analyzer instruction, with an exact unsigned native address.

| Field         | Required | Type     | Description |
| ------------- | -------- | -------- | ----------- |
| `address`     | Yes      | `string` |             |
| `instruction` | Yes      | `string` |             |

## ReverseDirectoryState

Explicit inventory coverage distinguishes absent, partial and complete indexing.

Type: `"failed"` / `"indexing"` / `"partial"` / `"ready"` / `"unavailable"`.

## ReverseEngine

Installed native analyzer supplying a function directory.

Type: `"ghidra"` / `"ida"`.

## ReverseEvidencePage

Original evidence text paged by UTF-16 offset, independent of model report previews.

| Field                    | Required | Type                                                       | Description                                                                             |
| ------------------------ | -------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `characters`             | Yes      | `string`                                                   |                                                                                         |
| `cursor`                 | Yes      | `string`                                                   |                                                                                         |
| `evidenceSha256`         | Yes      | `string`                                                   |                                                                                         |
| `nextCursor`             | Yes      | `null,string`                                              |                                                                                         |
| `originalEvidenceSha256` | No       | `string`                                                   | Present for a derived code page and always identifies the unmodified captured original. |
| `record`                 | Yes      | [ReverseEvidenceRecord](protocol.md#reverseevidencerecord) |                                                                                         |
| `representation`         | No       | `"code"` / `"original"`                                    |                                                                                         |
| `runId`                  | Yes      | `string`                                                   |                                                                                         |
| `sha256`                 | Yes      | `string`                                                   |                                                                                         |
| `text`                   | Yes      | `string`                                                   |                                                                                         |

## ReverseEvidenceQuery

Evidence ids come from the saved catalog and cannot authorize arbitrary files.

| Field            | Required | Type                    | Description                                                      |
| ---------------- | -------- | ----------------------- | ---------------------------------------------------------------- |
| `cursor`         | No       | `string`                |                                                                  |
| `evidenceId`     | Yes      | `string`                |                                                                  |
| `id`             | Yes      | `string`                |                                                                  |
| `representation` | No       | `"code"` / `"original"` | Code is extracted at capture time; original remains the default. |
| `runId`          | Yes      | `string`                |                                                                  |

## ReverseEvidenceRecord

Provenance for one immutable evidence file, shared by specialists in the same run.

| Field         | Required | Type          | Description |
| ------------- | -------- | ------------- | ----------- |
| `characters`  | Yes      | `string`      |             |
| `createdAtMs` | Yes      | `string`      |             |
| `excerpt`     | Yes      | `string`      |             |
| `expert`      | Yes      | `string`      |             |
| `id`          | Yes      | `string`      |             |
| `operation`   | Yes      | `string`      |             |
| `path`        | Yes      | `string`      |             |
| `selector`    | Yes      | `null,string` |             |
| `stepId`      | No       | `string`      |             |

## ReverseFunction

Durable metadata, with exact addresses and byte sizes represented as strings.

| Field     | Required | Type          | Description |
| --------- | -------- | ------------- | ----------- |
| `address` | Yes      | `string`      |             |
| `bytes`   | Yes      | `null,string` |             |
| `name`    | Yes      | `string`      |             |

## ReverseFunctionsPage

At most fifty address-ordered function rows from a single owner-scoped inventory.

| Field        | Required | Type                                                       | Description |
| ------------ | -------- | ---------------------------------------------------------- | ----------- |
| `cursor`     | Yes      | `string`                                                   |             |
| `engine`     | Yes      | [ReverseEngine](protocol.md#reverseengine)                 |             |
| `error`      | Yes      | `null,string`                                              |             |
| `functions`  | Yes      | Array of [ReverseFunction](protocol.md#reversefunction)    |             |
| `nextCursor` | Yes      | `null,string`                                              |             |
| `runId`      | Yes      | `string`                                                   |             |
| `sha256`     | Yes      | `string`                                                   |             |
| `state`      | Yes      | [ReverseDirectoryState](protocol.md#reversedirectorystate) |             |
| `total`      | Yes      | `string`                                                   |             |

## ReverseFunctionsQuery

An authenticated directory read never accepts analyzer handles or filesystem paths.

| Field    | Required | Type                                       | Description                                                                  |
| -------- | -------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| `cursor` | No       | `string`                                   |                                                                              |
| `engine` | Yes      | [ReverseEngine](protocol.md#reverseengine) |                                                                              |
| `filter` | No       | `string`                                   | Literal case-insensitive name or address prefix, never a regular expression. |
| `id`     | Yes      | `string`                                   |                                                                              |
| `runId`  | Yes      | `string`                                   |                                                                              |

## ReverseGraphBlock

Original coverage and presentation paging remain separate.

| Field                   | Required | Type                                                                                | Description                                                               |
| ----------------------- | -------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `end`                   | Yes      | `string`                                                                            |                                                                           |
| `endInclusive`          | No       | `boolean`                                                                           | Ghidra uses an inclusive last address; IDA uses an exclusive end address. |
| `id`                    | Yes      | `string`                                                                            |                                                                           |
| `instructionCount`      | Yes      | `number`                                                                            |                                                                           |
| `instructionOffset`     | Yes      | `number`                                                                            |                                                                           |
| `instructions`          | Yes      | Array of [ReverseControlFlowInstruction](protocol.md#reversecontrolflowinstruction) |                                                                           |
| `instructionsTruncated` | Yes      | `boolean`                                                                           |                                                                           |
| `nextInstructionOffset` | Yes      | `null,number`                                                                       |                                                                           |
| `start`                 | Yes      | `string`                                                                            |                                                                           |
| `successors`            | Yes      | Array of `string`                                                                   |                                                                           |

## ReverseGraphPage

Immutable graph provenance, with bounded block and instruction navigation.

| Field              | Required | Type                                                         | Description                                                                           |
| ------------------ | -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `blockId`          | Yes      | `null,string`                                                |                                                                                       |
| `capturedBlocks`   | Yes      | `number`                                                     |                                                                                       |
| `capturedOffset`   | Yes      | `number`                                                     |                                                                                       |
| `cursor`           | Yes      | `string`                                                     |                                                                                       |
| `evidenceSha256`   | Yes      | `string`                                                     |                                                                                       |
| `graph`            | Yes      | [ReverseGraphProjection](protocol.md#reversegraphprojection) |                                                                                       |
| `nextCursor`       | Yes      | `null,string`                                                |                                                                                       |
| `record`           | Yes      | [ReverseEvidenceRecord](protocol.md#reverseevidencerecord)   |                                                                                       |
| `runId`            | Yes      | `string`                                                     |                                                                                       |
| `sha256`           | Yes      | `string`                                                     |                                                                                       |
| `uncapturedOffset` | Yes      | `null,number`                                                | The next analyzer offset is absent from this capture; another inspection is required. |

## ReverseGraphProjection

At most four captured blocks and 12000 serialized block characters.

| Field         | Required | Type                                                        | Description |
| ------------- | -------- | ----------------------------------------------------------- | ----------- |
| `address`     | Yes      | `string`                                                    |             |
| `blocks`      | Yes      | Array of [ReverseGraphBlock](protocol.md#reversegraphblock) |             |
| `function`    | Yes      | `string`                                                    |             |
| `nextOffset`  | Yes      | `null,number`                                               |             |
| `offset`      | Yes      | `number`                                                    |             |
| `totalBlocks` | Yes      | `number`                                                    |             |

## ReverseGraphQuery

Reads captured blocks, or an instruction page from one captured block.

| Field        | Required | Type     | Description                                                                            |
| ------------ | -------- | -------- | -------------------------------------------------------------------------------------- |
| `blockId`    | No       | `string` | When present, cursor addresses instructions in this block rather than captured blocks. |
| `cursor`     | No       | `string` |                                                                                        |
| `evidenceId` | Yes      | `string` |                                                                                        |
| `id`         | Yes      | `string` |                                                                                        |
| `runId`      | Yes      | `string` |                                                                                        |

## ReverseInspectQuery

Operates only on a still-live, owner-scoped analyzer. No database id or query token crosses the wire.

| Field       | Required | Type                                               | Description                                                                  |
| ----------- | -------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `cursor`    | No       | `string`                                           |                                                                              |
| `engine`    | Yes      | [ReverseEngine](protocol.md#reverseengine)         |                                                                              |
| `filter`    | No       | `string`                                           | Literal case-insensitive name or address prefix, never a regular expression. |
| `id`        | Yes      | `string`                                           |                                                                              |
| `offset`    | No       | `number`                                           |                                                                              |
| `operation` | Yes      | [ReverseInspection](protocol.md#reverseinspection) |                                                                              |
| `runId`     | Yes      | `string`                                           |                                                                              |
| `selector`  | Yes      | `string`                                           |                                                                              |

## ReverseInspectResult

Inspection captures immutable evidence; its text is read separately through the existing paged API.

| Field    | Required | Type                                                       | Description |
| -------- | -------- | ---------------------------------------------------------- | ----------- |
| `record` | Yes      | [ReverseEvidenceRecord](protocol.md#reverseevidencerecord) |             |
| `runId`  | Yes      | `string`                                                   |             |
| `sha256` | Yes      | `string`                                                   |             |

## ReverseInspection

Read-only browser operations supported by an existing native analyzer lease.

Type: `"decompile"` / `"disassemble"` / `"graph"` / `"xrefs"`.

## ReverseNetworkDetailPage

A complete saved projection digest, independent of the original body and source HAR digests.

| Field           | Required | Type                                               | Description |
| --------------- | -------- | -------------------------------------------------- | ----------- |
| `body`          | Yes      | [NetworkBody](protocol.md#networkbody) / `null`    |             |
| `captureSha256` | Yes      | `string`                                           |             |
| `characters`    | Yes      | `string`                                           |             |
| `cursor`        | Yes      | `string`                                           |             |
| `location`      | Yes      | `string`                                           |             |
| `nextCursor`    | Yes      | `null,string`                                      |             |
| `runId`         | Yes      | `string`                                           |             |
| `selector`      | Yes      | `string`                                           |             |
| `sha256`        | Yes      | `string`                                           |             |
| `text`          | Yes      | `string`                                           |             |
| `unavailable`   | Yes      | `null,string`                                      |             |
| `view`          | Yes      | [NetworkDetailView](protocol.md#networkdetailview) |             |

## ReverseNetworkDetailQuery

Selects only archive-owned entries; no path, capability or executable request crosses RPC.

| Field      | Required | Type                                               | Description |
| ---------- | -------- | -------------------------------------------------- | ----------- |
| `cursor`   | No       | `string`                                           |             |
| `id`       | Yes      | `string`                                           |             |
| `runId`    | Yes      | `string`                                           |             |
| `selector` | Yes      | `string`                                           |             |
| `view`     | Yes      | [NetworkDetailView](protocol.md#networkdetailview) |             |

## ReverseNetworkDirectoryPage

Source-ordered metadata pages hold at most twenty rows and 12,000 serialized characters.

| Field           | Required | Type                                                                          | Description |
| --------------- | -------- | ----------------------------------------------------------------------------- | ----------- |
| `cursor`        | Yes      | `string`                                                                      |             |
| `error`         | Yes      | `null,string`                                                                 |             |
| `nextCursor`    | Yes      | `null,string`                                                                 |             |
| `requests`      | Yes      | Array of [ReverseNetworkDirectoryRow](protocol.md#reversenetworkdirectoryrow) |             |
| `runId`         | Yes      | `string`                                                                      |             |
| `sha256`        | Yes      | `string`                                                                      |             |
| `sourceEntries` | Yes      | `string`                                                                      |             |
| `state`         | Yes      | [ReverseDirectoryState](protocol.md#reversedirectorystate)                    |             |
| `total`         | Yes      | `string`                                                                      |             |

## ReverseNetworkDirectoryQuery

Metadata navigation never accepts a file path or analyzer capability.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `cursor` | No       | `string` |             |
| `filter` | No       | `string` |             |
| `id`     | Yes      | `string` |             |
| `method` | No       | `string` |             |
| `runId`  | Yes      | `string` |             |
| `status` | No       | `number` |             |

## ReverseNetworkDirectoryRow

A request retains metadata even when no agent has captured either payload.

| Field                | Required | Type                                                   | Description                                                               |
| -------------------- | -------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `durationMs`         | Yes      | `null,number`                                          |                                                                           |
| `id`                 | Yes      | `string`                                               |                                                                           |
| `location`           | Yes      | `string`                                               |                                                                           |
| `method`             | Yes      | `null,string`                                          |                                                                           |
| `mimeType`           | Yes      | `string`                                               |                                                                           |
| `native`             | No       | [NetworkNativeSource](protocol.md#networknativesource) | Native coordinates are exact decimal byte offsets in the immutable input. |
| `requestBody`        | Yes      | [NetworkBody](protocol.md#networkbody)                 |                                                                           |
| `requestEvidenceId`  | Yes      | `null,string`                                          |                                                                           |
| `responseBody`       | Yes      | [NetworkBody](protocol.md#networkbody)                 |                                                                           |
| `responseEvidenceId` | Yes      | `null,string`                                          |                                                                           |
| `startedDateTime`    | Yes      | `null,string`                                          |                                                                           |
| `status`             | Yes      | `null,number`                                          |                                                                           |
| `url`                | Yes      | `null,string`                                          |                                                                           |
| `urlTruncated`       | Yes      | `boolean`                                              |                                                                           |

## ReverseNetworkSnapshot

Bounded capability-free projection; full entries and payloads require paged evidence queries.

| Field            | Required | Type                                                  | Description |
| ---------------- | -------- | ----------------------------------------------------- | ----------- |
| `entryCount`     | Yes      | `number`                                              |             |
| `format`         | Yes      | [NetworkFormat](protocol.md#networkformat)            |             |
| `issueCount`     | Yes      | `number`                                              |             |
| `issues`         | Yes      | Array of [NetworkIssue](protocol.md#networkissue)     |             |
| `missingBodies`  | Yes      | `number`                                              |             |
| `redactedBodies` | Yes      | `number`                                              |             |
| `requests`       | Yes      | Array of [NetworkRequest](protocol.md#networkrequest) |             |
| `version`        | Yes      | `string`                                              |             |

## ReversePlanStep

An evidence-linked follow-up requested by a specialist and executed by the runtime.

| Field          | Required | Type                                     | Description |
| -------------- | -------- | ---------------------------------------- | ----------- |
| `attempts`     | Yes      | `number`                                 |             |
| `dependsOn`    | Yes      | Array of `string`                        |             |
| `error`        | Yes      | `null,string`                            |             |
| `evidenceIds`  | Yes      | Array of `string`                        |             |
| `expert`       | Yes      | `string`                                 |             |
| `finishedAtMs` | Yes      | `null,string`                            |             |
| `id`           | Yes      | `string`                                 |             |
| `objective`    | Yes      | `string`                                 |             |
| `report`       | Yes      | `null,string`                            |             |
| `requestedBy`  | Yes      | `string`                                 |             |
| `scope`        | Yes      | `string`                                 |             |
| `startedAtMs`  | Yes      | `null,string`                            |             |
| `state`        | Yes      | [ReverseState](protocol.md#reversestate) |             |

## ReverseRunSnapshot

Bounded, capability-free projection carried by live tool events and the final receipt.

| Field                      | Required | Type                                                                                   | Description                                                                                     |
| -------------------------- | -------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `application`              | No       | [ReverseApplicationSnapshot](protocol.md#reverseapplicationsnapshot)                   | Bounded projection for live Chat events; complete indexes are paged by the native query tool.   |
| `archive`                  | No       | [ReverseArchiveRef](protocol.md#reversearchiveref)                                     | A session-owned archive, without query tokens or analyzer handles.                              |
| `browser`                  | No       | [ReverseBrowserSnapshot](protocol.md#reversebrowsersnapshot)                           | A live run carries capture metadata and an event count, never all event rows.                   |
| `browserComparison`        | No       | [BrowserScreenshotComparisonSnapshot](protocol.md#browserscreenshotcomparisonsnapshot) | Body-free progress also identifies the archived comparison report.                              |
| `browserInput`             | No       | [BrowserAnalysisInput](protocol.md#browseranalysisinput)                               | Body-free provenance links a derived shared analysis to the exact original browser capture.     |
| `browserScreenshot`        | No       | [BrowserScreenshotSnapshot](protocol.md#browserscreenshotsnapshot)                     | Progress retains an owner-bound archive identity without any image data.                        |
| `browserSources`           | No       | [BrowserSourcesSnapshot](protocol.md#browsersourcessnapshot)                           | A native source capture references one immutable owner-scoped archive.                          |
| `browserStorage`           | No       | [BrowserStorageSnapshot](protocol.md#browserstoragesnapshot)                           | Progress identifies a saved redacted capture without embedding its rows.                        |
| `browserStorageComparison` | No       | [BrowserStorageComparisonSnapshot](protocol.md#browserstoragecomparisonsnapshot)       | Archived progress binds the report itself independently of its two source captures.             |
| `browserStructure`         | No       | [BrowserStructureSnapshot](protocol.md#browserstructuresnapshot)                       | A progress receipt references structure without carrying complete trees.                        |
| `browserWebMcp`            | No       | [BrowserWebMcpSnapshot](protocol.md#browserwebmcpsnapshot)                             | Progress binds metadata to the original report without tool/schema arrays.                      |
| `cleanupErrors`            | Yes      | Array of `string`                                                                      |                                                                                                 |
| `evidence`                 | Yes      | Array of [ReverseEvidenceRecord](protocol.md#reverseevidencerecord)                    |                                                                                                 |
| `evidenceCount`            | Yes      | `number`                                                                               |                                                                                                 |
| `execution`                | No       | `number`                                                                               | Explicit resumed execution epoch; absent means the original execution.                          |
| `id`                       | Yes      | `string`                                                                               |                                                                                                 |
| `inputName`                | Yes      | `string`                                                                               |                                                                                                 |
| `kind`                     | No       | `"browser"` / `"javascript"` / `"native"` / `"network"` / `"source"`                   | The runtime selects a target adapter; callers may make the choice explicit for ambiguous files. |
| `network`                  | No       | [ReverseNetworkSnapshot](protocol.md#reversenetworksnapshot)                           | Bounded capability-free projection; full entries and payloads require paged evidence queries.   |
| `plan`                     | No       | Array of [ReversePlanStep](protocol.md#reverseplanstep)                                |                                                                                                 |
| `question`                 | Yes      | `string`                                                                               |                                                                                                 |
| `revision`                 | Yes      | `string`                                                                               |                                                                                                 |
| `sha256`                   | Yes      | `string`                                                                               |                                                                                                 |
| `state`                    | Yes      | [ReverseState](protocol.md#reversestate)                                               |                                                                                                 |
| `tasks`                    | Yes      | Array of [ReverseTaskSnapshot](protocol.md#reversetasksnapshot)                        |                                                                                                 |
| `version`                  | Yes      | `1`                                                                                    |                                                                                                 |

## ReverseState

Runtime task lifecycle, distinct from the truth of model-authored findings.

Type: `"cancelled"` / `"done"` / `"failed"` / `"partial"` / `"pending"` / `"running"`.

## ReverseTaskSnapshot

A runtime-owned step in the shared investigation plan. Reports remain unverified findings.

| Field          | Required | Type                                     | Description |
| -------------- | -------- | ---------------------------------------- | ----------- |
| `attempts`     | Yes      | `number`                                 |             |
| `dependsOn`    | Yes      | Array of `string`                        |             |
| `error`        | Yes      | `null,string`                            |             |
| `expert`       | Yes      | `string`                                 |             |
| `finishedAtMs` | Yes      | `null,string`                            |             |
| `report`       | Yes      | `null,string`                            |             |
| `startedAtMs`  | Yes      | `null,string`                            |             |
| `state`        | Yes      | [ReverseState](protocol.md#reversestate) |             |

## RiskLevel

How dangerous an action is.

Type: `"destructive"` / `"execute"` / `"read"` / `"write"`.

## RobloxCredentialSetParams

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `apiKey` | Yes      | `string` |             |

## RobloxCredentialStatus

Presence only: neither saved key material nor claims about Roblox permissions.

| Field       | Required | Type      | Description |
| ----------- | -------- | --------- | ----------- |
| `connected` | Yes      | `boolean` |             |
| `validated` | Yes      | `false`   |             |

## ScalarSchema

Primitive or named envelope type. Number values must be finite and safely represented.

| Field       | Required | Type                               | Description |
| ----------- | -------- | ---------------------------------- | ----------- |
| `choices`   | No       | Array of `string`                  |             |
| `kind`      | Yes      | [Exclude_1](protocol.md#exclude_1) |             |
| `maxLength` | No       | `number`                           |             |
| `maximum`   | No       | `number`                           |             |
| `minLength` | No       | `number`                           |             |
| `minimum`   | No       | `number`                           |             |
| `nullable`  | Yes      | `boolean`                          |             |
| `whole`     | No       | `boolean`                          |             |

## SchemaField

Named nested field contracts keep missing, null and empty values distinct.

| Field      | Required | Type                                   | Description |
| ---------- | -------- | -------------------------------------- | ----------- |
| `name`     | Yes      | `string`                               |             |
| `required` | Yes      | `boolean`                              |             |
| `schema`   | Yes      | [ValueSchema](protocol.md#valueschema) |             |

## Scope

What a caller may do.

Type: `"admin"` / `"read"` / `"write"`.

## SegmentationFrame

| Field     | Required | Type              | Description |
| --------- | -------- | ----------------- | ----------- |
| `payload` | Yes      | Array of `number` |             |
| `type`    | Yes      | `number`          |             |

## SessionFileParams

Identifies a saved file within an owned session.

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `attachmentId` | Yes      | `string` |             |
| `id`           | Yes      | `string` |             |

## SessionHistoryData

A small live notification; large records remain in bounded authenticated pages.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `cursor`    | Yes      | `string` |             |
| `endCursor` | Yes      | `string` |             |
| `sessionId` | Yes      | `string` |             |

## SessionHistoryPage

Bounded binary pages can split even a very large individual native event.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `chunk`      | Yes      | `string` |             |
| `endCursor`  | Yes      | `string` |             |
| `format`     | Yes      | `1`      |             |
| `nextCursor` | No       | `string` |             |

## SessionHistoryParams

Byte cursors are decimal strings so large journals retain exact offsets.

| Field       | Required | Type     | Description                                |
| ----------- | -------- | -------- | ------------------------------------------ |
| `cursor`    | No       | `string` |                                            |
| `endCursor` | No       | `string` |                                            |
| `id`        | Yes      | `string` |                                            |
| `pageBytes` | No       | `number` | Optional bounded read window, up to 1 MiB. |

## SessionHistoryRecord

Append-only presentation history, independent of model-context compaction.

Variant 1: [HistoryInput](protocol.md#historyinput)

| Field  | Required | Type                                                 | Description |
| ------ | -------- | ---------------------------------------------------- | ----------- |
| `at`   | Yes      | `number`                                             |             |
| `data` | Yes      | [SessionMessageData](protocol.md#sessionmessagedata) |             |
| `id`   | Yes      | `string`                                             |             |
| `kind` | Yes      | `"input"`                                            |             |

Variant 2: [HistoryEvent](protocol.md#historyevent)

| Field  | Required | Type                                       | Description |
| ------ | -------- | ------------------------------------------ | ----------- |
| `at`   | Yes      | `number`                                   |             |
| `data` | Yes      | [TurnEventData](protocol.md#turneventdata) |             |
| `id`   | Yes      | `string`                                   |             |
| `kind` | Yes      | `"event"`                                  |             |

Variant 3: [HistorySites](protocol.md#historysites)

| Field  | Required | Type                                       | Description |
| ------ | -------- | ------------------------------------------ | ----------- |
| `at`   | Yes      | `number`                                   |             |
| `data` | Yes      | [ToolSitesData](protocol.md#toolsitesdata) |             |
| `id`   | Yes      | `string`                                   |             |
| `kind` | Yes      | `"sites"`                                  |             |

Variant 4: [HistoryEnd](protocol.md#historyend)

| Field  | Required | Type                                   | Description |
| ------ | -------- | -------------------------------------- | ----------- |
| `at`   | Yes      | `number`                               |             |
| `data` | Yes      | [TurnEndData](protocol.md#turnenddata) |             |
| `id`   | Yes      | `string`                               |             |
| `kind` | Yes      | `"end"`                                |             |

Variant 5: [HistoryApprovalRequested](protocol.md#historyapprovalrequested)

| Field      | Required | Type                                                       | Description                                                       |
| ---------- | -------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| `at`       | Yes      | `number`                                                   |                                                                   |
| `data`     | Yes      | [ApprovalRequestedData](protocol.md#approvalrequesteddata) |                                                                   |
| `id`       | Yes      | `string`                                                   |                                                                   |
| `kind`     | Yes      | `"approval-requested"`                                     |                                                                   |
| `runId`    | Yes      | `null,string`                                              |                                                                   |
| `streamId` | No       | `string`                                                   | Owning stream, retained when multiple turns share a conversation. |

Variant 6: [HistoryApprovalResolved](protocol.md#historyapprovalresolved)

| Field  | Required | Type                                                     | Description |
| ------ | -------- | -------------------------------------------------------- | ----------- |
| `at`   | Yes      | `number`                                                 |             |
| `data` | Yes      | [ApprovalResolvedData](protocol.md#approvalresolveddata) |             |
| `id`   | Yes      | `string`                                                 |             |
| `kind` | Yes      | `"approval-resolved"`                                    |             |

## SessionListParams

A filter over sessions.

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `agentId` | No       | `string` |             |
| `limit`   | No       | `number` |             |
| `userId`  | No       | `string` |             |

## SessionMessageData

The payload of a {@link GATEWAY_EVENTS.SessionMessage} event.

| Field         | Required | Type                                                        | Description                                                                      |
| ------------- | -------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `at`          | Yes      | `number`                                                    |                                                                                  |
| `attachments` | No       | Array of [InboundAttachment](protocol.md#inboundattachment) | Attachments sent with this message, preserved for session viewers.               |
| `principalId` | Yes      | `string`                                                    | Who sent it, so a shared-agent transcript can attribute the turn to a person.    |
| `role`        | Yes      | `"assistant"` / `"user"`                                    |                                                                                  |
| `sessionId`   | Yes      | `string`                                                    |                                                                                  |
| `streamId`    | No       | `string`                                                    | The run this message started, so a viewer can join the stream already in flight. |
| `text`        | Yes      | `string`                                                    |                                                                                  |

## SessionRef

Names one session, for the subscription methods.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `sessionId` | Yes      | `string` |             |

## ShareCreateParams

| Field         | Required | Type     | Description |
| ------------- | -------- | -------- | ----------- |
| `description` | No       | `string` |             |
| `id`          | No       | `string` |             |
| `name`        | Yes      | `string` |             |
| `path`        | No       | `string` |             |

## ShareMemberParams

Adds, re-modes or removes one subject. A `mode` of null removes.

| Field     | Required | Type          | Description |
| --------- | -------- | ------------- | ----------- |
| `id`      | Yes      | `string`      |             |
| `mode`    | Yes      | `null,string` |             |
| `shareId` | Yes      | `string`      |             |
| `subject` | Yes      | `string`      |             |

## ShareSummary

A shared folder, as the UI lists it.

| Field         | Required | Type                           | Description |
| ------------- | -------- | ------------------------------ | ----------- |
| `createdAt`   | Yes      | `number`                       |             |
| `description` | No       | `string`                       |             |
| `id`          | Yes      | `string`                       |             |
| `members`     | Yes      | Array of Object (fields below) |             |
| `name`        | Yes      | `string`                       |             |
| `path`        | Yes      | `string`                       |             |

**members**

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `id`      | Yes      | `string` |             |
| `mode`    | Yes      | `string` |             |
| `subject` | Yes      | `string` |             |

## SitePreview

Only server-fetched raster bytes cross the gateway; clients never fetch the visited host.

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `favicon` | Yes      | `string` |             |
| `origin`  | Yes      | `string` |             |

## SourceLanguage

Source grammars are explicit; bytecode formats use separate version-aware adapters.

Type: `"c"` / `"cpp"` / `"javascript"` / `"lua"` / `"luau"`.

## SteerParams

A correction for the server-minted active run, not a follow-up turn.

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `message` | Yes      | `string` |             |
| `runId`   | Yes      | `string` |             |

## StreamAccepted

The acknowledgement of a streaming run.

| Field        | Required | Type     | Description                                                               |
| ------------ | -------- | -------- | ------------------------------------------------------------------------- |
| `inputId`    | No       | `string` | Original saved input identity, assigned by the authorized gateway.        |
| `runId`      | Yes      | `string` | The SERVER's name for the run, which is the one `tasks.*` uses.           |
| `sessionKey` | No       | `string` | Resolved durable conversation identity, including a newly allocated chat. |
| `streamId`   | Yes      | `string` |                                                                           |

## StreamParams

What one turn is asked for, when the client wants its events streamed.

| Field               | Required | Type                                                                          | Description                                                                 |
| ------------------- | -------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `agentId`           | No       | `string`                                                                      |                                                                             |
| `attachments`       | No       | Array of [InboundAttachment](protocol.md#inboundattachment)                   | User-authored image, video, document, and text blocks, in display order.    |
| `conversationId`    | No       | `string`                                                                      | Continues an existing conversation.                                         |
| `cwd`               | No       | `string`                                                                      | Where tools operate.                                                        |
| `message`           | Yes      | `string`                                                                      | User text; may be blank when at least one attachment contains content.      |
| `reasoningEffort`   | No       | `"high"` / `"low"` / `"max"` / `"medium"` / `"minimal"` / `"off"` / `"xhigh"` | Per-turn reasoning preference; never changes the saved agent configuration. |
| `streamId`          | No       | `string`                                                                      | The stream's id, chosen by the CLIENT.                                      |
| `targetTimeSeconds` | No       | `integer`                                                                     | Soft task time target in seconds; never a cancellation deadline.            |
| `userId`            | No       | `string`                                                                      | The principal the turn is billed and authorized as.                         |

## TaskRecord

One streaming run, as an operator or a second client sees it.

| Field          | Required | Type          | Description                                                                       |
| -------------- | -------- | ------------- | --------------------------------------------------------------------------------- |
| `agentId`      | Yes      | `null,string` |                                                                                   |
| `cancelling`   | Yes      | `boolean`     |                                                                                   |
| `connectionId` | Yes      | `string`      | The connection that started it. Two clients of one principal are distinguishable. |
| `principalId`  | Yes      | `string`      |                                                                                   |
| `runId`        | Yes      | `string`      | The id `tasks.cancel` takes, and the reason this is not `streamId`.               |
| `sessionId`    | Yes      | `null,string` |                                                                                   |
| `startedAt`    | Yes      | `number`      |                                                                                   |
| `streamId`     | Yes      | `string`      |                                                                                   |

## TeamCreateParams

| Field         | Required | Type     | Description |
| ------------- | -------- | -------- | ----------- |
| `description` | No       | `string` |             |
| `id`          | No       | `string` |             |
| `name`        | Yes      | `string` |             |

## TeamMemberParams

Adds or removes one principal. `member: false` removes.

| Field         | Required | Type      | Description |
| ------------- | -------- | --------- | ----------- |
| `member`      | Yes      | `boolean` |             |
| `principalId` | Yes      | `string`  |             |
| `teamId`      | Yes      | `string`  |             |

## TeamSummary

A team, as the UI lists it.

| Field         | Required | Type              | Description |
| ------------- | -------- | ----------------- | ----------- |
| `createdAt`   | Yes      | `number`          |             |
| `description` | No       | `string`          |             |
| `id`          | Yes      | `string`          |             |
| `members`     | Yes      | Array of `string` |             |
| `name`        | Yes      | `string`          |             |

## TelemetryFunnelParams

Wire queries never carry an owner: the authenticated gateway supplies it.

| Field                     | Required | Type              | Description |
| ------------------------- | -------- | ----------------- | ----------- |
| `appliedConfigKey`        | No       | `string`          |             |
| `completionWindowMs`      | Yes      | `string`          |             |
| `configLookbackMs`        | No       | `string`          |             |
| `fromMs`                  | Yes      | `string`          |             |
| `performanceFpsThreshold` | No       | `number`          |             |
| `performanceLookbackMs`   | No       | `string`          |             |
| `projectId`               | Yes      | `string`          |             |
| `steps`                   | Yes      | Array of `string` |             |
| `toMs`                    | Yes      | `string`          |             |

## TelemetryHealth

Owner-visible collection evidence, not a guarantee that the game emitted every required event.

| Field                     | Required | Type              | Description |
| ------------------------- | -------- | ----------------- | ----------- |
| `caveats`                 | Yes      | Array of `string` |             |
| `ingestionEnabled`        | Yes      | `boolean`         |             |
| `lastCapacityRejectionMs` | Yes      | `null,string`     |             |
| `lastSuccessfulBatchMs`   | Yes      | `null,string`     |             |
| `latestEventMs`           | Yes      | `null,string`     |             |
| `maxEvents`               | Yes      | `number`          |             |
| `maxPayloadBytes`         | Yes      | `string`          |             |
| `projectId`               | Yes      | `string`          |             |
| `retainedFromMs`          | Yes      | `string`          |             |
| `retentionDays`           | Yes      | `number`          |             |
| `storedEvents`            | Yes      | `number`          |             |
| `storedPayloadBytes`      | Yes      | `string`          |             |

## TelemetryMonitorAction

Scheduler stores the rule; identity is only in Job.owner, never supplied by this action.

| Field         | Required | Type                                                                             | Description                                                                     |
| ------------- | -------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `destination` | No       | [TelemetryNotificationDestination](protocol.md#telemetrynotificationdestination) | Host-captured private channel destination; never accepted from model arguments. |
| `investigate` | No       | `boolean`                                                                        |                                                                                 |
| `kind`        | Yes      | `"roblox-monitor"`                                                               |                                                                                 |
| `rule`        | Yes      | [TelemetryMonitorRule](protocol.md#telemetrymonitorrule)                         |                                                                                 |

## TelemetryMonitorRule

A deterministic observed-conversion threshold, not an automatic causal experiment decision.

| Field                     | Required | Type              | Description |
| ------------------------- | -------- | ----------------- | ----------- |
| `appliedConfigKey`        | No       | `string`          |             |
| `completionWindowMs`      | Yes      | `number`          |             |
| `configLookbackMs`        | No       | `string`          |             |
| `conversionBelow`         | Yes      | `number`          |             |
| `cooldownMs`              | Yes      | `number`          |             |
| `lookbackMs`              | Yes      | `number`          |             |
| `minimumAttempts`         | Yes      | `number`          |             |
| `minimumSessions`         | Yes      | `number`          |             |
| `performanceFpsThreshold` | No       | `number`          |             |
| `performanceLookbackMs`   | No       | `string`          |             |
| `projectId`               | Yes      | `string`          |             |
| `settleDelayMs`           | Yes      | `number`          |             |
| `steps`                   | Yes      | Array of `string` |             |

## TelemetryNotificationDestination

Host-captured private channel destination; never accepted from model arguments.

| Field            | Required | Type     | Description |
| ---------------- | -------- | -------- | ----------- |
| `channelId`      | Yes      | `string` |             |
| `conversationId` | Yes      | `string` |             |
| `threadId`       | No       | `string` |             |

## TelemetryPerformanceParams

Complete bounded client performance query for one owned project.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `fromMs`    | Yes      | `string` |             |
| `projectId` | Yes      | `string` |             |
| `toMs`      | Yes      | `string` |             |

## TelemetryProject

Project identity returned to authenticated owners; contains no ingestion secret.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `id`         | Yes      | `string` |             |
| `name`       | Yes      | `string` |             |
| `universeId` | Yes      | `string` |             |
| `userId`     | Yes      | `string` |             |

## TerminalAction

Type: `"input"` / `"resize"` / `"stop"`.

## TerminalStatus

Type: `"exited"` / `"interrupted"` / `"running"` / `"starting"`.

## TokenUsage

Token accounting for a turn.

| Field                  | Required | Type     | Description                                                                               |
| ---------------------- | -------- | -------- | ----------------------------------------------------------------------------------------- |
| `cacheWriteLongTokens` | No       | `number` | Cache writes billed at a longer time-to-live, where the provider prices two tiers.        |
| `cacheWriteTokens`     | No       | `number` | Input tokens written INTO the cache by this request, where the provider bills them apart. |
| `cachedInputTokens`    | No       | `number` | Input tokens served from a prompt cache (already counted in `inputTokens`).               |
| `contextTokens`        | No       | `number` | How much of the model's context window the conversation currently OCCUPIES.               |
| `inputTokens`          | Yes      | `number` |                                                                                           |
| `outputTokens`         | Yes      | `number` |                                                                                           |
| `reasoningTokens`      | No       | `number` | Reasoning tokens (already counted in `outputTokens` for most providers).                  |

## ToolCall

A tool call the model asked for.

| Field   | Required | Type                               | Description |
| ------- | -------- | ---------------------------------- | ----------- |
| `id`    | Yes      | `string`                           |             |
| `input` | Yes      | [JsonValue](protocol.md#jsonvalue) |             |
| `name`  | Yes      | `string`                           |             |

## ToolOutcome

One tool call's outcome, paired back to its call.

| Field        | Required | Type                                 | Description |
| ------------ | -------- | ------------------------------------ | ----------- |
| `call`       | Yes      | [ToolCall](protocol.md#toolcall)     |             |
| `durationMs` | Yes      | `number`                             |             |
| `result`     | Yes      | [ToolResult](protocol.md#toolresult) |             |

## ToolProgress

| Field        | Required | Type                                                         | Description                                                                         |
| ------------ | -------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `attachment` | No       | [ToolProgressAttachment](protocol.md#toolprogressattachment) | Transient visual progress for the active chat; never persisted in the transcript.   |
| `fraction`   | No       | `number`                                                     | Completed fraction in `[0, 1]`, when the tool can know it.                          |
| `reverse`    | No       | [ReverseRunSnapshot](protocol.md#reverserunsnapshot)         | Shared investigation plan and evidence provenance, without live query capabilities. |
| `status`     | No       | `string`                                                     | A one-line status, e.g. `running tests…`.                                           |
| `terminal`   | No       | [ToolTerminal](protocol.md#toolterminal)                     | Live pseudoterminal identity for authenticated input and resize controls.           |
| `text`       | No       | `string`                                                     | Text appended to the live view.                                                     |

## ToolProgressAttachment

A partial update from a running tool.

| Field         | Required | Type                           | Description |
| ------------- | -------- | ------------------------------ | ----------- |
| `data`        | Yes      | Array of `number` / Dictionary |             |
| `description` | No       | `string`                       |             |
| `filename`    | Yes      | `string`                       |             |
| `mimeType`    | Yes      | `string`                       |             |

## ToolQuestion

A question that may be rendered interactively by a conversation surface.

| Field     | Required | Type                                                          | Description |
| --------- | -------- | ------------------------------------------------------------- | ----------- |
| `choices` | No       | Array of [ToolQuestionChoice](protocol.md#toolquestionchoice) |             |
| `text`    | Yes      | `string`                                                      |             |

## ToolQuestionChoice

One finite answer offered by a tool-originated question.

| Field         | Required | Type     | Description                                                  |
| ------------- | -------- | -------- | ------------------------------------------------------------ |
| `description` | No       | `string` | Optional detail used by menu-capable surfaces.               |
| `label`       | Yes      | `string` |                                                              |
| `value`       | No       | `string` | The inbound text produced by a press. Defaults to the label. |

## ToolResult

What a tool returns.

| Field                  | Required | Type                                                                                    | Description                                                                                  |
| ---------------------- | -------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `chatGraph`            | No       | [ChatGraph](protocol.md#chatgraph)                                                      | Validated graph presentation, independent of bounded model-visible result text.              |
| `commandExecution`     | No       | [CommandExecutionReceipt](protocol.md#commandexecutionreceipt)                          | Only the execution adapter supplies this evidence; stdout cannot forge it.                   |
| `content`              | Yes      | Array of [ContentBlock](protocol.md#contentblock) / `string`                            | What the model sees. A string for the ordinary case; blocks when the result carries an image |
| `continuation`         | No       | `string`                                                                                | The exact call that would show the next page of this result, written by the tool.            |
| `deliveredMedia`       | No       | `boolean`                                                                               | Host receipt: true only after the attachment channel send resolves.                          |
| `deliveredText`        | No       | `string`                                                                                | Text this tool already delivered to the user outside the agent's eventual reply.             |
| `deliveryReceipt`      | No       | [DeliveryReceipt](protocol.md#deliveryreceipt)                                          | Exact submitted artifact and acknowledged destination, produced by the delivery adapter.     |
| `deliveryReceipts`     | No       | Array of [DeliveryReceipt](protocol.md#deliveryreceipt)                                 | One authoritative receipt per file in a multi-attachment delivery.                           |
| `display`              | No       | Array of [JsonValue](protocol.md#jsonvalue) / Dictionary / `null,string,number,boolean` | Structured data for a UI that renders this tool specially (a diff view, a file tree).        |
| `inspectedMediaSha256` | No       | Array of `string`                                                                       | Original image digests successfully inspected by a vision route.                             |
| `label`                | No       | `string`                                                                                | A short human label for a UI, e.g. `read 412 lines from src/main.ts`.                        |
| `processMissing`       | No       | `boolean`                                                                               | The native process table confirmed the requested handle is absent for this session.          |
| `protocolPayload`      | No       | `boolean`                                                                               | Preserve the string byte-for-byte instead of applying the registry's display-oriented        |
| `question`             | No       | [ToolQuestion](protocol.md#toolquestion)                                                | A question handed back to the conversation surface for native delivery.                      |
| `reverse`              | No       | [ReverseRunSnapshot](protocol.md#reverserunsnapshot)                                    | Runtime-authored investigation receipt, retained in presentation history.                    |
| `source`               | No       | `"external-model"` / `"local"` / `"model"` / `"network"`                                | Where the content came from, for taint tracking.                                             |
| `status`               | Yes      | [ToolStatus](protocol.md#toolstatus)                                                    |                                                                                              |
| `terminate`            | No       | `boolean`                                                                               | Whether this result should END the turn rather than feed back into the model.                |
| `truncation`           | No       | [TruncationRecord](protocol.md#truncationrecord)                                        | What the registry's backstop removed, when it removed anything.                              |
| `verifiedCodePaths`    | No       | Array of `string`                                                                       | Absolute source paths accepted by a native engineering workflow, never model-supplied.       |

## ToolSitesData

Asynchronous tool decoration; may arrive after turn.end and never blocks it.

| Field       | Required | Type                                            | Description                                                                      |
| ----------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `callId`    | Yes      | `string`                                        |                                                                                  |
| `historyAt` | No       | `number`                                        | Original event time, retained across checkpoint and replay.                      |
| `historyId` | No       | `string`                                        | Stable record identity shared by the immediate event and its later durable copy. |
| `sessionId` | No       | `string`                                        |                                                                                  |
| `sites`     | Yes      | Array of [SitePreview](protocol.md#sitepreview) |                                                                                  |
| `streamId`  | Yes      | `string`                                        |                                                                                  |

## ToolStatus

What a tool did, from the agent's point of view.

Type: `"aborted"` / `"denied"` / `"error"` / `"ok"`.

## ToolTerminal

A terminal belongs to the session that launched this exact process.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `cols`      | Yes      | `number` |             |
| `processId` | Yes      | `string` |             |
| `rows`      | Yes      | `number` |             |
| `sessionId` | Yes      | `string` |             |

## TruncationRecord

What a truncation did, in numbers the marker quotes and a UI can render.

| Field             | Required | Type                                                 | Description                                                                               |
| ----------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `continuation`    | No       | `string`                                             | The exact call the model should make to see more, pre-rendered by the ORIGINATING tool.   |
| `lastLinePartial` | Yes      | `boolean`                                            | Whether a cut fell mid-line, so one of the shown lines is a fragment.                     |
| `shownChars`      | Yes      | `number`                                             | Characters of the ORIGINAL text that survive, excluding anything this module synthesized. |
| `shownLines`      | Yes      | `number`                                             |                                                                                           |
| `spillPath`       | No       | `string`                                             | Where the complete content was written, when a spill store wrote it.                      |
| `strategy`        | Yes      | [TruncationStrategy](protocol.md#truncationstrategy) |                                                                                           |
| `totalChars`      | Yes      | `number`                                             |                                                                                           |
| `totalLines`      | Yes      | `number`                                             |                                                                                           |

## TruncationStrategy

How the content is reduced. Declared by the tool, which knows what it produced.

Type: `"head"` / `"head-tail"` / `"hunk-head"` / `"summary-head"` / `"tail"`.

## TurnEndData

The payload of a {@link GATEWAY_EVENTS.TurnEnd} event.

| Field       | Required | Type                               | Description                                                                      |
| ----------- | -------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| `error`     | No       | [WireError](protocol.md#wireerror) | An error, in the shape a client can act on without parsing prose.                |
| `historyAt` | No       | `number`                           | Original event time, retained across checkpoint and replay.                      |
| `historyId` | No       | `string`                           | Stable record identity shared by the immediate event and its later durable copy. |
| `ok`        | Yes      | `boolean`                          |                                                                                  |
| `result`    | No       | [AskResult](protocol.md#askresult) | What a finished turn produced.                                                   |
| `sessionId` | No       | `string`                           |                                                                                  |
| `streamId`  | Yes      | `string`                           |                                                                                  |

## TurnEventData

| Field       | Required | Type                                       | Description                                                                      |
| ----------- | -------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| `event`     | Yes      | [WireTurnEvent](protocol.md#wireturnevent) |                                                                                  |
| `historyAt` | No       | `number`                                   | Original event time, retained across checkpoint and replay.                      |
| `historyId` | No       | `string`                                   | Stable record identity shared by the immediate event and its later durable copy. |
| `sessionId` | No       | `string`                                   |                                                                                  |
| `streamId`  | Yes      | `string`                                   |                                                                                  |

## ValueSchema

Declarative portable schema subset. No callbacks, JavaScript evaluation, or credentials.

Variant 1: [ScalarSchema](protocol.md#scalarschema)

| Field       | Required | Type                               | Description |
| ----------- | -------- | ---------------------------------- | ----------- |
| `choices`   | No       | Array of `string`                  |             |
| `kind`      | Yes      | [Exclude_1](protocol.md#exclude_1) |             |
| `maxLength` | No       | `number`                           |             |
| `maximum`   | No       | `number`                           |             |
| `minLength` | No       | `number`                           |             |
| `minimum`   | No       | `number`                           |             |
| `nullable`  | Yes      | `boolean`                          |             |
| `whole`     | No       | `boolean`                          |             |

Variant 2: [ObjectSchema](protocol.md#objectschema)

| Field        | Required | Type                                            | Description |
| ------------ | -------- | ----------------------------------------------- | ----------- |
| `additional` | Yes      | `boolean`                                       |             |
| `fields`     | Yes      | Array of [SchemaField](protocol.md#schemafield) |             |
| `kind`       | Yes      | `"object"`                                      |             |
| `nullable`   | Yes      | `boolean`                                       |             |

Variant 3: [ListSchema](protocol.md#listschema)

| Field      | Required | Type                                   | Description |
| ---------- | -------- | -------------------------------------- | ----------- |
| `item`     | Yes      | [ValueSchema](protocol.md#valueschema) |             |
| `kind`     | Yes      | `"list"`                               |             |
| `maxItems` | Yes      | `number`                               |             |
| `minItems` | Yes      | `number`                               |             |
| `nullable` | Yes      | `boolean`                              |             |

Variant 4: [ResourceSchema](protocol.md#resourceschema)

| Field      | Required | Type         | Description |
| ---------- | -------- | ------------ | ----------- |
| `kind`     | Yes      | `"resource"` |             |
| `nullable` | Yes      | `boolean`    |             |
| `role`     | Yes      | `string`     |             |

## VoiceAudioParams

| Field    | Required | Type     | Description                                        |
| -------- | -------- | -------- | -------------------------------------------------- |
| `callId` | Yes      | `string` |                                                    |
| `pcm`    | Yes      | `string` | Base64 PCM16, mono, at the rate the call reported. |

## VoiceCallEvent

Variant 1: [VoiceInterimEvent](protocol.md#voiceinterimevent)

| Field  | Required | Type        | Description |
| ------ | -------- | ----------- | ----------- |
| `kind` | Yes      | `"interim"` |             |
| `text` | Yes      | `string`    |             |

Variant 2: Object (fields below)

| Field  | Required | Type      | Description |
| ------ | -------- | --------- | ----------- |
| `kind` | Yes      | `"heard"` |             |
| `text` | Yes      | `string`  |             |

Variant 3: Object (fields below)

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `kind` | Yes      | `"said"` |             |
| `text` | Yes      | `string` |             |

Variant 4: Object (fields below)

| Field  | Required | Type       | Description |
| ------ | -------- | ---------- | ----------- |
| `kind` | Yes      | `"status"` |             |
| `text` | Yes      | `string`   |             |

Variant 5: Object (fields below)

| Field     | Required | Type      | Description |
| --------- | -------- | --------- | ----------- |
| `kind`    | Yes      | `"error"` |             |
| `message` | Yes      | `string`  |             |

## VoiceInterimEvent

Replaceable ASR hypothesis for the current utterance.

| Field  | Required | Type        | Description |
| ------ | -------- | ----------- | ----------- |
| `kind` | Yes      | `"interim"` |             |
| `text` | Yes      | `string`    |             |

## VoiceStartParams

Opens a spoken call. The conversation is the agent's, so a call can continue a typed thread.

| Field            | Required | Type     | Description |
| ---------------- | -------- | -------- | ----------- |
| `conversationId` | No       | `string` |             |

## VoiceStarted

| Field        | Required | Type     | Description                                                                         |
| ------------ | -------- | -------- | ----------------------------------------------------------------------------------- |
| `callId`     | Yes      | `string` |                                                                                     |
| `frameBytes` | Yes      | `number` | One frame, in bytes. A client that sends a different size adds latency for nothing. |
| `sampleRate` | Yes      | `number` | The rate to capture at and to play back at. Resampling anywhere else is a defect.   |

## VoiceStopParams

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `callId` | Yes      | `string` |             |

## WalletHistoryEntry

A durable payment or settled request, without exposing provider payment identifiers.

| Field        | Required | Type                     | Description |
| ------------ | -------- | ------------------------ | ----------- |
| `amount`     | Yes      | `string`                 |             |
| `kind`       | Yes      | `"purchase"` / `"usage"` |             |
| `paid`       | Yes      | `string`                 |             |
| `plan`       | Yes      | `string`                 |             |
| `recordedAt` | Yes      | `number`                 |             |
| `sequence`   | Yes      | `string`                 |             |

## WalletHistoryPage

Cursor pagination remains stable when new transactions arrive.

| Field     | Required | Type                                                          | Description |
| --------- | -------- | ------------------------------------------------------------- | ----------- |
| `entries` | Yes      | Array of [WalletHistoryEntry](protocol.md#wallethistoryentry) |             |
| `next`    | Yes      | `null,string`                                                 |             |
| `userId`  | Yes      | `string`                                                      |             |

## WalletSnapshot

Exact USD microcent balances encoded as decimal strings for JSON clients.

| Field              | Required | Type     | Description |
| ------------------ | -------- | -------- | ----------- |
| `asOf`             | Yes      | `number` |             |
| `credits`          | Yes      | `string` |             |
| `creditsAvailable` | Yes      | `string` |             |
| `creditsHeld`      | Yes      | `string` |             |
| `resetsAt`         | Yes      | `number` |             |
| `userId`           | Yes      | `string` |             |
| `weeklyAvailable`  | Yes      | `string` |             |
| `weeklyHeld`       | Yes      | `string` |             |
| `weeklyLimit`      | Yes      | `string` |             |
| `weeklyUsed`       | Yes      | `string` |             |

## WireError

An error, in the shape a client can act on without parsing prose.

| Field          | Required | Type                                                   | Description                                                 |
| -------------- | -------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| `code`         | Yes      | [ErrorCode](protocol.md#errorcode)                     |                                                             |
| `details`      | No       | [Recordstringunknown](protocol.md#recordstringunknown) |                                                             |
| `message`      | Yes      | `string`                                               |                                                             |
| `retryAfterMs` | No       | `number`                                               |                                                             |
| `retryable`    | Yes      | `boolean`                                              | Whether repeating the SAME request could plausibly succeed. |

## WireTurnEvent

A turn event as it travels.

Variant 1: Object (fields below)

| Field     | Required | Type                                              | Description |
| --------- | -------- | ------------------------------------------------- | ----------- |
| `type`    | Yes      | `"agents-status"`                                 |             |
| `workers` | Yes      | Array of [WorkerStatus](protocol.md#workerstatus) |             |

Variant 2: Object (fields below)

| Field        | Required | Type                                                   | Description |
| ------------ | -------- | ------------------------------------------------------ | ----------- |
| `attachment` | Yes      | [DeliveredAttachment](protocol.md#deliveredattachment) |             |
| `type`       | Yes      | `"attachment"`                                         |             |

Variant 3: Object (fields below)

| Field    | Required | Type           | Description |
| -------- | -------- | -------------- | ----------- |
| `turnId` | Yes      | `string`       |             |
| `type`   | Yes      | `"turn-start"` |             |

Variant 4: Object (fields below)

| Field       | Required | Type                | Description |
| ----------- | -------- | ------------------- | ----------- |
| `iteration` | Yes      | `number`            |             |
| `type`      | Yes      | `"iteration-start"` |             |

Variant 5: Object (fields below)

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `text` | Yes      | `string` |             |
| `type` | Yes      | `"text"` |             |

Variant 6: Object (fields below)

| Field  | Required | Type          | Description |
| ------ | -------- | ------------- | ----------- |
| `text` | Yes      | `string`      |             |
| `type` | Yes      | `"reasoning"` |             |

Variant 7: Object (fields below)

| Field  | Required | Type                             | Description |
| ------ | -------- | -------------------------------- | ----------- |
| `call` | Yes      | [ToolCall](protocol.md#toolcall) |             |
| `type` | Yes      | `"tool-start"`                   |             |

Variant 8: Object (fields below)

| Field    | Required | Type                                     | Description |
| -------- | -------- | ---------------------------------------- | ----------- |
| `call`   | Yes      | [ToolCall](protocol.md#toolcall)         |             |
| `type`   | Yes      | `"tool-progress"`                        |             |
| `update` | Yes      | [ToolProgress](protocol.md#toolprogress) |             |

Variant 9: Object (fields below)

| Field     | Required | Type                                   | Description |
| --------- | -------- | -------------------------------------- | ----------- |
| `outcome` | Yes      | [ToolOutcome](protocol.md#tooloutcome) |             |
| `type`    | Yes      | `"tool-finish"`                        |             |

Variant 10: Object (fields below)

| Field     | Required | Type                  | Description |
| --------- | -------- | --------------------- | ----------- |
| `summary` | Yes      | `string`              |             |
| `tool`    | Yes      | `string`              |             |
| `type`    | Yes      | `"approval-required"` |             |

Variant 11: Object (fields below)

| Field             | Required | Type          | Description |
| ----------------- | -------- | ------------- | ----------- |
| `droppedMessages` | Yes      | `number`      |             |
| `summary`         | Yes      | `string`      |             |
| `type`            | Yes      | `"compacted"` |             |

Variant 12: Object (fields below)

| Field   | Required | Type                                 | Description |
| ------- | -------- | ------------------------------------ | ----------- |
| `type`  | Yes      | `"usage"`                            |             |
| `usage` | Yes      | [TokenUsage](protocol.md#tokenusage) |             |

Variant 13: Object (fields below)

| Field    | Required | Type                               | Description |
| -------- | -------- | ---------------------------------- | ----------- |
| `data`   | Yes      | [JsonValue](protocol.md#jsonvalue) |             |
| `source` | Yes      | `string`                           |             |
| `type`   | Yes      | `"native"`                         |             |

Variant 14: Object (fields below)

| Field    | Required | Type       | Description |
| -------- | -------- | ---------- | ----------- |
| `detail` | No       | `string`   |             |
| `status` | Yes      | `string`   |             |
| `type`   | Yes      | `"status"` |             |

Variant 15: Object (fields below)

| Field        | Required | Type                                     | Description |
| ------------ | -------- | ---------------------------------------- | ----------- |
| `iterations` | Yes      | `number`                                 |             |
| `reason`     | Yes      | [FinishReason](protocol.md#finishreason) |             |
| `turnId`     | Yes      | `string`                                 |             |
| `type`       | Yes      | `"turn-finish"`                          |             |
| `usage`      | Yes      | [TokenUsage](protocol.md#tokenusage)     |             |

Variant 16: Object (fields below)

| Field       | Required | Type                               | Description |
| ----------- | -------- | ---------------------------------- | ----------- |
| `error`     | Yes      | [WireError](protocol.md#wireerror) |             |
| `retryable` | Yes      | `boolean`                          |             |
| `type`      | Yes      | `"error"`                          |             |

## WorkerState

Lifecycle states for Nexa's delegated workers.

Type: `"aborted"` / `"done"` / `"failed"` / `"queued"` / `"refused"` / `"stopping"` / `"working"`.

## WorkerStatus

One worker, identified independently of its shared persona. Times are decimal epoch milliseconds.

| Field            | Required | Type                                   | Description |
| ---------------- | -------- | -------------------------------------- | ----------- |
| `activity`       | Yes      | `string`                               |             |
| `agentId`        | Yes      | `string`                               |             |
| `depth`          | Yes      | `number`                               |             |
| `goal`           | Yes      | `string`                               |             |
| `id`             | Yes      | `string`                               |             |
| `lastActivityAt` | Yes      | `string`                               |             |
| `parentId`       | Yes      | `string`                               |             |
| `rootId`         | Yes      | `string`                               |             |
| `startedAt`      | Yes      | `string`                               |             |
| `state`          | Yes      | [WorkerState](protocol.md#workerstate) |             |

## WorkflowAgentControlRequest

Compare-and-set controls prevent a stale retry from undoing a newer decision.

| Field              | Required | Type      | Description |
| ------------------ | -------- | --------- | ----------- |
| `controlId`        | Yes      | `string`  |             |
| `expectedRevision` | Yes      | `string`  |             |
| `invocationId`     | Yes      | `string`  |             |
| `nodeId`           | Yes      | `string`  |             |
| `paused`           | Yes      | `boolean` |             |
| `runId`            | Yes      | `string`  |             |

## WorkflowAgentInput

| Field     | Required | Type                                                             | Description |
| --------- | -------- | ---------------------------------------------------------------- | ----------- |
| `inputId` | Yes      | `string`                                                         |             |
| `status`  | Yes      | [WorkflowAgentInputStatus](protocol.md#workflowagentinputstatus) |             |
| `text`    | Yes      | `string`                                                         |             |

## WorkflowAgentInputRequest

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `inputId`      | Yes      | `string` |             |
| `invocationId` | Yes      | `string` |             |
| `nodeId`       | Yes      | `string` |             |
| `runId`        | Yes      | `string` |             |
| `text`         | Yes      | `string` |             |

## WorkflowAgentInputStatus

Type: `"accepted"` / `"queued"` / `"rejected"`.

## WorkflowAgentSession

Bounded live text is a preview; completed graph outputs remain authoritative.

| Field             | Required | Type                                                          | Description |
| ----------------- | -------- | ------------------------------------------------------------- | ----------- |
| `activity`        | Yes      | `string`                                                      |             |
| `controlId`       | Yes      | `string`                                                      |             |
| `controlRevision` | Yes      | `string`                                                      |             |
| `inputs`          | Yes      | Array of [WorkflowAgentInput](protocol.md#workflowagentinput) |             |
| `invocationId`    | Yes      | `string`                                                      |             |
| `model`           | Yes      | `string`                                                      |             |
| `nodeId`          | Yes      | `string`                                                      |             |
| `pauseRequested`  | Yes      | `boolean`                                                     |             |
| `paused`          | Yes      | `boolean`                                                     |             |
| `provider`        | Yes      | `string`                                                      |             |
| `runId`           | Yes      | `string`                                                      |             |
| `status`          | Yes      | [WorkflowStepStatus](protocol.md#workflowstepstatus)          |             |
| `task`            | Yes      | `string`                                                      |             |
| `text`            | Yes      | `string`                                                      |             |

## WorkflowAgentSessionRequest

One exact agent invocation; identities are never retargeted to a newer attempt.

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `invocationId` | Yes      | `string` |             |
| `nodeId`       | Yes      | `string` |             |
| `runId`        | Yes      | `string` |             |

## WorkflowAgentUsageIdentity

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `agentId` | Yes      | `string` |             |
| `nodeId`  | Yes      | `string` |             |

## WorkflowAnswerType

Supported answer shapes for the initial owner question component.

Type: `"boolean"` / `"choice"` / `"text"`.

## WorkflowApplication

Type: `"claude-code"` / `"codex"` / `"grok-build"` / `"mistral-vibe"` / `"nerva-code"`.

## WorkflowApplicationRequest

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `revision`   | Yes      | `string` |             |
| `workflowId` | Yes      | `string` |             |

## WorkflowApplicationSetupRequest

| Field         | Required | Type                                                   | Description |
| ------------- | -------- | ------------------------------------------------------ | ----------- |
| `application` | Yes      | [WorkflowApplication](protocol.md#workflowapplication) |             |
| `revision`    | Yes      | `string`                                               |             |
| `sessionId`   | Yes      | `string`                                               |             |
| `workflowId`  | Yes      | `string`                                               |             |

## WorkflowApplicationStatus

| Field         | Required | Type                                                       | Description |
| ------------- | -------- | ---------------------------------------------------------- | ----------- |
| `application` | Yes      | [WorkflowApplication](protocol.md#workflowapplication)     |             |
| `status`      | Yes      | [ApplicationConnection](protocol.md#applicationconnection) |             |
| `title`       | Yes      | `string`                                                   |             |

## WorkflowApprovalChoice

Explicit decisions; absence of a decision never grants permission.

Type: `"approved"` / `"cancelled"` / `"changes_requested"` / `"rejected"`.

## WorkflowApprovalDecision

One explicit authenticated decision on one exact proposal and invocation.

| Field              | Required | Type                                                         | Description |
| ------------------ | -------- | ------------------------------------------------------------ | ----------- |
| `commandId`        | Yes      | `string`                                                     |             |
| `comment`          | Yes      | `string`                                                     |             |
| `decision`         | Yes      | [WorkflowApprovalChoice](protocol.md#workflowapprovalchoice) |             |
| `invocationId`     | Yes      | `string`                                                     |             |
| `nodeId`           | Yes      | `string`                                                     |             |
| `proposalRevision` | Yes      | `string`                                                     |             |
| `runId`            | Yes      | `string`                                                     |             |

## WorkflowApprovalProposal

Immutable canonical content identified by a server-computed SHA-256 revision.

| Field         | Required | Type                                         | Description |
| ------------- | -------- | -------------------------------------------- | ----------- |
| `action`      | Yes      | `string`                                     |             |
| `content`     | Yes      | [WorkflowObject](protocol.md#workflowobject) |             |
| `destination` | Yes      | `string`                                     |             |
| `revision`    | Yes      | `string`                                     |             |

## WorkflowArtifactCursor

Exclusive position in the run's immutable invocation manifests.

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `invocationId` | Yes      | `string` |             |
| `nodeId`       | Yes      | `string` |             |

## WorkflowArtifactListPage

Expiry is interpreted against the server observation time; bytes are retrieved separately.

| Field          | Required | Type                                                                            | Description |
| -------------- | -------- | ------------------------------------------------------------------------------- | ----------- |
| `items`        | Yes      | Array of [WorkflowArtifactPublication](protocol.md#workflowartifactpublication) |             |
| `next`         | Yes      | [WorkflowArtifactCursor](protocol.md#workflowartifactcursor) / `null`           |             |
| `observedAtMs` | Yes      | `string`                                                                        |             |
| `runId`        | Yes      | `string`                                                                        |             |

## WorkflowArtifactListRequest

Lists metadata only, with at most six publications of at most 32 files each.

| Field   | Required | Type                                                                  | Description |
| ------- | -------- | --------------------------------------------------------------------- | ----------- |
| `after` | Yes      | [WorkflowArtifactCursor](protocol.md#workflowartifactcursor) / `null` |             |
| `limit` | Yes      | `number`                                                              |             |
| `runId` | Yes      | `string`                                                              |             |

## WorkflowArtifactPublication

Recorded producing identity and public file metadata, without storage identifiers.

| Field          | Required | Type                                                                                                                            | Description |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `artifacts`    | Yes      | Array of [WorkflowRunArtifact](protocol.md#workflowrunartifact)                                                                 |             |
| `attempt`      | Yes      | `null,number`                                                                                                                   |             |
| `createdAtMs`  | Yes      | `null,string`                                                                                                                   |             |
| `invocationId` | Yes      | `string`                                                                                                                        |             |
| `label`        | Yes      | `string`                                                                                                                        |             |
| `nodeId`       | Yes      | `string`                                                                                                                        |             |
| `status`       | Yes      | `"cancelled"` / `"failed"` / `"interrupted"` / `"running"` / `"skipped"` / `"succeeded"` / `"uncertain"` / `"waiting"` / `null` |             |

## WorkflowAttentionCategory

Inbox views share authoritative execution records, never copied request state.

Type: `"failures"` / `"requests"`.

## WorkflowAttentionCursor

Stable owner-scoped position, still usable after the preceding request is answered.

| Field    | Required | Type          | Description |
| -------- | -------- | ------------- | ----------- |
| `nodeId` | Yes      | `null,string` |             |
| `runId`  | Yes      | `string`      |             |

## WorkflowAttentionItem

Display metadata points to an exact invocation; proposal bodies are loaded only on review.

| Field              | Required | Type                                      | Description |
| ------------------ | -------- | ----------------------------------------- | ----------- |
| `canRespond`       | Yes      | `boolean`                                 |             |
| `createdAtMs`      | Yes      | `string`                                  |             |
| `detail`           | Yes      | `string`                                  |             |
| `expiresAtMs`      | Yes      | `null,string`                             |             |
| `invocationId`     | Yes      | `null,string`                             |             |
| `kind`             | Yes      | `"approval"` / `"failure"` / `"question"` |             |
| `nodeId`           | Yes      | `null,string`                             |             |
| `recipient`        | Yes      | `string`                                  |             |
| `runId`            | Yes      | `string`                                  |             |
| `status`           | Yes      | `"expired"` / `"failed"` / `"pending"`    |             |
| `title`            | Yes      | `string`                                  |             |
| `workflowId`       | Yes      | `string`                                  |             |
| `workflowName`     | Yes      | `null,string`                             |             |
| `workflowRevision` | Yes      | `string`                                  |             |

## WorkflowAttentionPage

Stable pagination may return an empty page with a continuation after stale records are filtered.

| Field          | Required | Type                                                                    | Description |
| -------------- | -------- | ----------------------------------------------------------------------- | ----------- |
| `category`     | Yes      | [WorkflowAttentionCategory](protocol.md#workflowattentioncategory)      |             |
| `items`        | Yes      | Array of [WorkflowAttentionItem](protocol.md#workflowattentionitem)     |             |
| `next`         | Yes      | [WorkflowAttentionCursor](protocol.md#workflowattentioncursor) / `null` |             |
| `observedAtMs` | Yes      | `string`                                                                |             |

## WorkflowAttentionQuery

Bounded metadata query; the authenticated owner is not client input.

| Field      | Required | Type                                                                    | Description |
| ---------- | -------- | ----------------------------------------------------------------------- | ----------- |
| `after`    | Yes      | [WorkflowAttentionCursor](protocol.md#workflowattentioncursor) / `null` |             |
| `category` | Yes      | [WorkflowAttentionCategory](protocol.md#workflowattentioncategory)      |             |
| `limit`    | Yes      | `number`                                                                |             |

## WorkflowCalendarFold

A repeated local time always contributes at most one scheduled occurrence.

Type: `"first"` / `"second"` / `"skip"`.

## WorkflowCalendarGap

Calendar times are resolved in the named zone instead of by adding elapsed milliseconds.

Type: `"next-valid"` / `"skip"`.

## WorkflowCalendarTiming

Weekdays use ISO numbering: Monday 1 through Sunday 7; date bounds/exceptions are local dates.

| Field         | Required | Type                                                     | Description |
| ------------- | -------- | -------------------------------------------------------- | ----------- |
| `endDate`     | Yes      | `null,string`                                            |             |
| `exceptDates` | Yes      | Array of `string`                                        |             |
| `fold`        | Yes      | [WorkflowCalendarFold](protocol.md#workflowcalendarfold) |             |
| `gap`         | Yes      | [WorkflowCalendarGap](protocol.md#workflowcalendargap)   |             |
| `kind`        | Yes      | `"calendar"`                                             |             |
| `startDate`   | Yes      | `string`                                                 |             |
| `time`        | Yes      | `string`                                                 |             |
| `timeZone`    | Yes      | `string`                                                 |             |
| `weekdays`    | Yes      | Array of `number`                                        |             |

## WorkflowCatalog

Catalog format is separate from saved component versions and draft storage format.

| Field        | Required | Type                                                            | Description |
| ------------ | -------- | --------------------------------------------------------------- | ----------- |
| `components` | Yes      | Array of [ComponentDefinition](protocol.md#componentdefinition) |             |
| `format`     | Yes      | `1`                                                             |             |

## WorkflowCatalogObservation

An observation time is not a release date, freshness guarantee, or permission grant.

| Field              | Required | Type          | Description |
| ------------------ | -------- | ------------- | ----------- |
| `checkedAt`        | Yes      | `null,string` |             |
| `refreshAvailable` | Yes      | `boolean`     |             |
| `refreshFailed`    | Yes      | `boolean`     |             |

## WorkflowCompletionTiming

One run at a time, followed by a delay from its persisted terminal transition.

| Field        | Required | Type                 | Description |
| ------------ | -------- | -------------------- | ----------- |
| `endAtMs`    | Yes      | `null,string`        |             |
| `intervalMs` | Yes      | `string`             |             |
| `kind`       | Yes      | `"after-completion"` |             |
| `startAtMs`  | Yes      | `string`             |             |

## WorkflowCreateRequest

Client-chosen identities make an unacknowledged create safe to retry.

| Field        | Required | Type                                           | Description |
| ------------ | -------- | ---------------------------------------------- | ----------- |
| `commandId`  | Yes      | `string`                                       |             |
| `details`    | Yes      | [WorkflowDetails](protocol.md#workflowdetails) |             |
| `workflowId` | Yes      | `string`                                       |             |

## WorkflowDeleteReceipt

An idempotent deletion receipt; immutable execution history is retained.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `deleted`    | Yes      | `true`   |             |
| `revision`   | Yes      | `string` |             |
| `workflowId` | Yes      | `string` |             |

## WorkflowDeleteRequest

Deletion must name the saved revision the owner reviewed.

| Field              | Required | Type     | Description |
| ------------------ | -------- | -------- | ----------- |
| `expectedRevision` | Yes      | `string` |             |
| `workflowId`       | Yes      | `string` |             |

## WorkflowDetails

User-owned descriptive fields, independent of run and automation state.

| Field         | Required | Type              | Description |
| ------------- | -------- | ----------------- | ----------- |
| `description` | Yes      | `string`          |             |
| `folder`      | Yes      | `null,string`     |             |
| `name`        | Yes      | `string`          |             |
| `tags`        | Yes      | Array of `string` |             |

## WorkflowEdge

A draft can retain a dangling edge so validation can explain an unfinished edit.

| Field  | Required | Type                                             | Description |
| ------ | -------- | ------------------------------------------------ | ----------- |
| `from` | Yes      | [WorkflowEndpoint](protocol.md#workflowendpoint) |             |
| `id`   | Yes      | `string`                                         |             |
| `kind` | Yes      | [WorkflowEdgeKind](protocol.md#workflowedgekind) |             |
| `to`   | Yes      | [WorkflowEndpoint](protocol.md#workflowendpoint) |             |

## WorkflowEdgeKind

Execution, values, and resource attachments have separate connection semantics.

Type: `"data"` / `"flow"` / `"resource"`.

## WorkflowEdgeReference

One immutable connection.

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `content` | Yes      | `string` |             |
| `id`      | Yes      | `string` |             |

## WorkflowEndpoint

Stable endpoint identities survive cosmetic renames.

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `node` | Yes      | `string` |             |
| `port` | Yes      | `string` |             |

## WorkflowGroup

Saved hierarchy owns parent-local geometry; collapse and viewport remain editor preferences.

| Field       | Required | Type                                                        | Description |
| ----------- | -------- | ----------------------------------------------------------- | ----------- |
| `id`        | Yes      | `string`                                                    |             |
| `nodes`     | Yes      | Array of `string`                                           |             |
| `objective` | Yes      | `string`                                                    |             |
| `parent`    | Yes      | `null,string`                                               |             |
| `ports`     | Yes      | Array of [WorkflowGroupPort](protocol.md#workflowgroupport) |             |
| `title`     | Yes      | `string`                                                    |             |
| `x`         | Yes      | `number`                                                    |             |
| `y`         | Yes      | `number`                                                    |             |

## WorkflowGroupPort

Published ports retain the original executable endpoint and explicit direction.

| Field       | Required | Type                                             | Description |
| ----------- | -------- | ------------------------------------------------ | ----------- |
| `direction` | Yes      | [PortDirection](protocol.md#portdirection)       |             |
| `endpoint`  | Yes      | [WorkflowEndpoint](protocol.md#workflowendpoint) |             |
| `id`        | Yes      | `string`                                         |             |
| `label`     | Yes      | `string`                                         |             |

## WorkflowGroupReference

Each revision references an immutable group body independently from executable node content.

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `content` | Yes      | `string` |             |
| `id`      | Yes      | `string` |             |

## WorkflowHumanAnswer

An idempotent explicit answer command.

| Field          | Required | Type             | Description |
| -------------- | -------- | ---------------- | ----------- |
| `answer`       | Yes      | `string,boolean` |             |
| `commandId`    | Yes      | `string`         |             |
| `invocationId` | Yes      | `string`         |             |
| `nodeId`       | Yes      | `string`         |             |
| `runId`        | Yes      | `string`         |             |

## WorkflowHumanIdentity

Exact invocation identity; the authenticated principal is never supplied by clients.

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `invocationId` | Yes      | `string` |             |
| `nodeId`       | Yes      | `string` |             |
| `runId`        | Yes      | `string` |             |

## WorkflowHumanOutcome

Terminal outcomes never infer an answer from silence.

Type: `"answered"` / `"approved"` / `"cancelled"` / `"changes_requested"` / `"expired"` / `"rejected"`.

## WorkflowHumanPage

Pending questions are capped per run and returned without completed output bodies.

| Field          | Required | Type                                                              | Description |
| -------------- | -------- | ----------------------------------------------------------------- | ----------- |
| `items`        | Yes      | Array of [WorkflowHumanRequest](protocol.md#workflowhumanrequest) |             |
| `observedAtMs` | Yes      | `string`                                                          |             |
| `runId`        | Yes      | `string`                                                          |             |

## WorkflowHumanRequest

Public owner-scoped read, shared by pending-run views and future inbox navigation.

| Field          | Required | Type                                                                | Description                                                                   |
| -------------- | -------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `answerType`   | Yes      | [WorkflowAnswerType](protocol.md#workflowanswertype)                |                                                                               |
| `approval`     | No       | [WorkflowApprovalProposal](protocol.md#workflowapprovalproposal)    | Immutable canonical content identified by a server-computed SHA-256 revision. |
| `canAnswer`    | Yes      | `boolean`                                                           |                                                                               |
| `choices`      | Yes      | Array of `string`                                                   |                                                                               |
| `createdAtMs`  | Yes      | `string`                                                            |                                                                               |
| `expiresAtMs`  | Yes      | `string`                                                            |                                                                               |
| `invocationId` | Yes      | `string`                                                            |                                                                               |
| `label`        | Yes      | `string`                                                            |                                                                               |
| `nodeId`       | Yes      | `string`                                                            |                                                                               |
| `question`     | Yes      | `string`                                                            |                                                                               |
| `recipient`    | Yes      | `string`                                                            |                                                                               |
| `response`     | Yes      | [WorkflowHumanResponse](protocol.md#workflowhumanresponse) / `null` |                                                                               |
| `runId`        | Yes      | `string`                                                            |                                                                               |
| `status`       | Yes      | [WorkflowHumanStatus](protocol.md#workflowhumanstatus)              |                                                                               |
| `timeoutMs`    | Yes      | `string`                                                            |                                                                               |

## WorkflowHumanResponse

Recorded response evidence; expiry contains no actor or answer.

| Field              | Required | Type                                                     | Description |
| ------------------ | -------- | -------------------------------------------------------- | ----------- |
| `actor`            | Yes      | `null,string`                                            |             |
| `answer`           | Yes      | `null,string,boolean`                                    |             |
| `atMs`             | Yes      | `string`                                                 |             |
| `commandId`        | Yes      | `null,string`                                            |             |
| `comment`          | No       | `string`                                                 |             |
| `outcome`          | Yes      | [WorkflowHumanOutcome](protocol.md#workflowhumanoutcome) |             |
| `proposalRevision` | No       | `string`                                                 |             |

## WorkflowHumanStatus

Request presentation state also reflects whole-run cancellation.

Type: `"answered"` / `"approved"` / `"cancelled"` / `"changes_requested"` / `"expired"` / `"pending"` / `"rejected"`.

## WorkflowImageCandidate

All connected render quotes share the selected snapshot and its evidence.

| Field      | Required | Type                                                                   | Description |
| ---------- | -------- | ---------------------------------------------------------------------- | ----------- |
| `evidence` | Yes      | [WorkflowImagePolicyEvidence](protocol.md#workflowimagepolicyevidence) |             |
| `model`    | Yes      | `string`                                                               |             |
| `provider` | Yes      | `string`                                                               |             |
| `quotes`   | Yes      | Array of [WorkflowImageQuote](protocol.md#workflowimagequote)          |             |

## WorkflowImageCapabilities

Supported image settings from the same adapter used by execution.

| Field             | Required | Type                                                                    | Description |
| ----------------- | -------- | ----------------------------------------------------------------------- | ----------- |
| `dimensions`      | Yes      | [WorkflowImageDimensions](protocol.md#workflowimagedimensions) / `null` |             |
| `maxCount`        | Yes      | `number`                                                                |             |
| `outputFormats`   | Yes      | Array of `string`                                                       |             |
| `providerOptions` | Yes      | [Recordstringstring](protocol.md#recordstringstring)                    |             |
| `qualities`       | Yes      | Array of `string`                                                       |             |
| `sizes`           | Yes      | Array of `string`                                                       |             |

## WorkflowImageDimensions

Pixel limits for a model that supports custom dimensions.

| Field                     | Required | Type     | Description |
| ------------------------- | -------- | -------- | ----------- |
| `experimentalAbovePixels` | Yes      | `number` |             |
| `maxAspectRatio`          | Yes      | `number` |             |
| `maxEdge`                 | Yes      | `number` |             |
| `maxPixels`               | Yes      | `number` |             |
| `minPixels`               | Yes      | `number` |             |
| `multiple`                | Yes      | `number` |             |

## WorkflowImagePolicy

Image policies bound each complete render; token rate ceilings do not apply to image tariffs.

| Field                     | Required | Type          | Description                                                                           |
| ------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------- |
| `allowPreview`            | Yes      | `boolean`     |                                                                                       |
| `maxCatalogAgeMs`         | Yes      | `string`      |                                                                                       |
| `maxGenerationMicrocents` | Yes      | `null,string` | Null retains the existing run budget. A value additionally caps each image operation. |
| `region`                  | Yes      | `null,string` |                                                                                       |

## WorkflowImagePolicyEvidence

Immutable evidence for a concrete image model selected at run creation.

| Field                     | Required | Type                                                   | Description |
| ------------------------- | -------- | ------------------------------------------------------ | ----------- |
| `catalogCheckedAtMs`      | Yes      | `string`                                               |             |
| `eligibilityReference`    | Yes      | `string`                                               |             |
| `eligibilityVerifiedAtMs` | Yes      | `string`                                               |             |
| `factsDigest`             | Yes      | `string`                                               |             |
| `format`                  | Yes      | `1`                                                    |             |
| `policy`                  | Yes      | [WorkflowImagePolicy](protocol.md#workflowimagepolicy) |             |
| `releaseAtMs`             | Yes      | `string`                                               |             |
| `releaseReference`        | Yes      | `string`                                               |             |

## WorkflowImageQuote

An estimate creates no reservation and is recalculated when accepting a run.

| Field                 | Required | Type                                                       | Description |
| --------------------- | -------- | ---------------------------------------------------------- | ----------- |
| `capabilityReference` | Yes      | `string`                                                   |             |
| `estimatedMicrocents` | Yes      | `string`                                                   |             |
| `model`               | Yes      | `string`                                                   |             |
| `nodeId`              | Yes      | `string`                                                   |             |
| `pricingReference`    | Yes      | `string`                                                   |             |
| `provider`            | Yes      | `string`                                                   |             |
| `quotedAtMs`          | Yes      | `string`                                                   |             |
| `settings`            | Yes      | [WorkflowImageSettings](protocol.md#workflowimagesettings) |             |
| `workflowId`          | Yes      | `string`                                                   |             |

## WorkflowImageQuoteRequest

Unsaved render settings may be priced only in an owned workflow.

| Field        | Required | Type                                                       | Description |
| ------------ | -------- | ---------------------------------------------------------- | ----------- |
| `model`      | Yes      | `string`                                                   |             |
| `nodeId`     | Yes      | `string`                                                   |             |
| `provider`   | Yes      | `string`                                                   |             |
| `settings`   | Yes      | [WorkflowImageSettings](protocol.md#workflowimagesettings) |             |
| `workflowId` | Yes      | `string`                                                   |             |

## WorkflowImageRequirement

Per-operation settings sharing one reusable image-model binding.

| Field      | Required | Type                                                       | Description |
| ---------- | -------- | ---------------------------------------------------------- | ----------- |
| `nodeId`   | Yes      | `string`                                                   |             |
| `settings` | Yes      | [WorkflowImageSettings](protocol.md#workflowimagesettings) |             |

## WorkflowImageResolution

An unresolved policy has a reason, never an invented candidate or zero-price placeholder.

| Field       | Required | Type                                                                  | Description |
| ----------- | -------- | --------------------------------------------------------------------- | ----------- |
| `candidate` | Yes      | [WorkflowImageCandidate](protocol.md#workflowimagecandidate) / `null` |             |
| `reason`    | Yes      | `null,string`                                                         |             |

## WorkflowImageResolutionRequest

A read-only policy preview uses unsaved settings and authenticated account pricing.

| Field          | Required | Type                                                                      | Description |
| -------------- | -------- | ------------------------------------------------------------------------- | ----------- |
| `policy`       | Yes      | [WorkflowImagePolicy](protocol.md#workflowimagepolicy)                    |             |
| `provider`     | Yes      | `string`                                                                  |             |
| `requirements` | Yes      | Array of [WorkflowImageRequirement](protocol.md#workflowimagerequirement) |             |
| `workflowId`   | Yes      | `string`                                                                  |             |

## WorkflowImageSettings

An exact request, bounded before admission and independent of a text model binding.

| Field          | Required | Type                                                                           | Description                                      |
| -------------- | -------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| `count`        | Yes      | `number`                                                                       |                                                  |
| `operation`    | No       | `"edit"` / `"generate"`                                                        | Older generation-only snapshots omit this field. |
| `options`      | Yes      | [Recordstringstringnumberboolean](protocol.md#recordstringstringnumberboolean) |                                                  |
| `outputFormat` | Yes      | `string`                                                                       |                                                  |
| `quality`      | Yes      | `string`                                                                       |                                                  |
| `size`         | Yes      | `string`                                                                       |                                                  |

## WorkflowIntervalTiming

Millisecond strings preserve exact instants across transport and MongoDB.

| Field        | Required | Type          | Description |
| ------------ | -------- | ------------- | ----------- |
| `endAtMs`    | Yes      | `null,string` |             |
| `intervalMs` | Yes      | `string`      |             |
| `kind`       | Yes      | `"interval"`  |             |
| `startAtMs`  | Yes      | `string`      |             |

## WorkflowListCursor

Cursor uses a timestamp plus stable identity to handle equal update times.

| Field         | Required | Type     | Description |
| ------------- | -------- | -------- | ----------- |
| `updatedAtMs` | Yes      | `string` |             |
| `workflowId`  | Yes      | `string` |             |

## WorkflowListPage

Bounded management page.

| Field   | Required | Type                                                          | Description |
| ------- | -------- | ------------------------------------------------------------- | ----------- |
| `items` | Yes      | Array of [WorkflowSummary](protocol.md#workflowsummary)       |             |
| `next`  | Yes      | [WorkflowListCursor](protocol.md#workflowlistcursor) / `null` |             |

## WorkflowListRequest

Metadata pagination carries no node payloads.

| Field    | Required | Type                                                          | Description |
| -------- | -------- | ------------------------------------------------------------- | ----------- |
| `cursor` | Yes      | [WorkflowListCursor](protocol.md#workflowlistcursor) / `null` |             |
| `limit`  | Yes      | `number`                                                      |             |

## WorkflowLoopSpendingRequest

Select one authored loop in an owned immutable run.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `loopId` | Yes      | `string` |             |
| `runId`  | Yes      | `string` |             |

## WorkflowLoopSpendingView

The public projection adds run-pinned configuration and explicitly marks mocked execution.

| Field                | Required | Type                                                                  | Description                                              |
| -------------------- | -------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| `deadlineAtMs`       | Yes      | `null,string`                                                         |                                                          |
| `entries`            | Yes      | `string`                                                              |                                                          |
| `lastReportedAtMs`   | Yes      | `null,string`                                                         |                                                          |
| `limitMicrocents`    | Yes      | `null,string`                                                         |                                                          |
| `loopId`             | Yes      | `string`                                                              |                                                          |
| `observedAtMs`       | Yes      | `string`                                                              |                                                          |
| `pricing`            | No       | Array of [WorkflowSpendingBucket](protocol.md#workflowspendingbucket) | Present only on the negotiated classified-report method. |
| `reportedMicrocents` | Yes      | `null,string`                                                         |                                                          |
| `reservationCount`   | Yes      | `number`                                                              |                                                          |
| `reservedMicrocents` | Yes      | `string`                                                              |                                                          |
| `revision`           | Yes      | `string`                                                              |                                                          |
| `runId`              | Yes      | `string`                                                              |                                                          |
| `simulated`          | Yes      | `boolean`                                                             |                                                          |
| `workflowId`         | Yes      | `string`                                                              |                                                          |

## WorkflowManifestPage

Bounded manifest page; offsets count references, never bytes or revisions.

| Field             | Required | Type                                                                  | Description |
| ----------------- | -------- | --------------------------------------------------------------------- | ----------- |
| `details`         | Yes      | [WorkflowDetails](protocol.md#workflowdetails)                        |             |
| `edges`           | Yes      | Array of [WorkflowEdgeReference](protocol.md#workflowedgereference)   |             |
| `format`          | Yes      | `1`                                                                   |             |
| `groups`          | No       | Array of [WorkflowGroupReference](protocol.md#workflowgroupreference) |             |
| `nextEdgeOffset`  | Yes      | `null,number`                                                         |             |
| `nextGroupOffset` | No       | `null,number`                                                         |             |
| `nextNodeOffset`  | Yes      | `null,number`                                                         |             |
| `nodes`           | Yes      | Array of [WorkflowNodeReference](protocol.md#workflownodereference)   |             |
| `revision`        | Yes      | `string`                                                              |             |
| `workflowId`      | Yes      | `string`                                                              |             |

## WorkflowModelCapability

Operations available through the workflow model picker.

Type: `"image"` / `"reasoning"` / `"text"`.

## WorkflowModelChoice

Public model metadata only: no endpoints, keys, account names, or adapter options.

| Field              | Required | Type                                                               | Description                                                                             |
| ------------------ | -------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `availableAtCheck` | No       | `null,boolean`                                                     | Null/absent means no explicit endpoint check, rather than proof that a model is absent. |
| `compatible`       | Yes      | `boolean`                                                          |                                                                                         |
| `contextWindow`    | Yes      | `null,number`                                                      |                                                                                         |
| `efforts`          | No       | Array of [WorkflowModelEffort](protocol.md#workflowmodeleffort)    | Available effort overrides for this model; absent means metadata is unavailable.        |
| `id`               | Yes      | `string`                                                           |                                                                                         |
| `image`            | No       | [WorkflowImageCapabilities](protocol.md#workflowimagecapabilities) | Present only for generation models; token prices do not describe image tariffs.         |
| `input`            | Yes      | Array of `string`                                                  |                                                                                         |
| `maxOutputTokens`  | Yes      | `null,number`                                                      |                                                                                         |
| `name`             | Yes      | `string`                                                           |                                                                                         |
| `price`            | Yes      | [WorkflowModelPrice](protocol.md#workflowmodelprice) / `null`      |                                                                                         |
| `provider`         | Yes      | `string`                                                           |                                                                                         |
| `reason`           | Yes      | `null,string`                                                      |                                                                                         |
| `reasoning`        | Yes      | `null,boolean`                                                     |                                                                                         |
| `source`           | Yes      | `string`                                                           |                                                                                         |
| `status`           | Yes      | `string`                                                           |                                                                                         |

## WorkflowModelEffort

Saved reasoning levels shared by workflows and provider requests; null uses the service default.

Type: `"high"` / `"low"` / `"max"` / `"medium"` / `"minimal"` / `"off"` / `"xhigh"`.

## WorkflowModelFeature

Features that integrations can explicitly verify for model selection.

Type: `"documents"` / `"reasoning"` / `"structuredOutput"` / `"tools"` / `"vision"`.

## WorkflowModelPolicy

Saved, explicit constraints for the latest supported model on one provider.

| Field                    | Required | Type                                                              | Description                                                         |
| ------------------------ | -------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| `allowPreview`           | Yes      | `boolean`                                                         |                                                                     |
| `allowUnpriced`          | Yes      | `boolean`                                                         |                                                                     |
| `maxCatalogAgeMs`        | Yes      | `string`                                                          | Endpoint observation age, between one second and one day.           |
| `maxInputUsdPerMillion`  | Yes      | `null,string`                                                     | Decimal USD per million tokens. Null is no additional rate ceiling. |
| `maxOutputUsdPerMillion` | Yes      | `null,string`                                                     |                                                                     |
| `region`                 | Yes      | `null,string`                                                     |                                                                     |
| `requiredFeatures`       | Yes      | Array of [WorkflowModelFeature](protocol.md#workflowmodelfeature) |                                                                     |

## WorkflowModelPolicyEvidence

The facts and constraints used for one immutable latest-policy decision.

| Field                     | Required | Type                                                   | Description |
| ------------------------- | -------- | ------------------------------------------------------ | ----------- |
| `capabilityDigest`        | Yes      | `string`                                               |             |
| `catalogCheckedAtMs`      | Yes      | `string`                                               |             |
| `eligibilityReference`    | Yes      | `string`                                               |             |
| `eligibilityVerifiedAtMs` | Yes      | `string`                                               |             |
| `format`                  | Yes      | `1`                                                    |             |
| `policy`                  | Yes      | [WorkflowModelPolicy](protocol.md#workflowmodelpolicy) |             |
| `releaseAtMs`             | Yes      | `string`                                               |             |
| `releaseReference`        | Yes      | `string`                                               |             |

## WorkflowModelPrice

Existing ledger rate-card values, represented as decimal text without client-side money math.

| Field                 | Required | Type          | Description |
| --------------------- | -------- | ------------- | ----------- |
| `inputUsdPerMillion`  | Yes      | `null,string` |             |
| `outputUsdPerMillion` | Yes      | `null,string` |             |

## WorkflowModelResolution

| Field       | Required | Type                                                                            | Description |
| ----------- | -------- | ------------------------------------------------------------------------------- | ----------- |
| `candidate` | Yes      | [WorkflowModelChoice](protocol.md#workflowmodelchoice) / `null`                 |             |
| `evidence`  | Yes      | [WorkflowModelPolicyEvidence](protocol.md#workflowmodelpolicyevidence) / `null` |             |
| `reason`    | Yes      | `null,string`                                                                   |             |

## WorkflowModelResolutionRequest

Owner-authorized policy preview; never saves a draft or performs inference.

| Field             | Required | Type                                                   | Description |
| ----------------- | -------- | ------------------------------------------------------ | ----------- |
| `capability`      | Yes      | [Exclude](protocol.md#exclude)                         |             |
| `maxOutputTokens` | Yes      | `number`                                               |             |
| `policy`          | Yes      | [WorkflowModelPolicy](protocol.md#workflowmodelpolicy) |             |
| `provider`        | Yes      | `string`                                               |             |
| `workflowId`      | Yes      | `string`                                               |             |

## WorkflowModelUsage

Actual executed identity and original tariff, never current catalog prices.

| Field              | Required | Type                                                           | Description |
| ------------------ | -------- | -------------------------------------------------------------- | ----------- |
| `basis`            | Yes      | [WorkflowSpendingBasis](protocol.md#workflowspendingbasis)     |             |
| `entries`          | Yes      | `string`                                                       |             |
| `expiresAtMs`      | Yes      | `string`                                                       |             |
| `id`               | Yes      | `string`                                                       |             |
| `kind`             | Yes      | [ChargeKind](protocol.md#chargekind)                           |             |
| `lastReportedAtMs` | Yes      | `string`                                                       |             |
| `microcents`       | Yes      | `string`                                                       |             |
| `model`            | Yes      | `null,string`                                                  |             |
| `provider`         | Yes      | `null,string`                                                  |             |
| `tariff`           | Yes      | [PricingTariff](protocol.md#pricingtariff) / `null`            |             |
| `unitEntries`      | Yes      | `string`                                                       |             |
| `unitLabel`        | Yes      | `null,string`                                                  |             |
| `units`            | Yes      | `null,string`                                                  |             |
| `usage`            | Yes      | [WorkflowUsageDimensions](protocol.md#workflowusagedimensions) |             |
| `usageEntries`     | Yes      | [WorkflowUsageDimensions](protocol.md#workflowusagedimensions) |             |

## WorkflowModelsPage

Registered providers and a bounded page from the selected provider's maintained catalog.

| Field         | Required | Type                                                                 | Description                                                                        |
| ------------- | -------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `freshness`   | Yes      | `"not-reported"`                                                     | Legacy marker retained for older clients; endpoint check times are in observation. |
| `items`       | Yes      | Array of [WorkflowModelChoice](protocol.md#workflowmodelchoice)      |                                                                                    |
| `next`        | Yes      | `null,string`                                                        |                                                                                    |
| `observation` | No       | [WorkflowCatalogObservation](protocol.md#workflowcatalogobservation) | Optional for older clients. The legacy freshness marker remains unchanged.         |
| `providers`   | Yes      | Array of `string`                                                    |                                                                                    |

## WorkflowModelsRequest

Discovery never changes a workflow or grants access to another account's resources.

| Field            | Required | Type                                                           | Description |
| ---------------- | -------- | -------------------------------------------------------------- | ----------- |
| `after`          | Yes      | `null,string`                                                  |             |
| `capability`     | Yes      | [WorkflowModelCapability](protocol.md#workflowmodelcapability) |             |
| `compatibleOnly` | Yes      | `boolean`                                                      |             |
| `favorites`      | Yes      | Array of `string` / `null`                                     |             |
| `provider`       | Yes      | `null,string`                                                  |             |
| `query`          | Yes      | `string`                                                       |             |
| `workflowId`     | Yes      | `string`                                                       |             |

## WorkflowNode

Versioned component configuration; unsupported or incomplete components can be saved.

| Field              | Required | Type                                                    | Description |
| ------------------ | -------- | ------------------------------------------------------- | ----------- |
| `component`        | Yes      | `string`                                                |             |
| `componentVersion` | Yes      | `string`                                                |             |
| `configuration`    | Yes      | [WorkflowObject](protocol.md#workflowobject)            |             |
| `id`               | Yes      | `string`                                                |             |
| `label`            | Yes      | `string`                                                |             |
| `resources`        | Yes      | Array of [ResourceBinding](protocol.md#resourcebinding) |             |

## WorkflowNodeReference

One node's immutable content and independently versioned layout.

| Field      | Required | Type     | Description |
| ---------- | -------- | -------- | ----------- |
| `content`  | Yes      | `string` |             |
| `id`       | Yes      | `string` |             |
| `position` | Yes      | `string` |             |

## WorkflowObject

JSON configuration is data, not an executable plan or authorization.

Type: Dictionary.

## WorkflowOnceTiming

A single UTC instant, displayed in the user's selected timezone by the client.

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `atMs` | Yes      | `string` |             |
| `kind` | Yes      | `"once"` |             |

## WorkflowPatch

A bounded edit; layout changes never include node configuration.

| Field          | Required | Type                                                      | Description                                                                  |
| -------------- | -------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `details`      | Yes      | [WorkflowDetails](protocol.md#workflowdetails) / `null`   |                                                                              |
| `edges`        | Yes      | Array of [WorkflowEdge](protocol.md#workflowedge)         |                                                                              |
| `groups`       | No       | Array of [WorkflowGroup](protocol.md#workflowgroup)       | Present together on hierarchy-aware edits; omission denotes a legacy writer. |
| `nodes`        | Yes      | Array of [WorkflowNode](protocol.md#workflownode)         |                                                                              |
| `positions`    | Yes      | Array of [WorkflowPosition](protocol.md#workflowposition) |                                                                              |
| `removeEdges`  | Yes      | Array of `string`                                         |                                                                              |
| `removeGroups` | No       | Array of `string`                                         |                                                                              |
| `removeNodes`  | Yes      | Array of `string`                                         |                                                                              |

## WorkflowPosition

Personal viewport is excluded; these positions belong to the workflow itself.

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |
| `x`   | Yes      | `number` |             |
| `y`   | Yes      | `number` |             |

## WorkflowPublication

A complete immutable manifest points to retained graph records, never a mutable draft.

| Field           | Required | Type                                                               | Description |
| --------------- | -------- | ------------------------------------------------------------------ | ----------- |
| `format`        | Yes      | `1`                                                                |             |
| `name`          | Yes      | `string`                                                           |             |
| `policy`        | Yes      | [WorkflowPublicationPolicy](protocol.md#workflowpublicationpolicy) |             |
| `publicationId` | Yes      | `string`                                                           |             |
| `publishedAtMs` | Yes      | `string`                                                           |             |
| `revision`      | Yes      | `string`                                                           |             |
| `version`       | Yes      | `string`                                                           |             |
| `workflowId`    | Yes      | `string`                                                           |             |

## WorkflowPublicationCheck

Validation is an observation; publishing and execution each recheck current access.

| Field         | Required | Type                                          | Description |
| ------------- | -------- | --------------------------------------------- | ----------- |
| `checkedAtMs` | Yes      | `string`                                      |             |
| `issues`      | Yes      | Array of [GraphIssue](protocol.md#graphissue) |             |
| `revision`    | Yes      | `string`                                      |             |
| `valid`       | Yes      | `boolean`                                     |             |
| `workflowId`  | Yes      | `string`                                      |             |

## WorkflowPublicationCheckRequest

| Field        | Required | Type                                                               | Description |
| ------------ | -------- | ------------------------------------------------------------------ | ----------- |
| `policy`     | Yes      | [WorkflowPublicationPolicy](protocol.md#workflowpublicationpolicy) |             |
| `revision`   | Yes      | `string`                                                           |             |
| `workflowId` | Yes      | `string`                                                           |             |

## WorkflowPublicationListRequest

| Field          | Required | Type          | Description |
| -------------- | -------- | ------------- | ----------- |
| `afterVersion` | Yes      | `null,string` |             |
| `limit`        | Yes      | `number`      |             |
| `workflowId`   | Yes      | `string`      |             |

## WorkflowPublicationPage

| Field   | Required | Type                                                            | Description |
| ------- | -------- | --------------------------------------------------------------- | ----------- |
| `items` | Yes      | Array of [WorkflowPublication](protocol.md#workflowpublication) |             |
| `next`  | Yes      | `null,string`                                                   |             |

## WorkflowPublicationPolicy

Limits reviewed before publication; run callers cannot override them.

| Field            | Required | Type     | Description |
| ---------------- | -------- | -------- | ----------- |
| `maxConcurrency` | Yes      | `number` |             |
| `timeoutMs`      | Yes      | `string` |             |
| `triggerNodeId`  | Yes      | `string` |             |

## WorkflowPublicationReadRequest

| Field           | Required | Type          | Description |
| --------------- | -------- | ------------- | ----------- |
| `publicationId` | Yes      | `null,string` |             |
| `workflowId`    | Yes      | `string`      |             |

## WorkflowPublicationReference

Immutable publication identity, distinct from its source draft revision.

| Field           | Required | Type     | Description |
| --------------- | -------- | -------- | ----------- |
| `publicationId` | Yes      | `string` |             |
| `revision`      | Yes      | `string` |             |
| `version`       | Yes      | `string` |             |

## WorkflowPublishRequest

| Field                   | Required | Type                                                               | Description |
| ----------------------- | -------- | ------------------------------------------------------------------ | ----------- |
| `commandId`             | Yes      | `string`                                                           |             |
| `expectedDraftRevision` | Yes      | `string`                                                           |             |
| `expectedPublicationId` | Yes      | `null,string`                                                      |             |
| `policy`                | Yes      | [WorkflowPublicationPolicy](protocol.md#workflowpublicationpolicy) |             |
| `revision`              | Yes      | `string`                                                           |             |
| `workflowId`            | Yes      | `string`                                                           |             |

## WorkflowPublishResult

| Field         | Required | Type                                                             | Description |
| ------------- | -------- | ---------------------------------------------------------------- | ----------- |
| `check`       | Yes      | [WorkflowPublicationCheck](protocol.md#workflowpublicationcheck) |             |
| `publication` | Yes      | [WorkflowPublication](protocol.md#workflowpublication) / `null`  |             |

## WorkflowPublishedRunRequest

Explicitly selected immutable version, with server-owned execution limits.

| Field           | Required | Type                                         | Description |
| --------------- | -------- | -------------------------------------------- | ----------- |
| `input`         | Yes      | [WorkflowObject](protocol.md#workflowobject) |             |
| `publicationId` | Yes      | `string`                                     |             |
| `runId`         | Yes      | `string`                                     |             |
| `workflowId`    | Yes      | `string`                                     |             |

## WorkflowReadRequest

Null resolves the current revision only for the first page. Subsequent pages pin it.

| Field         | Required | Type          | Description |
| ------------- | -------- | ------------- | ----------- |
| `edgeOffset`  | Yes      | `number`      |             |
| `groupOffset` | No       | `number`      |             |
| `nodeOffset`  | Yes      | `number`      |             |
| `revision`    | Yes      | `null,string` |             |
| `workflowId`  | Yes      | `string`      |             |

## WorkflowReceipt

Result retained by command receipts, including after subsequent edits.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `revision`   | Yes      | `string` |             |
| `workflowId` | Yes      | `string` |             |

## WorkflowRecordPage

JSON text chunks are concatenated before parsing. Offsets count UTF-16 code units.

| Field             | Required | Type          | Description |
| ----------------- | -------- | ------------- | ----------- |
| `content`         | Yes      | `string`      |             |
| `nextOffset`      | Yes      | `null,number` |             |
| `offset`          | Yes      | `number`      |             |
| `reference`       | Yes      | `string`      |             |
| `totalCharacters` | Yes      | `number`      |             |
| `workflowId`      | Yes      | `string`      |             |

## WorkflowRecordRequest

A reference identifies immutable content within the authenticated owner's workflow.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `offset`     | Yes      | `number` |             |
| `reference`  | Yes      | `string` |             |
| `workflowId` | Yes      | `string` |             |

## WorkflowRecordsPage

The response remains bounded even when a selected record contains a large prompt.

| Field        | Required | Type                                                          | Description |
| ------------ | -------- | ------------------------------------------------------------- | ----------- |
| `records`    | Yes      | Array of [WorkflowRecordPage](protocol.md#workflowrecordpage) |             |
| `workflowId` | Yes      | `string`                                                      |             |

## WorkflowRecordsRequest

Batches first pages of immutable values; larger records continue through workflows.record.

| Field        | Required | Type              | Description |
| ------------ | -------- | ----------------- | ----------- |
| `references` | Yes      | Array of `string` |             |
| `workflowId` | Yes      | `string`          |             |

## WorkflowRunArtifact

Public immutable file metadata; neither storage paths nor global media IDs cross this boundary.

| Field         | Required | Type          | Description |
| ------------- | -------- | ------------- | ----------- |
| `artifactId`  | Yes      | `string`      |             |
| `bytes`       | Yes      | `string`      |             |
| `contentType` | Yes      | `string`      |             |
| `expiresAtMs` | Yes      | `null,string` |             |
| `name`        | Yes      | `string`      |             |
| `sha256`      | Yes      | `string`      |             |

## WorkflowRunArtifactPage

A bounded binary fragment; clients verify the complete SHA-256 after assembling all fragments.

| Field        | Required | Type                                                   | Description |
| ------------ | -------- | ------------------------------------------------------ | ----------- |
| `artifact`   | Yes      | [WorkflowRunArtifact](protocol.md#workflowrunartifact) |             |
| `artifactId` | Yes      | `string`                                               |             |
| `base64`     | Yes      | `string`                                               |             |
| `nextOffset` | Yes      | `null,number`                                          |             |
| `offset`     | Yes      | `number`                                               |             |
| `runId`      | Yes      | `string`                                               |             |

## WorkflowRunArtifactRequest

One exact operation's artifact, addressed within the authenticated account and run.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `artifactId` | Yes      | `string` |             |
| `offset`     | Yes      | `number` |             |
| `runId`      | Yes      | `string` |             |

## WorkflowRunAttemptsPage

| Field   | Required | Type                                                      | Description |
| ------- | -------- | --------------------------------------------------------- | ----------- |
| `items` | Yes      | Array of [WorkflowStepView](protocol.md#workflowstepview) |             |
| `next`  | Yes      | `null,number`                                             |             |

## WorkflowRunAttemptsRequest

Lists exact invocations for a node without including captured input/output bodies.

| Field          | Required | Type          | Description |
| -------------- | -------- | ------------- | ----------- |
| `afterAttempt` | Yes      | `null,number` |             |
| `limit`        | Yes      | `number`      |             |
| `nodeId`       | Yes      | `string`      |             |
| `runId`        | Yes      | `string`      |             |

## WorkflowRunBreakdownRequest

| Field       | Required | Type                                                         | Description |
| ----------- | -------- | ------------------------------------------------------------ | ----------- |
| `dimension` | Yes      | [WorkflowUsageDimension](protocol.md#workflowusagedimension) |             |
| `offset`    | Yes      | `string`                                                     |             |
| `runId`     | Yes      | `string`                                                     |             |

## WorkflowRunBreakdownView

| Field                | Required | Type                                                                    | Description |
| -------------------- | -------- | ----------------------------------------------------------------------- | ----------- |
| `dimension`          | Yes      | [WorkflowUsageDimension](protocol.md#workflowusagedimension)            |             |
| `entries`            | Yes      | `string`                                                                |             |
| `expiresAtMs`        | Yes      | `null,string`                                                           |             |
| `groupCount`         | Yes      | `string`                                                                |             |
| `groups`             | Yes      | Array of [WorkflowUsageGroup](protocol.md#workflowusagegroup)           |             |
| `labels`             | Yes      | Array of [WorkflowUsageGroupLabel](protocol.md#workflowusagegrouplabel) |             |
| `lastReportedAtMs`   | Yes      | `null,string`                                                           |             |
| `next`               | Yes      | `null,string`                                                           |             |
| `observedAtMs`       | Yes      | `string`                                                                |             |
| `offset`             | Yes      | `string`                                                                |             |
| `pricing`            | Yes      | Array of [WorkflowSpendingBucket](protocol.md#workflowspendingbucket)   |             |
| `reportedMicrocents` | Yes      | `null,string`                                                           |             |
| `retainedFromMs`     | Yes      | `null,string`                                                           |             |
| `revision`           | Yes      | `string`                                                                |             |
| `runEntries`         | Yes      | `string`                                                                |             |
| `runId`              | Yes      | `string`                                                                |             |
| `simulated`          | Yes      | `boolean`                                                               |             |
| `workflowId`         | Yes      | `string`                                                                |             |

## WorkflowRunEvent

| Field          | Required | Type                                                                                                                                | Description                                                                               |
| -------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `atMs`         | Yes      | `string`                                                                                                                            |                                                                                           |
| `invocationId` | Yes      | `null,string`                                                                                                                       |                                                                                           |
| `kind`         | Yes      | [WorkflowRunEventKind](protocol.md#workflowruneventkind)                                                                            |                                                                                           |
| `message`      | Yes      | `null,string`                                                                                                                       |                                                                                           |
| `nodeId`       | Yes      | `null,string`                                                                                                                       |                                                                                           |
| `origin`       | No       | [WorkflowStepOrigin](protocol.md#workflowsteporigin)                                                                                | An execution instance points back to the immutable authored card and its collection item. |
| `runId`        | Yes      | `string`                                                                                                                            |                                                                                           |
| `sequence`     | Yes      | `string`                                                                                                                            |                                                                                           |
| `status`       | Yes      | `"cancelled"` / `"failed"` / `"interrupted"` / `"queued"` / `"running"` / `"skipped"` / `"succeeded"` / `"uncertain"` / `"waiting"` |                                                                                           |

## WorkflowRunEventKind

Type: `"accepted"` / `"cancelled"` / `"claimed"` / `"finished"` / `"resumed"` / `"step-finished"` / `"step-started"` / `"step-waiting"` / `"suspended"`.

## WorkflowRunEventsRequest

Reads ordered journal events after an exclusive sequence.

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `after` | Yes      | `string` |             |
| `limit` | Yes      | `number` |             |
| `runId` | Yes      | `string` |             |

## WorkflowRunListPage

A bounded history page ordered by creation time and run ID.

| Field   | Required | Type                                                          | Description |
| ------- | -------- | ------------------------------------------------------------- | ----------- |
| `items` | Yes      | Array of [WorkflowRunSummary](protocol.md#workflowrunsummary) |             |
| `next`  | Yes      | `null,string`                                                 |             |

## WorkflowRunListRequest

Pages run history for one owned workflow.

| Field        | Required | Type          | Description |
| ------------ | -------- | ------------- | ----------- |
| `afterRunId` | Yes      | `null,string` |             |
| `limit`      | Yes      | `number`      |             |
| `workflowId` | Yes      | `string`      |             |

## WorkflowRunMode

Type: `"live-test"` / `"mock-test"` / `"published"`.

## WorkflowRunOutputPage

A bounded JSON fragment with total length and continuation offset.

| Field             | Required | Type          | Description |
| ----------------- | -------- | ------------- | ----------- |
| `content`         | Yes      | `string`      |             |
| `invocationId`    | Yes      | `string`      |             |
| `nextOffset`      | Yes      | `null,number` |             |
| `nodeId`          | Yes      | `string`      |             |
| `offset`          | Yes      | `number`      |             |
| `runId`           | Yes      | `string`      |             |
| `totalCharacters` | Yes      | `number`      |             |

## WorkflowRunOutputRequest

Addresses one exact attempt and a UTF-16 offset into its encoded result.

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `invocationId` | Yes      | `string` |             |
| `nodeId`       | Yes      | `string` |             |
| `offset`       | Yes      | `number` |             |
| `runId`        | Yes      | `string` |             |

## WorkflowRunRequest

Addresses a run within the authenticated principal.

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `runId` | Yes      | `string` |             |

## WorkflowRunStartRequest

Starts one idempotent run of an owned saved revision.

| Field            | Required | Type                                           | Description |
| ---------------- | -------- | ---------------------------------------------- | ----------- |
| `input`          | Yes      | [WorkflowObject](protocol.md#workflowobject)   |             |
| `maxConcurrency` | Yes      | `number`                                       |             |
| `mode`           | Yes      | [WorkflowRunMode](protocol.md#workflowrunmode) |             |
| `revision`       | Yes      | `string`                                       |             |
| `runId`          | Yes      | `string`                                       |             |
| `timeoutMs`      | Yes      | `string`                                       |             |
| `triggerNodeId`  | Yes      | `string`                                       |             |
| `workflowId`     | Yes      | `string`                                       |             |

## WorkflowRunStatus

Type: `"cancelled"` / `"failed"` / `"queued"` / `"running"` / `"succeeded"` / `"waiting"`.

## WorkflowRunStepsPage

A bounded step page and its continuation cursor.

| Field   | Required | Type                                                      | Description |
| ------- | -------- | --------------------------------------------------------- | ----------- |
| `items` | Yes      | Array of [WorkflowStepView](protocol.md#workflowstepview) |             |
| `next`  | Yes      | `null,string`                                             |             |

## WorkflowRunStepsRequest

Reads bounded step metadata after an exclusive node ID.

| Field         | Required | Type          | Description |
| ------------- | -------- | ------------- | ----------- |
| `afterNodeId` | Yes      | `null,string` |             |
| `limit`       | Yes      | `number`      |             |
| `runId`       | Yes      | `string`      |             |

## WorkflowRunSummary

| Field              | Required | Type                                                                     | Description                                                              |
| ------------------ | -------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `createdAtMs`      | Yes      | `string`                                                                 |                                                                          |
| `message`          | Yes      | `null,string`                                                            |                                                                          |
| `mode`             | Yes      | [WorkflowRunMode](protocol.md#workflowrunmode)                           |                                                                          |
| `publication`      | No       | [WorkflowPublicationReference](protocol.md#workflowpublicationreference) | Immutable publication identity, distinct from its source draft revision. |
| `runId`            | Yes      | `string`                                                                 |                                                                          |
| `schedule`         | No       | [WorkflowScheduleSource](protocol.md#workflowschedulesource)             | Present only on scheduled published runs.                                |
| `sequence`         | Yes      | `string`                                                                 |                                                                          |
| `status`           | Yes      | [WorkflowRunStatus](protocol.md#workflowrunstatus)                       |                                                                          |
| `updatedAtMs`      | Yes      | `string`                                                                 |                                                                          |
| `workflowId`       | Yes      | `string`                                                                 |                                                                          |
| `workflowRevision` | Yes      | `string`                                                                 |                                                                          |

## WorkflowRunUsageRequest

Only the owned run and a bounded page may be selected by a client.

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `offset` | Yes      | `string` |             |
| `runId`  | Yes      | `string` |             |

## WorkflowRunUsageView

Mock executions cannot supply live metering evidence.

| Field                | Required | Type                                                                  | Description |
| -------------------- | -------- | --------------------------------------------------------------------- | ----------- |
| `entries`            | Yes      | `string`                                                              |             |
| `expiresAtMs`        | Yes      | `null,string`                                                         |             |
| `lastReportedAtMs`   | Yes      | `null,string`                                                         |             |
| `modelCount`         | Yes      | `string`                                                              |             |
| `models`             | Yes      | Array of [WorkflowModelUsage](protocol.md#workflowmodelusage)         |             |
| `next`               | Yes      | `null,string`                                                         |             |
| `observedAtMs`       | Yes      | `string`                                                              |             |
| `offset`             | Yes      | `string`                                                              |             |
| `pricing`            | Yes      | Array of [WorkflowSpendingBucket](protocol.md#workflowspendingbucket) |             |
| `reportedMicrocents` | Yes      | `null,string`                                                         |             |
| `retainedFromMs`     | Yes      | `null,string`                                                         |             |
| `revision`           | Yes      | `string`                                                              |             |
| `runId`              | Yes      | `string`                                                              |             |
| `simulated`          | Yes      | `boolean`                                                             |             |
| `workflowId`         | Yes      | `string`                                                              |             |

## WorkflowSaveRequest

Command identity and expected revision serve different purposes.

| Field              | Required | Type                                       | Description |
| ------------------ | -------- | ------------------------------------------ | ----------- |
| `commandId`        | Yes      | `string`                                   |             |
| `expectedRevision` | Yes      | `string`                                   |             |
| `patch`            | Yes      | [WorkflowPatch](protocol.md#workflowpatch) |             |
| `workflowId`       | Yes      | `string`                                   |             |

## WorkflowScheduleCommand

Configuration revision is independent of execution progress.

| Field              | Required | Type     | Description |
| ------------------ | -------- | -------- | ----------- |
| `commandId`        | Yes      | `string` |             |
| `expectedRevision` | Yes      | `string` |             |
| `workflowId`       | Yes      | `string` |             |

## WorkflowScheduleConfiguration

Activation binds saved timing rules to one publication and its submitted input.

| Field               | Required | Type                                                         | Description |
| ------------------- | -------- | ------------------------------------------------------------ | ----------- |
| `catchUpLimit`      | Yes      | `number`                                                     |             |
| `input`             | Yes      | [WorkflowObject](protocol.md#workflowobject)                 |             |
| `lateGraceMs`       | Yes      | `string`                                                     |             |
| `maxConcurrentRuns` | Yes      | `number`                                                     |             |
| `missed`            | Yes      | [WorkflowScheduleMissed](protocol.md#workflowschedulemissed) |             |
| `publicationId`     | Yes      | `string`                                                     |             |
| `timing`            | Yes      | [WorkflowScheduleTiming](protocol.md#workflowscheduletiming) |             |

## WorkflowScheduleEnable

Explicit enable or replace command containing the reviewed complete configuration.

| Field              | Required | Type                                                                       | Description |
| ------------------ | -------- | -------------------------------------------------------------------------- | ----------- |
| `commandId`        | Yes      | `string`                                                                   |             |
| `configuration`    | Yes      | [WorkflowScheduleConfiguration](protocol.md#workflowscheduleconfiguration) |             |
| `expectedRevision` | Yes      | `string`                                                                   |             |
| `workflowId`       | Yes      | `string`                                                                   |             |

## WorkflowScheduleEvent

Concise automation status evidence.

| Field          | Required | Type                                     | Description |
| -------------- | -------- | ---------------------------------------- | ----------- |
| `atMs`         | Yes      | `string`                                 |             |
| `message`      | Yes      | `null,string`                            |             |
| `occurrenceMs` | Yes      | `string`                                 |             |
| `outcome`      | Yes      | `"accepted"` / `"blocked"` / `"skipped"` |             |
| `runId`        | Yes      | `null,string`                            |             |

## WorkflowScheduleMissed

Late occurrences are skipped, coalesced into the latest, or replayed up to a configured cap.

Type: `"catch-up"` / `"latest"` / `"skip"`.

## WorkflowSchedulePreview

Preview performs no activation, storage mutation or run preparation.

| Field     | Required | Type                                                         | Description |
| --------- | -------- | ------------------------------------------------------------ | ----------- |
| `afterMs` | Yes      | `string`                                                     |             |
| `timing`  | Yes      | [WorkflowScheduleTiming](protocol.md#workflowscheduletiming) |             |

## WorkflowScheduleRead

Owner-scoped current automation state.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `workflowId` | Yes      | `string` |             |

## WorkflowScheduleSource

Immutable provenance included in both the execution snapshot and run metadata.

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `occurrenceMs` | Yes      | `string` |             |
| `revision`     | Yes      | `string` |             |

## WorkflowScheduleStatus

UI and runtime share these lifecycle meanings.

Type: `"blocked"` / `"complete"` / `"disabled"` / `"enabled"`.

## WorkflowScheduleTiming

Supported timing forms, with inclusive start and end instants.

Variant 1: [WorkflowCalendarTiming](protocol.md#workflowcalendartiming)

| Field         | Required | Type                                                     | Description |
| ------------- | -------- | -------------------------------------------------------- | ----------- |
| `endDate`     | Yes      | `null,string`                                            |             |
| `exceptDates` | Yes      | Array of `string`                                        |             |
| `fold`        | Yes      | [WorkflowCalendarFold](protocol.md#workflowcalendarfold) |             |
| `gap`         | Yes      | [WorkflowCalendarGap](protocol.md#workflowcalendargap)   |             |
| `kind`        | Yes      | `"calendar"`                                             |             |
| `startDate`   | Yes      | `string`                                                 |             |
| `time`        | Yes      | `string`                                                 |             |
| `timeZone`    | Yes      | `string`                                                 |             |
| `weekdays`    | Yes      | Array of `number`                                        |             |

Variant 2: [WorkflowIntervalTiming](protocol.md#workflowintervaltiming)

| Field        | Required | Type          | Description |
| ------------ | -------- | ------------- | ----------- |
| `endAtMs`    | Yes      | `null,string` |             |
| `intervalMs` | Yes      | `string`      |             |
| `kind`       | Yes      | `"interval"`  |             |
| `startAtMs`  | Yes      | `string`      |             |

Variant 3: [WorkflowOnceTiming](protocol.md#workflowoncetiming)

| Field  | Required | Type     | Description |
| ------ | -------- | -------- | ----------- |
| `atMs` | Yes      | `string` |             |
| `kind` | Yes      | `"once"` |             |

Variant 4: [WorkflowCompletionTiming](protocol.md#workflowcompletiontiming)

| Field        | Required | Type                 | Description |
| ------------ | -------- | -------------------- | ----------- |
| `endAtMs`    | Yes      | `null,string`        |             |
| `intervalMs` | Yes      | `string`             |             |
| `kind`       | Yes      | `"after-completion"` |             |
| `startAtMs`  | Yes      | `string`             |             |

## WorkflowScheduleView

No graph, outputs, credentials or unbounded event collections are embedded here.

| Field                | Required | Type                                                                       | Description |
| -------------------- | -------- | -------------------------------------------------------------------------- | ----------- |
| `configuration`      | Yes      | [WorkflowScheduleConfiguration](protocol.md#workflowscheduleconfiguration) |             |
| `last`               | Yes      | [WorkflowScheduleEvent](protocol.md#workflowscheduleevent) / `null`        |             |
| `nextAtMs`           | Yes      | `null,string`                                                              |             |
| `pendingCount`       | Yes      | `number`                                                                   |             |
| `revision`           | Yes      | `string`                                                                   |             |
| `skippedOccurrences` | Yes      | `string`                                                                   |             |
| `status`             | Yes      | [WorkflowScheduleStatus](protocol.md#workflowschedulestatus)               |             |
| `updatedAtMs`        | Yes      | `string`                                                                   |             |
| `workflowId`         | Yes      | `string`                                                                   |             |

## WorkflowSpendingBasis

Legacy reporting never infers a pricing classification from its amount.

Type: `"adjustment"` / `"estimate"` / `"included-estimate"` / `"included-unpriced"` / `"legacy"` / `"local"` / `"unpriced"` / `"wallet"`.

## WorkflowSpendingBucket

Exact subtotal and usage count; buckets partition the recorded amount, never add another charge.

| Field        | Required | Type                                                       | Description |
| ------------ | -------- | ---------------------------------------------------------- | ----------- |
| `basis`      | Yes      | [WorkflowSpendingBasis](protocol.md#workflowspendingbasis) |             |
| `entries`    | Yes      | `string`                                                   |             |
| `microcents` | Yes      | `string`                                                   |             |

## WorkflowStepOrigin

An execution instance points back to the immutable authored card and its collection item.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `itemIndex` | Yes      | `number` |             |
| `loopId`    | Yes      | `string` |             |
| `nodeId`    | Yes      | `string` |             |

## WorkflowStepStatus

Type: `"cancelled"` / `"failed"` / `"interrupted"` / `"running"` / `"skipped"` / `"succeeded"` / `"uncertain"` / `"waiting"`.

## WorkflowStepUsageIdentity

| Field          | Required | Type                                                                    | Description |
| -------------- | -------- | ----------------------------------------------------------------------- | ----------- |
| `attempt`      | Yes      | `string`                                                                |             |
| `invocationId` | Yes      | `string`                                                                |             |
| `nodeId`       | Yes      | `string`                                                                |             |
| `origin`       | Yes      | [WorkflowStepUsageOrigin](protocol.md#workflowstepusageorigin) / `null` |             |

## WorkflowStepUsageOrigin

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `itemIndex` | Yes      | `string` |             |
| `loopId`    | Yes      | `string` |             |
| `nodeId`    | Yes      | `string` |             |

## WorkflowStepView

Exposes step metadata without embedding potentially large result payloads.

| Field          | Required | Type                                                 | Description                                                                              |
| -------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `attempt`      | Yes      | `number`                                             |                                                                                          |
| `component`    | Yes      | `string`                                             |                                                                                          |
| `finishedAtMs` | Yes      | `null,string`                                        |                                                                                          |
| `hasResult`    | Yes      | `boolean`                                            |                                                                                          |
| `invocationId` | Yes      | `string`                                             |                                                                                          |
| `label`        | Yes      | `string`                                             |                                                                                          |
| `message`      | Yes      | `null,string`                                        |                                                                                          |
| `nodeId`       | Yes      | `string`                                             |                                                                                          |
| `origin`       | No       | [WorkflowStepOrigin](protocol.md#workflowsteporigin) | Only repeated instances carry this provenance; nodeId identifies the execution instance. |
| `startedAtMs`  | Yes      | `string`                                             |                                                                                          |
| `status`       | Yes      | [WorkflowStepStatus](protocol.md#workflowstepstatus) |                                                                                          |
| `wakeAtMs`     | No       | `string`                                             | Persisted timer target; retained after completion or cancellation as timing evidence.    |

## WorkflowSummary

Small management projection; contains no graph, prompts, or run histories.

| Field         | Required | Type                                                                     | Description                                                              |
| ------------- | -------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `createdAtMs` | Yes      | `string`                                                                 |                                                                          |
| `details`     | Yes      | [WorkflowDetails](protocol.md#workflowdetails)                           |                                                                          |
| `edgeCount`   | Yes      | `number`                                                                 |                                                                          |
| `nodeCount`   | Yes      | `number`                                                                 |                                                                          |
| `publication` | No       | [WorkflowPublicationReference](protocol.md#workflowpublicationreference) | Immutable publication identity, distinct from its source draft revision. |
| `revision`    | Yes      | `string`                                                                 |                                                                          |
| `updatedAtMs` | Yes      | `string`                                                                 |                                                                          |
| `workflowId`  | Yes      | `string`                                                                 |                                                                          |

## WorkflowTerminalCommand

| Field              | Required | Type                                         | Description |
| ------------------ | -------- | -------------------------------------------- | ----------- |
| `action`           | Yes      | [TerminalAction](protocol.md#terminalaction) |             |
| `cols`             | Yes      | `number`                                     |             |
| `commandId`        | Yes      | `string`                                     |             |
| `expectedRevision` | Yes      | `string`                                     |             |
| `input`            | Yes      | `string`                                     |             |
| `rows`             | Yes      | `number`                                     |             |
| `sessionId`        | Yes      | `string`                                     |             |

## WorkflowTerminalRequest

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `sessionId` | Yes      | `string` |             |

## WorkflowTerminalSnapshot

| Field             | Required | Type                                                   | Description |
| ----------------- | -------- | ------------------------------------------------------ | ----------- |
| `application`     | Yes      | [WorkflowApplication](protocol.md#workflowapplication) |             |
| `cols`            | Yes      | `number`                                               |             |
| `commandId`       | Yes      | `string`                                               |             |
| `commandRevision` | Yes      | `string`                                               |             |
| `error`           | Yes      | `string`                                               |             |
| `revision`        | Yes      | `string`                                               |             |
| `rows`            | Yes      | `number`                                               |             |
| `screen`          | Yes      | `string`                                               |             |
| `sessionId`       | Yes      | `string`                                               |             |
| `setup`           | Yes      | `boolean`                                              |             |
| `status`          | Yes      | [TerminalStatus](protocol.md#terminalstatus)           |             |

## WorkflowUsageDimension

Alternative partitions of the same reported usage.

Type: `"agents"` / `"steps"`.

## WorkflowUsageDimensions

Exact counters; missing dimensions were not reported.

| Field               | Required | Type     | Description |
| ------------------- | -------- | -------- | ----------- |
| `cachedInputTokens` | No       | `string` |             |
| `inputTokens`       | No       | `string` |             |
| `outputTokens`      | No       | `string` |             |
| `reasoningTokens`   | No       | `string` |             |

## WorkflowUsageGroup

| Field              | Required | Type                                                                                                                                      | Description |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `entries`          | Yes      | `string`                                                                                                                                  |             |
| `expiresAtMs`      | Yes      | `string`                                                                                                                                  |             |
| `id`               | Yes      | `string`                                                                                                                                  |             |
| `identity`         | Yes      | [WorkflowStepUsageIdentity](protocol.md#workflowstepusageidentity) / [WorkflowAgentUsageIdentity](protocol.md#workflowagentusageidentity) |             |
| `lastReportedAtMs` | Yes      | `string`                                                                                                                                  |             |
| `microcents`       | Yes      | `string`                                                                                                                                  |             |
| `pricing`          | Yes      | Array of [WorkflowSpendingBucket](protocol.md#workflowspendingbucket)                                                                     |             |

## WorkflowUsageGroupLabel

Labels come from the owned immutable graph; they do not choose the billing partition.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `component` | Yes      | `string` |             |
| `id`        | Yes      | `string` |             |
| `label`     | Yes      | `string` |             |

## WorkflowValidateRequest

Authoritative validation always names one immutable saved revision.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `revision`   | Yes      | `string` |             |
| `workflowId` | Yes      | `string` |             |

## WorkflowValue

Large integers and financial values must use decimal strings.

Variant 1: [WorkflowObject](protocol.md#workflowobject)

Type: Dictionary.

Variant 2: Array of [WorkflowValue](protocol.md#workflowvalue)

Type: Array of [WorkflowValue](protocol.md#workflowvalue).

Variant 3: `null,string,number,boolean`

Type: `null,string,number,boolean`.

## Workspace

An isolated place an agent works.

| Field         | Required | Type                                                                                    | Description                                                                                   |
| ------------- | -------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `createdAt`   | Yes      | `number`                                                                                |                                                                                               |
| `destroyedAt` | No       | `number`                                                                                | When the tree was removed. Present exactly on a tombstone.                                    |
| `expiresAt`   | No       | `number`                                                                                | When an ephemeral workspace should be reaped.                                                 |
| `extraRoots`  | No       | Array of `string`                                                                       | Additional roots tools may also reach (a shared cache, a read-only reference checkout).       |
| `id`          | Yes      | `string`                                                                                |                                                                                               |
| `kind`        | Yes      | [WorkspaceKind](protocol.md#workspacekind)                                              |                                                                                               |
| `leases`      | No       | Array of [WorkspaceLeaseRecord](protocol.md#workspaceleaserecord)                       | Runs currently holding it. Read through {@link activeLeases}, which drops expired ones.       |
| `name`        | Yes      | `string`                                                                                | A human name, e.g. `acme-migration`.                                                          |
| `owner`       | No       | [WorkspaceOwner](protocol.md#workspaceowner)                                            | Who may use it. Absent means the deployment's default policy decides.                         |
| `quota`       | No       | [WorkspaceQuota](protocol.md#workspacequota)                                            | Ceilings for this workspace's contents. Absent means unbounded — see {@link WorkspaceQuota}.  |
| `root`        | Yes      | `string`                                                                                | The absolute root. Every tool bound to this workspace is confined here.                       |
| `state`       | No       | `"active"` / `"creating"` / `"destroyed"` / `"destroying"` / `"draining"` / `"expired"` | Where it is in its lifecycle.                                                                 |
| `tags`        | No       | Array of `string`                                                                       | Free-form labels.                                                                             |
| `updatedAt`   | Yes      | `number`                                                                                |                                                                                               |
| `usage`       | No       | [WorkspaceUsage](protocol.md#workspaceusage)                                            | Last known contents. Read through {@link usageOf}, which defaults a legacy record to zero.    |
| `worktree`    | No       | Object (fields below)                                                                   | Set when this workspace IS a git worktree, so destroy unregisters it rather than deleting it. |

**worktree**

| Field                   | Required | Type      | Description |
| ----------------------- | -------- | --------- | ----------- |
| `branch`                | Yes      | `string`  |             |
| `deleteBranchOnDestroy` | No       | `boolean` |             |
| `repo`                  | Yes      | `string`  |             |

## WorkspaceCreateParams

What `workspaces.create` is asked for. Narrower than `CreateWorkspaceInput` — see the handler.

| Field   | Required | Type              | Description |
| ------- | -------- | ----------------- | ----------- |
| `name`  | Yes      | `string`          |             |
| `tags`  | No       | Array of `string` |             |
| `ttlMs` | No       | `number`          |             |

## WorkspaceDescription

A workspace plus the lifecycle facts a caller has to see to make a decision about it.

| Field         | Required | Type                                                              | Description                                                                                   |
| ------------- | -------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `createdAt`   | Yes      | `number`                                                          |                                                                                               |
| `destroyedAt` | No       | `number`                                                          | When the tree was removed. Present exactly on a tombstone.                                    |
| `expiresAt`   | No       | `number`                                                          | When an ephemeral workspace should be reaped.                                                 |
| `extraRoots`  | No       | Array of `string`                                                 | Additional roots tools may also reach (a shared cache, a read-only reference checkout).       |
| `id`          | Yes      | `string`                                                          |                                                                                               |
| `kind`        | Yes      | [WorkspaceKind](protocol.md#workspacekind)                        |                                                                                               |
| `leases`      | Yes      | Array of [WorkspaceLeaseRecord](protocol.md#workspaceleaserecord) | Only the leases still counting; expired ones are not shown because they hold nothing.         |
| `name`        | Yes      | `string`                                                          | A human name, e.g. `acme-migration`.                                                          |
| `owner`       | No       | [WorkspaceOwner](protocol.md#workspaceowner)                      | Who may use it. Absent means the deployment's default policy decides.                         |
| `quota`       | No       | [WorkspaceQuota](protocol.md#workspacequota)                      | Ceilings for this workspace's contents. Absent means unbounded — see {@link WorkspaceQuota}.  |
| `root`        | Yes      | `string`                                                          | The absolute root. Every tool bound to this workspace is confined here.                       |
| `state`       | Yes      | [WorkspaceState](protocol.md#workspacestate)                      | Where it is in its lifecycle.                                                                 |
| `tags`        | No       | Array of `string`                                                 | Free-form labels.                                                                             |
| `updatedAt`   | Yes      | `number`                                                          |                                                                                               |
| `usage`       | Yes      | [WorkspaceUsage](protocol.md#workspaceusage)                      | Last known contents. Read through {@link usageOf}, which defaults a legacy record to zero.    |
| `worktree`    | No       | Object (fields below)                                             | Set when this workspace IS a git worktree, so destroy unregisters it rather than deleting it. |

**worktree**

| Field                   | Required | Type      | Description |
| ----------------------- | -------- | --------- | ----------- |
| `branch`                | Yes      | `string`  |             |
| `deleteBranchOnDestroy` | No       | `boolean` |             |
| `repo`                  | Yes      | `string`  |             |

## WorkspaceDestroyParams

What `workspaces.destroy` is asked for.

| Field   | Required | Type      | Description                                                                   |
| ------- | -------- | --------- | ----------------------------------------------------------------------------- |
| `force` | No       | `boolean` | Overrides live leases. Recorded in the audit trail with the runs it overrode. |
| `id`    | Yes      | `string`  |                                                                               |

## WorkspaceKind

How a workspace came to exist, which decides how it is cleaned up.

Type: `"attached"` / `"ephemeral"` / `"managed"`.

## WorkspaceLeaseRecord

One run's claim on a workspace, as stored in the record.

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `acquiredAt` | Yes      | `number` |             |
| `expiresAt`  | Yes      | `number` |             |
| `runId`      | Yes      | `string` |             |

## WorkspaceOwner

Who a workspace belongs to.

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `agentId`   | No       | `string` |             |
| `projectId` | No       | `string` |             |
| `userId`    | No       | `string` |             |

## WorkspaceQuota

The ceilings a workspace's contents may not pass.

| Field      | Required | Type     | Description                                                                                     |
| ---------- | -------- | -------- | ----------------------------------------------------------------------------------------------- |
| `maxBytes` | No       | `number` | Byte ceiling for the tree. Absent means unbounded.                                              |
| `maxFiles` | No       | `number` | File-count ceiling. Absent means unbounded — a million tiny files is invisible to a byte quota. |

## WorkspaceState

Where a workspace is in its life.

Type: `"active"` / `"creating"` / `"destroyed"` / `"destroying"` / `"draining"` / `"expired"`.

## WorkspaceUsage

What a workspace currently holds, and when that was last measured against the disk.

| Field          | Required | Type     | Description                                                                              |
| -------------- | -------- | -------- | ---------------------------------------------------------------------------------------- |
| `bytes`        | Yes      | `number` |                                                                                          |
| `files`        | Yes      | `number` |                                                                                          |
| `reconciledAt` | Yes      | `number` | When a full walk last corrected these numbers. `0` means never — the counters are then a |
