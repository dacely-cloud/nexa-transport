# Saved native viewport images

Use generated `Method.ReverseBrowserScreenshot` with the authenticated original
conversation `id`, `runId`, `evidenceId`, `view` and raw-byte `cursor`. Decode the
result with `ReverseInvestigation.screenshot`. The native run's `browserScreenshot`
receipt contains image-free metadata and its original archive reference.

View `metadata` requires cursor `0` and returns no PNG data. View `image` returns
at most 49,152 decoded PNG bytes / 65,536 base64 characters with an independent
nextCursor. Preserve run, capture and image identity while following pages. Before
display, verify the complete image SHA-256, PNG header and decoded dimensions.

The portable SDK validator checks exact declared fields, finite viewport coordinates,
canonical origin and timestamps, UUID/hash identities, cursor continuity and
canonical base64. It permits at most 75,000 serialized characters per page, including
escaped metadata; images are bounded to 4 MiB and 8,388,608 pixels. Metadata and
progress cannot contain image bodies. CSS viewport dimensions and PNG pixel
dimensions remain separate; the image covers the rendered visible viewport.

Saved reads remain owner/conversation scoped after browser shutdown, workspace
removal and archive restart. Chat uses the typed Nexa WebSocket method and opens
pixels only when selected. Native screenshot tool-result presentation omits image
blocks from unsolicited live events and saved presentation history while retaining
the original multimodal provider result.
