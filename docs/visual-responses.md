# Inline SVG diagrams

Nexa draws diagrams directly in its web chat reply. It writes the drawing as a fenced code block whose language is `svg`, and web chat renders that block as a native figure in the site theme. There is no tool call, discovery step or extra model round trip, so a diagram streams in with the rest of the answer. Numeric charts are written the same way, as a fenced `chart` block (see [Inline charts](graphics.md)), and executable workflows keep their own tools.

Nexa reaches for a diagram when a picture explains better than prose: an architecture, a request or data flow, a branching process, a state machine, a hierarchy, a timeline, a cycle, a comparison, some geometry or an annotated concept. Definitions and short linear steps stay as text. When the diagram describes the user's own system, Nexa reads the relevant evidence first and labels generic examples as illustrative.

The authoring rules live in `src/visuals/InlineSvgGuidance.ts` and are included in the system prompt only on surfaces that render inline visuals (web chat and the gateway). Channels such as Telegram and Discord never receive them.

## Format

A figure is a single `<svg viewBox="0 0 680 H">` element, with the height fitted to the content and coordinates in pixels at the 680 width. A `<title>` names it for screen readers and for the downloaded file. Chat supplies the frame, background, font and the light or dark theme, so the drawing leaves those out.

Theme classes carry the styling, on an element or on a `<g>` that wraps one component:

- Text: `heading` (15px semibold), `label` (14px), `caption` (12px muted) and `mono` for code.
- Shapes: `box` for a card with fill and border, and `zone` for a dashed region that groups boxes.
- Connectors: `line` and `arrow`, which adds an arrowhead at the end of the path (`both` adds two). Add `dashed`, or `flow` for animated movement that respects reduced motion.
- Colors: `gray`, `blue`, `teal`, `green`, `amber`, `orange`, `red`, `pink` and `purple`. On a group or a box they tint the box, its border, its heading and the arrows inside it. On text they color the text, and on a bare shape they fill it.

Any other color is remapped onto this palette, so a drawing made for a white page still reads well in dark mode. When exact colors are the point, such as flags, swatches or brand marks, `data-colors="exact"` on the `<svg>` keeps them.

```svg
<svg viewBox="0 0 680 124" xmlns="http://www.w3.org/2000/svg">
<title>Request path</title>
<g class="blue"><rect class="box" x="40" y="30" width="200" height="64" rx="10"/>
<text class="heading" x="140" y="58" text-anchor="middle">Browser</text>
<text class="caption" x="140" y="78" text-anchor="middle">Sends the request</text></g>
<path class="arrow" d="M242 62 H438"/>
<text class="caption" x="340" y="52" text-anchor="middle">HTTPS</text>
<g class="green"><rect class="box" x="440" y="30" width="200" height="64" rx="10"/>
<text class="heading" x="540" y="58" text-anchor="middle">API server</text>
<text class="caption" x="540" y="78" text-anchor="middle">Returns JSON</text></g>
</svg>
```

## Rendering and safety

Web chat never hands the source to an HTML or XML parser. A small strict reader builds the figure element by element and keeps only drawing elements (shapes, text, groups, markers, gradients and clip paths) with a fixed attribute vocabulary. Scripts, styles, event handlers, `foreignObject`, images, links, `use`, patterns, filters and animation elements are dropped. Ids move into a private per-figure namespace, references must point inside the same figure, and document type declarations are rejected. Source size, element count and nesting depth are bounded.

While the reply streams, the figure draws as each tag completes. Once it is complete, labels that overflow their box shrink to fit and the view box grows to include anything drawn outside it. Each figure offers its code, a copy of the original source and a standalone download.

Clients other than web chat see an ordinary fenced code block and can show it as code.
