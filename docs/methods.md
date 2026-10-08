# RPC reference

All 54 protocol methods. `connect` is managed by `NexaClient.connect`; the remaining 53 use `client.call(Method.Name, params)`. Examples are independent templates; replace identifiers and values before calling. Administrative and destructive methods change server state. Availability depends on the authenticated identity, scopes, and server policy.

- [accounts.create](#accounts-create)
- [accounts.list](#accounts-list)
- [accounts.remove](#accounts-remove)
- [accounts.usage](#accounts-usage)
- [agent.ask](#agent-ask)
- [agent.steer](#agent-steer)
- [agent.stream](#agent-stream)
- [agents.define](#agents-define)
- [agents.list](#agents-list)
- [agents.personal.list](#agents-personal-list)
- [agents.personal.remove](#agents-personal-remove)
- [agents.personal.save](#agents-personal-save)
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
- [credit.resetAllowance](#credit-resetAllowance)
- [credit.resetHistory](#credit-resetHistory)
- [credit.resets](#credit-resets)
- [credit.setBudget](#credit-setBudget)
- [credit.summary](#credit-summary)
- [credit.wallet](#credit-wallet)
- [credit.walletHistory](#credit-walletHistory)
- [data.upload.cancel](#data-upload-cancel)
- [data.upload.chunk](#data-upload-chunk)
- [data.upload.finish](#data-upload-finish)
- [data.upload.start](#data-upload-start)
- [devices.approve](#devices-approve)
- [devices.list](#devices-list)
- [devices.reject](#devices-reject)
- [devices.revoke](#devices-revoke)
- [health](#health)
- [jobs.add](#jobs-add)
- [jobs.list](#jobs-list)
- [jobs.remove](#jobs-remove)
- [logs.tail](#logs-tail)
- [media.acknowledge](#media-acknowledge)
- [office.ownerProof](#office-ownerProof)
- [processes.input](#processes-input)
- [processes.list](#processes-list)
- [processes.log](#processes-log)
- [processes.resize](#processes-resize)
- [processes.stop](#processes-stop)
- [roblox.credentials.remove](#roblox-credentials-remove)
- [roblox.credentials.set](#roblox-credentials-set)
- [roblox.credentials.status](#roblox-credentials-status)
- [roblox.telemetry.funnel](#roblox-telemetry-funnel)
- [roblox.telemetry.performance](#roblox-telemetry-performance)
- [roblox.telemetry.projects](#roblox-telemetry-projects)
- [sessions.delete](#sessions-delete)
- [sessions.download](#sessions-download)
- [sessions.files](#sessions-files)
- [sessions.get](#sessions-get)
- [sessions.history](#sessions-history)
- [sessions.input](#sessions-input)
- [sessions.list](#sessions-list)
- [sessions.messages](#sessions-messages)
- [sessions.pin](#sessions-pin)
- [sessions.pins](#sessions-pins)
- [sessions.rename](#sessions-rename)
- [sessions.retry](#sessions-retry)
- [sessions.search](#sessions-search)
- [sessions.subscribe](#sessions-subscribe)
- [sessions.unpin](#sessions-unpin)
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
- [workflows.catalog](#workflows-catalog)
- [workflows.create](#workflows-create)
- [workflows.list](#workflows-list)
- [workflows.read](#workflows-read)
- [workflows.record](#workflows-record)
- [workflows.runs.cancel](#workflows-runs-cancel)
- [workflows.runs.events](#workflows-runs-events)
- [workflows.runs.list](#workflows-runs-list)
- [workflows.runs.output](#workflows-runs-output)
- [workflows.runs.read](#workflows-runs-read)
- [workflows.runs.start](#workflows-runs-start)
- [workflows.runs.steps](#workflows-runs-steps)
- [workflows.save](#workflows-save)
- [workflows.validate](#workflows-validate)
- [workspaces.create](#workspaces-create)
- [workspaces.describe](#workspaces-describe)
- [workspaces.destroy](#workspaces-destroy)
- [workspaces.list](#workspaces-list)

## accounts.create

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AccountsCreate> = {
    displayName: 'YOUR_DISPLAYNAME',
};
const result: ResultOf<typeof Method.AccountsCreate> = await client.call(
    Method.AccountsCreate,
    params,
);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AccountsList> = {};
const result: ResultOf<typeof Method.AccountsList> = await client.call(Method.AccountsList, params);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [AccountSummary](protocol.md#accountsummary).

## accounts.remove

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AccountsRemove> = {
    principalId: 'YOUR_PRINCIPALID',
};
const result: ResultOf<typeof Method.AccountsRemove> = await client.call(
    Method.AccountsRemove,
    params,
);
```

Parameters: [AccountRemoveParams](protocol.md#accountremoveparams).

| Field             | Required | Type      | Description                                                  |
| ----------------- | -------- | --------- | ------------------------------------------------------------ |
| `principalId`     | Yes      | `string`  |                                                              |
| `removeWorkspace` | No       | `boolean` | Whether the workspace directory goes too. Defaults to FALSE. |

Result: [OkResult](protocol.md#okresult).

## accounts.usage

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AccountsUsage> = {};
const result: ResultOf<typeof Method.AccountsUsage> = await client.call(
    Method.AccountsUsage,
    params,
);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AgentAsk> = {
    message: 'Your request',
};
const result: ResultOf<typeof Method.AgentAsk> = await client.call(Method.AgentAsk, params);
```

With a personal API key, omit `userId`; the gateway uses the authenticated identity. A display name such as `Ralph` is not the internal principal `user:ralph`. See [connection and identity](guide.md#connection-and-identity).

Parameters: [AskParams](protocol.md#askparams).

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

Result: [AskResult](protocol.md#askresult).

## agent.steer

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AgentSteer> = {
    message: 'Your request',
    runId: 'YOUR_RUNID',
};
const result: ResultOf<typeof Method.AgentSteer> = await client.call(Method.AgentSteer, params);
```

Parameters: [SteerParams](protocol.md#steerparams).

| Field     | Required | Type     | Description |
| --------- | -------- | -------- | ----------- |
| `message` | Yes      | `string` |             |
| `runId`   | Yes      | `string` |             |

Result: Object (fields below).

## agent.stream

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AgentStream> = {
    message: 'Your request',
};
const result: ResultOf<typeof Method.AgentStream> = await client.call(Method.AgentStream, params);
```

With a personal API key, omit `userId`; the gateway uses the authenticated identity. A display name such as `Ralph` is not the internal principal `user:ralph`. See [connection and identity](guide.md#connection-and-identity).

Parameters: [StreamParams](protocol.md#streamparams).

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

Result: [StreamAccepted](protocol.md#streamaccepted).

## agents.define

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AgentsDefine> = {
    agent: {
        id: 'YOUR_ID',
        model: 'YOUR_MODEL',
        name: 'YOUR_NAME',
        provider: 'YOUR_PROVIDER',
    },
};
const result: ResultOf<typeof Method.AgentsDefine> = await client.call(Method.AgentsDefine, params);
```

Parameters: [AgentDefineParams](protocol.md#agentdefineparams).

| Field   | Required | Type                                           | Description |
| ------- | -------- | ---------------------------------------------- | ----------- |
| `agent` | Yes      | [AgentDefinition](protocol.md#agentdefinition) |             |

Result: [OkResult](protocol.md#okresult).

## agents.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AgentsList> = {};
const result: ResultOf<typeof Method.AgentsList> = await client.call(Method.AgentsList, params);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [AgentDefinition](protocol.md#agentdefinition).

## agents.personal.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AgentsPersonalList> = {};
const result: ResultOf<typeof Method.AgentsPersonalList> = await client.call(
    Method.AgentsPersonalList,
    params,
);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [PersonalAgent](protocol.md#personalagent).

## agents.personal.remove

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AgentsPersonalRemove> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.AgentsPersonalRemove> = await client.call(
    Method.AgentsPersonalRemove,
    params,
);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## agents.personal.save

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.AgentsPersonalSave> = {
    id: 'YOUR_ID',
    instructions: 'YOUR_INSTRUCTIONS',
    name: 'YOUR_NAME',
};
const result: ResultOf<typeof Method.AgentsPersonalSave> = await client.call(
    Method.AgentsPersonalSave,
    params,
);
```

Parameters: [PersonalAgentInput](protocol.md#personalagentinput).

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `id`           | Yes      | `string` |             |
| `instructions` | Yes      | `string` |             |
| `name`         | Yes      | `string` |             |

Result: [PersonalAgent](protocol.md#personalagent).

## approvals.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ApprovalsList> = {};
const result: ResultOf<typeof Method.ApprovalsList> = await client.call(
    Method.ApprovalsList,
    params,
);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [PendingApproval](protocol.md#pendingapproval).

## approvals.resolve

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ApprovalsResolve> = {
    approvalId: 'YOUR_APPROVALID',
    approved: false,
};
const result: ResultOf<typeof Method.ApprovalsResolve> = await client.call(
    Method.ApprovalsResolve,
    params,
);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ChannelsDeadLettersList> = {};
const result: ResultOf<typeof Method.ChannelsDeadLettersList> = await client.call(
    Method.ChannelsDeadLettersList,
    params,
);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [DeadLetter](protocol.md#deadletter).

## channels.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ChannelsList> = {};
const result: ResultOf<typeof Method.ChannelsList> = await client.call(Method.ChannelsList, params);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [ChannelInfo](protocol.md#channelinfo).

## channels.status

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ChannelsStatus> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.ChannelsStatus> = await client.call(
    Method.ChannelsStatus,
    params,
);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [ChannelStatusResult](protocol.md#channelstatusresult).

## config.get

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ConfigGet> = {};
const result: ResultOf<typeof Method.ConfigGet> = await client.call(Method.ConfigGet, params);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: [ConfigResult](protocol.md#configresult).

## config.set

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ConfigSet> = {
    key: 'YOUR_KEY',
    value: 'YOUR_VALUE',
};
const result: ResultOf<typeof Method.ConfigSet> = await client.call(Method.ConfigSet, params);
```

Parameters: [ConfigWriteParams](protocol.md#configwriteparams).

| Field   | Required | Type     | Description                |
| ------- | -------- | -------- | -------------------------- |
| `key`   | Yes      | `string` |                            |
| `value` | Yes      | `JSON`   | The value, already parsed. |

Result: [ConfigWriteResult](protocol.md#configwriteresult).

## config.unset

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ConfigUnset> = {
    key: 'YOUR_KEY',
};
const result: ResultOf<typeof Method.ConfigUnset> = await client.call(Method.ConfigUnset, params);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.CreditBudgets> = {};
const result: ResultOf<typeof Method.CreditBudgets> = await client.call(
    Method.CreditBudgets,
    params,
);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [Budget](protocol.md#budget).

## credit.removeBudget

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.CreditRemoveBudget> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.CreditRemoveBudget> = await client.call(
    Method.CreditRemoveBudget,
    params,
);
```

Parameters: Object (fields below).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: Object (fields below).

## credit.resetAllowance

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.CreditResetAllowance> = {
    cycle: 'YOUR_CYCLE',
    requestId: 'YOUR_REQUESTID',
    week: 'YOUR_WEEK',
};
const result: ResultOf<typeof Method.CreditResetAllowance> = await client.call(
    Method.CreditResetAllowance,
    params,
);
```

Parameters: [ResetAllowanceParams](protocol.md#resetallowanceparams).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `cycle`     | Yes      | `string` |             |
| `requestId` | Yes      | `string` |             |
| `week`      | Yes      | `string` |             |

Result: [ResetAllowanceResult](protocol.md#resetallowanceresult).

## credit.resetHistory

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.CreditResetHistory> = {};
const result: ResultOf<typeof Method.CreditResetHistory> = await client.call(
    Method.CreditResetHistory,
    params,
);
```

Parameters: Object (fields below).

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `before` | No       | `string` |             |
| `userId` | No       | `string` |             |

Result: [ResetHistoryPage](protocol.md#resethistorypage).

## credit.resets

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.CreditResets> = {};
const result: ResultOf<typeof Method.CreditResets> = await client.call(Method.CreditResets, params);
```

Parameters: Object (fields below).

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `userId` | No       | `string` |             |

Result: [ResetSnapshot](protocol.md#resetsnapshot) / `null`.

## credit.setBudget

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.CreditSetBudget> = {
    enforcement: 'block',
    limitMicrocents: 1,
    period: 'daily',
    scope: 'agent',
    scopeId: 'YOUR_SCOPEID',
};
const result: ResultOf<typeof Method.CreditSetBudget> = await client.call(
    Method.CreditSetBudget,
    params,
);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.CreditSummary> = {};
const result: ResultOf<typeof Method.CreditSummary> = await client.call(
    Method.CreditSummary,
    params,
);
```

Parameters: [CreditSummaryParams](protocol.md#creditsummaryparams).

| Field     | Required | Type                                                               | Description                                         |
| --------- | -------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| `from`    | No       | `number`                                                           |                                                     |
| `scope`   | No       | `"agent"` / `"conversation"` / `"global"` / `"project"` / `"user"` | The scopes a balance or budget can be defined over. |
| `scopeId` | No       | `string`                                                           |                                                     |
| `to`      | No       | `number`                                                           |                                                     |

Result: [CreditSummary](protocol.md#creditsummary).

## credit.wallet

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.CreditWallet> = {};
const result: ResultOf<typeof Method.CreditWallet> = await client.call(Method.CreditWallet, params);
```

Parameters: Object (fields below).

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `userId` | No       | `string` |             |

Result: [WalletSnapshot](protocol.md#walletsnapshot) / `null`.

## credit.walletHistory

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.CreditWalletHistory> = {};
const result: ResultOf<typeof Method.CreditWalletHistory> = await client.call(
    Method.CreditWalletHistory,
    params,
);
```

Parameters: Object (fields below).

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `before` | No       | `string` |             |
| `userId` | No       | `string` |             |

Result: [WalletHistoryPage](protocol.md#wallethistorypage).

## data.upload.cancel

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.DataUploadCancel> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.DataUploadCancel> = await client.call(
    Method.DataUploadCancel,
    params,
);
```

Parameters: [DataUploadIdParams](protocol.md#datauploadidparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## data.upload.chunk

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.DataUploadChunk> = {
    data: 'YOUR_DATA',
    id: 'YOUR_ID',
    offset: 'YOUR_OFFSET',
};
const result: ResultOf<typeof Method.DataUploadChunk> = await client.call(
    Method.DataUploadChunk,
    params,
);
```

Parameters: [DataUploadChunkParams](protocol.md#datauploadchunkparams).

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `data`   | Yes      | `string` |             |
| `id`     | Yes      | `string` |             |
| `offset` | Yes      | `string` |             |

Result: [DataUploadPosition](protocol.md#datauploadposition).

## data.upload.finish

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.DataUploadFinish> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.DataUploadFinish> = await client.call(
    Method.DataUploadFinish,
    params,
);
```

Parameters: [DataUploadIdParams](protocol.md#datauploadidparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [DataFile](protocol.md#datafile).

## data.upload.start

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.DataUploadStart> = {
    byteLength: 'YOUR_BYTELENGTH',
    filename: 'YOUR_FILENAME',
};
const result: ResultOf<typeof Method.DataUploadStart> = await client.call(
    Method.DataUploadStart,
    params,
);
```

Parameters: [DataUploadStartParams](protocol.md#datauploadstartparams).

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `byteLength` | Yes      | `string` |             |
| `filename`   | Yes      | `string` |             |

Result: [DataUpload](protocol.md#dataupload).

## devices.approve

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.DevicesApprove> = {
    requestId: 'YOUR_REQUESTID',
};
const result: ResultOf<typeof Method.DevicesApprove> = await client.call(
    Method.DevicesApprove,
    params,
);
```

Parameters: [DeviceApproveParams](protocol.md#deviceapproveparams).

| Field       | Required | Type                                | Description                                                                                   |
| ----------- | -------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `requestId` | Yes      | `string`                            |                                                                                               |
| `scopes`    | No       | Array of [Scope](protocol.md#scope) | Absent grants exactly what the device requested. A list here REPLACES that, and may widen it. |

Result: [DeviceApproveResult](protocol.md#deviceapproveresult).

## devices.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.DevicesList> = {};
const result: ResultOf<typeof Method.DevicesList> = await client.call(Method.DevicesList, params);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: [DeviceListResult](protocol.md#devicelistresult).

## devices.reject

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.DevicesReject> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.DevicesReject> = await client.call(
    Method.DevicesReject,
    params,
);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## devices.revoke

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.DevicesRevoke> = {
    deviceId: 'YOUR_DEVICEID',
};
const result: ResultOf<typeof Method.DevicesRevoke> = await client.call(
    Method.DevicesRevoke,
    params,
);
```

Parameters: [DeviceRefParams](protocol.md#devicerefparams).

| Field      | Required | Type     | Description |
| ---------- | -------- | -------- | ----------- |
| `deviceId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## health

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.Health> = {};
const result: ResultOf<typeof Method.Health> = await client.call(Method.Health, params);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: [HealthResult](protocol.md#healthresult).

## jobs.add

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.JobsAdd> = {
    name: 'YOUR_NAME',
};
const result: ResultOf<typeof Method.JobsAdd> = await client.call(Method.JobsAdd, params);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.JobsList> = {};
const result: ResultOf<typeof Method.JobsList> = await client.call(Method.JobsList, params);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [Job](protocol.md#job).

## jobs.remove

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.JobsRemove> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.JobsRemove> = await client.call(Method.JobsRemove, params);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## logs.tail

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.LogsTail> = {};
const result: ResultOf<typeof Method.LogsTail> = await client.call(Method.LogsTail, params);
```

Parameters: [LogTailParams](protocol.md#logtailparams).

| Field   | Required | Type                                        | Description                                                                     |
| ------- | -------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| `level` | No       | `"debug"` / `"error"` / `"info"` / `"warn"` | Only lines at or above this level.                                              |
| `limit` | No       | `number`                                    | How many lines back to read. Absent reads everything the buffer still holds.    |
| `scope` | No       | `string`                                    | Only lines from this subsystem, e.g. `gateway`.                                 |
| `since` | No       | `number`                                    | Only lines newer than this timestamp, so a poller does not re-read what it has. |

Result: Array of [LogRecord](protocol.md#logrecord).

## media.acknowledge

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.MediaAcknowledge> = {
    id: 'YOUR_ID',
    received: false,
};
const result: ResultOf<typeof Method.MediaAcknowledge> = await client.call(
    Method.MediaAcknowledge,
    params,
);
```

Parameters: [MediaAcknowledgeParams](protocol.md#mediaacknowledgeparams).

| Field      | Required | Type      | Description |
| ---------- | -------- | --------- | ----------- |
| `id`       | Yes      | `string`  |             |
| `received` | Yes      | `boolean` |             |

Result: [OkResult](protocol.md#okresult).

## office.ownerProof

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.OfficeOwnerProof> = {
    accountId: 'YOUR_ACCOUNTID',
};
const result: ResultOf<typeof Method.OfficeOwnerProof> = await client.call(
    Method.OfficeOwnerProof,
    params,
);
```

Parameters: Object (fields below).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `accountId` | Yes      | `string` |             |

Result: Object (fields below).

## processes.input

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ProcessesInput> = {
    data: 'YOUR_DATA',
    processId: 'YOUR_PROCESSID',
    sessionId: 'YOUR_SESSIONID',
};
const result: ResultOf<typeof Method.ProcessesInput> = await client.call(
    Method.ProcessesInput,
    params,
);
```

Parameters: [ProcessInput](protocol.md#processinput).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `data`      | Yes      | `string` |             |
| `processId` | Yes      | `string` |             |
| `sessionId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## processes.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ProcessesList> = {
    sessionId: 'YOUR_SESSIONID',
};
const result: ResultOf<typeof Method.ProcessesList> = await client.call(
    Method.ProcessesList,
    params,
);
```

Parameters: [SessionRef](protocol.md#sessionref).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `sessionId` | Yes      | `string` |             |

Result: Array of [BackgroundProcess](protocol.md#backgroundprocess).

## processes.log

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ProcessesLog> = {
    processId: 'YOUR_PROCESSID',
    sessionId: 'YOUR_SESSIONID',
};
const result: ResultOf<typeof Method.ProcessesLog> = await client.call(Method.ProcessesLog, params);
```

Parameters: [ProcessLogRef](protocol.md#processlogref).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `offset`    | No       | `string` |             |
| `processId` | Yes      | `string` |             |
| `sessionId` | Yes      | `string` |             |

Result: [BackgroundProcessLog](protocol.md#backgroundprocesslog).

## processes.resize

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ProcessesResize> = {
    cols: 1,
    processId: 'YOUR_PROCESSID',
    rows: 1,
    sessionId: 'YOUR_SESSIONID',
};
const result: ResultOf<typeof Method.ProcessesResize> = await client.call(
    Method.ProcessesResize,
    params,
);
```

Parameters: [ProcessResize](protocol.md#processresize).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `cols`      | Yes      | `number` |             |
| `processId` | Yes      | `string` |             |
| `rows`      | Yes      | `number` |             |
| `sessionId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## processes.stop

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.ProcessesStop> = {
    processId: 'YOUR_PROCESSID',
    sessionId: 'YOUR_SESSIONID',
};
const result: ResultOf<typeof Method.ProcessesStop> = await client.call(
    Method.ProcessesStop,
    params,
);
```

Parameters: [BackgroundProcessRef](protocol.md#backgroundprocessref).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `processId` | Yes      | `string` |             |
| `sessionId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## roblox.credentials.remove

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.RobloxCredentialsRemove> = {};
const result: ResultOf<typeof Method.RobloxCredentialsRemove> = await client.call(
    Method.RobloxCredentialsRemove,
    params,
);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: [RobloxCredentialStatus](protocol.md#robloxcredentialstatus).

## roblox.credentials.set

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.RobloxCredentialsSet> = {
    apiKey: 'YOUR_APIKEY',
};
const result: ResultOf<typeof Method.RobloxCredentialsSet> = await client.call(
    Method.RobloxCredentialsSet,
    params,
);
```

Parameters: [RobloxCredentialSetParams](protocol.md#robloxcredentialsetparams).

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `apiKey` | Yes      | `string` |             |

Result: [RobloxCredentialStatus](protocol.md#robloxcredentialstatus).

## roblox.credentials.status

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.RobloxCredentialsStatus> = {};
const result: ResultOf<typeof Method.RobloxCredentialsStatus> = await client.call(
    Method.RobloxCredentialsStatus,
    params,
);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: [RobloxCredentialStatus](protocol.md#robloxcredentialstatus).

## roblox.telemetry.funnel

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.RobloxTelemetryFunnel> = {
    completionWindowMs: 'YOUR_COMPLETIONWINDOWMS',
    fromMs: 'YOUR_FROMMS',
    projectId: 'YOUR_PROJECTID',
    steps: [],
    toMs: 'YOUR_TOMS',
};
const result: ResultOf<typeof Method.RobloxTelemetryFunnel> = await client.call(
    Method.RobloxTelemetryFunnel,
    params,
);
```

Parameters: [TelemetryFunnelParams](protocol.md#telemetryfunnelparams).

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

Result: [FunnelReport](protocol.md#funnelreport).

## roblox.telemetry.performance

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.RobloxTelemetryPerformance> = {
    fromMs: 'YOUR_FROMMS',
    projectId: 'YOUR_PROJECTID',
    toMs: 'YOUR_TOMS',
};
const result: ResultOf<typeof Method.RobloxTelemetryPerformance> = await client.call(
    Method.RobloxTelemetryPerformance,
    params,
);
```

Parameters: [TelemetryPerformanceParams](protocol.md#telemetryperformanceparams).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `fromMs`    | Yes      | `string` |             |
| `projectId` | Yes      | `string` |             |
| `toMs`      | Yes      | `string` |             |

Result: [PerformanceReport](protocol.md#performancereport).

## roblox.telemetry.projects

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.RobloxTelemetryProjects> = {};
const result: ResultOf<typeof Method.RobloxTelemetryProjects> = await client.call(
    Method.RobloxTelemetryProjects,
    params,
);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [TelemetryProject](protocol.md#telemetryproject).

## sessions.delete

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsDelete> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.SessionsDelete> = await client.call(
    Method.SessionsDelete,
    params,
);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## sessions.download

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsDownload> = {
    attachmentId: 'YOUR_ATTACHMENTID',
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.SessionsDownload> = await client.call(
    Method.SessionsDownload,
    params,
);
```

Parameters: [SessionFileParams](protocol.md#sessionfileparams).

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `attachmentId` | Yes      | `string` |             |
| `id`           | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## sessions.files

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsFiles> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.SessionsFiles> = await client.call(
    Method.SessionsFiles,
    params,
);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: Array of [DeliveredAttachment](protocol.md#deliveredattachment).

## sessions.get

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsGet> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.SessionsGet> = await client.call(Method.SessionsGet, params);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [Session](protocol.md#session) / `null`.

## sessions.history

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsHistory> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.SessionsHistory> = await client.call(
    Method.SessionsHistory,
    params,
);
```

Parameters: [SessionHistoryParams](protocol.md#sessionhistoryparams).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `cursor`    | No       | `string` |             |
| `endCursor` | No       | `string` |             |
| `id`        | Yes      | `string` |             |

Result: [SessionHistoryPage](protocol.md#sessionhistorypage).

## sessions.input

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsInput> = {
    id: 'YOUR_ID',
    message: {
        key: 'YOUR_KEY',
        kind: 'entry',
    },
};
const result: ResultOf<typeof Method.SessionsInput> = await client.call(
    Method.SessionsInput,
    params,
);
```

Parameters: [ConversationPinParams](protocol.md#conversationpinparams).

| Field     | Required | Type                                                         | Description |
| --------- | -------- | ------------------------------------------------------------ | ----------- |
| `id`      | Yes      | `string`                                                     |             |
| `message` | Yes      | [ConversationMessageRef](protocol.md#conversationmessageref) |             |

Result: [ConversationInput](protocol.md#conversationinput).

## sessions.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsList> = {};
const result: ResultOf<typeof Method.SessionsList> = await client.call(Method.SessionsList, params);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsMessages> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.SessionsMessages> = await client.call(
    Method.SessionsMessages,
    params,
);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: Array of [ModelMessage](protocol.md#modelmessage).

## sessions.pin

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsPin> = {
    id: 'YOUR_ID',
    message: {
        key: 'YOUR_KEY',
        kind: 'entry',
    },
};
const result: ResultOf<typeof Method.SessionsPin> = await client.call(Method.SessionsPin, params);
```

Parameters: [ConversationPinParams](protocol.md#conversationpinparams).

| Field     | Required | Type                                                         | Description |
| --------- | -------- | ------------------------------------------------------------ | ----------- |
| `id`      | Yes      | `string`                                                     |             |
| `message` | Yes      | [ConversationMessageRef](protocol.md#conversationmessageref) |             |

Result: [ConversationPin](protocol.md#conversationpin).

## sessions.pins

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsPins> = {};
const result: ResultOf<typeof Method.SessionsPins> = await client.call(Method.SessionsPins, params);
```

Parameters: [ConversationPinsParams](protocol.md#conversationpinsparams).

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `before` | No       | `string` |             |
| `limit`  | No       | `number` |             |

Result: [ConversationPinsPage](protocol.md#conversationpinspage).

## sessions.rename

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsRename> = {
    expectedTitle: 'YOUR_EXPECTEDTITLE',
    id: 'YOUR_ID',
    title: 'YOUR_TITLE',
};
const result: ResultOf<typeof Method.SessionsRename> = await client.call(
    Method.SessionsRename,
    params,
);
```

Parameters: [ConversationRenameParams](protocol.md#conversationrenameparams).

| Field           | Required | Type          | Description |
| --------------- | -------- | ------------- | ----------- |
| `expectedTitle` | Yes      | `null,string` |             |
| `id`            | Yes      | `string`      |             |
| `title`         | Yes      | `string`      |             |

Result: [Session](protocol.md#session).

## sessions.retry

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsRetry> = {
    id: 'YOUR_ID',
    message: {
        key: 'YOUR_KEY',
        kind: 'entry',
    },
    mode: 'edit',
    requestId: 'YOUR_REQUESTID',
};
const result: ResultOf<typeof Method.SessionsRetry> = await client.call(
    Method.SessionsRetry,
    params,
);
```

Parameters: [ConversationRetryParams](protocol.md#conversationretryparams).

| Field               | Required | Type                                                                          | Description |
| ------------------- | -------- | ----------------------------------------------------------------------------- | ----------- |
| `id`                | Yes      | `string`                                                                      |             |
| `message`           | Yes      | [ConversationMessageRef](protocol.md#conversationmessageref)                  |             |
| `mode`              | Yes      | `"edit"` / `"regenerate"`                                                     |             |
| `reasoningEffort`   | No       | `"high"` / `"low"` / `"max"` / `"medium"` / `"minimal"` / `"off"` / `"xhigh"` |             |
| `requestId`         | Yes      | `string`                                                                      |             |
| `targetTimeSeconds` | No       | `number`                                                                      |             |
| `text`              | No       | `string`                                                                      |             |

Result: [ConversationRetryResult](protocol.md#conversationretryresult).

## sessions.search

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsSearch> = {
    query: 'YOUR_QUERY',
};
const result: ResultOf<typeof Method.SessionsSearch> = await client.call(
    Method.SessionsSearch,
    params,
);
```

Parameters: [ConversationSearchParams](protocol.md#conversationsearchparams).

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `limit` | No       | `number` |             |
| `query` | Yes      | `string` |             |

Result: Array of [ConversationSearchHit](protocol.md#conversationsearchhit).

## sessions.subscribe

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsSubscribe> = {
    sessionId: 'YOUR_SESSIONID',
};
const result: ResultOf<typeof Method.SessionsSubscribe> = await client.call(
    Method.SessionsSubscribe,
    params,
);
```

Parameters: [SessionRef](protocol.md#sessionref).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `sessionId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## sessions.unpin

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsUnpin> = {
    pinId: 'YOUR_PINID',
};
const result: ResultOf<typeof Method.SessionsUnpin> = await client.call(
    Method.SessionsUnpin,
    params,
);
```

Parameters: [ConversationUnpinParams](protocol.md#conversationunpinparams).

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `pinId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## sessions.unsubscribe

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SessionsUnsubscribe> = {
    sessionId: 'YOUR_SESSIONID',
};
const result: ResultOf<typeof Method.SessionsUnsubscribe> = await client.call(
    Method.SessionsUnsubscribe,
    params,
);
```

Parameters: [SessionRef](protocol.md#sessionref).

| Field       | Required | Type     | Description |
| ----------- | -------- | -------- | ----------- |
| `sessionId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## shares.create

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SharesCreate> = {
    name: 'YOUR_NAME',
};
const result: ResultOf<typeof Method.SharesCreate> = await client.call(Method.SharesCreate, params);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SharesList> = {};
const result: ResultOf<typeof Method.SharesList> = await client.call(Method.SharesList, params);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [ShareSummary](protocol.md#sharesummary).

## shares.remove

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SharesRemove> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.SharesRemove> = await client.call(Method.SharesRemove, params);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## shares.setMember

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.SharesSetMember> = {
    id: 'YOUR_ID',
    mode: 'YOUR_MODE',
    shareId: 'YOUR_SHAREID',
    subject: 'YOUR_SUBJECT',
};
const result: ResultOf<typeof Method.SharesSetMember> = await client.call(
    Method.SharesSetMember,
    params,
);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.TasksCancel> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.TasksCancel> = await client.call(Method.TasksCancel, params);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## tasks.get

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.TasksGet> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.TasksGet> = await client.call(Method.TasksGet, params);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [TaskRecord](protocol.md#taskrecord) / `null`.

## tasks.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.TasksList> = {};
const result: ResultOf<typeof Method.TasksList> = await client.call(Method.TasksList, params);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [TaskRecord](protocol.md#taskrecord).

## teams.create

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.TeamsCreate> = {
    name: 'YOUR_NAME',
};
const result: ResultOf<typeof Method.TeamsCreate> = await client.call(Method.TeamsCreate, params);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.TeamsList> = {};
const result: ResultOf<typeof Method.TeamsList> = await client.call(Method.TeamsList, params);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [TeamSummary](protocol.md#teamsummary).

## teams.remove

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.TeamsRemove> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.TeamsRemove> = await client.call(Method.TeamsRemove, params);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## teams.setMember

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.TeamsSetMember> = {
    member: false,
    principalId: 'YOUR_PRINCIPALID',
    teamId: 'YOUR_TEAMID',
};
const result: ResultOf<typeof Method.TeamsSetMember> = await client.call(
    Method.TeamsSetMember,
    params,
);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.VoiceAudio> = {
    callId: 'YOUR_CALLID',
    pcm: 'YOUR_PCM',
};
const result: ResultOf<typeof Method.VoiceAudio> = await client.call(Method.VoiceAudio, params);
```

Parameters: [VoiceAudioParams](protocol.md#voiceaudioparams).

| Field    | Required | Type     | Description                                        |
| -------- | -------- | -------- | -------------------------------------------------- |
| `callId` | Yes      | `string` |                                                    |
| `pcm`    | Yes      | `string` | Base64 PCM16, mono, at the rate the call reported. |

Result: [OkResult](protocol.md#okresult).

## voice.start

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.VoiceStart> = {};
const result: ResultOf<typeof Method.VoiceStart> = await client.call(Method.VoiceStart, params);
```

Parameters: [VoiceStartParams](protocol.md#voicestartparams).

| Field            | Required | Type     | Description |
| ---------------- | -------- | -------- | ----------- |
| `conversationId` | No       | `string` |             |

Result: [VoiceStarted](protocol.md#voicestarted).

## voice.stop

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.VoiceStop> = {
    callId: 'YOUR_CALLID',
};
const result: ResultOf<typeof Method.VoiceStop> = await client.call(Method.VoiceStop, params);
```

Parameters: [VoiceStopParams](protocol.md#voicestopparams).

| Field    | Required | Type     | Description |
| -------- | -------- | -------- | ----------- |
| `callId` | Yes      | `string` |             |

Result: [OkResult](protocol.md#okresult).

## workflows.catalog

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsCatalog> = {};
const result: ResultOf<typeof Method.WorkflowsCatalog> = await client.call(
    Method.WorkflowsCatalog,
    params,
);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: [WorkflowCatalog](protocol.md#workflowcatalog).

## workflows.create

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsCreate> = {
    commandId: 'YOUR_COMMANDID',
    details: {
        description: 'YOUR_DESCRIPTION',
        folder: 'YOUR_FOLDER',
        name: 'YOUR_NAME',
        tags: [],
    },
    workflowId: 'YOUR_WORKFLOWID',
};
const result: ResultOf<typeof Method.WorkflowsCreate> = await client.call(
    Method.WorkflowsCreate,
    params,
);
```

Parameters: [WorkflowCreateRequest](protocol.md#workflowcreaterequest).

| Field        | Required | Type                                           | Description |
| ------------ | -------- | ---------------------------------------------- | ----------- |
| `commandId`  | Yes      | `string`                                       |             |
| `details`    | Yes      | [WorkflowDetails](protocol.md#workflowdetails) |             |
| `workflowId` | Yes      | `string`                                       |             |

Result: [WorkflowReceipt](protocol.md#workflowreceipt).

## workflows.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsList> = {
    cursor: {
        updatedAtMs: 'YOUR_UPDATEDATMS',
        workflowId: 'YOUR_WORKFLOWID',
    },
    limit: 1,
};
const result: ResultOf<typeof Method.WorkflowsList> = await client.call(
    Method.WorkflowsList,
    params,
);
```

Parameters: [WorkflowListRequest](protocol.md#workflowlistrequest).

| Field    | Required | Type                                                          | Description |
| -------- | -------- | ------------------------------------------------------------- | ----------- |
| `cursor` | Yes      | [WorkflowListCursor](protocol.md#workflowlistcursor) / `null` |             |
| `limit`  | Yes      | `number`                                                      |             |

Result: [WorkflowListPage](protocol.md#workflowlistpage).

## workflows.read

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsRead> = {
    edgeOffset: 1,
    nodeOffset: 1,
    revision: 'YOUR_REVISION',
    workflowId: 'YOUR_WORKFLOWID',
};
const result: ResultOf<typeof Method.WorkflowsRead> = await client.call(
    Method.WorkflowsRead,
    params,
);
```

Parameters: [WorkflowReadRequest](protocol.md#workflowreadrequest).

| Field        | Required | Type          | Description |
| ------------ | -------- | ------------- | ----------- |
| `edgeOffset` | Yes      | `number`      |             |
| `nodeOffset` | Yes      | `number`      |             |
| `revision`   | Yes      | `null,string` |             |
| `workflowId` | Yes      | `string`      |             |

Result: [WorkflowManifestPage](protocol.md#workflowmanifestpage).

## workflows.record

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsRecord> = {
    offset: 1,
    reference: 'YOUR_REFERENCE',
    workflowId: 'YOUR_WORKFLOWID',
};
const result: ResultOf<typeof Method.WorkflowsRecord> = await client.call(
    Method.WorkflowsRecord,
    params,
);
```

Parameters: [WorkflowRecordRequest](protocol.md#workflowrecordrequest).

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `offset`     | Yes      | `number` |             |
| `reference`  | Yes      | `string` |             |
| `workflowId` | Yes      | `string` |             |

Result: [WorkflowRecordPage](protocol.md#workflowrecordpage).

## workflows.runs.cancel

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsRunsCancel> = {
    runId: 'YOUR_RUNID',
};
const result: ResultOf<typeof Method.WorkflowsRunsCancel> = await client.call(
    Method.WorkflowsRunsCancel,
    params,
);
```

Parameters: [WorkflowRunRequest](protocol.md#workflowrunrequest).

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `runId` | Yes      | `string` |             |

Result: [WorkflowRunSummary](protocol.md#workflowrunsummary).

## workflows.runs.events

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsRunsEvents> = {
    after: 'YOUR_AFTER',
    limit: 1,
    runId: 'YOUR_RUNID',
};
const result: ResultOf<typeof Method.WorkflowsRunsEvents> = await client.call(
    Method.WorkflowsRunsEvents,
    params,
);
```

Parameters: [WorkflowRunEventsRequest](protocol.md#workflowruneventsrequest).

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `after` | Yes      | `string` |             |
| `limit` | Yes      | `number` |             |
| `runId` | Yes      | `string` |             |

Result: Array of [WorkflowRunEvent](protocol.md#workflowrunevent).

## workflows.runs.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsRunsList> = {
    afterRunId: 'YOUR_AFTERRUNID',
    limit: 1,
    workflowId: 'YOUR_WORKFLOWID',
};
const result: ResultOf<typeof Method.WorkflowsRunsList> = await client.call(
    Method.WorkflowsRunsList,
    params,
);
```

Parameters: [WorkflowRunListRequest](protocol.md#workflowrunlistrequest).

| Field        | Required | Type          | Description |
| ------------ | -------- | ------------- | ----------- |
| `afterRunId` | Yes      | `null,string` |             |
| `limit`      | Yes      | `number`      |             |
| `workflowId` | Yes      | `string`      |             |

Result: [WorkflowRunListPage](protocol.md#workflowrunlistpage).

## workflows.runs.output

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsRunsOutput> = {
    invocationId: 'YOUR_INVOCATIONID',
    nodeId: 'YOUR_NODEID',
    offset: 1,
    runId: 'YOUR_RUNID',
};
const result: ResultOf<typeof Method.WorkflowsRunsOutput> = await client.call(
    Method.WorkflowsRunsOutput,
    params,
);
```

Parameters: [WorkflowRunOutputRequest](protocol.md#workflowrunoutputrequest).

| Field          | Required | Type     | Description |
| -------------- | -------- | -------- | ----------- |
| `invocationId` | Yes      | `string` |             |
| `nodeId`       | Yes      | `string` |             |
| `offset`       | Yes      | `number` |             |
| `runId`        | Yes      | `string` |             |

Result: [WorkflowRunOutputPage](protocol.md#workflowrunoutputpage).

## workflows.runs.read

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsRunsRead> = {
    runId: 'YOUR_RUNID',
};
const result: ResultOf<typeof Method.WorkflowsRunsRead> = await client.call(
    Method.WorkflowsRunsRead,
    params,
);
```

Parameters: [WorkflowRunRequest](protocol.md#workflowrunrequest).

| Field   | Required | Type     | Description |
| ------- | -------- | -------- | ----------- |
| `runId` | Yes      | `string` |             |

Result: [WorkflowRunSummary](protocol.md#workflowrunsummary).

## workflows.runs.start

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsRunsStart> = {
    input: {},
    maxConcurrency: 1,
    mode: 'live-test',
    revision: 'YOUR_REVISION',
    runId: 'YOUR_RUNID',
    timeoutMs: 'YOUR_TIMEOUTMS',
    triggerNodeId: 'YOUR_TRIGGERNODEID',
    workflowId: 'YOUR_WORKFLOWID',
};
const result: ResultOf<typeof Method.WorkflowsRunsStart> = await client.call(
    Method.WorkflowsRunsStart,
    params,
);
```

Parameters: [WorkflowRunStartRequest](protocol.md#workflowrunstartrequest).

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

Result: [WorkflowRunSummary](protocol.md#workflowrunsummary).

## workflows.runs.steps

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsRunsSteps> = {
    afterNodeId: 'YOUR_AFTERNODEID',
    limit: 1,
    runId: 'YOUR_RUNID',
};
const result: ResultOf<typeof Method.WorkflowsRunsSteps> = await client.call(
    Method.WorkflowsRunsSteps,
    params,
);
```

Parameters: [WorkflowRunStepsRequest](protocol.md#workflowrunstepsrequest).

| Field         | Required | Type          | Description |
| ------------- | -------- | ------------- | ----------- |
| `afterNodeId` | Yes      | `null,string` |             |
| `limit`       | Yes      | `number`      |             |
| `runId`       | Yes      | `string`      |             |

Result: [WorkflowRunStepsPage](protocol.md#workflowrunstepspage).

## workflows.save

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsSave> = {
    commandId: 'YOUR_COMMANDID',
    expectedRevision: 'YOUR_EXPECTEDREVISION',
    patch: {
        details: {
            description: 'YOUR_DESCRIPTION',
            folder: 'YOUR_FOLDER',
            name: 'YOUR_NAME',
            tags: [],
        },
        edges: [],
        nodes: [],
        positions: [],
        removeEdges: [],
        removeNodes: [],
    },
    workflowId: 'YOUR_WORKFLOWID',
};
const result: ResultOf<typeof Method.WorkflowsSave> = await client.call(
    Method.WorkflowsSave,
    params,
);
```

Parameters: [WorkflowSaveRequest](protocol.md#workflowsaverequest).

| Field              | Required | Type                                       | Description |
| ------------------ | -------- | ------------------------------------------ | ----------- |
| `commandId`        | Yes      | `string`                                   |             |
| `expectedRevision` | Yes      | `string`                                   |             |
| `patch`            | Yes      | [WorkflowPatch](protocol.md#workflowpatch) |             |
| `workflowId`       | Yes      | `string`                                   |             |

Result: [WorkflowReceipt](protocol.md#workflowreceipt).

## workflows.validate

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkflowsValidate> = {
    revision: 'YOUR_REVISION',
    workflowId: 'YOUR_WORKFLOWID',
};
const result: ResultOf<typeof Method.WorkflowsValidate> = await client.call(
    Method.WorkflowsValidate,
    params,
);
```

Parameters: [WorkflowValidateRequest](protocol.md#workflowvalidaterequest).

| Field        | Required | Type     | Description |
| ------------ | -------- | -------- | ----------- |
| `revision`   | Yes      | `string` |             |
| `workflowId` | Yes      | `string` |             |

Result: [GraphValidation](protocol.md#graphvalidation).

## workspaces.create

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkspacesCreate> = {
    name: 'YOUR_NAME',
};
const result: ResultOf<typeof Method.WorkspacesCreate> = await client.call(
    Method.WorkspacesCreate,
    params,
);
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
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkspacesDescribe> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.WorkspacesDescribe> = await client.call(
    Method.WorkspacesDescribe,
    params,
);
```

Parameters: [IdParams](protocol.md#idparams).

| Field | Required | Type     | Description |
| ----- | -------- | -------- | ----------- |
| `id`  | Yes      | `string` |             |

Result: [WorkspaceDescription](protocol.md#workspacedescription).

## workspaces.destroy

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkspacesDestroy> = {
    id: 'YOUR_ID',
};
const result: ResultOf<typeof Method.WorkspacesDestroy> = await client.call(
    Method.WorkspacesDestroy,
    params,
);
```

Parameters: [WorkspaceDestroyParams](protocol.md#workspacedestroyparams).

| Field   | Required | Type      | Description                                                                   |
| ------- | -------- | --------- | ----------------------------------------------------------------------------- |
| `force` | No       | `boolean` | Overrides live leases. Recorded in the audit trail with the runs it overrode. |
| `id`    | Yes      | `string`  |                                                                               |

Result: [OkResult](protocol.md#okresult).

## workspaces.list

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';

const params: ParamsOf<typeof Method.WorkspacesList> = {};
const result: ResultOf<typeof Method.WorkspacesList> = await client.call(
    Method.WorkspacesList,
    params,
);
```

Parameters: [Recordstringnever](protocol.md#recordstringnever).

Type: Dictionary.

Result: Array of [Workspace](protocol.md#workspace).
