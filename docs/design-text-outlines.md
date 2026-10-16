# Design typography

`nexa-transport/design-font-engine` exposes `DesignFontEngine` and typed font-byte bindings. `design-builtin-fonts` loads the bundled Inter outline engine lazily. `design-text-outline` creates a shared atomic operation plan from a saved document, page, authored text selection, font engine and ID allocator. Apply it through the existing Design save API to retain revision guards and undo.

The native deferred `design_text_outline` tool uses this same planner inside its owner-scoped transaction. Optional workspace font files are authorized through the captured host filesystem and fingerprinted by content. No new RPC method or font blob transfer is required.

`design-inter-bytes` provides original regular/italic WOFF2 bytes for browser FontFace loading. `design-svg-fonts` embeds only selected built-in faces and their OFL license in explicit exports. Font engine code and expanded outline fonts remain separate lazy chunks.

The planner keeps the original text layer ID as a clipped group and emits editable span and underline paths. Geometry, opacity, fills, rich colors, borders and composite effects are retained. Unsupported fonts or glyphs reject the conversion; dependent instance overrides require detaching first. A span is limited to 10,000 commands and a conversion to 512 operations. Other font families require matching bindings; variable workspace fonts must use standalone TTF or OTF. The shared layout engine resolves bidirectional paragraphs before shaping the visual runs.

See `licenses/Inter-OFL.txt` and `licenses/DesignFontEngine.txt` for redistributed font and engine notices.

## Font-aware intrinsic layout

`DesignShapedTextMetrics` from `nexa-transport/design-shaped-text-metrics` adapts a complete-span font measurement callback to `DesignLayoutEngine`. Its intrinsic dimensions use the renderer’s rich text, line-height and wrapping model. Pass the same instance to selection, move, component and Boolean derivation planners to retain consistent geometry through edits. Browser callers use loaded font metrics; native Nexa uses the matching bundled Inter faces. Other native font families retain portable estimates until saved font bindings are supported.

Complete shaped words determine wrapping; long words break at Unicode grapheme boundaries. Combining accents, joined emoji, flags and CRLF remain intact. Fitting single-line intrinsic text uses a bounded number of shaping calls.

## Paragraph direction and font preparation

Text and reusable typography styles accept optional `direction` with `auto`, `ltr` or `rtl`. Legacy records remain unchanged when the field is absent. Paragraph resolution uses Unicode 17 bidirectional levels; wrapping retains paragraph context and original logical source ranges. Physical Left, Center and Right alignment keep their existing meaning.

`DesignBuiltinFonts.engine()` prepares the bundled Inter, Noto Emoji, Noto Sans Arabic and Noto Sans Hebrew faces. After extending an engine with static WOFF2 sources, await `engine.prepare()` before synchronous measurement or outlines. TTF/OTF and WOFF remain synchronous for standalone consumers. Variable compressed workspace fonts remain unsupported. The full standalone HarfBuzz engine includes legacy kerning and AAT; native font bytes and browser outlines share the same shaper. Its 256 MiB linear-memory ceiling and per-run glyph limits bound allocations.

Explicit SVG exports embed the needed public script faces and their OFL notices. Normal canvas and glyph-window responses keep original bodies native. Paragraph direction changes use compact `typography` operations and preserve deferred text.

## Prepared runs for paint boundaries

`DesignFontEngine.run(style, content, tracking)` retains one complete physical shaping result. The returned `DesignFontRun` exposes its total `width`, logical `caret(offset)` positions, `slice(start, end)` physical advance intervals, and `glyphs(x, baseline, window?)`. Repeated paint passes and viewport queries reuse the same glyph IDs and positions. Advance intervals describe caret geometry; glyph ink can extend beyond them. Renderers must preserve whole glyphs between source clusters and clip only glyphs whose source clusters cross a paint boundary. Create runs after paragraph resolution, using one consistent physical font style and resolved direction; different font metrics or bidirectional levels need distinct runs. `DesignFontRunStyle` requires an explicit resolved direction, and untyped callers are checked too. The run captures an immutable style and stays local to its owner; it is not a text-window wire projection. JSON serialization rejects these source-bearing objects; serialize explicit bounded geometry instead.

Offsets must be Unicode grapheme boundaries. Default-ignorable source graphemes retain their UTF-16 boundaries and consume zero advance, including when a ligature spans them. Within a ligature, matching GDEF font caret coordinates take precedence; absent or unmatched component data uses equal advance fractions. The exact font-coordinate regression uses an intentionally modified DejaVu Sans test face: one `ffi` glyph has advance 1980 and caret coordinates 200 and 1200 at 2048 units per em. Source, modifications and licensing accompany that compressed test fixture. This primitive does not yet connect paint-only grouping to the editor's rich-text layout, glyph-window clips, editable SVG or outline planner.

```ts
import { DesignBuiltinFonts } from 'nexa-transport/design-builtin-fonts';
import type { DesignFontEngine } from 'nexa-transport/design-font-engine';
import type { DesignFontRun, DesignFontRunStyle } from 'nexa-transport/design-font-run';

const fonts: DesignFontEngine = await DesignBuiltinFonts.engine();
const style: DesignFontRunStyle = {
    rich: false,
    family: 'Inter',
    size: 32,
    weight: 400,
    italic: false,
    color: '#000000',
    underline: false,
    direction: 'rtl',
};
const run: DesignFontRun = fonts.run(style, 'العربية');
const firstColor: ReturnType<DesignFontRun['slice']> = run.slice(0, 3);
const secondColor: ReturnType<DesignFontRun['slice']> = run.slice(3, run.content.length);
```
