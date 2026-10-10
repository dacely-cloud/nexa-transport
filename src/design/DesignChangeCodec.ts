// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignCodec } from './DesignCodec.js';
import { DesignNodeCodec } from './DesignNodeCodec.js';
import type {
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

interface Identity {
    readonly id: string;
}

/** Durable undo data is validated independently of the document it will be applied to. */
export class DesignChangeCodec {
    /** Parses exact before/after records and rejects duplicate targets or identity substitution. */
    public static changes(raw: unknown): DesignChangeSet {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'nodes',
            'pages',
            'metadata',
        ]);
        return {
            nodes: this.#list(value['nodes'], (entry: unknown): DesignNode =>
                DesignNodeCodec.node(entry),
            ),
            pages: this.#list(value['pages'], (entry: unknown): DesignPage =>
                DesignCodec.page(entry),
            ),
            metadata:
                value['metadata'] === null
                    ? null
                    : this.#entry(value['metadata'], (entry: unknown): DesignMetadataState =>
                          this.#metadata(entry),
                      ),
        };
    }
    static #metadata(raw: unknown): DesignMetadataState {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'name',
            'tokens',
            'interactions',
            'comments',
        ]);
        return {
            name: V.text(value['name']),
            tokens: V.list(value['tokens'], 4096, (entry: unknown): DesignToken =>
                DesignCodec.token(entry),
            ),
            interactions: V.list(
                value['interactions'],
                10000,
                (entry: unknown): DesignInteraction => DesignCodec.interaction(entry),
            ),
            comments: V.list(value['comments'], 10000, (entry: unknown): DesignComment =>
                DesignCodec.comment(entry),
            ),
        };
    }
    static #entry<T>(raw: unknown, decode: (entry: unknown) => T): DesignEntityChange<T> {
        const value: Readonly<Record<string, unknown>> = V.record(raw, ['id', 'before', 'after']);
        return {
            id: V.id(value['id']),
            before: value['before'] === null ? null : decode(value['before']),
            after: value['after'] === null ? null : decode(value['after']),
        };
    }
    static #list<T extends Identity>(
        raw: unknown,
        decode: (entry: unknown) => T,
    ): readonly DesignEntityChange<T>[] {
        const seen: Set<string> = new Set();
        return V.list(raw, 20000, (entry: unknown): DesignEntityChange<T> => {
            const change: DesignEntityChange<T> = this.#entry(entry, decode);
            if (
                seen.has(change.id) ||
                (change.before !== null && change.before.id !== change.id) ||
                (change.after !== null && change.after.id !== change.id)
            ) {
                throw new Error('Invalid design change identity');
            }
            seen.add(change.id);
            return change;
        });
    }
}
