# Workflows

The SDK shares Nexa's workflow contracts and portable validators with browser and
Node.js applications. Nexa stores drafts, prepares immutable runs, executes
handlers, and enforces account access. Client validation provides early feedback;
the host rechecks the saved graph and current permissions before accepting work.

## Capability checks

Check capabilities on the authenticated, connected client:

| Property                          | Available contract                                 |
| --------------------------------- | -------------------------------------------------- |
| `supportsWorkflowDrafts`          | Version 1 draft storage and its core method set    |
| `supportsWorkflowGraph`           | Component catalog and structural graph validation  |
| `supportsWorkflowGroups`          | Nested groups and published port aliases           |
| `supportsWorkflowPlanning`        | Planning send/read/cancel/history                  |
| `supportsWorkflowPlanningSources` | Explicit planning source metadata                  |
| `supportsWorkflowRuns`            | Durable start/read/cancel/events/steps/output/list |

Additive methods are negotiated individually through
`client.hello.features.methods`. For example, draft support alone does not promise
deletion, schedules, publications, usage reports, or application setup. Use the
[RPC reference](methods.md) for exact parameters and results; calls require the
`Method` enum and server authorization.

## Drafts and deletion

Create/save use durable command IDs. Saving names the expected revision and a
bounded patch; concurrent edits cannot silently replace a newer revision. Read
the manifest in pages pinned to one revision, then load its immutable records.
The [resource guide](workflow-resources.md) describes patch limits and group pages.

Delete the revision the owner reviewed:

```ts
import { Method, type ResultOf } from 'nexa-transport/protocol';

if (client.hello.features.methods.includes(Method.WorkflowsDelete)) {
    const deleted: ResultOf<typeof Method.WorkflowsDelete> = await client.call(
        Method.WorkflowsDelete,
        { workflowId: 'owned-workflow', expectedRevision: '3' },
    );
    console.log(deleted.workflowId, deleted.deleted);
}
```

Deletion retains immutable execution history and prevents further scheduled
admission. Accepted runs have their own cancellation API. The SDK never retries a
mutation automatically; reconcile uncertain results before explicitly retrying.

Planning replies propose edits without saving the draft or activating work.
Applications decide when to apply a proposal using
`nexa-transport/workflow-planning-edits`. Optional alignment fingerprints detect
configuration/connection drift independently of card labels and layout. Source
selections require `supportsWorkflowPlanningSources`; source metadata grants no
file access or execution permission.

## Runs, publications, and schedules

Start a mock or live test from one owned saved revision:

```ts
import { Method, type ParamsOf, type ResultOf } from 'nexa-transport/protocol';
import { WorkflowRunMode } from 'nexa-transport/workflow-run-types';

if (client.supportsWorkflowRuns) {
    const request: ParamsOf<typeof Method.WorkflowsRunsStart> = {
        runId: crypto.randomUUID(),
        workflowId: 'owned-workflow',
        revision: '3',
        triggerNodeId: 'manual-start',
        mode: WorkflowRunMode.MockTest,
        input: { topic: 'Workflow documentation' },
        maxConcurrency: 1,
        timeoutMs: '60000',
    };
    const run: ResultOf<typeof Method.WorkflowsRunsStart> = await client.call(
        Method.WorkflowsRunsStart,
        request,
    );
    console.log(run.runId, run.status);
}
```

Keep the run ID and reconcile status with `WorkflowsRunsRead`. Read ordered events
after an exclusive sequence using `WorkflowsRunsEvents`; follow returned step,
attempt, and output cursors instead of assuming one page contains the whole run.
Outputs address an exact node and invocation. Cancel with `WorkflowsRunsCancel`.
Questions, approvals, agent input/control, and terminal commands also address
specific saved or active identities; they must not target a newer attempt by
accident. Waiting is a persisted lifecycle state, not a failed WebSocket request.

`WorkflowsPublicationsCheck` observes readiness for a saved revision.
`WorkflowsPublicationsPublish` creates an immutable publication with reviewed
trigger, concurrency, and timeout limits. `WorkflowsPublicationsRun` names that
publication; callers cannot replace its execution policy with draft settings.
Publishing alone does not enable automation. The separate
[schedule APIs](workflow-schedules.md) pin a publication and submitted input,
support interval, one-time, calendar, and after-completion timing, and recheck
readiness before automatic admission.

