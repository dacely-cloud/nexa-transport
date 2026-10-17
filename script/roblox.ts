// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

/** Server-only generation entry. Nexa owns the portable Roblox authoring and evaluation contract. */
const files: readonly string[] = [
    'RobloxExecutionContext',
    'RobloxEnvironment',
    'RobloxEnvironmentLuau',
    'RobloxPhysicsLuau',
    'RobloxBeamBudget',
    'RobloxBeamPath',
    'RobloxBeamMotion',
    'RobloxBeamPhases',
    'RobloxBeamLuau',
    'RobloxBeamGeometry',
    'RobloxTrailHistory',
    'RobloxTrailTimeline',
    'RobloxTrailGeometry',
    'RobloxPartGeometry',
    'RobloxMeshTypes',
    'RobloxMeshHeader',
    'RobloxMeshAscii',
    'RobloxMeshDecoder',
    'RobloxMeshNormals',
    'RobloxMeshGeometry',
    'RobloxMeshPlayback',
    'RobloxSceneMeshes',
    'RobloxLiveState',
    'RobloxLiveDescriptor',
    'RobloxSceneInput',
    'RobloxWheelInput',
    'RobloxTextEdit',
    'RobloxKeyboardInput',
    'RobloxSceneHierarchy',
    'RobloxSceneReferences',
    'RobloxSceneTextures',
    'RobloxHierarchyLuau',
    'RobloxDefaultTextures',
    'RobloxDefaultTextureData',
    'RobloxGuiLayout',
    'RobloxGuiScroll',
    'RobloxGuiScrollbars',
    'RobloxGuiImages',
    'RobloxGuiClasses',
    'RobloxGuiText',
    'RobloxGuiBoxLayout',
    'RobloxGuiAutoSize',
    'RobloxGuiSizeConstraint',
    'RobloxGuiAspectRatio',
    'RobloxGuiScale',
    'RobloxGuiPadding',
    'RobloxTextMetrics',
    'RobloxTextLines',
    'RobloxTextAlignment',
    'RobloxTextSelection',
    'RobloxTextHit',
    'RobloxLegacyFont',
    'RobloxLegacyFontData',
    'RobloxFontCatalog',
    'RobloxFonts',
    'RobloxSceneExamples',
    'RobloxParticleSimulator',
    'RobloxParticleBirths',
    'RobloxParticleInheritance',
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
await mkdir('licenses/roblox', { recursive: true });
await writeFile(
    'licenses/roblox/Arimo-OFL.txt',
    await readFile('../nexa/assets/roblox/fonts/OFL.txt', 'utf8'),
);
await mkdir('src/roblox/fonts', { recursive: true });
const fontFiles: readonly string[] = await readdir('../nexa/src/roblox/preview/fonts');
for (const file of fontFiles) {
    if (!/^Font[A-Za-z0-9]+\.ts$/u.test(file)) {
        throw new Error('Unexpected Roblox font module: ' + file);
    }
    await writeFile('src/roblox/fonts/' + file, await readFile('../nexa/src/roblox/preview/fonts/' + file));
}
await writeFile('licenses/roblox/font-resources.json', await readFile('../nexa/assets/roblox/fonts/catalog.json'));
await writeFile('licenses/roblox/Roblox-Font-Resources.txt', await readFile('../nexa/licenses/Roblox-Font-Resources.txt'));
