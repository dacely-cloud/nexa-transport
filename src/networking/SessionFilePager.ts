// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { SessionFileListParams, SessionFilePage } from '../protocol/Protocol.js';
import type { CallOptions } from '../interface/ClientOptions.js';
import { TransportError, TransportErrorCode } from './TransportError.js';

/** A borrowed typed request; the pager does not own a socket or retained directory cache. */
type FilePageRequest = (
    params: SessionFileListParams,
    options: CallOptions,
) => Promise<SessionFilePage>;

/** Portable bounded page consumption with source-epoch and forward-progress checks. */
export class SessionFilePager {
    static readonly #uuid: RegExp =
        /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u;
    readonly #request: FilePageRequest;

    /** Uses the caller's actual authenticated, cancellable RPC boundary. */
    public constructor(request: FilePageRequest) {
        this.#request = request;
        Object.freeze(this);
    }

    /** Yields only one validated page at a time; stopping the iterator issues no later requests. */
    public async *pages(
        id: string,
        options: CallOptions = {},
    ): AsyncGenerator<SessionFilePage['files'], void> {
        if (id.length === 0 || id.length > 1024) {
            throw new RangeError('Invalid conversation');
        }
        let cursor: string | undefined;
        let revision: string | undefined;
        let after: string = '';
        while (true) {
            options.signal?.throwIfAborted();
            const page: SessionFilePage = await this.#request(
                { id, limit: 128, ...(cursor === undefined ? {} : { cursor }) },
                options,
            );
            options.signal?.throwIfAborted();
            if (
                page.files.length > 128 ||
                page.revision.length !== 36 ||
                !SessionFilePager.#uuid.test(page.revision) ||
                (revision !== undefined && revision !== page.revision) ||
                new TextEncoder().encode(JSON.stringify(page)).byteLength > 512 * 1024
            ) {
                throw SessionFilePager.#invalid();
            }
            revision = page.revision;
            let file: SessionFilePage['files'][number];
            for (file of page.files) {
                if (
                    file.id.length !== 36 ||
                    !SessionFilePager.#uuid.test(file.id) ||
                    file.id <= after
                ) {
                    throw SessionFilePager.#invalid();
                }
                after = file.id;
            }
            if (
                page.nextCursor !== null &&
                (page.files.length === 0 || page.nextCursor !== revision + '.' + after)
            ) {
                throw SessionFilePager.#invalid();
            }
            yield page.files;
            options.signal?.throwIfAborted();
            if (page.nextCursor === null) {
                return;
            }
            cursor = page.nextCursor;
        }
    }

    /** Materializes metadata only when the consumer explicitly requests a complete array. */
    public async read(id: string, options: CallOptions = {}): Promise<SessionFilePage['files']> {
        for (let attempt: number = 0; attempt < 3; attempt += 1) {
            const files: SessionFilePage['files'][number][] = [];
            try {
                let page: SessionFilePage['files'];
                for await (page of this.pages(id, options)) {
                    files.push(...page);
                }
                return files;
            } catch (error: unknown) {
                if (
                    attempt === 2 ||
                    !(error instanceof TransportError) ||
                    error.remote?.code !== 'invalid-request' ||
                    error.remote.details?.['kind'] !== 'saved-file-list-changed'
                ) {
                    throw error;
                }
                options.signal?.throwIfAborted();
            }
        }
        throw SessionFilePager.#invalid();
    }

    static #invalid(): TransportError {
        return new TransportError(
            TransportErrorCode.Protocol,
            'Invalid saved file page or source revision',
        );
    }
}
