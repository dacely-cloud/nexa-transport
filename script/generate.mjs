/** Server-only protocol snapshot generator. Run after changing Nexa's gateway contracts. */
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';

execFileSync(process.execPath, ['script/workflows.ts'], { stdio: 'inherit' });
mkdirSync('src/graphs', { recursive: true });
writeFileSync('src/graphs/ChatGraph.ts', readFileSync('../nexa/src/graphs/ChatGraph.ts', 'utf8'));
// Native capture validation is portable and owned by Nexa.
writeFileSync(
    'src/reverse/ControlFlow.ts',
    readFileSync('../nexa/src/reverse/ControlFlow.ts', 'utf8'),
);

/** Pixel metrics have one portable validator shared with the native workers. */
const pixelTypes = readFileSync('../nexa/src/reverse/BrowserScreenshotComparisonTypes.ts', 'utf8');
const pixelStatus = pixelTypes.match(/export const BrowserPixelStatus = [\s\S]*?as const;/u)?.[0];
if (pixelStatus === undefined) throw new Error('Native pixel status declaration is missing');
const pixelReceipt = readFileSync('../nexa/src/reverse/BrowserPixelReceipt.ts', 'utf8');
const pixelImport = /import \{[\s\S]*?\} from '\.\/BrowserScreenshotComparisonTypes';/u;
if (!pixelImport.test(pixelReceipt)) throw new Error('Native pixel receipt import changed');
writeFileSync(
    'src/reverse/BrowserPixelReceipt.ts',
    pixelReceipt.replace(
        pixelImport,
        "import type { BrowserPixelComparison, BrowserPixelBounds } from '../protocol/Protocol.js';\n\n" +
            pixelStatus,
    ),
);

/** Storage validation is portable and shared with native capture/archive publication. */
const storageTypes = readFileSync('../nexa/src/reverse/BrowserStorageTypes.ts', 'utf8');
const storageEnums = ['BrowserStorageGroup', 'BrowserStorageKind']
    .map((name) => {
        const declaration = storageTypes.match(
            new RegExp('export const ' + name + ' = [\\s\\S]*?as const;', 'u'),
        )?.[0];
        if (declaration === undefined)
            throw new Error('Native storage declaration is missing: ' + name);
        return (
            '/** Native storage enumeration. */\n' +
            declaration +
            '\n/** Native storage selection type. */\nexport type ' +
            name +
            ' = (typeof ' +
            name +
            ')[keyof typeof ' +
            name +
            '];'
        );
    })
    .join('\n\n');
const storageReceipt = readFileSync('../nexa/src/reverse/BrowserStorageReceipt.ts', 'utf8');
const storageImport = /import \{[\s\S]*?\} from '\.\/BrowserStorageTypes';/u;
if (!storageImport.test(storageReceipt)) throw new Error('Native storage receipt import changed');
writeFileSync(
    'src/reverse/BrowserStorageReceipt.ts',
    storageReceipt.replace(
        storageImport,
        "import type { BrowserStorageMetadata, BrowserStorageCoverage, BrowserStorageQuota, BrowserStorageRow, BrowserStoragePage } from '../protocol/Protocol.js';\n\n" +
            storageEnums +
            '\n\n/** Host captures remain separate from paged wire responses. */\nexport interface BrowserStorageCapture { readonly metadata: BrowserStorageMetadata; readonly rows: readonly BrowserStorageRow[]; }',
    ),
);

/** Comparison validators share native portable source; generated wire types contain no complete capture bodies. */
const comparisonTypes = readFileSync(
    '../nexa/src/reverse/BrowserStorageComparisonTypes.ts',
    'utf8',
);
const comparisonEnums = [
    'BrowserStorageCompareStatus',
    'BrowserStorageCompareMode',
    'BrowserStorageChangeKind',
]
    .map((name) => {
        const declaration = comparisonTypes.match(
            new RegExp('export const ' + name + ' = [\\s\\S]*?as const;', 'u'),
        )?.[0];
        if (declaration === undefined)
            throw new Error('Native comparison enumeration is missing: ' + name);
        return (
            '/** Native comparison enumeration. */\n' +
            declaration +
            '\n/** Native comparison selection type. */\nexport type ' +
            name +
            ' = (typeof ' +
            name +
            ')[keyof typeof ' +
            name +
            '];'
        );
    })
    .join('\n\n');
