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

| Field            | Required | Type                                                        | Description                                                              |
| ---------------- | -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `agentId`        | No       | `string`                                                    |                                                                          |
| `attachments`    | No       | Array of [InboundAttachment](protocol.md#inboundattachment) | User-authored image, video, document, and text blocks, in display order. |
| `conversationId` | No       | `string`                                                    | Continues an existing conversation.                                      |
| `cwd`            | No       | `string`                                                    | Where tools operate.                                                     |
| `message`        | Yes      | `string`                                                    |                                                                          |
| `userId`         | No       | `string`                                                    | The principal the turn is billed and authorized as.                      |

## AskResult

What a finished turn produced.

| Field            | Required | Type                                                            | Description                                                                         |
| ---------------- | -------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `attachments`    | No       | Array of [DeliveredAttachment](protocol.md#deliveredattachment) | Delivered files; IDs match attachment events so clients can deduplicate.            |
| `conversationId` | Yes      | `null,string`                                                   |                                                                                     |
| `finishReason`   | Yes      | [FinishReason](protocol.md#finishreason)                        |                                                                                     |
| `iterations`     | Yes      | `number`                                                        |                                                                                     |
| `reasoning`      | Yes      | `string`                                                        |                                                                                     |
| `sessionKey`     | Yes      | `string`                                                        | The session id this turn was filed under — `sessions.get`'s id, not the provider's. |
| `text`           | Yes      | `string`                                                        |                                                                                     |
| `turnId`         | Yes      | `string`                                                        |                                                                                     |
| `usage`          | Yes      | [TokenUsage](protocol.md#tokenusage)                            |                                                                                     |

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

| Field      | Required | Type                                                   | Description                                                     |
| ---------- | -------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| `id`       | Yes      | `string`                                               | Stable per install, so a reconnect is recognisable in the logs. |
| `mode`     | Yes      | `"automation"` / `"cli"` / `"node"` / `"tui"` / `"ui"` |                                                                 |
| `platform` | Yes      | `string`                                               |                                                                 |
| `version`  | Yes      | `string`                                               |                                                                 |

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
| `content`              | Yes      | Array of [ContentBlock](protocol.md#contentblock) / `string` |                                                                       |
| `inspectedMediaSha256` | No       | Array of `string`                                            | Host-authored observation evidence; never inferred from result prose. |
| `isError`              | No       | `boolean`                                                    |                                                                       |
| `toolUseId`            | Yes      | `string`                                                     |                                                                       |
| `type`                 | Yes      | `"tool-result"`                                              | The outcome of a tool call, sent back on the next turn.               |

## ConversationSurface

Where a conversation is happening.

| Field           | Required | Type                                                          | Description                                                                                  |
| --------------- | -------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `channel`       | Yes      | `string`                                                      | The channel id: `telegram`, `slack`, `discord`, `cli`, `gateway`, …                          |
| `formatting`    | No       | [SurfaceFormatting](protocol.md#surfaceformatting)            | What the platform can render, so the model writes for it rather than for a web page.         |
| `kind`          | Yes      | [SurfaceKind](protocol.md#surfacekind)                        |                                                                                              |
| `lenders`       | No       | Array of [MemoryLender](protocol.md#memorylender)             | Who lends this room their memory. Not rendered — what the agent recalls is not something     |
| `participants`  | No       | Array of [SurfaceParticipant](protocol.md#surfaceparticipant) | Everyone known to be in the conversation. For a DM, the one person.                          |
| `personalPlace` | No       | `boolean`                                                     | A user-installed app invocation whose files belong to this user in this specific place.      |
| `roomId`        | Yes      | `string`                                                      | The stable id of the room or DM on that channel — the router's chat id, not the session key. |
| `roomTitle`     | No       | `string`                                                      | The room's title, when the platform has one.                                                 |
| `speaker`       | No       | [SurfaceParticipant](protocol.md#surfaceparticipant)          | Who sent the message this turn answers. Per turn, so it never lands in the cached band.      |

## CreditScope

The scopes a balance or budget can be defined over.

Type: `"agent"` / `"conversation"` / `"global"` / `"project"` / `"user"`.

## CreditSummary

Spend totals over some slice of the ledger.

| Field               | Required | Type                                                 | Description                                                                 |
| ------------------- | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `byKind`            | Yes      | [Recordstringnumber](protocol.md#recordstringnumber) | Totals split by charge kind, so "how much of this was voice" is answerable. |
| `byModel`           | Yes      | [Recordstringnumber](protocol.md#recordstringnumber) | Totals split by model.                                                      |
| `cachedInputTokens` | Yes      | `number`                                             |                                                                             |
| `entries`           | Yes      | `number`                                             |                                                                             |
| `from`              | Yes      | `number`                                             |                                                                             |
| `inputTokens`       | Yes      | `number`                                             |                                                                             |
| `microcents`        | Yes      | `number`                                             |                                                                             |
| `outputTokens`      | Yes      | `number`                                             |                                                                             |
| `scope`             | Yes      | [CreditScope](protocol.md#creditscope)               |                                                                             |
| `scopeId`           | Yes      | `string`                                             |                                                                             |
| `to`                | Yes      | `number`                                             |                                                                             |

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

Type: `"aborted"` / `"auth"` / `"budget-exhausted"` / `"config"` / `"context-overflow"` / `"denied"` / `"forbidden"` / `"internal"` / `"invalid-request"` / `"network"` / `"not-found"` / `"protocol"` / `"rate-limit"` / `"timeout"` / `"tool-execution"` / `"tool-input"` / `"upstream"`.

## FinishReason

Why a turn stopped.

Type: `"aborted"` / `"error"` / `"length"` / `"refusal"` / `"stop"` / `"stop-sequence"` / `"tool-use"` / `"unknown"`.

## Session

Collapses the required/optional intersection into one object type.

| Field             | Required | Type                                                   | Description |
| ----------------- | -------- | ------------------------------------------------------ | ----------- |
| `agentId`         | Yes      | `string`                                               |             |
| `conversationId`  | Yes      | `null,string`                                          |             |
| `createdAt`       | Yes      | `number`                                               |             |
| `id`              | Yes      | `string`                                               |             |
| `messageCount`    | Yes      | `number`                                               |             |
| `participants`    | Yes      | Array of `string`                                      |             |
| `projectId`       | No       | `string`                                               |             |
| `resumeCwd`       | No       | `string`                                               |             |
| `resumeEligible`  | No       | `boolean`                                              |             |
| `resumePending`   | No       | `boolean`                                              |             |
| `resumePrincipal` | No       | [ToolPrincipal](protocol.md#toolprincipal)             |             |
| `resumeSurface`   | No       | [ConversationSurface](protocol.md#conversationsurface) |             |
| `title`           | Yes      | `null,string`                                          |             |
| `turnOpen`        | No       | `boolean`                                              |             |
| `updatedAt`       | Yes      | `number`                                               |             |
| `usage`           | Yes      | [TokenUsage](protocol.md#tokenusage)                   |             |
| `userId`          | No       | `string`                                               |             |
| `workspaceId`     | No       | `string`                                               |             |

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

| Field          | Required | Type                                               | Description                                                                    |
| -------------- | -------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| `attachments`  | No       | `true`                                             | User media attachments are validated and forwarded to the agent.               |
| `binaryMedia`  | No       | `true`                                             | NXMD frames carry outbound file bytes; JSON results contain matching metadata. |
| `events`       | Yes      | Array of `string`                                  |                                                                                |
| `methodScopes` | Yes      | [RecordstringScope](protocol.md#recordstringscope) | The scope each method requires.                                                |
| `methods`      | Yes      | Array of `string`                                  |                                                                                |

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

| Field                          | Required | Type                  | Description |
| ------------------------------ | -------- | --------------------- | ----------- |
| `accounts.create`              | Yes      | Object (fields below) |             |
| `accounts.list`                | Yes      | Object (fields below) |             |
| `accounts.remove`              | Yes      | Object (fields below) |             |
| `accounts.usage`               | Yes      | Object (fields below) |             |
| `agent.ask`                    | Yes      | Object (fields below) |             |
| `agent.stream`                 | Yes      | Object (fields below) |             |
| `agents.define`                | Yes      | Object (fields below) |             |
| `agents.list`                  | Yes      | Object (fields below) |             |
| `approvals.list`               | Yes      | Object (fields below) |             |
| `approvals.resolve`            | Yes      | Object (fields below) |             |
| `channels.deadLetters.list`    | Yes      | Object (fields below) |             |
| `channels.list`                | Yes      | Object (fields below) |             |
| `channels.status`              | Yes      | Object (fields below) |             |
| `config.get`                   | Yes      | Object (fields below) |             |
| `config.set`                   | Yes      | Object (fields below) |             |
| `config.unset`                 | Yes      | Object (fields below) |             |
| `connect`                      | Yes      | Object (fields below) |             |
| `credit.budgets`               | Yes      | Object (fields below) |             |
| `credit.removeBudget`          | Yes      | Object (fields below) |             |
| `credit.setBudget`             | Yes      | Object (fields below) |             |
| `credit.summary`               | Yes      | Object (fields below) |             |
| `data.upload.cancel`           | Yes      | Object (fields below) |             |
| `data.upload.chunk`            | Yes      | Object (fields below) |             |
| `data.upload.finish`           | Yes      | Object (fields below) |             |
| `data.upload.start`            | Yes      | Object (fields below) |             |
| `devices.approve`              | Yes      | Object (fields below) |             |
| `devices.list`                 | Yes      | Object (fields below) |             |
| `devices.reject`               | Yes      | Object (fields below) |             |
| `devices.revoke`               | Yes      | Object (fields below) |             |
| `health`                       | Yes      | Object (fields below) |             |
| `jobs.add`                     | Yes      | Object (fields below) |             |
| `jobs.list`                    | Yes      | Object (fields below) |             |
| `jobs.remove`                  | Yes      | Object (fields below) |             |
| `logs.tail`                    | Yes      | Object (fields below) |             |
| `media.acknowledge`            | Yes      | Object (fields below) |             |
| `roblox.credentials.remove`    | Yes      | Object (fields below) |             |
| `roblox.credentials.set`       | Yes      | Object (fields below) |             |
| `roblox.credentials.status`    | Yes      | Object (fields below) |             |
| `roblox.telemetry.funnel`      | Yes      | Object (fields below) |             |
| `roblox.telemetry.performance` | Yes      | Object (fields below) |             |
| `roblox.telemetry.projects`    | Yes      | Object (fields below) |             |
| `sessions.delete`              | Yes      | Object (fields below) |             |
| `sessions.download`            | Yes      | Object (fields below) |             |
| `sessions.files`               | Yes      | Object (fields below) |             |
| `sessions.get`                 | Yes      | Object (fields below) |             |
| `sessions.list`                | Yes      | Object (fields below) |             |
| `sessions.messages`            | Yes      | Object (fields below) |             |
| `sessions.subscribe`           | Yes      | Object (fields below) |             |
| `sessions.unsubscribe`         | Yes      | Object (fields below) |             |
| `shares.create`                | Yes      | Object (fields below) |             |
| `shares.list`                  | Yes      | Object (fields below) |             |
| `shares.remove`                | Yes      | Object (fields below) |             |
| `shares.setMember`             | Yes      | Object (fields below) |             |
| `tasks.cancel`                 | Yes      | Object (fields below) |             |
| `tasks.get`                    | Yes      | Object (fields below) |             |
| `tasks.list`                   | Yes      | Object (fields below) |             |
| `teams.create`                 | Yes      | Object (fields below) |             |
| `teams.list`                   | Yes      | Object (fields below) |             |
| `teams.remove`                 | Yes      | Object (fields below) |             |
| `teams.setMember`              | Yes      | Object (fields below) |             |
| `voice.audio`                  | Yes      | Object (fields below) |             |
| `voice.start`                  | Yes      | Object (fields below) |             |
| `voice.stop`                   | Yes      | Object (fields below) |             |
| `workspaces.create`            | Yes      | Object (fields below) |             |
| `workspaces.describe`          | Yes      | Object (fields below) |             |
| `workspaces.destroy`           | Yes      | Object (fields below) |             |
| `workspaces.list`              | Yes      | Object (fields below) |             |

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

**sessions.subscribe**

| Field    | Required | Type                                 | Description |
| -------- | -------- | ------------------------------------ | ----------- |
| `params` | Yes      | [SessionRef](protocol.md#sessionref) |             |
| `result` | Yes      | [OkResult](protocol.md#okresult)     |             |

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

Variant 2: [ReminderAction](protocol.md#reminderaction)

| Field            | Required | Type         | Description |
| ---------------- | -------- | ------------ | ----------- |
| `channelId`      | Yes      | `string`     |             |
| `conversationId` | Yes      | `string`     |             |
| `kind`           | Yes      | `"reminder"` |             |
| `text`           | Yes      | `string`     |             |
| `threadId`       | No       | `string`     |             |

Variant 3: Object (fields below)

| Field             | Required | Type           | Description                                                               |
| ----------------- | -------- | -------------- | ------------------------------------------------------------------------- |
| `agentId`         | Yes      | `string`       |                                                                           |
| `deliverTo`       | No       | `string`       | Where the reply goes: a channel id, or absent to leave it in the session. |
| `kind`            | Yes      | `"agent-turn"` | Run an agent turn with this prompt. The ordinary case.                    |
| `prompt`          | Yes      | `string`       |                                                                           |
| `silentWhenEmpty` | No       | `boolean`      | Suppress delivery when the turn produced nothing worth sending.           |

Variant 4: Object (fields below)

| Field                | Required | Type                                  | Description                                                    |
| -------------------- | -------- | ------------------------------------- | -------------------------------------------------------------- |
| `allowSelfLifecycle` | No       | `boolean`                             | Allow a command that stops or restarts Nexa itself.            |
| `command`            | Yes      | `string`                              |                                                                |
| `cwd`                | No       | `string`                              |                                                                |
| `elevation`          | No       | `"ask"` / `"full"` / `"off"` / `"on"` | Run this command outside the sandbox, if the policy allows it. |
| `kind`               | Yes      | `"shell"`                             | Run a shell command. Its stdout becomes the run's output.      |
| `timeoutMs`          | No       | `number`                              |                                                                |

Variant 5: Object (fields below)

| Field   | Required | Type                               | Description                                                 |
| ------- | -------- | ---------------------------------- | ----------------------------------------------------------- |
| `input` | Yes      | [JsonValue](protocol.md#jsonvalue) |                                                             |
| `kind`  | Yes      | `"tool"`                           | Call a registered tool directly, with no model in the loop. |
| `tool`  | Yes      | `string`                           |                                                             |

Variant 6: Object (fields below)

| Field     | Required | Type                               | Description                                  |
| --------- | -------- | ---------------------------------- | -------------------------------------------- |
| `event`   | Yes      | `string`                           |                                              |
| `kind`    | Yes      | `"event"`                          | Emit an event other subsystems subscribe to. |
| `payload` | No       | [JsonValue](protocol.md#jsonvalue) |                                              |

Variant 7: Object (fields below)

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

## MemoryLender

One person who lends a room what the agent remembers about them.

| Field      | Required | Type                  | Description                                                             |
| ---------- | -------- | --------------------- | ----------------------------------------------------------------------- |
| `id`       | Yes      | `string`              | The platform's stable id for them, as in {@link SurfaceParticipant.id}. |
| `mode`     | Yes      | `"all"` / `"partial"` |                                                                         |
| `subjects` | No       | Array of `string`     | For `partial`: the subjects lent.                                       |

## MessageRole

Who authored a message.

Type: `"assistant"` / `"system"` / `"tool"` / `"user"`.

## MisfirePolicy

What to do about occurrences that elapsed while the process was down.

Type: `"run-all"` / `"run-if-recent"` / `"run-once"` / `"skip"`.

## ModelMessage

One message in a conversation.

| Field     | Required | Type                                                         | Description |
| --------- | -------- | ------------------------------------------------------------ | ----------- |
| `content` | Yes      | Array of [ContentBlock](protocol.md#contentblock) / `string` |             |
| `role`    | Yes      | [MessageRole](protocol.md#messagerole)                       |             |

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

## OkResult

The answer to a method that only reports success.

| Field | Required | Type   | Description |
| ----- | -------- | ------ | ----------- |
| `ok`  | Yes      | `true` |             |

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

## ReasoningOptions

Reasoning configuration for a request.

| Field       | Required | Type                                                                          | Description                                                                  |
| ----------- | -------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `effort`    | No       | `"high"` / `"low"` / `"max"` / `"medium"` / `"minimal"` / `"off"` / `"xhigh"` | How hard the model should think before answering.                            |
| `include`   | No       | `boolean`                                                                     | Whether the reasoning trace should be streamed back at all.                  |
| `maxTokens` | No       | `number`                                                                      | A hard token budget for the reasoning trace, where the provider accepts one. |

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

## StreamAccepted

The acknowledgement of a streaming run.

| Field      | Required | Type     | Description                                                     |
| ---------- | -------- | -------- | --------------------------------------------------------------- |
| `runId`    | Yes      | `string` | The SERVER's name for the run, which is the one `tasks.*` uses. |
| `streamId` | Yes      | `string` |                                                                 |

## StreamParams

What one turn is asked for, when the client wants its events streamed.

| Field            | Required | Type                                                        | Description                                                              |
| ---------------- | -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `agentId`        | No       | `string`                                                    |                                                                          |
| `attachments`    | No       | Array of [InboundAttachment](protocol.md#inboundattachment) | User-authored image, video, document, and text blocks, in display order. |
| `conversationId` | No       | `string`                                                    | Continues an existing conversation.                                      |
| `cwd`            | No       | `string`                                                    | Where tools operate.                                                     |
| `message`        | Yes      | `string`                                                    |                                                                          |
| `streamId`       | No       | `string`                                                    | The stream's id, chosen by the CLIENT.                                   |
| `userId`         | No       | `string`                                                    | The principal the turn is billed and authorized as.                      |

## SurfaceFormatting

What the platform can render, so the model writes for it rather than for a web page.

| Field      | Required | Type                                                  | Description                                                                                |
| ---------- | -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `markup`   | Yes      | `"commonmark"` / `"plain"` / `"slack"` / `"telegram"` | The markup dialect the platform renders: CommonMark, Telegram's MarkdownV2 subset, Slack's |
| `maxChars` | No       | `number`                                              | The most characters one message may carry; longer replies are split by the channel.        |
| `tables`   | Yes      | `boolean`                                             | Whether tables render. On most chat platforms they do not.                                 |

## SurfaceKind

What kind of place the conversation is.

Type: `"direct"` / `"group"`.

## SurfaceParticipant

| Field         | Required | Type                                           | Description                                                                |
| ------------- | -------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `displayName` | Yes      | `string`                                       | What to call them. The label a group message is prefixed with.             |
| `id`          | Yes      | `string`                                       | The platform's stable id for them (a Telegram user id, a Slack member id). |
| `role`        | No       | `"admin"` / `"guest"` / `"member"` / `"owner"` | Their standing in this deployment, when the access registry knows it.      |

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

## ToolPrincipal

Who is making a tool call.

| Field                          | Required | Type                                                 | Description                                                                            |
| ------------------------------ | -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `agentId`                      | Yes      | `string`                                             |                                                                                        |
| `channelAccessLevel`           | No       | `"admin"` / `"denied"` / `"member"` / `"owner"`      | Authenticated channel role. Absent for the local operator/CLI.                         |
| `channelConversationId`        | No       | `string`                                             | Native channel carrying the active request, authenticated by the channel adapter.      |
| `channelGuildId`               | No       | `string`                                             | The server/guild containing this channel turn, when the platform supplies one.         |
| `channelPlatformAdministrator` | No       | `boolean`                                            | Native Discord Administrator authority, independently verified by the Discord adapter. |
| `channelPlatformRoleIds`       | No       | Array of `string`                                    | Native Discord role ids used for tool-time authority verification.                     |
| `channelPlatformUserId`        | No       | `string`                                             | Native channel account id, retained separately from the mapped Nexa principal id.      |
| `channelThreadId`              | No       | `string`                                             | Native thread carrying the active request, when distinct from its parent channel.      |
| `conversationId`               | No       | `string`                                             |                                                                                        |
| `machineId`                    | No       | `string`                                             | The machine this caller's work runs on, when their account names one.                  |
| `maxRisk`                      | No       | `"destructive"` / `"execute"` / `"read"` / `"write"` | The highest risk this caller may reach, whatever the deployment ceiling allows.        |
| `projectId`                    | No       | `string`                                             |                                                                                        |
| `userId`                       | No       | `string`                                             |                                                                                        |

## ToolProgress

| Field        | Required | Type                                                         | Description                                                                       |
| ------------ | -------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `attachment` | No       | [ToolProgressAttachment](protocol.md#toolprogressattachment) | Transient visual progress for the active chat; never persisted in the transcript. |
| `fraction`   | No       | `number`                                                     | Completed fraction in `[0, 1]`, when the tool can know it.                        |
| `status`     | No       | `string`                                                     | A one-line status, e.g. `running tests…`.                                         |
| `text`       | No       | `string`                                                     | Text appended to the live view.                                                   |

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
| `content`              | Yes      | Array of [ContentBlock](protocol.md#contentblock) / `string`                            | What the model sees. A string for the ordinary case; blocks when the result carries an image |
| `continuation`         | No       | `string`                                                                                | The exact call that would show the next page of this result, written by the tool.            |
| `deliveredMedia`       | No       | `boolean`                                                                               | Host receipt: true only after the attachment channel send resolves.                          |
| `deliveredText`        | No       | `string`                                                                                | Text this tool already delivered to the user outside the agent's eventual reply.             |
| `deliveryReceipt`      | No       | [DeliveryReceipt](protocol.md#deliveryreceipt)                                          | Exact submitted artifact and acknowledged destination, produced by the delivery adapter.     |
| `deliveryReceipts`     | No       | Array of [DeliveryReceipt](protocol.md#deliveryreceipt)                                 | One authoritative receipt per file in a multi-attachment delivery.                           |
| `display`              | No       | Array of [JsonValue](protocol.md#jsonvalue) / Dictionary / `null,string,number,boolean` | Structured data for a UI that renders this tool specially (a diff view, a file tree).        |
| `inspectedMediaSha256` | No       | Array of `string`                                                                       | Original image digests successfully inspected by a vision route.                             |
| `label`                | No       | `string`                                                                                | A short human label for a UI, e.g. `read 412 lines from src/main.ts`.                        |
| `protocolPayload`      | No       | `boolean`                                                                               | Preserve the string byte-for-byte instead of applying the registry's display-oriented        |
| `question`             | No       | [ToolQuestion](protocol.md#toolquestion)                                                | A question handed back to the conversation surface for native delivery.                      |
| `source`               | No       | `"external-model"` / `"local"` / `"model"` / `"network"`                                | Where the content came from, for taint tracking.                                             |
| `status`               | Yes      | [ToolStatus](protocol.md#toolstatus)                                                    |                                                                                              |
| `terminate`            | No       | `boolean`                                                                               | Whether this result should END the turn rather than feed back into the model.                |
| `truncation`           | No       | [TruncationRecord](protocol.md#truncationrecord)                                        | What the registry's backstop removed, when it removed anything.                              |

## ToolStatus

What a tool did, from the agent's point of view.

Type: `"aborted"` / `"denied"` / `"error"` / `"ok"`.

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

| Field       | Required | Type                               | Description                                                       |
| ----------- | -------- | ---------------------------------- | ----------------------------------------------------------------- |
| `error`     | No       | [WireError](protocol.md#wireerror) | An error, in the shape a client can act on without parsing prose. |
| `ok`        | Yes      | `boolean`                          |                                                                   |
| `result`    | No       | [AskResult](protocol.md#askresult) | What a finished turn produced.                                    |
| `sessionId` | No       | `string`                           |                                                                   |
| `streamId`  | Yes      | `string`                           |                                                                   |

## TurnEventData

The payload of a {@link GATEWAY_EVENTS.TurnEvent} event.

| Field       | Required | Type                                       | Description |
| ----------- | -------- | ------------------------------------------ | ----------- |
| `event`     | Yes      | [WireTurnEvent](protocol.md#wireturnevent) |             |
| `sessionId` | No       | `string`                                   |             |
| `streamId`  | Yes      | `string`                                   |             |

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
