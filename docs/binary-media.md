# Binary media transport

The gateway advertises `hello.features.binaryMedia`. Images, audio, video, documents, and archives delivered by `send_media` travel as raw bytes. The SDK also packs inline upload sources, PCM audio, and native voice/video payloads into binary envelopes. JSON-facing protocol fields remain compatible with existing callers; base64 fields are restored only after transport decoding.

Files are limited to 100 MiB each. Uploads allow 100 MiB of combined media per request. Transfers use chunks of at most 256 KiB; negotiated request frame limits may reduce upload chunk size. Receivers reject invalid sizes, duplicate or out-of-order chunks, and interleaved transfers. Incomplete transfers release their reservations on cancellation, disconnect, or 30 seconds without progress. Upload cancellation closes the client connection to discard incomplete server state. Senders serialize file transfers on each socket and wait for outbound buffers to drain.

## Wire formats

All integers are unsigned, big-endian. WebSocket messages use the binary opcode.

| Frame  | Layout                                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------------------------- |
| `NXMD` | Four ASCII magic bytes, 32-bit JSON header length, UTF-8 header, original file bytes                                 |
| `NXBF` | Four ASCII magic bytes, 32-bit JSON header length, UTF-8 envelope header, concatenated binary parts                  |
| `NXCH` | Four ASCII magic bytes, 16-byte transfer ID, 32-bit total transfer length, 32-bit byte offset, up to 256 KiB of data |

`NXMD` headers contain `attachment` metadata and optional `streamId`/`sessionId`. Metadata includes `id`, `filename`, `mimeType`, `byteLength`, and optional `description`/`asFile`. File bytes never appear in this header. Stream `attachment` events and terminal `AskResult.attachments` carry the same metadata and delivery IDs.

`NXBF` headers contain `json` and `parts`. Binary fields in `json` are null placeholders. Each part specifies a property `path`, byte `length`, and restored JSON `encoding` (`base64` or `array`). Parts are contiguous in listed order. Paths must refer to existing placeholders and cannot contain prototype keys. PCM and inline sources are transported as bytes even when the compatibility API represents them as strings.

`NXCH` wraps a complete `NXMD` or `NXBF` frame. Offsets begin at zero and advance by the exact payload length. A matching transfer ID with zero total length, zero offset, and no payload cancels an incomplete transfer. Framing allows up to 101 MiB including metadata; the file limit remains 100 MiB.

## Library API

Register `client.onAttachment()` before asking for media. It receives `ReceivedAttachment` with raw `Uint8Array<ArrayBuffer>` data after assembly. The SDK does not retain these files after notifying listeners; store the bytes or create a browser `Blob` in your callback. Delivery metadata is also present in the final result for correlation.

Use `client.sendAudio(callId, pcm)` and `client.onAudio()` for raw PCM16 byte arrays. The existing enum-based `Method.VoiceAudio` call remains supported and is packed into binary frames automatically.

These are transport limits. Provider decoding limits, accepted document formats, installed tools, user permissions, and voice configuration still determine what Nexa can do with uploaded content.

After reassembly, the client responds with `media.acknowledge` and `{ id, received }`. The acknowledgment is scoped to the receiving connection. `received: true` means the attachment handler completed successfully; it does not assert that a human viewed the file. Missing or failed handlers send `received: false`. The server waits up to 15 seconds after queuing the final chunk; absent acknowledgment leaves delivery unconfirmed and returns an error to the model. The SDK performs this exchange automatically and awaits asynchronous attachment handlers.

## Generated 3D models

TRELLIS results arrive through `onAttachment` as GLB (`model/gltf-binary`) and
optional Gaussian PLY (`application/x-ply`). Nexa also delivers PNG views through
the same attachment callback. Use `NexaMedia.geometryFormat(file)` to identify a
validated GLB/PLY header and `NexaMedia.geometryBlob(file)` to create a Blob for
saving or viewing. Upload models with `await NexaMedia.model3d(blob, filename)`.
The existing 100 MiB transport limit applies to each file.

Nexa optimizes GLB with lossless `EXT_meshopt_compression`. This SDK exports
`MeshoptDecoder` from `nexa-transport/media`. Pass it to a compatible glTF loader
(for example `loader.setMeshoptDecoder(MeshoptDecoder)`) before loading a model.
Callers own rendering, camera controls and Blob URL lifetimes; revoke object URLs
when the viewer is disposed. Gaussian PLY needs a Gaussian splat renderer, not an
ordinary triangle-mesh PLY loader. PNG previews work without any 3D renderer.

`NexaMedia.nativeEvent` preserves typed geometry acceptance, progress, preview,
chunk and completion events, including binary byte normalization. Generated
asset files use binary attachment delivery; they are not embedded in chat text.
