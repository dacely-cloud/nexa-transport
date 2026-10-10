// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BrowserStorageComparisonValues as Value } from './BrowserStorageComparisonValues.js';
import { BrowserSchemaType, BrowserWebMcpDeclaration } from './BrowserWebMcpDefinitions.js';
import type { BrowserWebMcpMetadata, BrowserWebMcpDescriptor, BrowserSchemaSummary, BrowserSchemaProperty, BrowserWebMcpAnnotations, BrowserWebMcpSource, BrowserWebMcpSnapshot } from '../protocol/Protocol.js';
import type { BrowserWebMcpCapture, BrowserWebMcpTool } from './BrowserWebMcpDefinitions.js';
import type { ReverseBrowserReference } from '../protocol/Protocol.js';

/** Exact portable receipts preserve untrusted registration evidence without accepting executable tools or schema values. */
export class BrowserWebMcpReceipt {
    /** Progress carries only metadata and a reference to the original conversation's immutable capture. */
    public static snapshot(value: BrowserWebMcpSnapshot, runId: string, sessionId?: string): void {
        const { reference, ...metadata }: BrowserWebMcpSnapshot = value;
        this.metadata(metadata);
        const source: ReverseBrowserReference = Value.reference(reference);
        if (source.runId !== runId || source.sessionId !== sessionId) {
            throw new TypeError('WebMCP progress belongs to a foreign capture');
        }
    }
    /** Scope and explicit coverage flags are retained independently from tool/schema arrays. */
    public static metadata(raw: unknown): BrowserWebMcpMetadata {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'provider',
            'targetId',
            'frameId',
            'url',
            'origin',
            'allowedOrigins',
            'capturedAt',
            'observationMs',
            'available',
            'complete',
            'frameCoverageComplete',
            'schemaCoverageComplete',
            'toolCount',
            'dropped',
            'schemaValuesExcluded',
            'invocationAvailable',
            'limitations',
        ]);
        if (
            value.provider !== 'cdp-passive' ||
            value.schemaValuesExcluded !== true ||
            value.invocationAvailable !== false
        ) {
            throw new TypeError('Invalid passive WebMCP provider');
        }
        const origin: string = this.#origin(value.origin);
        const url: string = this.#url(value.url);
        if (
            !Array.isArray(value.allowedOrigins) ||
            value.allowedOrigins.length === 0 ||
            value.allowedOrigins.length > 32
        ) {
            throw new TypeError('Invalid WebMCP allowed origins');
        }
        const origins: readonly unknown[] = value.allowedOrigins;
        const allowedOrigins: string[] = origins.map((item: unknown): string => this.#origin(item));
        if (
            new Set(allowedOrigins).size !== allowedOrigins.length ||
            !allowedOrigins.includes(origin) ||
            new URL(url).origin !== origin
        ) {
            throw new TypeError('WebMCP target scope changed');
        }
        const available: boolean = Value.flag(value.available);
        const frameCoverageComplete: boolean = Value.flag(value.frameCoverageComplete);
        const schemaCoverageComplete: boolean = Value.flag(value.schemaCoverageComplete);
        const toolCount: string = Value.count(value.toolCount, 1000n);
        const dropped: string = Value.count(value.dropped, 40000n);
        const complete: boolean =
            available && frameCoverageComplete && schemaCoverageComplete && dropped === '0';
        if (
            Value.flag(value.complete) !== complete ||
            (!available && (toolCount !== '0' || schemaCoverageComplete))
        ) {
            throw new TypeError('WebMCP inventory coverage changed');
        }
        const capturedAt: string = Value.text(value.capturedAt, 64);
        if (
            !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(capturedAt) ||
            !Number.isFinite(Date.parse(capturedAt))
        ) {
            throw new TypeError('Invalid WebMCP capture time');
        }
        if (!Array.isArray(value.limitations) || value.limitations.length > 8) {
            throw new TypeError('Invalid WebMCP limitations');
        }
        const items: readonly unknown[] = value.limitations;
        const metadata: BrowserWebMcpMetadata = {
            provider: 'cdp-passive',
            targetId: Value.text(value.targetId, 256),
            frameId: Value.text(value.frameId, 128),
            url,
            origin,
            allowedOrigins,
            capturedAt,
            observationMs: this.#integer(value.observationMs, 10000),
            available,
            complete,
            frameCoverageComplete,
            schemaCoverageComplete,
            toolCount,
            dropped,
            schemaValuesExcluded: true,
            invocationAvailable: false,
            limitations: items.map((item: unknown): string => Value.text(item, 512)),
        };
        if (
            metadata.targetId === '' ||
            metadata.frameId === '' ||
            JSON.stringify(metadata).length > 24000
        ) {
            throw new RangeError('WebMCP metadata exceeds its budget');
        }
        return metadata;
    }
    /** Every displayed descriptor retains its exact admitted origin and excludes schema property bodies. */
    public static tool(raw: unknown, metadata: BrowserWebMcpMetadata): BrowserWebMcpDescriptor {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'id',
            'key',
            'name',
            'description',
            'frameId',
            'frameUrl',
            'origin',
            'declaration',
            'inputSchema',
            'annotations',
            'registrationSource',
            'trust',
        ]);
        const id: string = Value.text(value.id, 8);
        if (
            !/^tool:(?:0|[1-9][0-9]{0,2})$/u.test(id) ||
            BigInt(id.slice(5)) >= BigInt(metadata.toolCount) ||
            value.trust !== 'page-declared-untrusted'
        ) {
            throw new TypeError('WebMCP tool identity or trust changed');
        }
        const origin: string = this.#origin(value.origin);
        const frameUrl: string = this.#url(value.frameUrl);
        if (!metadata.allowedOrigins.includes(origin) || new URL(frameUrl).origin !== origin) {
            throw new TypeError('WebMCP tool left its admitted scope');
        }
        const annotations: Readonly<Record<string, unknown>> = Value.record(value.annotations, [
            'readOnly',
            'untrustedContent',
            'autosubmit',
            'consequential',
            'debugging',
        ]);
        const flags: BrowserWebMcpAnnotations = {
            readOnly: this.#flag(annotations.readOnly),
            untrustedContent: this.#flag(annotations.untrustedContent),
            autosubmit: this.#flag(annotations.autosubmit),
            consequential: this.#flag(annotations.consequential),
            debugging: this.#flag(annotations.debugging),
        };
        const inputSchema: BrowserSchemaSummary | null =
            value.inputSchema === null ? null : this.#schema(value.inputSchema);
        if (metadata.schemaCoverageComplete && inputSchema?.complete === false) {
            throw new TypeError('WebMCP schema coverage changed');
        }
        let registrationSource: BrowserWebMcpSource | null = null;
        if (value.registrationSource !== null) {
            const source: Readonly<Record<string, unknown>> = Value.record(
                value.registrationSource,
                ['url', 'line', 'column'],
            );
            const url: string = this.#url(source.url);
            if (!metadata.allowedOrigins.includes(new URL(url).origin)) {
                throw new TypeError('WebMCP registration source left its admitted scope');
            }
            registrationSource = {
                url,
                line: source.line === null ? null : this.#integer(source.line, 2147483647),
                column: source.column === null ? null : this.#integer(source.column, 2147483647),
            };
        }
        const name: string = Value.text(value.name, 512);
        const frameId: string = Value.text(value.frameId, 128);
        if (name === '' || frameId === '') {
            throw new TypeError('Missing WebMCP registration identity');
        }
        return {
            id,
            key: Value.sha(value.key),
            name,
            description: Value.text(value.description, 2048),
            frameId,
            frameUrl,
            origin,
            declaration: Value.selection(
                value.declaration,
                Object.values(BrowserWebMcpDeclaration),
            ),
            inputSchema,
            annotations: flags,
            registrationSource,
            trust: 'page-declared-untrusted',
        };
    }
    /** Structural rows admit pointer paths and observed types; schema literal values are never an accepted field. */
    public static property(raw: unknown): BrowserSchemaProperty {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'id',
            'path',
            'types',
            'observations',
        ]);
        const id: string = Value.text(value.id, 14);
        if (!/^property:(?:0|[1-9][0-9]{0,4})$/u.test(id) || BigInt(id.slice(9)) >= 20000n) {
            throw new TypeError('Invalid WebMCP schema ordinal');
        }
        const path: string = Value.text(value.path, 2048);
        if (
            !path.startsWith('/') ||
            /~(?![01])/u.test(path) ||
            !Array.isArray(value.types) ||
            value.types.length < 1 ||
            value.types.length > 6
        ) {
            throw new TypeError('Invalid WebMCP schema pointer or types');
        }
        const kinds: readonly unknown[] = value.types;
        const types: BrowserSchemaType[] = kinds.map((kind: unknown): BrowserSchemaType =>
            Value.selection(kind, Object.values(BrowserSchemaType)),
        );
        if (
            new Set(types).size !== types.length ||
            JSON.stringify(types) !== JSON.stringify([...types].sort())
        ) {
            throw new TypeError('WebMCP schema types are not canonical');
        }
        const observations: string = Value.count(value.observations, 20000n);
        if (observations === '0') {
            throw new TypeError('Empty schema property observation');
        }
        return { id, path, types, observations };
    }
    /** Publication validates the whole bounded original, including consecutive tools and unique registrations. */
    public static capture(raw: unknown): BrowserWebMcpCapture {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, ['metadata', 'tools']);
        const metadata: BrowserWebMcpMetadata = this.metadata(value.metadata);
        if (!Array.isArray(value.tools) || value.tools.length !== Number(metadata.toolCount)) {
            throw new TypeError('WebMCP retained tool count changed');
        }
        const items: readonly unknown[] = value.tools;
        const keys: Set<string> = new Set<string>();
        let propertyCount: number = 0;
        const tools: BrowserWebMcpTool[] = items.map(
            (item: unknown, index: number): BrowserWebMcpTool => {
                const record: Readonly<Record<string, unknown>> = Value.record(item, [
                    'id',
                    'key',
                    'name',
                    'description',
                    'frameId',
                    'frameUrl',
                    'origin',
                    'declaration',
                    'inputSchema',
                    'annotations',
                    'registrationSource',
                    'trust',
                    'properties',
                ]);
                const {
                    properties: rawProperties,
                    ...descriptor
                }: Readonly<Record<string, unknown>> = record;
                const tool: BrowserWebMcpDescriptor = this.tool(descriptor, metadata);
                if (
                    tool.id !== 'tool:' + String(index) ||
                    keys.has(tool.key) ||
                    !Array.isArray(rawProperties)
                ) {
                    throw new TypeError('WebMCP original registration identity changed');
                }
                keys.add(tool.key);
                const entries: readonly unknown[] = rawProperties;
                const properties: BrowserSchemaProperty[] = entries.map(
                    (property: unknown): BrowserSchemaProperty => this.property(property),
                );
                propertyCount += properties.length;
                if (
                    propertyCount > 40000 ||
                    properties.length !== Number(tool.inputSchema?.propertyCount ?? '0')
                ) {
                    throw new RangeError('WebMCP schema inventory exceeds its budget');
                }
                let observations: bigint = 0n;
                for (let ordinal: number = 0; ordinal < properties.length; ordinal++) {
                    const property: BrowserSchemaProperty | undefined = properties[ordinal];
                    if (property === undefined || property.id !== 'property:' + String(ordinal)) {
                        throw new TypeError('WebMCP schema ordinal changed');
                    }
                    observations += BigInt(property.observations);
                    if (
                        tool.inputSchema === null ||
                        property.path.split('/').length - 1 > tool.inputSchema.maximumDepth
                    ) {
                        throw new TypeError('WebMCP schema depth changed');
                    }
                }
                if (
                    tool.inputSchema !== null &&
                    (observations >= BigInt(tool.inputSchema.nodeCount) ||
                        (tool.inputSchema.complete &&
                            observations + 1n !== BigInt(tool.inputSchema.nodeCount)))
                ) {
                    throw new TypeError('WebMCP schema node observations changed');
                }
                for (let ordinal: number = 1; ordinal < properties.length; ordinal++) {
                    const before: BrowserSchemaProperty | undefined = properties[ordinal - 1];
                    const after: BrowserSchemaProperty | undefined = properties[ordinal];
                    if (before === undefined || after === undefined || before.path >= after.path) {
                        throw new TypeError('WebMCP schema paths are not canonical');
                    }
                }
                return { ...tool, properties };
            },
        );
        if (
            metadata.schemaCoverageComplete !==
            (metadata.available &&
                tools.every(
                    (tool: BrowserWebMcpTool): boolean => tool.inputSchema?.complete !== false,
                ))
        ) {
            throw new TypeError('WebMCP schema completeness changed');
        }
        if (new TextEncoder().encode(JSON.stringify(raw)).length > 4194304) {
            throw new RangeError('WebMCP original exceeds 4 MiB');
        }
        return { metadata, tools };
    }
    /** Canonical headers keep every origin and coverage field pinned across representation changes. */
    public static identity(metadata: BrowserWebMcpMetadata): string {
        return JSON.stringify(this.metadata(metadata));
    }
    static #schema(raw: unknown): BrowserSchemaSummary {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'rootType',
            'nodeCount',
            'maximumDepth',
            'propertyCount',
            'complete',
        ]);
        const nodeCount: string = Value.count(value.nodeCount, 20000n);
        const propertyCount: string = Value.count(value.propertyCount, 20000n);
        const maximumDepth: number = this.#integer(value.maximumDepth, 64);
        if (
            value.rootType !== BrowserSchemaType.Object ||
            nodeCount === '0' ||
            BigInt(propertyCount) >= BigInt(nodeCount) ||
            maximumDepth >= Number(nodeCount)
        ) {
            throw new TypeError('Invalid WebMCP schema structure');
        }
        return {
            rootType: BrowserSchemaType.Object,
            nodeCount,
            maximumDepth,
            propertyCount,
            complete: Value.flag(value.complete),
        };
    }
    static #flag(raw: unknown): boolean | null {
        return raw === null ? null : Value.flag(raw);
    }
    static #integer(raw: unknown, maximum: number): number {
        if (typeof raw !== 'number' || !Number.isSafeInteger(raw) || raw < 0 || raw > maximum) {
            throw new TypeError('Invalid WebMCP integer');
        }
        return raw;
    }
    static #url(raw: unknown): string {
        const value: string = Value.text(raw, 4096);
        const url: URL = new URL(value);
        if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.username !== '' ||
            url.password !== '' ||
            url.href !== value
        ) {
            throw new TypeError('Invalid WebMCP URL');
        }
        return value;
    }
    static #origin(raw: unknown): string {
        const value: string = Value.text(raw, 4096);
        if (new URL(this.#url(value + '/')).origin !== value) {
            throw new TypeError('Invalid WebMCP origin');
        }
        return value;
    }
}
