import { afterEach, describe, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { ReverseInvestigation } from '../src/reverse/ReverseInvestigation.js';
import type {
    ReversePlanStep,
    ReverseApplicationSnapshot,
    ReverseRunSnapshot,
    WireTurnEvent,
} from '../src/protocol/Protocol.js';
import { result, TestGateway, type Request } from './Support.js';

let gateway: TestGateway | undefined;
let client: NexaClient | undefined;
afterEach(async (): Promise<void> => {
    client?.close();
    await gateway?.close();
});

/** A capability-free investigation with source provenance and an explicit reviewer dependency. */
function snapshot(revision: string = '1'): ReverseRunSnapshot {
    return {
        version: 1,
        id: 'run',
        revision,
        inputName: 'sample',
        sha256: 'a'.repeat(64),
        question: 'Recover the behavior',
        state: 'running',
        tasks: [
            {
                expert: 'formats',
                dependsOn: [],
                state: 'done',
                attempts: 1,
                startedAtMs: '1000',
                finishedAtMs: '2000',
                report: 'ELF observed',
                error: null,
            },
            {
                expert: 'reviewer',
                dependsOn: ['formats'],
                state: 'pending',
                attempts: 0,
                startedAtMs: null,
                finishedAtMs: null,
                report: null,
                error: null,
            },
        ],
        evidenceCount: 1,
        evidence: [
            {
                id: 'evidence',
                expert: 'formats',
                operation: 'bytes',
                selector: null,
                path: '/workspace/.nexa/reverse/run/evidence.txt',
                excerpt: '7f454c46',
                characters: '8',
                createdAtMs: '1500',
            },
        ],
        cleanupErrors: [],
    };
}

/** A reviewer's concrete verification request with an immutable evidence reference. */
function followUp(): ReversePlanStep {
    return {
        expert: 'formats',
        dependsOn: [],
        state: 'pending',
        attempts: 0,
        startedAtMs: null,
        finishedAtMs: null,
        report: null,
        error: null,
        id: 'step-1',
        scope: 'header',
        objective: 'Verify the header',
        requestedBy: 'reviewer',
        evidenceIds: ['evidence'],
    };
}

describe('native investigation transport', (): void => {
    it('validates static application provenance, count limits and compatibility independently of model prose', (): void => {
        const application: ReverseApplicationSnapshot = {
            moduleCount: 1,
            importCount: 0,
            functionCount: 1,
            ipcCount: 1,
            routeCount: 0,
            nativeAddonCount: 0,
            sourceMapCount: 0,
            issueCount: 0,
            modules: [
                {
                    id: 'main.js',
                    path: 'main.js',
                    sha256: 'b'.repeat(64),
                    bytes: '200',
                    functions: 1,
                    imports: 0,
                    sourceMap: null,
                    parseError: null,
                },
            ],
            boundaries: [
                {
                    id: 'ipc:1',
                    kind: 'ipc',
                    operation: 'ipcMain.handle',
                    value: 'files:read',
                    location: {
                        module: 'main.js',
                        line: 1,
                        column: 0,
                        endLine: 1,
                        endColumn: 100,
                        start: 0,
                        end: 100,
                    },
                },
            ],
            issues: [],
        };
        const receipt: ReverseRunSnapshot = { ...snapshot(), kind: 'javascript', application };
        expect(ReverseInvestigation.parse(receipt).application).toEqual(application);
        for (const invalid of [
            { ...receipt, kind: 'native' },
            { ...receipt, application: { ...application, moduleCount: -1 } },
            {
                ...receipt,
                application: { ...application, modules: Array(13).fill(application.modules[0]) },
            },
            {
                ...receipt,
                application: {
                    ...application,
                    boundaries: application.boundaries.map((entry) => ({
                        ...entry,
                        location: { ...entry.location, end: -1 },
                    })),
                },
            },
            {
                ...receipt,
                application: {
                    ...application,
                    modules: application.modules.map((entry) => ({
                        ...entry,
                        bytes: '9007199254740993',
                    })),
                },
            },
        ]) {
            expect((): ReverseRunSnapshot => ReverseInvestigation.parse(invalid)).toThrow();
        }
    });
    it('carries mixed source observations and rejects inconsistent language metadata', (): void => {
        const application: ReverseApplicationSnapshot = {
            languages: ['c', 'lua'],
            symbolCount: 2,
            referenceCount: 1,
            moduleCount: 2,
            importCount: 0,
            functionCount: 2,
            ipcCount: 0,
            routeCount: 0,
            nativeAddonCount: 0,
            sourceMapCount: 0,
            issueCount: 0,
            modules: [
                {
                    id: 'main.c',
                    path: 'main.c',
                    language: 'c',
                    sha256: 'c'.repeat(64),
                    bytes: '64',
                    functions: 1,
                    imports: 0,
                    sourceMap: null,
                    parseError: null,
                },
            ],
            boundaries: [],
            issues: [],
        };
        const receipt: ReverseRunSnapshot = { ...snapshot(), kind: 'source', application };
        expect(ReverseInvestigation.parse(receipt).application?.languages).toEqual(['c', 'lua']);
        for (const invalid of [
            { ...application, languages: ['c', 'c'] },
            { ...application, languages: ['lua'] },
            { ...application, languages: ['unsupported'] },
            { ...application, symbolCount: 200_001 },
            { ...application, referenceCount: -1 },
        ]) {
            expect((): ReverseRunSnapshot =>
                ReverseInvestigation.parse({ ...receipt, application: invalid }),
            ).toThrow();
        }
    });
    it('validates adaptive work ownership, evidence links and acyclic dependencies with old receipt compatibility', (): void => {
        const initial: ReverseRunSnapshot = snapshot();
        const step: ReversePlanStep = followUp();
        const next: ReversePlanStep = {
            ...step,
            id: 'step-2',
            scope: 'sections',
            dependsOn: ['step-1'],
        };
        const adaptive: ReverseRunSnapshot = { ...initial, plan: [step, next] };
        expect(ReverseInvestigation.parse(initial).plan).toBeUndefined();
        expect(ReverseInvestigation.parse(adaptive).plan).toHaveLength(2);
        expect(
            ReverseInvestigation.parse({
                ...adaptive,
                evidence: initial.evidence.map((record) => ({ ...record, stepId: 'step-1' })),
            }).plan,
        ).toHaveLength(2);
        for (const plan of [
            [step, step],
            [{ ...step, dependsOn: ['step-2'] }, next],
            [{ ...step, requestedBy: 'foreign-reviewer' }],
            [{ ...step, expert: 'foreign-owner' }],
            [{ ...step, evidenceIds: [] }],
            [{ ...step, dependsOn: ['foreign-step'] }],
            [{ ...step, objective: 'x'.repeat(2001) }],
            Array(7).fill(step),
        ]) {
            expect((): ReverseRunSnapshot =>
                ReverseInvestigation.parse({ ...initial, plan }),
            ).toThrow();
        }
        expect((): ReverseRunSnapshot =>
            ReverseInvestigation.parse({
                ...adaptive,
                evidence: initial.evidence.map((record) => ({ ...record, stepId: 'foreign-step' })),
            }),
        ).toThrow();
        expect((): ReverseRunSnapshot =>
            ReverseInvestigation.parse({
                ...initial,
                tasks: initial.tasks.map((task) => ({
                    ...task,
                    dependsOn: [task.expert === 'formats' ? 'reviewer' : 'formats'],
                })),
            }),
        ).toThrow();
    });
    it('validates receipts and rejects malformed identity, provenance, revisions and oversized projections', (): void => {
        const valid: ReverseRunSnapshot = snapshot();
        expect(ReverseInvestigation.parse(valid)).toBe(valid);
        for (const invalid of [
            { ...valid, version: 2 },
            { ...valid, state: 'invented' },
            { ...valid, revision: '-1' },
            { ...valid, revision: '9'.repeat(41) },
            { ...valid, sha256: 'missing' },
            { ...valid, question: 'q'.repeat(8001) },
            { ...valid, evidenceCount: 0 },
            { ...valid, evidence: Array(17).fill(valid.evidence[0]) },
            { ...valid, tasks: [...valid.tasks, valid.tasks[0]] },
            { ...valid, tasks: valid.tasks.map((task) => ({ ...task, dependsOn: ['missing'] })) },
            {
                ...valid,
                evidence: valid.evidence.map((item) => ({ ...item, expert: 'other-run' })),
            },
        ]) {
            expect((): ReverseRunSnapshot => ReverseInvestigation.parse(invalid)).toThrow();
        }
    });

    it('retains monotonic revisions beyond number precision and refuses run switches or terminal revival', (): void => {
        const initial: ReverseRunSnapshot = snapshot('9007199254740992');
        const newer: ReverseRunSnapshot = snapshot('9007199254740993');
        expect(ReverseInvestigation.advance(initial, newer)).toBe(newer);
        expect(ReverseInvestigation.advance(newer, initial)).toBe(newer);
        expect(ReverseInvestigation.advance(newer, newer)).toBe(newer);
        const archived: ReverseRunSnapshot = { ...initial, archive: { sessionId: 'alice::main' } };
        expect((): ReverseRunSnapshot => ReverseInvestigation.advance(archived, newer)).toThrow(
            'archive identity',
        );
        expect((): ReverseRunSnapshot =>
            ReverseInvestigation.parse({ ...initial, archive: { sessionId: '' } }),
        ).toThrow();
        const terminal: ReverseRunSnapshot = { ...newer, state: 'partial' };
        expect(ReverseInvestigation.advance(terminal, snapshot('9007199254740994'))).toBe(terminal);
        expect((): ReverseRunSnapshot =>
            ReverseInvestigation.advance(initial, { ...newer, id: 'other' }),
        ).toThrow('identity');
    });

    it('accepts explicit resume epochs and cumulative attempts while rejecting stale execution and completed revival', (): void => {
        const stopped: ReverseRunSnapshot = { ...snapshot('5'), state: 'cancelled' };
        const resumed: ReverseRunSnapshot = {
            ...snapshot('6'),
            execution: 1,
            tasks: snapshot().tasks.map((task) => ({ ...task, attempts: 3 })),
        };
        expect(ReverseInvestigation.advance(stopped, resumed)).toBe(resumed);
        const late: ReverseRunSnapshot = { ...snapshot('7'), state: 'cancelled' };
        expect(ReverseInvestigation.advance(resumed, late)).toBe(resumed);
        for (const execution of [-1, 0.5, 4]) {
            expect((): ReverseRunSnapshot =>
                ReverseInvestigation.parse({ ...resumed, execution }),
            ).toThrow();
        }
        expect((): ReverseRunSnapshot =>
            ReverseInvestigation.parse({
                ...resumed,
                tasks: resumed.tasks.map((task) => ({ ...task, attempts: 7 })),
            }),
        ).toThrow();
        expect((): ReverseRunSnapshot =>
            ReverseInvestigation.advance({ ...stopped, state: 'done' }, resumed),
        ).toThrow('Completed');
    });

    it('preserves plan, specialist failures and evidence across websocket progress and final outcomes', async (): Promise<void> => {
        gateway = new TestGateway();
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        const running: ReverseRunSnapshot = {
            ...snapshot(),
            kind: 'source',
            plan: [followUp()],
            application: {
                languages: ['cpp', 'luau'],
                symbolCount: 2,
                referenceCount: 1,
                moduleCount: 2,
                importCount: 0,
                functionCount: 2,
                ipcCount: 0,
                routeCount: 0,
                nativeAddonCount: 0,
                sourceMapCount: 0,
                issueCount: 0,
                modules: [],
                boundaries: [],
                issues: [],
            },
        };
        const final: ReverseRunSnapshot = {
            ...running,
            revision: '2',
            state: 'partial',
            plan: (running.plan ?? []).map((step): ReversePlanStep => ({
                ...step,
                state: 'done',
                attempts: 1,
                report: 'Header verified',
            })),
            tasks: running.tasks.map((task) =>
                task.expert === 'reviewer'
                    ? { ...task, state: 'failed', attempts: 2, error: 'Reviewer unavailable' }
                    : task,
            ),
        };
        const call: WireTurnEvent & { readonly type: 'tool-start' } = {
            type: 'tool-start',
            call: {
                id: 'tool',
                name: 'reverse_engineer',
                input: { file: 'sample', question: 'Recover' },
            },
        };
        gateway.handler = (socket: WebSocket, request: Request): void => {
            socket.send(
                JSON.stringify({
                    id: request.id,
                    ok: true,
                    result: { streamId: request.params['streamId'], runId: 'turn' },
                }),
            );
            const events: readonly WireTurnEvent[] = [
                call,
                { type: 'tool-progress', call: call.call, update: { reverse: running } },
                {
                    type: 'tool-finish',
                    outcome: {
                        call: call.call,
                        durationMs: 20,
                        result: { status: 'ok', content: 'Partial findings', reverse: final },
                    },
                },
            ];
            for (const [index, event] of events.entries()) {
                socket.send(
                    JSON.stringify({
                        event: 'turn.event',
                        seq: index + 2,
                        data: { streamId: request.params['streamId'], event },
                    }),
                );
            }
            socket.send(
                JSON.stringify({
                    event: 'turn.end',
                    seq: 5,
                    data: { streamId: request.params['streamId'], ok: true, result },
                }),
            );
        };
        const receipts: ReverseRunSnapshot[] = [];
        const turn = client.stream({ message: 'Investigate sample' });
        for await (const event of turn) {
            const receipt: ReverseRunSnapshot | undefined = ReverseInvestigation.event(event);
            if (receipt !== undefined) {
                receipts.push(receipt);
            }
        }
        await turn.result;
        expect(receipts).toEqual([running, final]);
        expect(receipts.at(-1)?.application?.languages).toEqual(['cpp', 'luau']);
        expect(receipts.at(-1)?.tasks.at(-1)?.error).toBe('Reviewer unavailable');
        expect(receipts.at(-1)?.plan?.[0]?.report).toBe('Header verified');
    });
});
