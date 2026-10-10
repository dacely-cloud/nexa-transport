// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { mkdir, readFile, writeFile } from 'node:fs/promises';

/** Server-only generation script. Nexa owns the portable design model and layout implementation. */
const files: readonly string[] = [
    'DesignBooleanTypes',
    'DesignBooleanKernel',
    'DesignBooleanGeometry',
    'DesignBooleanBounds',
    'DesignBooleanLayout',
    'DesignBooleanSelection',
    'DesignBooleanEdits',
    'DesignBooleanTransforms',
    'DesignBooleanResize',
    'DesignPathKit',
    'DesignPathKitBytes',
    'DesignPathKitTypes',
    'DesignPathKitScope',
    'DesignPathConics',
    'DesignPathDashes',
    'DesignBezier',
    'DesignPathWinding',
    'DesignSvg',
    'DesignSvgTypes',
    'DesignSvgGeometry',
    'DesignSvgPaints',
    'DesignImageFramingCodec',
    'DesignImageGeometry',
    'DesignTextLayout',
    'DesignPaths',
    'DesignComponentTypes',
    'DesignComponentTargets',
    'DesignComponentDetach',
    'DesignComponents',

    'DesignSelectionTypes',
    'DesignSelectionContext',
    'DesignSelectionTree',
    'DesignSelection',
    'DesignAssetTypes',
    'DesignAssetCodec',
    'DesignAssetReferences',
    'DesignTypes',
    'DesignValues',
    'DesignBudget',
    'DesignFreeze',
    'DesignDefaults',
    'DesignCodec',
    'DesignNodeCodec',
    'DesignStyleCodec',
    'DesignLayoutCodec',
    'DesignTree',
    'DesignTreeEdits',
    'DesignOperationTypes',
    'DesignOperationCodec',
    'DesignEntityChanges',
    'DesignEdits',
    'DesignScene',
    'DesignLayoutTypes',
    'DesignFlex',
    'DesignGrid',
    'DesignConstraints',
    'DesignTextMetrics',
    'DesignLayout',
    'DesignRequests',
    'DesignRecordCodec',
    'DesignRecords',
    'DesignRequestCodec',
    'DesignChangeCodec',
    'DesignRpcMethods',
    'DesignPaging',
];
await mkdir('src/design', { recursive: true });
for (const file of files) {
    const source: string = await readFile('../nexa/src/design/' + file + '.ts', 'utf8');
    if (/from ['"](?:node:|mongodb|\.\.\/)/u.test(source))
        throw new Error('Design SDK source contains a server-only import: ' + file);
    await writeFile('src/design/' + file + '.ts', source);
}

await writeFile('src/design/PathKitWasm.d.ts', await readFile('../nexa/src/design/PathKitWasm.d.ts', 'utf8'));
await mkdir('licenses', {recursive: true});
await writeFile('licenses/PathKit.txt', await readFile('../nexa/licenses/PathKit.txt', 'utf8'));