writeFileSync(
    'src/reverse/BrowserStorageComparisonDefinitions.ts',
    "// SPDX-FileCopyrightText: 2026 Nexa contributors\n// SPDX-License-Identifier: Apache-2.0\n\nimport type { BrowserStorageComparison, BrowserStorageChange } from '../protocol/Protocol.js';\n\n" +
        comparisonEnums +
        '\n\n/** Complete host reports stay separate from paged wire contracts. */\nexport interface BrowserStorageComparisonCapture { readonly comparison: BrowserStorageComparison; readonly changes: readonly BrowserStorageChange[]; }\n',
);
/** Native imports are partitioned without adding unused generated bindings. */
function portableComparisonImport(
    typeOnly,
    members,
    valuesModule,
    captureModule = './BrowserStorageComparisonDefinitions.js',
) {
    const values = [];
    const types = [];
    const captures = [];
    for (const member of members
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)) {
        const isType = typeOnly !== undefined || member.startsWith('type ');
        const binding = member.replace(/^type /u, '');
        if (
            binding === 'BrowserStorageComparisonCapture' ||
            binding === 'BrowserWebMcpCapture' ||
            binding === 'BrowserWebMcpTool'
        )
            captures.push(binding);
        else if (isType) types.push(binding);
        else values.push(binding);
    }
    return [
        values.length ? 'import { ' + values.join(', ') + " } from '" + valuesModule + "';" : '',
        types.length
            ? 'import type { ' + types.join(', ') + " } from '../protocol/Protocol.js';"
            : '',
        captures.length
            ? 'import type { ' + captures.join(', ') + " } from '" + captureModule + "';"
            : '',
    ]
        .filter(Boolean)
        .join('\n');
}
for (const name of [
    'BrowserStorageComparisonValues',
    'BrowserStorageComparisonPolicy',
    'BrowserStorageComparisonReceipt',
    'BrowserStorageChangeReceipt',
]) {
    let source = readFileSync('../nexa/src/reverse/' + name + '.ts', 'utf8');
    source = source.replace(
        /import (type )?\{([^}]*)\} from '\.\/BrowserCaptureTypes';/gu,
        (_match, typeOnly, members) =>
            portableComparisonImport(typeOnly, members, '../protocol/Protocol.js'),
    );
    source = source.replace(
        /import (type )?\{([^}]*)\} from '\.\/BrowserStorageTypes';/gu,
        (_match, typeOnly, members) =>
            portableComparisonImport(typeOnly, members, './BrowserStorageReceipt.js'),
    );
    source = source.replace(
        /import (type )?\{([^}]*)\} from '\.\/BrowserStorageComparisonTypes';/gu,
        (_match, typeOnly, members) =>
            portableComparisonImport(typeOnly, members, './BrowserStorageComparisonDefinitions.js'),
    );
    source = source.replace(
        /from '(\.\/[^']+)'/gu,
        (_match, path) => "from '" + (path.endsWith('.js') ? path : path + '.js') + "'",
    );
    writeFileSync('src/reverse/' + name + '.ts', source);
}

/** Passive WebMCP validators retain the exact native authority and value-exclusion rules. */
const webMcpTypes = readFileSync('../nexa/src/reverse/BrowserWebMcpTypes.ts', 'utf8');
const webMcpDirectoryTypes = readFileSync(
    '../nexa/src/reverse/BrowserWebMcpDirectoryTypes.ts',
    'utf8',
);
const webMcpEnums = ['BrowserSchemaType', 'BrowserWebMcpDeclaration', 'BrowserWebMcpView']
    .map((name) => {
        const source = name === 'BrowserWebMcpView' ? webMcpDirectoryTypes : webMcpTypes;
        const declaration = source.match(
            new RegExp('export const ' + name + ' = [\\s\\S]*?as const;', 'u'),
        )?.[0];
        if (declaration === undefined)
            throw new Error('Native WebMCP enumeration is missing: ' + name);
        return (
            '/** Native passive WebMCP enumeration. */\n' +
            declaration +
            '\n/** Native passive WebMCP selection type. */\nexport type ' +
            name +
            ' = (typeof ' +
            name +
            ')[keyof typeof ' +
            name +
            '];'
        );
    })
    .join('\n\n');
