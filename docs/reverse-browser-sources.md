# Saved browser sources

Nexa's native `reverse_browser_scripts` captures admitted script provenance and
resource metadata. Source text is opt-in. The live receipt's `browserSources`
contains coverage, counts and an immutable reference to the original conversation,
run, evidence ID and capture SHA-256. It never embeds code or full inventories.

Use `Method.ReverseBrowserSources` through the authenticated Nexa WebSocket with
the reference's `sessionId`, `runId` and `evidenceId`. Select `view: "scripts"` or
`"resources"` for metadata only. Select `view: "source"` with the exact captured
script's `id` as `selector` to retrieve code. Follow `nextCursor` for that view;
directory and source cursors are independent. `ReverseInvestigation.sources`
validates the page before rendering, including exact allowed fields, identities,
coverage, URLs, cursor progress, source states and Unicode boundaries.

Each directory returns at most twenty rows. Every serialized reply is at most
12,000 characters. Source cursors count UTF-16 code units; source pages retain the
complete source's UTF-8 SHA-256 and byte count. Source text may begin mid-line;
its cursor is a text offset, not a global line number. Resource rows describe
observed metadata and do not claim payload capture or runtime execution.

Saved reads survive browser shutdown, workspace removal, live-cache expiry and
archive reopening. Every read checks the authenticated owner and original parent
conversation. Coordinated agents can share references within that conversation;
knowing another user's run ID does not grant access. Nexa indexes legacy originals
once on first authorized read. Subsequent directory and source reads use separate
metadata indexes and text chunks without decoding whole captures.

Chat's right-side RE workspace includes Scripts and Resources. Listing scripts
does not fetch code. Selecting a captured script opens Chat's colored virtual
editor; scrolling loads another bounded text range, retaining at most two editor
documents. Pending reads are canceled on selection/view changes. Uncaptured code
and partial coverage remain explicit. RE Demo includes Browser scripts.

Verified source exports can feed the existing shared JavaScript analyzer.
Browser specialist planning, import maps, runtime reachability, larger captures,
screenshots, storage, WebMCP, scenarios and comparisons remain unfinished.
