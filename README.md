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
- [Client API](./docs/client.md): every client method, helper, option, event, and error.
- [RPC reference](./docs/methods.md): all 54 methods with call templates, parameters, and results.
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
| `maxMessageBytes`    | 16 MiB           |
| `turnTimeoutMs`      | 1 hour           |
| `maxBufferedEvents`  | 256 per stream   |
| `maxBufferedBytes`   | 8 MiB per stream |

Connection options are passed to `NexaClient.connect()`. Per-call `signal` and `timeoutMs` are passed as the third argument to `client.call()`. Stream options are passed as the second argument to `client.stream()`.

Blob helpers accept up to 12 MiB per attachment; the complete request must also fit the gateway's payload limit. Streams exceeding their buffer limits are cancelled.

RPC cancellation stops local waiting; a server-side mutation may already have executed. Requests are not retried automatically. Reconnect with `NexaClient.connect()`, restore subscriptions, and reload session state. `TransportError.remote` preserves server error codes, retry information, and details.

## Gateway compatibility

Uses Nexa gateway protocol v1. Media requires `hello.features.attachments`. Browser pairing requires query-based device metadata and issued credentials in `hello.auth.token`.

The [gateway patch](./server-patches/nexa-gateway-v1.patch) adds these capabilities to the corresponding Nexa revision. Check compatibility before applying it:

```bash
git apply --check /path/to/nexa-gateway-v1.patch
git apply /path/to/nexa-gateway-v1.patch
```

## Development

TypeScript 7, Vite, Oxlint with type-aware rules, Prettier, and Vitest.

```bash
npm ci
npm run check
```

| Command                | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `npm run build`        | Build ESM bundles and declarations                |
| `npm run typecheck`    | Check TypeScript contracts                        |
| `npm run lint`         | Run type-aware Oxc checks                         |
| `npm run format`       | Format source and documentation                   |
| `npm test`             | Run library tests                                 |
| `npm run test:gateway` | Run Nexa gateway and Chrome integration tests     |
| `npm run generate`     | Regenerate protocol types and schemas             |
| `npm pack`             | Build and package a release                       |
| `npm run test:package` | Verify the packed package in an isolated consumer |

Protocol generation requires a sibling `nexa` checkout. Gateway tests additionally require the transport integration fixtures in that checkout and Google Chrome. Package verification requires a generated tarball.

See [Chat.ts](./examples/Chat.ts) and [Node.ts](./examples/Node.ts) for application examples.

---

<div align="center"><sub><a href="./LICENSE">Apache-2.0</a> · <a href="https://github.com/dacely-cloud">Dacely Cloud</a></sub></div>
