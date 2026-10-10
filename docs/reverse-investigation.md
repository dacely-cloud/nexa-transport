# Reverse-engineering APIs

`nexa-transport/reverse-investigation` exports `ReverseInvestigation` for validating
native investigation receipts and saved evidence pages. Start an investigation
through a normal authorized agent turn and consume its tool progress/outcome.
The SDK does not run an analyzer or browser locally.

## Live receipts and replay

`ReverseInvestigation.event(event)` extracts an optional investigation snapshot
from a `WireTurnEvent`. `parse(raw)` validates external receipts and their bounds.
`advance(previous, raw)` validates and applies monotonic updates without changing
run/hash/archive identity or reviving a terminal execution. Revisions remain
decimal strings, compared as bigint.

```ts
import { ReverseInvestigation } from 'nexa-transport/reverse-investigation';
import type { ReverseRunSnapshot } from 'nexa-transport/protocol';
import type { TurnStream } from 'nexa-transport/stream';

let snapshot: ReverseRunSnapshot | undefined;
const turn: TurnStream = client.stream({ message: 'Inspect the supplied binary' });
for await (const event of turn) {
    const next: ReverseRunSnapshot | undefined = ReverseInvestigation.event(event);
    if (next !== undefined) {
        snapshot = ReverseInvestigation.advance(snapshot, next);
        console.log(snapshot.state, snapshot.tasks, snapshot.evidence);
    }
}
await turn.result;
```

Specialist completion means a report was submitted; it does not independently
verify its claims. A successful tool outcome may have partial coverage. Keep
coverage, retries, task dependencies, errors, and provenance visible. Optional
adaptive plans retain evidence-linked steps; old receipts may omit them. Live
previews are bounded and do not replace the saved evidence index.

## Saved and live query families

Use `client.call(Method.Name, params)` over the authenticated gateway. Query
availability depends on the negotiated method and the account's original
conversation/run ownership. Replace all IDs with those returned by the receipt.
Saved child analyses may point back to a different original source run; use the
reference's run/evidence IDs and source hash when loading that source.

| RPC method                        | Portable result validator | Data                                                       |
| --------------------------------- | ------------------------- | ---------------------------------------------------------- |
| `ReverseCatalog`                  | `catalog`                 | Session-owned archived investigation directory             |
| `ReverseEvidence`                 | `evidence`                | Paged original evidence                                    |
| `ReverseFunctions`                | `functions`               | Address-ordered native function metadata                   |
| `ReverseGraph`                    | `graph`                   | Saved graph or selected-block instruction page             |
| `ReverseInspect`                  | `inspection`              | Owner-scoped live analyzer inspection                      |
| `ReverseNetwork`                  | `network`                 | Redacted request/flow metadata directory                   |
| `ReverseNetworkDetail`            | `networkDetail`           | One selected immutable request representation              |
| `ReverseBrowser`                  | `browser`                 | Saved browser network evidence                             |
| `ReverseBrowserStructure`         | `structure`               | DOM/accessibility topology                                 |
| `ReverseBrowserSources`           | `sources`                 | Script/resource metadata or selected source text           |
| `ReverseBrowserModules`           | `modules`                 | Import relationships, candidate captures, or selected text |
| `ReverseBrowserStorage`           | `storage`                 | Metadata or redacted inventory for one storage group       |
| `ReverseBrowserStorageComparison` | `storageComparison`       | Metadata or one selected store's changes                   |
| `ReverseBrowserScreenshot`        | `screenshot`              | Metadata or bounded PNG bytes                              |
| `ReverseBrowserWebmcp`            | `webMcp`                  | Passive metadata, declarations, or structural schema       |

The validators accept untrusted values and return named protocol types or throw.
`controlFlow(raw)` additionally validates a captured IDA/Ghidra basic-block
representation; it does not start disassembly or provide another RPC method.
The [RPC reference](methods.md) contains exact query fields and result types.
Metadata, text, byte, and selected-detail cursors have different meanings; follow
the cursor for that exact view and preserve representation/selection/hash identity.

Only `ReverseInspect` in this table describes live analyzer inspection. A saved
page read must not be treated as new browser activity, code execution, traffic
replay, or proof of runtime reachability. A captured descriptor is not permission
to invoke its referenced resource. Missing and partial evidence remain explicit.

## Browser and network contracts

- [Native network captures](reverse-native-captures.md): source ranges, reported native state, redaction, and decoder limits.
- [Browser structure](reverse-browser-structure.md): independent DOM/AX identities and excluded values.
- [Browser sources](reverse-browser-sources.md): opt-in code and original-source provenance for child analysis.
- [Module imports](reverse-browser-modules.md): directory/text separation and captured candidates.
- [Storage](reverse-browser-storage.md): excluded values, incomplete coverage, and saved comparisons.
- [Screenshots](reverse-browser-screenshots.md): lazy PNG pages and deterministic pixel comparisons.
- [Passive WebMCP](reverse-browser-webmcp.md): declarations and structural schema without invocation.

Identity helpers `storageIdentity`, `storageComparisonIdentity`, and
`webMcpIdentity` pin complete header metadata independent of property insertion
order. They do not authorize access or establish equivalence of uncaptured data.
Applications own view cancellation, bounded page retention, text rendering, and
Blob URL disposal. Saved reads require authenticated ownership even after the
live workspace or browser has been removed.
