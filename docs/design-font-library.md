# Private design fonts

Nexa can persist an authorized workspace font in the current user's private library:

```json
{
    "id": "brand-regular",
    "family": "Brand Sans",
    "weight": 400,
    "italic": false,
    "path": "fonts/BrandSans.ttf"
}
```

Pass that object to `design_font_import`. Discover its schema with `tool_describe` and discover saved fonts with `design_font_library {"after":null,"limit":16}`. Both tools return metadata without font bytes. The host selects the authenticated owner; arguments cannot select another account.

The original font remains available after deleting its source file or starting another agent session. Convert saved text using `design_text_outline` with `fonts:[{"fontId":"brand-regular"}]`. The font's declared family, weight and italic binding must match the selected text. Variable TTF/OTF fonts support their actual weight range. A one-off `fonts:[{family,weight,italic,path}]` outline call remains supported but does not persist that file. Outlining is a normal revision-checked, retry-safe, undoable design command.

An imported ID is immutable. An exact retry reuses it without another quota charge; changing the style binding or bytes requires a new ID. Libraries are limited to 64 files and 64 MiB per user, with a maximum of 16 MiB per file. Imports, original binary chunks and budget changes commit atomically. Native font loads verify the final SHA-256 digest and do not cache private faces globally. Cancellation rolls back an incomplete publication.

Standalone TTF/OTF and static WOFF/WOFF2 files are supported. Variable workspace fonts require uncompressed TTF/OTF because the current parser cannot safely vary compressed fonts. Font reads use at most 192 KiB per slice. Library pages contain at most 32 metadata records. The portable font metadata and slice validators are exported as `nexa-transport/design-font-types` and `nexa-transport/design-font-codec`.

Persistent document font bindings, browser font registration, upload controls and public font WebSocket methods are not connected yet. Importing alone does not change canvas text rendering. Outlining produces editable paths that already render without loading a font in the browser.
