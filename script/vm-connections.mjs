/** Refresh only the account connection contracts and chat model selection from Nexa's canonical types. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

function record(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Invalid account connection schema');
    }
    return value;
}

/** Closes every object shape so unknown fields are refused rather than ignored. */
function close(schema) {
    if (schema === null || typeof schema !== 'object') return schema;
    if (Array.isArray(schema)) return schema.map(close);
    const closed = Object.fromEntries(
        Object.entries(schema).map(([key, value]) => [key, close(value)]),
    );
    if (closed.type === 'object' && closed.properties !== undefined) {
        closed.additionalProperties = false;
    }
    return closed;
}

const methods = {
    'connections.applications.check': 'ConnectionApplicationsCheckMethod',
    'connections.applications.setup': 'ConnectionApplicationsSetupMethod',
    'connections.tools.status': 'ConnectionToolsStatusMethod',
    'connections.tools.install': 'ConnectionToolsInstallMethod',
    'connections.tools.remove': 'ConnectionToolsRemoveMethod',
    'connections.models.list': 'ConnectionModelsListMethod',
};
const retiredMethods = ['workflows.runs.applications.check', 'workflows.runs.applications.setup'];
const retiredDefinitions = ['WorkflowApplicationRequest', 'WorkflowApplicationSetupRequest'];
const owned = [
    'ChatModelChoice',
    'ChatModelSelection',
    'ChatModelSource',
    'ChatModelsPage',
    'ConnectionApplicationSetupRequest',
    'ConnectionApplicationsPage',
    'LicensedTool',
    'LicensedToolRequest',
    'LicensedToolState',
    'LicensedToolStatus',
    'LicensedToolsPage',
];
const shared = [
    'ApplicationConnection',
    'TerminalStatus',
    'WorkflowApplication',
    'WorkflowApplicationStatus',
    'WorkflowTerminalSnapshot',
    'Record<string,never>',
];
const files = [
    'script/contract.json',
    'src/protocol/Protocol.ts',
    'src/protocol/SchemaData.ts',
    'src/protocol/Validators.ts',
    'src/protocol/MethodValidators.ts',
];
const originals = new Map(files.map((path) => [path, readFileSync(path)]));
const temporary = mkdtempSync(join(tmpdir(), 'nexa-vm-connections-'));
try {
    const source = join(temporary, 'Connections.ts');
    const output = join(temporary, 'contract.json');
    writeFileSync(
        source,
        `import type { ChatModelSelection, ${Object.values(methods).join(', ')} } from ${JSON.stringify(resolve('../nexa/src/connections/ConnectionTypes.ts'))};\n` +
            `export interface Contract {\n    readonly selection: ChatModelSelection;\n${Object.entries(
                methods,
            )
                .map(([method, name]) => `    readonly ${JSON.stringify(method)}: ${name};`)
                .join('\n')}\n}\n`,
    );
    execFileSync('./node_modules/.bin/typescript-json-schema', [
        source,
        'Contract',
        '--strictNullChecks',
        '--required',
        '--out',
        output,
    ]);
    const incoming = record(JSON.parse(readFileSync(output, 'utf8')));
    const definitions = record(incoming.definitions);
    const current = record(JSON.parse(readFileSync('script/contract.json', 'utf8')));
    const before = structuredClone(current);
    const retained = record(current.definitions);
    const methodNames = Object.values(methods);
    for (const name of Object.keys(definitions)) {
        if (!owned.includes(name) && !shared.includes(name) && !methodNames.includes(name)) {
            throw new Error('Unexpected account connection schema dependency: ' + name);
        }
        if (shared.includes(name) && name !== 'Record<string,never>') {
            if (!isDeepStrictEqual(retained[name], definitions[name])) {
                throw new Error('Shared workflow contract changed: ' + name);
            }
        }
    }
    for (const name of owned) {
        if (definitions[name] !== undefined) {
            retained[name] = close(definitions[name]);
        }
    }
    const gateway = record(retained.GatewayMethods);
    const gatewayMethods = record(gateway.properties);
    if (!Array.isArray(gateway.required)) {
        throw new Error('Invalid gateway method requirement list');
    }
    for (const [method, name] of Object.entries(methods)) {
        const contract = structuredClone(record(definitions[name]));
        const properties = record(contract.properties);
        if (record(properties.params).$ref === '#/definitions/Record<string,never>') {
            properties.params = { type: 'object', additionalProperties: false };
        }
        retained[name] = contract;
        gatewayMethods[method] = contract;
        if (!gateway.required.includes(method)) gateway.required.push(method);
    }
    for (const method of retiredMethods) {
        delete gatewayMethods[method];
        gateway.required = gateway.required.filter((entry) => entry !== method);
    }
    for (const name of retiredDefinitions) delete retained[name];
    for (const name of ['AskParams', 'StreamParams']) {
        record(record(retained[name]).properties).model = {
            $ref: '#/definitions/ChatModelSelection',
            description:
                'A model the user connected with their own key or subscription; absent selects the Nexa model.',
        };
    }
    if (JSON.stringify(current).includes('#/definitions/WorkflowApplicationRequest')) {
        throw new Error(
            'A retained contract still references the retired workflow application request',
        );
    }
    writeFileSync('script/contract.json', JSON.stringify(current, null, 2) + '\n');
    execFileSync(process.execPath, ['script/generate.mjs', '--snapshot-only'], {
        stdio: 'inherit',
    });
    const after = record(JSON.parse(readFileSync('script/contract.json', 'utf8')));
    const changed = new Set([
        ...owned,
        ...methodNames,
        ...retiredDefinitions,
        'GatewayMethods',
        'AskParams',
        'StreamParams',
    ]);
    for (const name of new Set([
        ...Object.keys(before.definitions),
        ...Object.keys(after.definitions),
    ])) {
        if (
            !changed.has(name) &&
            !isDeepStrictEqual(before.definitions[name], after.definitions[name])
        ) {
            throw new Error('Account connection refresh changed an unrelated contract: ' + name);
        }
    }
} catch (error) {
    for (const [path, bytes] of originals) writeFileSync(path, bytes);
    throw error;
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
