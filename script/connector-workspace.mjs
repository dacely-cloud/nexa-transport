/** Refresh only owned-conversation connector workspace RPCs and their finite conflict code. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { isDeepStrictEqual } from 'node:util';

/** A malformed schema cannot overwrite the preserved public protocol. */
function record(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Invalid connector workspace schema object');
    }
    return value;
}

const files = [
    'script/contract.json',
    'src/protocol/Protocol.ts',
    'src/protocol/SchemaData.ts',
    'src/protocol/Validators.ts',
    'src/protocol/MethodValidators.ts',
];
const originals = new Map(files.map((path) => [path, readFileSync(path)]));
const temporary = mkdtempSync(join(tmpdir(), 'nexa-workspace-contract-'));
try {
    const source = join(temporary, 'ConnectorWorkspaces.ts');
    const output = join(temporary, 'contract.json');
    writeFileSync(
        source,
        `import type {ConnectorWorkspaceGetMethod,ConnectorWorkspaceSelectMethod,ConnectorWorkspaceClearMethod,ConnectorWorkspaceCreateMethod,ConnectorWorkspaceCatalogMethod,ConnectorWorkspaceSelectJointMethod} from ${JSON.stringify(resolve('../nexa/src/dataplane/ConnectorWorkspaceSelectionTypes.ts'))};
import type {ErrorCode} from ${JSON.stringify(resolve('../nexa/src/core/Errors.ts'))};
export interface ConnectorWorkspaceContracts {
 readonly 'connectors.workspace.catalog': ConnectorWorkspaceCatalogMethod;
 readonly 'connectors.workspace.select-joint': ConnectorWorkspaceSelectJointMethod;
 readonly 'connectors.workspace.get': ConnectorWorkspaceGetMethod;
 readonly 'connectors.workspace.select': ConnectorWorkspaceSelectMethod;
 readonly 'connectors.workspace.clear': ConnectorWorkspaceClearMethod;
 readonly 'connectors.workspace.create': ConnectorWorkspaceCreateMethod;
 readonly errorCode: ErrorCode;
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
            'ConnectorWorkspaceContracts',
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
        'connectors.workspace.catalog',
        'connectors.workspace.select-joint',
        'connectors.workspace.get',
        'connectors.workspace.select',
        'connectors.workspace.clear',
        'connectors.workspace.create',
    ];
    if (!isDeepStrictEqual(Object.keys(methods).sort(), [...expected, 'errorCode'].sort())) {
        throw new Error('Unexpected connector workspace method catalog');
    }
    const current = record(JSON.parse(readFileSync('script/contract.json', 'utf8')));
    const retained = record(current.definitions);
    const reachable = new Set();
    function visit(value) {
        if (Array.isArray(value)) {
            for (const item of value) visit(item);
        } else if (value !== null && typeof value === 'object') {
            if (typeof value.$ref === 'string') {
                if (!value.$ref.startsWith('#/definitions/'))
                    throw new Error('Unexpected workspace schema reference');
                const name = value.$ref
                    .slice('#/definitions/'.length)
                    .replaceAll('~1', '/')
                    .replaceAll('~0', '~');
                if (!reachable.has(name)) {
                    reachable.add(name);
                    visit(record(definitions[name]));
                }
            }
            for (const item of Object.values(value)) visit(item);
        }
    }
    for (const name of [...expected, 'errorCode']) visit(methods[name]);
    for (const name of Object.keys(retained)) {
        if (name.startsWith('ConnectorWorkspace') && !reachable.has(name)) {
            delete retained[name];
        }
    }
    for (const name of reachable) {
        const definition = record(definitions[name]);
        if (name.startsWith('ConnectorWorkspace') && definition.type === 'object') {
            definition.additionalProperties = false;
            for (const [field, property] of Object.entries(record(definition.properties))) {
                const value = record(property);
                if (
                    [
                        'expectedRevision',
                        'revision',
                        'policySha256',
                        'filePolicySha256',
                        'executionPolicySha256',
                        'bindingSha256',
                        'jointBindingSha256',
                        'descriptorSha256',
                    ].includes(field)
                ) {
                    value.pattern = '^[a-f0-9]{64}$';
                } else if (
                    [
                        'requestId',
                        'environmentId',
                        'rootId',
                        'fileRootId',
                        'executionRootId',
                    ].includes(field)
                ) {
                    value.pattern = '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$';
                } else if (field === 'bindingRevision') {
                    value.pattern = '^[1-9][0-9]{0,18}$';
                } else if (field === 'entries') {
                    value.maxItems = 128;
                } else if (field === 'sessionId') {
                    value.minLength = 1;
                    value.maxLength = 1024;
                }
            }
        }
        if (name === 'ErrorCode') {
            const before = record(retained[name]);
            if (
                !Array.isArray(before.enum) ||
                !Array.isArray(definition.enum) ||
                !definition.enum.includes('conflict') ||
                !isDeepStrictEqual(
                    [...before.enum].filter((value) => value !== 'conflict').sort(),
                    definition.enum.filter((value) => value !== 'conflict').sort(),
                )
            ) {
                throw new Error('Workspace refresh would change unrelated error codes');
            }
            if (!before.enum.includes('conflict')) before.enum.push('conflict');
            continue;
        }
        if (
            Object.hasOwn(retained, name) &&
            !isDeepStrictEqual(retained[name], definition) &&
            !name.startsWith('ConnectorWorkspace')
        ) {
            throw new Error('Workspace refresh would change another contract: ' + name);
        }
        retained[name] = definition;
    }
    const gateway = record(retained.GatewayMethods);
    const entries = record(gateway.properties);
    if (!Array.isArray(gateway.required)) throw new Error('Exhaustive gateway methods required');
    for (const name of expected) {
        let method = record(methods[name]);
        while (typeof method.$ref === 'string')
            method = record(retained[method.$ref.slice('#/definitions/'.length)]);
        if (
            !Object.hasOwn(record(method.properties), 'params') ||
            !Object.hasOwn(record(method.properties), 'result')
        )
            throw new Error('Incomplete workspace method');
        entries[name] = method;
        if (!gateway.required.includes(name)) gateway.required.push(name);
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
