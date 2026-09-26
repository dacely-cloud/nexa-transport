<div align="center">

# nexa-transport

### Nexa in your application.

Typed WebSocket client for browsers and Node.js.

Chat, tools, media, artifacts, and voice through the Nexa gateway.

[![types](https://img.shields.io/badge/types-included-2563ff.svg?labelColor=0e1520)](#api)
[![node](https://img.shields.io/badge/Node.js-22%2B-22e3ab.svg?labelColor=0e1520)](#installation)
[![protocol](https://img.shields.io/badge/protocol-Nexa_v1-7c3aed.svg?labelColor=0e1520)](#gateway-compatibility)
[![license](https://img.shields.io/badge/license-Apache--2.0-8b9ab4.svg?labelColor=0e1520)](./LICENSE)

</div>

---

<details>
<summary><b>Contents</b></summary>

- [Installation](#installation)
- [Quick start](#quick-start)
- [Conversations](#conversations)
- [Streaming](#streaming)
- [Media and artifacts](#media-and-artifacts)
- [Events and approvals](#events-and-approvals)
- [Authentication](#authentication)
- [API](#api)
- [Configuration](#configuration)
- [Gateway compatibility](#gateway-compatibility)
- [Development](#development)

</details>

## Documentation

- [Complete usage guide](./docs/guide.md): conversations, running work, tools, skills, audio, images, GIFs, video, generation, documents, artifacts, and ZIP workflows.
- [Memory testing and ownership](./docs/memory.md): cleanup guarantees, regression tests, and browser stress tests.
- [Client API](./docs/client.md): every client method, helper, option, event, and error.
- [RPC reference](./docs/methods.md): all 54 methods with call templates, parameters, and results.
- [Binary media protocol](./docs/binary-media.md): raw bytes, chunking, limits, and file delivery.
- [Protocol types](./docs/protocol.md): every payload field and union variant.

## Features

|                    |                                                            |
| ------------------ | ---------------------------------------------------------- |
| **Typed RPC**      | Method enums with method-specific parameters and results.  |
| **Conversations**  | Create, resume, list, and retrieve chat history.           |
| **Streaming**      | Text, reasoning, tool progress, and terminal results.      |
| **Media**          | Images, videos, ordered frames, and documents.             |
| **Rich output**    | Tool results, artifacts, NCAP events, and binary payloads. |
| **Voice**          | PCM audio transport, transcripts, and call lifecycle.      |
| **Access control** | API keys, device pairing, scopes, and tool approvals.      |
| **Portable**       | Browser and Node.js support with no runtime dependencies.  |

## Installation

Requires Node.js 22+ or a modern browser. Distributed as ESM with TypeScript declarations.

Build a package from source:

```bash
git clone git@github.com:dacely-cloud/nexa-transport.git
cd nexa-transport
npm ci
npm pack
```

Install the resulting archive in your application:

```bash
npm install /path/to/nexa-transport-0.1.0.tgz
```

## Quick start

```ts
import type { ResultOf } from 'nexa-transport/protocol';

import { NexaClient } from 'nexa-transport';
import { Method } from 'nexa-transport/protocol';

const client: NexaClient = await NexaClient.connect({
    url: 'wss://nexa.example.com',
    apiKey: 'YOUR_API_KEY',
});

try {
    const answer: ResultOf<typeof Method.AgentAsk> = await client.call(Method.AgentAsk, {
        message: 'Explain this project',
    });

    console.log(answer.text);
} finally {
    client.close();
}
```

With a personal API key, omit `userId` from chat and stream requests; Nexa uses the authenticated user automatically. Display names are not user IDs.

The examples below use an authenticated `client`. `client.call()` accepts `Method` enum members; raw method strings are rejected by TypeScript.

## Conversations

Send a message without `conversationId` to create a conversation. Use the returned `sessionKey` for subsequent turns.

```ts
import type { ResultOf } from 'nexa-transport/protocol';

const first: ResultOf<typeof Method.AgentAsk> = await client.call(Method.AgentAsk, {
    message: 'Help me build a website',
});

const next: ResultOf<typeof Method.AgentAsk> = await client.call(Method.AgentAsk, {
    conversationId: first.sessionKey,
    message: 'Use TypeScript',
});
```

List saved conversations, retrieve their messages, and resume using the selected session's `id`:

```ts
import type { ResultOf, Session } from 'nexa-transport/protocol';

const sessions: ResultOf<typeof Method.SessionsList> = await client.call(Method.SessionsList, {
    limit: 50,
});
const session: Session | undefined = sessions[0];

if (session !== undefined) {
    const messages: ResultOf<typeof Method.SessionsMessages> = await client.call(
        Method.SessionsMessages,
        { id: session.id },
    );
    console.log(messages);

    await client.call(Method.AgentAsk, {
        conversationId: session.id,
        message: 'Continue where we left off',
    });
}
```

Nexa retains conversation history server-side. Save the `sessionKey` to resume after reconnecting. The result's `conversationId` belongs to the model provider; use `sessionKey` for gateway requests.

## Streaming

```ts
import type { AskResult } from 'nexa-transport/protocol';
import type { TurnStream } from 'nexa-transport/stream';

const turn: TurnStream = client.stream({ message: 'Review this project' });

for await (const event of turn) {
    switch (event.type) {
        case 'text':
            console.log(event.text);
            break;
        case 'tool-start':
            console.log(event.call);
            break;
        case 'tool-progress':
            console.log(event.update);
            break;
        case 'tool-finish':
            console.log(event.outcome);
            break;
    }
}

const result: AskResult = await turn.result;
```

Pass `conversationId` to continue an existing session. `turn.result` resolves with the final answer and session key.

Cancel with `await turn.cancel()`, an `AbortSignal`, or by breaking out of the iterator. Cancellation targets the server's run ID. Disconnecting rejects outstanding requests and ends active streams.

```ts
import type { TurnStream } from 'nexa-transport/stream';

const controller: AbortController = new AbortController();
const turn: TurnStream = client.stream(
    { message: 'Analyze the workspace' },
    { signal: controller.signal },
);

controller.abort();
```

## Media and artifacts

Attachments accept inline base64 or HTTP(S) URLs using Nexa content blocks.

```ts
await client.call(Method.AgentAsk, {
    message: 'Compare the image and document',
    attachments: [
        {
            type: 'image',
            source: { kind: 'url', url: 'https://example.com/photo.png' },
        },
        {
            type: 'document',
            source: { kind: 'url', url: 'https://example.com/report.pdf' },
        },
    ],
});
```

`NexaMedia` converts browser `File` and `Blob` objects into attachments:

| Helper                               | Content                        |
| ------------------------------------ | ------------------------------ |
| `NexaMedia.image(blob, title?)`      | Image                          |
| `NexaMedia.video(blob, title?)`      | Video container                |
| `NexaMedia.videoFrame(blob, title?)` | Ordered video frame            |
| `NexaMedia.document(blob, title?)`   | Document                       |
| `NexaMedia.nativeEvent(event)`       | Validated NCAP payload         |
| `NexaMedia.bytes(data)`              | Binary payload as `Uint8Array` |
| `NexaMedia.base64(bytes)`            | Base64 encoding                |
| `NexaMedia.fromBase64(text)`         | Base64 decoding                |

Receive delivered images, audio, videos, documents, and archives as raw bytes:

```ts
import type { ReceivedAttachment } from 'nexa-transport';

const stopFiles: () => void = client.onAttachment((file: ReceivedAttachment): void => {
    const blob: Blob = new Blob([file.data], { type: file.mimeType });
    console.log(file.filename, blob);
});
```

With `hello.features.binaryMedia`, files up to 100 MiB use 256 KiB binary chunks. Inline uploads and live PCM audio also use binary WebSocket frames. Use `sendAudio(callId, bytes)` and `onAudio(listener)` for live audio. Register listeners before starting work; result attachment IDs match the received files.

Read native artifacts and video output from the event stream:

```ts
import type { NcapDelta } from 'nexa-transport/protocol';
import type { TurnStream } from 'nexa-transport/stream';

import { NexaMedia } from 'nexa-transport/media';

const turn: TurnStream = client.stream({ message: 'Create a report' });

for await (const event of turn) {
    const native: NcapDelta | null = NexaMedia.nativeEvent(event);

    if (native?.artifact !== undefined) {
        console.log(native.artifact);
    }

    if (native?.video?.phase === 'chunk') {
        const bytes: Uint8Array<ArrayBuffer> = NexaMedia.bytes(native.video.data);
        console.log(bytes);
    }
}

await turn.result;
```

Tool results preserve content blocks, display metadata, and delivery receipts. Native events include rich blocks, graphs, tasks, research, artifacts, video, and voice. Available media capabilities depend on the connected provider. Server-local artifact paths require a separate authorized file-delivery integration.

## Events and approvals

```ts
import type { ResultOf, ApprovalRequestedData } from 'nexa-transport/protocol';

import { EventName } from 'nexa-transport/events';

const unsubscribe: () => void = client.on(
    EventName.ApprovalRequested,
    (approval: ApprovalRequestedData): void => {
        console.log(approval.approvalId, approval.tool, approval.summary);
    },
);

const pending: ResultOf<typeof Method.ApprovalsList> = await client.call(Method.ApprovalsList, {});
console.log(pending);

unsubscribe();
```

Use `Method.ApprovalsResolve` with `{ approvalId, approved }` to submit the user's decision.

| Subscription                     | Purpose                         |
| -------------------------------- | ------------------------------- |
| `client.on(EventName, listener)` | Typed, validated event payloads |
| `client.onEvent(listener)`       | All server events               |
| `client.onSequenceGap(listener)` | Missing event detection         |
| `client.onClose(listener)`       | Connection termination          |

Each subscription returns a function that removes its listener. Use `Method.SessionsSubscribe` and `Method.SessionsUnsubscribe` with `{ sessionId }` to observe a session. Session events also include locally started turns; filter by stream ID when rendering both feeds.

## Authentication

Connect with an API key, or supply `deviceId` alongside a paired-device token. For initial pairing, use `deviceId`, `deviceName`, and `pairingCode`. A newly issued credential is returned in `client.hello.auth.token`.

`client.hello.auth` contains the authenticated identity and scopes. `client.hello.features` lists supported methods, events, and capabilities.

Browser authentication uses query parameters on the WebSocket upgrade. Use WSS, exclude credentials from application bundles, and redact connection queries in proxy logs. The SDK does not persist credentials. For a separately hosted frontend, add its exact origin to the gateway's `allowedOrigins` configuration.

## API

| Method family                                        | Operations                                          |
| ---------------------------------------------------- | --------------------------------------------------- |
| `Method.Agent*`                                      | Run turns, stream, list agents, define agents       |
| `Method.Sessions*`                                   | List, get, messages, delete, subscribe, unsubscribe |
| `Method.Tasks*`                                      | List, get, cancel                                   |
| `Method.Approvals*`                                  | List, resolve                                       |
| `Method.Jobs*`                                       | List, add, remove                                   |
| `Method.Credit*`                                     | Budgets, set budget, remove budget, summary         |
| `Method.Channels*`                                   | List, status, dead letters                          |
| `Method.Workspaces*`                                 | List, describe, create, destroy                     |
| `Method.Devices*`                                    | List, approve, reject, revoke                       |
| `Method.Accounts*`                                   | List, create, remove, usage                         |
| `Method.Teams*`, `Method.Shares*`                    | List, create, set member, remove                    |
| `Method.Config*`, `Method.LogsTail`, `Method.Health` | Configuration, logs, health                         |
| `Method.Voice*`                                      | Start, audio, stop                                  |

For voice, `Method.VoiceStart` returns the call ID, sample rate, and frame size. Send base64 PCM16 through `Method.VoiceAudio`, receive audio and transcripts through `EventName.VoiceAudio` and `EventName.VoiceEvent`, and finish with `Method.VoiceStop`.

| Import                          | Exports                                |
| ------------------------------- | -------------------------------------- |
| `nexa-transport`                | `NexaClient`                           |
| `nexa-transport/protocol`       | `Method`, request and response types   |
| `nexa-transport/events`         | `EventName`, event types               |
| `nexa-transport/media`          | `NexaMedia`                            |
| `nexa-transport/errors`         | `TransportError`, `TransportErrorCode` |
| `nexa-transport/options`        | Connection and call option types       |
| `nexa-transport/stream`         | `TurnStream` type                      |
| `nexa-transport/stream-options` | `StreamOptions` type                   |

## Configuration

| Option               | Default          |
| -------------------- | ---------------- |
| `connectTimeoutMs`   | 15 seconds       |
| `requestTimeoutMs`   | 60 seconds       |
| `maxPendingRequests` | 64               |
| `maxActiveStreams`   | 64               |
| `maxMessageBytes`    | 16 MiB           |
| `turnTimeoutMs`      | 1 hour           |
| `maxBufferedEvents`  | 256 per stream   |
| `maxBufferedBytes`   | 8 MiB per stream |

Connection options are passed to `NexaClient.connect()`. Per-call `signal` and `timeoutMs` are passed as the third argument to `client.call()`. Stream options are passed as the second argument to `client.stream()`.

Blob helpers accept up to 100 MiB per attachment, with a combined upload limit of 100 MiB per request. Binary transfers use chunks of up to 256 KiB within the gateway's frame limits. Streams exceeding their buffer limits are cancelled. Active and queued binary uploads share a 101 MiB budget per client; excess uploads are rejected with a limit error. Queued uploads are released on cancellation, timeout, or disconnect. Outstanding attachment callbacks and acknowledgements are limited to 64 deliveries and 101 MiB per client; exceeding either limit closes the connection.

RPC cancellation stops local waiting; a server-side mutation may already have executed. Requests are not retried automatically. Reconnect with `NexaClient.connect()`, restore subscriptions, and reload session state. `TransportError.remote` preserves server error codes, retry information, and details.

## Gateway compatibility

Uses Nexa gateway protocol v1. The Nexa engine includes media delivery, chunked binary transfers, and browser pairing by default. No gateway patch is required.

The gateway advertises attachment support through `hello.features.attachments` and binary transfers through `hello.features.binaryMedia`. Browser pairing uses query-based device metadata and returns issued credentials in `hello.auth.token`. Use a current Nexa engine with this library to enable these capabilities.

## Development

TypeScript 7, Vite, Oxlint with type-aware rules, Prettier, and Vitest.

```bash
npm ci
npm run check
```

| Command                       | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `npm run build`               | Build ESM bundles and declarations                        |
| `npm run typecheck`           | Check TypeScript contracts                                |
| `npm run lint`                | Run type-aware Oxc checks                                 |
| `npm run format`              | Format source and documentation                           |
| `npm test`                    | Run library tests                                         |
| `npm run test:memory`         | Build and run forced-GC retention and memory stress tests |
| `npm run test:memory:browser` | Run the two-tab Chrome memory stress test                 |
| `npm run test:gateway`        | Run Nexa gateway and Chrome integration tests             |
| `npm run generate`            | Regenerate protocol types and schemas                     |
| `npm pack`                    | Build and package a release                               |
| `npm run test:package`        | Verify the packed package in an isolated consumer         |

Protocol generation requires a sibling `nexa` checkout. Gateway tests additionally require the transport integration fixtures in that checkout and Google Chrome. Package verification requires a generated tarball.

See [Chat.ts](./examples/Chat.ts) and [Node.ts](./examples/Node.ts) for application examples.

---

<div align="center"><sub><a href="./LICENSE">Apache-2.0</a> · <a href="https://github.com/dacely-cloud">Dacely Cloud</a></sub></div>

### Text and image to 3D

The gateway uses Nexa's `generate_3d` tool, with Nerva configured for the desired
text/image backend and Blender installed for previews. These helpers build
**agent-mediated** turns; they do not invoke the model directly or bypass tool
approval. Generation availability and errors are reported by the agent.

```ts
import { NexaGeometry, NexaMedia } from 'nexa-transport/media';
import type { TurnStream } from 'nexa-transport/stream';

const unsubscribe: () => void = client.onAttachment((file) => {
    if (NexaMedia.geometryFormat(file) !== null) {
        const model: Blob = NexaMedia.geometryBlob(file);
        // Save the Blob or hand it to your GLB viewer.
    }
});
const turn: TurnStream = client.stream(NexaGeometry.text('A wooden treasure chest', { seed: 42 }));
for await (const event of turn) {
    // Render text, tool progress, and media events using the normal stream UI.
}
await turn.result;

// Or load a reference PNG (a browser File also works):
const reference: Blob = await (await fetch('/reference.png')).blob();
const imageTurn: TurnStream = client.stream(
    await NexaGeometry.image(reference, {
        resolution: 1024,
        seed: 42,
    }),
);
for await (const event of imageTurn) {
    // Keep an attachment subscription active to receive the model and previews.
}
await imageTurn.result;
unsubscribe();
```

Subscribe to attachments before starting each turn. References are bounded to
16 MiB; the backend validates PNG/JPEG pixels and the 4096-pixel dimension limit.
Text generation selects the configured text model; image generation selects
TRELLIS.2. If only TRELLIS.2 is configured, text first generates a reference image.
Leave steps unspecified for backend defaults. Images support 512/1024 resolution.
Outputs include a GLB and PNG previews; Gaussian PLY support depends on the model.
Nexa's optimized GLBs require Meshopt decoding: `MeshoptDecoder` is exported from
`nexa-transport/media` for viewer integration. Rigging and Roblox Studio import
are separate operations. See `examples/Geometry.ts` for subscription cleanup.

### Large data uploads

Use `uploadData` for large documents or datasets. It sends acknowledged 192 KiB slices to the user's workspace instead of creating a whole-file base64 attachment:

```typescript
const uploaded = await client.uploadData(file, file.name, {
    signal: controller.signal,
    onProgress: (bytes, total) => console.log(bytes, total),
});
const turn = client.stream({
    message: `Analyze the entire dataset at ${JSON.stringify(uploaded.path)} using import_dataset and query_dataset.`,
});
```

The server returns a path, filename and decimal-string byte count. Source bytes never enter the agent request. Progress counts acknowledged bytes as `bigint`. Cancellation requests cleanup of unfinished uploads. The server must advertise the `data.upload.*` methods and grant write scope. For Node files, use a file-backed Blob to keep memory bounded. `NexaMedia.document` is still intended for inline attachments; uploading a file does not itself analyze it.