## Public models and provider keys

`nexa-transport/workflow-public-models` exports `WorkflowPublicModels` with a
bundled, local text/reasoning catalog for Anthropic, OpenAI, xAI, and Mistral.
Listing and searching it require no connection, linked key, deployment secret,
or NCAP model-discovery request:

```ts
import { WorkflowPublicModels } from 'nexa-transport/workflow-public-models';
import {
    WorkflowModelCapability,
    type WorkflowModelsPage,
    type WorkflowModelsRequest,
} from 'nexa-transport/workflow-models';

const request: WorkflowModelsRequest = {
    workflowId: 'owned-workflow',
    provider: 'mistral',
    query: '',
    capability: WorkflowModelCapability.Text,
    compatibleOnly: true,
    favorites: null,
    after: null,
};
const page: WorkflowModelsPage = WorkflowPublicModels.list(request);
console.log(page.items);
```

`list` filters by provider, search, favorites, and an optional `provider:model`
cursor; the current small catalog returns `next: null`. Use it for text/reasoning,
not image-generation discovery. `find(provider, id)` returns exact public metadata
or null. `providers` names the four native providers; the returned page also
includes `nerva` as a provider choice for the application's separate discovery
path. Catalog `status: "available"` describes a selectable entry, not verified
account access. Unknown prices, bounds, and endpoint availability remain null.

The SDK contains no provider-key vault or key-linking RPC. The application backend
owns encrypted account credentials and must integrate Nexa's account credential
lookup. On matching hosts, known exact public text models execute through that
account's native provider API using its current key. A gateway login/API key is
separate from an Anthropic, OpenAI, xAI, or Mistral inference key. Keep inference
keys out of workflow JSON, browser persistence, and logs. Missing or revoked keys
fail execution rather than falling back to a deployment credential.

Configured internal/custom providers and image generation continue to use the
negotiated `WorkflowsModels`/`WorkflowsModelsRefresh` discovery APIs. A
latest-compatible text policy requires verified release and eligibility evidence;
the local public catalog does not supply it. Use an exact public ID. A provider's
literal ID ending in `-latest` is still an exact selected ID, not that policy.
Image resolution and image quotes have separate contracts and do not reserve
funds or generate output.

## Templates and submitted input

Use `WorkflowTemplateFields` for named substitutions such as
`{{ customer.name }}`. It accepts own JSON fields, preserves null/false/zero/empty
text, and rejects executable expressions and prototype paths:

```ts
import { WorkflowTemplateFields } from 'nexa-transport/workflow-template-fields';
import type { WorkflowObject } from 'nexa-transport/workflow-types';

const values: WorkflowObject = { customer: { name: 'Alex' }, count: 0 };
const template: string = 'Hello {{customer.name}}: {{count}}';
WorkflowTemplateFields.validate(template, values);
const fields: readonly string[] = WorkflowTemplateFields.paths(template);
console.log(fields);
```

`WorkflowTemplateInputs.validate(graph, triggerNodeId, input)` provides the same
preflight used for templates directly started by a trigger and connected from
its `input` output to the template's `values` input. It reports the component
label/ID when a submitted field is unavailable. Conditional branches and computed
values still require validation at their actual invocation. These helpers check
inputs without executing or saving a workflow.

## HTTP Request components

The shared catalog includes `http.request@1` in the API category. Flow enters
`in`; data inputs are `url`, optional `headers`, and optional `body`. URL, headers,
and body can also be authored as configuration fallbacks. Response outputs are
`response`, `status`, and `responseHeaders`; HTTP 2xx takes `success` and other
statuses take `error`.

`nexa-transport/workflow-http` exports `WorkflowHttpInputs`,
`WorkflowHttpMethod`, `WorkflowHttpFormat`, and `WorkflowHttpRequest`. Validate
resolved data and settings locally:

