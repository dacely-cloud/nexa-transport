# Runtime controls and integrations

Use the typed `Method` enum and `ParamsOf`/`ResultOf` contracts over the existing
authenticated client. `hello.features.methods` advertises methods and
`methodScopes` describes baseline scopes; account policy may be narrower. Listing
a method does not grant another account's data or authority to change settings.

## Session-owned processes

The `ProcessesList`, `ProcessesLog`, `ProcessesInput`, `ProcessesResize`, and
`ProcessesStop` methods inspect/control shell processes already created by Nexa's
tools. They do not launch a new command. Address every operation with both
`sessionId` and `processId`; a process ID alone is insufficient. Process IDs,
server task/run IDs, and scheduled job IDs are separate identities.

```ts
import { Method, type ResultOf, type BackgroundProcess } from 'nexa-transport/protocol';

if (client.hello.features.methods.includes(Method.ProcessesList)) {
    const processes: ResultOf<typeof Method.ProcessesList> = await client.call(
        Method.ProcessesList,
        { sessionId: sessionKey },
    );
    const process: BackgroundProcess | undefined = processes[0];
    if (process !== undefined && client.hello.features.methods.includes(Method.ProcessesLog)) {
        const log: ResultOf<typeof Method.ProcessesLog> = await client.call(Method.ProcessesLog, {
            sessionId: sessionKey,
            processId: process.processId,
            offset: '0',
        });
        console.log(process.running, process.exitCode, log.text, log.endOffset);
    }
}
```

Process records include command, working directory, foreground/running state,
start/end time, exit code, and signal. `ProcessesLog` returns bounded text,
`truncated`, and a decimal-string byte `endOffset` for subsequent reads. Preserve
that boundary instead of deriving an offset from JavaScript text length.
`ProcessesInput` sends bounded text to the exact owned process;
`ProcessesResize` supplies small positive `cols`/`rows` for a terminal;
`ProcessesStop` explicitly stops the addressed process. Read the current state
after an uncertain control result; the SDK does not replay input or stop calls.

An agent's terminal result and a process's lifecycle are distinct records. Use
process status to render running/stopped state and the server's task controls to
stop a task. The transport neither owns an operating-system process group nor
implements host process cleanup. These contracts apply to general shell work,
including interactive programs and long commands, not only HTTP servers.

## Scheduled jobs

`JobsList`, `JobsAdd`, and `JobsRemove` manage Nexa's scheduler. A job is not a
process-control handle or a workflow schedule. `JobsAdd` supplies a name, exactly
one trigger (`cron`, `intervalMs`, or `at`), and exactly one action (`prompt` or
`command`). Optional fields include timezone, agent selection, delivery target,
enabled state, and quiet-empty behavior. Server validation and authorization
still determine allowed actions. `JobsChanged` notifies views to refresh the list.

Removing a scheduler entry is separate from stopping an already running task or
process. Recurring workflow automation instead uses immutable publication and
activation contracts described in [workflow schedules](workflow-schedules.md).
Scheduled jobs and accepted server work are not owned by a browser tab's lifetime.

## Credits and wallets

`CreditSummary`, `CreditBudgets`, `CreditSetBudget`, and `CreditRemoveBudget`
provide credit/allowance administration. `CreditWallet` reads an account's exact
wallet, or null when no snapshot is available. `CreditWalletHistory` reads
transactions using its optional `before` cursor and returned `next`. A read grants
no credit and approves no work.

Wallet credit, weekly, available, and held amounts are decimal-string USD
microcents. Use bigint for arithmetic; one dollar is 100,000,000 microcents.
Respect the snapshot's distinction between available, held, used, and configured
limits. Do not substitute null/unreported evidence with a zero balance. Queries
derive authority from the authenticated connection even where administrative
parameters include `userId`.

The SDK does not implement a checkout, invoice renderer, account credential
vault, or free-credit grant. Those belong to the application/backend. Private
company/project budgets are separate binary APIs described in
[Office/company budgets](office-company.md#budgets-and-passive-reports), and
workflow usage retains its own reported billing evidence.

## Roblox connections and telemetry

`RobloxCredentialsStatus` reports `connected` and `validated` without returning
the account's key. `RobloxCredentialsSet` submits `{ apiKey }` to the authenticated
host integration, and `RobloxCredentialsRemove` disconnects it. The application
owns secure entry and clearing of the input; keep keys out of logs and workflow
documents. Gateway identity and a Roblox Open Cloud key have different roles.

`RobloxTelemetryProjects` lists permitted telemetry projects.
`RobloxTelemetryPerformance` selects an owned `projectId` and decimal-string
`fromMs`/`toMs`. `RobloxTelemetryFunnel` additionally supplies ordered `steps` and
`completionWindowMs`, with optional configuration/performance correlation filters.
These wire queries carry no owner selector. They report retained observations;
listing or reading does not deploy a game or invent missing events. Exact report
fields and query bounds appear in [protocol types](protocol.md).

## Administration and backend bridges

Agent configuration, account/team/share management, workspaces, device pairing,
channels/dead letters, config, logs, and health use their corresponding method
families in the [RPC reference](methods.md). Some are destructive or operator-only.
Local cancellation of `client.call` only ends waiting; a server mutation may have
already committed. Keep application-owned decisions and their durable IDs where
the specific contract supports them, and reconcile uncertain outcomes.

`OfficeOwnerProof` returns a host-generated proof for a requested account under
the authenticated gateway's authorization. It is a backend integration credential,
not a display identity or an office/game packet. Keep it opaque and private; use
the deployment's verified backend flow rather than treating a browser-supplied
account ID as proof of ownership. Native media receipt acknowledgements are sent
automatically by the SDK after attachment handlers complete; callers need not
manually duplicate `MediaAcknowledge`.
