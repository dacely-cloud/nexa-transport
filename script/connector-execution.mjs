/** Refresh only connector operation contracts; unrelated protocol and portable-source work stays intact. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { isDeepStrictEqual } from 'node:util';

/** Schema generation is local, but malformed tool output must not overwrite the retained contract. */
function record(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Invalid connector protocol generation object');
    }
    return value;
}

const originals = new Map(
    [
        'script/contract.json',
        'src/protocol/Protocol.ts',
        'src/protocol/SchemaData.ts',
        'src/protocol/Validators.ts',
        'src/protocol/MethodValidators.ts',
    ].map((path) => [path, readFileSync(path)]),
);
const temporary = mkdtempSync(join(tmpdir(), 'nexa-connector-contract-'));
try {
    const source = join(temporary, 'ConnectorExecution.ts');
    const output = join(temporary, 'contract.json');
    const module = resolve('../nexa/src/dataplane/ConnectorExecutionTypes.ts');
    writeFileSync(
        source,
        `import type {ConnectorExecutionMethod,ConnectorExecuteMethod,ConnectorExecutionResultMethod,ConnectorExecutionStopMethod,ConnectorExecutionCurrentJobsMethod} from ${JSON.stringify(module)};
import type {ConnectorExecutionOutputMethod} from ${JSON.stringify(resolve('../nexa/src/dataplane/ConnectorExecutionOutput.ts'))};
import type {ConnectorLinkDenyMethod,ConnectorSubmitMethod,ConnectorResultMethod} from ${JSON.stringify(resolve('../nexa/src/dataplane/ConnectorTypes.ts'))};
export interface ConnectorExecutionContracts {
 readonly 'connectors.link.deny': ConnectorLinkDenyMethod;
 readonly 'connectors.files.submit': ConnectorSubmitMethod;
 readonly 'connectors.files.get': ConnectorResultMethod;
 readonly 'connectors.execution': ConnectorExecutionMethod;
 readonly 'connectors.execution.submit': ConnectorExecuteMethod;
 readonly 'connectors.execution.get': ConnectorExecutionResultMethod;
 readonly 'connectors.execution.output': ConnectorExecutionOutputMethod;
 readonly 'connectors.execution.cancel': ConnectorExecutionStopMethod;
 readonly 'connectors.execution.jobs': ConnectorExecutionCurrentJobsMethod;
}
`,
    );
    const configuration = join(temporary, 'tsconfig.json');
    writeFileSync(
        configuration,
        JSON.stringify({
            extends: resolve('../nexa/tsconfig.base.json'),
            compilerOptions: {
                typeRoots: [resolve('../nexa/node_modules/@types')],
                noUnusedLocals: false,
                noUnusedParameters: false,
            },
            files: [source],
            include: [],
        }),
    );
    execFileSync(
        './node_modules/.bin/typescript-json-schema',
        [
            configuration,
            'ConnectorExecutionContracts',
            '--strictNullChecks',
            '--required',
            '--out',
            output,
        ],
        { stdio: 'inherit' },
    );
    const incoming = record(JSON.parse(readFileSync(output, 'utf8')));
    const definitions = record(incoming.definitions);
    const methods = record(incoming.properties);
    const expected = [
        'connectors.link.deny',
        'connectors.files.submit',
        'connectors.files.get',
        'connectors.execution',
        'connectors.execution.submit',
        'connectors.execution.get',
        'connectors.execution.output',
        'connectors.execution.cancel',
        'connectors.execution.jobs',
    ];
    if (!isDeepStrictEqual(Object.keys(methods).sort(), [...expected].sort())) {
        throw new Error('Unexpected connector execution method catalog');
    }
    for (const name of [
        'ConnectorRemove',
        'ConnectorRemoveResult',
        'ConnectorMkdir',
        'ConnectorMkdirResult',
        'ConnectorMachineCommand',
        'ConnectorMachineShell',
        'ConnectorMachineEnvironmentGrant',
        'ConnectorMachineInvocationRule',
        'ConnectorInteractiveInvocationRule',
        'ConnectorIndependentAuthorization',
        'ConnectorJointAuthorization',
        'ConnectorJointWorkspaceDescriptor',
        'ConnectorJointWorkspaceBinding',
        'ConnectorJointExecutionJournals',
        'ConnectorExecutionJob',
        'ConnectorJob',
        'ConnectorExecutionCurrentJob',
        'ConnectorExecutionStopParams',
        'ConnectorExecutionStopReceipt',
    ]) {
        const definition = record(definitions[name]);
        if (definition.type !== 'object' || !Array.isArray(definition.required)) {
            throw new Error('Incomplete connector removal contract: ' + name);
        }
        definition.additionalProperties = false;
    }
    // Public finite bounds supplement the independently enforced device policy and cross-field checks.
    const fields = (name) => record(record(definitions[name]).properties);
    const integer = (name, key, minimum, maximum) => {
        Object.assign(record(fields(name)[key]), { type: 'integer', minimum, maximum });
    };
    for (const [key, minimum, maximum] of [
        ['maximumCwdBytes', 1, 512],
        ['maximumEnvironmentBytes', 0, 1024],
        ['maximumStdinBytes', 0, 1024],
        ['maximumTimeoutMs', 100, 30000],
        ['maximumArguments', 0, 32],
        ['maximumArgumentBytes', 0, 1024],
        ['maximumArgumentsBytes', 0, 2048],
        ['maximumScriptBytes', 0, 2048],
    ])
        integer('ConnectorMachineInvocationRule', key, minimum, maximum);
    integer('ConnectorMachineCommand', 'executableIndex', 0, 8);
    integer('ConnectorMachineShell', 'executableIndex', 0, 8);
    integer('ConnectorMachineEnvironmentGrant', 'maximumBytes', 0, 1024);
    integer('ConnectorInteractiveInvocationRule', 'maximumControls', 1, 256);
    integer('ConnectorInteractiveInvocationRule', 'maximumResizes', 0, 16);
    Object.assign(record(fields('ConnectorInteractiveInvocationRule').maximumInputBytes), {
        pattern: '^(?:0|[1-9][0-9]{0,4})$',
        maxLength: 5,
    });
    record(fields('ConnectorInteractiveInvocationRule').transports).maxItems = 2;
    record(fields('ConnectorInteractiveInvocationRule').controls).maxItems = 3;
    Object.assign(record(fields('ConnectorMachineCommand').alias), {
        pattern: '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$',
        maxLength: 128,
    });
    Object.assign(record(fields('ConnectorMachineEnvironmentGrant').name), {
        pattern: '^(?!NERVA_)[A-Za-z_][A-Za-z0-9_]{0,63}$',
        maxLength: 64,
    });
    record(fields('ConnectorMachineInvocationRule').commands).maxItems = 9;
    record(fields('ConnectorMachineInvocationRule').environment).maxItems = 16;
    const switches = record(fields('ConnectorMachineShell').fixedArguments);
    switches.maxItems = 16;
    record(switches.items).maxLength = 1024;
    Object.assign(record(fields('ConnectorExecutionOutputView').admissionHash), {
        pattern: '^[a-f0-9]{64}$',
        minLength: 64,
        maxLength: 64,
    });
    for (const name of [
        'ConnectorExecutionJob',
        'ConnectorJob',
        'ConnectorExecutionCurrentJob',
        'ConnectorExecutionStopParams',
        'ConnectorExecutionStopReceipt',
    ]) {
        Object.assign(record(fields(name).admissionHash), {
            pattern: '^[a-f0-9]{64}$',
            minLength: 64,
            maxLength: 64,
        });
    }
    const current = record(JSON.parse(readFileSync('script/contract.json', 'utf8')));
    const retained = record(current.definitions);
    for (const [name, definition] of Object.entries(definitions)) {
        if (
            Object.hasOwn(retained, name) &&
            !isDeepStrictEqual(retained[name], definition) &&
            ![
                'ConnectorFileAction',
                'ConnectorFileRequest',
                'ConnectorFileSuccess',
                'ConnectorRemove',
                'ConnectorRemoveResult',
                'ConnectorArgumentKind',
                'ConnectorArgumentRule',
                'ConnectorExecutionOutputView',
                'ConnectorMachineCommand',
                'ConnectorMachineShell',
                'ConnectorMachineEnvironmentGrant',
                'ConnectorMachineInvocationRule',
                'ConnectorExecutionJob',
                'ConnectorJob',
                'ConnectorExecutionCurrentJob',
                'ConnectorExecutionStopParams',
                'ConnectorExecutionStopReceipt',
            ].includes(name)
        ) {
            throw new Error('Connector generation would change another contract: ' + name);
        }
        retained[name] = definition;
    }
    const gateway = record(retained.GatewayMethods);
    const entries = record(gateway.properties);
    if (
        !Array.isArray(gateway.required) ||
        !gateway.required.every((entry) => typeof entry === 'string')
    ) {
        throw new Error('Missing exhaustive gateway method catalog');
    }
    for (const name of expected) {
        let method = record(methods[name]);
        const visited = new Set();
        while (typeof method.$ref === 'string') {
            if (!method.$ref.startsWith('#/definitions/') || visited.has(method.$ref)) {
                throw new Error('Invalid connector execution reference');
            }
            visited.add(method.$ref);
            method = record(retained[method.$ref.slice('#/definitions/'.length)]);
        }
        const fields = record(method.properties);
        if (!Object.hasOwn(fields, 'params') || !Object.hasOwn(fields, 'result')) {
            throw new Error('Incomplete connector execution method');
        }
        entries[name] = method;
        if (!gateway.required.includes(name)) {
            gateway.required.push(name);
        }
    }
    writeFileSync('script/contract.json', JSON.stringify(current, null, 2) + '\n');
    execFileSync(process.execPath, ['script/generate.mjs', '--snapshot-only'], {
        stdio: 'inherit',
    });
} catch (caught) {
    for (const [path, bytes] of originals) writeFileSync(path, bytes);
    throw caught;
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
