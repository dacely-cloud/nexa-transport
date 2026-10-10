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
| `client.reconnecting`                        | Whether an interrupted connection is waiting for or performing another handshake.                                                                            |
| `client.onReconnect(listener)`               | Reports restored authentication/subscriptions; returns unsubscribe. Refresh saved state here.                                                                |
| `client.close()`                             | Idempotent close; rejects pending requests and terminates active stream consumers.                                                                           |

`client.onAttachment(listener)` delivers `ReceivedAttachment` records with `Uint8Array<ArrayBuffer>` data, filename, MIME type, delivery ID, and optional stream/session IDs. Subscribe before starting a request; the returned function unsubscribes. Binary files are separate from JSON events and are not retained by the client. A handler may return `Promise<void>`; the SDK acknowledges receipt only after handlers complete. Throw or reject on handling failure. Missing handlers send a failure acknowledgment. Receipt does not confirm that a human viewed the file.

`client.onAudio(listener)` delivers `ReceivedAudio` records with `callId`, `sampleRate`, and raw PCM16 `data`. `client.sendAudio(callId, data, options?)` sends a PCM16 byte array and returns the typed `VoiceAudio` RPC result. Both received types are exported from `nexa-transport`.

`client.uploadData(blob, filename, options?)` streams a file to the authenticated workspace and returns `DataFile` from `nexa-transport/protocol`. `DataUploadOptions`, exported from `nexa-transport`, accepts `signal` and `onProgress(uploadedBytes: bigint, totalBytes: bigint)`. The helper holds at most one 192 KiB source slice in flight and reports server-acknowledged progress. Pass the returned path to an agent request to start analysis; upload alone makes no model call.

`client.company(command)` reads or changes the owner's durable company over the existing binary NCO2 channel. See Persistent company below for commands, revision checks, and department permissions.

For owner-only construction edits use `client.officeLayout({ revision, pieces })`. Public live geometry and player movement use `subscribeOffice` and `moveOffice`; see [Office and company APIs](office-company.md). Company staffing commands use `CompanyOp` from `nexa-transport/company-types`.

`client.project(projectId, command?)` reads a private project snapshot or submits an owner decision: plan, approve, request a correction, or accept a delivery. It returns durable work history and the current spending allowance. Money uses integer USD microcents (`100000000n` equals $1), and revisions use `bigint`. Retain the exact command, including its ID and revision, when retrying after a timeout or disconnect; the server deduplicates it. The client does not automatically replay spending decisions. Project commands and file requests require `hello.features.officeProjects` and travel as binary NCP2 frames over the existing Chat socket.

`client.projectFile(projectId, attemptId, path)` returns `Promise<Uint8Array<ArrayBuffer>>` for one captured delivery in the owner's project history. It reassembles contiguous chunks of at most 128 KiB into a file bounded to 4 MiB, rejecting inconsistent totals or offsets. The method accepts neither a cursor nor an arbitrary workspace path and does not return a digest. The server resolves the saved delivery from the owned attempt. Protocol types are available from `nexa-transport/project-types`, the binary codec from `nexa-transport/projects`, and work/decision types from `nexa-transport/work-types`.

`client.subscribeProject(projectId, onSnapshot, onError)` requires `hello.features.officeProjects`. It delivers an initial private snapshot followed by changed work or spending over the same socket. Call the returned release function when closing the project view. A disconnect calls `onError`; automatic reconnect restores this read watch and receives current authoritative state without replaying decisions. Release the watch when the view closes; a rejected watch requires explicitly subscribing again. At most eight project subscriptions may be open on one connection. Closing a subscription does not cancel approved work.

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

Image, video, and frame encoders require a non-empty MIME type. `document` uses `File.name` (or an explicit title) to infer common document/data MIME types when `Blob.type` is empty, with `application/octet-stream` as the fallback. Inline size remains 1 byte through 100 MiB. They encode bytes without validating codecs, extracting archive contents, or transcoding. Browser `File` objects work because they extend `Blob`.

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

