import { readFileSync, writeFileSync } from 'node:fs';

const schema = JSON.parse(readFileSync('script/contract.json', 'utf8'));
const definitions = schema.definitions;
const names = new Map();
const used = new Set();
for (const name of Object.keys(definitions)) {
    const clean = name.startsWith('Flatten<') ? 'Session' : name.replace(/[^a-zA-Z0-9_]/g, '');
    let unique = clean;
    let index = 2;
    while (used.has(unique)) unique = `${clean}${index++}`;
    used.add(unique);
    names.set(name, unique);
}
const refName = (ref) => decodeURIComponent(ref.split('/').at(-1));
const anchor = (name) => names.get(name).toLowerCase();
const description = (node) => (node.description ?? '').split('\n')[0].replace(/\|/g, '\\|');
function type(node) {
    if (node.$ref) {
        const name = refName(node.$ref);
        return `[${names.get(name)}](protocol.md#${anchor(name)})`;
    }
    if (node.const !== undefined) return `\`${JSON.stringify(node.const)}\``;
    if (node.enum) return node.enum.map((value) => `\`${JSON.stringify(value)}\``).join(' / ');
    if (node.anyOf || node.oneOf) return (node.anyOf ?? node.oneOf).map(type).join(' / ');
    if (node.type === 'array') return `Array of ${type(node.items)}`;
    if (node.type === 'object') return node.properties ? 'Object (fields below)' : 'Dictionary';
    return `\`${node.type ?? 'JSON'}\``;
}
function resolved(node) {
    return node.$ref ? definitions[refName(node.$ref)] : node;
}
function fields(node) {
    node = resolved(node);
    if (!node.properties) return `Type: ${type(node)}.\n`;
    const lines = ['| Field | Required | Type | Description |', '| --- | --- | --- | --- |'];
    for (const [name, field] of Object.entries(node.properties)) {
        lines.push(
            `| \`${name}\` | ${(node.required ?? []).includes(name) ? 'Yes' : 'No'} | ${type(field)} | ${description(field)} |`,
        );
    }
    return lines.join('\n') + '\n';
}
function nestedFields(node, prefix = '') {
    if (node.$ref) return '';
    let output = '';
    for (const [name, child] of Object.entries(node.properties ?? {})) {
        if (child.$ref) continue;
        const path = prefix ? `${prefix}.${name}` : name;
        const variants = child.anyOf ??
            child.oneOf ?? [child.type === 'array' ? child.items : child];
        for (const [index, variant] of variants.entries()) {
            if (!variant || variant.$ref) continue;
            if (variant.properties) {
                output += `\n**${path}${variants.length > 1 ? ` — variant ${index + 1}` : ''}**\n\n${fields(variant)}\n`;
                output += nestedFields(variant, path);
            }
        }
    }
    return output;
}

function sample(node, key = '', depth = 0) {
    node = resolved(node);
    if (depth > 8) return null;
    if (node.const !== undefined) return node.const;
    if (node.enum) return node.enum[0];
    if (node.anyOf || node.oneOf)
        return sample(
            (node.anyOf ?? node.oneOf).find((item) => item.type !== 'null') ?? { type: 'null' },
            key,
            depth + 1,
        );
    if (node.type === 'object')
        return Object.fromEntries(
            (node.required ?? []).map((name) => [
                name,
                sample(node.properties[name], name, depth + 1),
            ]),
        );
    if (node.type === 'array') return [];
    if (node.type === 'boolean') return false;
    if (node.type === 'number' || node.type === 'integer') return 1;
    if (node.type === 'null') return null;
    return key === 'message' ? 'Your request' : `YOUR_${key.toUpperCase() || 'VALUE'}`;
}
const methods = definitions.GatewayMethods.properties;
const enumName = (method) =>
    method
        .split('.')
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('');
let reference =
    '# RPC reference\n\nAll 54 protocol methods. `connect` is managed by `NexaClient.connect`; the remaining 53 use `client.call(Method.Name, params)`. Examples are independent templates; replace identifiers and values before calling. Administrative and destructive methods change server state. Availability depends on the authenticated identity, scopes, and server policy.\n\n';
reference +=
    Object.keys(methods)
        .map((name) => `- [${name}](#${name.replaceAll('.', '-')})`)
        .join('\n') + '\n\n';
for (const [name, entry] of Object.entries(methods)) {
    const { params, result } = entry.properties;
    reference += `## ${name}\n\n`;
    if (name === 'connect')
        reference +=
            'Use `await NexaClient.connect({ url, apiKey })`; the SDK handles challenge, protocol negotiation, and authentication. Do not call `Method.Connect` yourself.\n\n';
    else
        reference +=
            '```ts\n' +
            `await client.call(Method.${enumName(name)}, ${JSON.stringify(sample(params), null, 4)});\n` +
            '```\n\n';
    reference += `Parameters: ${type(params)}.\n\n${fields(params)}\nResult: ${type(result)}.\n\n`;
}
writeFileSync('docs/methods.md', reference);
let protocol =
    '# Protocol types\n\nField reference generated from the bundled protocol contract. Optional fields may be absent. Union variants list their own required fields. Import the corresponding named TypeScript types from `nexa-transport/protocol`; inline object variants also have generated `Shape` interfaces in that module. See [RPC usage](methods.md) and the [guide](guide.md).\n\n';
for (const [name, node] of Object.entries(definitions)) {
    protocol += `## ${names.get(name)}\n\n${description(node)}\n\n`;
    if (node.anyOf || node.oneOf) {
        for (const [index, variant] of (node.anyOf ?? node.oneOf).entries())
            protocol += `Variant ${index + 1}: ${type(variant)}\n\n${fields(variant)}\n`;
    } else protocol += fields(node) + '\n';
    protocol += nestedFields(node);
}
writeFileSync('docs/protocol.md', protocol);
