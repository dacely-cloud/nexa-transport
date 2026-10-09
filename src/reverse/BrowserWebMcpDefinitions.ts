// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    BrowserWebMcpMetadata,
    BrowserWebMcpDescriptor,
    BrowserSchemaProperty,
} from '../protocol/Protocol.js';

/** Native passive WebMCP enumeration. */
export const BrowserSchemaType = {
    Object: 'object',
    Array: 'array',
    String: 'string',
    Number: 'number',
    Boolean: 'boolean',
    Null: 'null',
} as const;
/** Native passive WebMCP selection type. */
export type BrowserSchemaType = (typeof BrowserSchemaType)[keyof typeof BrowserSchemaType];

/** Native passive WebMCP enumeration. */
export const BrowserWebMcpDeclaration = {
    Declarative: 'declarative',
    Imperative: 'imperative',
} as const;
/** Native passive WebMCP selection type. */
export type BrowserWebMcpDeclaration =
    (typeof BrowserWebMcpDeclaration)[keyof typeof BrowserWebMcpDeclaration];

/** Native passive WebMCP enumeration. */
export const BrowserWebMcpView = {
    Metadata: 'metadata',
    Tools: 'tools',
    Schema: 'schema',
} as const;
/** Native passive WebMCP selection type. */
export type BrowserWebMcpView = (typeof BrowserWebMcpView)[keyof typeof BrowserWebMcpView];

/** Host-only originals are separate from bounded wire pages. */
export interface BrowserWebMcpTool extends BrowserWebMcpDescriptor {
    readonly properties: readonly BrowserSchemaProperty[];
}

/** Complete captures are validated without publishing their arrays in progress. */
export interface BrowserWebMcpCapture {
    readonly metadata: BrowserWebMcpMetadata;
    readonly tools: readonly BrowserWebMcpTool[];
}
