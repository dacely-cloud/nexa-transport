// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type {
    BrowserWebMcpPage,
    BrowserWebMcpDescriptor,
    ReverseRunSnapshot,
} from '../src/protocol/Protocol.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';

function fixture(): BrowserWebMcpPage {
    const tool: BrowserWebMcpDescriptor = {
        id: 'tool:0',
        key: 'c'.repeat(64),
        name: 'inspect',
        description: 'Page-provided description',
        frameId: 'frame',
        frameUrl: 'https://example.test/app',
        origin: 'https://example.test',
        declaration: 'imperative',
        trust: 'page-declared-untrusted',
        inputSchema: {
            rootType: 'object',
            nodeCount: '3',
            propertyCount: '2',
            maximumDepth: 2,
            complete: true,
        },
        annotations: {
            readOnly: true,
            untrustedContent: null,
            autosubmit: null,
            consequential: null,
            debugging: null,
        },
        registrationSource: { url: 'https://example.test/register.js', line: 7, column: 3 },
    };
    return {
        runId: '11111111-1111-4111-8111-111111111111',
        evidenceId: '22222222-2222-4222-8222-222222222222',
        sha256: 'a'.repeat(64),
        captureSha256: 'b'.repeat(64),
        metadata: {
            provider: 'cdp-passive',
            targetId: 'target',
            frameId: 'frame',
            url: 'https://example.test/app',
            origin: 'https://example.test',
            allowedOrigins: ['https://example.test'],
            capturedAt: '2026-10-09T00:00:00.000Z',
            observationMs: 100,
            available: true,
            complete: true,
            frameCoverageComplete: true,
            schemaCoverageComplete: true,
            toolCount: '1',
            dropped: '0',
            schemaValuesExcluded: true,
            invocationAvailable: false,
            limitations: [],
        },
        view: 'schema',
        selector: 'tool:0',
        cursor: '0',
        nextCursor: null,
        selectedTool: tool,
        tools: [],
        properties: [
            { id: 'property:0', path: '/properties', types: ['object'], observations: '1' },
            { id: 'property:1', path: '/properties/item', types: ['string'], observations: '1' },
        ],
    };
}

