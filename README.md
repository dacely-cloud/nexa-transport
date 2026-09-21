# nexa-transport

A fully typed Nexa gateway client for browsers and Node.js 22+. Built with Vite and TypeScript 7; checked with Oxc's type-aware rules. No runtime dependencies or Node imports in the browser code.

The package speaks **Nexa's websocket gateway protocol v1**. It covers all 54 gateway RPCs, event streaming, tool execution/progress/results, approvals, multi-turn sessions, image/video/document attachments, native NCAP artifacts and rich output, and voice. Nexa executes tools on its server; this library transports requests and results.

## Install

Before publication, install the built tarball:

```sh
npm install /root/nexa-transport/nexa-transport-0.1.0.tgz
```

Once published: `npm install nexa-transport`.

## Connect and chat

```ts
import { NexaClient } from 'nexa-transport';
import { Method } from 'nexa-transport/protocol';

const client = await NexaClient.connect({
    url: 'wss://your-nexa.example/',
    apiKey: userProvidedNexaKey,
});

try {
    const turn = client.stream({ message: 'Explain this project' });
    for await (const event of turn) {
        switch (event.type) {
            case 'text':
                appendText(event.text);
                break;
            case 'reasoning':
                appendReasoning(event.text);
                break;
            case 'tool-start':
                showTool(event.call);
                break;
            case 'tool-progress':
                updateTool(event.call, event.update);
                break;
            case 'tool-finish':
                finishTool(event.outcome);
                break;
            case 'native':
                renderNative(event);
                break;
        }
    }
    const answer = await turn.result;
    await client.ask('Now explain the tests', {
        conversationId: answer.sessionKey,
    });
} finally {
    client.close();
}
```

`sessionKey` is the server's namespaced conversation identity. Preserve it for follow-up turns; do not reconstruct it from usernames or use the provider's `conversationId` in its place. `sessions.list`, `sessions.get`, and `sessions.messages` retrieve saved conversations and their full content blocks.

The complete, typechecked integration examples are in `examples/Chat.ts` and `examples/Node.ts`. The UI callback names above illustrate application-owned rendering.

## Media, tools, artifacts, and documents

```ts
import { NexaMedia } from 'nexa-transport/media';

const turn = client.stream({
    message: 'Compare this image with the document',
    attachments: [
        await NexaMedia.image(imageFile, imageFile.name),
        await NexaMedia.document(pdfFile, pdfFile.name),
        { type: 'video', source: { kind: 'url', url: videoUrl } },
    ],
});
for await (const event of turn) {
    const native = NexaMedia.nativeEvent(event);
    if (native?.artifact) showArtifact(native.artifact);
    if (native?.video?.phase === 'chunk') saveVideoChunk(NexaMedia.bytes(native.video.data));
    if (event.type === 'tool-progress' && event.update.attachment) {
        const preview = event.update.attachment;
        showPreview(new Blob([NexaMedia.bytes(preview.data)], { type: preview.mimeType }));
    }
}
await turn.result;
```

Attachments use Nexa's existing `text`, `image`, `video`, `video-frame`, and `document` blocks. Inline base64 and HTTP(S) URL sources are supported. `NexaMedia.videoFrame` creates ordered frames; `video` creates a container attachment. Blob helpers enforce a 12 MiB per-item ceiling; the negotiated frame limit also applies to the entire request. Tool progress attachments, tool result content blocks, display metadata, delivery receipts, and native artifacts are retained. `NexaMedia.bytes` handles both indexed JSON byte objects and arrays emitted by gateway versions.

Native events include rich blocks, project graphs, backlog, sub-agents, findings, research, skills, artifacts, video generation, and voice. Media/model capabilities still depend on the connected Nexa provider. A server-local artifact path is metadata, not a public download URL; the SDK does not bypass filesystem authorization or invent a download endpoint.

## Events, approvals, and session mirrors

```ts
import { EventName } from 'nexa-transport/events';
import { Method } from 'nexa-transport/protocol';

const stopApproval = client.on(EventName.ApprovalRequested, (approval) => {
    showApproval(approval);
});
await client.call(Method.ApprovalsResolve, { approvalId, approved: true });

const stopMirror = client.on(EventName.TurnEvent, ({ sessionId, event }) => {
    renderSessionEvent(sessionId, event);
});
await client.call(Method.SessionsSubscribe, { sessionId });
// Later:
await client.call(Method.SessionsUnsubscribe, { sessionId });
stopApproval();
stopMirror();
```

`on` validates and types every catalogued event payload. `onEvent` also exposes new event names and retains their complete JSON. Originating-stream events and mirrored events share the gateway event feed: use the local `TurnStream` for local rendering and filter session mirrors to avoid rendering your own output twice. `onSequenceGap` reports bigint sequence ranges: re-fetch affected session state. `onClose` reports connection termination. Listener exceptions go to the optional `onListenerError` callback and cannot break transport cleanup.

## Authentication and hosting

`apiKey` is Nexa's configured shared token, or a paired-device token accompanied by `deviceId`. There is no separate username/password login endpoint. `connect()` resolves only after the websocket upgrade, nonce challenge, and protocol negotiation succeed. Inspect `client.hello.auth.scopes` and `client.hello.features` for permissions and available server services.

