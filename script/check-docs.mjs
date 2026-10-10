import { existsSync, readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

// Shared setup and application-owned inputs described by the usage guide.
const setup = new Map([
    ['NexaClient', "import { NexaClient } from 'nexa-transport';"],
    ['Method', "import { Method } from 'nexa-transport/protocol';"],
    ['EventName', "import { EventName } from 'nexa-transport/events';"],
    ['NexaMedia', "import { NexaMedia } from 'nexa-transport/media';"],
    ['client', "declare const client: import('nexa-transport').NexaClient;"],
    ['sessionKey', 'declare const sessionKey: string;'],
    ['event', "declare const event: import('nexa-transport/protocol').WireTurnEvent;"],
    ['imageBytes', 'declare const imageBytes: Uint8Array<ArrayBuffer>;'],
    ['pdfBytes', 'declare const pdfBytes: Uint8Array<ArrayBuffer>;'],
    ['microphonePcm', 'declare const microphonePcm: Uint8Array<ArrayBuffer>;'],
    ['videoFile', 'declare const videoFile: File;'],
    ['frameFiles', 'declare const frameFiles: readonly File[];'],
]);
const sources = new Map();
const labels = new Map();
const failures = [];
const anchors = new Map();
const packageExports = JSON.parse(readFileSync('package.json', 'utf8')).exports;
const exportIndex = readFileSync('docs/exports.md', 'utf8');
for (const key of Object.keys(packageExports)) {
    const specifier = key === '.' ? 'nexa-transport' : `nexa-transport${key.slice(1)}`;
    if (!exportIndex.includes(`\`${specifier}\``)) {
        failures.push(`docs/exports.md: missing public entry point ${specifier}`);
    }
}
for (const file of [
    'README.md',
    ...readdirSync('docs')
        .filter((name) => name.endsWith('.md'))
        .sort()
        .map((name) => `docs/${name}`),
]) {
    let index = 0;
    const markdown = readFileSync(file, 'utf8');
    for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
        const target = match[1];
        if (target.includes(':')) continue;
        const [relativePath, anchor] = target.split('#');
        const path = relativePath ? resolve(dirname(file), relativePath) : resolve(file);
        if (!existsSync(path)) {
            failures.push(`${file}: missing link target ${target}`);
            continue;
        }
        if (!anchor || !path.endsWith('.md')) continue;
        if (!anchors.has(path)) {
            const counts = new Map();
            const ids = new Set();
            for (const heading of readFileSync(path, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)) {
                const base = heading[1]
                    .toLowerCase()
                    .replace(/[^\p{L}\p{N}_ -]/gu, '')
                    .replaceAll(' ', '-');
                const count = counts.get(base) ?? 0;
                ids.add(count === 0 ? base : `${base}-${count}`);
                counts.set(base, count + 1);
            }
            anchors.set(path, ids);
        }
        if (!anchors.get(path).has(anchor)) {
            failures.push(`${file}: missing heading link ${target}`);
        }
    }
    for (const match of markdown.matchAll(/\bnexa-transport\/([a-z][a-z0-9-]*)/g)) {
        if (!Object.hasOwn(packageExports, `./${match[1]}`)) {
            failures.push(`${file}: undeclared package import ${match[0]}`);
        }
    }
    for (const match of markdown.matchAll(/```(?:ts|typescript)\n([\s\S]*?)```/g)) {
        index++;
        const code = match[1];
        const path = resolve(`.doc-example-${sources.size}.ts`);
        const declared = new Set(
            [...code.matchAll(/(?:const|let|class)\s+(\w+)/g)].map((match) => match[1]),
        );
        for (const match of code.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}/g)) {
            for (const name of match[1].split(','))
                declared.add(name.trim().replace(/^type\s+/, ''));
        }
        for (const match of code.matchAll(/\b(?:const|let)\s+(\w+)\s*=/g)) {
            failures.push(`${file} example ${index}: missing variable type for ${match[1]}`);
        }
        const prelude = [...setup]
            .filter(([name]) => !declared.has(name))
            .map(([, value]) => value)
            .join('\n');
        sources.set(path, `${prelude}\n${code}\nexport {};\n`);
        labels.set(path, `${file} example ${index}`);
    }
}
const directory = mkdtempSync(resolve('.docs-check-'));
try {
    let index = 0;
    for (const [path, source] of sources) {
        writeFileSync(`${directory}/example-${index}.ts`, source);

        index++;
    }
    writeFileSync(
        `${directory}/tsconfig.json`,
        JSON.stringify({
            extends: '../tsconfig.json',
            compilerOptions: {
                noUnusedLocals: false,
                noUnusedParameters: false,
                noEmit: true,
                paths: Object.fromEntries(
                    Object.entries(packageExports).map(([key, entry]) => [
                        key === '.' ? 'nexa-transport' : `nexa-transport${key.slice(1)}`,
                        [
                            resolve(
                                entry.types.replace('./dist/', './src/').replace(/\.d\.ts$/, '.ts'),
                            ),
                        ],
                    ]),
                ),
            },
            include: ['./*.ts'],
        }),
    );
    const result = spawnSync(
        process.execPath,
        ['node_modules/typescript/bin/tsc', '-p', `${directory}/tsconfig.json`],
        { encoding: 'utf8' },
    );
    if (result.status !== 0) {
        let output = result.error?.message ?? `${result.stdout}${result.stderr}`;
        [...labels.values()].forEach((label, index) => {
            output = output.replaceAll(`example-${index}.ts`, label);
        });
        failures.push(output);
    }
} finally {
    rmSync(directory, { recursive: true, force: true });
}
if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
} else {
    console.log(`Checked ${sources.size} TypeScript documentation examples.`);
}
