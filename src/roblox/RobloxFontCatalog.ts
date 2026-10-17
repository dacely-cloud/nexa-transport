// SPDX-License-Identifier: Apache-2.0
/** Original Roblox font resource metadata shared by validation, layout and browser loading. */
export interface RobloxFontDefinition {
    readonly value: number;
    readonly name: string;
    readonly family: string;
    readonly weight: number;
    readonly style: string;
    readonly uri: string;
    readonly bytes: number;
    readonly sha256: string;
    readonly resource: () => Promise<Uint8Array<ArrayBuffer>>;
}
/** Decode an original font only when a preview requests that face. */
function bytes(encoded: string): Uint8Array<ArrayBuffer> {
    const text: string = atob(encoded);
    const result: Uint8Array<ArrayBuffer> = new Uint8Array(text.length);
    for (let index: number = 0; index < text.length; index += 1) {
        result[index] = text.charCodeAt(index);
    }
    return result;
}
/** Generated from the integrity-checked Studio font package; do not substitute host fonts. */
export const RobloxFontCatalog: readonly RobloxFontDefinition[] = [
    {
        value: 0,
        name: 'Legacy',
        family: 'rbxasset://fonts/families/LegacyArial.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Arimo-Regular.ttf',
        bytes: 317652,
        sha256: 'f770502d7caad307e5b2131d4d763e22ed506ae4eb93775e29667bd0f8d3af1f',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./RobloxLegacyFontData')).RobloxLegacyFontData),
    },
    {
        value: 1,
        name: 'Arial',
        family: 'rbxasset://fonts/families/Arimo.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Arimo-Regular.ttf',
        bytes: 317652,
        sha256: 'f770502d7caad307e5b2131d4d763e22ed506ae4eb93775e29667bd0f8d3af1f',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./RobloxLegacyFontData')).RobloxLegacyFontData),
    },
    {
        value: 2,
        name: 'ArialBold',
        family: 'rbxasset://fonts/families/Arimo.json',
        weight: 700,
        style: 'normal',
        uri: 'rbxasset://fonts/Arimo-Bold.ttf',
        bytes: 318184,
        sha256: 'ad88e47fa64708183695e3039a3a2d7699f212b6a1ba5f6cd6a5eb37ca71bea5',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontArimoBoldttf')).font),
    },
    {
        value: 3,
        name: 'SourceSans',
        family: 'rbxasset://fonts/families/SourceSansPro.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/SourceSansPro-Regular.ttf',
        bytes: 269108,
        sha256: 'c9868de61ff2bab0b5a3a6d01c4b76f299459f08c6ae2f2c0383b4f9f6bedbf3',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontSourceSansProRegularttf')).font),
    },
    {
        value: 4,
        name: 'SourceSansBold',
        family: 'rbxasset://fonts/families/SourceSansPro.json',
        weight: 700,
        style: 'normal',
        uri: 'rbxasset://fonts/SourceSansPro-Bold.ttf',
        bytes: 267388,
        sha256: '9cbab47276fc04c65ac78098e9a2069c55e26f21701b29092734ce4e830f80fb',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontSourceSansProBoldttf')).font),
    },
    {
        value: 5,
        name: 'SourceSansLight',
        family: 'rbxasset://fonts/families/SourceSansPro.json',
        weight: 300,
        style: 'normal',
        uri: 'rbxasset://fonts/SourceSansPro-Light.ttf',
        bytes: 268588,
        sha256: '3eb3ad852d98c139c78064804524d0d2472b3efb872dc176b217fb57ae6a6f78',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontSourceSansProLightttf')).font),
    },
    {
        value: 6,
        name: 'SourceSansItalic',
        family: 'rbxasset://fonts/families/SourceSansPro.json',
        weight: 400,
        style: 'italic',
        uri: 'rbxasset://fonts/SourceSansPro-It.ttf',
        bytes: 94816,
        sha256: '1b78bc1c8104348e13fcc043331926f818ce290556350b1a90a735fe038c73d4',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontSourceSansProItttf')).font),
    },
    {
        value: 7,
        name: 'Bodoni',
        family: 'rbxasset://fonts/families/AccanthisADFStd.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/AccanthisADFStd-Regular.otf',
        bytes: 51728,
        sha256: '1b1dc599e4cd0270a3e3ec83fc8da18a21d9d69243732911e2153b977563ed89',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontAccanthisADFStdRegularotf')).font),
    },
    {
        value: 8,
        name: 'Garamond',
        family: 'rbxasset://fonts/families/Guru.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Guru-Regular.otf',
        bytes: 695888,
        sha256: '047afce7cedf4dfd7798373cd41afdbaaef14fcddbe194eae76e5d2c24a010f8',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontGuruRegularotf')).font),
    },
    {
        value: 9,
        name: 'Cartoon',
        family: 'rbxasset://fonts/families/ComicNeueAngular.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/ComicNeue-Angular-Bold.ttf',
        bytes: 62916,
        sha256: '4025b2b948827b9f8b21bfd5c16e859ef28e2754a0be723463ef4944377ac298',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontComicNeueAngularBoldttf')).font),
    },
    {
        value: 10,
        name: 'Code',
        family: 'rbxasset://fonts/families/Inconsolata.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Inconsolata-Regular.ttf',
        bytes: 80456,
        sha256: '346eff8b8292ef2b8026cf1dbea3fc0c79eba444270d38d73da895ddcba74e15',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontInconsolataRegularttf')).font),
    },
    {
        value: 11,
        name: 'Highway',
        family: 'rbxasset://fonts/families/HighwayGothic.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/HWYGOTH.ttf',
        bytes: 53012,
        sha256: 'fc5d1101acaf2512e77c9247a86f63a459f49d7c0f7c795134f53c569ecc834c',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontHWYGOTHttf')).font),
    },
    {
        value: 12,
        name: 'SciFi',
        family: 'rbxasset://fonts/families/Zekton.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/zekton_rg.ttf',
        bytes: 86964,
        sha256: '82904c6613e45c4e5a988d242ce183d10d78a4cc6868e74c618e0dcb773472fe',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/Fontzektonrgttf')).font),
    },
    {
        value: 13,
        name: 'Arcade',
        family: 'rbxasset://fonts/families/PressStart2P.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/PressStart2P-Regular.ttf',
        bytes: 66432,
        sha256: '5334290d256b59e8e5db3b659baf2296daeb7cc7785a9ceb10a72b80bba0e2e2',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontPressStart2PRegularttf')).font),
    },
    {
        value: 14,
        name: 'Fantasy',
        family: 'rbxasset://fonts/families/Balthazar.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Balthazar-Regular.ttf',
        bytes: 28224,
        sha256: '4aa52d4d4a747b7688bdba35c764a7006d4d2915e6159aa1b8c979c9f4dc7b2d',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontBalthazarRegularttf')).font),
    },
    {
        value: 15,
        name: 'Antique',
        family: 'rbxasset://fonts/families/RomanAntique.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/RomanAntique.otf',
        bytes: 268000,
        sha256: 'da2bd261404756482be61815520af4b254abc9109acde897ecc7cf4a09a05cf8',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontRomanAntiqueotf')).font),
    },
    {
        value: 16,
        name: 'SourceSansSemibold',
        family: 'rbxasset://fonts/families/SourceSansPro.json',
        weight: 600,
        style: 'normal',
        uri: 'rbxasset://fonts/SourceSansPro-Semibold.ttf',
        bytes: 268280,
        sha256: '3ba5c382a7ee6a8831bdf90192addceabe6db4278a679e67fe7e9c0226b729cf',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontSourceSansProSemiboldttf')).font),
    },
    {
        value: 17,
        name: 'Gotham',
        family: 'rbxasset://fonts/families/Montserrat.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Montserrat-Regular.ttf',
        bytes: 197976,
        sha256: 'dcfe8df29e553fbd655212f94300cb1e704c6cd147fa7a98cb4bcd9eb92c6707',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontMontserratRegularttf')).font),
    },
    {
        value: 18,
        name: 'GothamMedium',
        family: 'rbxasset://fonts/families/Montserrat.json',
        weight: 500,
        style: 'normal',
        uri: 'rbxasset://fonts/Montserrat-Medium.ttf',
        bytes: 198104,
        sha256: '20ebfd658f55a256d60b4f84849e0026e4b599926493738ed3952c7200218d33',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontMontserratMediumttf')).font),
    },
    {
        value: 19,
        name: 'GothamBold',
        family: 'rbxasset://fonts/families/Montserrat.json',
        weight: 700,
        style: 'normal',
        uri: 'rbxasset://fonts/Montserrat-Bold.ttf',
        bytes: 198072,
        sha256: '189aeb285be99f0b58e454dd2dc3cbf34a6db844a9ef26ebc5909178ff77c5be',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontMontserratBoldttf')).font),
    },
    {
        value: 20,
        name: 'GothamBlack',
        family: 'rbxasset://fonts/families/Montserrat.json',
        weight: 900,
        style: 'normal',
        uri: 'rbxasset://fonts/Montserrat-Black.ttf',
        bytes: 197888,
        sha256: '9d0664ef22c8dbedb44861879d1f6d53d53b1d0e37f4e8e4bcfc62fc0285005d',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontMontserratBlackttf')).font),
    },
    {
        value: 21,
        name: 'AmaticSC',
        family: 'rbxasset://fonts/families/AmaticSC.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/AmaticSC-Regular.ttf',
        bytes: 142164,
        sha256: '136f5049b2d01fb10c69ac34e8edf5b2bd2cf471605f397c33353298ebd281ef',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontAmaticSCRegularttf')).font),
    },
    {
        value: 22,
        name: 'Bangers',
        family: 'rbxasset://fonts/families/Bangers.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Bangers-Regular.ttf',
        bytes: 95664,
        sha256: '6c5874194064636ba5247288704aa31f3b48345df405598a0f4cee4b066a7009',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontBangersRegularttf')).font),
    },
    {
        value: 23,
        name: 'Creepster',
        family: 'rbxasset://fonts/families/Creepster.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Creepster-Regular.ttf',
        bytes: 61368,
        sha256: 'af46f60f81e666d31db895554b2fe255fe6b896a899363edb713b7c714c204c3',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontCreepsterRegularttf')).font),
    },
    {
        value: 24,
        name: 'DenkOne',
        family: 'rbxasset://fonts/families/DenkOne.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/DenkOne-Regular.ttf',
        bytes: 44016,
        sha256: '0a9c05025382f8a87673e4da53c7405181085bde4e133c9f47457291d8b61f15',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontDenkOneRegularttf')).font),
    },
    {
        value: 25,
        name: 'Fondamento',
        family: 'rbxasset://fonts/families/Fondamento.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Fondamento-Regular.ttf',
        bytes: 84160,
        sha256: '5d38593078871c7033cfe3187f40bd3717ab8311c7eff3bdb05adbdc32f716a6',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontFondamentoRegularttf')).font),
    },
    {
        value: 26,
        name: 'FredokaOne',
        family: 'rbxasset://fonts/families/FredokaOne.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/FredokaOne-Regular.ttf',
        bytes: 42452,
        sha256: '08a0193637baffaa1d9926085fe2a2716c1ce06136b74a9627e61663649c0f37',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontFredokaOneRegularttf')).font),
    },
    {
        value: 27,
        name: 'GrenzeGotisch',
        family: 'rbxasset://fonts/families/GrenzeGotisch.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/GrenzeGotisch-Regular.ttf',
        bytes: 91596,
        sha256: '886809f1e968877810560a5458120bfbc23e7e36b6f43f636e131a1de05e9688',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontGrenzeGotischRegularttf')).font),
    },
    {
        value: 28,
        name: 'IndieFlower',
        family: 'rbxasset://fonts/families/IndieFlower.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/IndieFlower-Regular.ttf',
        bytes: 55300,
        sha256: 'e92aceba3c95fabe12edf01ae248f613f6d97eef3bdb7009200cb3fae53df609',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontIndieFlowerRegularttf')).font),
    },
    {
        value: 29,
        name: 'JosefinSans',
        family: 'rbxasset://fonts/families/JosefinSans.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/JosefinSans-Regular.ttf',
        bytes: 58548,
        sha256: '31ed94e56b1225f07307210cc2ea46e2209b71fe284423f6929f9cdab124e86d',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontJosefinSansRegularttf')).font),
    },
    {
        value: 30,
        name: 'Jura',
        family: 'rbxasset://fonts/families/Jura.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Jura-Regular.ttf',
        bytes: 101928,
        sha256: 'a28ccb3191cfac12f4a32913514068fe86dd7e2c2ec0c9e415d713bb280b4355',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontJuraRegularttf')).font),
    },
    {
        value: 31,
        name: 'Kalam',
        family: 'rbxasset://fonts/families/Kalam.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Kalam-Regular.ttf',
        bytes: 427336,
        sha256: '01f2afba64989e383ce85bc0486debe2b643a5df542d58288566dbb2b23acadb',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontKalamRegularttf')).font),
    },
    {
        value: 32,
        name: 'LuckiestGuy',
        family: 'rbxasset://fonts/families/LuckiestGuy.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/LuckiestGuy-Regular.ttf',
        bytes: 58292,
        sha256: '27642d3c0ef4bb18602b9b525df500d60f0c2c83b47f50512dd3aa48de0ea1a4',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontLuckiestGuyRegularttf')).font),
    },
    {
        value: 33,
        name: 'Merriweather',
        family: 'rbxasset://fonts/families/Merriweather.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Merriweather-Regular.ttf',
        bytes: 149092,
        sha256: '7a703adc03aa1d5d83c6c30b1deb1cb48aa99d432b5f257b46d35d22b3fd6fc1',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontMerriweatherRegularttf')).font),
    },
    {
        value: 34,
        name: 'Michroma',
        family: 'rbxasset://fonts/families/Michroma.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Michroma-Regular.ttf',
        bytes: 62972,
        sha256: '8e2522a39055cfee1bba775892d44141fbc048ece71e931f3c33fcd47446dfa1',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontMichromaRegularttf')).font),
    },
    {
        value: 35,
        name: 'Nunito',
        family: 'rbxasset://fonts/families/Nunito.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Nunito-Regular.ttf',
        bytes: 166700,
        sha256: '022bea9b64e6afc9146cc03d85a19fe8cca08ab9119142f90ea4ceb1577cdaa8',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontNunitoRegularttf')).font),
    },
    {
        value: 36,
        name: 'Oswald',
        family: 'rbxasset://fonts/families/Oswald.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Oswald-Regular.ttf',
        bytes: 91400,
        sha256: '264639732f5adf80fac1e4a9ef3f0eb58e58b5aead07850087662dedeba11b12',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontOswaldRegularttf')).font),
    },
    {
        value: 37,
        name: 'PatrickHand',
        family: 'rbxasset://fonts/families/PatrickHand.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/PatrickHand-Regular.ttf',
        bytes: 212112,
        sha256: '5856ba98e5ce5add264e2671a72fe510601b1f733df39ed8be0cca344a3dbe59',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontPatrickHandRegularttf')).font),
    },
    {
        value: 38,
        name: 'PermanentMarker',
        family: 'rbxasset://fonts/families/PermanentMarker.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/PermanentMarker-Regular.ttf',
        bytes: 73620,
        sha256: '4a613a4e0a67ad9c48ee6bbf664a59f73450069ad27c08d4ed21e1b9b1893590',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontPermanentMarkerRegularttf')).font),
    },
    {
        value: 39,
        name: 'Roboto',
        family: 'rbxasset://fonts/families/Roboto.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Roboto-Regular.ttf',
        bytes: 171272,
        sha256: '017c0be9aaa6d0359737e1fa762ad304c0e0107927faff5a6c1f415c7f5244ed',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontRobotoRegularttf')).font),
    },
    {
        value: 40,
        name: 'RobotoCondensed',
        family: 'rbxasset://fonts/families/RobotoCondensed.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/RobotoCondensed-Regular.ttf',
        bytes: 169848,
        sha256: 'f05ab6c1eade444bbf4e3e00710756e95c2a1d09a10425967149802219c0c0cb',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontRobotoCondensedRegularttf')).font),
    },
    {
        value: 41,
        name: 'RobotoMono',
        family: 'rbxasset://fonts/families/RobotoMono.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/RobotoMono-Regular.ttf',
        bytes: 86908,
        sha256: 'a12917d2df0631d68bfb3217048dbfab217fc9421cdaa8154b86bea0fbd87376',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontRobotoMonoRegularttf')).font),
    },
    {
        value: 42,
        name: 'Sarpanch',
        family: 'rbxasset://fonts/families/Sarpanch.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Sarpanch-Regular.ttf',
        bytes: 276380,
        sha256: '519f5e1fe88b617ff6c852dca332bd3e662eb23a4967f251e2449655dd3e7fb1',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontSarpanchRegularttf')).font),
    },
    {
        value: 43,
        name: 'SpecialElite',
        family: 'rbxasset://fonts/families/SpecialElite.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/SpecialElite-Regular.ttf',
        bytes: 151080,
        sha256: '9398ee3a3796482b70bb1731ab9b581ed1b84127a3d7179ae6a6ce3487377ebc',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontSpecialEliteRegularttf')).font),
    },
    {
        value: 44,
        name: 'TitilliumWeb',
        family: 'rbxasset://fonts/families/TitilliumWeb.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/TitilliumWeb-Regular.ttf',
        bytes: 57392,
        sha256: '189cc1458ad1364bc49e46f5e41dc33165e2dd6d66f3df3be2f224934c413190',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontTitilliumWebRegularttf')).font),
    },
    {
        value: 45,
        name: 'Ubuntu',
        family: 'rbxasset://fonts/families/Ubuntu.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Ubuntu-Regular.ttf',
        bytes: 298928,
        sha256: 'bac6461feb3488e5d330e7e9434fc8e0c513aa3c1e7b57598eab1654e1055a14',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontUbuntuRegularttf')).font),
    },
    {
        value: 46,
        name: 'BuilderSans',
        family: 'rbxasset://fonts/families/BuilderSans.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/BuilderSans-Regular.otf',
        bytes: 77352,
        sha256: '40a248a2229bdd7f0c8f924ef8c94356437d903ac58cf69a06217b9382e88af4',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontBuilderSansRegularotf')).font),
    },
    {
        value: 47,
        name: 'BuilderSansMedium',
        family: 'rbxasset://fonts/families/BuilderSans.json',
        weight: 500,
        style: 'normal',
        uri: 'rbxasset://fonts/BuilderSans-Medium.otf',
        bytes: 77856,
        sha256: '9f2d5253ab8ecefddfdebaef4c578eb3d1a2985589615604982d84fcabf6221d',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontBuilderSansMediumotf')).font),
    },
    {
        value: 48,
        name: 'BuilderSansBold',
        family: 'rbxasset://fonts/families/BuilderSans.json',
        weight: 700,
        style: 'normal',
        uri: 'rbxasset://fonts/BuilderSans-Bold.otf',
        bytes: 77840,
        sha256: '30a9f5a26fd341c2b4a8ee1418b3061445c7c6ce8b4b2565b04480c1b1328af4',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontBuilderSansBoldotf')).font),
    },
    {
        value: 49,
        name: 'BuilderSansExtraBold',
        family: 'rbxasset://fonts/families/BuilderSans.json',
        weight: 800,
        style: 'normal',
        uri: 'rbxasset://fonts/BuilderSans-ExtraBold.otf',
        bytes: 77504,
        sha256: '0837070a1713fc7647e74ec51b80ab9d4bce6af5448117c5711bc8a139f3adf0',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontBuilderSansExtraBoldotf')).font),
    },
    {
        value: 50,
        name: 'Arimo',
        family: 'rbxasset://fonts/families/Arimo.json',
        weight: 400,
        style: 'normal',
        uri: 'rbxasset://fonts/Arimo-Regular.ttf',
        bytes: 317652,
        sha256: 'f770502d7caad307e5b2131d4d763e22ed506ae4eb93775e29667bd0f8d3af1f',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./RobloxLegacyFontData')).RobloxLegacyFontData),
    },
    {
        value: 51,
        name: 'ArimoBold',
        family: 'rbxasset://fonts/families/Arimo.json',
        weight: 700,
        style: 'normal',
        uri: 'rbxasset://fonts/Arimo-Bold.ttf',
        bytes: 318184,
        sha256: 'ad88e47fa64708183695e3039a3a2d7699f212b6a1ba5f6cd6a5eb37ca71bea5',
        resource: async (): Promise<Uint8Array<ArrayBuffer>> =>
            bytes((await import('./fonts/FontArimoBoldttf')).font),
    },
];
