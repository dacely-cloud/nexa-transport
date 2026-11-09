# Client API

Import `NexaClient` from `nexa-transport`, `Method` and protocol types from `nexa-transport/protocol`, `EventName` from `nexa-transport/events`, and `NexaMedia` from `nexa-transport/media`.

## NexaClient

`client.emotions(agentId?, options?)` reads the current mood, feelings and private relationship toward the authenticated user. Use `client.supportsEmotions` to check gateway support, and `client.subscribeEmotions(listener, onError, agentId?)` to keep a view current. The returned cleanup function releases that view. Same-agent views share reads and timers; disconnect pauses polling and reconnect reads fresh state. See [emotional state](emotions.md) for response fields and UI examples.

| Member                                       | Contract                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NexaClient.connect(options)`                | Returns `Promise<NexaClient>` after socket connection, challenge, negotiation, and authentication. Throws if connection/authentication fails.                |
| `client.hello`                               | Validated `HelloOk`: protocol versions, server connection ID, capabilities, identity/scopes, policy, and limits.                                             |
| `client.connected`                           | Whether the client remains connected.                                                                                                                        |
| `client.call(Method.Name, params, options?)` | Typed `Promise<ResultOf<method>>`. Parameters and results are validated. Raw method strings and `Method.Connect` are excluded from this API.                 |
| `client.stream(params, options?)`            | Starts `AgentStream` and returns `TurnStream`. Accepts the stream parameters, including message, optional conversation, attachments, and optional stream ID. |
| `client.on(EventName.Name, listener)`        | Registers a validated typed event listener; returns unsubscribe.                                                                                             |
| `client.onEvent(listener)`                   | Registers a raw gateway-envelope listener, including future event names; returns unsubscribe.                                                                |
| `client.onSequenceGap(listener)`             | Reports `{ expected: bigint, received: bigint }`; returns unsubscribe. Refresh state when a gap matters.                                                     |
| `client.onClose(listener)`                   | Reports the connection-ending error; returns unsubscribe. A listener registered after failure is called immediately.                                         |
| `client.reconnecting`                        | Whether an interrupted connection is waiting for or performing another handshake.                                                                            |
| `client.onReconnect(listener)`               | Reports restored authentication/subscriptions; returns unsubscribe. Refresh saved state here.                                                                |
| `client.close()`                             | Idempotent close; rejects pending requests and terminates active stream consumers.                                                                           |

`client.onAttachment(listener)` delivers `ReceivedAttachment` records with `Uint8Array<ArrayBuffer>` data, filename, MIME type, delivery ID, and optional stream/session IDs. Subscribe before starting a request; the returned function unsubscribes. Binary files are separate from JSON events and are not retained by the client. A handler may return `Promise<void>`; the SDK acknowledges receipt only after handlers complete. Throw or reject on handling failure. Missing handlers send a failure acknowledgment. Receipt does not confirm that a human viewed the file.

`client.onAudio(listener)` delivers `ReceivedAudio` records with `callId`, `sampleRate`, and raw PCM16 `data`. `client.sendAudio(callId, data, options?)` sends a PCM16 byte array and returns the typed `VoiceAudio` RPC result. Both received types are exported from `nexa-transport`.

`client.uploadData(blob, filename, options)` returns `ConversationDataFile`. Its required `context` comes from authenticated `data.upload.create`/`target` discovery or a confirmed, explicitly reviewed `data.upload.select` result; the required `requestId` remains unchanged across acknowledgment recovery. Optional `signal`, `onProgress(uploadedBytes: bigint, totalBytes: bigint)` and `onStarted(upload)` control observation. One negotiated source slice of at most 4 MiB is in flight, bounded further by gateway memory/frame limits. Start returns exact offset and state; completed/publishing originals are observed without sending replacement bytes. `DataUploadFailure` retains exact original metadata and a known upload ID, without claiming native cleanup. Send returned IDs in `uploadedSources` alongside `conversationId`; the server resolves them against actual prepared placement before file interpretation. Target, account, private owner, provider or assignment changes fail closed. Upload itself makes no model call. See [large data uploads](../README.md#large-data-uploads) for the current example and resource limits.

There is no `client.ask()` convenience method. Use `client.call(Method.AgentAsk, ...)`.

### ClientOptions

Import `ClientOptions` and `CallOptions` as types from `nexa-transport/options`.

`tokenProvider` obtains a fresh one-time website ticket before each socket opens,
including reconnects. Tickets remain in memory; established sockets do not need
periodic renewal. The backend continues enforcing session expiry and revocation.
The provider cannot be combined with API keys, pairing or device credentials.

| Option               | Type                     | Behavior/default                                                                                             |
| -------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `url`                | `string`                 | Required WebSocket URL. `http:`/`https:` are converted to `ws:`/`wss:`. Userinfo and fragments are rejected. |
| `apiKey`             | `string`                 | Personal key, operator token, or paired-device credential. Cannot be empty when provided.                    |
| `tokenProvider`      | `() => Promise<string>`  | Fresh single-use ticket per connection attempt, including reconnects.                                        |
| `reconnect`          | `boolean`                | Retry established connections with bounded backoff; true by default.                                         |
| `deviceId`           | `string`                 | Stable installation identifier for device authentication.                                                    |
| `deviceName`         | `string`                 | Display name during pairing.                                                                                 |
| `pairingCode`        | `string`                 | Operator-issued one-time pairing code.                                                                       |
| `scopes`             | `readonly Scope[]`       | Requested subset of server-granted scopes.                                                                   |
| `client`             | `ClientIdentity`         | `{ id, version, platform }` sent in the handshake.                                                           |
| `onListenerError`    | `(error: Error) => void` | Receives exceptions thrown by application event callbacks.                                                   |
| `connectTimeoutMs`   | `number`                 | Connection and handshake deadline; 15,000 ms.                                                                |
| `requestTimeoutMs`   | `number`                 | Default RPC deadline; 60,000 ms.                                                                             |
| `maxMessageBytes`    | `number`                 | JSON frame limit; 16 MiB.                                                                                    |
| `maxPendingRequests` | `number`                 | In-flight RPC ceiling; 64.                                                                                   |
| `maxActiveStreams`   | `number`                 | Active streaming-turn ceiling, including acknowledged turns; 64.                                             |
| `signal`             | `AbortSignal`            | Cancels connection establishment. Use call/stream signals for subsequent operations.                         |

`ClientIdentity` also accepts `metadataOnlyAttachments?: boolean`. Setting it to true requests metadata-only live file delivery on supporting gateways; use `downloadSessionFile` for the original bytes. It does not enable automatic previews or downloads.

`CallOptions` has `timeoutMs` and `signal`. Pass it as the third argument of `call`. It controls local waiting, not transactional rollback on the server.

## TurnStream

Import `TurnStream` as a type from `nexa-transport/stream` and `StreamOptions` from `nexa-transport/stream-options`.

| Member                            | Behavior                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `streamId`                        | Client-chosen stream identifier.                                                                     |
| `result`                          | `Promise<AskResult>` settled by the terminal event, or rejected on error/cancellation.               |
| `for await (const event of turn)` | Consumes validated `WireTurnEvent` values with bounded buffering.                                    |
| `accepted`                        | `Promise<StreamAccepted>` with the server run ID and optional resolved session ID before completion. |
| `steer(message)`                  | `Promise<boolean>` for a correction to this exact active run; see [steering](steering.md).           |
| `detach()`                        | Releases the local iterator/result and listeners without cancelling accepted server work.            |
| `cancel()`                        | Requests cancellation using the server run ID and closes the local stream.                           |

Breaking out of the iterator cancels unfinished work. Consume the iterator and await `result` inside your application's error handling. A completed iterator does not replace checking the terminal result.

`StreamOptions` extends `CallOptions`:

| Option              | Default                                               |
| ------------------- | ----------------------------------------------------- |
| `timeoutMs`         | Client RPC deadline, for stream-start acknowledgement |
| `signal`            | None                                                  |
| `turnTimeoutMs`     | 3,600,000 ms for the entire turn                      |
| `maxBufferedEvents` | 256 unread events                                     |
| `maxBufferedBytes`  | 8 MiB of unread JSON event data                       |

## NexaMedia

| Static method              | Input                                                  | Result                                                                                                                  |
| -------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `image(blob, title?)`      | `Blob` with an image MIME type                         | `Promise<InboundAttachment>` with `type: 'image'`                                                                       |
| `video(blob, title?)`      | `Blob` with a video MIME type                          | `Promise<InboundAttachment>` with `type: 'video'`                                                                       |
| `videoFrame(blob, title?)` | Image `Blob`                                           | `Promise<InboundAttachment>` with `type: 'video-frame'`                                                                 |
| `document(blob, title?)`   | Document `Blob`                                        | `Promise<InboundAttachment>` with `type: 'document'`                                                                    |
| `nativeEvent(event)`       | `WireTurnEvent`                                        | Validated `NcapDelta`, or `null` for non-NCAP events. Reconstructs voice/video chunk bytes; throws on invalid payloads. |
| `bytes(value)`             | Protocol `JsonValue` containing contiguous byte values | `Uint8Array<ArrayBuffer>`; rejects invalid or oversized binary JSON.                                                    |
| `base64(bytes)`            | `Uint8Array`                                           | Base64 string.                                                                                                          |
| `model3d(blob, title?)`    | GLB/PLY `Blob`                                         | `Promise<InboundAttachment>` using the document carrier after header validation.                                        |
| `geometryFormat(file)`     | `{ data, mimeType }`                                   | `glb`, `ply`, or null; invalid declared GLB version/length throws.                                                      |
| `geometryBlob(file)`       | Validated GLB/PLY bytes and MIME type                  | `Blob`; throws for unsupported media.                                                                                   |
| `fromBase64(value)`        | Base64 string                                          | `Uint8Array<ArrayBuffer>`.                                                                                              |

Image, video, and frame encoders require a non-empty MIME type. `document` uses `File.name` (or an explicit title) to infer common document/data MIME types when `Blob.type` is empty, with `application/octet-stream` as the fallback. Inline size remains 1 byte through 300 MiB. They encode bytes without validating codecs, extracting archive contents, or transcoding. Browser `File` objects work because they extend `Blob`.

`NexaGeometry` and `MeshoptDecoder` are exported from the same media entry point. `NexaGeometry.text(prompt, options?)` returns agent-mediated `StreamParams`; `NexaGeometry.image(blob, options?)` returns `Promise<StreamParams>` for a PNG/JPEG reference bounded to 16 MiB. `GeometryOptions` accepts an unsigned 32-bit seed and 1–100 steps; `ImageGeometryOptions` additionally accepts resolution 512 or 1024. These helpers request tool execution and preserve normal tool policy. Rendering, archive extraction, and model-provider access remain application/host responsibilities.

## Voice helpers

`startVoice(params?, options?)` returns the typed `VoiceStart` result. `stopVoice(callId, options?)` returns the typed `VoiceStop` result. `sendAudio(callId, bytes, options?)` sends mono PCM16 with the negotiated binary carrier and base64 fallback. `onAudio` reports `ReceivedAudio`; `onTranscript` reports `ReceivedTranscript { callId, text, final }`. Subscribe before starting voice. A non-final transcript replaces the current hypothesis; a final transcript settles one utterance. The helpers do not acquire microphones, resample, or play sound. See [streaming voice](streaming-voice.md).

## Events

`EventMap` maps each `EventName` wire name to its payload type. `isEventData(name, value)` is exported from `nexa-transport/events` for validating external payloads against those types. Ordinary `client.on()` subscribers already receive validated data.

`GatewayEvent` and `SequenceGap` are exported types from `nexa-transport`. Raw event sequence numbers are bigint; convert explicitly when storing them as JSON.

For exact payload fields see [protocol types](protocol.md), especially `TurnEventData`, `TurnEndData`, `SessionMessageData`, `ApprovalRequestedData`, `ApprovalResolvedData`, `ChangedData`, and `VoiceCallEvent`. The event-only helper types are:

| Type            | Fields                                                               |
| --------------- | -------------------------------------------------------------------- |
| `VoiceAudio`    | `callId: string`, `pcm: string` (base64 PCM16), `sampleRate: number` |
| `VoiceIdentity` | `callId: string`                                                     |
| `VoiceEvent`    | `VoiceCallEvent` intersected with `VoiceIdentity`                    |
| `Shutdown`      | `reason: string`                                                     |

## Errors

Import `TransportError` and `TransportErrorCode` from `nexa-transport/errors`. `TransportError` extends `Error` with a `code`, optional `remote: WireError`, and optional `closeDetails: WebSocketCloseDetails`. For WebSocket disconnects, `closeDetails` preserves the numeric close code, reason, and `wasClean` flag; the error message includes the code and reason. Code 1006 means no normal close handshake was received, not a confirmed authentication failure.

| Code constant | Value        | Meaning                                   |
| ------------- | ------------ | ----------------------------------------- |
| `Closed`      | `closed`     | Closed connection/client                  |
| `Timeout`     | `timeout`    | A configured deadline expired             |
| `Aborted`     | `aborted`    | Cancellation or disconnected stream start |
| `Protocol`    | `protocol`   | Invalid or inconsistent protocol payload  |
| `Limit`       | `limit`      | Local buffering/message/request limit     |
| `Connection`  | `connection` | Socket establishment/transport failure    |
| `Remote`      | `remote`     | Server returned a typed RPC error         |

Local validation and media helpers can also throw native errors such as `TypeError` and `RangeError`. Do not assume every caught exception is a `TransportError`.

## Protocol exports

`nexa-transport/protocol` exports `Method`, `GatewayMethods`, `MethodName`, `ParamsOf<M>`, `ResultOf<M>`, and the generated protocol interfaces, aliases, and value objects. `Method` is the runtime enum used for RPC dispatch. Other generated value objects describe wire-level unions and are not additional RPCs.

The SDK validates the bundled protocol version, retains extensible JSON payloads, and exposes the server's negotiated capabilities in `hello`. Updating these generated types requires regenerating the contract against a compatible Nexa checkout and testing both endpoints.

## Reconnection and session recovery

Established connections reconnect automatically with jittered exponential delays from 250–500 ms up to 15–30 seconds. Initial connection failures reject directly. Set `ClientOptions.reconnect` to `false` to opt out. Protocol and application-handshake refusals stop retries; browsers may report failed HTTP upgrades only as generic network failures. `close()` cancels retries permanently. Issued pairing credentials replace the single-use code for subsequent connections.

`connected` becomes false during interruption. `reconnecting` indicates scheduled or active retries. `onClose(listener)` reports each interruption; `onReconnect(listener)` runs after authentication and session subscription restoration. Both return unsubscribe functions. Existing event and attachment listeners survive reconnect. In-flight calls and streams reject, and no mutation is automatically repeated.

`resumeSession(sessionId)` subscribes to the owned session and returns a typed `SessionSnapshot` containing `messages`, active `tasks`, and saved `files`, plus optional complete presentation `history` when `supportsSessionHistory` is true. Use it after reconnect or a page reload, with the session key saved by your application. The `files` array contains metadata only: resuming never downloads saved attachment bytes. Render file cards from that metadata and call `Method.SessionsDownload` only when the user requests a file; bytes then arrive through `onAttachment`. Keep ZIPs, PDFs and other documents lazy. Image/video previews may be requested explicitly by the UI.

`readHistory(sessionId)` returns validated journal records. `readHistorySnapshot(sessionId, cursor?, endCursor?)` returns `{ records, endCursor }`; pass the previous complete `endCursor` as `cursor` for an incremental read. The optional third argument pins a fixed snapshot boundary. Cursors count bytes and stay decimal strings. `supportsSessionHistoryUpdates` gates durable append notifications for subscribed sessions. `downloadSessionFile(sessionId, attachmentId, signal?, progress?)` returns matching original `ReceivedAttachment` bytes through authenticated binary delivery. The optional progress callback receives `(receivedBytes, totalBytes)` for that saved file, excluding transport framing. Chunked transfers report incremental progress; unchunked transfers report completion. Downloads reject after 60 seconds without progress, release their local request, and can be retried. The overall deadline remains ten minutes. See [session recovery](sessions.md) for reconciliation and download ownership.

`readHistorySnapshot(sessionId, cursor?, endCursor?, signal?)` accepts an abort signal. Cancelling a view stops its queued and in-flight history pages and releases their request capacity without closing the shared connection.

### Memory ownership

Consume a turn's events as they arrive. Breaking out of iteration drops unread events and cancels a running turn; `await turn.cancel()` also drops buffered events after a turn has completed. Normal completion preserves unread events until they are consumed, explicitly cancelled, or the turn becomes unreachable. Use `client.call(Method.AgentAsk, ...)` when only the final result is needed.

Pending RPCs and active streaming turns have separate limits. Binary uploads share a 301 MiB budget per client; rejected requests are not encoded or queued, and queued payloads are removed when their requests settle. This budget covers retained encoded payloads, not temporary encoding allocations or application-owned media.

Attachment handlers may run concurrently. Outstanding deliveries with unfinished handlers are limited to 64 and 301 MiB per client. Exceeding either limit closes the connection with a limit error. Finish handlers promptly and release application-owned file data when no longer needed. Call listener unsubscribe functions when removing a view and `client.close()` when disposing its client. Reassembly, JSON/binary decoding, unread turn events, in-progress project files and unfinished file handlers share `ClientOptions.maxInboundBytes`, defaulting to 602 MiB and configurable downward. Multiple clients in the same JavaScript realm also share a 1204 MiB ceiling. Normal handler completion releases credit before the receipt RPC replies. Abandoned backing buffers have a collection fallback; a retained subview continues to hold its charge. Browser tabs and workers have separate JavaScript realms. These working-storage estimates do not account for all application-owned memory.

## Per-message reasoning effort

`agent.ask` and `client.stream` accept optional `reasoningEffort`: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`. An updated NEXA gateway applies it to that turn without changing the saved agent configuration. Omit it to retain the agent's default. Providers map unsupported levels to their supported effort settings.

Both methods also accept `targetTimeSeconds`, an integer from 1 through 172800 (two days). The gateway gives the model a soft time target for planning, reasoning, verification, and refinement, shared across tool hops. The model can finish early or continue necessary work after the target. This field does not cancel the task or change transport timeouts. An explicit `reasoningEffort` takes precedence over the target's suggested effort; omitting the target preserves the existing behavior.

## Workflow capabilities

`supportsWorkflowDrafts`, `supportsWorkflowGraph`, `supportsWorkflowGroups`, `supportsWorkflowPlanning`, `supportsWorkflowPlanningSources`, and `supportsWorkflowRuns` check the connected gateway's advertised versions and required methods. They do not grant account access. Additive methods such as deletion, publications, schedules, model resolution, terminal controls, and usage must also appear in `client.hello.features.methods` before use. Call them with `client.call(Method.Workflows…, params)` and the generated `ParamsOf`/`ResultOf` types. See the [workflow guide](workflows.md) for examples and portable entry points.

For the complete package import map, see [entry points](exports.md).
