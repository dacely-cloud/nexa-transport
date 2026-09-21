import { BinaryChunks } from '../media/BinaryChunks.js';
import { NexaMedia } from '../media/NexaMedia.js';
import { BinaryEnvelope } from '../media/BinaryEnvelope.js';
import { BinaryMedia, type ReceivedAttachment } from '../media/BinaryMedia.js';
export type { ReceivedAttachment } from '../media/BinaryMedia.js';
import { EventName, isEventData, type VoiceAudio, type EventMap } from '../protocol/Events.js';
import type { StreamOptions } from '../interface/StreamOptions.js';
import { Method } from '../protocol/Protocol.js';
import type { StreamParams } from '../protocol/Protocol.js';
import { TurnStream } from './TurnStream.js';
import type { CallOptions, ClientOptions } from '../interface/ClientOptions.js';
import type {
    ConnectChallengeData,
    HelloOk,
    JsonValue,
    ParamsOf,
    ResultOf,
    WireError,
} from '../protocol/Protocol.js';
import { methodValidators } from '../protocol/MethodValidators.js';
import * as validators from '../protocol/Validators.js';
import { PendingRequests } from './PendingRequests.js';
import { TransportError, TransportErrorCode } from './TransportError.js';

/** A validated envelope retaining the complete JSON payload. */
export interface GatewayEvent {
    /** Catalogued event name; new server events remain observable. */
    readonly event: string;
    /** Server-supplied JSON, preserved without stripping fields. */
    readonly data: JsonValue;
    /** Monotonic per-connection sequence. */
    readonly seq: bigint;
}
/** Missing event range: refresh affected session state. */
export interface SequenceGap {
    /** Next expected event. */
    readonly expected: bigint;
    /** Actual event received. */
    readonly received: bigint;
}
/** A live mono PCM16 frame decoded from the binary transport. */
export interface ReceivedAudio {
    readonly callId: string;
    readonly sampleRate: number;
    readonly data: Uint8Array<ArrayBuffer>;
}
/** Authenticated Nexa gateway connection shared by browsers and Node.js. */
export class NexaClient {
    readonly #socket: WebSocket;
    readonly #binaryChunks: BinaryChunks = new BinaryChunks();
    #binaryTail: Promise<undefined> = Promise.resolve(undefined);
    readonly #pending: PendingRequests;
    readonly #options: ClientOptions;
    readonly #attachments: Set<(attachment: ReceivedAttachment) => void | Promise<void>> =
        new Set();
    readonly #events: Set<(event: GatewayEvent) => void> = new Set();
    readonly #closeListeners: Set<(error: Error) => void> = new Set();
    readonly #gaps: Set<(gap: SequenceGap) => void> = new Set();
    readonly #streamIds: Set<string> = new Set();
    #sequence: bigint = 0n;
    #nextId: bigint = 0n;
    #hello: HelloOk | null = null;
    #closed: boolean = false;
    #challenge: ConnectChallengeData | null = null;
    #wake: (() => void) | undefined;
    #failure: Error | undefined;

