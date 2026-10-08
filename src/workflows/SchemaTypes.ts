// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/** Wire types are explicit; decimal integers never masquerade as floating point numbers. */
export const SchemaKind = {
    Text: 'text',
    Number: 'number',
    Integer: 'integer',
    Boolean: 'boolean',
    Timestamp: 'timestamp',
    Datetime: 'datetime',
    Json: 'json',
    Object: 'object',
    List: 'list',
    File: 'file',
    Image: 'image',
    Audio: 'audio',
    Video: 'video',
    Message: 'message',
    Table: 'table',
    Resource: 'resource',
    Flow: 'flow',
} as const;
export type SchemaKind = (typeof SchemaKind)[keyof typeof SchemaKind];

/** Nullable means an explicit null; absence is governed separately by the owning field/port. */
export interface SchemaBase {
    readonly nullable: boolean;
}
/** Primitive or named envelope type. Number values must be finite and safely represented. */
export interface ScalarSchema extends SchemaBase {
    readonly kind: Exclude<
        SchemaKind,
        typeof SchemaKind.Object | typeof SchemaKind.List | typeof SchemaKind.Resource
    >;
    readonly choices?: readonly string[];
    readonly minimum?: number;
    readonly maximum?: number;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly whole?: boolean;
}
/** Named nested field contracts keep missing, null and empty values distinct. */
export interface SchemaField {
    readonly name: string;
    readonly required: boolean;
    readonly schema: ValueSchema;
}
/** Closed objects reject accidental fields, while open objects retain extension data. */
export interface ObjectSchema extends SchemaBase {
    readonly kind: typeof SchemaKind.Object;
    readonly fields: readonly SchemaField[];
    readonly additional: boolean;
}
/** A list is a finalized collection; it is not a stream. */
export interface ListSchema extends SchemaBase {
    readonly kind: typeof SchemaKind.List;
    readonly item: ValueSchema;
    readonly minItems: number;
    readonly maxItems: number;
}
/** Resource roles are nominal identities, not implicit runtime permissions. */
export interface ResourceSchema extends SchemaBase {
    readonly kind: typeof SchemaKind.Resource;
    readonly role: string;
}
/** Declarative portable schema subset. No callbacks, JavaScript evaluation, or credentials. */
export type ValueSchema = ScalarSchema | ObjectSchema | ListSchema | ResourceSchema;

/** A bounded diagnostic path points at the original input rather than a coerced value. */
export interface SchemaProblem {
    readonly path: string;
    readonly message: string;
}

/** Managed artifacts carry references and bounded previews, never an inline binary payload. */
export interface WorkflowArtifact {
    readonly artifactId: string;
    readonly name: string;
    readonly contentType: string;
    readonly bytes: string;
}
/** Resource references name a versioned configuration; execution must resolve authorization. */
export interface WorkflowResourceReference {
    readonly resourceId: string;
    readonly version: string;
    readonly role: string;
}
/** Shared message envelope for source, reply and delivery correlation. */
export interface WorkflowMessage {
    readonly id: string;
    readonly service: string;
    readonly conversationId: string;
    readonly senderId: string;
    readonly receivedAtMs: string;
    readonly text: string;
    readonly attachments: readonly WorkflowArtifact[];
}
/** Full tabular data stays in managed storage; consumers load bounded pages. */
export interface WorkflowTable {
    readonly artifactId: string;
    readonly rowCount: string;
    readonly columns: readonly string[];
}
