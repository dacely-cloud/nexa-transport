// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Method } from 'nexa-protocol/gateway/Method.js';
import type {
    AttachEnvironmentParams,
    AttachedEnvironment,
    AttachedEnvironmentDoneResult,
    AttachedEnvironmentErrorResult,
    AttachedEnvironmentExec,
    AttachedEnvironmentExecResult,
    AttachedEnvironmentList,
    AttachedEnvironmentListResult,
    AttachedEnvironmentOperation,
    AttachedEnvironmentRead,
    AttachedEnvironmentReadResult,
    AttachedEnvironmentRemove,
    AttachedEnvironmentRequestData,
    AttachedEnvironmentResult,
    AttachedEnvironmentStat,
    AttachedEnvironmentStatResult,
    AttachedEnvironmentWrite,
} from 'nexa-protocol/environments/AttachedEnvironmentTypes.js';
import type { NexaClient } from '../networking/NexaClient.js';
import { TransportError, TransportErrorCode } from '../networking/TransportError.js';
import { EventName } from '../protocol/Events.js';
import { AttachedEnvironmentFailure } from './AttachedEnvironmentFailure.js';
import { AttachedEnvironmentResults } from './AttachedEnvironmentResults.js';

export { AttachedEnvironmentFailure } from './AttachedEnvironmentFailure.js';

/** What a handler knows about the request it serves. */
export interface AttachedEnvironmentRequestContext {
    /** Aborted when the environment is detached, the host closes or the connection is lost. */
    readonly signal: AbortSignal;
    /** The environment the request is for. */
    readonly environment: AttachedEnvironment;
    /** The request id Nexa assigned. */
    readonly requestId: string;
}

/**
 * Runs the six operations Nexa asks an attached environment for.
 *
 * @remarks
 * Paths are absolute paths in the environment's own syntax. An `exec` without `argv` is a command
 * line for the platform shell; with `argv`, `command` is the program and `argv` its arguments.
 * Throw {@link AttachedEnvironmentFailure} to answer with an error code; any other error is
 * answered as `failed`. Each handler decides what it is willing to run: Nexa never widens it.
 */
export interface AttachedEnvironmentHandlers {
    /** Runs a command to completion and returns its exit status and output. */
    exec(
        operation: AttachedEnvironmentExec,
        context: AttachedEnvironmentRequestContext,
    ): Promise<AttachedEnvironmentExecResult>;
    /** Reads a whole file. */
    read(
        operation: AttachedEnvironmentRead,
        context: AttachedEnvironmentRequestContext,
    ): Promise<AttachedEnvironmentReadResult>;
    /** Writes a whole file. */
    write(
        operation: AttachedEnvironmentWrite,
        context: AttachedEnvironmentRequestContext,
    ): Promise<AttachedEnvironmentDoneResult>;
    /** Lists a directory. */
    list(
        operation: AttachedEnvironmentList,
        context: AttachedEnvironmentRequestContext,
    ): Promise<AttachedEnvironmentListResult>;
    /** Describes one path. */
    stat(
        operation: AttachedEnvironmentStat,
        context: AttachedEnvironmentRequestContext,
    ): Promise<AttachedEnvironmentStatResult>;
    /** Removes a path; directories only with `recursive`. */
    remove(
        operation: AttachedEnvironmentRemove,
        context: AttachedEnvironmentRequestContext,
    ): Promise<AttachedEnvironmentDoneResult>;
}

/** How an attached environment is served. */
export interface AttachedEnvironmentHostOptions {
    /** Attach again after the client reconnects, under a new id. Default true. */
    readonly reattach?: boolean;
    /** Receives failures to answer a request or to attach again. */
    readonly onError?: (error: Error) => void;
    /**
     * Largest JSON frame an answer may use. Defaults to the gateway's `maxPayloadBytes`; set it
     * lower when the client was connected with a smaller `maxMessageBytes`.
     */
    readonly maximumFrameBytes?: number;
}

/** Receives one validated request for an environment this client attached. */
type RequestListener = (data: AttachedEnvironmentRequestData) => void;

/** Routes `environment.request` events of one client to its hosts with a single subscription. */
class AttachedEnvironmentDispatch {
    static readonly #clients: WeakMap<NexaClient, AttachedEnvironmentDispatch> = new WeakMap();
    readonly #listeners: Map<string, RequestListener> = new Map();
    readonly #client: NexaClient;
    #unsubscribe: (() => void) | null = null;

