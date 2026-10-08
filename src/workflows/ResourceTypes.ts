// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** External resource identity; these families never confer access themselves. */
export const ResourceFamily = {
    Workspace: 'workspace',
    Computer: 'computer',
    Application: 'application',
    Database: 'database',
    Files: 'files',
    Feed: 'feed',
    Compute: 'compute',
} as const;
/** Supported external resource families, distinct from account tenancy. */
export type ResourceFamily = (typeof ResourceFamily)[keyof typeof ResourceFamily];

/** Attaching access, reading data, and placing computation are different operations. */
export const ResourceUse = { Attach: 'attach', Read: 'read', Compute: 'compute' } as const;
/** Meaning of a resource binding in the graph. */
export type ResourceUse = (typeof ResourceUse)[keyof typeof ResourceUse];

/** Readiness is orthogonal to visual identity and data freshness. */
export const ResourceState = {
    Ready: 'ready',
    Unconfigured: 'unconfigured',
    Disconnected: 'disconnected',
    Unauthorized: 'unauthorized',
    Unavailable: 'unavailable',
    Mock: 'mock',
} as const;
/** Current connector state from an authorized adapter. */
export type ResourceState = (typeof ResourceState)[keyof typeof ResourceState];

/** An exact dataset/endpoint selection; paths never act as implicit permission prefixes. */
export interface ResourceSelection {
    readonly resourceId: string;
    readonly connectionId: string;
    readonly connectorId: string;
    readonly connectorVersion: string;
    readonly targetId: string;
}

/** Bounded read or job outputs, not a grant to ingest a whole source. */
export interface ResourceLimits {
    readonly maxItems: number;
    /** Unsigned canonical decimal, lossless on the JSON wire. */
    readonly maxBytes: string;
}

/** Saved requirement, including incomplete drafts. Never stores credentials or telemetry. */
export interface ResourceBinding {
    readonly version: 1;
    readonly id: string;
    readonly alias: string;
    readonly family: ResourceFamily;
    readonly use: ResourceUse;
    /** Stable node/group identity controls which agent or step receives access. */
    readonly consumerId: string;
    readonly selection: ResourceSelection | null;
    readonly operations: readonly string[];
    readonly limits: ResourceLimits;
    /** Null allows unknown freshness. Otherwise runtime requires a fresh observed source time. */
    readonly maxAgeMs: string | null;
}

/** One operation actually exposed by an adapter for an exact target. */
export interface ResourceCapability {
    readonly operation: string;
    readonly uses: readonly ResourceUse[];
    readonly inputSchemaRef: string;
    readonly outputSchemaRef: string;
    readonly limits: ResourceLimits;
}

/** Metadata projection supplied after server authorization, never by a workflow author. */
export interface ResourceDescriptor extends ResourceSelection {
    readonly family: ResourceFamily;
    readonly name: string;
    readonly state: ResourceState;
    readonly capabilities: readonly ResourceCapability[];
    /** Source observation time, independent of connection heartbeat; null means unknown. */
    readonly observedAtMs: string | null;
}

/** The selected mode never silently promotes a simulated binding into a live operation. */
export const ResourceMode = { Live: 'live', Mock: 'mock' } as const;
/** Mode for one explicit resource readiness check. */
export type ResourceMode = (typeof ResourceMode)[keyof typeof ResourceMode];

/** Actionable blocking reasons usable in the planner, inspector, and run view. */
export const ResourceIssue = {
    Setup: 'setup',
    Missing: 'missing',
    Unauthorized: 'unauthorized',
    Disconnected: 'disconnected',
    Unavailable: 'unavailable',
    Mock: 'mock',
    FixtureRequired: 'fixture-required',
    Identity: 'identity',
    Version: 'version',
    Capability: 'capability',
    Limit: 'limit',
    FreshnessUnknown: 'freshness-unknown',
    Stale: 'stale',
} as const;
/** Machine-readable resource readiness issue. */
export type ResourceIssue = (typeof ResourceIssue)[keyof typeof ResourceIssue];

/** Ready only for the checked mode; execution must reauthorize each real operation. */
export interface ResourceReady {
    readonly ready: true;
    readonly mode: ResourceMode;
    readonly bindingId: string;
}
/** An incomplete binding is still valid draft content. */
export interface ResourceBlocked {
    readonly ready: false;
    readonly mode: ResourceMode;
    readonly bindingId: string;
    readonly issue: ResourceIssue;
    readonly message: string;
}
/** Validation result, never an execution credential. */
export type ResourceReadiness = ResourceReady | ResourceBlocked;
