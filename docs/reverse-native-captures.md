# Native network captures

Nexa imports saved .mitm, .flows and .mitmproxy files through an explicitly
provisioned Linux mitmproxy 12.2.3 executable. Set
NEXA_RE_MITMDUMP_COMMAND to its absolute mitmdump path on the workspace host.
An unavailable or mismatched installation fails the investigation explicitly.
Importing does not start a proxy listener or replay captured traffic.

The shared host index uses upstream mitmproxy.io.tnetstring directly.
It does not use FlowReader migrations or convert native records to HAR.
Network, protocol and format agents await the same decoding pass and use
the existing scoped queries, evidence-linked plans and independent reviewer.

NetworkRequest.native binds each source ordinal to exact decimal byte offsets,
native flow type, flow ID and a bounded state-version preview. The input digest,
source ordinal and byte range identify the observation; a flow ID alone does not.
Missing HTTP fields are null. Non-HTTP and unknown-version records remain
available in the reported representation.

Native state uses typed integer, float, byte, list and dictionary projections.
Integers retain exact decimal values. Float sidecars preserve the upstream parsed
representation and hexadecimal value, including non-finite values. These do not
recover an original float's lexical spelling. Byte fields distinguish empty data
from absence and invalid UTF-8. Dictionary member tuples preserve prototype-named
and surrogate-escaped keys as ordinary data. Unknown fields and backups remain
present except for explicit credential exclusions. Upstream dictionary semantics
cannot recover duplicate keys already discarded by the upstream decoder.

Known credential headers, URL fields, structured bodies and backup credentials
are excluded or redacted before persistence. Excluded native byte fields retain
neither their original bytes nor their digest. HTTP body metadata separately
reports the original observed payload digest; the saved projection digest
identifies redacted text. Opaque payloads and undeclared sensitive values are
not guaranteed secret-free.

Use the existing typed reverse.network metadata request and
reverse.network.detail with view 'reported'. The SDK validates the source
range and pagination. Chat opens non-HTTP records directly in Reported and
loads one text page at a time. All replies remain within 12,000 serialized
characters; further text is read only when paging or scrolling.

Limits: 2 GiB input, 100,000 records, 16 MiB per native record, 64 nesting levels,
128 MiB decoded output, 128 MiB retained shared index and a separate 128 MiB saved
detail budget. Reported projections allow up to 67,108,864 characters; ordinary
request representations retain their 8,388,608-character limit. The worker has
768 MiB address space, 30 seconds of CPU, a 60-second wall deadline and bounded
diagnostics. Cancellation kills the owned process group, waits for process exit,
then removes its private configuration. Failed parsing publishes no directory.

Live browser interception, explicit sensitive-value declarations, broader
producer interpretation and full REA parity remain unfinished.

References: [REA network capture semantics](https://github.com/morluto/rea/blob/main/docs/web-network-captures.md)
and [the pinned upstream decoder](https://github.com/mitmproxy/mitmproxy/blob/v12.2.3/mitmproxy/io/tnetstring.py).
