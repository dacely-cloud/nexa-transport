# Package entry points

This is the public ESM import map declared in `package.json`. Import only these
paths; internal `src/`, `dist/`, and undeclared deep paths are outside the package
contract. Runtime entries include TypeScript declarations. Entries marked
**Types only** require `import type` and provide no JavaScript module.

The [client reference](client.md), [usage guide](guide.md),
[Office/company guide](office-company.md), [reverse guide](reverse-investigation.md),
and [workflow guide](workflows.md) explain how to use these families. Exact RPC
payload fields are generated in [protocol types](protocol.md). Portable workflow
interfaces/codecs remain available through their entry points and declarations;
they do not execute server-only handlers or grant access.

## Client, chat, media, and investigations

| Import                                 | Availability   | Contract                                                                             |
| -------------------------------------- | -------------- | ------------------------------------------------------------------------------------ |
| `nexa-transport`                       | ESM + types    | Authenticated client, streams, events, voice, recovery, uploads, and binary channels |
| `nexa-transport/chat-graph`            | ESM + types    | Colored explanatory relationship graphs and ChatGraphs validation                    |
| `nexa-transport/errors`                | ESM + types    | Transport errors, codes, and WebSocket close details                                 |
| `nexa-transport/events`                | ESM + types    | EventName, typed EventMap, and event validation                                      |
| `nexa-transport/media`                 | ESM + types    | Media/3D helpers, native event decoding, and MeshoptDecoder                          |
| `nexa-transport/options`               | **Types only** | Connection identity, authentication, resource limits, and call options               |
| `nexa-transport/protocol`              | ESM + types    | Method enum and complete generated RPC parameters/results                            |
| `nexa-transport/reverse-investigation` | ESM + types    | Native investigation receipts, monotonic replay, and saved-page validators           |
| `nexa-transport/stream`                | **Types only** | Streaming turn type with acceptance, result, steering, cancel, and detach            |
| `nexa-transport/stream-options`        | **Types only** | Turn duration, event/byte buffers, timeout, and cancellation options                 |

## Office and private company channels

| Import                            | Availability   | Contract                                                                                        |
| --------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `nexa-transport/company`          | ESM + types    | Private staffing NCO2 binary codec                                                              |
| `nexa-transport/company-hosts`    | ESM + types    | Passive execution-host report types and packet operations                                       |
| `nexa-transport/company-limits`   | **Types only** | Company budgets, concurrency, commands, and live limit packets                                  |
| `nexa-transport/company-types`    | ESM + types    | CompanyState, employees, departments, project briefs, CompanyOp, and commands                   |
| `nexa-transport/employee-results` | ESM + types    | Saved employee contributions, verification, costs, and report packets                           |
| `nexa-transport/office`           | ESM + types    | Public office and private layout framing, work projections, placement, and appearance utilities |
| `nexa-transport/project-types`    | ESM + types    | Project state, requests, packet operations, and chunks                                          |
| `nexa-transport/projects`         | ESM + types    | NCP2 project decision/state/file binary codec                                                   |
| `nexa-transport/work-types`       | **Types only** | Private project tasks, attempts, artifacts, proposals, and owner decisions                      |

## Portable workflow contracts