```ts
const client = await NexaClient.connect({
    url: 'wss://your-nexa.example/',
    deviceId: installationId,
    deviceName: 'Nervalab browser',
    pairingCode: operatorProvidedCode,
});
const deviceToken = client.hello.auth.token;
// Reconnect with { deviceId: installationId, apiKey: deviceToken }.
```

The SDK uses the gateway's query-token authentication because browsers cannot set websocket authorization headers. Use WSS in production, redact websocket query strings from proxy logs, and have each user supply their own credential or pair a scoped device. Never place a shared deployment admin token in the website bundle. Credentials are not written to browser storage by this package. Browser upgrade failures cannot expose HTTP status/body; the SDK reports a connection error without including the credential-bearing URL.

For a Nervalab deployment on a different origin, configure Nexa's `allowedOrigins` with the exact website origin. The reverse proxy must support websocket upgrades, retain the query parameters, and permit long-running connections. Origin checks remain enforced by Nexa.

**Server compatibility:** this workspace includes additive changes in `/root/nexa`: attachment validation/forwarding and mirrored attachments; browser device-id/name/scope query metadata; newly issued device tokens in `hello.auth.token`. Deploy these gateway changes for browser pairing and inbound media. The package includes `server-patches/nexa-gateway-v1.patch` for the corresponding Nexa source revision; review and apply it with `git apply --check` before `git apply`. These changes are already applied in this workspace. Older protocol-v1 gateways remain usable for text and control APIs. Media requests require the advertised `hello.features.attachments` capability; the SDK refuses them when it is absent, preventing silent media loss.

## RPC coverage and voice

`client.ask(message, options)` sends a chat message directly. Use `conversationId` in options to resume a session, alongside optional attachments, signal, and timeoutMs.

`Method` is the runtime method enum (`as const` with a derived type), following Nexa’s enum conventions. For example, `client.call(Method.SessionsList, { limit: 50 })` lists previous conversations without raw method strings. All 54 members are generated from the gateway contract.

`client.call(method, params)` gives method-specific parameter and result types for all current methods:

- Agent ask/stream, agent list/define.
- Sessions list/get/messages/delete/subscribe/unsubscribe.
- Tasks list/get/cancel and approvals list/resolve.
- Jobs list/add/remove; credit budgets/setBudget/removeBudget/summary.
- Channels list/status/deadLetters.list.
- Workspaces list/describe/create/destroy.
- Devices list/approve/reject/revoke.
- Accounts list/create/remove/usage; teams and shares list/create/setMember/remove.
- Config get/set/unset; logs tail; health.
- Voice start/audio/stop, with typed voice audio and transcript/status events.

Start a voice call with `voice.start`; use its advertised sample rate and frame size. Send PCM16 bytes with `voice.audio` using `NexaMedia.base64(bytes)`. Subscribe to `voice.audio` and `voice.event`, decode received PCM with `NexaMedia.fromBase64`, and finish with `voice.stop`. Microphone capture, resampling, playback, rendering, and user consent belong to the website.

Import protocol types from `nexa-transport/protocol`, event names/types from `nexa-transport/events`, and errors from `nexa-transport/errors`. Protocol numeric fields retain Nexa's JSON number representation; event sequence counters use bigint. Free-form tool arguments and native extension fields use recursive `JsonValue`, never `any`.

## Cancellation, failures, and limits

Pass an `AbortSignal` to `connect`, `call`, or `stream`. `turn.cancel()` and breaking from its async iterator cancel the server run using the acknowledged **runId**. `turn.result` settles independently of event consumption. On disconnect all pending requests and active streams settle. Local cancellation of a generic RPC stops waiting; the remote mutation may already have executed.

Defaults: 15-second connect deadline, 60-second RPC deadline, one-hour turn deadline, 64 pending RPCs, 16 MiB frame limit, and 256 unread events / 8 MiB per stream. Configure these through `ClientOptions`, `CallOptions`, and `StreamOptions`. Slow consumers are failed and their run cancelled rather than allowing unbounded buffering. A timed-out stream acknowledgement closes the connection to release a run whose id is unknown.

No mutation is retried automatically. Reconnect explicitly with `NexaClient.connect`, then re-subscribe and re-fetch session state. A connection error before authentication may represent an invalid key, rejected origin, unreachable server, or protocol failure. Remote RPC errors preserve the server code, retryability, retry delay, and details in `TransportError.remote`.

## Development and release

```sh
npm ci
npm run check
npm run test:gateway  # requires sibling /root/nexa and Google Chrome
npm pack
npm run test:package
```

`npm run check` runs TypeScript 7, type-aware Oxc with warnings treated as failures, Prettier using Nexa’s copied configuration, protocol/lifecycle tests, and the Vite library/declaration build. `npm run test:gateway` runs the real Nexa gateway in Node and Chrome with a deterministic agent; it does not require paid model credentials.

`npm run generate` snapshots the sibling Nexa TypeScript contracts into standalone public types and runtime schemas. The published package has no dependency on the Nexa source tree. Review regenerated contract changes and run gateway tests before a release. The runtime schema interpreter is fully typed and uses no eval, supporting strict browser CSPs.

The package is prepared for public npm publication. Publishing requires an authorized npm account and `npm publish`; generating a tarball does not publish it.
