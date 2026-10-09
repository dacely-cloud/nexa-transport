# Redacted browser storage receipts

`ReverseRunSnapshot.browserStorage` retains native storage metadata
without values or inventory rows and the original run/evidence/capture reference. `ReverseInvestigation.parse`
checks its original run and parent conversation. Values and full row arrays are
forbidden in progress. Names and fingerprints have separate capture opt-ins.

Call `Method.ReverseBrowserStorage` with the original conversation `id`, `runId`
and `evidenceId`. Omit `group` for metadata only. Select one of `local-storage`,
`session-storage`, `cookies`, `indexed-db` or `cache-storage` and follow its
`nextCursor` for at most twenty rows per page. Every response fits 32,000 serialized
characters. `ReverseInvestigation.storage` validates exact fields, provenance,
selection, coverage counts, row identities and consecutive cursors. Pin the
source-run hash, original capture hash and selected group/cursor to the original
progress receipt. `ReverseInvestigation.storageIdentity` compares all declared
header fields independently of JSON property insertion order.

Each row has its storage group, kind, optional selected name, identity/value
SHA-256 and completeness. Empty databases/caches retain existence rows. Original
values never appear. Quota byte counts and inventory counters use exact decimal
strings. Native and SDK code share the same portable storage validation contract.

`fingerprintsComplete` requires complete selected coverage in all five groups.
Remote IndexedDB previews, cache bodies larger than 64 KiB, omitted rows,
unavailable methods and observed mutations remain incomplete. Cookie scope is
only the current selected main-frame URL. Storage reads do not freeze the page;
matching partial hashes cannot prove equality of entire storage. Saved pages
remain owner/conversation scoped after browser shutdown or archive restart.

See the [native contract](https://github.com/dacely-cloud/nexa/blob/main/docs/reverse-browser-storage.md)
for capture authority, command bounds and runtime evidence. Storage comparison
and full browser/REA parity remain unfinished.
