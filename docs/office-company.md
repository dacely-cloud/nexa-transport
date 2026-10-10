# Office and company APIs

Live office state, private staffing, projects, reports, and budgets share the
authenticated Nexa socket with chat. Their binary channels are separate from
JSON RPC. Use the `NexaClient` helpers rather than inventing a `Method` value or
opening a second socket. Server capability checks and authenticated ownership
apply to every private operation.

## Public office state and movement

`subscribeOffice(listener)` requires `hello.features.officeGame`. It receives
validated `OfficeGamePacket` values from `nexa-transport/office`; packets contain
operation, sequence, public agents/projects, removals, and optional geometry or
player state. Apply the packet operation rather than treating every packet as a
complete replacement snapshot. Release the subscription when the view closes.

```ts
import type { OfficeGamePacket, OfficePlayer } from 'nexa-transport/office';

if (client.hello.features.officeGame === true) {
    const release: () => void = client.subscribeOffice((packet: OfficeGamePacket): void => {
        console.log(packet.op, packet.agents, packet.projects);
    });
    const player: OfficePlayer = {
        name: 'Display name',
        x: 0,
        z: 0,
        yaw: 0,
        floor: 0,
        active: true,
    };
    client.moveOffice(player);
    release();
}
```

`moveOffice` sends bounded player input only while subscribed. Identity and
display names are server-owned, and movement cannot alter agent execution state.
Movement can be dropped under socket backpressure; it is not a durable command.
The last released subscription leaves presence. Supported public fields depend
on the negotiated office packet version.

`OfficeProtocol` exposes framing, encode/decode, and control-packet helpers.
`OfficeConstruction.validate` and `OfficeDesks.validate` check bounded placements;
`OfficeWork` provides root-worker, reaction, and status projections; and
`OfficeAppearance.seed` derives deterministic appearance seeds. These utilities
do not authorize commands or create work.

## Private geometry and staffing

`officeLayout()` reads `OfficeLayoutState` when `officeLayout` is advertised.
Save `{ revision, pieces, desks? }` with the same method. Revisions are bigint;
stale writes require a fresh read and reconciliation. The OLAY channel permits
bounded half-metre coordinates and quarter turns. Optional `desks` preserves the
legacy shape when absent; an empty list restores automatic placement. Visitors
can receive sanitized public geometry but cannot save it.

`company()` reads private `CompanyState`; `company(command)` submits one
revision-checked change when `officeCompany` is advertised:

```ts
import { CompanyOp, type CompanyState, type CompanyCommand } from 'nexa-transport/company-types';

if (client.hello.features.officeCompany === true) {
    const state: CompanyState = await client.company();
    const command: CompanyCommand = {
        op: CompanyOp.Configure,
        id: crypto.randomUUID(),
        revision: state.revision,
        name: 'My company',
    };
    const saved: CompanyState = await client.company(command);
    console.log(saved.revision, saved.name);
}
```

Other commands configure employees, departments, and project briefs. Creating a
brief does not approve execution or spending. `subscribeCompany(listener, onError)`
provides an initial snapshot and ordered changes. Keep its release function.
The NCO2 channel restores read watches after reconnect without replaying changes.

Command IDs and expected revisions serve different purposes. Preserve the exact
ID/body for an uncertain retry; a new body cannot reuse an old ID. Reconcile a
known stale edit before making a new command. Private department tools and
reviewed knowledge have separately negotiated capabilities and commands; see
[department policies](client.md#department-tool-permissions) and
[knowledge](client.md#department-knowledge-and-procedures).

## Project decisions and captured files

With `hello.features.officeProjects`, `project(projectId)` returns
`CompanyProjectState { work, allowance }`. A `CompanyWorkCommand` from
`nexa-transport/work-types` can authorize planning, approve a reviewed proposal,
request corrections, accept a delivery, assign a task, or pause/prioritize future
dispatch. Planning/approval carry explicit limits and allowance revisions.
Evidence of completion and owner acceptance remain separate.

`subscribeProject(projectId, listener, onError)` watches full ordered private
state. Disconnects notify the view and restore its read watch on reconnect;
rejected or sequence-invalid watches require explicit resubscription. Reads and
watches are bounded to eight per project channel. Release a watch when closing
the view; doing so does not cancel approved work.

`projectFile(projectId, attemptId, path)` downloads one captured delivery recorded
on that exact owned attempt. It returns assembled bytes, not a page or URL.
Chunks are at most 128 KiB and a file is at most 4 MiB. The helper checks
contiguous offsets and stable totals; this carrier does not include a SHA-256
digest. The path identifies a recorded artifact, not an arbitrary host file.
Use normal attachment downloads for saved chat files and the separate workflow
artifact API for workflow results. Applications own preview isolation and Blob
URL cleanup.

Optional project decisions have individual capability gates:

| Capability property          | Command                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| `supportsProjectBaselines`   | `baseline` attaches an accepted source product to an untouched draft, naming its source project/revision |
| `supportsProjectRecovery`    | `review-interruption` records checked external outcomes for one interrupted attempt                      |
| `supportsProjectPermissions` | `permission` decides an exact saved attempt/permission/fingerprint, with `approved`                      |
| `supportsProjectShowroom`    | `showcase` publishes or withdraws reviewed public labels after acceptance                                |

Baselines do not authorize spending. Interruption review does not retry work,
change a price, or manufacture success; the host checks unresolved charges and
live attempts. Tool permission is bound to the saved invocation, not blanket
permission for future calls. Showroom labels do not expose source files, prompts,
or private task titles. Each decision retains its command ID and work revision.

## Budgets and passive reports

`supportsCompanyLimits` gates `companyLimits(command?)` and
`subscribeCompanyLimits(listener, onError)`. Money is bigint USD microcents:
100,000,000 microcents equals one dollar. A null company ceiling leaves project
allowances applicable; zero is a real cap. A company policy does not replace
individual project approval. Changes cannot reduce the ceiling below spent plus
committed funds. The concurrency range is 1–32, and reducing it does not cancel
running tasks. See [company budgets](client.md#company-budget) for command fields.

`supportsEmployeeResults` gates `employeeResults(employeeId)` and
`subscribeEmployeeResults(employeeId, listener, onError)`. These read saved
contributions, verification counters, optional original-employee costs, and
accepted-delivery classifications. Missing fields from older gateways mean
unreported evidence, not zero or a skill rating. Types are exported from
`nexa-transport/employee-results`.

`supportsExecutionHosts` gates `executionHost()` and
`subscribeExecutionHost(listener, onError)`. Types are exported from
`nexa-transport/company-hosts`. Reports expose status and available CPU/RAM/command
capacity without credentials, endpoints, paths, or prompts. Reading a report does
not provision or reconnect a machine, dispatch commands, or start inference.

Every watch returns a release function; read watches can restore after reconnect,
while decisions are never automatically replayed. Visitors cannot read private
staffing, budgets, project commands/files, employee results, or host reports.
Low-level protocol and type imports are listed in [package entry points](exports.md).
