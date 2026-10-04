import { ProjectChannel } from './ProjectChannel.js';
import { CompanyProjectProtocol } from '../company/CompanyProjectProtocol.js';
import { ProjectOp, type CompanyProjectState } from '../company/CompanyProjectTypes.js';
import type { CompanyWorkCommand } from '../company/CompanyWorkTypes.js';
import { OfficeLayoutProtocol, type OfficeLayoutState } from '../office/OfficeProtocol.js';
import { CompanyProtocol } from '../company/CompanyProtocol.js';
import { CompanyOp, type CompanyCommand, type CompanyState } from '../company/CompanyTypes.js';
import { CompanyChannel } from './CompanyChannel.js';
import {
    OfficeProtocol,
    OfficeGameOp,
    type OfficeGamePacket,
    type OfficePlayer,
} from '../office/OfficeProtocol.js';
import { DataUploadClient } from './DataUploadClient.js';
import type { DataUploadOptions } from '../interface/DataUploadOptions.js';
export type { DataUploadOptions } from '../interface/DataUploadOptions.js';
import type { DataFile } from '../protocol/Protocol.js';
import { materializeError, rethrow } from './ErrorStack.js';
import { BinaryChunks } from '../media/BinaryChunks.js';
import { NexaMedia } from '../media/NexaMedia.js';
import { BinaryEnvelope } from '../media/BinaryEnvelope.js';
import { BinaryMedia, type ReceivedAttachment } from '../media/BinaryMedia.js';
export type { ReceivedAttachment } from '../media/BinaryMedia.js';
import {
    EventName,
    isEventData,
    type VoiceAudio,
    type VoiceEvent,
    type EventMap,
} from '../protocol/Events.js';
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
/** A replacement hypothesis or settled caller utterance, scoped to its call. */
export interface ReceivedTranscript {
    readonly callId: string;
    readonly text: string;
    /** False replaces the current hypothesis; true appends a settled utterance. */
    readonly final: boolean;
}
/** Saved history, live tasks and downloadable files for a subscribed session. */
export interface SessionSnapshot {
    readonly messages: ResultOf<Method.SessionsMessages>;
    readonly tasks: ResultOf<Method.TasksList>;
    readonly files: ResultOf<Method.SessionsFiles>;
}
/** One scoped public office stream on your personal connection. */
export interface CollaborationOffice {
    /** Release presence and stop receiving this office. Safe to call more than once. */
    readonly close: () => void;
    /** Send movement while subscribed; identity and display name remain server-owned. */
    readonly move: (player: OfficePlayer) => void;
}
/** Authenticated Nexa gateway connection shared by browsers and Node.js. */
export class NexaClient {
    readonly #company = new CompanyChannel();
    readonly #projects: ProjectChannel = new ProjectChannel();
    /** Read a private project or submit one revision-checked decision on the existing socket. */
    public project(project: string, command?: CompanyWorkCommand): Promise<CompanyProjectState> {
        return this.#projects.state(
            command === undefined
                ? { op: ProjectOp.Read, id: crypto.randomUUID(), project }
                : { op: ProjectOp.Command, id: command.id, project, command },
        );
    }
    /** Download a captured artifact; workspace paths and another account's deliveries are inaccessible. */
    public projectFile(
        project: string,
        attempt: string,
        path: string,
    ): Promise<Uint8Array<ArrayBuffer>> {
        return this.#projects.file(project, attempt, path);
    }
    /** Private ordered state, automatically resubscribed after reconnect without replaying decisions. */
    public subscribeProject(
        project: string,
        listener: (state: CompanyProjectState) => void,
        onError: (error: Error) => void,
    ): () => void {
        return this.#projects.watch(
            project,
            (state): void => this.#notify((): void => listener(state)),
            (error): void => this.#notify((): void => onError(error)),
        );
    }
    /** Live private staffing and project briefs on the same socket, restored after reconnect. */
    public subscribeCompany(
        listener: (state: CompanyState) => void,
        onError: (error: Error) => void,
    ): () => void {
        if (!this.connected || this.#hello?.features.officeCompanyUpdates !== true) {
            throw new Error('Live company updates require the updated NEXA gateway.');
        }
        return this.#company.watch(
            (state): void => this.#notify((): void => listener(state)),
            (error): void => this.#notify((): void => onError(error)),
        );
    }
    /** Read private staffing and briefs, or submit one revision-checked idempotent company command. */
    public company(
        command: CompanyCommand = { op: CompanyOp.Read, id: crypto.randomUUID(), revision: 0n },
    ): Promise<CompanyState> {
        if (!this.connected || this.#hello?.features.officeCompany !== true) {
            return Promise.reject(
                new Error('Company management requires the updated NEXA gateway.'),
            );
        }
        if (this.#socket.bufferedAmount > 256 * 1024) {
            return Promise.reject(new Error('Office connection is busy.'));
        }
        return this.#company.request(command, (bytes) => this.#socket.send(bytes));
    }
    readonly #layouts = new Map<
        number,
        {
            resolve: (state: OfficeLayoutState) => void;
            reject: (error: Error) => void;
            timer: ReturnType<typeof setTimeout>;
        }
    >();
    #layoutId = 0;
    /** Read or save owner-only geometry over the existing connection; writes use a revision precondition. */
    public officeLayout(state?: OfficeLayoutState): Promise<OfficeLayoutState> {
        if (!this.connected || this.#hello?.features.officeLayout !== true) {
            return Promise.reject(new Error('Office building requires the updated NEXA gateway.'));
        }
        if (this.#layouts.size >= 8 || this.#socket.bufferedAmount > 256 * 1024) {
            return Promise.reject(new Error('Office connection is busy.'));
        }
        const id = ++this.#layoutId;
        const bytes = OfficeLayoutProtocol.encode({
            op: state ? 2 : 1,
            id,
            revision: state?.revision ?? 0n,
            pieces: state?.pieces ?? [],
        });
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.#layouts.delete(id);
                reject(new Error('Layout request timed out. Reload the layout before retrying.'));
            }, 15000);
            this.#layouts.set(id, { resolve, reject, timer });
            try {
                this.#socket.send(bytes);
            } catch (error) {
                clearTimeout(timer);
                this.#layouts.delete(id);
                reject(error instanceof Error ? error : new Error('Layout send failed'));
            }
        });
    }

    readonly #officeListeners = new Set<(packet: OfficeGamePacket) => void>();
    #socket: WebSocket;
    #detachSocket: (() => void) | undefined;
    readonly #url: URL;
    #disposed: boolean = false;
    #ready: boolean = false;
    #retryTimer: ReturnType<typeof setTimeout> | undefined;
    #attempt: number = 0;
    readonly #subscriptions: Set<string> = new Set();
    readonly #reconnectListeners: Set<() => void> = new Set();
    readonly #binaryChunks: BinaryChunks = new BinaryChunks();
    readonly #uploads: Map<string, Uint8Array<ArrayBuffer>> = new Map();
    #uploadBytes: number = 0;
    #sending: boolean = false;
    #deliveryBytes: number = 0;
    #deliveries: number = 0;
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
        const { signal: _signal, ...settings } = options;
        this.#options = settings;
        this.#pending = new PendingRequests(options.maxPendingRequests ?? 64);
        const url: URL = new URL(options.url);
        if (url.protocol === 'https:') {
            url.protocol = 'wss:';
        }
        if (url.protocol === 'http:') {
            url.protocol = 'ws:';
        }
        if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password || url.hash) {
            throw materializeError(
                new TypeError('Expected a ws(s) endpoint without userinfo or fragment'),
            );
        }
        if (options.apiKey !== undefined) {
            if (options.apiKey.length === 0) {
                throw materializeError(new TypeError('apiKey cannot be empty'));
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
        this.#url = url;
        this.#socket = this.#openSocket();
    }

    #openSocket(): WebSocket {
        const socket: WebSocket = new WebSocket(this.#url);
        socket.binaryType = 'arraybuffer';
        const message = (event: MessageEvent<unknown>): void => {
            if (socket !== this.#socket) {
                return;
            }
            try {
                this.#receive(event.data);
            } catch (error: unknown) {
                this.#fail(
                    error instanceof TransportError
                        ? error
                        : new TransportError(TransportErrorCode.Protocol, 'Invalid gateway frame'),
                );
            }
        };
        const close = (event: CloseEvent): void => {
            if (socket !== this.#socket) {
                return;
            }
            this.#fail(
                new TransportError(
                    TransportErrorCode.Closed,
                    `Gateway connection closed (${event.code}): ${event.reason || 'no close reason received'}`,
                    undefined,
                    { code: event.code, reason: event.reason, wasClean: event.wasClean },
                ),
            );
        };
        const error = (): void => {
            if (socket !== this.#socket) {
                return;
            }
            // An established WebSocket emits close after error; preserve its actual close details.
            if (this.#hello !== null) {
                return;
            }
            this.#fail(
                new TransportError(
                    TransportErrorCode.Connection,
                    'Gateway connection failed; check credentials, origin policy, and endpoint',
                ),
            );
        };
        socket.addEventListener('message', message);
        socket.addEventListener('close', close);
        socket.addEventListener('error', error);
        this.#detachSocket = (): void => {
            socket.removeEventListener('message', message);
            socket.removeEventListener('close', close);
            socket.removeEventListener('error', error);
        };
        return socket;
    }

    /** Opens, authenticates, and negotiates protocol v1 before returning. */
    public static async connect(options: ClientOptions): Promise<NexaClient> {
        for (const value of [
            options.connectTimeoutMs,
            options.requestTimeoutMs,
            options.maxMessageBytes,
            options.maxPendingRequests,
            options.maxActiveStreams,
        ]) {
            if (
                value !== undefined &&
                (!Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647)
            ) {
                throw materializeError(
                    new RangeError('Connection limits must be positive bounded integers'),
                );
            }
        }
        if (options.signal?.aborted === true) {
            throw new TransportError(TransportErrorCode.Aborted, 'Connection aborted');
        }
        const client: NexaClient = new NexaClient(options);
        try {
            await client.#handshake(options.signal);
            return client;
        } catch (error: unknown) {
            client.close();
            throw error;
        }
    }

    async #handshake(signal?: AbortSignal): Promise<void> {
        const abort: () => void = (): void => {
            this.#fail(new TransportError(TransportErrorCode.Aborted, 'Connection aborted'));
        };
        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
            this.#fail(
                new TransportError(TransportErrorCode.Timeout, 'Gateway handshake timed out'),
            );
        }, this.#options.connectTimeoutMs ?? 15_000);
        signal?.addEventListener('abort', abort, { once: true });
        try {
            await new Promise<void>((resolve): void => {
                this.#wake = resolve;
            });
            if (this.#failure !== undefined) {
                throw this.#failure;
            }
            if (
                this.#challenge === null ||
                this.#challenge.minProtocol > 1 ||
                this.#challenge.protocol < 1
            ) {
                throw new TransportError(
                    TransportErrorCode.Protocol,
                    'Gateway does not support protocol v1',
                );
            }
            this.#hello = await this.#call(
                Method.Connect,
                {
                    nonce: this.#challenge.nonce,
                    minProtocol: 1,
                    maxProtocol: 1,
                    client: {
                        id: this.#options.client?.id ?? 'nexa-transport',
                        version: this.#options.client?.version ?? '0.1.0',
                        platform: this.#options.client?.platform ?? 'javascript',
                        mode: 'ui',
                    },
                },
                {},
            );
            if (this.#hello.protocol !== 1) {
                throw new TransportError(
                    TransportErrorCode.Protocol,
                    'Unexpected negotiated protocol',
                );
            }
            if (this.#hello.auth.token !== undefined) {
                this.#url.searchParams.set('token', this.#hello.auth.token);
                this.#url.searchParams.delete('pair');
            }
            for (const sessionId of this.#subscriptions) {
                await this.#call(Method.SessionsSubscribe, { sessionId }, {});
            }
            if (this.#closed || this.#disposed) {
                throw (
                    this.#failure ?? new TransportError(TransportErrorCode.Closed, 'Client closed')
                );
            }
            this.#ready = true;
            if (this.#hello.features.officeCompanyUpdates === true) {
                this.#company.resume((bytes): void => {
                    if (!this.connected || this.#socket.bufferedAmount > 256 * 1024) {
                        throw new Error('Company connection is unavailable or busy.');
                    }
                    this.#socket.send(bytes);
                });
            }
            if (this.#hello.features.officeProjects === true) {
                this.#projects.resume((bytes): void => {
                    if (!this.connected || this.#socket.bufferedAmount > 256 * 1024) {
                        throw new Error('Project connection is unavailable or busy.');
                    }
                    this.#socket.send(bytes);
                });
            }
            if (this.#officeListeners.size > 0) {
                this.#sendOffice(OfficeProtocol.control(OfficeGameOp.Request));
            }
            this.#attempt = 0;
        } catch (error: unknown) {
            this.#fail(error instanceof Error ? error : new Error(String(error)));
            throw error;
        } finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
            this.#wake = undefined;
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
        return !this.#closed && this.#ready && this.#socket.readyState === WebSocket.OPEN;
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
        const pending: Promise<ResultOf<M>> = this.#call(method, params, options).catch(rethrow);
        if (
            (method === Method.SessionsSubscribe || method === Method.SessionsUnsubscribe) &&
            'sessionId' in params &&
            typeof params.sessionId === 'string'
        ) {
            return this.#updateSubscription(pending, method, params.sessionId);
        }
        return pending;
    }
    async #updateSubscription<M extends Method>(
        pending: Promise<ResultOf<M>>,
        method: M,
        sessionId: string,
    ): Promise<ResultOf<M>> {
        const result: ResultOf<M> = await pending;
        if (!this.#disposed) {
            if (method === Method.SessionsSubscribe) {
                this.#subscriptions.add(sessionId);
            } else {
                this.#subscriptions.delete(sessionId);
            }
        }
        return result;
    }
    /** Restores messages, active tasks and file metadata without downloading saved attachments or repeating a turn. */
    public async resumeSession(sessionId: string): Promise<SessionSnapshot> {
        await this.call(Method.SessionsSubscribe, { sessionId });
        const [messages, tasks, files]: [
            ResultOf<Method.SessionsMessages>,
            ResultOf<Method.TasksList>,
            ResultOf<Method.SessionsFiles>,
        ] = await Promise.all([
            this.call(Method.SessionsMessages, { id: sessionId }),
            this.call(Method.TasksList, {}),
            this.call(Method.SessionsFiles, { id: sessionId }),
        ]);
        return {
            messages,
            tasks: tasks.filter(
                (task: ResultOf<Method.TasksList>[number]): boolean => task.sessionId === sessionId,
            ),
            files,
        };
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

    /** Receives live ASR revisions and settled utterances. Subscribe before startVoice. */
    public onTranscript(listener: (event: ReceivedTranscript) => void): () => void {
        return this.on(EventName.VoiceEvent, (event: VoiceEvent): void => {
            if (event.kind === 'interim' || event.kind === 'heard') {
                listener({ callId: event.callId, text: event.text, final: event.kind === 'heard' });
            }
        });
    }

    /** Opens the server voice path, including its configured Nerva streaming transcriber. */
    public startVoice(
        params: ParamsOf<typeof Method.VoiceStart> = {},
        options: CallOptions = {},
    ): Promise<ResultOf<typeof Method.VoiceStart>> {
        return this.call(Method.VoiceStart, params, options);
    }

    /** Releases the microphone, transcription stream, and speech session. */
    public stopVoice(
        callId: string,
        options: CallOptions = {},
    ): Promise<ResultOf<typeof Method.VoiceStop>> {
        return this.call(Method.VoiceStop, { callId }, options);
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
        return this.#disposed ? (): void => {} : subscribe(this.#attachments, listener);
    }
    /** Observes all events, including session mirrors and native tool progress. */
    public onEvent(listener: (event: GatewayEvent) => void): () => void {
        return this.#disposed ? (): void => {} : subscribe(this.#events, listener);
    }
    /** Observes lost events so a UI can refresh its session state. */
    public onSequenceGap(listener: (gap: SequenceGap) => void): () => void {
        return this.#disposed ? (): void => {} : subscribe(this.#gaps, listener);
    }
    /** Uploads a large File/Blob to disk; pass its returned path to the agent for analysis. */
    public uploadData(
        source: Blob,
        filename: string,
        options: DataUploadOptions = {},
    ): Promise<DataFile> {
        return DataUploadClient.upload(this, source, filename, options);
    }

    /** Starts a bounded event stream, exposing tools, media, and native NCAP payloads. */
    public stream(params: StreamParams, options: StreamOptions = {}): TurnStream {
        if (!this.connected) {
            throw new TransportError(TransportErrorCode.Closed, 'Client is not connected');
        }
        const streamId: string = params.streamId ?? crypto.randomUUID();
        if (this.#streamIds.has(streamId)) {
            throw materializeError(new TypeError('Stream id is already active'));
        }
        if (this.#streamIds.size >= (this.#options.maxActiveStreams ?? 64)) {
            throw new TransportError(TransportErrorCode.Limit, 'Too many active streams');
        }
        this.#streamIds.add(streamId);
        try {
            const turn: TurnStream = new TurnStream(this, { ...params, streamId }, options);
            void this.#releaseStream(turn);
            return turn;
        } catch (error: unknown) {
            this.#streamIds.delete(streamId);
            rethrow(error);
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
    /** Observe authoritative office state over this existing authenticated connection. */
    public subscribeOffice(listener: (packet: OfficeGamePacket) => void): () => void {
        if (this.#hello?.features.officeGame !== true) {
            throw new Error('This NEXA server does not support live office state');
        }
        const release = subscribe(this.#officeListeners, listener);
        const reference = new WeakRef(this);
        this.#sendOffice(OfficeProtocol.control(OfficeGameOp.Request));
        return () => {
            release();
            const owner = reference.deref();
            if (owner !== undefined && owner.#officeListeners.size === 0) {
                owner.#sendOffice(OfficeProtocol.control(OfficeGameOp.Leave));
            }
        };
    }
    /** Send bounded player input; agent state can only originate in the runtime. */
    public moveOffice(player: OfficePlayer): void {
        if (this.#officeListeners.size > 0) {
            this.#sendOffice({ ...OfficeProtocol.control(OfficeGameOp.Player), player });
        }
    }
    #sendOffice(packet: OfficeGamePacket): void {
        if (!this.connected || this.#hello?.features.officeGame !== true) {
            return;
        }
        const bytes = OfficeProtocol.encode(
            packet,
            this.#hello.features.officeDeskPositions === true
                ? 8
                : this.#hello.features.officeAppearance === true
                  ? 7
                  : this.#hello.features.officeExecution === true
                    ? 6
                    : this.#hello.features.officeConstruction === true
                      ? 5
                      : this.#hello.features.officeDeskAssignments === true
                        ? 4
                        : this.#hello.features.officeGameVersion === 3
                          ? 3
                          : 2,
        );
        if (this.#socket.bufferedAmount > 256 * 1024) {
            if (packet.op === OfficeGameOp.Player) {
                return;
            }
            throw new Error('Office control blocked by socket backpressure');
        }
        this.#socket.send(bytes);
    }

    /** Observes connection termination for resource owners and UI state. */
    public onClose(listener: (error: Error) => void): () => void {
        if (this.#failure !== undefined) {
            listener(this.#failure);
            return (): void => {};
        }
        return subscribe(this.#closeListeners, listener);
    }
    /** Observes a restored connection after session subscriptions have been restored. Refresh history and tasks here. */
    public onReconnect(listener: () => void): () => void {
        return this.#disposed ? (): void => {} : subscribe(this.#reconnectListeners, listener);
    }
    /** Whether a lost connection is waiting for or performing another handshake. */
    public get reconnecting(): boolean {
        return !this.#disposed && this.#attempt > 0;
    }
    /** Closes permanently, cancelling reconnect and rejecting pending requests. Idempotent. */
    public close(): void {
        this.#disposed = true;
        clearTimeout(this.#retryTimer);
        this.#fail(new TransportError(TransportErrorCode.Closed, 'Client closed'));
        this.#clearListeners();
    }

    async #call<M extends Method>(
        method: M,
        params: ParamsOf<M>,
        options: CallOptions,
    ): Promise<ResultOf<M>> {
        if (!Object.hasOwn(methodValidators, method) || !methodValidators[method].params(params)) {
            throw materializeError(new TypeError('Invalid RPC parameters'));
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
            throw materializeError(new RangeError('Invalid request timeout'));
        }
        const id: string = String(++this.#nextId);
        const pending: Promise<JsonValue> = this.#pending.create(id, options, timeout, (): void => {
            const queued: Uint8Array<ArrayBuffer> | undefined = this.#uploads.get(id);
            if (queued !== undefined) {
                this.#uploadBytes -= queued.byteLength;
                this.#uploads.delete(id);
            }
        });
        // Rejected or already aborted requests must not allocate or queue upload payloads.
        if (this.#pending.has(id)) {
            try {
                const text: string = JSON.stringify({ v: 1, id, method, params });
                const binary: Uint8Array<ArrayBuffer> | null =
                    this.#hello?.features.binaryMedia === true ? BinaryEnvelope.encode(text) : null;
                const payload: string | Uint8Array<ArrayBuffer> = binary ?? text;
                const payloadBytes: number =
                    binary?.byteLength ?? new TextEncoder().encode(text).length;
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
                    throw new TransportError(
                        TransportErrorCode.Limit,
                        'Websocket outbound buffer is full',
                    );
                }
                this.#sendPayload(payload, id);
            } catch (error: unknown) {
                this.#pending.reject(
                    id,
                    error instanceof Error ? error : new Error('Could not encode request'),
                );
            }
        }
        return NexaClient.#result(pending, method);
    }
    static async #result<M extends Method>(
        pending: Promise<JsonValue>,
        method: M,
    ): Promise<ResultOf<M>> {
        const raw: JsonValue = await pending;
        if (!methodValidators[method].result(raw)) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Gateway returned an invalid result',
            );
        }
        return raw as ResultOf<M>;
    }
    #sendPayload(payload: string | Uint8Array<ArrayBuffer>, id: string): void {
        if (!this.#pending.has(id)) {
            return;
        }
        if (this.#socket.readyState !== WebSocket.OPEN) {
            throw new TransportError(TransportErrorCode.Closed, 'Gateway socket is closing');
        }
        if (typeof payload === 'string') {
            this.#socket.send(payload);
            return;
        }
        if (this.#uploadBytes + payload.byteLength > BinaryChunks.MAX_TRANSFER_BYTES) {
            throw new TransportError(
                TransportErrorCode.Limit,
                'Binary upload memory budget is full',
            );
        }
        this.#uploadBytes += payload.byteLength;
        this.#uploads.set(id, payload);
        if (!this.#sending) {
            void this.#drainUploads();
        }
    }
    async #drainUploads(): Promise<void> {
        this.#sending = true;
        try {
            for (const [id, payload] of this.#uploads) {
                this.#uploads.delete(id);
                try {
                    await this.#sendBinary(payload, id);
                } finally {
                    this.#uploadBytes -= payload.byteLength;
                }
            }
        } finally {
            this.#sending = false;
        }
    }
    async #sendBinary(payload: Uint8Array<ArrayBuffer>, id: string): Promise<void> {
        const socket: WebSocket = this.#socket;
        let started: boolean = false;
        try {
            const chunkBytes: number = Math.min(
                BinaryChunks.CHUNK_BYTES,
                (this.#hello?.policy.maxPayloadBytes ?? 65536) - 28,
                Math.floor((this.#hello?.policy.maxBufferedBytes ?? 65536) / 2),
                (this.#options.maxMessageBytes ?? 16 * 1024 * 1024) - 28,
            );
            for (const chunk of BinaryChunks.split(payload, chunkBytes)) {
                while (socket.bufferedAmount > chunkBytes) {
                    if (
                        socket !== this.#socket ||
                        socket.readyState !== WebSocket.OPEN ||
                        this.#closed ||
                        !this.#pending.has(id)
                    ) {
                        throw materializeError(new Error('Binary upload was interrupted'));
                    }
                    await new Promise<void>((resolve): void => {
                        setTimeout(resolve, 5);
                    });
                }
                if (
                    socket !== this.#socket ||
                    socket.readyState !== WebSocket.OPEN ||
                    this.#closed ||
                    !this.#pending.has(id)
                ) {
                    throw materializeError(new Error('Binary upload was interrupted'));
                }
                socket.send(chunk);
                started = true;
            }
        } catch (error: unknown) {
            this.#pending.reject(
                id,
                error instanceof Error ? error : new Error('Could not send request'),
            );
            if (started && socket === this.#socket) {
                this.#fail(
                    new TransportError(TransportErrorCode.Connection, 'Binary upload interrupted'),
                );
            }
        }
    }

    #receive(raw: unknown): void {
        if (this.#closed) {
            return;
        }
        if (raw instanceof ArrayBuffer) {
            if (raw.byteLength > (this.#options.maxMessageBytes ?? 16 * 1024 * 1024)) {
                throw materializeError(new RangeError('Binary frame exceeds limit'));
            }
            if (this.#hello === null) {
                throw materializeError(new Error('Binary media arrived before authentication'));
            }
            const complete: ArrayBuffer | null = this.#binaryChunks.accept(raw);
            if (complete === null) {
                return;
            }
            if (CompanyProjectProtocol.isFrame(new Uint8Array(complete))) {
                if (this.#hello.features.officeProjects !== true) {
                    throw new Error('Unnegotiated project frame');
                }
                this.#projects.receive(CompanyProjectProtocol.decode(new Uint8Array(complete)));
                return;
            }
            if (CompanyProtocol.isFrame(new Uint8Array(complete))) {
                if (this.#hello.features.officeCompany !== true) {
                    throw new Error('Unnegotiated company frame');
                }
                this.#company.receive(CompanyProtocol.decode(new Uint8Array(complete)));
                return;
            }
            if (OfficeLayoutProtocol.isFrame(new Uint8Array(complete))) {
                const packet = OfficeLayoutProtocol.decode(new Uint8Array(complete));
                if (packet.op !== 3 && packet.op !== 4) {
                    throw new Error('Unexpected layout command');
                }
                const pending = this.#layouts.get(packet.id);
                if (pending) {
                    this.#layouts.delete(packet.id);
                    clearTimeout(pending.timer);
                    if (packet.op === 4) {
                        pending.reject(new Error(packet.message));
                    } else {
                        pending.resolve({ revision: packet.revision, pieces: packet.pieces });
                    }
                }
                return;
            }
            if (OfficeProtocol.isFrame(new Uint8Array(complete))) {
                if (this.#hello.features.officeGame !== true) {
                    throw new Error('Unnegotiated office frame');
                }
                const packet = OfficeProtocol.decode(new Uint8Array(complete));
                for (const listener of this.#officeListeners) {
                    this.#notify(() => listener(packet));
                }
                return;
            }
            if (complete.byteLength >= 8 && new DataView(complete).getUint32(0) === 0x4e584246) {
                this.#receiveFrame(
                    BinaryEnvelope.decode(
                        complete,
                        BinaryChunks.MAX_TRANSFER_BYTES,
                        this.#options.maxMessageBytes ?? 16 * 1024 * 1024,
                    ),
                );
                return;
            }
            const attachment: ReceivedAttachment = BinaryMedia.decode(
                complete,
                BinaryChunks.MAX_TRANSFER_BYTES,
            );
            const bytes: number = attachment.data.buffer.byteLength;
            if (
                this.#deliveries >= 64 ||
                this.#deliveryBytes + bytes > BinaryChunks.MAX_TRANSFER_BYTES
            ) {
                throw new TransportError(
                    TransportErrorCode.Limit,
                    'Attachment consumers fell behind',
                );
            }
            this.#deliveries += 1;
            this.#deliveryBytes += bytes;
            this.#deliverAttachment(attachment);
            return;
        }
        if (
            typeof raw !== 'string' ||
            new TextEncoder().encode(raw).length >
                (this.#options.maxMessageBytes ?? 16 * 1024 * 1024)
        ) {
            throw materializeError(new Error('Invalid frame size or encoding'));
        }
        this.#receiveFrame(JSON.parse(raw));
    }
    #receiveFrame(frame: unknown): void {
        if (!isRecord(frame)) {
            throw materializeError(new Error('Expected frame object'));
        }
        if (typeof frame['id'] === 'string' && typeof frame['ok'] === 'boolean') {
            if (frame['ok']) {
                if (!isJson(frame['result'])) {
                    throw materializeError(new Error('Expected JSON result'));
                }
                this.#pending.resolve(frame['id'], frame['result']);
            } else {
                if (!validators.error(frame['error'])) {
                    throw materializeError(new Error('Expected wire error'));
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
            throw materializeError(new Error('Invalid event envelope'));
        }
        const seq: bigint = BigInt(frame['seq']);
        if (seq <= this.#sequence) {
            throw materializeError(new Error('Non-monotonic event sequence'));
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
                throw materializeError(new Error('Invalid challenge'));
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
    #deliverAttachment(attachment: ReceivedAttachment): void {
        const pending: Promise<void>[] = [...this.#attachments].map((listener): Promise<void> => {
            try {
                return Promise.resolve(listener(attachment));
            } catch (error: unknown) {
                return Promise.reject(
                    error instanceof Error ? error : new Error('Attachment listener failed'),
                );
            }
        });
        // User promises can outlive a connection. They must not root its client or file buffer.
        void NexaClient.#finishAttachment(
            new WeakRef(this),
            new WeakRef(this.#socket),
            attachment.id,
            attachment.data.buffer.byteLength,
            pending,
        );
    }
    static async #finishAttachment(
        owner: WeakRef<NexaClient>,
        socket: WeakRef<WebSocket>,
        id: string,
        bytes: number,
        pending: Promise<void>[],
    ): Promise<void> {
        const outcomes: PromiseSettledResult<void>[] = await Promise.allSettled(pending);
        const client: NexaClient | undefined = owner.deref();
        if (client === undefined) {
            return;
        }
        try {
            if (socket.deref() !== client.#socket || !client.connected) {
                return;
            }
            let received: boolean = outcomes.length > 0;
            for (const outcome of outcomes) {
                if (outcome.status === 'rejected') {
                    received = false;
                    client.#notify((): void => {
                        throw outcome.reason;
                    });
                }
            }
            if (client.#hello?.features.methods.includes(Method.MediaAcknowledge)) {
                await client.call(Method.MediaAcknowledge, { id, received });
            }
        } catch (error: unknown) {
            client.#notify((): void => {
                throw error;
            });
        } finally {
            client.#deliveries -= 1;
            client.#deliveryBytes -= bytes;
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
        const wasReady: boolean = this.#ready;
        this.#ready = false;
        this.#closed = true;
        this.#failure = materializeError(error);
        this.#pending.close(error);
        this.#company.close(error);
        this.#projects.disconnect(error);
        for (const pending of this.#layouts.values()) {
            clearTimeout(pending.timer);
            pending.reject(error);
        }
        this.#layouts.clear();
        this.#wake?.();
        for (const listener of this.#closeListeners) {
            this.#notify((): void => {
                listener(error);
            });
        }
        this.#binaryChunks.clear();
        this.#detachSocket?.();
        this.#detachSocket = undefined;
        this.#socket.close();
        if (wasReady) {
            this.#scheduleReconnect(error);
        }
    }
    #clearListeners(): void {
        this.#projects.clear();
        this.#company.clear();
        this.#officeListeners.clear();
        this.#subscriptions.clear();
        this.#streamIds.clear();
        this.#closeListeners.clear();
        this.#events.clear();
        this.#attachments.clear();
        this.#gaps.clear();
        this.#reconnectListeners.clear();
    }
    #scheduleReconnect(error: Error): void {
        if (
            this.#disposed ||
            this.#options.reconnect === false ||
            (error instanceof TransportError &&
                (error.code === TransportErrorCode.Protocol ||
                    error.code === TransportErrorCode.Remote ||
                    error.code === TransportErrorCode.Aborted ||
                    error.code === TransportErrorCode.Limit ||
                    error.closeDetails?.code === 1008))
        ) {
            this.#disposed = true;
            this.#clearListeners();
            return;
        }
        this.#attempt += 1;
        const delay: number = Math.min(30_000, 500 * 2 ** Math.min(this.#attempt - 1, 6));
        this.#retryTimer = setTimeout(
            (): void => {
                void this.#reconnect();
            },
            delay * (0.5 + Math.random() * 0.5),
        );
    }
    async #reconnect(): Promise<void> {
        if (this.#disposed) {
            return;
        }
        this.#closed = false;
        this.#failure = undefined;
        this.#hello = null;
        this.#challenge = null;
        this.#sequence = 0n;
        try {
            this.#socket = this.#openSocket();
            await this.#handshake();
            for (const listener of this.#reconnectListeners) {
                this.#notify(listener);
            }
        } catch (error: unknown) {
            this.#scheduleReconnect(error instanceof Error ? error : new Error(String(error)));
        }
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

/** Cleanup handles never outlive the registry's ownership of callbacks. */
function subscribe<T extends object>(listeners: Set<T>, listener: T): () => void {
    listeners.add(listener);
    const registry: WeakRef<Set<T>> = new WeakRef(listeners);
    const callback: WeakRef<T> = new WeakRef(listener);
    return (): void => {
        const entry: T | undefined = callback.deref();
        if (entry !== undefined) {
            registry.deref()?.delete(entry);
        }
    };
}
