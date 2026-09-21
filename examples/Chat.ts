import { NexaClient } from 'nexa-transport';
import { NexaMedia } from 'nexa-transport/media';
import type { AskResult, InboundAttachment, WireTurnEvent } from 'nexa-transport/protocol';
/** UI callbacks for a Nervalab Nexa-mode conversation. */
export interface ChatView {
    /** Renders text, reasoning, tools, approvals, or native rich output. */
    readonly event: (event: WireTurnEvent) => void;
}
/** Owns a multi-turn conversation without retaining an API key in browser storage. */
export class NexaChat {
    #sessionKey: string | undefined;
    /** Takes an already authenticated connection owned by the application. */
    public constructor(
        public readonly client: NexaClient,
        public readonly view: ChatView,
    ) {}
    /** Sends a turn, optionally with an image, and remembers the server's session key. */
    public async send(message: string, image?: Blob, signal?: AbortSignal): Promise<AskResult> {
        const attachments: readonly InboundAttachment[] =
            image === undefined ? [] : [await NexaMedia.image(image)];
        const turn = this.client.stream(
            {
                message,
                attachments,
                ...(this.#sessionKey === undefined ? {} : { conversationId: this.#sessionKey }),
            },
            signal === undefined ? {} : { signal },
        );
        for await (const event of turn) {
            this.view.event(event);
        }
        const result: AskResult = await turn.result;
        this.#sessionKey = result.sessionKey;
        return result;
    }
}
