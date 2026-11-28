# Package entry points

This is the public ESM import map declared in `package.json`. Import only these
paths; internal `src/`, `dist/`, and undeclared deep paths are outside the package
contract. Runtime entries include TypeScript declarations. Entries marked
**Types only** require `import type` and provide no JavaScript module.

The [client reference](client.md), [usage guide](guide.md),
and [workflow guide](workflows.md) explain how to use these families. Exact RPC
payload fields are generated in [protocol types](https://github.com/dacely-cloud/nexa-protocol/blob/main/docs/protocol.md).

The wire definitions this package shares with the Nexa server have one source in
the `nexa-protocol` package, which this package depends on: the `Method` catalog,
request, response and event types, wire enums and limits, the generated schema and
its method, event and page validators, binary media framing, and the response codecs
the clients below run. Import them from `nexa-protocol` at the module's path, for
example `nexa-protocol/graphics/Graphic.js`, `nexa-protocol/redteam/RedTeamTypes.js`
or `nexa-protocol/design/DesignRequests.js`. Feature logic such as design editing,
Roblox preview rendering and workflow graph tooling is not part of this SDK.

## Client, chat, and media

| Import                            | Availability   | Contract                                                                                |
| --------------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `nexa-transport`                  | ESM + types    | Authenticated client, streams, events, voice, recovery, uploads, and binary channels    |
| `nexa-transport/session-files`    | ESM + types    | Bounded saved-file metadata pages, source revisions, cancellation and complete recovery |
| `nexa-transport/archive-requests` | ESM + types    | Cancellable archive admission retries within one total request deadline                 |
| `nexa-transport/history-records`  | ESM + types    | Linear JSONL record framing with full schema validation and duplicate rejection         |
| `nexa-transport/errors`           | ESM + types    | Transport errors, codes, and WebSocket close details                                    |
| `nexa-transport/events`           | ESM + types    | EventName, typed EventMap, and event validation                                         |
| `nexa-transport/environments`     | ESM + types    | Attach an environment to a connection and answer its requests with your own handlers    |
| `nexa-transport/node-environment` | ESM + types    | Node.js only: serve a local directory as an attached environment with child processes   |
| `nexa-transport/media`            | ESM + types    | Media/3D helpers, native event decoding, and MeshoptDecoder                             |
| `nexa-transport/options`          | **Types only** | Connection identity, authentication, resource limits, and call options                  |
| `nexa-transport/redteam-client`   | ESM + types    | Validated start/list/get/stop/update operations over an authenticated gateway adapter   |
| `nexa-transport/stream`           | **Types only** | Streaming turn type with acceptance, result, steering, cancel, and detach               |
| `nexa-transport/stream-options`   | **Types only** | Turn duration, event/byte buffers, timeout, and cancellation options                    |

## Red team effort contract

Use `client.redTeam` for the five `redteam.*` operations when
`client.supportsRedTeam` is true. Requests share the authenticated socket's
timeouts, cancellation and resource limits. `RedTeamClient` also accepts a typed
`RedTeamGateway` adapter for other authenticated transports. These portable entries
do not register server handlers or extend the generated `NexaClient.call` method
map. Server integration must implement the canonical
gateway declarations, authorization, persistence, ownership checks for uploaded
file IDs, repository checkout policy, and cancellation of owned agent work.

Start accepts an owner-selected `effortId`, title, GitHub repository URL or uploaded
file IDs, rules, and optional parallelism. Parallelism defaults to 8 and accepts
integers from 1 through 50. Updates require an expected decimal revision. Stop
returns an explicit stopping or stopped acknowledgement; the client never retries
mutations automatically.

Get returns effort metadata, up to 50 worker session references, and independently
paged task and finding ledgers. Use null revision and cursors for the initial read,
then pin that revision when continuing either ledger. Each page holds at most 100
records; the effort's lifetime and total ledger counts are independent of this
page bound. Counts, revisions and millisecond timestamps use decimal strings.
Agent text, tool output and terminal attachments remain in ordinary Chat sessions.
Findings retain severity, a decimal CVSS score, confirmation state, evidence file
references and reproduction steps.

Snapshots may include up to 100 saved coordination exchanges. Each exchange names
an existing worker, records an assignment, result, verification or progress action,
and keeps an exact increasing sequence. Worker names are optional, and workers may
be marked as verifying a result. Exchanges may refer to tasks or findings on other
ledger pages. Older snapshots can omit these optional coordination fields.

Findings may also include `report: RedTeamFindingReport` with impact, affected
versions, prerequisites, expected and observed behavior, remediation, technical
details, reported CVE/CWE identifiers, and named HTTP/HTTPS references. Every
report field is optional: absent details have not been reported yet, while an
empty identifier list means none have been assigned or identified. The existing
finding title is the custom report title. Decoding preserves missing information
and never assigns vulnerability identifiers or fills in report claims.

`NexaClient` is the root runtime export. Connection options, stream types, and
most domain contracts have their own imports; they are not all re-exported at
the root. Use the current [client API](client.md) rather than
inventing convenience methods from an entry point name.

Browser applications use the same portable SDK as Node.js 22+ ESM consumers.
Build with a bundler for bare package specifiers, or supply an appropriate import
map. The SDK bundles its runtime dependencies and ships declarations and docs;
it does not supply browser renderers, authentication storage, an application
backend, or a provider-key vault.

Editable SVG import requests and limits are typed by
`nexa-protocol/design/DesignSvgImportTypes.js`. Saved imports use
`client.call(Method.DesignSvgImport, request)`. SVG imports retain local use/symbol
references as independent editable copies, nested SVG viewport clips, clip paths and
alpha/luminance masks. External resources, SVG text, images and filters remain
unsupported.

The generated protocol includes the managed workspace file browser methods
`workspace.files.list`, `workspace.files.read`, `workspace.files.start`,
`workspace.files.chunk`, `workspace.files.finish`, `workspace.files.cancel`, and
`workspace.files.mkdir`. Use their `Method.WorkspaceFiles*` constants with the
existing authenticated `NexaClient.call` API. Paths are relative to the account's
managed workspace; `list` supplies the assignment token required by subsequent
reads and writes. Reads and upload chunks are bounded at 1 MiB. Preserve file
revisions across read slices and acknowledged byte positions across upload slices.
