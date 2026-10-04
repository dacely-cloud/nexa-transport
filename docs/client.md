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

`client.uploadData(blob, filename, options?)` streams a file to the authenticated workspace and returns `DataFile` from `nexa-transport/protocol`. `DataUploadOptions`, exported from `nexa-transport`, accepts `signal` and `onProgress(uploadedBytes: bigint, totalBytes: bigint)`. The helper holds at most one 192 KiB source slice in flight and reports server-acknowledged progress. Pass the returned path to an agent request to start analysis; upload alone makes no model call.

`client.company(command)` reads or changes the owner's durable company over the existing binary NCO2 channel. See Persistent company below for commands, revision checks, and department permissions.

`CompanyOp.Construction` saves up to 128 office pieces using NCMP v4. It requires `officeConstruction`. Each piece has a numeric ID, a fixed catalog kind, a floor (0–5), half-metre grid coordinates (−128–128), and a quarter-turn rotation (0–3). Save the full list with the current company revision and retain the command ID for uncertain retries. The server sends public geometry in NGOP v5 snapshots on the same connection, including to visitors; visitor credentials still cannot modify it. Older clients negotiate their previous NCMP/NGOP versions and do not receive construction fields.

When `companyTeamAreas` is advertised, NCMP v6 adds private department assignments to the construction command: `teams: [{ departmentId, placementId }]`. Each department and each saved piece of kind `team` may appear once. Assignments and construction save atomically at the company revision. Omit `teams` to preserve assignments whose team pieces still exist, or send `[]` to clear them. Snapshots include `department.area` (including placement zero); older snapshot versions omit it. Department names, membership, and assignment IDs never enter visitor game packets. These designations do not move desks or alter running work.

`client.project(projectId, command?)` reads a private project snapshot or submits an owner decision: plan, approve, request a correction, or accept a delivery. It returns durable work history and the current spending allowance. Money uses integer USD microcents (`100000000n` equals $1), and revisions use `bigint`. Retain the exact command, including its ID and revision, when retrying after a timeout or disconnect; the server deduplicates it. The client does not automatically replay spending decisions. Project commands and file requests require the negotiated `companyProjects` capability and travel as binary NCPW frames over the existing Chat socket.

`client.projectArtifact(projectId, attemptId, path, offset?)` reads a captured delivery referenced in the owner's project history. Each response contains at most 64 KiB, with `offset`, `total`, and a SHA-256 `digest`. Continue from `offset + bytes.length` until `total` is reached; verify the assembled file against the digest before using it. The server resolves the file from the authenticated account's recorded attempt, never from an arbitrary filesystem path. Treat downloaded HTML as untrusted content when building previews. Protocol types are available from `nexa-transport/projects`; work and command types are available from `nexa-transport/company-work`.

`client.subscribeProject(projectId, onSnapshot, onError)` requires `companyProjectLive`. It delivers an initial private snapshot followed by changed work or spending over the same socket. Call the returned release function when closing the project view. A disconnect ends the subscription and calls `onError`; reconnect with backoff and subscribe again to receive current authoritative state. At most eight project subscriptions may be open on one connection. Closing a subscription does not cancel approved work.

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

### Memory ownership

Consume a turn's events as they arrive. Breaking out of iteration drops unread events and cancels a running turn; `await turn.cancel()` also drops buffered events after a turn has completed. Normal completion preserves unread events until they are consumed, explicitly cancelled, or the turn becomes unreachable. Use `client.call(Method.AgentAsk, ...)` when only the final result is needed.

Pending RPCs and active streaming turns have separate limits. Binary uploads share a 101 MiB budget per client; rejected requests are not encoded or queued, and queued payloads are removed when their requests settle. This budget covers retained encoded payloads, not temporary encoding allocations or application-owned media.

Attachment handlers may run concurrently. Outstanding deliveries, including acknowledgements, are limited to 64 and 101 MiB per client. Exceeding either limit closes the connection with a limit error. Finish handlers promptly and release application-owned file data when no longer needed. Call listener unsubscribe functions when removing a view and `client.close()` when disposing its client. Each browser tab owns its own client and memory budgets.

## Office layout

`client.officeLayout()` reads the signed-in owner's saved geometry when `hello.features.officeLayout` is true. `client.officeLayout({ revision, pieces })` saves a replacement layout using the revision returned by the read. Coordinates are half-metre units and rotation is a quarter turn; the codec allows up to 128 bounded pieces.

The OLAY binary channel uses the existing authenticated Chat socket. The gateway derives ownership from that connection, requires write scope for edits, and rejects visitors. Successful edits appear in the public office geometry stream without including prompts or granting visitors any controls. A stale revision is rejected: reload the layout before retrying. Disconnects fail pending requests without replaying edits.

## Company records

`client.company()` reads the account's persistent employees, departments, and project briefs when `hello.features.officeCompany` is true. Pass a `CompanyCommand` from `nexa-transport/company-types` to rename the company, hire or update an employee, save a department, or create a staffed brief. Each mutation supplies the last read `revision` and a unique `id` such as `crypto.randomUUID()`.

Keep that exact command until its outcome is known. If a request times out or the connection closes, retry the same ID and payload: the gateway's durable command log returns current state without repeating the change. Reusing an ID with different contents is rejected. An unrelated stale edit requires a fresh read and a new command ID after reconciling the changes.

