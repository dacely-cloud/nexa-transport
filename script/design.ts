// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="node" />

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { format, resolveConfig, type Options } from 'prettier';

/** Server-only generation script. Nexa owns the portable design model and layout implementation. */
const files: readonly string[] = [
    'DesignSelectionIndex',
    'DesignFailure',
    'DesignSvgFilterEffects',
    'DesignSvgImportFilters',
    'DesignEffectMetrics',
    'DesignSvgFilterValues',
    'DesignSvgFilterFrame',
    'DesignSvgShadowGraph',
    'DesignSvgImportMasks',
    'DesignSvgImportBounds',
    'DesignSvgImportClipPaths',
    'DesignSvgImportContext',
    'DesignSvgImportMask',
    'DesignSvgImportStyles',
    'DesignSvgImportUse',
    'DesignSvgImportViewport',
    'DesignSvgReferences',
    'DesignSvgXml',
    'XmlReader',
    'DesignSvgNumbers',
    'DesignSvgPathData',
    'DesignSvgTransforms',
    'DesignSvgRootTransform',
    'DesignSvgShapePaths',
    'DesignSvgColors',
    'DesignSvgCss',
    'DesignSvgFontTypes',
    'DesignSvgFontSource',
    'DesignSvgImportedFonts',
    'DesignSvgImportGeometry',
    'DesignSvgImportPaints',
    'DesignSvgImportAppearance',
    'DesignSvgImportTree',
    'DesignSvgImportLayers',
    'DesignSvgImportImage',
    'DesignSvgAffineImage',
    'DesignSvgImageSource',
    'DesignSvgImageTypes',
    'DesignSvgImportText',
    'DesignSvgImportLabel',
    'DesignSvgImportTextPaints',
    'DesignSvgImportTextDirection',
    'DesignSvgTextChunks',
    'DesignSvgImportTextStyles',
    'DesignSvgTextBaseline',
    'DesignSvgImportShape',
    'DesignSvgImportTypes',
    'DesignSvgImportCodec',
    'DesignSvgImport',
    'DesignStrokeTypes',
    'DesignBlendTypes',
    'DesignSvgCompositing',
    'DesignStrokeGeometry',
    'DesignStrokeChangesCodec',
    'DesignStrokeEdits',
    'DesignStyleChangesCodec',
    'DesignStyleEdits',
    'DesignLayerStyleEdit',
    'DesignGradientTypes',
    'DesignGradientCodec',
    'DesignGradientGeometry',
    'DesignGradientSampling',
    'DesignGradientPng',
    'DesignPaintLayerEdit',
    'DesignPaintGradientChangesCodec',
    'DesignPaintGradientEdits',
    'DesignPaintImageChangesCodec',
    'DesignPaintImageEdits',
    'DesignTypographyStyleTypes',
    'DesignTypographyStyleCodec',
    'DesignFontFamilyCodec',
    'DesignTypographyMerge',
    'DesignTypographyLinks',
    'DesignTypographyStyleEdits',
    'DesignLayerAuthority',
    'DesignTokenChangesCodec',
    'DesignTokenEdits',
    'DesignPaintColorChangesCodec',
    'DesignPaintColorEdits',
    'DesignRecolorEdits',
    'DesignColorReadTypes',
    'DesignColorReadCodec',
    'DesignTransferTypes',
    'DesignTransferCodec',
    'DesignTransfer',
    'DesignTransferGraph',
    'DesignTransferLinks',
    'DesignClipboardTypes',
    'DesignClipboardCodec',
    'DesignClipboardSnapshot',
    'DesignClipboardPaste',
    'DesignClipboardCut',
    'DesignFontTypes',
    'DesignFontCodec',
    'DesignFontBindings',
    'DesignShapedTextMetrics',
    'DesignFontEngine',
    'DesignFontRun',
    'DesignTextShaping',
    'DesignTextGlyphs',
    'DesignFontPlacement',
    'DesignFontShapeBudget',
    'DesignFontGraphemes',
    'DesignFontRegistry',
    'DesignFontShaper',
    'DesignHarfBuzz',
    'DesignHarfBuzzRuntime',
    'DesignHarfBuzzBytes',
    'DesignFontSfnt',
    'DesignUnicodeScripts',
    'DesignTextDirection',
    'DesignBidiParagraph',
    'DesignTextBidi',
    'DesignTextBreaks',
    'DesignScriptFontBytes',
    'DesignScriptFontLicense',
    'DesignSvgScriptFonts',
    'DesignSvgText',
    'DesignSvgTextPaint',
    'DesignEmojiBytes',
    'DesignEmojiLicense',
    'DesignFontGlyphTypes',
    'DesignFontGlyphGeometry',
    'DesignTextWindowTypes',
    'DesignTextWindowCodec',
    'DesignCanvasTypes',
    'DesignCanvasCodec',
    'DesignFontContainer',
    'DesignBuiltinFonts',
    'DesignInterBytes',
    'DesignInterLicense',
    'DesignSvgFonts',
    'DesignInterOutlineBytes',
    'DesignTextOutline',
    'DesignVariantTypes',
    'DesignVariantCodec',
    'DesignVariants',
    'DesignVariantTree',
    'DesignVariantCommands',
    'DesignVariantEdits',
    'DesignVariantGeometry',
    'DesignMaskTypes',
    'DesignMaskCodec',
    'DesignMaskGeometry',
    'DesignMaskSelection',
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
    'DesignImageTransformTypes',
    'DesignImageTransformCodec',
    'DesignImageAdjustmentTypes',
    'DesignImageAdjustmentCodec',
    'DesignImageColor',
    'DesignImageSamplingTypes',
    'DesignImageSamplingCodec',
    'DesignImageSamplingGeometry',
    'DesignSvgImageSampling',
    'DesignImageGeometry',
    'DesignTextLayout',
    'DesignPaths',
    'DesignPolygons',
    'DesignArcs',
    'DesignComponentTypes',
    'DesignComponentTargets',
    'DesignComponentSwap',
    'DesignComponentDetach',
    'DesignComponents',
    'DesignSelectionTypes',
    'DesignAutoLayout',
    'DesignSelectionContext',
    'DesignSelectionTree',
    'DesignSelection',
    'DesignAssetTypes',
    'DesignAssetCodec',
    'DesignAssetReferences',
    'DesignTypes',
    'DesignFrameGridCodec',
    'DesignFrameGridGeometry',
    'DesignRulerCodec',
    'DesignValues',
    'DesignBudget',
    'DesignFreeze',
    'DesignDefaults',
    'DesignCodec',
    'DesignNodeCodec',
    'DesignStyleCodec',
    'DesignLayoutCodec',
    'DesignLayoutChangesCodec',
    'DesignLayoutPreviewTypes',
    'DesignLayoutPreviewCodec',
    'DesignLayoutEdits',
    'DesignTextStyles',
    'DesignTextStyleChangesCodec',
    'DesignTextStyleEdits',
    'DesignTypographyChangesCodec',
    'DesignTypographyEdits',
    'DesignSizingChangesCodec',
    'DesignSizingEdits',
    'DesignTree',
    'DesignTreeEdits',
    'DesignOperationTypes',
    'DesignOperationCodec',
    'DesignEntityChanges',
    'DesignEdits',
    'DesignResizeEdits',
    'DesignResizeAnchors',
    'DesignPositionEdits',
    'DesignTranslateEdits',
    'DesignRotateEdits',
    'DesignScaleEdits',
    'DesignScaleMetrics',
    'DesignFlowOrdering',
    'DesignPositionReferences',
    'DesignWorldPositions',
    'DesignScene',
    'DesignLayoutTypes',
    'DesignFlex',
    'DesignFlowMeasurement',
    'DesignGrid',
    'DesignConstraints',
    'DesignTextMetrics',
    'DesignLayout',
    'DesignRequests',
    'DesignViewTypes',
    'DesignViewCodec',
    'DesignRecordCodec',
    'DesignRecords',
    'DesignRequestCodec',
    'DesignChangeCodec',
    'DesignRpcMethods',
    'DesignPaging',
];
await mkdir('src/design', { recursive: true });
for (const file of files) {
    const path: string =
        file === 'XmlReader'
            ? '../nexa/src/core/XmlReader.ts'
            : '../nexa/src/design/' + file + '.ts';
    const native: string = await readFile(path, 'utf8');
    const source: string =
        file === 'DesignSvgXml'
            ? native.replace("from '../core/XmlReader'", "from './XmlReader.js'")
            : native;
    if (/from ['"](?:node:|mongodb|\.\.\/)/u.test(source)) {
        throw new Error('Design SDK source contains a server-only import: ' + file);
    }
    await writeFile('src/design/' + file + '.ts', source);
}

await writeFile(
    'src/design/PathKitWasm.d.ts',
    await readFile('../nexa/src/design/PathKitWasm.d.ts', 'utf8'),
);
await mkdir('licenses', { recursive: true });
await writeFile('licenses/PathKit.txt', await readFile('../nexa/licenses/PathKit.txt', 'utf8'));

await writeFile(
    new URL('../src/design/DesignFontKit.d.ts', import.meta.url),
    await readFile(new URL('../../nexa/src/design/DesignFontKit.d.ts', import.meta.url), 'utf8'),
    'utf8',
);
await writeFile('licenses/Inter-OFL.txt', await readFile('../nexa/licenses/Inter-OFL.txt', 'utf8'));

await writeFile(
    'licenses/NotoEmoji-OFL.txt',
    await readFile('../nexa/licenses/NotoEmoji-OFL.txt', 'utf8'),
);

await writeFile('licenses/fflate.txt', await readFile('node_modules/fflate/LICENSE', 'utf8'));
for (const name of [
    'NotoSansArabic-OFL.txt',
    'NotoSansHebrew-OFL.txt',
    'Unicode-3.0.txt',
    'HarfBuzz.txt',
    'Wasi-libc.txt',
    'LLVM-runtime.txt',
]) {
    await writeFile('licenses/' + name, await readFile('../nexa/licenses/' + name, 'utf8'));
}
for (const name of ['bidi-shaper', 'woff2-encoder']) {
    await writeFile(
        'licenses/' + name + '.txt',
        await readFile('node_modules/' + name + '/LICENSE', 'utf8'),
    );
}

/** Native arc geometry regressions run against the generated portable implementation too. */
const arcTests: string = await readFile('../nexa/test/design/DesignArcs.test.ts', 'utf8');
const arcTestPath: string = 'test/DesignArcs.test.ts';
const arcTestFormat: Options = (await resolveConfig(arcTestPath)) ?? {};
await writeFile(
    arcTestPath,
    await format(arcTests.replaceAll('../../src/design/', '../src/design/'), {
        ...arcTestFormat,
        filepath: arcTestPath,
    }),
);

/** Prepared shaping and asymmetric ligature carets are verified against the canonical native cases. */
for (const testName of [
    'DesignFontRun',
    'DesignTextShaping',
    'DesignTextPaintInheritance',
    'DesignSvgTextPaintImport',
]) {
    const runTestPath: string = 'test/' + testName + '.test.ts';
    const runTestFormat: Options = (await resolveConfig(runTestPath)) ?? {};
    const runTests: string = await readFile('../nexa/test/design/' + testName + '.test.ts', 'utf8');
    await writeFile(
        runTestPath,
        await format(
            runTests
                .replaceAll('../../src/design/', '../src/design/')
                .replaceAll('../fixtures/design-font-runs/', './fixtures/design-font-runs/'),
            { ...runTestFormat, filepath: runTestPath },
        ),
    );
}
await mkdir('test/fixtures/design-font-runs', { recursive: true });
for (const name of ['NexaCaretFixture.woff2', 'LICENSE.txt', 'sources.json']) {
    await writeFile(
        'test/fixtures/design-font-runs/' + name,
        await readFile('../nexa/test/fixtures/design-font-runs/' + name),
    );
}
