/** Refresh one progress field without regenerating unrelated dirty protocol contracts. */
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
const originals = new Map(paths.map((path) => [path, readFileSync(path)]));
try {
    const contract = JSON.parse(readFileSync('script/contract.json', 'utf8'));
    const before = structuredClone(contract);
    delete before.definitions.ToolProgress.properties.outputSnapshot;
    const properties = contract.definitions?.ToolProgress?.properties;
    if (properties === undefined || properties.text?.type !== 'string')
        throw new Error('Current complete ToolProgress contract required');
    properties.outputSnapshot = {
        description:
            'Complete replacement output, including empty output; bounded to 65536 UTF-16 code units and therefore at most 196608 UTF-8 bytes.',
        type: 'string',
        maxLength: 65536,
    };
    writeFileSync('script/contract.json', JSON.stringify(contract, null, 2) + '\n');
    execFileSync(process.execPath, ['script/generate.mjs', '--snapshot-only'], {
        stdio: 'inherit',
    });
    const after = JSON.parse(readFileSync('script/contract.json', 'utf8'));
    delete after.definitions.ToolProgress.properties.outputSnapshot;
    if (!isDeepStrictEqual(before, after))
        throw new Error('Progress refresh changed an unrelated protocol contract');
} catch (caught) {
    for (const [path, bytes] of originals) writeFileSync(path, bytes);
    throw caught;
}
