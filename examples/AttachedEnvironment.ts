import { NexaClient } from 'nexa-transport';
import { AttachedEnvironmentHost } from 'nexa-transport/environments';
import { NodeDirectoryEnvironment } from 'nexa-transport/node-environment';
import type { AskResult } from 'nexa-protocol/gateway/ProtocolEventTypes.js';
/** Server-only example: lend this directory to one turn, then detach it. */
const url: string = process.env['NEXA_URL'] ?? 'ws://127.0.0.1:18830';
const apiKey: string | undefined = process.env['NEXA_API_KEY'];
const client: NexaClient = await NexaClient.connect({
    url,
    ...(apiKey === undefined ? {} : { apiKey }),
});
const local: NodeDirectoryEnvironment = new NodeDirectoryEnvironment({ root: process.cwd() });
try {
    const host: AttachedEnvironmentHost = await AttachedEnvironmentHost.attach(
        client,
        local.definition('Example directory', 'The directory this example was started in'),
        local,
        { onError: (error: Error): void => console.error(error.message) },
    );
    try {
        const answer: AskResult = await client.stream({
            message: 'List the files here and summarise what this project is',
            attachedEnvironments: [host.id],
        }).result;
        console.log(answer.text);
    } finally {
        await host.detach();
    }
} finally {
    client.close();
}
