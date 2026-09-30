# Steering an active chat turn

Call `turn.steer(message)` on the `TurnStream` returned by `client.stream(...)`.
It waits for the stream acknowledgement and addresses the server's run ID, so a
correction cannot accidentally target another stream or a later conversation.

```ts
const turn = client.stream({ message: 'Design a landing page' });
const accepted = await turn.steer('Use a blue background');
```

`true` means the active run accepted the correction for its next model checkpoint.
A model call or tool already running finishes before the correction is consumed.
`false` means the runtime cannot accept it (including a completed/cancelled run,
unsupported runtime, or exhausted steering allowance). RPC failures reject the
promise. Keep the user's draft until acceptance; do not retry an uncertain request
automatically.

Steering is text-only, limited to 16,384 characters per message and 32 messages /
65,536 characters per turn. It neither cancels the stream nor starts a second turn.
`cancel()` still stops the run. To request independent work after it finishes,
start another stream after awaiting `turn.result`.

The gateway requires write access and the same authenticated principal as the
active run. User identity is derived from the connection, never steering payloads.
