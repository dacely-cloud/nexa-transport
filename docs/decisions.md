# Independent JSON decisions

Use `client.decide` for short classifications, control choices and proposed commands.
Each call is independent. Nexa does not open a conversation, recall history, provision a
workspace or execute tools. Authentication, admission limits and usage billing still apply.
Model instructions stay on the server. The request accepts only caller input and action options.

```typescript
import { NexaClient } from 'nexa-transport';

const client = await NexaClient.connect({
    url: 'wss://ai.dacely.com',
    apiKey: 'YOUR_API_KEY',
    client: { id: 'decision-app', version: '1', platform: 'node', workspace: false },
});
try {
    const result = await client.decide(
        {
            input: 'An obstacle is ahead. The space above is clear. Avoid the obstacle.',
            actions: [{ id: 'jump' }, { id: 'wait' }],
            probabilities: true,
        },
        { timeoutMs: 35000 },
    );
    console.log(result.json);
} finally {
    client.close();
}
```

`input` is text containing either plain language or a JSON document, up to 32,768 UTF-8
bytes. Keep large identifiers in this text intact. There may be 1–32 allowed actions, each
with a unique short `id` and an optional description. The complete request is limited to
48,000 bytes. The server bounds model output to 512 tokens and rejects incomplete or invalid JSON.
The gateway ends requests after 30 seconds, including admission and generation.

With actions supplied, output contains the selected `action` and optional JSON-object
`arguments`. No explanation is added for a selected action. When information is insufficient,
the model may return `{"action":null,"reason":"..."}`. Requested `probabilities` are model
estimates over all supplied actions, with values between zero and one summing to one.

Set `allowCustomActions: true` to permit a proposal such as
`{"action":"requested::bash","arguments":{"command":"ls -la"}}`. A custom action must
use the `requested::name` namespace. When probabilities are requested, the selected custom
action is included alongside the supplied choices. Nexa returns the proposal; your application
decides whether and how to execute it. Without the option, the model cannot select an action
outside your list.

Without action choices the result can contain a brief JSON answer in the structure requested
by the input. `result.json` retains the validated JSON as text so transport does not round
large numeric identifiers. `durationMs` measures Nexa execution and settlement;
`usage` contains token counts. No internal prompt or native prompt receipt is returned.

Use the Decision Playground at `/chat/decisions` to inspect requests and results side by side.
It keeps one result in local component state and discards it when cleared or closed. There
is no conversation history or five-exchange limit. Required account usage records contain
billing metadata, not the input/output bodies. Playground bodies are excluded from Nexa's
content diagnostics even when wire logging is enabled.
