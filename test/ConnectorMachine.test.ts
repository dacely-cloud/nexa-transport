// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import {
    Method,
    ConnectorExecutionAccess,
    ConnectorExecutionLane,
    ConnectorJobPhase,
    type ConnectorMachineInvocationRule,
    type ConnectorExecutionStatus,
    type ConnectorExecutionOutputView,
} from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

const rule: ConnectorMachineInvocationRule = {
    kind: 'machine-invocation',
    shell: { executableIndex: 0, fixedArguments: ['-c'] },
    commands: [{ alias: 'node', executableIndex: 1 }],
    environment: [{ name: 'APP_MODE', maximumBytes: 128 }],
    maximumCwdBytes: 512,
    maximumEnvironmentBytes: 1024,
    maximumStdinBytes: 1024,
    maximumTimeoutMs: 5000,
    maximumArguments: 32,
    maximumArgumentBytes: 1024,
    maximumArgumentsBytes: 2048,
    maximumScriptBytes: 2048,
};

/** Public metadata only: no private SDK, native path, program digest or signing code enters the package. */
function status(argument: ConnectorMachineInvocationRule): ConnectorExecutionStatus {
    return {
        environmentId: 'environment',
        lanes: Object.values(ConnectorExecutionLane).map((lane) => ({
            lane,
            sequence: '9007199254740993',
            acknowledgedSequence: '9007199254740993',
            online: true,
            profile: {
                revision: '9007199254740993',
                policySha256: 'a'.repeat(64),
                roots: [{ id: 'project', access: ConnectorExecutionAccess.ReadWrite }],
                programs: [{ id: 'machine', rootIds: ['project'], arguments: [argument] }],
                resources: { memoryBytes: '67108864', maximumTasks: 8, cpuQuotaMicros: 50000 },
                timeoutMs: 5000,
                maximumAddressBytes: '1073741824',
                maximumFileBytes: '4096',
            },
        })),
    };
}

it('public result validation accepts complete explicit Machine grants and rejects excessive or private fields', (): void => {
    const validate: (value: unknown) => boolean =
        methodValidators[Method.ConnectorsExecution].result;
    expect(validate(status(rule))).toBe(true);
    for (const invalid of [
        { ...rule, executablePath: '/private/bin/bash' },
        { ...rule, maximumTimeoutMs: 30001 },
        { ...rule, maximumArguments: 1.5 },
        { ...rule, commands: [{ alias: '/bin/node', executableIndex: 0 }] },
        { ...rule, shell: { executableIndex: 9, fixedArguments: [] } },
        {
            ...rule,
            shell: { executableIndex: 0, fixedArguments: [], privateDigest: 'a'.repeat(64) },
        },
        { ...rule, environment: [{ name: 'NERVA_SECRET', maximumBytes: 1 }] },
    ]) {
        expect(validate(status(invalid))).toBe(false);
    }
});

it('partial output requires the exact bounded admission commitment field', (): void => {
    const output: ConnectorExecutionOutputView = {
        environmentId: 'environment',
        id: 'job',
        lane: ConnectorExecutionLane.First,
        sequence: '9007199254740994',
        admissionHash: 'b'.repeat(64),
        phase: ConnectorJobPhase.Queued,
        output: null,
    };
    const validate: (value: unknown) => boolean =
        methodValidators[Method.ConnectorsExecutionOutput].result;
    expect(validate(output)).toBe(true);
    const { admissionHash: _hash, ...missing } = output;
    expect(validate(missing)).toBe(false);
    expect(validate({ ...output, admissionHash: 'b'.repeat(63) })).toBe(false);
});
