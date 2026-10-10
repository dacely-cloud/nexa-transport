# Saved passive WebMCP declarations

`Method.ReverseBrowserWebmcp` reads saved passive WebMCP evidence over the
authenticated Nexa WebSocket. It names the original conversation `id`, child
analysis `runId`, and `evidenceId`. Negotiate the method before use. Knowing capture
IDs does not grant another account access.

```ts
import { Method, type BrowserWebMcpPage } from 'nexa-transport/protocol';
import { ReverseInvestigation } from 'nexa-transport/reverse-investigation';

if (client.hello.features.methods.includes(Method.ReverseBrowserWebmcp)) {
    const page: BrowserWebMcpPage = ReverseInvestigation.webMcp(
        await client.call(Method.ReverseBrowserWebmcp, {
            id: sessionKey,
            runId: 'saved-analysis-run-id',
            evidenceId: 'saved-evidence-id',
            view: 'metadata',
        }),
    );
    console.log(page.metadata.available, page.metadata.limitations);
}
```

Replace placeholder run/evidence IDs with the saved UUIDs returned by the
investigation. The three views have independent selections:

| View       | Returned data                                                          |
| ---------- | ---------------------------------------------------------------------- |
| `metadata` | Scope, capture time, coverage and limitations; no tool/schema rows     |
| `tools`    | Up to twenty retained declaration descriptors; no schema property rows |
| `schema`   | One exact tool `selector` and up to twenty structural property rows    |

Follow decimal `nextCursor` within the same view/selection until null. Pin pages
to the same run, evidence, report hash, capture hash, and metadata identity.
`ReverseInvestigation.webMcpIdentity(metadata)` provides the portable metadata
identity; `webMcp(page)` validates exact fields, bounded consecutive ordinals,
selection, schema structure and page advancement. A page contains at most 96,000
serialized characters. Loading a tool directory does not prefetch its schema.

The captured provider is `cdp-passive`. Metadata retains target/frame/origin scope,
allowed origins, observation duration, capture time, retained/dropped counts, and
separate overall/frame/schema coverage. `available: false`, incomplete coverage,
and limitations must remain visible. Empty or partial inventories do not prove
that a page exposes no tools.

`invocationAvailable` is always false and `schemaValuesExcluded` is always true.
Declarations and structural schemas are observations, not callable tools or
execution permission. The SDK does not invoke a page registration, execute
captured code, or restore excluded schema values. Live `browserWebMcp` progress
binds metadata to its original report without tool/schema arrays; load details
only when the user selects them.

Other saved browser contracts are documented separately:

- [Structure](reverse-browser-structure.md)
- [Sources](reverse-browser-sources.md)
- [Module imports](reverse-browser-modules.md)
- [Storage and storage comparisons](reverse-browser-storage.md)
- [Screenshots and visual comparisons](reverse-browser-screenshots.md)

These evidence reads retain their original capture identities and ownership rules;
they do not start new browser activity or establish complete analysis coverage.
