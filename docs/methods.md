# RPC reference

All 54 protocol methods. `connect` is managed by `NexaClient.connect`; the remaining 53 use `client.call(Method.Name, params)`. Examples are independent templates; replace identifiers and values before calling. Administrative and destructive methods change server state. Availability depends on the authenticated identity, scopes, and server policy.

- [accounts.create](#accounts-create)
- [accounts.list](#accounts-list)
- [accounts.remove](#accounts-remove)
- [accounts.usage](#accounts-usage)
- [agent.ask](#agent-ask)
- [agent.stream](#agent-stream)
- [agents.define](#agents-define)
- [agents.list](#agents-list)
- [approvals.list](#approvals-list)
- [approvals.resolve](#approvals-resolve)
- [channels.deadLetters.list](#channels-deadLetters-list)
- [channels.list](#channels-list)
- [channels.status](#channels-status)
- [config.get](#config-get)
- [config.set](#config-set)
- [config.unset](#config-unset)
- [connect](#connect)
- [credit.budgets](#credit-budgets)
- [credit.removeBudget](#credit-removeBudget)
- [credit.setBudget](#credit-setBudget)
- [credit.summary](#credit-summary)
- [devices.approve](#devices-approve)
- [devices.list](#devices-list)
- [devices.reject](#devices-reject)
- [devices.revoke](#devices-revoke)
- [health](#health)
- [jobs.add](#jobs-add)
- [jobs.list](#jobs-list)
- [jobs.remove](#jobs-remove)
- [logs.tail](#logs-tail)
- [sessions.delete](#sessions-delete)
- [sessions.get](#sessions-get)
- [sessions.list](#sessions-list)
- [sessions.messages](#sessions-messages)
- [sessions.subscribe](#sessions-subscribe)
- [sessions.unsubscribe](#sessions-unsubscribe)
- [shares.create](#shares-create)
- [shares.list](#shares-list)
- [shares.remove](#shares-remove)
- [shares.setMember](#shares-setMember)
- [tasks.cancel](#tasks-cancel)
- [tasks.get](#tasks-get)
- [tasks.list](#tasks-list)
- [teams.create](#teams-create)
- [teams.list](#teams-list)
- [teams.remove](#teams-remove)
- [teams.setMember](#teams-setMember)
- [voice.audio](#voice-audio)
- [voice.start](#voice-start)
- [voice.stop](#voice-stop)
- [workspaces.create](#workspaces-create)
- [workspaces.describe](#workspaces-describe)
- [workspaces.destroy](#workspaces-destroy)
- [workspaces.list](#workspaces-list)

## accounts.create

```ts
await client.call(Method.AccountsCreate, {
    displayName: 'YOUR_DISPLAYNAME',
});
```

Parameters: [AccountCreateParams](protocol.md#accountcreateparams).

| Field         | Required | Type     | Description |
| ------------- | -------- | -------- | ----------- |
| `displayName` | Yes      | `string` |             |
| `localId`     | No       | `string` |             |
| `model`       | No       | `string` |             |
| `role`        | No       | `string` |             |

Result: [AccountSummary](protocol.md#accountsummary).

## accounts.list

```ts
await client.call(Method.AccountsList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [AccountSummary](protocol.md#accountsummary).

## accounts.remove

```ts
await client.call(Method.AccountsRemove, {
    principalId: 'YOUR_PRINCIPALID',
});
```

Parameters: [AccountRemoveParams](protocol.md#accountremoveparams).

| Field             | Required | Type      | Description                                                  |
| ----------------- | -------- | --------- | ------------------------------------------------------------ |
| `principalId`     | Yes      | `string`  |                                                              |
| `removeWorkspace` | No       | `boolean` | Whether the workspace directory goes too. Defaults to FALSE. |

Result: [OkResult](protocol.md#okresult).

## accounts.usage

```ts
await client.call(Method.AccountsUsage, {});
```

Parameters: [AccountsUsageParams](protocol.md#accountsusageparams).

| Field    | Required | Type     | Description                                |
| -------- | -------- | -------- | ------------------------------------------ |
| `fromMs` | No       | `number` |                                            |
| `toMs`   | No       | `number` |                                            |
| `userId` | No       | `string` | One account, or every account when absent. |

Result: [AccountsUsageResult](protocol.md#accountsusageresult).

## agent.ask

```ts
await client.call(Method.AgentAsk, {
    message: 'Your request',
});
```

Parameters: [AskParams](protocol.md#askparams).

| Field            | Required | Type                                                        | Description                                                              |
| ---------------- | -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `agentId`        | No       | `string`                                                    |                                                                          |
| `attachments`    | No       | Array of [InboundAttachment](protocol.md#inboundattachment) | User-authored image, video, document, and text blocks, in display order. |
| `conversationId` | No       | `string`                                                    | Continues an existing conversation.                                      |
| `cwd`            | No       | `string`                                                    | Where tools operate.                                                     |
| `message`        | Yes      | `string`                                                    |                                                                          |
| `userId`         | No       | `string`                                                    | The principal the turn is billed and authorized as.                      |

Result: [AskResult](protocol.md#askresult).

## agent.stream

```ts
await client.call(Method.AgentStream, {
    message: 'Your request',
});
```

Parameters: [StreamParams](protocol.md#streamparams).

| Field            | Required | Type                                                        | Description                                                              |
| ---------------- | -------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `agentId`        | No       | `string`                                                    |                                                                          |
| `attachments`    | No       | Array of [InboundAttachment](protocol.md#inboundattachment) | User-authored image, video, document, and text blocks, in display order. |
| `conversationId` | No       | `string`                                                    | Continues an existing conversation.                                      |
| `cwd`            | No       | `string`                                                    | Where tools operate.                                                     |
| `message`        | Yes      | `string`                                                    |                                                                          |
| `streamId`       | No       | `string`                                                    | The stream's id, chosen by the CLIENT.                                   |
| `userId`         | No       | `string`                                                    | The principal the turn is billed and authorized as.                      |

Result: [StreamAccepted](protocol.md#streamaccepted).

## agents.define

```ts
await client.call(Method.AgentsDefine, {
    agent: {
        id: 'YOUR_ID',
        model: 'YOUR_MODEL',
        name: 'YOUR_NAME',
        provider: 'YOUR_PROVIDER',
    },
});
```

Parameters: [AgentDefineParams](protocol.md#agentdefineparams).

| Field   | Required | Type                                           | Description |
| ------- | -------- | ---------------------------------------------- | ----------- |
| `agent` | Yes      | [AgentDefinition](protocol.md#agentdefinition) |             |

Result: [OkResult](protocol.md#okresult).

## agents.list

```ts
await client.call(Method.AgentsList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [AgentDefinition](protocol.md#agentdefinition).

## approvals.list

```ts
await client.call(Method.ApprovalsList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [PendingApproval](protocol.md#pendingapproval).

## approvals.resolve

```ts
await client.call(Method.ApprovalsResolve, {
    approvalId: 'YOUR_APPROVALID',
    approved: false,
});
```

Parameters: [ApprovalResolveParams](protocol.md#approvalresolveparams).

| Field        | Required | Type      | Description |
| ------------ | -------- | --------- | ----------- |
| `approvalId` | Yes      | `string`  |             |
| `approved`   | Yes      | `boolean` |             |
| `reason`     | No       | `string`  |             |

Result: [OkResult](protocol.md#okresult).

## channels.deadLetters.list

```ts
await client.call(Method.ChannelsDeadLettersList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [DeadLetter](protocol.md#deadletter).

## channels.list

```ts
await client.call(Method.ChannelsList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [ChannelInfo](protocol.md#channelinfo).

## channels.status

```ts
await client.call(Method.ChannelsStatus, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [ChannelStatusResult](protocol.md#channelstatusresult).

## config.get

```ts
await client.call(Method.ConfigGet, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: [ConfigResult](protocol.md#configresult).

## config.set

```ts
await client.call(Method.ConfigSet, {
    key: 'YOUR_KEY',
    value: 'YOUR_VALUE',
});
```

Parameters: [ConfigWriteParams](protocol.md#configwriteparams).

| Field   | Required | Type     | Description                |
| ------- | -------- | -------- | -------------------------- |
| `key`   | Yes      | `string` |                            |
| `value` | Yes      | `JSON`   | The value, already parsed. |

Result: [ConfigWriteResult](protocol.md#configwriteresult).

## config.unset

```ts
await client.call(Method.ConfigUnset, {
    key: 'YOUR_KEY',
});
```

Parameters: Object (fields below).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `key` | Yes      | `string` |             |

Result: [ConfigWriteResult](protocol.md#configwriteresult).

## connect

Use `await NexaClient.connect({ url, apiKey })`; the SDK handles challenge, protocol negotiation, and authentication. Do not call `Method.Connect` yourself.

Parameters: [ConnectParams](protocol.md#connectparams).

| Field         | Required | Type                                               | Description                                                            |
| ------------- | -------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `client`      | Yes      | [ConnectClientInfo](protocol.md#connectclientinfo) |                                                                        |
| `maxProtocol` | Yes      | `number`                                           | The newest protocol the client can speak.                              |
| `minProtocol` | Yes      | `number`                                           | The oldest protocol the client can speak.                              |
| `nonce`       | Yes      | `string`                                           | The challenge nonce, proving the client read the server's first frame. |

Result: [HelloOk](protocol.md#hellook).

## credit.budgets

```ts
await client.call(Method.CreditBudgets, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [Budget](protocol.md#budget).

## credit.removeBudget

```ts
await client.call(Method.CreditRemoveBudget, {
    id: 'YOUR_ID',
});
```

Parameters: Object (fields below).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: Object (fields below).

## credit.setBudget

```ts
await client.call(Method.CreditSetBudget, {
    enforcement: 'block',
    limitMicrocents: 1,
    period: 'daily',
    scope: 'agent',
    scopeId: 'YOUR_SCOPEID',
});
```

Parameters: Object (fields below).

| Field             | Required | Type                                               | Description |
| ----------------- | -------- | -------------------------------------------------- | ----------- |
| `enforcement`     | Yes      | [BudgetEnforcement](protocol.md#budgetenforcement) |             |
| `id`              | No       | `string`                                           |             |
| `limitMicrocents` | Yes      | `number`                                           |             |
| `period`          | Yes      | [BudgetPeriod](protocol.md#budgetperiod)           |             |
| `scope`           | Yes      | [CreditScope](protocol.md#creditscope)             |             |
| `scopeId`         | Yes      | `string`                                           |             |

Result: [Budget](protocol.md#budget).

## credit.summary

```ts
await client.call(Method.CreditSummary, {});
```

Parameters: [CreditSummaryParams](protocol.md#creditsummaryparams).

| Field     | Required | Type                                                               | Description                                         |
| --------- | -------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| `from`    | No       | `number`                                                           |                                                     |
| `scope`   | No       | `"agent"` / `"conversation"` / `"global"` / `"project"` / `"user"` | The scopes a balance or budget can be defined over. |
| `scopeId` | No       | `string`                                                           |                                                     |
| `to`      | No       | `number`                                                           |                                                     |

Result: [CreditSummary](protocol.md#creditsummary).

## devices.approve

```ts
await client.call(Method.DevicesApprove, {
    requestId: 'YOUR_REQUESTID',
});
```

Parameters: [DeviceApproveParams](protocol.md#deviceapproveparams).

| Field       | Required | Type                                | Description                                                                                   |
| ----------- | -------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `requestId` | Yes      | `string`                            |                                                                                               |
| `scopes`    | No       | Array of [Scope](protocol.md#scope) | Absent grants exactly what the device requested. A list here REPLACES that, and may widen it. |

Result: [DeviceApproveResult](protocol.md#deviceapproveresult).

## devices.list

```ts
await client.call(Method.DevicesList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: [DeviceListResult](protocol.md#devicelistresult).

## devices.reject

```ts
await client.call(Method.DevicesReject, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## devices.revoke

```ts
await client.call(Method.DevicesRevoke, {
    deviceId: 'YOUR_DEVICEID',
});
```

Parameters: [DeviceRefParams](protocol.md#devicerefparams).

| Field      | Required | Type     | Description |
| ---------- | -------- | -------- | ----------- |
| `deviceId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## health

```ts
await client.call(Method.Health, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: [HealthResult](protocol.md#healthresult).

## jobs.add

```ts
await client.call(Method.JobsAdd, {
    name: 'YOUR_NAME',
});
```

Parameters: [JobAddParams](protocol.md#jobaddparams).

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

Result: [IdParams](protocol.md#idparams).

## jobs.list

```ts
await client.call(Method.JobsList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [Job](protocol.md#job).

## jobs.remove

```ts
await client.call(Method.JobsRemove, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## logs.tail

```ts
await client.call(Method.LogsTail, {});
```

Parameters: [LogTailParams](protocol.md#logtailparams).

| Field   | Required | Type                                        | Description                                                                     |
| ------- | -------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| `level` | No       | `"debug"` / `"error"` / `"info"` / `"warn"` | Only lines at or above this level.                                              |
| `limit` | No       | `number`                                    | How many lines back to read. Absent reads everything the buffer still holds.    |
| `scope` | No       | `string`                                    | Only lines from this subsystem, e.g. `gateway`.                                 |
| `since` | No       | `number`                                    | Only lines newer than this timestamp, so a poller does not re-read what it has. |

Result: Array of [LogRecord](protocol.md#logrecord).

## sessions.delete

```ts
await client.call(Method.SessionsDelete, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## sessions.get

```ts
await client.call(Method.SessionsGet, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [Session](protocol.md#session) / `null`.

## sessions.list

```ts
await client.call(Method.SessionsList, {});
```

Parameters: [SessionListParams](protocol.md#sessionlistparams).

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `agentId` | No       | `string` |             |
| `limit`   | No       | `number` |             |
| `userId`  | No       | `string` |             |

Result: Array of [Session](protocol.md#session).

## sessions.messages

```ts
await client.call(Method.SessionsMessages, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: Array of [ModelMessage](protocol.md#modelmessage).

## sessions.subscribe

```ts
await client.call(Method.SessionsSubscribe, {
    sessionId: 'YOUR_SESSIONID',
});
```

Parameters: [SessionRef](protocol.md#sessionref).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `sessionId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## sessions.unsubscribe

```ts
await client.call(Method.SessionsUnsubscribe, {
    sessionId: 'YOUR_SESSIONID',
});
```

Parameters: [SessionRef](protocol.md#sessionref).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `sessionId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## shares.create

```ts
await client.call(Method.SharesCreate, {
    name: 'YOUR_NAME',
});
```

Parameters: [ShareCreateParams](protocol.md#sharecreateparams).

| Field         | Required | Type     | Description |
| ------------- | -------- | -------- | ----------- |
| `description` | No       | `string` |             |
| `id`          | No       | `string` |             |
| `name`        | Yes      | `string` |             |
| `path`        | No       | `string` |             |

Result: [ShareSummary](protocol.md#sharesummary).

## shares.list

```ts
await client.call(Method.SharesList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [ShareSummary](protocol.md#sharesummary).

## shares.remove

```ts
await client.call(Method.SharesRemove, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## shares.setMember

```ts
await client.call(Method.SharesSetMember, {
    id: 'YOUR_ID',
    mode: 'YOUR_MODE',
    shareId: 'YOUR_SHAREID',
    subject: 'YOUR_SUBJECT',
});
```

Parameters: [ShareMemberParams](protocol.md#sharememberparams).

| Field     | Required | Type          | Description |
| --------- | -------- | ------------- | ----------- |
| `id`      | Yes      | `string`      |             |
| `mode`    | Yes      | `null,string` |             |
| `shareId` | Yes      | `string`      |             |
| `subject` | Yes      | `string`      |             |

Result: [ShareSummary](protocol.md#sharesummary).

## tasks.cancel

```ts
await client.call(Method.TasksCancel, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## tasks.get

```ts
await client.call(Method.TasksGet, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [TaskRecord](protocol.md#taskrecord) / `null`.

## tasks.list

```ts
await client.call(Method.TasksList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [TaskRecord](protocol.md#taskrecord).

## teams.create

```ts
await client.call(Method.TeamsCreate, {
    name: 'YOUR_NAME',
});
```

Parameters: [TeamCreateParams](protocol.md#teamcreateparams).

| Field         | Required | Type     | Description |
| ------------- | -------- | -------- | ----------- |
| `description` | No       | `string` |             |
| `id`          | No       | `string` |             |
| `name`        | Yes      | `string` |             |

Result: [TeamSummary](protocol.md#teamsummary).

## teams.list

```ts
await client.call(Method.TeamsList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [TeamSummary](protocol.md#teamsummary).

## teams.remove

```ts
await client.call(Method.TeamsRemove, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## teams.setMember

```ts
await client.call(Method.TeamsSetMember, {
    member: false,
    principalId: 'YOUR_PRINCIPALID',
    teamId: 'YOUR_TEAMID',
});
```

Parameters: [TeamMemberParams](protocol.md#teammemberparams).

| Field         | Required | Type      | Description |
| ------------- | -------- | --------- | ----------- |
| `member`      | Yes      | `boolean` |             |
| `principalId` | Yes      | `string`  |             |
| `teamId`      | Yes      | `string`  |             |

Result: [TeamSummary](protocol.md#teamsummary).

## voice.audio

```ts
await client.call(Method.VoiceAudio, {
    callId: 'YOUR_CALLID',
    pcm: 'YOUR_PCM',
});
```

Parameters: [VoiceAudioParams](protocol.md#voiceaudioparams).

| Field    | Required | Type     | Description                                        |
| -------- | -------- | -------- | -------------------------------------------------- |
| `callId` | Yes      | `string` |                                                    |
| `pcm`    | Yes      | `string` | Base64 PCM16, mono, at the rate the call reported. |

Result: [OkResult](protocol.md#okresult).

## voice.start

```ts
await client.call(Method.VoiceStart, {});
```

Parameters: [VoiceStartParams](protocol.md#voicestartparams).

| Field            | Required | Type     | Description |
| ---------------- | -------- | -------- | ----------- |
| `conversationId` | No       | `string` |             |

Result: [VoiceStarted](protocol.md#voicestarted).

## voice.stop

```ts
await client.call(Method.VoiceStop, {
    callId: 'YOUR_CALLID',
});
```

Parameters: [VoiceStopParams](protocol.md#voicestopparams).

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `callId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## workspaces.create

```ts
await client.call(Method.WorkspacesCreate, {
    name: 'YOUR_NAME',
});
```

Parameters: [WorkspaceCreateParams](protocol.md#workspacecreateparams).

| Field   | Required | Type              | Description |
| ------- | -------- | ----------------- | ----------- |
| `name`  | Yes      | `string`          |             |
| `tags`  | No       | Array of `string` |             |
| `ttlMs` | No       | `number`          |             |

Result: [Workspace](protocol.md#workspace).

## workspaces.describe

```ts
await client.call(Method.WorkspacesDescribe, {
    id: 'YOUR_ID',
});
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [WorkspaceDescription](protocol.md#workspacedescription).

## workspaces.destroy

```ts
await client.call(Method.WorkspacesDestroy, {
    id: 'YOUR_ID',
});
```

Parameters: [WorkspaceDestroyParams](protocol.md#workspacedestroyparams).

| Field   | Required | Type      | Description                                                                   |
| ------- | -------- | --------- | ----------------------------------------------------------------------------- |
| `force` | No       | `boolean` | Overrides live leases. Recorded in the audit trail with the runs it overrode. |
| `id`    | Yes      | `string`  |                                                                               |

Result: [OkResult](protocol.md#okresult).

## workspaces.list

```ts
await client.call(Method.WorkspacesList, {});
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [Workspace](protocol.md#workspace).
