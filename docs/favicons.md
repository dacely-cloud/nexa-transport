# Website previews

Subscribe with `client.on('tool.sites', update => { ... })`. The typed payload has
`streamId`, `callId`, and up to five `sites`, each containing an HTTPS `origin` and
a raster `favicon` data URI. Associate it with the existing tool card by stream
and call ID. This event can arrive after `turn.end`; it is not a new tool result
and must not restart the response or change the tool's completion status.

Nexa extracts sites from browser_open, browser_navigate, web_fetch and web_search
calls/results. It fetches icons through its configured browser proxy, with no
direct fallback. Missing proxy configuration or failed icons produce no preview.
The client must display supplied bytes rather than fetch the origin itself.

Icon requests are deduplicated and run with bounded concurrency outside agent
execution. Nexa caches successes for seven days and failures for one hour, with
bounded memory and disk storage. A restarted gateway reuses the disk cache.
