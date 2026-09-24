# Streaming voice transcripts

Nexa Transport carries microphone PCM and ASR transcripts through the authenticated Nexa gateway. Configure Nexa's `voice.transcriptionProvider` as `nerva` and enable the checkpoint on Nerva with `--asr-model PATH`. Browsers do not connect directly to Nerva or receive its credentials.

```ts
const unsubscribe = client.onTranscript((event) => {
    // Replace the current hypothesis when final is false.
    // Append the settled utterance and clear the hypothesis when final is true.
    renderTranscript(event.callId, event.text, event.final);
});
const call = await client.startVoice();
// Capture/downmix/resample microphone audio to call.sampleRate mono PCM16.
await client.sendAudio(call.callId, frame);
await client.stopVoice(call.callId);
unsubscribe();
```

`startVoice()` returns `callId`, `sampleRate`, and `frameBytes`. Keep microphone queues bounded and await `sendAudio` admission. `onTranscript` maps `voice.event` kinds `interim` and `heard` to replaceable and finalized caller text. It excludes assistant speech and status events. Subscribe before opening the call so early revisions are observed. To receive those other events, use `client.on(EventName.VoiceEvent, listener)`.

The SDK validates the new `interim` event at the gateway boundary. A disconnect does not replay microphone frames; reopen a call instead. `stopVoice` ends the call and cancels its remaining work, so wait for a final transcript before stopping if its last utterance must be retained.
