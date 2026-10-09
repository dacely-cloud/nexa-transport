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

## Comparison receipts

`ReverseRunSnapshot.browserComparison` is an image-free native report. It includes
`before` and `after` source receipts, deterministic `rgba-channel-v1` metrics and
the independently archived comparison reference. `ReverseInvestigation.parse`
validates exact field declarations, source provenance, bounded metadata and metric
arithmetic. The generated portable metric validator comes from Nexa's worker
validator, so both sides enforce the same status and counter rules.

Each source retains its original `reference`, source-run `sha256` and PNG `metadata`.
Use the original source reference's run/evidence IDs and the original parent
conversation with `Method.ReverseBrowserScreenshot`. Pin the returned source-run
hash, original capture hash and all image metadata before opening pixels. Using
the comparison run ID to read an original image is incorrect. There is no separate
image transfer protocol and no pixel data embedded in comparison progress.

`channelThreshold` is 0..255. A changed pixel has at least one raw RGBA channel
above this delta. Maximum and mean include all channel differences; the exact
absolute channel sum is a decimal string. `identical` means zero raw deltas;
`within-threshold` retains nonzero raw metrics with no threshold-exceeding pixels;
`different` retains changed counts and bounds. `dimension-mismatch` carries null
change metrics with zero compared pixels. This does not resample images or perform
OCR, semantic layout interpretation or perceptual color correction.

Chat displays metrics immediately and loads the original metadata/paged PNGs
only when Open images is selected. Before, After and Split modes reuse verified
originals. Split is available for matching dimensions; cancellation and closing
release both URLs. Both original metadata reads finish before image reads start.

Reference: [REA deterministic PNG comparison](https://github.com/morluto/rea/blob/main/src/browser/PngVisualDiff.ts).
