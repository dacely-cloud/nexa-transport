// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    BrowserStructurePage,
    BrowserStructureSnapshot,
    BrowserPageProjection,
    BrowserStructureProjection,
    BrowserStructureCount,
    BrowserStructureRow,
    BrowserDomNode,
    BrowserAccessibilityNode,
    BrowserAttributeName,
    ReverseBrowserReference,
} from '../protocol/Protocol.js';
import { reverseBrowserStructure } from '../protocol/Validators.js';
import { BrowserReceipt } from './BrowserReceipt.js';

type StructureFields =
    | BrowserStructurePage
    | BrowserStructureSnapshot
    | BrowserPageProjection
    | BrowserStructureProjection
    | BrowserStructureCount
    | BrowserStructureRow
    | ReverseBrowserReference;

/** Portable validation for bounded DOM/AX directories and immutable capture receipts. */
export class BrowserStructureReceipt {
    /** Checks exact fields, provenance, view, selection, node namespaces and cursor progress before rendering. */
    public static read(input: unknown): BrowserStructurePage {
        if (!reverseBrowserStructure(input)) {
            throw new TypeError('Invalid saved browser structure page');
        }
        this.#keys(input, [
            'runId',
            'sha256',
            'evidenceId',
            'captureSha256',
            'metadata',
            'view',
            'selector',
            'cursor',
            'nextCursor',
            'total',
            'records',
        ]);
        this.metadata(input.metadata);
        if (
            !this.#uuid(input.runId) ||
            !this.#uuid(input.evidenceId) ||
            !this.#hash(input.sha256) ||
            !this.#hash(input.captureSha256) ||
            !this.#counter(input.cursor, 1000000n) ||
            !this.#counter(input.total, 1000000n) ||
            input.records.length > 20 ||
            JSON.stringify(input).length > 12000
        ) {
            throw new RangeError('Browser structure exceeds presentation limits');
        }
        const offset: bigint = BigInt(input.cursor);
        const total: bigint = BigInt(input.total);
        const end: bigint = offset + BigInt(input.records.length);
        if (
            offset > total ||
            end > total ||
            (input.records.length === 0 && offset < total) ||
            input.nextCursor !== (end < total ? end.toString() : null)
        ) {
            throw new RangeError('Inconsistent browser structure pagination');
        }
        const selected: string | null = this.#selector(input.selector, input.view);
        const summary: BrowserStructureProjection =
            input.view === 'dom' ? input.metadata.dom : input.metadata.accessibility;
        if (
            (input.selector === 'all' && input.total !== summary.nodes) ||
            (input.selector.startsWith('node:') && input.total !== '1') ||
            (!summary.available && total !== 0n) ||
            (total > BigInt(summary.nodes) && !input.selector.startsWith('attributes:'))
        ) {
            throw new RangeError('Inconsistent browser structure directory coverage');
        }
        const ids: Set<string> = new Set<string>();
        for (let index: number = 0; index < input.records.length; index += 1) {
            const row: BrowserStructureRow | undefined = input.records[index];
            if (row === undefined) {
                throw new RangeError('Missing browser structure row');
            }
            if (row.kind === 'attribute') {
                this.#attribute(row);
                if (
                    input.view !== 'dom' ||
                    !input.selector.startsWith('attributes:') ||
                    row.nodeId !== selected ||
                    BigInt(row.index) !== offset + BigInt(index)
                ) {
                    throw new RangeError('Attribute page left its selected node');
                }
                continue;
            }
            if (
                input.selector.startsWith('attributes:') ||
                row.kind !== input.view ||
                ids.has(row.id)
            ) {
                throw new RangeError('Browser structure representation changed');
            }
            ids.add(row.id);
            if (row.kind === 'dom') {
                this.#dom(row);
            } else {
                this.#ax(row, summary.partial);
            }
            if (
                (input.selector.startsWith('node:') && row.id !== selected) ||
                (input.selector.startsWith('children:') && row.parentId !== selected) ||
                (input.selector === 'roots' &&
                    row.parentId !== null &&
                    !(row.kind === 'accessibility' && row.depth === null)) ||
                (!summary.partial && row.missingChildren !== '0')
            ) {
                throw new RangeError('Browser structure relationship or coverage changed');
            }
        }
        return input;
    }
    /** Binds a live structure summary to the original investigation and parent conversation. */
    public static snapshot(
        value: BrowserStructureSnapshot,
        runId: string,
        sessionId: string | undefined,
    ): void {
        this.metadata(value, true);
        this.#keys(value.reference, ['sessionId', 'runId', 'evidenceId', 'captureSha256']);
        if (
            value.reference.runId !== runId ||
            !this.#uuid(runId) ||
            !this.#uuid(value.reference.evidenceId) ||
            !this.#hash(value.reference.captureSha256) ||
            value.reference.sessionId.length === 0 ||
            value.reference.sessionId.length > 1024 ||
            value.reference.sessionId !== sessionId
        ) {
            throw new RangeError('Invalid browser structure provenance');
        }
    }
    /** Count previews can be partial without truncating the underlying admitted topology. */
    public static metadata(value: BrowserPageProjection, snapshot: boolean = false): void {
        this.#keys(value, [
            'provider',
            'targetId',
            'frameId',
            'url',
            'origin',
            'capturedAt',
            'priorActivityAvailable',
            'dom',
            'accessibility',
            'limitations',
            ...(snapshot ? ['reference'] : []),
        ]);
        const origin: URL = new URL(value.origin);
        if (
            !['http:', 'https:'].includes(origin.protocol) ||
            origin.origin !== value.origin ||
            value.provider !== 'cdp-passive' ||
            value.priorActivityAvailable ||
            !this.#identity(value.targetId) ||
            !this.#identity(value.frameId) ||
            !this.#date(value.capturedAt) ||
            value.limitations.length > 12 ||
            value.limitations.some((text: string): boolean => text.length > 1000) ||
            !value.dom.available ||
            value.dom.nodes === '0'
        ) {
            throw new RangeError('Invalid browser structure document metadata');
        }
        BrowserReceipt.url(value.url, value.origin);
        this.#summary(value.dom);
        this.#summary(value.accessibility);
    }
    static #summary(value: BrowserStructureProjection): void {
        this.#keys(value, ['available', 'nodes', 'partial', 'counts', 'countPreviewPartial']);
        if (
            !this.#counter(value.nodes, 1000000n) ||
            value.counts.length > 20 ||
            (!value.available &&
                (value.nodes !== '0' ||
                    !value.partial ||
                    value.counts.length !== 0 ||
                    value.countPreviewPartial))
        ) {
            throw new RangeError('Invalid browser structure count coverage');
        }
        const names: Set<string> = new Set<string>();
        let counted: bigint = 0n;
        for (const row of value.counts) {
            this.#keys(row, ['name', 'count']);
            if (
                row.name.length > 256 ||
                names.has(row.name) ||
                !this.#counter(row.count, BigInt(value.nodes)) ||
                row.count === '0'
            ) {
                throw new RangeError('Invalid browser structure count preview');
            }
            counted += BigInt(row.count);
            names.add(row.name);
        }
        if (counted > BigInt(value.nodes)) {
            throw new RangeError('Browser counts exceed captured nodes');
        }
    }
    static #dom(row: BrowserDomNode): void {
        this.#keys(row, [
            'kind',
            'relation',
            'id',
            'backendNodeId',
            'parentId',
            'depth',
            'nodeType',
            'name',
            'localName',
            'valueLength',
            'attributeCount',
            'childCount',
            'missingChildren',
        ]);
        if (
            !this.#domId(row.id) ||
            (row.backendNodeId !== null && !this.#domId(row.backendNodeId)) ||
            (row.parentId !== null && !this.#domId(row.parentId)) ||
            !this.#integer(row.depth, 1000000) ||
            !this.#integer(row.nodeType, 12) ||
            row.nodeType === 0 ||
            row.name.length > 256 ||
            row.localName.length > 256 ||
            !this.#counter(row.valueLength, 8388608n) ||
            !this.#counter(row.attributeCount, 1000000n) ||
            !this.#counter(row.childCount, 1000000n) ||
            !this.#counter(row.missingChildren, 1000000n) ||
            (row.parentId === null) !== (row.relation === 'document') ||
            (row.parentId === null && (row.depth !== 0 || row.nodeType !== 9)) ||
            (row.parentId !== null && row.depth === 0) ||
            row.parentId === row.id
        ) {
            throw new RangeError('Invalid DOM node metadata');
        }
    }
    static #ax(row: BrowserAccessibilityNode, partial: boolean): void {
        this.#keys(row, [
            'kind',
            'id',
            'backendNodeId',
            'parentId',
            'depth',
            'role',
            'ignored',
            'childCount',
            'missingChildren',
        ]);
        if (
            !this.#identity(row.id) ||
            (row.backendNodeId !== null && !this.#domId(row.backendNodeId)) ||
            (row.parentId !== null && !this.#identity(row.parentId)) ||
            (row.depth !== null && !this.#integer(row.depth, 1000000)) ||
            (row.depth === null && (!partial || row.parentId === null)) ||
            (row.parentId === null && row.depth !== 0) ||
            (row.parentId !== null && row.depth === 0) ||
            row.parentId === row.id ||
            (row.role !== null && row.role.length > 256) ||
            !this.#counter(row.childCount, 1000000n) ||
            !this.#counter(row.missingChildren, 1000000n)
        ) {
            throw new RangeError('Invalid accessibility node metadata');
        }
    }
    static #attribute(row: BrowserAttributeName): void {
        this.#keys(row, ['kind', 'nodeId', 'index', 'name']);
        if (
            !this.#domId(row.nodeId) ||
            !this.#integer(row.index, 1000000) ||
            row.name.length > 4096
        ) {
            throw new RangeError('Invalid DOM attribute name');
        }
    }
    static #selector(value: string, view: BrowserStructurePage['view']): string | null {
        if (value === 'all' || value === 'roots') {
            return null;
        }
        const separator: number = value.indexOf(':');
        const prefix: string = value.slice(0, separator);
        const id: string = value.slice(separator + 1);
        if (
            separator < 0 ||
            !['node', 'children', 'attributes'].includes(prefix) ||
            (prefix === 'attributes' && view !== 'dom') ||
            !(view === 'dom' ? this.#domId(id) : this.#identity(id))
        ) {
            throw new RangeError('Invalid browser structure selector');
        }
        return id;
    }
    static #identity(value: string): boolean {
        if (value.length === 0 || value.length > 128) {
            return false;
        }
        for (let index: number = 0; index < value.length; index += 1) {
            const code: number = value.charCodeAt(index);
            if (code < 32 || code === 127) {
                return false;
            }
        }
        return true;
    }
    static #domId(value: string): boolean {
        return /^[1-9][0-9]{0,9}$/u.test(value) && BigInt(value) <= 2147483647n;
    }
    static #counter(value: string, maximum: bigint): boolean {
        return /^(?:0|[1-9][0-9]{0,19})$/u.test(value) && BigInt(value) <= maximum;
    }
    static #integer(value: number, maximum: number): boolean {
        return Number.isSafeInteger(value) && value >= 0 && value <= maximum;
    }
    static #hash(value: string): boolean {
        return /^[a-f0-9]{64}$/u.test(value);
    }
    static #uuid(value: string): boolean {
        return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u.test(value);
    }
    static #date(value: string): boolean {
        const time: number = Date.parse(value);
        return (
            Number.isFinite(time) && value.length <= 40 && new Date(time).toISOString() === value
        );
    }
    static #keys(value: StructureFields, keys: readonly string[]): void {
        if (
            Object.keys(value).length !== keys.length ||
            keys.some((key: string): boolean => !Object.hasOwn(value, key))
        ) {
            throw new RangeError('Unexpected browser structure fields');
        }
    }
}
