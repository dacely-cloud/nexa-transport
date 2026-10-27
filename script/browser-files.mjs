/** Server-only refresh of the confined managed workspace file browser contracts. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const temporary = mkdtempSync(join(tmpdir(), 'nexa-browser-contract-'));
try {
    const source = join(temporary, 'BrowserContract.ts');
    const types = resolve('../nexa/src/workspace/BrowserFilesTypes.ts');
    const methods = {
        list: ['BrowserFilesListParams', 'BrowserFilesPage'],
        read: ['BrowserFilesReadParams', 'BrowserFilesRead'],
        start: ['BrowserFilesStartParams', 'BrowserFilesUpload'],
        chunk: ['BrowserFilesChunkParams', 'BrowserFilesPosition'],
        finish: ['BrowserFilesUploadParams', 'BrowserFilesDone'],
        cancel: ['BrowserFilesUploadParams', 'BrowserFilesDone'],
        mkdir: ['BrowserFilesTarget', 'BrowserFilesDone'],
    };
    writeFileSync(
        source,
        'export interface BrowserContract {\n' +
            Object.entries(methods)
                .map(
                    ([name, [params, result]]) =>
                        `readonly 'workspace.files.${name}': { readonly params: import(${JSON.stringify(types)}).${params}; readonly result: import(${JSON.stringify(types)}).${result}; };`,
                )
                .join('\n') +
            '\n}\n',
    );
    const config = join(temporary, 'tsconfig.json');
    writeFileSync(
        config,
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
    const output = join(temporary, 'schema.json');
    execFileSync(
        './node_modules/.bin/typescript-json-schema',
        [config, 'BrowserContract', '--strictNullChecks', '--required', '--out', output],
        { stdio: 'inherit' },
    );
    const incoming = JSON.parse(readFileSync(output, 'utf8'));
    const current = JSON.parse(readFileSync('script/contract.json', 'utf8'));
    for (const [name, definition] of Object.entries(incoming.definitions)) {
        if (!name.startsWith('BrowserFiles'))
            throw new Error('Unexpected browser definition: ' + name);
        if (definition.type === 'object') {
            definition.additionalProperties = false;
            for (const [field, property] of Object.entries(definition.properties)) {
                if (['assignment', 'uploadId'].includes(field)) property.pattern = '^[a-f0-9]{64}$';
                if (['path'].includes(field)) property.maxLength = 4096;
                if (['cursor', 'revision'].includes(field)) property.maxLength = 256;
                if (['offset', 'byteLength'].includes(field)) {
                    property.pattern = '^(0|[1-9][0-9]{0,15})$';
                    property.maxLength = 16;
                }
                if (field === 'data') property.maxLength = 1398104;
                if (field === 'entries') property.maxItems = 128;
                if (field === 'chunkBytes') {
                    property.minimum = 1;
                    property.maximum = 1048576;
                }
            }
        }
        current.definitions[name] = definition;
    }
    const gateway = current.definitions.GatewayMethods;
    for (const name of Object.keys(methods)) {
        const key = 'workspace.files.' + name;
        if (incoming.properties[key] === undefined) throw new Error('Missing browser method');
        gateway.properties[key] = incoming.properties[key];
        if (!gateway.required.includes(key)) gateway.required.push(key);
    }
    writeFileSync('script/contract.json', JSON.stringify(current, null, 2) + '\n');
    execFileSync(process.execPath, ['script/generate.mjs', '--snapshot-only'], {
        stdio: 'inherit',
    });
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
