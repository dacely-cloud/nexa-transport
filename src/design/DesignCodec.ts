// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { DesignValues as V } from './DesignValues.js';
import { DesignNodeCodec } from './DesignNodeCodec.js';
import { DesignFreeze } from './DesignFreeze.js';
import { DesignBudget } from './DesignBudget.js';
import { DesignTree } from './DesignTree.js';
import {
    DesignTokenCategory,
    DesignTrigger,
    DesignAction,
    DesignTransition,
    type DesignDocument,
    type DesignPage,
    type DesignNode,
    type DesignToken,
    type DesignInteraction,
    type DesignComment,
} from './DesignTypes.js';

/** Canonical design document validation is shared with the website and agent tools. */
export class DesignCodec {
    /** One bounded detached document with validated topology and reference identities. */
    public static document(raw: unknown): DesignDocument {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'format',
            'id',
            'name',
            'revision',
            'pages',
            'nodes',
            'tokens',
            'interactions',
            'comments',
        ]);
        if (value['format'] !== 1) {
            throw new Error('Unsupported design document format');
        }
        const budget: DesignBudget = new DesignBudget();
        const document: DesignDocument = {
            format: 1,
            id: V.id(value['id']),
            name: V.text(value['name']),
            revision: V.revision(value['revision']),
            pages: V.list(value['pages'], 256, (entry: unknown): DesignPage =>
                budget.consume(this.page(entry)),
            ),
            nodes: V.list(value['nodes'], 10000, (entry: unknown): DesignNode =>
                budget.consume(DesignNodeCodec.node(entry)),
            ),
            tokens: V.list(value['tokens'], 4096, (entry: unknown): DesignToken =>
                budget.consume(this.token(entry)),
            ),
            interactions: V.list(
                value['interactions'],
                10000,
                (entry: unknown): DesignInteraction => budget.consume(this.interaction(entry)),
            ),
            comments: V.list(value['comments'], 10000, (entry: unknown): DesignComment =>
                budget.consume(this.comment(entry)),
            ),
        };
        if (document.pages.length === 0) {
            throw new Error('Design requires at least one page');
        }
        DesignTree.validate(document);
        return DesignFreeze.document(document);
    }
    /** Validates one bounded page record. */
    public static page(raw: unknown): DesignPage {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'name',
            'roots',
            'background',
        ]);
        return {
            id: V.id(value['id']),
            name: V.text(value['name']),
            roots: V.list(value['roots'], 10000, (entry: unknown): string => V.id(entry)),
            background: V.color(value['background']),
        };
    }
    /** Validates one bounded token record. */
    public static token(raw: unknown): DesignToken {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'name',
            'value',
            'category',
        ]);
        const category: DesignTokenCategory = V.choice(
            value['category'],
            Object.values(DesignTokenCategory),
        );
        const text: string = V.text(value['value'], 256);
        if (category === DesignTokenCategory.Color) {
            V.color(text);
        }
        return { id: V.id(value['id']), name: V.text(value['name']), value: text, category };
    }
    /** Validates one bounded interaction record. */
    public static interaction(raw: unknown): DesignInteraction {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'nodeId',
            'targetId',
            'trigger',
            'action',
            'transition',
            'durationMs',
        ]);
        return {
            id: V.id(value['id']),
            nodeId: V.id(value['nodeId']),
            targetId: V.id(value['targetId']),
            trigger: V.choice(value['trigger'], Object.values(DesignTrigger)),
            action: V.choice(value['action'], Object.values(DesignAction)),
            transition: V.choice(value['transition'], Object.values(DesignTransition)),
            durationMs: V.number(value['durationMs'], 0, 60000, true),
        };
    }
    /** Validates one bounded comment record. */
    public static comment(raw: unknown): DesignComment {
        const value: Readonly<Record<string, unknown>> = V.record(raw, [
            'id',
            'nodeId',
            'x',
            'y',
            'text',
            'author',
            'resolved',
        ]);
        return {
            id: V.id(value['id']),
            nodeId: V.optionalId(value['nodeId']),
            x: V.number(value['x']),
            y: V.number(value['y']),
            text: V.text(value['text'], 8000),
            author: V.text(value['author']),
            resolved: V.boolean(value['resolved']),
        };
    }
}
