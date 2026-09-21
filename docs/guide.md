# nexa-transport guide

`nexa-transport` connects browser and Node.js applications to the Nexa WebSocket gateway. It provides typed RPC, streaming events, attachment encoding, native payload decoding, and voice transport. Nexa runs the model, tools, skills, and background work on the server.

- [Connection and identity](#connection-and-identity)
- [New and past conversations](#new-and-past-conversations)
- [Streaming and running work](#streaming-and-running-work)
- [Images, GIFs, video, and documents](#images-gifs-video-and-documents)
- [Image and video generation](#image-and-video-generation)
- [Artifacts, files, and ZIP archives](#artifacts-files-and-zip-archives)
- [Audio and live voice](#audio-and-live-voice)
- [Tools, skills, and approvals](#tools-skills-and-approvals)
- [Events and synchronization](#events-and-synchronization)
- [Administration](#administration)
- [Errors and limits](#errors-and-limits)
- [Complete reference](#complete-reference)

## Connection and identity

Requires an ESM application, Node.js 22+ or a modern browser with `WebSocket`, `Blob`, `crypto`, `atob`, and `btoa`.

```ts
import { NexaClient } from 'nexa-transport';
import { Method } from 'nexa-transport/protocol';
import { EventName } from 'nexa-transport/events';
import { NexaMedia } from 'nexa-transport/media';

const client: NexaClient = await NexaClient.connect({
    url: 'wss://your-gateway.example',
    apiKey: 'YOUR_PERSONAL_API_KEY',
});

console.log(client.connected);
console.log(client.hello.auth.principalId);
console.log(client.hello.auth.scopes);
console.log(client.hello.features);
```

With a personal API key, omit `userId` from `client.call(Method.AgentAsk, ...)` and `client.stream(...)`. The gateway automatically uses the key’s user. `client.hello.auth.principalId` is the internal identity, for example `user:ralph`; `Ralph` is a display name for your UI. Sending `userId: 'Ralph'` fails because it does not match the authenticated principal. Do not derive identity from a display name. The SDK sends the credential through the WebSocket upgrade query so it works in browsers. Use WSS outside trusted local development; configure permitted frontend origins on the gateway, or use `--allow-origin '*'` to accept any origin while retaining authentication. The SDK does not store credentials. Do not put real keys in published frontend bundles or logged URLs.

A local Nexa operator can retrieve an automatically assigned key with `nexa api-keys get user:<id>`. New enabled users receive a default key; boot provisions one for enabled users without an active key when identity and per-user workspaces are enabled. `/apikey` commands provide personal key management on supported chat surfaces. Revocation is enforced by the server, including existing connections.

For device pairing:

```ts
const paired: NexaClient = await NexaClient.connect({
    url: 'wss://your-gateway.example',
    deviceId: 'stable-installation-id',
    deviceName: 'My application',
    pairingCode: 'CODE_FROM_OPERATOR',
});
const deviceToken: string | undefined = paired.hello.auth.token;
// Store an issued deviceToken in your application's credential store.
paired.close();

if (deviceToken !== undefined) {
    const reconnected: NexaClient = await NexaClient.connect({
        url: 'wss://your-gateway.example',
        deviceId: 'stable-installation-id',
        apiKey: deviceToken,
    });
    reconnected.close();
}
```

Pairing requires gateway support and an operator-issued code. Shared operator tokens and device credentials have different authority from personal keys. `hello.features.methods` describes the gateway catalog; it does not guarantee your key may call every listed method. Scope checks and per-user policy both apply. Personal keys currently cover chat, health, agent listing, and permitted session/task/workspace methods; subscriptions and administrative calls may require a device or operator credential. Personal keys can use live voice when it is configured on the server.

Connection options also include `scopes`, `client: { id, version, platform }`, `signal`, `onListenerError`, and resource limits. `scopes` requests a subset of authority; it cannot grant additional privileges. See [client options](client.md).

## New and past conversations

Omit `conversationId` to start a new conversation:

```ts
import type { ResultOf } from 'nexa-transport/protocol';

const first: ResultOf<typeof Method.AgentAsk> = await client.call(Method.AgentAsk, {
    message: 'Explain how this library works.',
});
const sessionKey: string = first.sessionKey;

const second: ResultOf<typeof Method.AgentAsk> = await client.call(Method.AgentAsk, {
    conversationId: sessionKey,
    message: 'Show a short example.',
});
console.log(second.text);
```

Save `sessionKey` in your application. Nexa's provider-level `conversationId` is a different identifier; gateway conversation requests use the session key. A result also contains `turnId`, `finishReason`, `reasoning`, `iterations`, and token `usage`.

```ts
import type { ResultOf, Session } from 'nexa-transport/protocol';

const sessions: ResultOf<typeof Method.SessionsList> = await client.call(Method.SessionsList, {
    limit: 50,
});
const selected: Session | undefined = sessions[0];
if (selected !== undefined) {
    const details: ResultOf<typeof Method.SessionsGet> = await client.call(Method.SessionsGet, {
        id: selected.id,
    });
    const messages: ResultOf<typeof Method.SessionsMessages> = await client.call(
        Method.SessionsMessages,
        { id: selected.id },
    );
    // Render messages by role and content-block type, not as text-only records.
    await client.call(Method.AgentAsk, {
        conversationId: selected.id,
        message: 'Continue this conversation.',
    });
}
```

`SessionsMessages` can contain text, reasoning, tool calls/results, and media blocks. `SessionsList` exposes saved metadata such as title, timestamps, participants, usage, and optional recovery/open-turn state. An open flag describes saved state; use task queries/events to inspect current activity. `SessionsDelete({ id })` deletes the selected session and requires write authority. Queries and deletion are subject to user ownership rules.

After an established connection drops, the SDK reconnects with jittered exponential backoff and restores successful session subscriptions. Register `onReconnect` to refresh history and running tasks. In-flight calls and streams reject; mutations are never replayed. Set `reconnect: false` to disable this. `close()` permanently stops retries. After a full page reload, create a client and call `resumeSession` with your saved session key.

## Streaming and running work

```ts
import type { NcapDelta, AskResult } from 'nexa-transport/protocol';
import type { TurnStream } from 'nexa-transport/stream';

const turn: TurnStream = client.stream({
    conversationId: sessionKey,
    message: 'Inspect the project and explain the next steps.',
});

for await (const event of turn) {
    switch (event.type) {
        case 'text':
            console.log(event.text);
            break;
        case 'tool-start':
            console.log(event.call.name);
            break;
        case 'tool-progress':
            console.log(event.update);
            break;
        case 'tool-finish':
            console.log(event.outcome);
            break;
        case 'native': {
            const native: NcapDelta | null = NexaMedia.nativeEvent(event);
            if (native?.artifact !== undefined) console.log(native.artifact);
            break;
        }
    }
}
const result: AskResult = await turn.result;
```

The iterator includes turn/iteration lifecycle, status, reasoning, usage, tools, native events, and finish events. Use the discriminator and [WireTurnEvent variants](protocol.md#wireturnevent) to render all supported cases. `turn.streamId` identifies the local stream; `turn.result` resolves only with its terminal answer. Starting a stream returns immediately; a pending model turn is not itself a connection failure.

For a work UI, show the last status/tool progress while waiting for text, keep the cancellation control available, and distinguish terminal completion, failure, and interruption. Native agent/backlog/graph events can describe delegated work independently of the visible answer.

```ts
import type { ResultOf, TaskRecord } from 'nexa-transport/protocol';

const tasks: ResultOf<typeof Method.TasksList> = await client.call(Method.TasksList, {});
const task: TaskRecord | undefined = tasks[0];
if (task !== undefined) {
    const current: ResultOf<typeof Method.TasksGet> = await client.call(Method.TasksGet, {
        id: task.runId,
    });
    console.log(current);
    // To explicitly cancel that task:
    // await client.call(Method.TasksCancel, { id: task.runId });
}
```

Task IDs, stream IDs, and session IDs are distinct. A task record is not guaranteed for every synchronous turn. To stop your own active stream, call `await turn.cancel()`, pass an `AbortSignal`, or break from the iterator. The stream API resolves the server run ID before requesting cancellation. Cancelling an ordinary `client.call()` only stops local waiting; it does not undo remote work. A disconnected client should inspect current task/session state before retrying a mutation.

## Images, GIFs, video, and documents

Check `client.hello.features.attachments` before relying on attachments. Supported inbound block types are `image`, `video`, `video-frame`, and `document`. Each accepts an inline source or a URL source. When `hello.features.binaryMedia` is true, the SDK sends inline image, video, frame, and document bytes in binary WebSocket frames. Existing base64-shaped protocol objects remain compatible; their payload strings are removed from the JSON header and transported as raw bytes. There is no arbitrary filesystem upload RPC.

Browser `File` objects are `Blob` objects and work directly:

```ts
import type { ResultOf, InboundAttachment } from 'nexa-transport/protocol';

const image: InboundAttachment = await NexaMedia.image(
    new Blob([imageBytes], { type: 'image/png' }),
    'Front view',
);
const pdf: InboundAttachment = await NexaMedia.document(
    new Blob([pdfBytes], { type: 'application/pdf' }),
    'Report',
);
const reply: ResultOf<typeof Method.AgentAsk> = await client.call(Method.AgentAsk, {
    message: 'Compare the diagram with this report.',
    attachments: [image, pdf],
});
```

Here `imageBytes` and `pdfBytes` are `Uint8Array<ArrayBuffer>` values from your file picker or application. In Node.js, read the file using `node:fs/promises` and put the resulting bytes in a `Blob` with its actual MIME type. The library itself has no filesystem dependency.

A URL source delegates retrieval to Nexa:

```ts
await client.call(Method.AgentAsk, {
    message: 'Describe the image.',
    attachments: [
        {
            type: 'image',
            source: { kind: 'url', url: 'https://example.com/image.png' },
        },
    ],
});
```

An attachment title is a display label, not a media ID. Server media tools require the actual returned `media_` identifier followed by 64 hexadecimal characters. A filename such as `report.pdf` cannot be passed as `mediaId`. Send the document bytes or URL in `attachments`; a filename in the message alone does not upload a document.

The URL must be accessible to the server. Browser cookies and application authorization headers are not forwarded by this source shape. Server URL-access policy and provider format support still apply.

| Content              | Encoding                                                | What the SDK guarantees                                                                       |
| -------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| PNG/JPEG/WebP        | `NexaMedia.image(blob)`                                 | Encodes bytes and preserves MIME type; model decoding is server-dependent                     |
| GIF                  | `NexaMedia.image(gifBlob)` with `image/gif`             | Transports original GIF bytes; does not decode animation or guarantee every frame is analyzed |
| Video file           | `NexaMedia.video(blob)` with its actual video MIME type | Transports the container; does not transcode or sample frames                                 |
| Ordered video frames | `NexaMedia.videoFrame(blob)` per frame                  | Preserves attachment order; consecutive frame blocks represent a clip                         |
| PDF/document         | `NexaMedia.document(blob)`                              | Transports a document source; extraction and supported formats depend on Nexa/provider        |

```ts
import type { InboundAttachment } from 'nexa-transport/protocol';

const clip: InboundAttachment = await NexaMedia.video(videoFile, 'Clip');
const frames: InboundAttachment[] = await Promise.all(
    frameFiles.map((file: Blob): Promise<InboundAttachment> => NexaMedia.videoFrame(file)),
);
await client.call(Method.AgentAsk, {
    message: 'Compare the original clip with these ordered frames.',
    attachments: [clip, ...frames],
});
```

`videoFile` is a browser `File`; `frameFiles` is a `readonly File[]` supplied by your application.

The SDK does not expose frame timestamps or an FPS option in `videoFrame`. Supply temporal context in the message if necessary. A GIF requiring motion analysis can be decoded by your application into ordered frames or converted into a supported video before attachment.

## Image and video generation

Generation is an agent task. There is no `generateImage()` or `generateVideo()` SDK endpoint. Ask Nexa through `AgentAsk` or `stream`; the configured server tools/providers perform generation and delivery. For multiple distinct images, request separate files with one scene per image. Nexa provides `generate_images`, a batch tool with 1–8 independently prompted entries, one generated file per entry, progress updates, and per-item outcomes. Successful files survive a partial batch failure. Only the first output may have an inline model preview; all successful files remain available for delivery through `onAttachment` and later session downloads.

```ts
import type { NcapDelta, AskResult } from 'nexa-transport/protocol';
import type { TurnStream } from 'nexa-transport/stream';

const generation: TurnStream = client.stream({
    message: 'Generate a PNG illustration of a small observatory at night and return the artifact.',
});
for await (const event of generation) {
    if (event.type === 'tool-finish') console.log(event.outcome);
    const native: NcapDelta | null = NexaMedia.nativeEvent(event);
    if (native?.artifact !== undefined) console.log(native.artifact);
    if (native?.video !== undefined) console.log(native.video);
}
const generated: AskResult = await generation.result;
```

For video, request the duration, format, and visual content in the message. For image editing or image-to-video, include an image attachment. For GIF output, request a GIF and use the returned artifact/file if the server can produce it. Prompting does not guarantee an installed generator, a particular model, a codec, or a downloadable URL. Report tool errors and the terminal response in your application.

Native video events have a `phase` discriminator. Inspect the [NcapDelta video field](protocol.md#ncapdelta) for begin/chunk/end payloads and format metadata. `NexaMedia.nativeEvent()` restores chunk byte arrays. Assemble chunks according to the announced format; the SDK does not mux containers or provide a video player.

## Artifacts, files, and ZIP archives

The gateway registers the same `send_media` tool used by chat channels. Subscribe to `client.onAttachment()` before asking for a file. The callback supplies raw `Uint8Array` bytes for images, audio, video, documents, and archives:

```ts
import type { ReceivedAttachment } from 'nexa-transport';
import type { ResultOf } from 'nexa-transport/protocol';

const stopFiles: () => void = client.onAttachment((file: ReceivedAttachment): void => {
    const blob: Blob = new Blob([file.data], { type: file.mimeType });
    console.log(file.id, file.filename, blob);
});
const delivery: ResultOf<typeof Method.AgentAsk> = await client.call(Method.AgentAsk, {
    message: 'Create a report and send the PDF.',
});
console.log(delivery.attachments);
stopFiles();
```

`attachments` in the final result and `attachment` stream events contain metadata, not another copy of the bytes. Match their `id` with the callback's `id`; `streamId` identifies streaming deliveries. The SDK does not retain delivered bytes after notifying listeners. Files can be up to **100 MiB each**. Transfers use **256 KiB binary chunks**, with backpressure, ordering checks, and cleanup after disconnect or 30 seconds without progress. The SDK reassembles a file before calling `onAttachment`. At most 64 files can be delivered per turn. Uploads may contain multiple attachments with at most 100 MiB of combined bytes per request; larger batches should use separate requests. Delivery receipts require a successful client attachment handler. Register `onAttachment` before requesting files. Handlers may return a promise; resolve it after adding the file to your UI or saving it, and throw or reject on failure. The SDK sends `Method.MediaAcknowledge` automatically. Missing handlers, rejected handlers, and a 15-second acknowledgment timeout produce a tool error visible to the model. When a client disconnects, the gateway continues the accepted turn and saves its files to the owned session for later download; offline storage does not claim live receipt. Receipt does not prove a human viewed the file. Clients using older library versions must update to send acknowledgments.

Other deliverables may appear as native artifact events, tool-result content, document/media blocks, or links in the final answer. Preserve all of these channels when building an artifact viewer. `NcapArtifactDelta` contains `item`, `title`, and an `artifact` string; that string is not guaranteed to be a URL or file bytes.

```ts
import type { NcapDelta, NcapArtifactDelta } from 'nexa-transport/protocol';

const native: NcapDelta | null = NexaMedia.nativeEvent(event);
if (native?.artifact !== undefined) {
    const { item, title, artifact }: NcapArtifactDelta = native.artifact;
    // Store this metadata in your application's artifact list.
}
```

For delivered binary payloads, `NexaMedia.bytes(value)` decodes a JSON array or serialized `Uint8Array` record. `fromBase64(value)` decodes a base64 field. Neither helper fetches a file. Only treat a field as bytes when its protocol type says it is binary; artifact strings can contain references or text.

If Nexa supplies an HTTP(S) download URL, download it using your application's HTTP client and the documented authorization for that endpoint. A local server filesystem path is not a browser download URL. This SDK has no universal artifact download, filesystem read, archive extraction, or signed-URL API.

For ZIP creation, ask the agent to archive the requested deliverables and return the archive. Its toolchain must support that operation. ZIP inputs are not a dedicated gateway attachment type: do not assume `document(application/zip)` will extract an archive. Provide an accessible archive URL in your request or arrange an authorized workspace upload through your application, then ask Nexa to inspect it. Whether it can fetch, extract, or serve the archive is a server capability.

For large generated files, prefer server-provided download references over unbounded inline payloads. Render untrusted artifact text as text unless your application intentionally sanitizes and supports its markup.

## Audio and live voice

The voice RPCs transport raw **mono PCM16** in binary WebSocket frames when binary media is supported. Use `sendAudio()` and `onAudio()` for typed byte arrays. The lower-level `Method.VoiceAudio` and `EventName.VoiceAudio` interfaces retain their base64 field shape for compatibility; the SDK packs and restores those fields at the wire boundary. They do not accept MP3, WAV containers, Opus, or microphone `MediaRecorder` blobs directly. Capture/decode, resampling, frame buffering, and playback belong to the application.

Register listeners before opening a call:

```ts
import type { ResultOf } from 'nexa-transport/protocol';
import type { VoiceEvent } from 'nexa-transport/events';
import type { ReceivedAudio } from 'nexa-transport';

const stopAudio: () => void = client.onAudio((frame: ReceivedAudio): void => {
    const pcm: Uint8Array<ArrayBuffer> = frame.data;
    // Queue PCM16 for playback at frame.sampleRate; route by frame.callId.
});
const stopVoiceEvents: () => void = client.on(EventName.VoiceEvent, (event: VoiceEvent): void => {
    console.log(event.callId, event);
});
const voice: ResultOf<typeof Method.VoiceStart> = await client.call(Method.VoiceStart, {
    conversationId: sessionKey,
});

try {
    // microphonePcm is one mono PCM16 frame at voice.sampleRate.
    // Buffer/split your capture stream into voice.frameBytes-byte frames.
    await client.sendAudio(voice.callId, microphonePcm);
} finally {
    await client.call(Method.VoiceStop, { callId: voice.callId });
    stopAudio();
    stopVoiceEvents();
}
```

Here `microphonePcm` is a `Uint8Array<ArrayBuffer>` produced by your audio capture code. Use the returned `sampleRate` and `frameBytes`; do not hardcode either. Keep capture backpressure bounded and release microphone tracks/audio resources on stop or disconnect. Voice-event variants include transcripts and call state; their exact fields are in [VoiceCallEvent](protocol.md#voicecallevent).

Native NCAP `voice` output is a separate binary event field, decoded by `nativeEvent()`. Do not assume those bytes have the same framing as `voice.audio`; use the producing provider's format contract.

There is no `NexaMedia.audio()` attachment helper or generic inbound audio-file block in this gateway contract. Audio-file transcription, speech synthesis, music generation, and audio downloads require a server tool/workflow; request those through normal agent messages and consume delivered artifacts. Live voice additionally requires server voice configuration and an authorized credential, including a personal API key.

## Tools, skills, and approvals

The transport does not execute tools on the client or send a local tool catalog. Nexa chooses and executes tools under the authenticated user's permissions. Work mode receives the server's tools, skills, and execution context; conversational replies can omit them. `tool-start`, `tool-progress`, and `tool-finish` expose execution to your UI. A server skill is not an SDK plugin; there is no standalone skill-installation RPC in this contract.

Approval events are notifications, not authority to approve:

```ts
import type { ResultOf, ApprovalRequestedData } from 'nexa-transport/protocol';

const unsubscribe: () => void = client.on(
    EventName.ApprovalRequested,
    (request: ApprovalRequestedData): void => {
        console.log(request);
    },
);
const pending: ResultOf<typeof Method.ApprovalsList> = await client.call(Method.ApprovalsList, {});
// After an authorized operator explicitly decides:
await client.call(Method.ApprovalsResolve, {
    approvalId: 'SELECTED_APPROVAL_ID',
    approved: true,
    reason: 'Approved by the operator',
});
unsubscribe();
```

Approval listing/resolution requires operator-level access in the current gateway. A personal API key cannot approve arbitrary tool actions. Handle refusal or pending approval as normal application states.

## Events and synchronization

`client.on(EventName.Name, listener)` gives a validated, typed payload. `client.onEvent(listener)` gives the raw validated envelope (`event`, lossless JSON `data`, and bigint `seq`) including unknown future event names. All listener registration methods return an unsubscribe function.

| Event                                   | Use                                               |
| --------------------------------------- | ------------------------------------------------- |
| `Challenge`                             | Connection challenge, normally handled internally |
| `TurnEvent`                             | A run's streaming event envelope                  |
| `TurnEnd`                               | Terminal result or failure for a run              |
| `SessionMessage`                        | Messages on an authorized session subscription    |
| `ApprovalRequested`, `ApprovalResolved` | Approval UI synchronization                       |
| `JobsChanged`, `AgentsChanged`          | Refresh the corresponding lists                   |
| `VoiceAudio`, `VoiceEvent`              | Audio frames, transcripts, and call state         |
| `Shutdown`                              | Server shutdown notification                      |

```ts
import type { SessionMessageData } from 'nexa-transport/protocol';

const stopMessages: () => void = client.on(
    EventName.SessionMessage,
    (message: SessionMessageData): void => {
        console.log(message.sessionId, message.role, message.text);
    },
);
await client.call(Method.SessionsSubscribe, { sessionId: sessionKey });
// Later:
await client.call(Method.SessionsUnsubscribe, { sessionId: sessionKey });
stopMessages();
```

Subscriptions require gateway authorization; the current personal-key allowlist does not include these two RPCs. Subscribe with an appropriate device/operator credential, or refresh authorized history with `SessionsMessages`. Locally started streams already deliver their events; avoid displaying duplicates when combining stream and subscription feeds.

Use `client.onSequenceGap(({ expected, received }) => ...)` to detect missing events and refresh affected state. The library does not replay gaps. Use `onClose()` to report interruptions and release live audio resources, and `onReconnect()` to refresh session state. Event and attachment listeners remain registered across automatic reconnects. Use `onListenerError` in connection options to report exceptions thrown by application listeners.

Native events preserve the NCAP fields for content, reasoning, status, usage, tools, block phases, artifacts, video, voice, agents, agent-tool requests, backlog, graph, expert, findings, research, preflight, reflections, skills, and steering. Some describe server internals or progress; not every provider emits them. See [NcapDelta](protocol.md#ncapdelta) for each field and union variant.

## Administration

All method families are documented individually in the [RPC reference](methods.md):

| Family          | Operations                                          |
| --------------- | --------------------------------------------------- |
| Agent           | Ask, stream, list and define agents                 |
| Sessions        | List, get, messages, delete, subscribe, unsubscribe |
| Tasks           | List, get, cancel                                   |
| Workspaces      | List, describe, create, destroy                     |
| Approvals       | List and resolve                                    |
| Jobs            | List, add and remove scheduled jobs                 |
| Credit          | Summary, budgets, set and remove budget             |
| Channels        | List, status, dead letters                          |
| Devices         | List, approve, reject and revoke pairing            |
| Accounts        | List, create, remove and usage                      |
| Teams           | List, create, set member and remove                 |
| Shares          | List, create and remove                             |
| Config          | Get, set and unset                                  |
| Logs and health | Log tail and health check                           |
| Voice           | Start, audio and stop                               |

The server's `hello.features.methodScopes` gives the baseline scope for each method. Per-user authorization can be narrower. Administrative methods are not an alternative way around user isolation.

## Errors and limits

```ts
import { TransportError } from 'nexa-transport/errors';

try {
    await client.call(Method.Health, {}, { timeoutMs: 10_000 });
} catch (error: unknown) {
    if (error instanceof TransportError) {
        console.error(error.code, error.remote?.code, error.message);
    } else {
        throw error;
    }
}
```

Transport error categories are `closed`, `timeout`, `aborted`, `protocol`, `limit`, `connection`, and `remote`. Remote errors preserve the server's code, details, and retry metadata. Bad local arguments can also throw `TypeError` or `RangeError`. RPC parameters, responses, and known events are runtime-validated. Unsupported or incompatible payloads fail explicitly.

| Limit                       | Default                |
| --------------------------- | ---------------------- |
| Connection deadline         | 15 seconds             |
| RPC deadline                | 60 seconds             |
| Pending requests            | 64                     |
| WebSocket JSON message size | 16 MiB                 |
| Stream duration             | 1 hour                 |
| Unread stream events        | 256                    |
| Unread stream JSON bytes    | 8 MiB                  |
| Inline Blob helper size     | 1 byte through 100 MiB |
| Decoded binary JSON         | At most 16 MiB         |

On gateways advertising `binaryMedia`, upload payloads travel as raw chunks, so a 100 MiB file does not require a 100 MiB WebSocket message. JSON metadata and each wire frame remain bounded. Older gateways use the base64 JSON representation and its smaller frame limits. Server limits in `hello` may be stricter. Raise a per-call `timeoutMs` for a long `AgentAsk`, or use streaming and consume events promptly. A stream exceeding its buffer limits is cancelled. `close()` is idempotent, closes the socket, and rejects pending operations.

No automatic retry is performed. Retrying a timed-out mutating call can duplicate work. Reconcile the session/task state first. The SDK does not persist credentials, retry mutations, play media, transcode codecs, or render artifacts for you.

## Complete reference

- [Client, stream, media helpers, and options](client.md)
- [Every RPC method with parameters, results, and a call template](methods.md)
- [All protocol type fields and variants](protocol.md)
- [Typed source examples](../examples)

The method/type pages are generated from the package's bundled contract with `npm run docs`. After updating the server protocol, run `npm run generate` before regenerating documentation, and run the normal package checks. `npm run docs:check` compiles all TypeScript code blocks against the SDK and checks variable annotations. Snippets share the connection setup above; file and microphone inputs are supplied by the application. Stream loop bindings are inferred from the explicitly typed `TurnStream` because TypeScript forbids type annotations on `for...of` bindings.

## Recover after a reload or disconnect

Keep the session key in your application's storage, scoped to the authenticated user. Supply a stable `conversationId` when starting a turn so the conversation can be found even if the connection drops before acceptance. Accepted streaming work continues after the page closes, while Nexa stays running. Use explicit cancellation to stop it. A server shutdown still cancels running turns; this is not restart recovery.

```typescript
import { NexaClient, type SessionSnapshot } from 'nexa-transport';
import { Method } from 'nexa-transport/protocol';

const client: NexaClient = await NexaClient.connect({
    url: 'wss://nexa.example.com',
    apiKey: 'YOUR_API_KEY',
});
const sessionKey: string = 'user:ralph::saved-conversation';
const session: SessionSnapshot = await client.resumeSession(sessionKey);
console.log(session.messages, session.tasks, session.files);
client.onReconnect((): void => {
    void refresh();
});
async function refresh(): Promise<void> {
    try {
        const snapshot: SessionSnapshot = await client.resumeSession(sessionKey);
        console.log(snapshot);
    } catch (error: unknown) {
        console.error(error);
    }
}
client.onAttachment((file): void => {
    console.log(file.filename, file.data);
});
for (const file of session.files) {
    await client.call(Method.SessionsDownload, {
        id: sessionKey,
        attachmentId: file.id,
    });
}
client.close();
```

Downloads use the same raw, chunked binary transport and `onAttachment` callback as live files. Session ownership is checked for both listing and downloading. The gateway saves files before attempting live delivery. Deleting a session removes its saved files. Reconnect restores subscriptions but does not replay missed events; refresh saved history and tasks to reconcile your UI. A snapshot may overlap live events, so reconcile by session/task identity instead of appending the same state twice.
