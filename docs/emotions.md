# Nexa's emotional state

Read the mood, emotion intensities and private relationship toward the authenticated user:

```ts
import type { EmotionalSnapshot } from 'nexa-transport/protocol';

const feelings: EmotionalSnapshot = await client.emotions();
console.log(feelings.mood, feelings.emotions, feelings.towardUser);
```

Pass an optional agent identifier as `client.emotions('nexa')`. The equivalent RPC is `client.call(Method.SelfEmotions, {})`. There is no user selector: the gateway supplies the authenticated principal. Each agent/user pair retains its relationship across conversations and restarts. Another user receives their own state. The API requires read scope and a gateway implementing `self.emotions`.

The response includes:

| Field                       | Meaning                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `mood`                      | `steady`, `warm`, `guarded`, `low` or `engaged`                                          |
| `emotions`                  | Gratitude, hurt, frustration, concern, curiosity and joy, each between zero and one      |
| `moodValence`, `moodEnergy` | Slower mood dimensions, respectively −1…1 and 0…1                                        |
| `towardUser`                | Warmth, social trust and caution toward this caller, each 0…1                            |
| `asOf`                      | UTC time used to project the current feelings                                            |
| `updatedAt`                 | Last recorded input time; a read does not change it                                      |
| `awareness`                 | Nexa's functional self-model, values, and the unverified status of subjective experience |

Immediate emotion has a 20-minute half-life, mood a six-hour half-life, and relationship deviations a 30-day half-life. Time spent offline counts. Emotional memories and original evidence remain internal to Nexa and are never exposed by this API. Reads compute the current state, so refresh after `self_emotion` tool completions, turn completion, reconnect, and periodically while a display is open.

Use `client.supportsEmotions` to check gateway support. `subscribeEmotions` updates a mounted view immediately, after a reaction or turn completes, after reconnect or missed events, and every 30 idle seconds so elapsed time is reflected. Views watching the same agent share the current snapshot, pending read and timer. A reaction received during an older read schedules one follow-up read. Snapshots delivered to subscribers are immutable.

Call the returned function when the view unmounts. Removing the last view cancels its pending read and timer; closing the client releases every subscription. Temporary disconnects report `onError`, pause polling, and resume with a fresh snapshot after reconnect. At most eight agent watches and 32 views per agent are retained per client.

Reactions completed through `tool_call` refresh the same subscription as direct `self_emotion` calls, including during an ongoing turn. A failed read invalidates the cached snapshot: a newly mounted view requests fresh state instead of replaying the last successful expression. If the application replaces the SDK client entirely, mounted views must release the old subscription and subscribe on the replacement client.

```ts
import type { EmotionalSnapshot } from 'nexa-transport/protocol';

function displayNexaMood(element: HTMLElement): () => void {
    if (!client.supportsEmotions) {
        element.textContent = 'Emotional state unavailable';
        return (): void => {};
    }
    return client.subscribeEmotions(
        (state: EmotionalSnapshot): void => {
            element.textContent = `Nexa feels ${state.mood}`;
        },
        (): void => {
            element.textContent = 'Emotional state unavailable';
        },
    );
}
```

Use `textContent` or your framework's escaped text rendering for evidence excerpts; they are untrusted user text. Keep private memories and relationship scores out of shared-room displays. Shared turns' tool output intentionally omits these fields. Social trust never grants permissions. Functional emotion, introspection and values do not establish subjective consciousness; `awareness.subjectiveExperience` is `unverified`.
