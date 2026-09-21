/** Server-only protocol snapshot generator. Run after changing Nexa's gateway contracts. */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

execFileSync('./node_modules/.bin/typescript-json-schema', [
    'script/Contract.ts',
    'Contract',
    '--ignoreErrors',
    '--strictNullChecks',
    '--required',
    '--out',
    '/tmp/nexa-transport-contract.json',
]);
const schema = JSON.parse(readFileSync('/tmp/nexa-transport-contract.json', 'utf8'));
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
    let clean = name.startsWith('Flatten<') ? 'Session' : name.replace(/[^a-zA-Z0-9_]/g, '');
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
        const name = nameFor(`${hint}Values`);
        declarations.push(
            `/** Allowed values for ${hint}. */\nexport const ${name} = ${JSON.stringify(Object.fromEntries(node.enum.map((v, i) => [`Value${i}`, v])))} as const;`,
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