`readHistory(sessionId)` returns validated journal records. `readHistorySnapshot(sessionId, cursor?, endCursor?)` returns `{ records, endCursor }`; pass the previous complete `endCursor` as `cursor` for an incremental read. The optional third argument pins a fixed snapshot boundary. Cursors count bytes and stay decimal strings. `supportsSessionHistoryUpdates` gates durable append notifications for subscribed sessions. `downloadSessionFile(sessionId, attachmentId, signal?)` returns matching original `ReceivedAttachment` bytes through authenticated binary delivery. See [session recovery](sessions.md) for reconciliation and download ownership.

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

## Accepted products in the public showroom

`client.supportsProjectShowroom` requires the private `officeProjects` capability and
`officeShowroom`. Owners can call `client.project(projectId, { kind: 'showcase', id, revision,
published: true, name, description })` after acceptance. The name is 1–64 characters and the
description is at most 280 characters. Both are separate, owner-reviewed public labels; the
command exposes no captured files, source code, prompts or private task titles. Withdrawal
uses `published: false` with both strings empty. Retain the exact decision ID and payload
for uncertain retries; reconnect restores subscriptions without replaying publication.

The capability negotiates NCP2 version 4 for private work records and NGOP version 9 for
public office updates, on the same socket. Published projects carry optional
`showcase: { name, description }` alongside their accepted execution phase. Visitor snapshots
use the public name as their project goal and retain opaque public identifiers. Visitors
receive only these labels and existing sanitized work state, with no private project
commands or file transfers. Older gateways retain their original packet versions and reject
showroom decisions locally before sending.

## Per-message reasoning effort

`agent.ask` and `client.stream` accept optional `reasoningEffort`: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`. An updated NEXA gateway applies it to that turn without changing the saved agent configuration. Omit it to retain the agent's default. Providers map unsupported levels to their supported effort settings.

Both methods also accept `targetTimeSeconds`, an integer from 1 through 172800 (two days). The gateway gives the model a soft time target for planning, reasoning, verification, and refinement, shared across tool hops. The model can finish early or continue necessary work after the target. This field does not cancel the task or change transport timeouts. An explicit `reasoningEffort` takes precedence over the target's suggested effort; omitting the target preserves the existing behavior.

## Private employee and workspace reports

`supportsEmployeeResults` gates `employeeResults(employeeId)` and `subscribeEmployeeResults(employeeId, listener, onError)`. `supportsExecutionHosts` gates `executionHost()` and `subscribeExecutionHost(listener, onError)`. These reads do not dispatch work, change budgets, or provision machines. See [private reports](office-company.md#budgets-and-passive-reports) for ownership and cleanup.

`hello.features.officeEmployeeCosts` negotiates NCE1 version 3 for private employee portfolios. Each project can carry exact `bigint` costs: `spent` (settled USD microcents), `reserved` (maximum outstanding liability), `charges` (metered requests including cancellations), and `unresolved`. Attribution uses the original execution employee, including failed work and later receipts. Legacy gateways omit `cost`; absence does not mean free work. One USD is 100,000,000 microcents. Reads do not approve, dispatch, or settle work.

`hello.features.officeEmployeeDevelopment` negotiates NCE1 version 4, retaining verification and costs and adding optional `singleRunAcceptedTasks`. This credits accepted implementation with exactly one saved attempt across all employees. Plans and reviews do not count as implementation; reassignment, interruptions and requested corrections prevent single-run credit. Absence means the older report has no classified delivery history, not zero successful deliveries. The SDK restores only read watches on reconnect and downgrades to the older negotiated formats when necessary. Visitors receive neither the capability nor private results.

## Workflow capabilities

`supportsWorkflowDrafts`, `supportsWorkflowGraph`, `supportsWorkflowGroups`, `supportsWorkflowPlanning`, `supportsWorkflowPlanningSources`, and `supportsWorkflowRuns` check the connected gateway's advertised versions and required methods. They do not grant account access. Additive methods such as deletion, publications, schedules, model resolution, terminal controls, and usage must also appear in `client.hello.features.methods` before use. Call them with `client.call(Method.Workflows…, params)` and the generated `ParamsOf`/`ResultOf` types. See the [workflow guide](workflows.md) for examples and portable entry points.

For the complete package import map, see [entry points](exports.md). For live office movement, project baselines, tool permissions, employee reports, and execution-host reports, see [Office and company APIs](office-company.md).
