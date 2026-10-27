// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import {
    ConnectorArgumentKind,
    ConnectorExecutionAccess,
    ConnectorExecutionLane,
    ConnectorInputKind,
    ConnectorInteractiveTransport,
    Method,
    type ConnectorArgumentRule,
    type ConnectorExecutionStatus,
    type ConnectorInteractiveInvocationRule,
} from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';
import { NexaClient } from '../src/networking/NexaClient.js';
import { TestGateway, type Request } from './Support.js';
import type { WebSocket } from 'ws';

/** Public metadata only; neither declared transport nor a successful decode asserts native capability. */
class InteractiveFixture {
    public static rule(): ConnectorInteractiveInvocationRule {
        return {
            kind: ConnectorArgumentKind.InteractiveInvocation,
            invocation: {
                kind: ConnectorArgumentKind.MachineInvocation,
                shell: { executableIndex: 0, fixedArguments: ['-c'] },
                commands: [{ alias: 'node', executableIndex: 1 }],
                environment: [{ name: 'LANG', maximumBytes: 128 }],
                maximumCwdBytes: 512,
                maximumEnvironmentBytes: 1024,
                maximumStdinBytes: 1024,
                maximumTimeoutMs: 30000,
                maximumArguments: 32,
                maximumArgumentBytes: 1024,
                maximumArgumentsBytes: 2048,
                maximumScriptBytes: 2048,
            },
            transports: [ConnectorInteractiveTransport.Pipe],
            controls: [ConnectorInputKind.Data, ConnectorInputKind.End],
            maximumInputBytes: '65536',
            maximumControls: 256,
            maximumResizes: 0,
        };
    }
    public static status(rule: ConnectorArgumentRule = this.rule()): ConnectorExecutionStatus {
        return {
            environmentId: 'environment',
            lanes: Object.values(ConnectorExecutionLane).map(
                (lane: ConnectorExecutionLane): ConnectorExecutionStatus['lanes'][number] => ({
                    lane,
                    online: true,
                    sequence: '9223372036854775807',
                    acknowledgedSequence: '9223372036854775807',
                    profile: {
                        revision: '9223372036854775807',
                        policySha256: 'a'.repeat(64),
                        roots: [{ id: 'project', access: ConnectorExecutionAccess.ReadWrite }],
                        programs: [{ id: 'process', rootIds: ['project'], arguments: [rule] }],
                        resources: {
                            memoryBytes: '67108864',
                            maximumTasks: 8,
                            cpuQuotaMicros: 50000,
                        },
                        timeoutMs: 30000,
                        maximumAddressBytes: '1073741824',
                        maximumFileBytes: '4096',
                    },
                }),
            ),
        };
    }
}

it('complete named interactive metadata and unchanged foreground profiles decode through the actual RPC result validator', (): void => {
    const validate: (value: unknown) => boolean =
        methodValidators[Method.ConnectorsExecution].result;
    const rule: ConnectorInteractiveInvocationRule = InteractiveFixture.rule();
    expect(validate(InteractiveFixture.status(rule))).toBe(true);
    expect(validate(InteractiveFixture.status(rule.invocation))).toBe(true);
    expect(
        validate(
            InteractiveFixture.status({
                ...rule,
                maximumInputBytes: '0',
                maximumControls: 1,
                controls: [ConnectorInputKind.Data],
            }),
        ),
    ).toBe(true);
    expect(
        validate(
            InteractiveFixture.status({
                ...rule,
                transports: [ConnectorInteractiveTransport.Pty],
                controls: [ConnectorInputKind.Data, ConnectorInputKind.Resize],
                maximumResizes: 16,
            }),
        ),
    ).toBe(true);
});

