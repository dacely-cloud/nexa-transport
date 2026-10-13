// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { mkdir, readFile, writeFile } from 'node:fs/promises';

/** Server-only generation entry. Nexa owns the portable Roblox authoring and evaluation contract. */
const files: readonly string[] = [
    'RobloxExecutionContext',
    'RobloxPartGeometry',
    'RobloxLiveState',
    'RobloxLiveDescriptor',
    'RobloxSceneInput',
    'RobloxSceneHierarchy',
    'RobloxSceneTextures',
    'RobloxHierarchyLuau',
    'RobloxDefaultTextures',
    'RobloxDefaultTextureData',
    'RobloxGuiLayout',
    'RobloxGuiImages',
    'RobloxGuiClasses',
    'RobloxGuiBoxLayout',
    'RobloxSceneExamples',
    'RobloxParticleSimulator',
    'RobloxParticleBirths',
    'RobloxParticleIntervals',
    'RobloxParticleMotion',
    'RobloxParticleMotionTree',
    'RobloxParticleRigidTransfer',
    'RobloxParticlePose',
    'RobloxParticleLockedMotion',
    'RobloxParticleBirthPoses',
    'RobloxParticleShape',
    'RobloxParticleRoundShape',
    'RobloxParticleCylinderShape',
    'RobloxParticleAppearance',
    'RobloxParticleOrientation',
    'RobloxParticleFlipbook',
    'RobloxSceneTypes',
    'RobloxSceneSchema',
    'RobloxSceneCodec',
    'RobloxSceneRuntime',
    'RobloxSceneXml',
    'RobloxSceneLuau',
    'RobloxSceneDiagnostics',
];
await mkdir('src/roblox', { recursive: true });
for (const file of files) {
    const source: string = await readFile('../nexa/src/roblox/preview/' + file + '.ts', 'utf8');
    if (/from ['"](?:node:|\.\.\/)/u.test(source))
        throw new Error('Roblox SDK source imports server-only code: ' + file);
    await writeFile('src/roblox/' + file + '.ts', source);
}