    private constructor(client: NexaClient) {
        this.#client = client;
    }

    /** The client's dispatcher, created on first use. */
    public static of(client: NexaClient): AttachedEnvironmentDispatch {
        let dispatch: AttachedEnvironmentDispatch | undefined = this.#clients.get(client);
        if (dispatch === undefined) {
            dispatch = new AttachedEnvironmentDispatch(client);
            this.#clients.set(client, dispatch);
        }
        return dispatch;
    }

    /** Routes requests for `id` to `listener`. */
    public add(id: string, listener: RequestListener): void {
        this.#listeners.set(id, listener);
        this.#unsubscribe ??= this.#client.on(
            EventName.EnvironmentRequest,
            (data: AttachedEnvironmentRequestData): void => {
                this.#listeners.get(data.environmentId)?.(data);
            },
        );
    }

    /** Stops routing requests for `id`; the last removal drops the subscription. */
    public remove(id: string): void {
        this.#listeners.delete(id);
        if (this.#listeners.size === 0) {
            this.#unsubscribe?.();
            this.#unsubscribe = null;
            AttachedEnvironmentDispatch.#clients.delete(this.#client);
        }
    }
}

/**
 * Lends an environment to a client's turns and answers every request Nexa sends for it.
 *
 * @remarks
 * Attach once, name {@link AttachedEnvironmentHost.id} in a turn's `attachedEnvironments`, and
 * the turn's tools run through the handlers. Requests are served concurrently. The environment
 * lives as long as the connection: after a reconnect it is attached again under a new id (see
 * {@link AttachedEnvironmentHost.onAttach}), and {@link AttachedEnvironmentHost.detach} or
 * disposal ends it, cancelling requests still running.
 *
 * @example
 * ```ts
 * const host: AttachedEnvironmentHost = await AttachedEnvironmentHost.attach(client, definition, handlers);
 * const turn = client.stream({ message: 'Run the tests', attachedEnvironments: [host.id] });
 * ```
 */
export class AttachedEnvironmentHost implements AsyncDisposable {
    readonly #client: NexaClient;
    readonly #definition: AttachEnvironmentParams;
    readonly #handlers: AttachedEnvironmentHandlers;
    readonly #options: AttachedEnvironmentHostOptions;
    readonly #attachListeners: Set<(environment: AttachedEnvironment) => void> = new Set();
    readonly #lifetime: AbortController = new AbortController();
    readonly #running: Set<Promise<void>> = new Set();
    #environment: AttachedEnvironment;
    #generation: AbortController = new AbortController();
    #unsubscribeReconnect: (() => void) | null = null;

    private constructor(
        client: NexaClient,
        definition: AttachEnvironmentParams,
        handlers: AttachedEnvironmentHandlers,
        options: AttachedEnvironmentHostOptions,
        environment: AttachedEnvironment,
    ) {
        this.#client = client;
        this.#definition = definition;
        this.#handlers = handlers;
        this.#options = options;
        this.#environment = environment;
    }

    /** Whether the client's gateway serves attached environments. */
    public static supported(client: NexaClient): boolean {
        return (
            client.connected &&
            client.hello.features.attachedEnvironments === true &&
            [
                Method.EnvironmentsAttach,
                Method.EnvironmentsDetach,
                Method.EnvironmentsRespond,
            ].every((method: Method): boolean => client.hello.features.methods.includes(method))
        );
    }

