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
for capture authority, command bounds and runtime evidence. Saved storage comparisons are described below. These observations do not
establish complete browser/REA parity.

## Saved storage comparisons

`ReverseRunSnapshot.browserStorageComparison` retains the two source captures,
per-store counts and the comparison report reference. It carries no change array.
Use `Method.ReverseBrowserStorageComparison` with the original conversation,
report run/evidence IDs and an optional group. Omitting the group reads only the
header; selecting a group returns at most 20 changes and 96,000 serialized
characters. Long names reduce the page length. Follow `nextCursor` and replace
the current page rather than accumulating report bodies.

`ReverseInvestigation.storageComparison` validates the response's exact shape,
quota arithmetic, coverage-derived status and consecutive selected ordinals.
`storageComparisonIdentity` pins the full source/header provenance independent
from object insertion order. Compare response identity to the streamed header
and also pin the report digest, run, evidence, group and requested cursor.
Partial captures cannot prove missing records or value equality. Names-only
comparisons never prove value equality. Storage values remain excluded.
