# Memory ownership and regression testing

An out-of-memory error can come from retained objects, temporary encoding allocations, application state, or the server. The SDK tests below isolate transport-owned resources. They do not include an application's DOM, message history, audio playback, object URLs, or the Nexa engine.

## Run the checks

```bash
npm run check
npm run test:memory:browser
```

`check` includes type checking, documentation checking, lint, formatting, unit/integration tests, a build, and Node memory tests. `npm run test:memory` can run the build and Node memory tests separately. The browser test requires Google Chrome; set `CHROME_BIN` if the executable is not named `google-chrome`.

Node memory tests run in a separate process with `--expose-gc`. They hold cleanup handles, completed/failed/cancelled turns, errors, and old sockets deliberately, then assert that their former clients or callbacks can be collected. This catches retained objects that a test checking only successful responses would miss. The stress test runs two simultaneous clients through completion, cancellation, failure, reconnect, and disposal, measuring both heap and ArrayBuffer use after collection.

The Chrome test opens two actual tabs. Each tab completes 660 turns, including early iterator exits and remote failures, then reconnects three times and creates/disposes 20 temporary clients. It checks weak references to finished turns, removed callbacks, and disposed clients, and reports heap samples after browser garbage collection. Its mock gateway does not retain request history. Weak-reference lists in the test itself account for a small amount of heap growth.

## Resources covered

| Area                      | Ownership and tests                                                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RPCs                      | Pending count, timeout/abort listeners, rejection, disconnect, encoding failure, and release of original request parameters while waiting for a response. |
| Uploads                   | Admission before encoding; queued-payload removal on cancellation, timeout, or close; aggregate retained-byte budget; interrupted transfers.              |
| Chat streams              | Completion, failure, cancellation, byte/count overflow, iterator exit, active-turn limit, and release of client/abort-signal references.                  |
| Subscriptions and sockets | Idempotent removal, disposal of callbacks even when cleanup handles are kept, detachment of old socket handlers, and reconnect behavior.                  |
| Attachments               | Zero-copy file views, outstanding-delivery limits, accounting until all handlers settle, and stalled handlers that outlive disposed clients.              |
| Binary chunks             | Budget release on completion, cancellation, explicit clear, timeout, and malformed/out-of-order frames.                                                   |
| Media conversion          | Expanded JSON limits before allocation, excess-field rejection before decoding, and byte arrays without temporary key-string arrays.                      |
| Errors                    | Saved transport and parameter-validation errors do not retain clients through lazy V8 stack frames.                                                       |
| Protocol/schema           | Static schema and validator tables, with no per-request cache; existing schema, method, and typed-event tests.                                            |

## Limits and caller responsibilities

The default client allows 64 pending RPCs and 64 active turns. Each turn buffers at most 256 unread events and 8 MiB of serialized event data. These are protocol-buffer bounds, not a measurement of JavaScript heap overhead. Binary uploads share a 101 MiB retained-payload budget. Outstanding attachment deliveries share a 101 MiB budget and a 64-delivery limit. Each client and browser tab has separate limits. Temporary media encoding allocations and application-owned data are additional to these budgets.

Consume turn events as they arrive. Normal completion preserves unread events for subsequent iteration; breaking iteration or calling `turn.cancel()` discards unread events. Use `client.call(Method.AgentAsk, ...)` if only the final answer is needed. Stored result promises retain their result or error by design.

Call returned unsubscribe functions when a view no longer needs events, unsubscribe from sessions when no longer observing them, and close clients when disposing their owner. A completed turn, saved SDK error, or cleanup handle no longer keeps a disposed client alive. Stalled attachment handlers may still retain data in their own application closures, but the SDK does not keep the client or payload alive solely to await their completion.

## Checking which build is running

These tests exercise the current checkout/build. Installing from Git uses the remote commit resolved into the consuming application's lockfile; uncommitted or unpushed changes are not included. Compare the `nexa-transport` resolved Git SHA in that lockfile with the commit containing the fixes. Restart the application after updating its dependency.

If an OOM remains, capture the exact error, the failing process (browser, frontend build server, or Nexa server), the resolved SDK commit, and whether the chats used media. That is necessary to distinguish a remaining SDK retention path from application or server memory use.