it('closed shapes and real dependent checks reject impossible, excessive, duplicated or private grants', (): void => {
    const rule: ConnectorInteractiveInvocationRule = InteractiveFixture.rule();
    const status: ConnectorExecutionStatus = InteractiveFixture.status(rule);
    const candidates: readonly unknown[] = [
        { ...rule, maximumInputBytes: '65537' },
        { ...rule, maximumInputBytes: '99999' },
        { ...rule, maximumInputBytes: '00' },
        { ...rule, maximumInputBytes: '-1' },
        { ...rule, maximumInputBytes: 65536 },
        { ...rule, transports: [] },
        { ...rule, transports: ['pipe', 'pipe'] },
        { ...rule, transports: ['shell'] },
        { ...rule, controls: ['data', 'data'] },
        { ...rule, controls: ['end'] },
        { ...rule, transports: ['pty'] },
        { ...rule, controls: ['data', 'resize'], maximumResizes: 1 },
        { ...rule, maximumResizes: 1 },
        {
            ...rule,
            transports: ['pty'],
            controls: ['data', 'resize'],
            maximumControls: 16,
            maximumResizes: 16,
        },
        { ...rule, maximumControls: 257 },
        { ...rule, maximumResizes: 17 },
        { ...rule, maximumControls: 1.5 },
        { ...rule, invocation: { ...rule.invocation, maximumTimeoutMs: 30001 } },
        { ...rule, invocation: { ...rule.invocation, maximumScriptBytes: 0 } },
        { ...rule, invocation: { ...rule.invocation, shell: null, commands: [] } },
        {
            ...rule,
            invocation: {
                ...rule.invocation,
                commands: [rule.invocation.commands[0], rule.invocation.commands[0]],
            },
        },
        {
            ...rule,
            invocation: {
                ...rule.invocation,
                shell: {
                    executableIndex: 0,
                    fixedArguments: ['x'.repeat(1024), 'y'.repeat(1024), 'z'],
                },
            },
        },
        {
            ...rule,
            invocation: {
                ...rule.invocation,
                shell: { executableIndex: 0, fixedArguments: ['\0'] },
            },
        },
        { ...rule, executablePath: '/private/bin/program' },
        { ...rule, invocation: { ...rule.invocation, privateKey: 'forbidden' } },
    ];
    for (const candidate of candidates) {
        const raw: unknown = {
            ...status,
            lanes: status.lanes.map((lane: ConnectorExecutionStatus['lanes'][number]) => ({
                ...lane,
                profile:
                    lane.profile === null
                        ? null
                        : {
                              ...lane.profile,
                              programs: [
                                  { id: 'process', rootIds: ['project'], arguments: [candidate] },
                              ],
                          },
            })),
        };
        expect(methodValidators[Method.ConnectorsExecution].result(raw)).toBe(false);
    }
    const mixed: unknown = {
        ...status,
        lanes: status.lanes.map((lane: ConnectorExecutionStatus['lanes'][number]) => ({
            ...lane,
            profile:
                lane.profile === null
                    ? null
                    : {
                          ...lane.profile,
                          programs: [
                              {
                                  id: 'process',
                                  rootIds: ['project'],
                                  arguments: [rule, { kind: 'choice', values: ['arbitrary'] }],
                              },
                          ],
                      },
        })),
    };
    expect(methodValidators[Method.ConnectorsExecution].result(mixed)).toBe(false);
    const tightenedTimeout: ConnectorExecutionStatus = {
        ...status,
        lanes: status.lanes.map(
            (
                lane: ConnectorExecutionStatus['lanes'][number],
            ): ConnectorExecutionStatus['lanes'][number] => ({
                ...lane,
                profile: lane.profile === null ? null : { ...lane.profile, timeoutMs: 29999 },
            }),
        ),
    };
    expect(methodValidators[Method.ConnectorsExecution].result(tightenedTimeout)).toBe(false);
});

it('the real public websocket client accepts bounded interactive metadata and rejects its invalid replacement without submitting work', async (): Promise<void> => {
    const gateway: TestGateway = new TestGateway();
    let client: NexaClient | null = null;
    let response: ConnectorExecutionStatus = InteractiveFixture.status();
    gateway.handler = (socket: WebSocket, request: Request): void => {
        expect(request.method).toBe(Method.ConnectorsExecution);
        socket.send(JSON.stringify({ id: request.id, ok: true, result: response }));
    };
    try {
        client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
        expect(
            await client.call(Method.ConnectorsExecution, {
                environmentId: response.environmentId,
            }),
        ).toEqual(response);
        response = InteractiveFixture.status({
            ...InteractiveFixture.rule(),
            maximumInputBytes: '65537',
        });
        await expect(
            client.call(Method.ConnectorsExecution, { environmentId: response.environmentId }),
        ).rejects.toThrow('invalid result');
        expect(
            gateway.requests.filter(
                (request: Request): boolean =>
                    request.method !== Method.Connect.valueOf() &&
                    request.method !== Method.ConnectorsExecution.valueOf(),
            ),
        ).toHaveLength(0);
    } finally {
        client?.close();
        await gateway.close();
    }
});
