# Saved browser topology

Nexa's passive `reverse_browser_page` tool captures admitted DOM and accessibility
relationships as one immutable native investigation. The progress receipt includes
`browserStructure`, containing a bounded summary and reference with the original
conversation, run/evidence IDs and capture SHA-256. It carries no complete trees.

Use `Method.ReverseBrowserStructure` through the authenticated Nexa WebSocket.
Select view `dom` or `accessibility` and selector `all`, `roots`, `node:ID`,
`children:ID`, or DOM-only `attributes:ID`. Follow `nextCursor`; each reply contains
at most twenty rows and 12,000 serialized characters. `ReverseInvestigation.structure`
validates representation, exact provenance, safe node identities, selected
relationships, cursor progress and coverage before display.

DOM IDs and opaque AX IDs have separate capture-local namespaces. Backend IDs link
native DOM and accessibility nodes when available. DOM rows retain containment,
node types/names, value length, attribute count and captured/missing child counts.
Attribute names use a separate cursor and never appear in node directory rows.
Text, attribute values, AX names/descriptions and property values are excluded.
Unknown AX ancestry retains null depth. Unavailable AX methods and excluded or
missing relationships remain partial. Count-preview truncation is reported
separately and does not truncate admitted node inventories.

Saved indexes survive browser shutdown and Nexa archive reopening. Every read
requires both the authenticated owner and original conversation. Coordinated
agents use their parent conversation; selecting a run ID never grants another
user access. Query selectors do not accept workspace paths or browser sockets.

Chat's right-side RE panel shows separate DOM and Accessibility tabs, one sibling
page, selected-node details and explicitly opened attribute-name pages. Original
JSON is fetched only through All evidence. The demo includes Browser structure.

Script/resource directories and exports are covered in [saved browser sources](reverse-browser-sources.md).
Screenshots, storage, WebMCP, browser specialist
analysis/planning, scenarios, comparisons and full REA parity remain unfinished.