writeFileSync(
    'src/reverse/BrowserWebMcpDefinitions.ts',
    '// SPDX-FileCopyrightText: 2026 Nexa contributors\n// SPDX-License-Identifier: Apache-2.0\n\n' +
        "import type { BrowserWebMcpMetadata, BrowserWebMcpDescriptor, BrowserSchemaProperty } from '../protocol/Protocol.js';\n\n" +
        webMcpEnums +
        '\n\n/** Host-only originals are separate from bounded wire pages. */\nexport interface BrowserWebMcpTool extends BrowserWebMcpDescriptor { readonly properties: readonly BrowserSchemaProperty[]; }\n' +
        '\n/** Complete captures are validated without publishing their arrays in progress. */\nexport interface BrowserWebMcpCapture { readonly metadata: BrowserWebMcpMetadata; readonly tools: readonly BrowserWebMcpTool[]; }\n',
);
for (const name of ['BrowserWebMcpReceipt', 'BrowserWebMcpPageReceipt']) {
    let source = readFileSync('../nexa/src/reverse/' + name + '.ts', 'utf8');
    source = source.replace(
        /import (type )?\{([^}]*)\} from '\.\/(?:BrowserWebMcpTypes|BrowserWebMcpDirectoryTypes|BrowserCaptureTypes)';/gu,
        (_match, typeOnly, members) =>
            portableComparisonImport(
                typeOnly,
                members,
                './BrowserWebMcpDefinitions.js',
                './BrowserWebMcpDefinitions.js',
            ),
    );
    source = source.replace(
        /from '(\.\/[^']+)'/gu,
        (_match, path) => "from '" + (path.endsWith('.js') ? path : path + '.js') + "'",
    );
    writeFileSync('src/reverse/' + name + '.ts', source);
}