    /** Opens a socket; use connect to obtain an authenticated client. */
    private constructor(options: ClientOptions) {
        this.#options = options;
        this.#pending = new PendingRequests(options.maxPendingRequests ?? 64);
        const url: URL = new URL(options.url);
        if (url.protocol === 'https:') {
            url.protocol = 'wss:';
        }
        if (url.protocol === 'http:') {
            url.protocol = 'ws:';
        }
        if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password || url.hash) {
            throw new TypeError('Expected a ws(s) endpoint without userinfo or fragment');
        }
        if (options.apiKey !== undefined) {
            if (options.apiKey.length === 0) {
                throw new TypeError('apiKey cannot be empty');
            }
            url.searchParams.set('token', options.apiKey);
        }
        if (options.deviceId !== undefined) {
            url.searchParams.set('deviceId', options.deviceId);
        }
        if (options.deviceName !== undefined) {
            url.searchParams.set('deviceName', options.deviceName);
        }
        if (options.pairingCode !== undefined) {
            url.searchParams.set('pair', options.pairingCode);
        }
        if (options.scopes !== undefined) {
            url.searchParams.set('scopes', options.scopes.join(','));
        }
        this.#socket = new WebSocket(url);
        this.#socket.binaryType = 'arraybuffer';
        this.#socket.addEventListener('message', (event: MessageEvent<unknown>): void => {
            try {
                this.#receive(event.data);
            } catch {
                this.#fail(
                    new TransportError(TransportErrorCode.Protocol, 'Invalid gateway frame'),
                );
            }
        });
        this.#socket.addEventListener('close', (): void => {
            this.#fail(new TransportError(TransportErrorCode.Closed, 'Gateway connection closed'));
        });
        this.#socket.addEventListener('error', (): void => {
            this.#fail(
                new TransportError(
                    TransportErrorCode.Connection,
                    'Gateway connection failed; check credentials, origin policy, and endpoint',
                ),
            );
        });
    }

    /** Opens, authenticates, and negotiates protocol v1 before returning. */
    public static async connect(options: ClientOptions): Promise<NexaClient> {
        for (const value of [
            options.connectTimeoutMs,
            options.requestTimeoutMs,
            options.maxMessageBytes,
            options.maxPendingRequests,
        ]) {
            if (
                value !== undefined &&
                (!Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647)
            ) {
                throw new RangeError('Connection limits must be positive bounded integers');
            }
        }
        if (options.signal?.aborted === true) {
            throw new TransportError(TransportErrorCode.Aborted, 'Connection aborted');
        }
        const client: NexaClient = new NexaClient(options);
        const abort: () => void = (): void => {
            client.#fail(new TransportError(TransportErrorCode.Aborted, 'Connection aborted'));
        };
        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
            client.#fail(
                new TransportError(TransportErrorCode.Timeout, 'Gateway handshake timed out'),
            );
        }, options.connectTimeoutMs ?? 15_000);
        options.signal?.addEventListener('abort', abort, { once: true });
        try {
            await new Promise<void>((resolve): void => {
                client.#wake = resolve;
            });
            if (client.#failure !== undefined) {
                throw client.#failure;
            }
            if (
                client.#challenge === null ||
                client.#challenge.minProtocol > 1 ||
                client.#challenge.protocol < 1
            ) {
                throw new TransportError(
                    TransportErrorCode.Protocol,
                    'Gateway does not support protocol v1',
                );
            }
            client.#hello = await client.#call(
                Method.Connect,
                {
                    nonce: client.#challenge.nonce,
                    minProtocol: 1,
                    maxProtocol: 1,
                    client: {
                        id: options.client?.id ?? 'nexa-transport',
                        version: options.client?.version ?? '0.1.0',
                        platform: options.client?.platform ?? 'javascript',
                        mode: 'ui',
                    },
                },
                {},
            );
            if (client.#hello.protocol !== 1) {
                throw new TransportError(
                    TransportErrorCode.Protocol,
                    'Unexpected negotiated protocol',
                );
            }
            return client;
        } catch (error: unknown) {
            client.close();
            throw error;
        } finally {
            clearTimeout(timer);
            options.signal?.removeEventListener('abort', abort);
            client.#wake = undefined;
        }
    }

    /** Negotiated identity, scopes, capabilities, limits, and initial agent snapshot. */
    public get hello(): HelloOk {
        if (this.#hello === null) {
            throw new TransportError(TransportErrorCode.Connection, 'Handshake incomplete');
        }
        return this.#hello;
    }
    /** Whether this connection can accept new calls. */
    public get connected(): boolean {
        return !this.#closed && this.#hello !== null;
    }
    /** Calls any Nexa RPC with validated parameters and result. Mutations are never replayed. */
    public async call<M extends Exclude<Method, Method.Connect>>(
        method: M,
        params: ParamsOf<M>,
        options: CallOptions = {},
    ): Promise<ResultOf<M>> {
        if (!this.connected) {
            throw new TransportError(TransportErrorCode.Closed, 'Client is not connected');
        }
        if (!this.hello.features.methods.includes(method)) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Gateway does not advertise this method',
            );
        }
        return await this.#call(method, params, options);
    }
    /** Subscribes to a catalogued event with a fully validated payload. */
    public on<E extends keyof EventMap>(
        name: E,
        listener: (data: EventMap[E]) => void,
    ): () => void {
        return this.onEvent((frame: GatewayEvent): void => {
            if (frame.event !== name) {
                return;
            }
            if (!isEventData(name, frame.data)) {
                this.#fail(
                    new TransportError(
                        TransportErrorCode.Protocol,
                        'Invalid gateway event payload',
                    ),
                );
                return;
            }
            listener(frame.data);
        });
    }
    /** Receives live PCM16 bytes with the call's sample rate. */
    public onAudio(listener: (frame: ReceivedAudio) => void): () => void {
        return this.on(EventName.VoiceAudio, (frame: VoiceAudio): void => {
            listener({
                callId: frame.callId,
                sampleRate: frame.sampleRate,
                data: NexaMedia.fromBase64(frame.pcm),
            });
        });
    }

    /** Sends a mono PCM16 frame using negotiated binary transport. */
    public sendAudio(
        callId: string,
        data: Uint8Array,
        options: CallOptions = {},
    ): Promise<ResultOf<typeof Method.VoiceAudio>> {
        return this.call(Method.VoiceAudio, { callId, pcm: NexaMedia.base64(data) }, options);
    }

    /** Receives raw file bytes for ask and stream calls; subscribe before starting a turn. */
    public onAttachment(
        listener: (attachment: ReceivedAttachment) => void | Promise<void>,
    ): () => void {
        this.#attachments.add(listener);
        return (): void => {
            this.#attachments.delete(listener);
        };
    }
    /** Observes all events, including session mirrors and native tool progress. */
    public onEvent(listener: (event: GatewayEvent) => void): () => void {
        this.#events.add(listener);
        return (): void => {
            this.#events.delete(listener);
        };
    }
    /** Observes lost events so a UI can refresh its session state. */
    public onSequenceGap(listener: (gap: SequenceGap) => void): () => void {
        this.#gaps.add(listener);
        return (): void => {
            this.#gaps.delete(listener);
        };
    }
    /** Starts a bounded event stream, exposing tools, media, and native NCAP payloads. */
    public stream(params: StreamParams, options: StreamOptions = {}): TurnStream {
        if (!this.connected) {
            throw new TransportError(TransportErrorCode.Closed, 'Client is not connected');
        }
        const streamId: string = params.streamId ?? crypto.randomUUID();
        if (this.#streamIds.has(streamId)) {
            throw new TypeError('Stream id is already active');
        }
        this.#streamIds.add(streamId);
        try {
            const turn: TurnStream = new TurnStream(this, { ...params, streamId }, options);
            void this.#releaseStream(turn);
            return turn;
        } catch (error: unknown) {
            this.#streamIds.delete(streamId);
            throw error;
        }
    }
    async #releaseStream(turn: TurnStream): Promise<void> {
        try {
            await turn.result;
        } catch {
            /** Turn consumers receive errors through their iterator and result. */
        } finally {
            this.#streamIds.delete(turn.streamId);
        }
    }
    /** Observes connection termination for resource owners and UI state. */
    public onClose(listener: (error: Error) => void): () => void {
        if (this.#failure !== undefined) {
            listener(this.#failure);
            return (): void => {};
        }
        this.#closeListeners.add(listener);
        return (): void => {
            this.#closeListeners.delete(listener);
        };
    }
    /** Closes the socket and rejects every pending request. Idempotent. */
    public close(): void {
        this.#fail(new TransportError(TransportErrorCode.Closed, 'Client closed'));
    }

    async #call<M extends Method>(
        method: M,
        params: ParamsOf<M>,
        options: CallOptions,
    ): Promise<ResultOf<M>> {
        if (!Object.hasOwn(methodValidators, method) || !methodValidators[method].params(params)) {
            throw new TypeError('Invalid RPC parameters');
        }
        if (
            (method === Method.AgentAsk || method === Method.AgentStream) &&
            'attachments' in params &&
            Array.isArray(params.attachments) &&
            params.attachments.length > 0 &&
            this.#hello?.features.attachments !== true
        ) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Gateway does not advertise attachment support; upgrade Nexa before sending media',
            );
        }
        const timeout: number = options.timeoutMs ?? this.#options.requestTimeoutMs ?? 60_000;
        if (!Number.isSafeInteger(timeout) || timeout <= 0 || timeout > 2_147_483_647) {
            throw new RangeError('Invalid request timeout');
        }
        const id: string = String(++this.#nextId);
        const text: string = JSON.stringify({ v: 1, id, method, params });
        const binary: Uint8Array<ArrayBuffer> | null =
            this.#hello?.features.binaryMedia === true ? BinaryEnvelope.encode(text) : null;
        const payload: string | Uint8Array<ArrayBuffer> = binary ?? text;
        const payloadBytes: number = binary?.byteLength ?? new TextEncoder().encode(text).length;
        const maxBytes: number = Math.min(
            this.#options.maxMessageBytes ?? 16 * 1024 * 1024,
            this.#hello?.policy.maxPayloadBytes ?? 64 * 1024,
        );
        if (binary === null && payloadBytes > maxBytes) {
            throw new TransportError(
                TransportErrorCode.Limit,
                'Request exceeds gateway payload limit',
            );
        }
        if (
            binary === null &&
            this.#socket.bufferedAmount + payloadBytes >
                (this.#hello?.policy.maxBufferedBytes ?? 16 * 1024 * 1024)
        ) {
            throw new TransportError(TransportErrorCode.Limit, 'Websocket outbound buffer is full');
        }
        const pending: Promise<JsonValue> = this.#pending.create(id, options, timeout);
        void this.#sendPayload(payload, id);
        const raw: JsonValue = await pending;
        if (!methodValidators[method].result(raw)) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Gateway returned an invalid result',
            );
        }
        return raw as ResultOf<M>;
    }
    async #sendPayload(payload: string | Uint8Array<ArrayBuffer>, id: string): Promise<void> {
        const previous: Promise<undefined> = this.#binaryTail;
        const gate: PromiseWithResolvers<undefined> = Promise.withResolvers<undefined>();
        if (typeof payload !== 'string') {
            this.#binaryTail = gate.promise;
        }
        try {
            if (typeof payload === 'string') {
                if (this.#pending.has(id)) {
                    this.#socket.send(payload);
                }
                return;
            }
            await previous;
            const chunkBytes: number = Math.min(
                BinaryChunks.CHUNK_BYTES,
                (this.#hello?.policy.maxPayloadBytes ?? 65536) - 28,
                Math.floor((this.#hello?.policy.maxBufferedBytes ?? 65536) / 2),
                (this.#options.maxMessageBytes ?? 16 * 1024 * 1024) - 28,
            );
            for (const chunk of BinaryChunks.split(payload, chunkBytes)) {
                while (this.#socket.bufferedAmount > chunkBytes) {
                    if (this.#closed || !this.#pending.has(id)) {
                        throw new Error('Binary upload was interrupted');
                    }
                    await new Promise<void>((resolve): void => {
                        setTimeout(resolve, 5);
                    });
                }
                if (this.#closed || !this.#pending.has(id)) {
                    throw new Error('Binary upload was interrupted');
                }
                this.#socket.send(chunk);
            }
        } catch (error: unknown) {
            this.#pending.reject(
                id,
                error instanceof Error ? error : new Error('Could not send request'),
            );
            if (typeof payload !== 'string') {
                this.#fail(
                    new TransportError(TransportErrorCode.Connection, 'Binary upload interrupted'),
                );
            }
        } finally {
            gate.resolve(undefined);
        }
    }

    #receive(raw: unknown): void {
        if (this.#closed) {
            return;
        }
        if (raw instanceof ArrayBuffer) {
            if (raw.byteLength > (this.#options.maxMessageBytes ?? 16 * 1024 * 1024)) {
                throw new RangeError('Binary frame exceeds limit');
            }
            if (this.#hello === null) {
                throw new Error('Binary media arrived before authentication');
            }
            const complete: ArrayBuffer | null = this.#binaryChunks.accept(raw);
            if (complete === null) {
                return;
            }
            if (complete.byteLength >= 8 && new DataView(complete).getUint32(0) === 0x4e584246) {
                this.#receive(
                    JSON.stringify(
                        BinaryEnvelope.decode(complete, BinaryChunks.MAX_TRANSFER_BYTES),
                    ),
                );
                return;
            }
            const attachment: ReceivedAttachment = BinaryMedia.decode(
                complete,
                BinaryChunks.MAX_TRANSFER_BYTES,
            );
            void this.#deliverAttachment(attachment);
            return;
        }
        if (
            typeof raw !== 'string' ||
            new TextEncoder().encode(raw).length >
                (this.#options.maxMessageBytes ?? 16 * 1024 * 1024)
        ) {
            throw new Error('Invalid frame size or encoding');
        }
        const frame: unknown = JSON.parse(raw);
        if (!isRecord(frame)) {
            throw new Error('Expected frame object');
        }
        if (typeof frame['id'] === 'string' && typeof frame['ok'] === 'boolean') {
            if (frame['ok']) {
                if (!isJson(frame['result'])) {
                    throw new Error('Expected JSON result');
                }
                this.#pending.resolve(frame['id'], frame['result']);
            } else {
                if (!validators.error(frame['error'])) {
                    throw new Error('Expected wire error');
                }
                const remote: WireError = frame['error'];
                this.#pending.reject(
                    frame['id'],
                    new TransportError(TransportErrorCode.Remote, remote.message, remote),
                );
            }
            return;
        }
        if (
            typeof frame['event'] !== 'string' ||
            typeof frame['seq'] !== 'number' ||
            !Number.isSafeInteger(frame['seq']) ||
            frame['seq'] < 1 ||
            !isJson(frame['data'])
        ) {
            throw new Error('Invalid event envelope');
        }
        const seq: bigint = BigInt(frame['seq']);
        if (seq <= this.#sequence) {
            throw new Error('Non-monotonic event sequence');
        }
        if (seq !== this.#sequence + 1n) {
            for (const listener of this.#gaps) {
                this.#notify((): void => {
                    listener({ expected: this.#sequence + 1n, received: seq });
                });
            }
        }
        this.#sequence = seq;
        if (frame['event'] === 'connect.challenge') {
            if (this.#challenge !== null || !validators.challenge(frame['data'])) {
                throw new Error('Invalid challenge');
            }
            this.#challenge = frame['data'];
            this.#wake?.();
            return;
        }
        for (const listener of this.#events) {
            const event: GatewayEvent = { event: frame['event'], data: frame['data'], seq };
            this.#notify((): void => {
                listener(event);
            });
        }
    }
    async #deliverAttachment(attachment: ReceivedAttachment): Promise<void> {
        let received: boolean = this.#attachments.size > 0;
        try {
            await Promise.all(
                [...this.#attachments].map(async (listener): Promise<void> => {
                    await listener(attachment);
                }),
            );
        } catch (error: unknown) {
            received = false;
            this.#notify((): void => {
                throw error;
            });
        }
        if (this.#hello?.features.methods.includes(Method.MediaAcknowledge)) {
            try {
                await this.call(Method.MediaAcknowledge, { id: attachment.id, received });
            } catch (error: unknown) {
                this.#notify((): void => {
                    throw error;
                });
            }
        }
    }

    #notify(listener: () => void): void {
        try {
            listener();
        } catch (error: unknown) {
            try {
                this.#options.onListenerError?.(
                    error instanceof Error ? error : new Error('Event listener failed'),
                );
            } catch {
                /** Reporting callbacks do not own the connection lifecycle. */
            }
        }
    }
    #fail(error: Error): void {
        if (this.#closed) {
            return;
        }
        this.#closed = true;
        this.#failure = error;
        this.#pending.close(error);
        this.#wake?.();
        for (const listener of this.#closeListeners) {
            this.#notify((): void => {
                listener(error);
            });
        }
        this.#closeListeners.clear();
        this.#events.clear();
        this.#attachments.clear();
        this.#binaryChunks.clear();
        this.#gaps.clear();
        this.#socket.close();
    }
}
/** Narrows only at the external JSON boundary. */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Validates arbitrary JSON without exposing unknown in the application API. */
function isJson(value: unknown): value is JsonValue {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
        return true;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value);
    }
    if (Array.isArray(value)) {
        return value.every(isJson);
    }
    return isRecord(value) && Object.values(value).every(isJson);
}
