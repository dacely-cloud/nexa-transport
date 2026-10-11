# Design typography

`nexa-transport/design-font-engine` exposes `DesignFontEngine` and typed font-byte bindings. `design-builtin-fonts` loads the bundled Inter outline engine lazily. `design-text-outline` creates a shared atomic operation plan from a saved document, page, authored text selection, font engine and ID allocator. Apply it through the existing Design save API to retain revision guards and undo.

The native deferred `design_text_outline` tool uses this same planner inside its owner-scoped transaction. Optional workspace font files are authorized through the captured host filesystem and fingerprinted by content. No new RPC method or font blob transfer is required.

`design-inter-bytes` provides original regular/italic WOFF2 bytes for browser FontFace loading. `design-svg-fonts` embeds only selected built-in faces and their OFL license in explicit exports. Font engine code and expanded outline fonts remain separate lazy chunks.

The planner keeps the original text layer ID as a clipped group and emits editable span and underline paths. Geometry, opacity, fills, rich colors, borders and composite effects are retained. Unsupported fonts or glyphs reject the conversion; dependent instance overrides require detaching first. A span is limited to 10,000 commands and a conversion to 512 operations. Other font families require matching bindings; variable workspace fonts must use standalone TTF or OTF. This is not a persistent custom-font asset library or a full bidirectional paragraph engine.

See `licenses/Inter-OFL.txt` and `licenses/DesignFontEngine.txt` for redistributed font and engine notices.

## Font-aware intrinsic layout

`DesignShapedTextMetrics` from `nexa-transport/design-shaped-text-metrics` adapts a complete-span font measurement callback to `DesignLayoutEngine`. Its intrinsic dimensions use the renderer’s rich text, line-height and wrapping model. Pass the same instance to selection, move, component and Boolean derivation planners to retain consistent geometry through edits. Browser callers use loaded font metrics; native Nexa uses the matching bundled Inter faces. Other native font families retain portable estimates until saved font bindings are supported.

Complete shaped words determine wrapping; long words break at Unicode grapheme boundaries. Combining accents, joined emoji, flags and CRLF remain intact. Fitting single-line intrinsic text uses a bounded number of shaping calls.
