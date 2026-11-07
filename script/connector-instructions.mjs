/** Refresh only connector instructions and account-owned instruction fields in inventory. */
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
const methods = ['connectors.instructions.get', 'connectors.instructions.update'];
const names = [
    'ConnectorInstructionsGetParams',
    'ConnectorInstructionsUpdateParams',
    'ConnectorInstructionsView',
];
try {
    const contract = JSON.parse(readFileSync('script/contract.json', 'utf8'));
    const before = structuredClone(contract);
    const definitions = contract.definitions;
    if (
        definitions?.GatewayMethods?.properties === undefined ||
        definitions.ConnectorInventoryView?.properties === undefined
    ) {
        throw new Error('Current complete connector contract required');
    }
    const enrollmentId = { type: 'string', pattern: '^conn_[a-f0-9]{64}$' };
    const instructions = {
        description:
            'Account-owned standing instructions; at most 16384 UTF-8 bytes. Empty text clears preferences.',
        type: 'string',
        maxLength: 16384,
        pattern: '^[^\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$',
    };
    const revision = { type: 'string', pattern: '^(0|[1-9][0-9]{0,18})$' };
    const shape = (properties) => ({
        type: 'object',
        properties,
        required: Object.keys(properties),
        additionalProperties: false,
    });
    const ref = (name) => ({ $ref: '#/definitions/' + name });
    definitions.ConnectorInstructionsGetParams = shape({ enrollmentId });
    definitions.ConnectorInstructionsUpdateParams = shape({
        enrollmentId,
        instructions,
        expectedRevision: revision,
        requestId: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$' },
    });
    definitions.ConnectorInstructionsView = shape({ enrollmentId, instructions, revision });
    for (const [index, method] of methods.entries()) {
        definitions.GatewayMethods.properties[method] = shape({
            params: ref(names[index]),
            result: ref('ConnectorInstructionsView'),
        });
        if (!definitions.GatewayMethods.required.includes(method))
            definitions.GatewayMethods.required.push(method);
    }
    definitions.ConnectorInventoryView.properties.instructions = instructions;
    definitions.ConnectorInventoryView.properties.instructionsRevision = revision;
    for (const field of ['instructions', 'instructionsRevision']) {
        if (!definitions.ConnectorInventoryView.required.includes(field))
            definitions.ConnectorInventoryView.required.push(field);
    }
    const strip = (value) => {
        for (const name of names) delete value.definitions[name];
        for (const method of methods) {
            delete value.definitions.GatewayMethods.properties[method];
            value.definitions.GatewayMethods.required =
                value.definitions.GatewayMethods.required.filter((name) => name !== method);
        }
        for (const field of ['instructions', 'instructionsRevision']) {
            delete value.definitions.ConnectorInventoryView.properties[field];
            value.definitions.ConnectorInventoryView.required =
                value.definitions.ConnectorInventoryView.required.filter((name) => name !== field);
        }
    };
    const after = structuredClone(contract);
    strip(before);
    strip(after);
    if (!isDeepStrictEqual(before, after))
        throw new Error('Instructions refresh changed unrelated contracts');
    writeFileSync('script/contract.json', JSON.stringify(contract, null, 2) + '\n');
    execFileSync(process.execPath, ['script/generate.mjs', '--snapshot-only'], {
        stdio: 'inherit',
    });
} catch (caught) {
    for (const [path, bytes] of originals) writeFileSync(path, bytes);
    throw caught;
}