| Import                                        | Availability | Contract                                                                       |
| --------------------------------------------- | ------------ | ------------------------------------------------------------------------------ |
| `nexa-transport/workflow-application-models`  | ESM + types  | Installed terminal application model and effort metadata                       |
| `nexa-transport/workflow-applications`        | ESM + types  | Fixed terminal coding application definitions, including Mistral Vibe          |
| `nexa-transport/workflow-artifacts`           | ESM + types  | Bounded workflow artifact download with fragment and SHA-256 checks            |
| `nexa-transport/workflow-breakdown-codec`     | ESM + types  | Step/agent retained-usage attribution validation                               |
| `nexa-transport/workflow-calendar-codec`      | ESM + types  | Strict calendar-rule parsing                                                   |
| `nexa-transport/workflow-calendar-types`      | ESM + types  | Calendar rules, timezone and DST policies                                      |
| `nexa-transport/workflow-catalog`             | ESM + types  | Exact-version built-in catalog and default node construction                   |
| `nexa-transport/workflow-codec`               | ESM + types  | Bounded draft syntax validation                                                |
| `nexa-transport/workflow-component-types`     | ESM + types  | Roles, categories, ports, resources, and execution declarations                |
| `nexa-transport/workflow-each`                | ESM + types  | Repeated-item graph structure and validation                                   |
| `nexa-transport/workflow-graph-types`         | ESM + types  | Graph snapshots, diagnostics, and validated ordering                           |
| `nexa-transport/workflow-group-codec`         | ESM + types  | Hierarchy record and publication validation                                    |
| `nexa-transport/workflow-group-types`         | ESM + types  | Nested groups and published-port aliases                                       |
| `nexa-transport/workflow-http`                | ESM + types  | Portable HTTP request/header validation and method/response-format constants   |
| `nexa-transport/workflow-image-policy`        | ESM + types  | Strict image model selection policy/evidence validation                        |
| `nexa-transport/workflow-image-quote`         | ESM + types  | Exact image-price request/result and boundary codec                            |
| `nexa-transport/workflow-image-resolution`    | ESM + types  | Image policy preview request/result codecs                                     |
| `nexa-transport/workflow-json`                | ESM + types  | Portable typed JSON object/value parsing                                       |
| `nexa-transport/workflow-list-plan`           | ESM + types  | Bounded list plan validation                                                   |
| `nexa-transport/workflow-list-transform`      | ESM + types  | Portable list transformations                                                  |
| `nexa-transport/workflow-list-types`          | ESM + types  | List plan/transform types                                                      |
| `nexa-transport/workflow-loops`               | ESM + types  | Loop component contracts                                                       |
| `nexa-transport/workflow-mapping-codec`       | ESM + types  | Mapping request/configuration validation                                       |
| `nexa-transport/workflow-mapping-evaluator`   | ESM + types  | Portable deterministic mapping evaluation                                      |
| `nexa-transport/workflow-mapping-expressions` | ESM + types  | Expression validation and interpretation                                       |
| `nexa-transport/workflow-mapping-literal`     | ESM + types  | Literal mapping parsing                                                        |
| `nexa-transport/workflow-mapping-paths`       | ESM + types  | Safe structured value paths                                                    |
| `nexa-transport/workflow-mapping-types`       | ESM + types  | Typed mappings, expressions, and paths                                         |
| `nexa-transport/workflow-mapping-validation`  | ESM + types  | Schema-aware mapping validation                                                |
| `nexa-transport/workflow-mapping-values`      | ESM + types  | Mapping value validation/conversion                                            |
| `nexa-transport/workflow-model-effort`        | ESM + types  | Workflow effort choices and portable effort validation                         |
| `nexa-transport/workflow-model-policy`        | ESM + types  | Text model policy preview types/codecs and policy validation                   |
| `nexa-transport/workflow-models`              | ESM + types  | Model discovery filters, choices, price/capability metadata, and request codec |
| `nexa-transport/workflow-planning-alignment`  | ESM + types  | Semantic graph fingerprints and proposal anchors                               |
| `nexa-transport/workflow-planning-codec`      | ESM + types  | Strict planning request/reply parsing                                          |
| `nexa-transport/workflow-planning-edits`      | ESM + types  | Portable checked graph proposal edits                                          |
| `nexa-transport/workflow-planning-sources`    | ESM + types  | Owner-scoped planning source metadata and codecs                               |
| `nexa-transport/workflow-planning-types`      | ESM + types  | Planning requests, replies, and edit proposals                                 |
| `nexa-transport/workflow-ports`               | ESM + types  | Direction/schema compatibility for connections                                 |
| `nexa-transport/workflow-public-models`       | ESM + types  | Local public provider model catalog without discovery or credentials           |
| `nexa-transport/workflow-publication-codec`   | ESM + types  | Immutable publication checks, publication records, and request codecs          |
| `nexa-transport/workflow-request-codec`       | ESM + types  | Strict draft RPC request parsing                                               |
| `nexa-transport/workflow-requests`            | ESM + types  | Draft/catalog/validation/deletion requests and transport limits                |
| `nexa-transport/workflow-resource-codec`      | ESM + types  | Versioned resource-binding parsing                                             |
| `nexa-transport/workflow-resource-readiness`  | ESM + types  | Advisory resource readiness without I/O                                        |
| `nexa-transport/workflow-resources`           | ESM + types  | Bindings, descriptors, resource families, uses, modes, and readiness types     |
| `nexa-transport/workflow-run-codec`           | ESM + types  | Portable run snapshot/result validation                                        |
| `nexa-transport/workflow-run-request-codec`   | ESM + types  | Strict run and active-agent request parsing                                    |
| `nexa-transport/workflow-run-requests`        | ESM + types  | Run/attempt/output paging and exact agent input/control/session types          |
| `nexa-transport/workflow-run-types`           | ESM + types  | Run modes/status/events, immutable snapshots, steps, and results               |
| `nexa-transport/workflow-scalar-conversion`   | ESM + types  | Explicit scalar conversion helpers                                             |
| `nexa-transport/workflow-schedule-codec`      | ESM + types  | Strict schedule request/state parsing                                          |
| `nexa-transport/workflow-schedule-times`      | ESM + types  | Portable occurrence timing and bounded preview                                 |
| `nexa-transport/workflow-schedule-types`      | ESM + types  | Activation policy, schedule timing, state, and provenance types                |
| `nexa-transport/workflow-schema-types`        | ESM + types  | Schema fields, value shapes, and envelopes                                     |
| `nexa-transport/workflow-schemas`             | ESM + types  | Schema constructors and managed envelopes                                      |
| `nexa-transport/workflow-spending-codec`      | ESM + types  | Exact spending/classification and loop report validation                       |
| `nexa-transport/workflow-template-fields`     | ESM + types  | Safe named template paths, own-field lookup, and validation                    |
| `nexa-transport/workflow-template-inputs`     | ESM + types  | Trigger-input template preflight                                               |
| `nexa-transport/workflow-terminal-types`      | ESM + types  | Application readiness/setup and exact invocation terminal control types        |
| `nexa-transport/workflow-time-limits`         | ESM + types  | Workflow wait and time bounds                                                  |
| `nexa-transport/workflow-timed-trigger`       | ESM + types  | Timed Event output/trigger contract                                            |
| `nexa-transport/workflow-types`               | ESM + types  | Draft nodes/edges/patches, manifest references, and JSON values                |
| `nexa-transport/workflow-usage-codec`         | ESM + types  | Retained model usage request/report validation                                 |
| `nexa-transport/workflow-validation`          | ESM + types  | Portable structural graph validation                                           |
| `nexa-transport/workflow-values`              | ESM + types  | Bounded runtime value validation                                               |
| `nexa-transport/workflow-wait-codec`          | ESM + types  | Durable wait/timer data validation                                             |

`NexaClient` is the root runtime export. Connection options, stream types, and
most domain contracts have their own imports; they are not all re-exported at
the root. Project work/decision contracts use
`nexa-transport/work-types`. Use the current [client API](client.md) rather than
inventing convenience methods from an entry point name.

Browser applications use the same portable SDK as Node.js 22+ ESM consumers.
Build with a bundler for bare package specifiers, or supply an appropriate import
map. The SDK bundles its runtime dependencies and ships declarations and docs;
it does not supply browser renderers, authentication storage, an application
backend, or a provider-key vault.
