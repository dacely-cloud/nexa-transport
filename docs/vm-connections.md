# VM connections

Account connections let a signed-in user bring their own software and models to their own VM.
Every method acts only for the authenticated account; no request names another user.

## Subscription applications

`ConnectionsApplicationsCheck` reports whether Codex, Claude Code, Grok Build and Mistral Vibe are
signed in on the user's VM. `ConnectionsApplicationsSetup` opens the application's own login in a
terminal on that VM; drive it with `WorkflowsRunsTerminalRead` and `WorkflowsRunsTerminalCommand`.
Credentials stay inside the application on the VM and are never returned.

```ts
import {
    Method,
    type ConnectionApplicationsPage,
    type WorkflowTerminalSnapshot,
} from 'nexa-transport/protocol';

declare const client: import('nexa-transport').NexaClient;
const page: ConnectionApplicationsPage = await client.call(Method.ConnectionsApplicationsCheck, {});
const terminal: WorkflowTerminalSnapshot = await client.call(Method.ConnectionsApplicationsSetup, {
    application: 'claude-code',
    sessionId: crypto.randomUUID(),
});
console.log(page.applications.length, terminal.status);
```

## Licensed tools

The user links a license on the website, which stores it encrypted and never returns it to the
browser. `ConnectionsToolsInstall` installs the tool on the user's VM with that license and returns
immediately; poll `ConnectionsToolsStatus` until the state settles. `ConnectionsToolsRemove`
deletes the tool and its license file from the VM.

```ts
import { Method } from 'nexa-transport/protocol';
import { LicensedTool, LicensedToolState } from 'nexa-transport/vm-connections';

declare const client: import('nexa-transport').NexaClient;
await client.call(Method.ConnectionsToolsInstall, { tool: LicensedTool.IdaPro });
const { tools } = await client.call(Method.ConnectionsToolsStatus, {});
const installed: boolean = tools.some(
    (tool): boolean => tool.state === LicensedToolState.Installed,
);
console.log(installed);
```

## Connected chat models

`ConnectionsModelsList` lists models the user connected with their own API key or a signed-in
Codex or Claude Code subscription. Send the chosen entry as `model` on `agent.stream`; omit it to
use the Nexa model. The gateway re-checks the selection against the account on every turn. A
subscription turn runs the official CLI in the conversation's workspace on the user's VM.

```ts
import { Method, type ChatModelChoice } from 'nexa-transport/protocol';

declare const client: import('nexa-transport').NexaClient;
const { items } = await client.call(Method.ConnectionsModelsList, {});
const choice: ChatModelChoice | undefined = items[0];
if (choice !== undefined) {
    await client.call(Method.AgentAsk, {
        message: 'Hello',
        model: { source: choice.source, provider: choice.provider, model: choice.model },
    });
}
```
