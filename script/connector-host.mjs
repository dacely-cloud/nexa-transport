/** Refresh only full-host connector RPCs while preserving unrelated public contracts. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { isDeepStrictEqual } from 'node:util';

/** A malformed schema cannot overwrite the preserved public protocol. */
function record(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Invalid connector host schema object');
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
const temporary = mkdtempSync(join(tmpdir(), 'nexa-host-contract-'));
try {
    const source = join(temporary, 'ConnectorHosts.ts');
    const output = join(temporary, 'contract.json');
    writeFileSync(
        source,
        `import type {ConnectorHostStatusMethod,ConnectorHostSubmitMethod,ConnectorHostResultMethod} from ${JSON.stringify(resolve('../nexa/src/dataplane/ConnectorHostTypes.ts'))};
import type {ConnectorContextCheckMethod} from ${JSON.stringify(resolve('../nexa/src/dataplane/ConnectorContextCheckTypes.ts'))};
export interface ConnectorHostContracts {
 readonly 'connectors.host.status': ConnectorHostStatusMethod;
 readonly 'connectors.host.submit': ConnectorHostSubmitMethod;
 readonly 'connectors.host.result': ConnectorHostResultMethod;
 readonly 'connectors.context.check': ConnectorContextCheckMethod;
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
            'ConnectorHostContracts',
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
        'connectors.host.status',
        'connectors.host.submit',
        'connectors.host.result',
        'connectors.context.check',
    ];
    if (!isDeepStrictEqual(Object.keys(methods).sort(), [...expected].sort())) {
        throw new Error('Unexpected connector host method catalog');
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
                    throw new Error('Unexpected host schema reference');
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
    for (const name of expected) visit(methods[name]);
    const summary = structuredClone(record(definitions.ConnectorHostProfile));
    delete summary.properties.directory;
    summary.required = summary.required.filter((name) => name !== 'directory');
    definitions.ConnectorHostSummary = summary;
    reachable.add('ConnectorHostSummary');
    for (const name of Object.keys(retained)) {
        if (
            (name.startsWith('ConnectorHost') || name.startsWith('ConnectorContext')) &&
            !reachable.has(name)
        ) {
            delete retained[name];
        }
    }
    for (const name of reachable) {
        const definition = record(definitions[name]);
        const prior = retained[name];
        if (
            prior !== undefined &&
            Array.isArray(record(prior).enum) &&
            Array.isArray(definition.enum)
        ) {
            const previousValues = record(prior).enum;
            const supported = new Set(definition.enum);
            definition.enum = [
                ...previousValues.filter((value) => supported.has(value)),
                ...definition.enum.filter((value) => !previousValues.includes(value)),
            ];
        }
        if (
            (name.startsWith('ConnectorHost') || name.startsWith('ConnectorContext')) &&
            definition.type === 'object'
        ) {
            definition.additionalProperties = false;
            for (const [field, property] of Object.entries(record(definition.properties))) {
                const value = record(property);
                if (['environmentId', 'requestId', 'id', 'jobId'].includes(field)) {
                    value.pattern = '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$';
                } else if (field === 'grantId') {
                    value.pattern = '^[a-f0-9]{64}$';
                } else if (['version', 'knownVersion'].includes(field)) {
                    value.pattern = '^[a-f0-9]{64}$';
                } else if (
                    [
                        'sequence',
                        'acknowledgedSequence',
                        'previousSequence',
                        'serverNowMs',
                        'nextTransitionAtMs',
                    ].includes(field)
                ) {
                    value.pattern = '^(0|[1-9][0-9]{0,18})$';
                } else if (field === 'grantRevision') {
                    value.pattern = '^[1-9][0-9]{0,18}$';
                } else if (field === 'directory') {
                    value.minLength = 1;
                    value.maxLength = 4096;
                } else if (field === 'tools') {
                    value.maxItems = definitions.ConnectorHostTool.enum.length;
                } else if (field === 'argumentsJson') {
                    value.maxLength = 65536;
                } else if (field === 'resultJson') {
                    value.maxLength = 131072;
                }
            }
        }
        if (
            Object.hasOwn(retained, name) &&
            !isDeepStrictEqual(retained[name], definition) &&
            !name.startsWith('ConnectorHost') &&
            !name.startsWith('ConnectorContext')
        ) {
            throw new Error('Host refresh would change another contract: ' + name);
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
            throw new Error('Incomplete host method');
        entries[name] = method;
        if (!gateway.required.includes(name)) gateway.required.push(name);
    }
    retained.ConnectorInventoryView.properties.host = {
        anyOf: [{ $ref: '#/definitions/ConnectorHostSummary' }, { type: 'null' }],
    };
    if (!retained.ConnectorInventoryView.required.includes('host'))
        retained.ConnectorInventoryView.required.push('host');
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
