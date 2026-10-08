// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { GraphSeverity, type GraphIssue, type GraphIssueCode } from './GraphTypes.js';

/** Keeps large malformed graphs from producing an unbounded diagnostic response. */
export class GraphProblems {
    readonly #issues: GraphIssue[] = [];
    #total: number = 0;
    #errors: number = 0;
    public add(
        code: GraphIssueCode,
        message: string,
        nodeId: string | null = null,
        edgeId: string | null = null,
        path: string | null = null,
        severity: GraphSeverity = GraphSeverity.Error,
    ): void {
        this.#total += 1;
        if (severity === GraphSeverity.Error) {
            this.#errors += 1;
        }
        if (this.#issues.length < 200) {
            this.#issues.push(
                Object.freeze({
                    code,
                    severity,
                    message: message.slice(0, 2_048),
                    nodeId,
                    edgeId,
                    path: path?.slice(0, 512) ?? null,
                }),
            );
        }
    }
    public get valid(): boolean {
        return this.#errors === 0;
    }
    public get total(): number {
        return this.#total;
    }
    public get issues(): readonly GraphIssue[] {
        return Object.freeze([...this.#issues]);
    }
}
