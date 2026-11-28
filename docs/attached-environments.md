# Attached environments

An API client can lend Nexa an environment it owns: a laptop, a CI container, a build machine, a
benchmark sandbox. The client attaches it to its own connection, names it in a turn, and answers
each command and file operation the turn's tools ask for. The environment lives as long as the
connection, and only that connection's turns can use it. Nexa never widens what the client chooses
to run: every operation is the client's to run or refuse.

Check `AttachedEnvironmentHost.supported(client)` before attaching; older gateways do not serve
`environments.*`.

## Serve a local directory (Node.js)

`NodeDirectoryEnvironment` answers every operation with Node's `child_process` and `fs`, confined
to one directory. `AttachedEnvironmentHost.attach` attaches it and serves its requests until you
detach it.

```ts
import { NexaClient } from 'nexa-transport';
import { AttachedEnvironmentHost } from 'nexa-transport/environments';
import { NodeDirectoryEnvironment } from 'nexa-transport/node-environment';
import type { AskResult } from 'nexa-protocol/gateway/ProtocolEventTypes.js';

const client: NexaClient = await NexaClient.connect({
    url: 'wss://nexa.example.com',
    apiKey: 'YOUR_API_KEY',
});
const local: NodeDirectoryEnvironment = new NodeDirectoryEnvironment({ root: '/home/me/project' });
const host: AttachedEnvironmentHost = await AttachedEnvironmentHost.attach(
    client,
    local.definition('My laptop', 'Node 22 and pnpm; the repository is checked out here'),
    local,
);
try {
    const answer: AskResult = await client.stream({
        message: 'Run the test suite and fix the first failure',
        attachedEnvironments: [host.id],
    }).result;
    console.log(answer.text);
} finally {
    await host.detach();
    client.close();
}
```

The first id in `attachedEnvironments` is the turn's workspace: its file and shell tools run
there, starting at the environment's root. Further ids stay available to Maestro, which can place
sub-agents on any of them.

## Write your own handlers

Implement `AttachedEnvironmentHandlers` to run operations anywhere: inside a container, over SSH,
in a VM you manage. Each handler receives the operation and a context whose `signal` aborts when
the environment is detached or the connection is lost.

| Operation | Answer                                                                              |
| --------- | ----------------------------------------------------------------------------------- |
| `exec`    | `{ kind: 'exec', exitCode, signal, timedOut, stdout, stderr }` after it finishes    |
| `read`    | `{ kind: 'read', data }` with the whole file in base64                              |
| `write`   | `{ kind: 'done' }` after writing the whole file (`parents` creates missing parents) |
| `list`    | `{ kind: 'list', entries }` with each entry's `name` and `type`                     |
| `stat`    | `{ kind: 'stat', type, size, modifiedAt, mode }` (`modifiedAt` in epoch ms)         |
| `remove`  | `{ kind: 'done' }`; directories only when `recursive` is true                       |

Paths are absolute paths in the environment's own syntax. An `exec` without `argv` is a command
line for the platform shell (`/bin/sh -c`, or `cmd.exe` on Windows); with `argv`, `command` is the
program and `argv` holds its arguments, without the program name. `timeoutMs`, when present, is
yours to enforce: report `timedOut: true` and a null `exitCode`.

Throw `AttachedEnvironmentFailure` to answer with an error code: `not-found` for a missing path or
program, `denied` for a refusal, `failed` for anything else. Any other thrown error is answered as
`failed` with its message.

```ts
import {
    AttachedEnvironmentFailure,
    AttachedEnvironmentHost,
    type AttachedEnvironmentHandlers,
} from 'nexa-transport/environments';
import type { AttachedEnvironmentExecResult } from 'nexa-protocol/environments/AttachedEnvironmentTypes.js';

declare const runInContainer: (
    command: string,
    cwd: string,
) => Promise<AttachedEnvironmentExecResult>;
const refuse: () => never = (): never => {
    throw new AttachedEnvironmentFailure('denied', 'This sandbox only runs commands');
};
const sandbox: AttachedEnvironmentHandlers = {
    exec: (operation) => runInContainer(operation.command, operation.cwd),
    read: async () => refuse(),
    write: async () => refuse(),
    list: async () => refuse(),
    stat: async () => refuse(),
    remove: async () => refuse(),
};
const host: AttachedEnvironmentHost = await AttachedEnvironmentHost.attach(
    client,
    { name: 'Build container', platform: 'linux', root: '/src' },
    sandbox,
    { onError: (error: Error): void => console.error(error.message) },
);
```

## Limits and lifetime

- Requests are served concurrently; answer each one once. Nexa waits for an answer as long as the
  operation takes and stops waiting only when the turn is cancelled or the connection closes.
- One answer is one gateway frame. The host keeps the end of command output that would not fit
  (and says how much it dropped), and answers a file or listing too large for a frame with
  `failed`. Writes larger than one frame are refused by Nexa before they are sent.
- A connection can attach up to 1024 environments. Attaching more connections has no limit.
- After a reconnect the host attaches the environment again under a new id. Observe it with
  `host.onAttach(listener)` and use the new `host.id` in later turns; turns that named the old id
  fail their remaining operations. Pass `{ reattach: false }` to stop instead.
- `host.detach()` (or `await using`) detaches the environment, aborts the handlers still running
  and waits for them.
