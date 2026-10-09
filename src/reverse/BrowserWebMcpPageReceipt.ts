// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BrowserStorageComparisonValues as Value } from './BrowserStorageComparisonValues.js';
import { BrowserWebMcpReceipt } from './BrowserWebMcpReceipt.js';
import { BrowserWebMcpView } from './BrowserWebMcpDefinitions.js';
import type { BrowserWebMcpPage } from '../protocol/Protocol.js';
import type {
    BrowserWebMcpMetadata,
    BrowserWebMcpDescriptor,
    BrowserSchemaProperty,
} from '../protocol/Protocol.js';

/** Portable saved pages are pinned to one representation with bounded consecutive retained ordinals. */
export class BrowserWebMcpPageReceipt {
    /** Header reads contain no arrays; tool and schema selections cannot accidentally return one another. */
    public static read(raw: unknown): BrowserWebMcpPage {
        const value: Readonly<Record<string, unknown>> = Value.record(raw, [
            'runId',
            'sha256',
            'evidenceId',
            'captureSha256',
            'metadata',
            'view',
            'selector',
            'cursor',
            'nextCursor',
            'selectedTool',
            'tools',
            'properties',
        ]);
        const metadata: BrowserWebMcpMetadata = BrowserWebMcpReceipt.metadata(value.metadata);
        const view: BrowserWebMcpView = Value.selection(
            value.view,
            Object.values(BrowserWebMcpView),
        );
        const selector: string | null =
            value.selector === null ? null : Value.text(value.selector, 8);
        const cursor: string = Value.count(value.cursor, 20000n);
        const nextCursor: string | null =
            value.nextCursor === null ? null : Value.count(value.nextCursor, 20000n);
        if (
            !Array.isArray(value.tools) ||
            value.tools.length > 20 ||
            !Array.isArray(value.properties) ||
            value.properties.length > 20 ||
            JSON.stringify(raw).length > 96000
        ) {
            throw new RangeError('WebMCP page exceeds its transfer budget');
        }
        const toolItems: readonly unknown[] = value.tools;
        const propertyItems: readonly unknown[] = value.properties;
        const tools: BrowserWebMcpDescriptor[] = toolItems.map(
            (tool: unknown): BrowserWebMcpDescriptor => BrowserWebMcpReceipt.tool(tool, metadata),
        );
        const properties: BrowserSchemaProperty[] = propertyItems.map(
            (property: unknown): BrowserSchemaProperty => BrowserWebMcpReceipt.property(property),
        );
        const selectedTool: BrowserWebMcpDescriptor | null =
            value.selectedTool === null
                ? null
                : BrowserWebMcpReceipt.tool(value.selectedTool, metadata);
        if (view === BrowserWebMcpView.Metadata) {
            if (
                selector !== null ||
                selectedTool !== null ||
                tools.length !== 0 ||
                properties.length !== 0 ||
                cursor !== '0' ||
                nextCursor !== null
            ) {
                throw new TypeError('WebMCP metadata contains detail rows');
            }
        } else {
            const count: number =
                view === BrowserWebMcpView.Tools ? tools.length : properties.length;
            const total: bigint = BigInt(
                view === BrowserWebMcpView.Tools
                    ? metadata.toolCount
                    : (selectedTool?.inputSchema?.propertyCount ?? '0'),
            );
            const end: bigint = BigInt(cursor) + BigInt(count);
            if (
                end > total ||
                nextCursor !== (end < total ? end.toString() : null) ||
                (end < total && count === 0)
            ) {
                throw new TypeError('WebMCP page did not advance');
            }
            if (view === BrowserWebMcpView.Tools) {
                if (selector !== null || selectedTool !== null || properties.length !== 0) {
                    throw new TypeError('WebMCP tool directory contains schema rows');
                }
                for (let index: number = 0; index < tools.length; index++) {
                    if (
                        tools[index]?.id !==
                        'tool:' + (BigInt(cursor) + BigInt(index)).toString()
                    ) {
                        throw new TypeError('WebMCP tool page ordinal changed');
                    }
                }
            } else {
                if (selectedTool === null || selectedTool.id !== selector || tools.length !== 0) {
                    throw new TypeError('WebMCP schema selection changed');
                }
                for (let index: number = 0; index < properties.length; index++) {
                    const property: BrowserSchemaProperty | undefined = properties[index];
                    if (
                        property === undefined ||
                        property.id !== 'property:' + (BigInt(cursor) + BigInt(index)).toString() ||
                        selectedTool.inputSchema === null ||
                        BigInt(property.observations) >=
                            BigInt(selectedTool.inputSchema.nodeCount) ||
                        property.path.split('/').length - 1 > selectedTool.inputSchema.maximumDepth
                    ) {
                        throw new TypeError('WebMCP schema page ordinal or structure changed');
                    }
                    const previous: BrowserSchemaProperty | undefined = properties[index - 1];
                    if (previous !== undefined && previous.path >= property.path) {
                        throw new TypeError('WebMCP schema page path order changed');
                    }
                }
            }
        }
        return {
            runId: Value.uuid(value.runId),
            sha256: Value.sha(value.sha256),
            evidenceId: Value.uuid(value.evidenceId),
            captureSha256: Value.sha(value.captureSha256),
            metadata,
            view,
            selector,
            cursor,
            nextCursor,
            selectedTool,
            tools,
            properties,
        };
    }
}
