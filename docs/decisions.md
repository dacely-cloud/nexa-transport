# Independent JSON decisions

Use `client.decide` for short classifications, control choices and proposed commands.
Each call is independent. Nexa does not open a conversation, recall history, provision a
workspace or execute tools. Authentication, admission limits and usage billing still apply.
Model instructions stay on the server. The request accepts only caller input and action options.

```typescript
import { NexaClient } from 'nexa-transport';
import type { DecisionRunResult } from 'nexa-transport/protocol';

const client: NexaClient = await NexaClient.connect({
    url: 'wss://ai.dacely.com',
    apiKey: 'YOUR_API_KEY',
    client: { id: 'decision-app', version: '1', platform: 'node', workspace: false },
});
try {
    const result: DecisionRunResult = await client.decide(
        {
            input: 'An obstacle is ahead. The space above is clear. Avoid the obstacle.',
            actions: [{ id: 'jump' }, { id: 'wait' }],
            probabilities: true,
            explanation: true,
            brief: true,
        },
        { timeoutMs: 305000 },
    );
    console.log(result.json);
} finally {
    client.close();
}
```

`input` is text containing either plain language or a JSON document, up to 32,768 UTF-8
bytes. Keep large identifiers in this text intact. There may be 1–32 allowed actions, each
with a unique short `id` and an optional description. The complete request is limited to
48,000 bytes. The decision endpoint allows up to 10,000 output tokens and rejects incomplete
or invalid JSON. The gateway ends requests after five minutes, including admission and generation.
Other Chat and routing limits are unchanged. The engine must have the matching 10,000-token
quick-decision guard deployed.

With actions supplied, output contains the selected `action` and optional JSON-object
`arguments`. Set `explanation: true` to request a short reason for the choice and
`brief: true` for one concise sentence describing the intended next step. Both are optional
JSON string fields, without internal reasoning. When information is insufficient,
the model may return `{"action":null,"reason":"..."}`. Requested `probabilities` are model
estimates over all supplied actions, with values between zero and one summing to one.

Set `allowCustomActions: true` to permit a proposal such as
`{"action":"bash","arguments":{"command":"ls -la"}}`. Descriptive action names such as
`"dash to [3, 1]"` and requested JSON plans are also accepted. The user's requested structure
is retained in custom mode. Probabilities may include alternative custom candidates, including
when no allowed-action list is supplied. Nexa returns the proposal; your application
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
content diagnostics even when wire logging is enabled. Rejected model responses are logged
with secret redaction, their validation failure and finish reason to diagnose malformed output.
