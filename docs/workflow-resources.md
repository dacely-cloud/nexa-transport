# Workflow resource contracts

The workflow foundation has these portable package entry points:

| Import | Purpose |
| --- | --- |
| `nexa-transport/workflow-resources` | Binding, descriptor, family, use, mode and readiness types/constants |
| `nexa-transport/workflow-resource-codec` | Validate and detach version 1 binding data |
| `nexa-transport/workflow-resource-readiness` | Compute advisory readiness without I/O |
| `nexa-transport/workflow-types` | Versioned draft nodes, edges, patches, manifests and compact management projections |
| `nexa-transport/workflow-codec` | Validate draft syntax while preserving incomplete configuration |
| `nexa-transport/workflow-requests` | Draft RPC types and bounded transport limits |
| `nexa-transport/workflow-request-codec` | Strict create/save/list/read/record request parsing |
| `nexa-transport/workflow-catalog` | Exact-version component registry and default node creation |
| `nexa-transport/workflow-component-types` | Roles, categories, ports and execution declarations |
| `nexa-transport/workflow-validation` | Pure graph validation without external I/O |
| `nexa-transport/workflow-graph-types` | Graph snapshots and bounded validation results |
| `nexa-transport/workflow-ports` | Port compatibility for connection pickers |
| `nexa-transport/workflow-schemas` | Shared schema constructors and managed envelopes |
| `nexa-transport/workflow-schema-types` | Value, envelope and schema contracts |
| `nexa-transport/workflow-values` | Bounded runtime value validation |

Nexa owns the canonical files in `src/workflows/`. Run `npm run generate:workflows`
to copy them, or run the full protocol generator. Parity tests reject drift.

Bindings identify one consumer, external resource, connection, connector version,
exact dataset/endpoint, permitted operation requirements and output limits.
Incomplete bindings retain a null selection. Attaching access, reading data and
choosing compute have separate use values. Large integers are canonical decimal
strings on the JSON wire and are compared with bigint arithmetic.

Readiness requires authorized adapter metadata. A descriptor is not a credential,
and a browser's readiness result must never authorize execution. Nexa must recheck
current authorization and capabilities before every real operation. Mock readiness
requires an explicit matching mock descriptor; it cannot pass live checks.

Nexa advertises `workflowDraftsVersion: 1` when its draft store is wired. The SDK's
`supportsWorkflowDrafts` checks that capability and the complete method set.
`Method.WorkflowsCreate`, `WorkflowsSave`, `WorkflowsList`, `WorkflowsRead` and
`WorkflowsRecord` use the existing typed `call` method; absent capability rejects
locally before sending. `supportsWorkflowGraph` separately checks
`workflowGraphVersion: 1`, `Method.WorkflowsCatalog` and `Method.WorkflowsValidate`.
Validation names an immutable saved revision and returns structural diagnostics;
it never grants permission to run or claims handlers are installed.
Create/save carry durable command IDs; save also requires
the expected revision. The SDK does not automatically replay mutations.

Direct patches are limited to 1 MiB encoded UTF-8 JSON. Read returns bounded
manifest reference pages; subsequent pages must pin the first page's revision.
Record returns bounded JSON text chunks to concatenate before parsing. Large
uploads still require a future staged-upload capability. Planning, execution and
UI integration remain under development. No new operational workspace connector
is implemented. Syntax validation is not graph validation or permission to publish.
