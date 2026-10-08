// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { mkdir, readFile, writeFile } from 'node:fs/promises';

/** Server-only build script. Nexa is the canonical owner of portable workflow contracts. */
const files: readonly string[] = [
    'ResourceTypes',
    'ResourceBindingCodec',
    'ResourceReadiness',
    'WorkflowTypes',
    'WorkflowInput',
    'WorkflowJson',
    'WorkflowCodec',
    'WorkflowRequests',
    'WorkflowRequestCodec',
    'SchemaTypes',
    'Schemas',
    'SchemaValues',
    'SchemaCompatibility',
    'ComponentTypes',
    'ComponentFactory',
    'CoreComponents',
    'AgentComponents',
    'ResourceComponents',
    'ComponentRegistry',
    'GraphTypes',
    'GraphProblems',
    'GraphConnections',
    'GraphResources',
    'GraphOrder',
    'GraphValidation',
    'PortCompatibility',
];
const destination: URL = new URL('../src/workflows/', import.meta.url);
await mkdir(destination, { recursive: true });
for (const file of files) {
    const content: string = await readFile(
        new URL(`../../nexa/src/workflows/${file}.ts`, import.meta.url),
        'utf8',
    );
    await writeFile(new URL(`${file}.ts`, destination), content);
}
