// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    DesignDocument,
    DesignNode,
    DesignPage,
    DesignToken,
    DesignInteraction,
    DesignComment,
} from './DesignTypes.js';
import type {
    DesignChangeSet,
    DesignEntityChange,
    DesignMetadataState,
} from './DesignOperationTypes.js';
import {
    DesignRecordKind as Kind,
    type DesignRecord,
    type DesignCursor,
    type DesignRecordPage,
    type DesignSummary,
    type DesignRecordFragment,
} from './DesignRequests.js';
import { DesignEntityChanges as Entity } from './DesignEntityChanges.js';
import { DesignPaging, type DesignPageLimits } from './DesignPaging.js';
import { DesignValues } from './DesignValues.js';

/** Deterministic record ordering and transport pages are portable across gateway and client. */
export class DesignRecords {
    /** Projects authored content into independently addressable entities. */
    public static document(document: DesignDocument): readonly DesignRecord[] {
        return [
            ...document.pages.map((value: DesignPage): DesignRecord => ({
                kind: Kind.Page,
                id: value.id,
                value,
            })),
            ...document.nodes.map((value: DesignNode): DesignRecord => ({
                kind: Kind.Node,
                id: value.id,
                value,
            })),
            ...document.tokens.map((value: DesignToken): DesignRecord => ({
                kind: Kind.Token,
                id: value.id,
                value,
            })),
            ...document.interactions.map((value: DesignInteraction): DesignRecord => ({
                kind: Kind.Interaction,
                id: value.id,
                value,
            })),
            ...document.comments.map((value: DesignComment): DesignRecord => ({
                kind: Kind.Comment,
                id: value.id,
                value,
            })),
        ];
    }
    /** Sends only final changed entities. Undo preimages remain on the server. */
    public static changes(changes: DesignChangeSet): readonly DesignRecord[] {
        const metadata: DesignEntityChange<DesignMetadataState> | null = changes.metadata;
        return [
            ...changes.pages.map((entry: DesignEntityChange<DesignPage>): DesignRecord => ({
                kind: Kind.Page,
                id: entry.id,
                value: entry.after,
            })),
            ...changes.nodes.map((entry: DesignEntityChange<DesignNode>): DesignRecord => ({
                kind: Kind.Node,
                id: entry.id,
                value: entry.after,
            })),
            ...Entity.diff(metadata?.before?.tokens ?? [], metadata?.after?.tokens ?? []).map(
                (entry: DesignEntityChange<DesignToken>): DesignRecord => ({
                    kind: Kind.Token,
                    id: entry.id,
                    value: entry.after,
                }),
            ),
            ...Entity.diff(
                metadata?.before?.interactions ?? [],
                metadata?.after?.interactions ?? [],
            ).map((entry: DesignEntityChange<DesignInteraction>): DesignRecord => ({
                kind: Kind.Interaction,
                id: entry.id,
                value: entry.after,
            })),
            ...Entity.diff(metadata?.before?.comments ?? [], metadata?.after?.comments ?? []).map(
                (entry: DesignEntityChange<DesignComment>): DesignRecord => ({
                    kind: Kind.Comment,
                    id: entry.id,
                    value: entry.after,
                }),
            ),
        ];
    }
    /** Caps each wire page at 256 KiB, splitting large records without truncating content. */
    public static page(
        records: readonly DesignRecord[],
        summary: DesignSummary,
        cursor: DesignCursor | null,
        limit: number,
        limits: DesignPageLimits = DesignPaging.Web,
    ): DesignRecordPage {
        const start: number = DesignValues.number(cursor?.record ?? 0, 0, records.length, true);
        const character: number = DesignValues.number(
            cursor?.character ?? 0,
            0,
            32 * 1024 * 1024,
            true,
        );
        DesignValues.number(limit, 1, 128, true);
        const output: DesignRecord[] = [];
        let bytes: number = 4096;
        for (let index: number = start; index < records.length && output.length < limit; index++) {
            const record: DesignRecord | undefined = records[index];
            if (record === undefined) {
                throw new Error('Invalid design page position');
            }
            const encoded: string = JSON.stringify(record);
            const size: number = new TextEncoder().encode(encoded).byteLength;
            const offset: number = index === start ? character : 0;
            if (size + 4096 > limits.recordBudget || offset > 0) {
                if (offset >= encoded.length) {
                    throw new Error('Design fragment cursor is outside its record');
                }
                let end: number = Math.min(encoded.length, offset + limits.fragmentCharacters);
                const last: number = encoded.charCodeAt(end - 1);
                if (end < encoded.length && last >= 0xd800 && last <= 0xdbff) {
                    end--;
                }
                const fragment: DesignRecordFragment = {
                    kind: record.kind,
                    id: record.id,
                    offset,
                    total: encoded.length,
                    text: encoded.slice(offset, end),
                };
                return {
                    summary,
                    records: output,
                    fragment,
                    nextCursor:
                        end < encoded.length
                            ? { record: index, character: end }
                            : index + 1 < records.length
                              ? { record: index + 1, character: 0 }
                              : null,
                };
            }
            if (bytes + size > limits.recordBudget) {
                return {
                    summary,
                    records: output,
                    fragment: null,
                    nextCursor: { record: index, character: 0 },
                };
            }
            output.push(record);
            bytes += size + 1;
        }
        if (start === records.length && character !== 0) {
            throw new Error('Unexpected design fragment cursor');
        }
        const next: number = start + output.length;
        return {
            summary,
            records: output,
            fragment: null,
            nextCursor: next < records.length ? { record: next, character: 0 } : null,
        };
    }
}