```ts
import {
    WorkflowHttpInputs,
    WorkflowHttpMethod,
    WorkflowHttpFormat,
    type WorkflowHttpRequest,
} from 'nexa-transport/workflow-http';
import type { WorkflowObject } from 'nexa-transport/workflow-types';

const configuration: WorkflowObject = {
    method: WorkflowHttpMethod.Get,
    responseFormat: WorkflowHttpFormat.Json,
    timeoutMs: '30000',
    maxResponseBytes: '262144',
    followRedirects: true,
};
const inputs: WorkflowObject = { url: 'https://example.com/data.json' };
const request: WorkflowHttpRequest = WorkflowHttpInputs.parse(configuration, inputs);
console.log(request.url.href, request.method);
```

Parsing performs no request or DNS lookup. The URL must be absolute HTTP(S),
without embedded credentials or fragments. GET/HEAD cannot have a body. Other
methods serialize non-string JSON values and supply JSON Content-Type when
absent. Bodies are bounded to 256 KiB, headers to 64 entries/16 KiB, timeouts to
1–60 seconds, and response limits to 1 KiB–1 MiB. Transport and proxy-control
headers are reserved. Timeout and byte limits are decimal strings in authored
configuration and bounded numbers in the parsed request.

Live execution requires Nexa's configured workspace proxy and `http.proxy`
capability. The host checks public destination addresses and redirects; proxy
credentials stay on the host. Requests are external effects and are never
automatically replayed. Mock tests use `mockResponse` and `mockStatus` without
calling the destination. Downstream field-picking, mapping, conversion, and
template components can turn the response into model input.

## Terminal coding agents

`WorkflowApplications` from `nexa-transport/workflow-applications` defines fixed
commands for the terminal components in the Agents category:

| Component                 | Application  | Executable   |
| ------------------------- | ------------ | ------------ |
| `terminal.codex@1`        | Codex        | `codex`      |
| `terminal.claude-code@1`  | Claude Code  | `claude`     |
| `terminal.grok-build@1`   | Grok Build   | `grok`       |
| `terminal.nerva-code@1`   | Nerva Code   | `nerva-code` |
| `terminal.mistral-vibe@1` | Mistral Vibe | `vibe`       |

These operate the real application in the owner's workspace. Mistral Vibe uses
`vibe --setup` for setup and is separate from the Mistral model/API-key component.
Check/install/login through negotiated `WorkflowsRunsApplicationsCheck` and
`WorkflowsRunsApplicationsSetup`; inspect/control a specific invocation through
`WorkflowsRunsTerminalRead` and `WorkflowsRunsTerminalCommand`. Local registry
presence does not prove the executable or execution handler is installed on the
connected host. Workflow JSON cannot choose arbitrary host executables or login
commands.

## Artifacts and retained usage

List run artifacts with `WorkflowsRunsArtifacts`, then download the selected
owned artifact using `WorkflowArtifactDownloads` from
`nexa-transport/workflow-artifacts`. It checks bounded fragments and the complete
SHA-256 before returning bytes. The [README example](../README.md#workflow-artifact-downloads)
shows cancellation and Blob construction; applications own Blob URL cleanup.

`WorkflowsRunsUsage` returns retained model usage in pages of at most ten groups.
`WorkflowsRunsUsageBreakdown` partitions the same evidence by `steps` or `agents`;
`WorkflowsRunsLoopSpending`/`WorkflowsRunsLoopPricing` expose loop spending and its
classified pricing evidence. Check each method before calling it and follow its
cursor. Portable validators live in `workflow-usage-codec`,
`workflow-breakdown-codec`, and `workflow-spending-codec`.

Amounts in microcents, cumulative counters, revisions, and timestamps use decimal
strings. Compare exact amounts with bigint, and distinguish null/unreported cost
from a known zero. Classifications retain original tariffs rather than applying
today's model prices. Step/agent/loop totals are alternative views of existing
reports; adding them to the whole-run total would double-count spending. Old
writers may have only partial attribution, and expired evidence cannot be
reconstructed. Mock runs explicitly mark simulation and cannot supply live usage.

## Contract generation

Nexa owns the portable workflow source. `npm run generate:workflows` copies the
shared files from the sibling checkout, while `npm run generate` also refreshes
the gateway contract. Do not change a copied contract independently of Nexa.
`npm run docs` regenerates RPC/type references from the bundled contract;
`npm run docs:check` compiles TypeScript examples across the documentation.
