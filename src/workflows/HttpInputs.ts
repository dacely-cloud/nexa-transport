// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowJson } from './WorkflowJson.js';
import type { WorkflowObject, WorkflowValue } from './WorkflowTypes.js';

/** Methods supported by the API component. Requests are never automatically retried. */
export const WorkflowHttpMethod = {
    Get: 'GET',
    Head: 'HEAD',
    Post: 'POST',
    Put: 'PUT',
    Patch: 'PATCH',
    Delete: 'DELETE',
    Options: 'OPTIONS',
} as const;
/** Supported method. */
export type WorkflowHttpMethod = (typeof WorkflowHttpMethod)[keyof typeof WorkflowHttpMethod];
/** Auto follows Content-Type, JSON enforces JSON, and text preserves the response text. */
export const WorkflowHttpFormat = { Auto: 'auto', Json: 'json', Text: 'text' } as const;
/** Response decoding choice. */
export type WorkflowHttpFormat = (typeof WorkflowHttpFormat)[keyof typeof WorkflowHttpFormat];
/** Validated request before entering the server-only transport. */
export interface WorkflowHttpRequest {
    readonly url: URL;
    readonly method: WorkflowHttpMethod;
    readonly headers: Readonly<Record<string, string>>;
    readonly body: string | null;
    readonly responseFormat: WorkflowHttpFormat;
    readonly timeoutMs: number;
    readonly maxResponseBytes: number;
    readonly followRedirects: boolean;
}
/** Portable checks never resolve DNS or expose proxy configuration to the browser. */
export class WorkflowHttpInputs {
    /** Validates resolved wire inputs and authored request settings. */
    public static parse(
        configuration: WorkflowObject,
        inputs: WorkflowObject,
    ): WorkflowHttpRequest {
        const raw: WorkflowValue | undefined = inputs['url'];
        if (typeof raw !== 'string' || raw.length > 8192) {
            throw new Error('Provide an absolute HTTP or HTTPS URL');
        }
        let url: URL;
        try {
            url = new URL(raw);
        } catch {
            throw new Error('Provide an absolute HTTP or HTTPS URL');
        }
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.username !== '' ||
            url.password !== '' ||
            url.hash !== ''
        ) {
            throw new Error('Use an HTTP or HTTPS URL without embedded credentials or a fragment');
        }
        const method: WorkflowValue | undefined = configuration['method'];
        if (!this.#method(method)) {
            throw new Error('Choose a supported HTTP method');
        }
        const responseFormat: WorkflowValue | undefined = configuration['responseFormat'];
        if (!this.#format(responseFormat)) {
            throw new Error('Choose auto, JSON or text response format');
        }
        const headers: Record<string, string> = this.headers(inputs['headers'] ?? {});
        const value: WorkflowValue | undefined = inputs['body'];
        const body: string | null =
            value === undefined ? null : typeof value === 'string' ? value : JSON.stringify(value);
        if (body !== null && (method === 'GET' || method === 'HEAD')) {
            throw new Error('GET and HEAD requests cannot have a request body');
        }
        if (body !== null && new TextEncoder().encode(body).byteLength > 262144) {
            throw new Error('Request body exceeds 256 KiB');
        }
        if (
            value !== undefined &&
            typeof value !== 'string' &&
            headers['content-type'] === undefined
        ) {
            headers['content-type'] = 'application/json';
        }
        if (typeof configuration['followRedirects'] !== 'boolean') {
            throw new Error('Choose whether to follow redirects');
        }
        return {
            url,
            method,
            headers,
            body,
            responseFormat,
            timeoutMs: this.#bound(configuration['timeoutMs'], 1000, 60000, 'Request timeout'),
            maxResponseBytes: this.#bound(
                configuration['maxResponseBytes'],
                1024,
                1048576,
                'Response size limit',
            ),
            followRedirects: configuration['followRedirects'],
        };
    }
    /** Header names and values are bounded and cannot control the proxy or socket. */
    public static headers(value: WorkflowValue): Record<string, string> {
        const source: WorkflowObject = WorkflowJson.object(value);
        const result: Record<string, string> = {};
        let length: number = 0;
        if (Object.keys(source).length > 64) {
            throw new Error('Use at most 64 request headers');
        }
        for (const [name, entry] of Object.entries(source)) {
            const key: string = name.toLowerCase();
            if (
                !/^[!#$%&'*+.^_`|~0-9a-z-]+$/u.test(key) ||
                [
                    'host',
                    'connection',
                    'content-length',
                    'transfer-encoding',
                    'upgrade',
                    'trailer',
                    'te',
                    'expect',
                    'accept-encoding',
                ].includes(key) ||
                key.startsWith('proxy-')
            ) {
                throw new Error('A request header name is invalid or reserved for the transport');
            }
            if (
                typeof entry !== 'string' ||
                /[^\t\x20-\x7e\x80-\xff]/u.test(entry) ||
                Object.hasOwn(result, key)
            ) {
                throw new Error('Use unique header names with single-line text values');
            }
            length += key.length + entry.length;
            if (length > 16384) {
                throw new Error('Request headers exceed 16 KiB');
            }
            result[key] = entry;
        }
        return result;
    }
    static #method(value: WorkflowValue | undefined): value is WorkflowHttpMethod {
        return (
            typeof value === 'string' &&
            Object.values(WorkflowHttpMethod).some((entry: string): boolean => entry === value)
        );
    }
    static #format(value: WorkflowValue | undefined): value is WorkflowHttpFormat {
        return (
            typeof value === 'string' &&
            Object.values(WorkflowHttpFormat).some((entry: string): boolean => entry === value)
        );
    }
    static #bound(
        value: WorkflowValue | undefined,
        minimum: number,
        maximum: number,
        label: string,
    ): number {
        if (typeof value !== 'string' || !/^[0-9]{1,8}$/u.test(value)) {
            throw new Error(`${label} must be a whole decimal`);
        }
        const count: number = Number(value);
        if (count < minimum || count > maximum) {
            throw new Error(`${label} is outside supported bounds`);
        }
        return count;
    }
}