describe('portable passive WebMCP receipts', (): void => {
    it('accepts separate metadata, declaration and structural schema pages without transferring other representations', (): void => {
        const page: BrowserWebMcpPage = fixture();
        expect(ReverseInvestigation.webMcp(page)).toEqual(page);
        expect(
            ReverseInvestigation.webMcp({
                ...page,
                view: 'metadata',
                selector: null,
                selectedTool: null,
                properties: [],
            }).tools,
        ).toEqual([]);
        expect(
            ReverseInvestigation.webMcp({
                ...page,
                view: 'tools',
                selector: null,
                selectedTool: null,
                properties: [],
                tools: [page.selectedTool],
            }).properties,
        ).toEqual([]);
        expect((): BrowserWebMcpPage =>
            ReverseInvestigation.webMcp({ ...page, view: 'tools' }),
        ).toThrow();
    });
    it('rejects executable and value-bearing fields instead of accepting page declarations as capabilities', (): void => {
        const page: BrowserWebMcpPage = fixture();
        for (const raw of [
            { ...page, invoke: 'inspect' },
            { ...page, metadata: { ...page.metadata, invocationAvailable: true } },
            { ...page, metadata: { ...page.metadata, schemaValuesExcluded: false } },
            { ...page, selectedTool: { ...page.selectedTool, execute: 'function(){}' } },
            { ...page, selectedTool: { ...page.selectedTool, trust: 'trusted' } },
            {
                ...page,
                properties: [{ ...page.properties[0], default: 'SECRET' }, page.properties[1]],
            },
            {
                ...page,
                selectedTool: {
                    ...page.selectedTool,
                    inputSchema: { ...page.selectedTool?.inputSchema, enum: ['SECRET'] },
                },
            },
        ]) {
            expect((): BrowserWebMcpPage => ReverseInvestigation.webMcp(raw)).toThrow();
        }
    });
    it('rejects forged scope, coverage, annotation types and source locations', (): void => {
        const page: BrowserWebMcpPage = fixture();
        for (const raw of [
            { ...page, metadata: { ...page.metadata, allowedOrigins: ['https://foreign.test'] } },
            { ...page, metadata: { ...page.metadata, schemaCoverageComplete: false } },
            { ...page, metadata: { ...page.metadata, dropped: '1' } },
            {
                ...page,
                selectedTool: {
                    ...page.selectedTool,
                    origin: 'https://foreign.test',
                    frameUrl: 'https://foreign.test/app',
                },
            },
            {
                ...page,
                selectedTool: {
                    ...page.selectedTool,
                    registrationSource: { url: 'https://foreign.test/a.js', line: 1, column: 0 },
                },
            },
            {
                ...page,
                selectedTool: {
                    ...page.selectedTool,
                    annotations: { ...page.selectedTool?.annotations, readOnly: 'true' },
                },
            },
            {
                ...page,
                selectedTool: {
                    ...page.selectedTool,
                    registrationSource: { url: 'https://example.test/a.js', line: -1, column: 0 },
                },
            },
        ]) {
            expect((): BrowserWebMcpPage => ReverseInvestigation.webMcp(raw)).toThrow();
        }
    });
    it('rejects repeated ordinals, noncanonical paths, changed selectors and pages that do not advance', (): void => {
        const page: BrowserWebMcpPage = fixture();
        for (const raw of [
            { ...page, cursor: '01' },
            { ...page, cursor: '1' },
            { ...page, nextCursor: '2' },
            { ...page, properties: [] },
            { ...page, selector: 'tool:1' },
            { ...page, properties: [page.properties[0], page.properties[0]] },
            {
                ...page,
                properties: [{ ...page.properties[0], path: '/bad~2escape' }, page.properties[1]],
            },
            {
                ...page,
                properties: [{ ...page.properties[0], observations: '3' }, page.properties[1]],
            },
            {
                ...page,
                properties: [
                    { ...page.properties[0], types: ['string', 'object'] },
                    page.properties[1],
                ],
            },
        ]) {
            expect((): BrowserWebMcpPage => ReverseInvestigation.webMcp(raw)).toThrow();
        }
    });
    it('pins streamed metadata to the immutable run and conversation and rejects embedded inventory arrays', (): void => {
        const page: BrowserWebMcpPage = fixture();
        const run: ReverseRunSnapshot = {
            version: 1,
            id: page.runId,
            revision: '1',
            archive: { sessionId: 'alice::main' },
            sha256: page.sha256,
            inputName: 'WebMCP declarations',
            question: 'Inspect page declarations',
            kind: 'browser',
            state: 'done',
            tasks: [],
            evidenceCount: 0,
            evidence: [],
            cleanupErrors: [],
            browserWebMcp: {
                ...page.metadata,
                reference: {
                    sessionId: 'alice::main',
                    runId: page.runId,
                    evidenceId: page.evidenceId,
                    captureSha256: page.captureSha256,
                },
            },
        };
        expect(ReverseInvestigation.parse(run)).toEqual(run);
        for (const raw of [
            { ...run, kind: 'native' },
            { ...run, browserWebMcp: { ...run.browserWebMcp, tools: [page.selectedTool] } },
            {
                ...run,
                browserWebMcp: {
                    ...run.browserWebMcp,
                    reference: { ...run.browserWebMcp?.reference, sessionId: 'bob::main' },
                },
            },
            {
                ...run,
                browserWebMcp: {
                    ...run.browserWebMcp,
                    reference: { ...run.browserWebMcp?.reference, runId: page.evidenceId },
                },
            },
        ]) {
            expect((): ReverseRunSnapshot => ReverseInvestigation.parse(raw)).toThrow();
        }
        expect(
            ReverseInvestigation.webMcpIdentity({ ...page.metadata, frameId: 'other' }),
        ).not.toBe(ReverseInvestigation.webMcpIdentity(page.metadata));
    });
});
