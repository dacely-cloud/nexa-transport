# Client API

Import `NexaClient` from `nexa-transport`, `Method` and protocol types from `nexa-transport/protocol`, `EventName` from `nexa-transport/events`, and `NexaMedia` from `nexa-transport/media`.

## NexaClient

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
| `client.close()`                             | Idempotent close; rejects pending requests and terminates active stream consumers.                                                                           |

`client.onAttachment(listener)` delivers `ReceivedAttachment` records with `Uint8Array<ArrayBuffer>` data, filename, MIME type, delivery ID, and optional stream/session IDs. Subscribe before starting a request; the returned function unsubscribes. Binary files are separate from JSON events and are not retained by the client. A handler may return `Promise<void>`; the SDK acknowledges receipt only after handlers complete. Throw or reject on handling failure. Missing handlers send a failure acknowledgment. Receipt does not confirm that a human viewed the file.

`client.onAudio(listener)` delivers `ReceivedAudio` records with `callId`, `sampleRate`, and raw PCM16 `data`. `client.sendAudio(callId, data, options?)` sends a PCM16 byte array and returns the typed `VoiceAudio` RPC result. Both received types are exported from `nexa-transport`.

There is no `client.ask()` convenience method. Use `client.call(Method.AgentAsk, ...)`.

### ClientOptions

Import `ClientOptions` and `CallOptions` as types from `nexa-transport/options`.

| Option               | Type                     | Behavior/default                                                                                             |
| -------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `url`                | `string`                 | Required WebSocket URL. `http:`/`https:` are converted to `ws:`/`wss:`. Userinfo and fragments are rejected. |
| `apiKey`             | `string`                 | Personal key, operator token, or paired-device credential. Cannot be empty when provided.                    |
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
| `signal`             | `AbortSignal`            | Cancels connection establishment. Use call/stream signals for subsequent operations.                         |

`CallOptions` has `timeoutMs` and `signal`. Pass it as the third argument of `call`. It controls local waiting, not transactional rollback on the server.

## TurnStream

Import `TurnStream` as a type from `nexa-transport/stream` and `StreamOptions` from `nexa-transport/stream-options`.

| Member                            | Behavior                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `streamId`                        | Client-chosen stream identifier.                                                       |
| `result`                          | `Promise<AskResult>` settled by the terminal event, or rejected on error/cancellation. |
| `for await (const event of turn)` | Consumes validated `WireTurnEvent` values with bounded buffering.                      |
| `cancel()`                        | Requests cancellation using the server run ID and closes the local stream.             |

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
| `fromBase64(value)`        | Base64 string                                          | `Uint8Array<ArrayBuffer>`.                                                                                              |

Blob encoders require a non-empty MIME type and a size from 1 byte through 100 MiB. They encode bytes without validating codecs, extracting archive contents, or transcoding. Browser `File` objects work because they extend `Blob`.

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

`resumeSession(sessionId)` subscribes to the owned session and returns a typed `SessionSnapshot` containing `messages`, active `tasks`, and saved `files`. Use it after reconnect or a page reload, with the session key saved by your application. The `files` array contains metadata only: resuming never downloads saved attachment bytes. Render file cards from that metadata and call `Method.SessionsDownload` only when the user requests a file; bytes then arrive through `onAttachment`. Keep ZIPs, PDFs and other documents lazy. Image/video previews may be requested explicitly by the UI.