const temporary = mkdtempSync(join(tmpdir(), 'nexa-contract-'));
let schema;
try {
    const output = join(temporary, 'contract.json');
    execFileSync('./node_modules/.bin/typescript-json-schema', [
        'script/Contract.ts',
        'Contract',
        '--ignoreErrors',
        '--strictNullChecks',
        '--required',
        '--out',
        output,
    ]);
    schema = JSON.parse(readFileSync(output, 'utf8'));
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
/** Keep arbitrary JSON fields fully typed and structurally validated. */
schema.definitions.JsonValue = {
    anyOf: [
        { type: 'null' },
        { type: 'boolean' },
        { type: 'string' },
        { type: 'number' },
        { type: 'array', items: { $ref: '#/definitions/JsonValue' } },
        { type: 'object', additionalProperties: { $ref: '#/definitions/JsonValue' } },
    ],
};
function normalize(node) {
    if (Array.isArray(node)) {
        node.forEach(normalize);
        return;
    }
    if (!node || typeof node !== 'object') return;
    if (Object.keys(node).length === 0) {
        node.$ref = '#/definitions/JsonValue';
        return;
    }
    for (const value of Object.values(node)) normalize(value);
}
/** Empty schemas represent unknown fields in the server's types. */
for (const definition of Object.values(schema.definitions)) normalize(definition);
/** Preserve mapped dictionaries the upstream schema generator leaves unexpanded. */
for (const [name, definition] of Object.entries(schema.definitions)) {
    if (name.startsWith('Record<string,')) {
        const value = name.slice(14, -1);
        definition.additionalProperties =
            value === 'never'
                ? false
                : value === 'Scope'
                  ? { $ref: '#/definitions/Scope' }
                  : value === 'unknown'
                    ? { $ref: '#/definitions/JsonValue' }
                    : value.includes('|')
                      ? { anyOf: value.split('|').map((type) => ({ type })) }
                      : { type: value };
    }
}
/** Uint8Array serializes to indexed JSON objects on the current gateway. */
const progressBytes = schema.definitions.ToolProgressAttachment.properties.data;
schema.definitions.ToolProgressAttachment.properties.data = {
    anyOf: [progressBytes, { type: 'object', additionalProperties: { type: 'number' } }],
};
const declarations = [];
const names = new Map();
const used = new Set();
function nameFor(name) {
    if (names.has(name)) return names.get(name);
    let clean = name.startsWith('Flatten<')
        ? schema.definitions[name].properties?.agentId
            ? 'Session'
            : 'SessionEntryBase'
        : name.replace(/[^a-zA-Z0-9_]/g, '');
    if (!/^[A-Za-z]/.test(clean)) clean = `Value${clean}`;
    let unique = clean;
    let suffix = 2;
    while (used.has(unique)) unique = clean + suffix++;
    used.add(unique);
    names.set(name, unique);
    return unique;
}
for (const name of Object.keys(schema.definitions)) nameFor(name);
function type(node, hint) {
    if (node.$ref)
        return nameFor(
            decodeURIComponent(node.$ref.split('/').at(-1))
                .replaceAll('~1', '/')
                .replaceAll('~0', '~'),
        );
    if (node.const !== undefined) return JSON.stringify(node.const);
    if (node.enum) {
        const name = nameFor(hint === 'WorkerState' ? hint : `${hint}Values`);
        declarations.push(
            `/** Allowed values for ${hint}. */\nexport const ${name} = ${JSON.stringify(Object.fromEntries(node.enum.map((v, i) => [hint === 'WorkerState' ? v[0].toUpperCase() + v.slice(1) : `Value${i}`, v])))} as const;`,
        );
        return `(typeof ${name})[keyof typeof ${name}]`;
    }
    if (node.anyOf || node.oneOf)
        return (node.anyOf ?? node.oneOf).map((v, i) => type(v, `${hint}Variant${i}`)).join(' | ');
    if (node.allOf) return node.allOf.map((v, i) => type(v, `${hint}Part${i}`)).join(' & ');
    if (Array.isArray(node.type))
        return node.type.map((v) => type({ ...node, type: v }, `${hint}${v}`)).join(' | ');
    if (node.type === 'array') return `ReadonlyArray<${type(node.items, `${hint}Item`)}>`;
    if (node.type === 'object' || node.properties) {
        if (!node.properties)
            return node.additionalProperties === false
                ? 'Record<string, never>'
                : `Readonly<Record<string, ${node.additionalProperties && node.additionalProperties !== true ? type(node.additionalProperties, `${hint}Value`) : 'JsonValue'}>>`;
        const name = nameFor(`${hint}Shape`);
        const fields = Object.entries(node.properties).map(
            ([k, v]) =>
                `    /** ${k} as defined by the Nexa gateway. */\n    readonly ${JSON.stringify(k)}${node.required?.includes(k) ? '' : '?'}: ${type(v, `${hint}${k.replaceAll('.', '_')}`)};`,
        );
        declarations.push(
            `/** ${hint} wire fields. */\nexport interface ${name} {\n${fields.join('\n')}\n}`,
        );
        return name;
    }
    if (node.type === 'integer' || node.type === 'number') return 'number';
    if (['string', 'boolean', 'null'].includes(node.type)) return node.type;
    return 'JsonValue';
}
for (const [name, def] of Object.entries(schema.definitions)) {
    const outputName = nameFor(name);
    if (name === 'JsonValue') {
        declarations.push(
            '/** Arbitrary JSON object. */\nexport interface JsonObject { readonly [key: string]: JsonValue; }\n/** Lossless JSON values carried by extensible protocol fields. */\nexport type JsonValue = string | number | boolean | null | ReadonlyArray<JsonValue> | JsonObject;',
        );
        continue;
    }
    // Index-signature interfaces permit recursive JSON dictionaries. A mapped Record alias
    // creates an illegal alias cycle when a value union refers back to this dictionary.
    if (
        def.type === 'object' &&
        !def.properties &&
        def.additionalProperties &&
        typeof def.additionalProperties === 'object'
    ) {
        declarations.push(
            `/** ${outputName} from the Nexa wire protocol. */\nexport interface ${outputName} { readonly [key: string]: ${type(def.additionalProperties, `${outputName}Value`)}; }`,
        );
        continue;
    }
    declarations.push(
        `/** ${outputName} from the Nexa wire protocol. */\nexport type ${outputName} = ${type(def, outputName)};`,
    );
}
declarations.push(
    '/** Supported RPC names. */\nexport type MethodName = keyof GatewayMethods;\n/** Parameters for a particular RPC. */\nexport type ParamsOf<M extends MethodName> = GatewayMethods[M]["params"];\n/** Result for a particular RPC. */\nexport type ResultOf<M extends MethodName> = GatewayMethods[M]["result"];',
);
/** Runtime enum constants share the server method catalog as their source of truth. */
const methodEntries = Object.keys(schema.definitions.GatewayMethods.properties).map((method) => {
    const key = method
        .split('.')
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('');
    return `    /** Calls ${method}. */\n    ${key} = ${JSON.stringify(method)},`;
});
declarations.push(
    `/** Nexa RPC method enum, generated from the complete gateway catalog. */\nexport enum Method {\n${methodEntries.join('\n')}\n}`,
);
mkdirSync('src/protocol', { recursive: true });
writeFileSync(
    'src/protocol/Protocol.ts',
    '/** Generated from Nexa gateway contracts. Regenerate with npm run generate. */\n' +
        declarations.join('\n\n') +
        '\n',
);
const methodValidators = {};
const validators = {};
for (const [key, value] of Object.entries(schema.properties)) validators[key] = value.$ref;
let index = 0;
for (const method of Object.keys(schema.definitions.GatewayMethods.properties)) {
    const id = index++;
    validators[`params${id}`] =
        `#/definitions/GatewayMethods/properties/${method}/properties/params`;
    validators[`result${id}`] =
        `#/definitions/GatewayMethods/properties/${method}/properties/result`;
    methodValidators[method] = id;
}
writeFileSync(
    'src/protocol/SchemaData.ts',
    `import type { Schema } from './Schema.js';\n/** Generated Nexa protocol snapshot. */\nexport const schema: Schema = ${JSON.stringify(schema, null, 2)};\n`,
);
const validateTypes = Object.fromEntries(
    Object.entries(schema.properties).map(([key, value]) => [
        key,
        nameFor(value.$ref.split('/').at(-1)),
    ]),
);
writeFileSync(
    'src/protocol/Validators.ts',
    `import { SchemaValidator } from './Schema.js';\nimport { schema } from './SchemaData.js';\nimport type * as protocol from './Protocol.js';\nconst validator: SchemaValidator = new SchemaValidator(schema);\n/** Validates untrusted JSON at a protocol boundary. */\nexport type Validator = (value: unknown) => boolean;\n` +
        Object.entries(validators)
            .map(
                ([name, path]) =>
                    `/** Validates ${name}. */\nexport function ${name}(value: unknown): ${validateTypes[name] ? 'value is protocol.' + validateTypes[name] : 'boolean'} { return validator.validate(${JSON.stringify(path)}, value); }`,
            )
            .join('\n'),
);
writeFileSync(
    'src/protocol/MethodValidators.ts',
    `import * as validators from './Validators.js';\nimport type { Validator } from './Validators.js';\nimport type { MethodName } from './Protocol.js';\n/** Validators for one method. */\nexport interface MethodValidation { readonly params: Validator; readonly result: Validator; }\n/** Exhaustive RPC boundary validators. */\nexport const methodValidators: Readonly<Record<MethodName, MethodValidation>> = {\n` +
        Object.entries(methodValidators)
            .map(
                ([method, id]) =>
                    `${JSON.stringify(method)}: { params: validators.params${id}, result: validators.result${id} },`,
            )
            .join('\n') +
        '\n};\n',
);
writeFileSync('script/contract.json', JSON.stringify(schema, null, 2) + '\n');
console.log(
    `Generated ${index} RPC contracts and ${Object.keys(schema.definitions).length} definitions.`,
);

execFileSync('./node_modules/.bin/prettier', [
    '--write',
    'src/protocol/Protocol.ts',
    'src/protocol/SchemaData.ts',
    'src/protocol/Validators.ts',
    'src/protocol/MethodValidators.ts',
    'script/contract.json',
]);

// Keep the portable binary codec identical to the gateway implementation.
writeFileSync(
    'src/media/BinaryMedia.ts',
    readFileSync('../nexa/src/media/BinaryMedia.ts', 'utf8').replace(
        "'./DeliveredAttachment'",
        "'../protocol/Protocol.js'",
    ),
);

writeFileSync(
    'src/media/BinaryEnvelope.ts',
    readFileSync('../nexa/src/media/BinaryEnvelope.ts', 'utf8').replace(
        "'../providers/Types'",
        "'../protocol/Protocol.js'",
    ),
);

writeFileSync(
    'src/media/BinaryChunks.ts',
    readFileSync('../nexa/src/media/BinaryChunks.ts', 'utf8'),
);

/** NGOP has one canonical codec; copy it without runtime server dependencies. */
mkdirSync('src/office', { recursive: true });
mkdirSync('src/company', { recursive: true });
for (const name of [
    'CompanyBinary',
    'CompanyTypes',
    'CompanyLimitsTypes',
    'CompanyProtocol',
    'CompanyWorkTypes',
    'CompanyWorkCodec',
    'CompanyBudgetTypes',
    'CompanyProjectTypes',
    'CompanyProjectProtocol',
    'CompanyEmployeeTypes',
    'CompanyEmployeeProtocol',
]) {
    writeFileSync(`src/company/${name}.ts`, readFileSync(`../nexa/src/company/${name}.ts`, 'utf8'));
}
writeFileSync(
    'src/office/OfficeProtocol.ts',
    readFileSync('../nexa/src/office/OfficeProtocol.ts', 'utf8'),
);
