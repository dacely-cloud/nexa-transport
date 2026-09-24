import { NexaClient } from 'nexa-transport';
import { NexaGeometry, NexaMedia } from 'nexa-transport/media';

/** Browser or Node: caller supplies a connected client and optionally a PNG/JPEG Blob. */
export async function generateAsset(client: NexaClient, reference?: Blob): Promise<void> {
    const unsubscribe = client.onAttachment((file): void => {
        if (NexaMedia.geometryFormat(file) !== null) {
            const model: Blob = NexaMedia.geometryBlob(file);
            // Pass model to your GLB viewer or download handler.
            console.log(file.filename, model.size);
        }
    });
    try {
        const request =
            reference === undefined
                ? NexaGeometry.text('A wooden treasure chest with brass trim', { seed: 42 })
                : await NexaGeometry.image(reference, { resolution: 1024, seed: 42 });
        const turn = client.stream(request);
        for await (const event of turn) {
            if (event.type === 'text') {
                console.log(event.text);
            }
        }
        await turn.result;
    } finally {
        unsubscribe();
    }
}