NCO2 uses the existing Chat socket and accepts no client-supplied account identity. Visitors cannot read or write company records. Employee configuration inherits the deployment's tool restrictions; an explicit tool list only narrows them. Creating a brief saves its objective and staffing; execution approval, budgets, and review belong to the subsequent project workflow.

## Company budget

`client.supportsCompanyLimits` reports the negotiated `officeCompanyLimits` capability. `client.companyLimits()` reads the current company-project ceiling, settled spending, committed funds, running count, and concurrency. Money is `bigint` USD microcents (100,000,000 per dollar). A `null` ceiling means each project's approved allowance applies without an additional company cap; zero is a real cap.

`client.subscribeCompanyLimits(listener, onError)` returns an unsubscribe function. It receives a snapshot followed by contiguous binary NCO2 updates on the existing owner connection. Usage may change without increasing the policy revision. Disconnection reports an error and restores only read subscriptions after reconnect; rejected streams require explicitly subscribing again. Release the subscription when the budget view closes.

To change limits, pass `{ id, revision, limit, concurrency }` to `client.companyLimits`. Keep the original ID and payload for an uncertain retry. The backend rejects stale approvals and a ceiling below spent plus committed funds. Concurrency is 1–32; reducing it does not cancel running tasks. Each project still requires its own approval. This controls real project usage, independently of ordinary Chat spending and game progression. Visitors have no budget capability, commands, or financial packets.

### Department tool permissions

`client.supportsDepartmentTools` reports the `officeDepartmentTools` capability. With it, `company` and `subscribeCompany` negotiate NCO2 version 2 to include each department's `tools` policy, or version 3 when department knowledge is also supported. Without either capability they retain version 1. `CompanyOp.DepartmentPolicy` saves `{ departmentId, name, instructions, tools, id, revision }` atomically. `tools: null` inherits existing access; `[]` allows no action tools; a list permits only those exact names intersected with deployment and employee policies. The SDK rejects this command locally on older gateways.

Use the current company revision and retain the exact command ID/payload for an uncertain retry. Department changes take effect on the employee's next turn, including existing Chat, Telegram, Discord and background work; in-flight calls retain their starting policy. Older clients' `CompanyOp.Department` edits preserve existing tool restrictions. These are tool permission ceilings, not independent filesystem/network sandboxes. Private department policies and instructions are owner data, never visitor packets.

`hello.features.officeVerification` negotiates NCP2 version 3 and NCE1 version 2 on the existing private socket. Project evidence can then include a host-classified `outcome`: `command-passed`, `command-failed`, or `file-inspected`. Employee project rows optionally include `verification` counters for `passedCommands`, `failedCommands`, `fileInspections`, and `unclassifiedReceipts`. Completed command exits are distinct from individual test results; output text cannot classify a receipt. Failed commands remain recorded when an assignment becomes blocked, and polling one background process does not multiply its count. Legacy records retain unclassified evidence, and reconnects to older gateways use the older read formats. Visitors receive neither the capability nor private reports.

### Department knowledge and procedures

`client.supportsDepartmentKnowledge` reports the `officeDepartmentKnowledge` capability. Company reads and watches then negotiate NCO2 version 3 on the same owner socket. A department's private `library` contains at most eight entries: `{ id, title, body, kind, revision, reviewedAt, archived }`. The kind is `note` or `procedure`; the entry revision is a positive 32-bit integer and `reviewedAt` is an exact `bigint` millisecond timestamp.

`CompanyOp.KnowledgeDraft` saves `{ departmentId, entryId, title, body, kind, id, revision }`. An empty `entryId` creates an entry. Editing increments its entry revision and clears publication. Titles are unique within the department. `CompanyOp.KnowledgePublish` and `CompanyOp.KnowledgeArchive` take `{ departmentId, entryId, id, revision }`, using the current company revision. Publication is an explicit owner review decision; the backend assigns the timestamp. Keep the command unchanged for an uncertain retry. Reconnect restores watches without replaying mutations.

Only published, unarchived entries enter member employees' instructions on subsequent turns, including connected chats and background work. Drafts never enter their context. Existing turns retain their starting instructions and tool permissions. Archiving preserves the record; saving an archived entry restores it as a new draft. These are owner-reviewed notes and procedures, not an automatic skill rating or a claim that the model became smarter. Versions 1 and 2 omit the library, and legacy department edits preserve it. Visitors receive neither this capability nor the private contents. The website/backend and NEXA need the matching update; no new environment setting or connection is required.

## Per-message reasoning effort

`agent.ask` and `client.stream` accept optional `reasoningEffort`: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`. An updated NEXA gateway applies it to that turn without changing the saved agent configuration. Omit it to retain the agent's default. Providers map unsupported levels to their supported effort settings.

`hello.features.officeEmployeeCosts` negotiates NCE1 version 3 for private employee portfolios. Each project can carry exact `bigint` costs: `spent` (settled USD microcents), `reserved` (maximum outstanding liability), `charges` (metered requests including cancellations), and `unresolved`. Attribution uses the original execution employee, including failed work and later receipts. Legacy gateways omit `cost`; absence does not mean free work. One USD is 100,000,000 microcents. Reads do not approve, dispatch, or settle work.