    /**
     * Attaches an environment and starts answering its requests.
     *
     * @throws {TransportError} When the gateway does not serve attached environments.
     */
    public static async attach(
        client: NexaClient,
        definition: AttachEnvironmentParams,
        handlers: AttachedEnvironmentHandlers,
        options: AttachedEnvironmentHostOptions = {},
    ): Promise<AttachedEnvironmentHost> {
        if (!AttachedEnvironmentHost.supported(client)) {
            throw new TransportError(
                TransportErrorCode.Protocol,
                'Attached environments require an updated Nexa gateway',
            );
        }
        const environment: AttachedEnvironment = await client.call(
            Method.EnvironmentsAttach,
            definition,
        );
        const host: AttachedEnvironmentHost = new AttachedEnvironmentHost(
            client,
            definition,
            handlers,
            options,
            environment,
        );
        host.#listen();
        if (options.reattach !== false) {
            host.#unsubscribeReconnect = client.onReconnect((): void => {
                void host.#reattach();
            });
        }
        return host;
    }

    /** The environment as currently attached. */
    public get environment(): AttachedEnvironment {
        return this.#environment;
    }

    /** The id to name in a turn's `attachedEnvironments`; it changes when the client reconnects. */
    public get id(): string {
        return this.#environment.id;
    }

    /** Requests being served right now. */
    public get active(): number {
        return this.#running.size;
    }

    /** Observes each new attachment after a reconnect. Returns an unsubscribe function. */
    public onAttach(listener: (environment: AttachedEnvironment) => void): () => void {
        this.#attachListeners.add(listener);
        return (): void => {
            this.#attachListeners.delete(listener);
        };
    }

    /** Detaches the environment, cancels requests still running and waits for them to settle. Idempotent. */
    public async detach(): Promise<void> {
        if (this.#lifetime.signal.aborted) {
            await Promise.allSettled([...this.#running]);
            return;
        }
        this.#lifetime.abort();
        this.#generation.abort();
        this.#unsubscribeReconnect?.();
        AttachedEnvironmentDispatch.of(this.#client).remove(this.#environment.id);
        try {
            if (this.#client.connected) {
                await this.#client.call(Method.EnvironmentsDetach, { id: this.#environment.id });
            }
        } finally {
            await Promise.allSettled([...this.#running]);
        }
    }

    /** Detaches the environment. */
    public async [Symbol.asyncDispose](): Promise<void> {
        await this.detach();
    }

    #listen(): void {
        const generation: AbortController = this.#generation;
        AttachedEnvironmentDispatch.of(this.#client).add(
            this.#environment.id,
            (data: AttachedEnvironmentRequestData): void => {
                const work: Promise<void> = this.#serve(data, generation.signal);
                this.#running.add(work);
                void work.finally((): void => {
                    this.#running.delete(work);
                });
            },
        );
    }

    async #reattach(): Promise<void> {
        if (this.#lifetime.signal.aborted) {
            return;
        }
        AttachedEnvironmentDispatch.of(this.#client).remove(this.#environment.id);
        this.#generation.abort();
        this.#generation = new AbortController();
        try {
            this.#environment = await this.#client.call(
                Method.EnvironmentsAttach,
                this.#definition,
            );
        } catch (error: unknown) {
            this.#report(error);
            return;
        }
        if (this.#lifetime.signal.aborted) {
            return;
        }
        this.#listen();
        for (const listener of this.#attachListeners) {
            try {
                listener(this.#environment);
            } catch (error: unknown) {
                this.#report(error);
            }
        }
    }

    /** Runs one request and answers it, unless the environment ended meanwhile. */
    async #serve(data: AttachedEnvironmentRequestData, signal: AbortSignal): Promise<void> {
        const context: AttachedEnvironmentRequestContext = {
            signal,
            environment: this.#environment,
            requestId: data.requestId,
        };
        let result: AttachedEnvironmentResult;
        try {
            result = await this.#run(data.operation, context);
        } catch (error: unknown) {
            result = AttachedEnvironmentHost.#error(error);
        }
        if (signal.aborted) {
            return;
        }
        const budget: number =
            this.#options.maximumFrameBytes ?? this.#client.hello.policy.maxPayloadBytes;
        try {
            await this.#client.call(Method.EnvironmentsRespond, {
                requestId: data.requestId,
                result: AttachedEnvironmentResults.fit(result, budget),
            });
        } catch (error: unknown) {
            if (!signal.aborted) {
                this.#report(error);
            }
        }
    }

    #run(
        operation: AttachedEnvironmentOperation,
        context: AttachedEnvironmentRequestContext,
    ): Promise<AttachedEnvironmentResult> {
        switch (operation.kind) {
            case 'exec':
                return this.#handlers.exec(operation, context);
            case 'read':
                return this.#handlers.read(operation, context);
            case 'write':
                return this.#handlers.write(operation, context);
            case 'list':
                return this.#handlers.list(operation, context);
            case 'stat':
                return this.#handlers.stat(operation, context);
            case 'remove':
                return this.#handlers.remove(operation, context);
        }
    }

    #report(error: unknown): void {
        this.#options.onError?.(error instanceof Error ? error : new Error(String(error)));
    }

    static #error(error: unknown): AttachedEnvironmentErrorResult {
        return error instanceof AttachedEnvironmentFailure
            ? { kind: 'error', code: error.code, message: error.message }
            : {
                  kind: 'error',
                  code: 'failed',
                  message: error instanceof Error ? error.message : String(error),
              };
    }
}
