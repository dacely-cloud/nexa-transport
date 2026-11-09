import type { ConversationDataFile } from '../protocol/Protocol.js';
import { SessionHistoryReader } from './SessionHistoryReader.js';
import { SessionArchiveRequests } from './SessionArchiveRequests.js';
import { EmotionWatches } from './EmotionWatches.js';
import { resolveBridgeInput } from '../toolsearch/BridgeInput.js';
import type { EmotionalSnapshot, TurnEventData } from '../protocol/Protocol.js';
import type { SessionHistoryRecord } from '../protocol/Protocol.js';
import { DataUploadClient } from './DataUploadClient.js';
import type { DataUploadOptions } from '../interface/DataUploadOptions.js';
export { DataUploadFailure, DataUploadFailureState } from './DataUploadFailure.js';
export type { DataUploadOriginal } from './DataUploadFailure.js';
export type { DataUploadOptions } from '../interface/DataUploadOptions.js';
import { materializeError, rethrow } from './ErrorStack.js';
import { BinaryChunks } from '../media/BinaryChunks.js';
import { InboundCapacity } from './InboundCapacity.js';
import { ClientResources } from './ClientResources.js';
import { InboundConsumerCredit } from './InboundConsumerCredit.js';
import { BinaryInputReservation } from '../media/BinaryInputReservation.js';
import { BinaryAdmissionError } from '../media/BinaryAdmissionError.js';
import type { BinaryChunkReceipt } from '../media/interface/BinaryChunkReceipt.js';
import { NexaMedia } from '../media/NexaMedia.js';
import { BinaryEnvelope } from '../media/BinaryEnvelope.js';
import {
    BinaryMedia,
    type ReceivedAttachment,
    type AttachmentProgress,
} from '../media/BinaryMedia.js';
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
import type { StreamParams, UserRegion } from '../protocol/Protocol.js';
import { BrowserRegion } from './BrowserRegion.js';
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
import { SessionFilePager } from './SessionFilePager.js';
import { GatewayVersion } from '../protocol/GatewayVersion.js';
import type { SessionFilePage, SessionFileListParams } from '../protocol/Protocol.js';
import { RedTeamClient, type RedTeamRequestMap } from '../redteam/RedTeamClient.js';
import {
    RedTeamMethod,
    type RedTeamEffort,
    type RedTeamListPage,
    type RedTeamSnapshot,
} from '../redteam/RedTeamTypes.js';
import { RedTeamRequestCodec } from '../redteam/RedTeamRequestCodec.js';

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
/** Validated journal records and the complete boundary of this history read. */
export interface SavedHistorySnapshot {
    /** Original validated records in journal order. */
    readonly records: readonly SessionHistoryRecord[];
    /** Complete byte boundary for the next incremental read. */
    readonly endCursor: string;
}
/** Saved history, live tasks and downloadable files for a subscribed session. */
export interface SessionSnapshot {
    readonly messages: ResultOf<Method.SessionsMessages>;
    readonly tasks: ResultOf<Method.TasksList>;
    readonly files: SessionFilePage['files'];
    /** Full presentation events when supported by the gateway. */
    readonly history?: readonly SessionHistoryRecord[];
}
/** Authenticated Nexa gateway connection shared by browsers and Node.js. */
export class NexaClient {
    readonly #redTeam: RedTeamClient = new RedTeamClient({
        request: <M extends RedTeamMethod>(
            method: M,
            params: RedTeamRequestMap[M],
            options: CallOptions,
        ): Promise<unknown> => this.#requestRedTeam(method, params, options),
    });

    /** Red team controls share this authenticated connection and its request limits. */
    public get redTeam(): RedTeamClient {
        return this.#redTeam;
    }
    /** Older gateways remain usable while the red team controls stay unavailable. */
    public get supportsRedTeam(): boolean {
        return (
            this.connected &&
            Object.values(RedTeamMethod).every(
                (method: RedTeamMethod): boolean =>
                    this.#hello?.features.methods.includes(method) === true,
            )
        );
    }
    async #requestRedTeam<M extends RedTeamMethod>(
        method: M,
        params: RedTeamRequestMap[M],
        options: CallOptions,
    ): Promise<RedTeamEffort | RedTeamListPage | RedTeamSnapshot> {
        if (!this.connected) {
            throw new TransportError(TransportErrorCode.Closed, 'Client is not connected');
        }
        if (!this.supportsRedTeam) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Red team efforts require an updated NEXA gateway',
            );
        }
        switch (method) {
            case RedTeamMethod.Start:
                return this.call(Method.RedteamStart, RedTeamRequestCodec.start(params), options);
            case RedTeamMethod.List:
                return this.call(Method.RedteamList, RedTeamRequestCodec.list(params), options);
            case RedTeamMethod.Get:
                return this.call(Method.RedteamGet, RedTeamRequestCodec.get(params), options);
            case RedTeamMethod.Stop:
                return this.call(Method.RedteamStop, RedTeamRequestCodec.effort(params), options);
            case RedTeamMethod.Update:
                return this.call(Method.RedteamUpdate, RedTeamRequestCodec.update(params), options);
        }
    }
    readonly #emotionalWatches: EmotionWatches = new EmotionWatches({
        read: (agentId: string | undefined, signal: AbortSignal): Promise<EmotionalSnapshot> =>
            this.emotions(agentId, { signal }),
        notify: (operation: () => void): void => this.#notify(operation),
    });

    /** Whether the authenticated gateway advertises private emotional state reads. */
    public get supportsEmotions(): boolean {
        return (
            this.connected && this.#hello?.features.methods.includes(Method.SelfEmotions) === true
        );
    }

    /** Shares live emotional reads across views; release on unmount. Refreshes after reactions, completion, reconnect and every 30 idle seconds. */
    public subscribeEmotions(
        listener: (snapshot: EmotionalSnapshot) => void,
        onError: (error: Error) => void,
        agentId?: string,
    ): () => void {
        if (!this.supportsEmotions) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Emotional state subscriptions require an updated connected Nexa gateway',
            );
        }
        return this.#emotionalWatches.subscribe(agentId, { state: listener, error: onError });
    }
    /** Read Nexa's current mood, emotions and private relationship toward this authenticated user. */
    public emotions(
        agentId?: string,
        options: CallOptions = {},
    ): Promise<ResultOf<Method.SelfEmotions>> {
        return this.call(Method.SelfEmotions, agentId === undefined ? {} : { agentId }, options);
    }
    /** Browser locale and timezone hints; returns undefined in server environments. */
    public static browserRegion(): UserRegion | undefined {
        return BrowserRegion.read();
    }
    /** Native focus receives bounded Unicode edits when the gateway advertises support. */
    public get supportsRobloxTextEditing(): boolean {
        return this.#hello?.features.robloxTextEditing === true;
    }
    /** Whether physical preview gestures can omit node ids and browser hit hints. */
    public get supportsRobloxCoordinateInput(): boolean {
        return this.#hello?.features.robloxCoordinateInput === true;
    }
    /** Whether the gateway preserves the complete visible event stream. */
    public get supportsSessionHistory(): boolean {
        return this.#hello?.features.sessionHistory === true;
    }
    /** Whether session subscriptions announce durable history additions. */
    public get supportsSessionHistoryUpdates(): boolean {
        return this.#hello?.features.sessionHistoryUpdates === true;
    }
    /** Reads a fixed history snapshot without repeating any user input. */
    public async readHistory(id: string): Promise<readonly SessionHistoryRecord[]> {
        return (await this.readHistorySnapshot(id)).records;
    }
    /** Captures a complete snapshot or catches up from a previous complete boundary. */
    public readHistorySnapshot(
        id: string,
        cursor?: string,
        endCursor?: string,
        signal?: AbortSignal,
    ): Promise<SavedHistorySnapshot> {
        return SessionHistoryReader.snapshot(
            this,
            id,
            cursor,
            endCursor,
            Math.max(1, Math.min(2, Math.floor(this.#pending.limit / 2))),
            signal,
        );
    }
    /** Restores original archived bytes through the account-scoped gateway. */
    public downloadSessionFile(
        id: string,
        attachmentId: string,
        signal?: AbortSignal,
        progress?: (receivedBytes: number, totalBytes: number) => void,
    ): Promise<ReceivedAttachment> {
        return SessionHistoryReader.download(this, id, attachmentId, signal, progress);
    }

    #socket: WebSocket;
    #detachSocket: (() => void) | undefined;
    readonly #url: URL;
    #disposed: boolean = false;
    #ready: boolean = false;
    #retryTimer: ReturnType<typeof setTimeout> | undefined;
    #attempt: number = 0;
    readonly #subscriptions: Set<string> = new Set();
    readonly #reconnectListeners: Set<() => void> = new Set();
    readonly #inbound: InboundCapacity;
    readonly #uploads: Map<string, Uint8Array<ArrayBuffer>> = new Map();
    #uploadBytes: number = 0;
    #sending: boolean = false;
    #deliveryBytes: number = 0;
    #deliveries: number = 0;
    readonly #pending: PendingRequests;
    readonly #options: ClientOptions;
    readonly #attachments: Set<(attachment: ReceivedAttachment) => void | Promise<void>> =
        new Set();
    readonly #attachmentProgress: Set<(progress: AttachmentProgress) => void> = new Set();
    readonly #events: Set<(event: GatewayEvent) => void> = new Set();
    readonly #closeListeners: Set<(error: Error) => void> = new Set();
    readonly #gaps: Set<(gap: SequenceGap) => void> = new Set();
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
        this.#inbound = new InboundCapacity(options.maxInboundBytes);
        ClientResources.register(this, this.#inbound, options.maxActiveStreams ?? 64);
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
                        : error instanceof BinaryAdmissionError
                          ? new TransportError(
                                TransportErrorCode.Limit,
                                'Inbound working memory budget is full',
                            )
                          : new TransportError(
                                TransportErrorCode.Protocol,
                                'Invalid gateway frame',
                            ),
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

    /** Opens, authenticates, and negotiates protocol v2 before returning. */
    public static async connect(options: ClientOptions): Promise<NexaClient> {
        if (
            options.tokenProvider !== undefined &&
            (options.apiKey !== undefined ||
                options.deviceId !== undefined ||
                options.deviceName !== undefined ||
                options.pairingCode !== undefined ||
                new URL(options.url).search !== '')
        ) {
            throw materializeError(
                new TypeError('A token provider cannot include other credentials'),
            );
        }
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
        if (
            options.maxInboundBytes !== undefined &&
            (!Number.isSafeInteger(options.maxInboundBytes) ||
                options.maxInboundBytes < 1 ||
                options.maxInboundBytes > InboundCapacity.DEFAULT_BYTES)
        ) {
            throw new RangeError('Invalid inbound working memory limit');
        }
        if (options.signal?.aborted === true) {
            throw new TransportError(TransportErrorCode.Aborted, 'Connection aborted');
        }
        const token: string | undefined =
            options.tokenProvider === undefined ? undefined : await options.tokenProvider();
        if (options.signal?.aborted) {
            throw new TransportError(TransportErrorCode.Aborted, 'Connection aborted');
        }
        const client: NexaClient = new NexaClient(
            token === undefined ? options : { ...options, apiKey: token },
        );
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
                this.#challenge.minProtocol > GatewayVersion.Current ||
                this.#challenge.protocol < GatewayVersion.Minimum
            ) {
                throw new TransportError(
                    TransportErrorCode.Protocol,
                    'Gateway does not support protocol v2',
                );
            }
            this.#hello = await this.#call(
                Method.Connect,
                {
                    nonce: this.#challenge.nonce,
                    minProtocol: GatewayVersion.Minimum,
                    maxProtocol: GatewayVersion.Current,
                    client: {
                        id: this.#options.client?.id ?? 'nexa-transport',
                        version: this.#options.client?.version ?? '0.1.0',
                        platform: this.#options.client?.platform ?? 'javascript',
                        mode: 'ui',
                        ...(this.#options.client?.metadataOnlyAttachments === undefined
                            ? {}
                            : {
                                  metadataOnlyAttachments:
                                      this.#options.client.metadataOnlyAttachments,
                              }),
                    },
                },
                {},
            );
            if (this.#hello.protocol !== GatewayVersion.Current) {
                throw new TransportError(
                    TransportErrorCode.Protocol,
                    'Unexpected negotiated protocol',
                );
            }
            if (this.#hello.auth.token !== undefined) {
                if (this.#options.tokenProvider !== undefined) {
                    throw new TransportError(
                        TransportErrorCode.Protocol,
                        'Session authentication cannot accept a gateway token',
                    );
                }
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
    /** Draft storage support is distinct from workflow publishing or execution. */
    public get supportsWorkflowDrafts(): boolean {
        return (
            this.connected &&
            this.#hello?.features.workflowDraftsVersion === 1 &&
            [
                Method.WorkflowsCreate,
                Method.WorkflowsSave,
                Method.WorkflowsList,
                Method.WorkflowsRead,
                Method.WorkflowsRecord,
            ].every(
                (method: Method): boolean =>
                    this.#hello?.features.methods.includes(method) === true,
            )
        );
    }
    /** Structural validation and component discovery are separate from execution readiness. */
    public get supportsWorkflowGraph(): boolean {
        return (
            this.supportsWorkflowDrafts &&
            this.#hello?.features.workflowGraphVersion === 1 &&
            this.#hello.features.methods.includes(Method.WorkflowsCatalog) &&
            this.#hello.features.methods.includes(Method.WorkflowsValidate)
        );
    }
    /** Hierarchy-aware draft reads and patches preserve local coordinates and published aliases. */
    public get supportsWorkflowGroups(): boolean {
        return this.supportsWorkflowGraph && this.#hello?.features.workflowGroupsVersion === 1;
    }
    /** Planning proposes checked edits without saving or activating the draft. */
    public get supportsWorkflowPlanning(): boolean {
        return (
            this.supportsWorkflowGraph &&
            this.#hello?.features.workflowPlanningVersion === 1 &&
            [
                Method.WorkflowsPlanningSend,
                Method.WorkflowsPlanningRead,
                Method.WorkflowsPlanningCancel,
                Method.WorkflowsPlanningHistory,
            ].every(
                (method: Method): boolean =>
                    this.#hello?.features.methods.includes(method) === true,
            )
        );
    }
    /** Durable execution is advertised separately from editing and validation. */
    public get supportsWorkflowRuns(): boolean {
        return (
            this.supportsWorkflowGraph &&
            this.#hello?.features.workflowRunsVersion === 1 &&
            [
                Method.WorkflowsRunsStart,
                Method.WorkflowsRunsRead,
                Method.WorkflowsRunsCancel,
                Method.WorkflowsRunsEvents,
                Method.WorkflowsRunsSteps,
                Method.WorkflowsRunsOutput,
                Method.WorkflowsRunsList,
            ].every(
                (method: Method): boolean =>
                    this.#hello?.features.methods.includes(method) === true,
            )
        );
    }
    /** Metadata discovery is additive; older planning gateways do not accept source selections. */
    public get supportsWorkflowPlanningSources(): boolean {
        return (
            this.supportsWorkflowPlanning &&
            this.#hello?.features.methods.includes(Method.WorkflowsPlanningSources) === true
        );
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
        if (
            (method === Method.AgentAsk || method === Method.AgentStream) &&
            this.#hello?.features.userRegion === true &&
            !Object.hasOwn(params, 'userRegion')
        ) {
            const region: UserRegion | undefined =
                this.#options.userRegion === null
                    ? undefined
                    : (this.#options.userRegion ?? BrowserRegion.read());
            if (region !== undefined) {
                params = { ...params, userRegion: region };
            }
        }
        if (
            (method === Method.AgentAsk || method === Method.AgentStream) &&
            params !== null &&
            typeof params === 'object' &&
            'responseFormat' in params &&
            params.responseFormat === 'json' &&
            this.#hello?.features.jsonReplies !== true
        ) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'JSON replies require an updated NEXA gateway',
            );
        }
        if (
            (method === Method.WorkflowsPlanningSources ||
                (method === Method.WorkflowsPlanningSend && Object.hasOwn(params, 'sourceIds'))) &&
            !this.supportsWorkflowPlanningSources
        ) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Workflow source selection requires an updated NEXA gateway',
            );
        }
        if (
            (method === Method.AgentAsk ||
                method === Method.AgentStream ||
                method === Method.SessionsRetry) &&
            'modelReview' in params &&
            params.modelReview &&
            this.#hello?.features.modelReview !== true
        ) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'AI completion review requires an updated Nexa gateway',
            );
        }
        const patch: unknown =
            method === Method.WorkflowsSave ? Reflect.get(params, 'patch') : undefined;
        const hierarchy: boolean =
            (method === Method.WorkflowsRead && Object.hasOwn(params, 'groupOffset')) ||
            (patch !== null &&
                typeof patch === 'object' &&
                (Object.hasOwn(patch, 'groups') || Object.hasOwn(patch, 'removeGroups')));
        if (hierarchy && !this.supportsWorkflowGroups) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Workflow groups require an updated NEXA gateway',
            );
        }
        if (method.startsWith('workflows.planning.') && !this.supportsWorkflowPlanning) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Ask Nexa requires an updated NEXA gateway',
            );
        }
        if (method.startsWith('workflows.runs.') && !this.supportsWorkflowRuns) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Workflow execution requires an updated NEXA gateway',
            );
        }
        if (method.startsWith('workflows.') && !this.supportsWorkflowDrafts) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Workflow drafts require an updated NEXA gateway',
            );
        }
        if (
            (method === Method.WorkflowsCatalog || method === Method.WorkflowsValidate) &&
            !this.supportsWorkflowGraph
        ) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Workflow validation requires an updated NEXA gateway',
            );
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
        const [messages, tasks, files, history]: [
            ResultOf<Method.SessionsMessages>,
            ResultOf<Method.TasksList>,
            SessionFilePage['files'],
            readonly SessionHistoryRecord[] | undefined,
        ] = await Promise.all([
            this.call(Method.SessionsMessages, { id: sessionId }),
            this.call(Method.TasksList, {}),
            this.listSessionFiles(sessionId),
            this.supportsSessionHistory ? this.readHistory(sessionId) : Promise.resolve(undefined),
        ]);
        return {
            messages,
            tasks: tasks.filter(
                (task: ResultOf<Method.TasksList>[number]): boolean => task.sessionId === sessionId,
            ),
            files,
            ...(history === undefined ? {} : { history }),
        };
    }
    /** Iterates bounded metadata pages without retaining complete directories or file bodies. */
    public filePages(
        id: string,
        options: CallOptions = {},
    ): AsyncGenerator<SessionFilePage['files'], void> {
        return new SessionFilePager(
            (params: SessionFileListParams, callOptions: CallOptions): Promise<SessionFilePage> =>
                SessionArchiveRequests.call(this, Method.SessionsFiles, params, callOptions),
        ).pages(id, options);
    }

    /** Restores complete metadata through validated pages when the caller needs an array. */
    public listSessionFiles(
        id: string,
        options: CallOptions = {},
    ): Promise<SessionFilePage['files']> {
        return new SessionFilePager(
            (params: SessionFileListParams, callOptions: CallOptions): Promise<SessionFilePage> =>
                SessionArchiveRequests.call(this, Method.SessionsFiles, params, callOptions),
        ).read(id, options);
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
    /** Observes validated attachment content byte counts without retaining file content. */
    public onAttachmentProgress(listener: (progress: AttachmentProgress) => void): () => void {
        return this.#disposed ? (): void => {} : subscribe(this.#attachmentProgress, listener);
    }
    /** Observes all events, including session mirrors and native tool progress. */
    public onEvent(listener: (event: GatewayEvent) => void): () => void {
        return this.#disposed ? (): void => {} : subscribe(this.#events, listener);
    }
    /** Observes lost events so a UI can refresh its session state. */
    public onSequenceGap(listener: (gap: SequenceGap) => void): () => void {
        return this.#disposed ? (): void => {} : subscribe(this.#gaps, listener);
    }
    /** Sends a bounded disk upload chunk as raw bytes, preserving RPC acknowledgements and cancellation. */
    public async uploadChunk(
        uploadId: string,
        offset: string,
        bytes: Uint8Array,
        options: CallOptions = {},
    ): Promise<ResultOf<typeof Method.DataUploadChunk>> {
        if (!this.connected) {
            throw new TransportError(TransportErrorCode.Closed, 'Client is not connected');
        }
        if (
            this.hello.features.binaryDataUploads !== true ||
            !this.hello.features.methods.includes(Method.DataUploadChunk)
        ) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Raw file uploads require an updated NEXA gateway',
            );
        }
        try {
            return await this.#call(
                Method.DataUploadChunk,
                { id: uploadId, offset, data: '' },
                options,
                (requestId: string): Uint8Array<ArrayBuffer> =>
                    BinaryEnvelope.encodeUploadChunk(requestId, uploadId, offset, bytes),
            );
        } catch (error: unknown) {
            rethrow(error);
        }
    }

    /** Uploads a large File/Blob to disk; pass its returned path to the agent for analysis. */
    public uploadData(
        source: Blob,
        filename: string,
        options: DataUploadOptions,
    ): Promise<ConversationDataFile> {
        return DataUploadClient.upload(this, source, filename, options);
    }

    /** Starts a bounded event stream, exposing tools, media, and native NCAP payloads. */
    public stream(params: StreamParams, options: StreamOptions = {}): TurnStream {
        if (!this.connected) {
            throw new TransportError(TransportErrorCode.Closed, 'Client is not connected');
        }
        try {
            return new TurnStream(this, params, options);
        } catch (error: unknown) {
            rethrow(error);
        }
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
        encodeBinary?: (requestId: string) => Uint8Array<ArrayBuffer>,
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
        return NexaClient.#result(this.#request(method, params, options, encodeBinary), method);
    }
    #request(
        method: Method,
        params: ParamsOf<Method>,
        options: CallOptions,
        encodeBinary?: (requestId: string) => Uint8Array<ArrayBuffer>,
    ): Promise<JsonValue> {
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
                const binary: Uint8Array<ArrayBuffer> | null =
                    encodeBinary !== undefined
                        ? encodeBinary(id)
                        : this.#hello?.features.binaryMedia === true
                          ? BinaryEnvelope.encodeValue({
                                v: GatewayVersion.Current,
                                id,
                                method,
                                params,
                            })
                          : null;
                const payload: string | Uint8Array<ArrayBuffer> =
                    binary ?? JSON.stringify({ v: GatewayVersion.Current, id, method, params });
                const payloadBytes: number =
                    binary?.byteLength ??
                    (typeof payload === 'string'
                        ? new TextEncoder().encode(payload).length
                        : payload.byteLength);
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
        return pending;
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
            const windowBytes: number = Math.min(
                4 * 1024 * 1024,
                this.#hello?.policy.maxBufferedBytes ?? 65536,
            );
            for (const chunk of BinaryChunks.split(payload, chunkBytes)) {
                while (socket.bufferedAmount + chunk.byteLength > windowBytes) {
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
            const binaryLimit: number = BinaryChunks.isChunk(raw)
                ? 28 + BinaryChunks.CHUNK_BYTES
                : BinaryChunks.MAX_TRANSFER_BYTES;
            if (raw.byteLength > binaryLimit) {
                throw materializeError(new RangeError('Binary frame exceeds limit'));
            }
            if (this.#hello === null) {
                throw materializeError(new Error('Binary media arrived before authentication'));
            }
            const receipt: BinaryChunkReceipt | null = this.#inbound.accept(
                raw,
                (progress: AttachmentProgress): void => {
                    for (const listener of this.#attachmentProgress) {
                        this.#notify((): void => listener(progress));
                    }
                },
            );
            if (receipt === null) {
                return;
            }
            const credit: BinaryInputReservation = this.#inbound.binary(receipt);
            let retained: boolean = false;
            try {
                retained = ClientResources.route(this, credit, (): boolean =>
                    this.#receiveBinary(receipt.buffer, credit),
                );
            } finally {
                if (!retained) {
                    credit.close();
                }
            }
            return;
        }
        if (typeof raw !== 'string') {
            throw materializeError(new Error('Invalid frame size or encoding'));
        }
        const credit: BinaryInputReservation = this.#inbound.text(
            raw,
            this.#options.maxMessageBytes ?? 16 * 1024 * 1024,
        );
        try {
            ClientResources.route(this, credit, (): void => this.#receiveFrame(JSON.parse(raw)));
        } finally {
            credit.close();
        }
    }

    /** Returns whether asynchronous attachment consumers now own the frame's credit. */
    #receiveBinary(complete: ArrayBuffer, credit: BinaryInputReservation): boolean {
        if (this.#hello === null) {
            throw new Error('Binary media arrived before authentication');
        }
        if (complete.byteLength >= 8 && new DataView(complete).getUint32(0) === 0x4e584246) {
            this.#receiveFrame(
                BinaryEnvelope.decode(
                    complete,
                    BinaryChunks.MAX_TRANSFER_BYTES,
                    this.#options.maxMessageBytes ?? 16 * 1024 * 1024,
                    credit,
                ),
            );
            return false;
        }
        const attachment: ReceivedAttachment = BinaryMedia.decode(
            complete,
            BinaryChunks.MAX_TRANSFER_BYTES,
            credit,
        );
        const bytes: number = attachment.data.buffer.byteLength;
        if (
            this.#deliveries >= 64 ||
            this.#deliveryBytes + bytes > BinaryChunks.MAX_TRANSFER_BYTES
        ) {
            throw new TransportError(TransportErrorCode.Limit, 'Attachment consumers fell behind');
        }
        this.#deliveries += 1;
        this.#deliveryBytes += bytes;
        this.#deliverAttachment(attachment, credit);
        return true;
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
            this.#emotionalWatches.refresh();
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
        if (
            this.#emotionalWatches.active &&
            (frame['event'] === EventName.TurnEnd || frame['event'] === EventName.TurnEvent)
        ) {
            const eventName: typeof EventName.TurnEnd | typeof EventName.TurnEvent = frame['event'];
            if (eventName === EventName.TurnEnd && isEventData(eventName, frame['data'])) {
                this.#emotionalWatches.refresh();
            } else if (
                eventName === EventName.TurnEvent &&
                isRecord(frame['data']) &&
                isRecord(frame['data']['event']) &&
                frame['data']['event']['type'] === 'tool-finish' &&
                isEventData(eventName, frame['data'])
            ) {
                const event: TurnEventData['event'] = frame['data'].event;
                if (
                    event.type === 'tool-finish' &&
                    (event.outcome.call.name === 'self_emotion' ||
                        (event.outcome.call.name === 'tool_call' &&
                            resolveBridgeInput({
                                name: event.outcome.call.name,
                                arguments: event.outcome.call.input,
                            })?.name === 'self_emotion'))
                ) {
                    this.#emotionalWatches.refresh();
                }
            }
        }
        for (const listener of this.#events) {
            const event: GatewayEvent = { event: frame['event'], data: frame['data'], seq };
            this.#notify((): void => {
                listener(event);
            });
        }
    }
    #deliverAttachment(attachment: ReceivedAttachment, credit: BinaryInputReservation): void {
        InboundConsumerCredit.track(attachment.data.buffer, credit);
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
            credit,
            pending,
        );
    }
    static async #finishAttachment(
        owner: WeakRef<NexaClient>,
        socket: WeakRef<WebSocket>,
        id: string,
        bytes: number,
        credit: BinaryInputReservation,
        pending: Promise<void>[],
    ): Promise<void> {
        const outcomes: PromiseSettledResult<void>[] = await Promise.allSettled(pending);
        InboundConsumerCredit.release(credit);
        const client: NexaClient | undefined = owner.deref();
        if (client === undefined) {
            return;
        }
        // Consumers released the original before the receipt goes on the wire. The gateway
        // may send the next file as soon as it sees that receipt, ahead of its RPC reply.
        client.#deliveries -= 1;
        client.#deliveryBytes -= bytes;
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
        this.#emotionalWatches.pause(error);
        this.#wake?.();
        for (const listener of this.#closeListeners) {
            this.#notify((): void => {
                listener(error);
            });
        }
        this.#inbound.clear();
        this.#detachSocket?.();
        this.#detachSocket = undefined;
        this.#socket.close();
        if (wasReady) {
            this.#scheduleReconnect(error);
        }
    }
    #clearListeners(): void {
        this.#emotionalWatches.clear();
        this.#subscriptions.clear();
        this.#closeListeners.clear();
        this.#events.clear();
        this.#attachments.clear();
        this.#attachmentProgress.clear();
        this.#gaps.clear();
        this.#reconnectListeners.clear();
    }
    #scheduleReconnect(error: Error): void {
        if (
            this.#disposed ||
            this.#options.reconnect === false ||
            (error instanceof TransportError &&
                (error.code === TransportErrorCode.Protocol ||
                    (error.code === TransportErrorCode.Remote &&
                        error.remote?.retryable !== true) ||
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
            if (this.#options.tokenProvider !== undefined) {
                const token: string = await this.#options.tokenProvider();
                if (this.#disposed) {
                    return;
                }
                if (token.length === 0) {
                    throw new TypeError('Token provider returned an empty token');
                }
                this.#url.searchParams.set('token', token);
            }
            this.#socket = this.#openSocket();
            await this.#handshake();
            this.#emotionalWatches.resume();
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
