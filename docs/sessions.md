# Sessions, streams, and recovery

A gateway session key, provider conversation ID, stream ID, and server run ID
identify different things. Use the returned `sessionKey` as `conversationId` in
subsequent gateway turns and as `id` in session reads. Task cancellation and
steering use the server run ID. Display names are not authenticated identities.

## Acceptance and completion

`client.stream` returns a `TurnStream` immediately. Await its `accepted` promise
to learn the server run ID and optional session key before the final answer:

```ts
import type { AskResult, StreamAccepted } from 'nexa-transport/protocol';
import type { TurnStream } from 'nexa-transport/stream';

const turn: TurnStream = client.stream({
    conversationId: sessionKey,
    message: 'Inspect the workspace',
});
const accepted: StreamAccepted = await turn.accepted;
console.log(accepted.runId, accepted.sessionKey);
for await (const event of turn) {
    console.log(event);
}
const result: AskResult = await turn.result;
console.log(result.text, result.finishReason, result.incompleteReason);
```

The terminal result can arrive before buffered events have been consumed. Consume
events promptly and handle errors from both iteration and `result`. A normal
generation stop is separate from verified task completion: inspect
`incompleteReason`, and validate any requested application data separately.

`cancel()` requests cancellation for this run. Abort signals and breaking an
unfinished iterator also cancel. `steer(message)` submits a text correction to
this exact active run; see [steering](steering.md). `detach()` releases this local
view and rejects its iterator/result without cancelling accepted server work.
Disconnected accepted work can continue while Nexa is running. This does not
promise that active chat turns survive a server shutdown.

## Restore a conversation

Keep the session key in application storage scoped to the signed-in account.
`resumeSession(sessionId)` subscribes and reads messages, active tasks, and saved
file metadata. With `supportsSessionHistory`, its optional `history` contains the
complete presentation journal, including reasoning, tools, worker events,
attachments, and terminal outcomes. Reading a session does not repeat user input.

`readHistory` returns journal records only. `readHistorySnapshot` also returns
the complete decimal-string byte boundary for incremental catch-up:

```ts
import type { SavedHistorySnapshot } from 'nexa-transport';

if (client.supportsSessionHistory) {
    const first: SavedHistorySnapshot = await client.readHistorySnapshot(sessionKey);
    const later: SavedHistorySnapshot = await client.readHistorySnapshot(
        sessionKey,
        first.endCursor,
    );
    console.log(first.records, later.records, later.endCursor);
}
```

The optional third argument pins `endCursor` to a particular snapshot. Preserve
the exact returned cursor. Reconcile by stable record IDs and keep original
journal order; live events can overlap the saved read. Do not place an old tool
call at the newest position merely because its progress or result arrived later.

With `supportsSessionHistoryUpdates`, `EventName.SessionHistory` announces durable
append ranges for subscribed sessions. Register listeners before subscribing,
read the initial journal after subscription, and serialize catch-up reads. If a
notification arrives during a read, catch up again afterward. Reconnect and
`onSequenceGap` also require reconciliation; the SDK does not replay missing
events. Remove listeners and unsubscribe when the view closes.

## Saved files and metadata-only delivery

`resumeSession().files` and `Method.SessionsFiles` return metadata only. They do
not trigger file downloads or `onAttachment`. Render attachment cards from their
IDs, filenames, MIME types, and sizes. Download bytes only for a selected file:

```ts
import type { ReceivedAttachment } from 'nexa-transport';

declare const attachmentId: string;
const controller: AbortController = new AbortController();
const file: ReceivedAttachment = await client.downloadSessionFile(
    sessionKey,
    attachmentId,
    controller.signal,
);
const blob: Blob = new Blob([file.data], { type: file.mimeType });
console.log(file.filename, blob.size);
```

This helper matches both session and attachment IDs and returns original bytes
through authenticated binary delivery. `Method.SessionsDownload` is the lower
level alternative that delivers through `onAttachment`. Keep a successful
attachment handler while using binary delivery, including detached turns; receipt
is acknowledged after handlers finish. Avoid downloading every ZIP/PDF on resume.
Applications may explicitly request visible image/video previews and own their
Blob URL cleanup.

Set `ClientOptions.client.metadataOnlyAttachments: true` to request metadata-only
live delivery on gateways supporting that handshake field. Saved metadata still
requires explicit download for bytes. Default live delivery uses `onAttachment`.
Neither mode makes the SDK an artifact renderer or preview downloader.

## Reconnection and account changes

Established connections reconnect with bounded jittered exponential backoff,
unless `reconnect: false` is set. A ticket `tokenProvider` runs once per socket
attempt to obtain a fresh single-use ticket. Event/attachment listeners survive,
and successful session subscriptions and supported binary read watches restore.
Outstanding calls and streams reject. Mutations, microphone frames, and user
messages are never automatically repeated.

Use `onClose` for interrupted UI/audio state and `onReconnect` to refresh history
and tasks. `close()` permanently disposes the client and stops retries. Close the
previous account's client, remove its subscriptions, and clear its private view
state when switching accounts. See [client API](client.md) for exact options and
[memory ownership](memory.md) for application cleanup responsibilities.
