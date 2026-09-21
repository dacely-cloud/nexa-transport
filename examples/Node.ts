import { NexaClient } from 'nexa-transport';
/** Server-only example: take endpoint and credentials from the Node environment. */
const url: string = process.env['NEXA_URL'] ?? 'ws://127.0.0.1:18830';
const apiKey: string | undefined = process.env['NEXA_API_KEY'];
const client: NexaClient = await NexaClient.connect({
    url,
    ...(apiKey === undefined ? {} : { apiKey }),
});
try {
    const turn = client.stream({ message: 'Explain this workspace' });
    for await (const event of turn) {
        if (event.type === 'text') {
            process.stdout.write(event.text);
        }
    }
    console.log((await turn.result).sessionKey);
} finally {
    client.close();
}
