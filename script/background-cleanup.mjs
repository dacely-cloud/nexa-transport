/** Refresh the minimal native cleanup receipt without changing unrelated public contracts. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const paths = [
    'script/contract.json',
    'src/protocol/Protocol.ts',
    'src/protocol/SchemaData.ts',
    'src/protocol/Validators.ts',
    'src/protocol/MethodValidators.ts',
];
const receiptNames = [
    'CommandExecutionReceipt',
    'CommandExecutionSnapshot',
    'CommandExecutionCleanupUnconfirmed',
];
const originals = new Map(paths.map((path) => [path, readFileSync(path)]));
try {
    const contract = JSON.parse(readFileSync('script/contract.json', 'utf8'));
    const before = structuredClone(contract);
    const definitions = contract.definitions;
    const background = definitions?.BackgroundProcess;
    const prior = definitions?.CommandExecutionSnapshot ?? definitions?.CommandExecutionReceipt;
    if (
        background?.type !== 'object' ||
        background.properties?.running?.type !== 'boolean' ||
        !Array.isArray(background.required) ||
        background.required.includes('cleanupUnconfirmed') ||
        prior?.type !== 'object' ||
        prior.properties?.command?.type !== 'string' ||
        prior.properties?.cwd?.type !== 'string' ||
        prior.properties?.running?.type !== 'boolean' ||
        !Array.isArray(prior.required) ||
        prior.required.includes('cleanupUnconfirmed')
    ) {
        throw new Error('Current normal execution and background process contracts required');
    }
    const normal = structuredClone(prior);
    normal.description =
        'A normal host-produced command snapshot may describe a running program or observed termination.';
    normal.properties.cleanupUnconfirmed = {
        description: 'An explicit false value never supplies native cleanup uncertainty metadata.',
        type: 'boolean',
        const: false,
    };
    background.properties.cleanupUnconfirmed = {
        description: 'Stop remains available because native cleanup has not been confirmed.',
        type: 'boolean',
    };
    definitions.CommandExecutionSnapshot = normal;
    definitions.CommandExecutionCleanupUnconfirmed = {
        description:
            'Unresolved native ownership preserves only the exact actionable handle, without command arguments or fabricated exit evidence.',
        type: 'object',
        properties: {
            cleanupUnconfirmed: { type: 'boolean', const: true },
            processId: {
                type: 'string',
                minLength: 1,
                maxLength: 128,
                pattern: '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$',
            },
            running: { type: 'boolean', const: true },
            remote: { type: 'boolean', const: true },
            exitCode: { type: 'null' },
            signal: { type: 'null' },
        },
        required: ['cleanupUnconfirmed', 'processId', 'running', 'remote', 'exitCode', 'signal'],
        additionalProperties: false,
    };
    definitions.CommandExecutionReceipt = {
        description: 'Native cleanup uncertainty remains distinct from a normal command snapshot.',
        anyOf: [
            { $ref: '#/definitions/CommandExecutionSnapshot' },
            { $ref: '#/definitions/CommandExecutionCleanupUnconfirmed' },
        ],
    };
    delete before.definitions.BackgroundProcess.properties.cleanupUnconfirmed;
    for (const name of receiptNames) delete before.definitions[name];
    writeFileSync('script/contract.json', JSON.stringify(contract, null, 2) + '\n');
    execFileSync(process.execPath, ['script/generate.mjs', '--snapshot-only'], {
        stdio: 'inherit',
    });
    const after = JSON.parse(readFileSync('script/contract.json', 'utf8'));
    delete after.definitions.BackgroundProcess.properties.cleanupUnconfirmed;
    for (const name of receiptNames) delete after.definitions[name];
    if (!isDeepStrictEqual(before, after)) {
        throw new Error('Cleanup uncertainty refresh changed an unrelated protocol contract');
    }
} catch (caught) {
    for (const [path, bytes] of originals) writeFileSync(path, bytes);
    throw caught;
}
