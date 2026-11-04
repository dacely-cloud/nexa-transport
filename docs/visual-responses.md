# Rich visual responses

`render_visual` delivers a structured visual explanation directly in the conversation. It replaces the old explanatory graph tool and workflow-canvas viewer. Numerical plots continue to use `render_graphic`; executable workflows retain their own tools.

When asked to explain an architecture, Nexa reads the relevant evidence, identifies components and relationships, plans the reading order and layout, then calls `render_visual`. The result carries the complete versioned scene through authenticated live chat and saved conversation history. The interface renders it inline, with large labels, colored arrows and optional flow motion.

The scene contains `version: 1`, `id`, `title`, `description`, `width`, `height`, `elements`, `connections`, and `steps`. Discover the complete tool schema with `tool_describe`. Optional presentation fields receive safe defaults.

- Elements have stable IDs, a `kind` (`card`, `group`, `text`, `metric`), plain-text `title`, optional `detail`, `eyebrow`, `value`, `icon`, `tone`, and explicit `x`, `y`, `width`, `height` in display pixels.
- Connections reference element IDs with `from` and `to`. They accept a `label`, attachment sides, `solid` or `dashed` lines, `forward`, `both`, or `none` arrows, optional `animated` flow, and optional `via` waypoints. Automatic routes avoid cards.
- Steps have a title, explanation, and arrays of element and connection IDs. These are optional metadata for consumers that support walkthroughs; omit them for the minimal Chat renderer.

Prefer 4–12 components on a 720–1080px canvas. Use short component names, one concise sentence of detail, compact 100–120px elements, sufficient space for large connection labels and a clear direction. Avoid numbered eyebrows, unrelated metrics and repeated summaries. Group related components with a background region. Reserve room for arrow labels. Use motion sparingly to explain flow. Read the actual system before describing a user’s architecture; label generic examples as illustrative.

The format accepts semantic colors and curated icons. Text stays text. HTML, SVG source, CSS, JavaScript, external images, actions and URLs are outside the scene vocabulary. Native execution and network validation reject invalid references, non-finite geometry, unsupported styles and oversized payloads. Scenes are limited to 32 elements, 64 connections, eight steps and 64 KiB.

The renderer displays the diagram without a visible scene title, toolbar, step navigation or decorative panels. Component names use 20px text, descriptions 16px and connection labels 17px. A single icon expands the visual. Connection colors follow their source components. Native scrolling keeps text readable on narrow screens, and reduced-motion preferences disable flow animation.

```json
{
    "version": 1,
    "id": "inference",
    "title": "An illustrative inference path",
    "width": 760,
    "height": 280,
    "elements": [
        {
            "id": "router",
            "kind": "card",
            "title": "Request router",
            "detail": "Selects a ready worker.",
            "icon": "server",
            "tone": "blue",
            "x": 32,
            "y": 60,
            "width": 240,
            "height": 160
        },
        {
            "id": "worker",
            "kind": "card",
            "title": "GPU worker",
            "detail": "Generates and streams tokens.",
            "icon": "cpu",
            "tone": "orange",
            "x": 488,
            "y": 60,
            "width": 240,
            "height": 160
        }
    ],
    "connections": [
        {
            "id": "dispatch",
            "from": "router",
            "to": "worker",
            "label": "Batch / tokens",
            "arrow": "both",
            "animated": true
        }
    ]
}
```
