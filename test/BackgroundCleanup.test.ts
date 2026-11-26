// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import type { BackgroundProcess } from 'nexa-protocol/gateway/BackgroundProcessTypes.js';
import { Method } from 'nexa-protocol/gateway/Method.js';
import type { WireTurnEvent } from 'nexa-protocol/gateway/ProtocolEventTypes.js';
import type {
    CommandExecutionCleanupUnconfirmed,
    CommandExecutionReceipt,
    CommandExecutionSnapshot,
    ToolResult,
} from 'nexa-protocol/tools/Types.js';
import { methodValidators } from 'nexa-protocol/schema/MethodValidators.js';
import { SchemaValidator } from 'nexa-protocol/schema/Schema.js';
import { schema } from 'nexa-protocol/schema/SchemaData.js';
import { historyRecord, turnEvent } from 'nexa-protocol/schema/Validators.js';
import { TestGateway, type Request } from './Support.js';

/** The retained cell represents uncertain cleanup, without fabricating an OS exit or a replacement process. */
const background: BackgroundProcess = {
    processId: 'original-terminal',
    command: 'native-program',
    cwd: '/workspace',
    startedAt: '9007199254740993',
    endedAt: null,
    running: true,
    cleanupUnconfirmed: true,
    exitCode: null,
    signal: null,
};

/** Live and saved tool receipts carry the same optional native uncertainty flag. */
const snapshot: CommandExecutionSnapshot = {
    command: background.command,
    cwd: background.cwd,
    exitCode: null,
    signal: null,
    processId: background.processId,
    processToken: null,
    running: true,
    remote: true,
};

/** The public failure variant carries no command arguments, directory, output or process token. */
const receipt: CommandExecutionCleanupUnconfirmed = {
    cleanupUnconfirmed: true,
    processId: background.processId,
    running: true,
    remote: true,
    exitCode: null,
    signal: null,
};

it.each([true, false, undefined])(
    'cleanup uncertainty remains an optional boolean across process listings and live/saved command receipts (%s)',
    (cleanupUnconfirmed: boolean | undefined): void => {
        const { cleanupUnconfirmed: _backgroundFlag, ...base }: BackgroundProcess = background;
        const process: BackgroundProcess = {
            ...base,
            ...(cleanupUnconfirmed === undefined ? {} : { cleanupUnconfirmed }),
        };
        const command: CommandExecutionReceipt =
            cleanupUnconfirmed === true
                ? receipt
                : {
                      ...snapshot,
                      ...(cleanupUnconfirmed === undefined ? {} : { cleanupUnconfirmed }),
                  };
        const result: ToolResult = {
            status: 'error',
            content: 'Native cleanup remains unresolved.',
            commandExecution: command,
        };
        const event: WireTurnEvent = {
            type: 'tool-finish',
            outcome: {
                call: { id: 'terminal-call', name: 'run_cmd', input: {} },
                durationMs: 1,
                result,
            },
        };
        expect(methodValidators[Method.ProcessesList].result([process])).toBe(true);
        expect(turnEvent({ streamId: 'stream', event })).toBe(true);
        expect(
            historyRecord({
                id: 'saved',
                at: 1,
                kind: 'event',
                data: { streamId: 'stream', event },
            }),
        ).toBe(true);
        expect(schema.definitions?.['BackgroundProcess']?.required).not.toContain(
            'cleanupUnconfirmed',
        );
        expect(schema.definitions?.['CommandExecutionSnapshot']?.required).not.toContain(
            'cleanupUnconfirmed',
        );
        expect(
            schema.definitions?.['CommandExecutionSnapshot']?.properties?.['cleanupUnconfirmed']
                ?.const,
        ).toBe(false);
        expect(schema.definitions?.['CommandExecutionCleanupUnconfirmed']?.required).toContain(
            'cleanupUnconfirmed',
        );
        expect(
            schema.definitions?.['CommandExecutionCleanupUnconfirmed']?.additionalProperties,
        ).toBe(false);
    },
);

it.each([
    { ...snapshot, cleanupUnconfirmed: true },
    { ...receipt, command: 'private arguments' },
    { ...receipt, cwd: '/private-path' },
    { ...receipt, processToken: null },
    { ...receipt, terminalOutput: 'private output' },
    { ...receipt, running: false },
    { ...receipt, remote: false },
    { ...receipt, exitCode: 0 },
    { ...receipt, signal: 'SIGTERM' },
    { ...receipt, processId: '../other' },
    { ...receipt, processId: 'x'.repeat(129) },
])(
    'the minimal uncertainty variant rejects full true-flag snapshots, private fields and invented exit evidence (%#)',
    (raw: unknown): void => {
        expect(
            new SchemaValidator(schema).validate('#/definitions/CommandExecutionReceipt', raw),
        ).toBe(false);
    },
);

it.each([null, 0, 1, 'true', {}, []])(
    'malformed cleanup uncertainty is rejected rather than being coerced into ownership evidence (%#)',
    (cleanupUnconfirmed: unknown): void => {
        const validator: SchemaValidator = new SchemaValidator(schema);
        expect(
            methodValidators[Method.ProcessesList].result([{ ...background, cleanupUnconfirmed }]),
        ).toBe(false);
        expect(
            validator.validate('#/definitions/CommandExecutionReceipt', {
                ...receipt,
                cleanupUnconfirmed,
            }),
        ).toBe(false);
        expect(
            turnEvent({
                streamId: 'stream',
                event: {
                    type: 'tool-finish',
                    outcome: {
                        call: { id: 'terminal-call', name: 'run_cmd', input: {} },
                        durationMs: 1,
                        result: {
                            status: 'error',
                            content: 'Unknown cleanup.',
                            commandExecution: { ...receipt, cleanupUnconfirmed },
                        },
                    },
                },
            }),
        ).toBe(false);
    },
);

it('the authenticated client preserves an unresolved native process cell without inventing an exit', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    let client: NexaClient | null = null;
    gateway.handler = (socket: WebSocket, request: Request): void => {
        socket.send(JSON.stringify({ id: request.id, ok: true, result: [background] }));
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect(
            await client.call(Method.ProcessesList, { sessionId: 'private-conversation' }),
        ).toEqual([background]);
    } finally {
        client?.close();
        await gateway.close();
    }
});
