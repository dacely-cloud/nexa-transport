# Saved browser module imports

Read immutable `application:browser-import-report` evidence using
`Method.ReverseBrowserModules` over Nexa's authenticated WebSocket. Parameters are
the original parent conversation `id`, child analysis `runId`, report `evidenceId`,
`view`, and an optional decimal `cursor`. `ReverseInvestigation.modules` validates
reply identities, exact fields, native/computed states, Unicode and pagination.

`view: "imports"` returns body-free relationship previews. `view: "candidates"`
requires an exact relationship ID as `selector` and returns original captured
script descriptors, preserving versions and frames. `exact-reported-url` and
`response-url-without-fragment` remain distinct match strengths. Query variants
remain separate. Follow each view's `nextCursor`; every page contains at most
twenty rows and fits 12,000 serialized characters including its context metadata.

`view: "text"` loads one full field independently of either directory. Global
fields are `module`, `importer-url`, `map-base-url`, and `parse-error`; relationship
fields `specifier`, `resolved-url`, `error-message`, and `expression` require the
relationship selector. Cursors count UTF-16 units and never split Unicode pairs.
`textSha256` identifies the full field's UTF-8 bytes. Previews retain full character
counts and contain at most 256 UTF-16 units. A null text is unavailable; an empty
string is an available empty field. The report's hash identifies the complete
saved native report independently of the child run and selected source hash.

`metadata.sourceCapture` identifies the original source run and immutable capture.
To open one candidate's captured code, call `Method.ReverseBrowserSources` using
those original IDs with `view: "source"` and the candidate ID as `selector`. Verify
its run hash against `sourceCapture.sha256` and its capture hash against
`sourceCapture.captureSha256`, then verify its source hash and byte count against
the candidate descriptor. Code has its own cursor and is never prefetched by an
import-directory request. Captures and resolved URLs do not prove execution.

Saved reads survive workspace removal and archive reopening. Every request checks
the authenticated owner and original conversation; knowing IDs gives no authority.
The original capture metadata index is shared by all traces and contains no code.
Chat's compact Imports view uses these same contracts and opens selected code in
the existing colored virtual editor. The Browser analysis demo includes Imports.

Selecting a workspace import map when starting saved-capture analysis and reopening
an existing resolver query cache on resume remain unfinished. These APIs alone do
not implement full REA parity.
