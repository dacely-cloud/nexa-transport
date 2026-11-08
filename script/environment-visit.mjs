/** Refresh only the authenticated existing-VM visit contract from Nexa's canonical types. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

function record(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Invalid environment visit schema');
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
const temporary = mkdtempSync(join(tmpdir(), 'nexa-environment-visit-'));
try {
    const source = join(temporary, 'EnvironmentVisit.ts');
    const output = join(temporary, 'contract.json');
    writeFileSync(
        source,
        `import type { EnvironmentVisitMethod } from ${JSON.stringify(resolve('../nexa/src/dataplane/EnvironmentVisitTypes.ts'))};\nexport interface Contract extends EnvironmentVisitMethod {}\n`,
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
    const retained = record(current.definitions);
    for (const name of Object.keys(definitions)) {
        if (
            !['EnvironmentVisitResult', 'EnvironmentVisitState', 'Record<string,never>'].includes(
                name,
            )
        ) {
            throw new Error('Unexpected environment visit schema dependency: ' + name);
        }
    }
    const method = record(incoming.properties);
    method.params = { type: 'object', additionalProperties: false };
    const result = record(definitions.EnvironmentVisitResult);
    result.additionalProperties = false;
    retained.EnvironmentVisitResult = result;
    retained.EnvironmentVisitState = record(definitions.EnvironmentVisitState);
    const contract = {
        description: incoming.description,
        type: 'object',
        properties: method,
        required: ['params', 'result'],
    };
    retained.EnvironmentVisitMethod = contract;
    const gateway = record(retained.GatewayMethods);
    record(gateway.properties)['environment.visit'] = contract;
    if (!Array.isArray(gateway.required))
        throw new Error('Invalid gateway method requirement list');
    if (!gateway.required.includes('environment.visit')) gateway.required.push('environment.visit');
    writeFileSync('script/contract.json', JSON.stringify(current, null, 2) + '\n');
    execFileSync(process.execPath, ['script/generate.mjs', '--snapshot-only'], {
        stdio: 'inherit',
    });
} catch (error) {
    for (const [path, bytes] of originals) writeFileSync(path, bytes);
    throw error;
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
