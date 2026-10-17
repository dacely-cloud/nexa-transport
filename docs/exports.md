# Package entry points

This is the public ESM import map declared in `package.json`. Import only these
paths; internal `src/`, `dist/`, and undeclared deep paths are outside the package
contract. Runtime entries include TypeScript declarations. Entries marked
**Types only** require `import type` and provide no JavaScript module.

The [client reference](client.md), [usage guide](guide.md),
[Office/company guide](office-company.md), [reverse guide](reverse-investigation.md),
and [workflow guide](workflows.md) explain how to use these families. Exact RPC
payload fields are generated in [protocol types](protocol.md). Portable workflow
interfaces/codecs remain available through their entry points and declarations;
they do not execute server-only handlers or grant access.

## Client, chat, media, and investigations

| Import                                 | Availability   | Contract                                                                                |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `nexa-transport`                       | ESM + types    | Authenticated client, streams, events, voice, recovery, uploads, and binary channels    |
| `nexa-transport/session-files`         | ESM + types    | Bounded saved-file metadata pages, source revisions, cancellation and complete recovery |
| `nexa-transport/history-records`       | ESM + types    | Linear JSONL record framing with full schema validation and duplicate rejection         |
| `nexa-transport/chat-graph`            | ESM + types    | Colored explanatory relationship graphs and ChatGraphs validation                       |
| `nexa-transport/errors`                | ESM + types    | Transport errors, codes, and WebSocket close details                                    |
| `nexa-transport/events`                | ESM + types    | EventName, typed EventMap, and event validation                                         |
| `nexa-transport/media`                 | ESM + types    | Media/3D helpers, native event decoding, and MeshoptDecoder                             |
| `nexa-transport/options`               | **Types only** | Connection identity, authentication, resource limits, and call options                  |
| `nexa-transport/protocol`              | ESM + types    | Method enum and complete generated RPC parameters/results                               |
| `nexa-transport/reverse-investigation` | ESM + types    | Native investigation receipts, monotonic replay, and saved-page validators              |
| `nexa-transport/stream`                | **Types only** | Streaming turn type with acceptance, result, steering, cancel, and detach               |
| `nexa-transport/stream-options`        | **Types only** | Turn duration, event/byte buffers, timeout, and cancellation options                    |

## Portable tool input resolution

| Import                             | Availability | Contract                                                       |
| ---------------------------------- | ------------ | -------------------------------------------------------------- |
| `nexa-transport/tool-bridge-input` | ESM + types  | Canonical portable resolver for discovered tool bridge inputs. |

## Roblox preview helpers

`nexa-transport/roblox-point-lights` evaluates scoped native point lights and their
moving attachment poses for hardware previews. Local illumination is approximate;
point-light shadows and Studio photometric parity are not implemented.

`nexa-transport/roblox-fonts` resolves the pinned native Roblox font faces used by
text measurement and hardware previews.

`nexa-transport/roblox-beams` provides the shared seekable Beam ribbon geometry,
native endpoint bindings, appearance sequences and texture travel used by both
hardware preview adapters. It does not execute Luau or certify Studio pixel parity.

`nexa-transport/roblox-trails` provides world-space ribbons from bounded native
Trail histories, including age-based appearance, disconnected strips and
backward seeking. Captured history uses incremental head/retention updates;
the geometry sampler does not execute or synthesize Luau motion. Studio
pixel parity and replay of paths present before capture remain unverified.

| Import                                       | Availability | Contract                                                         |
| -------------------------------------------- | ------------ | ---------------------------------------------------------------- |
| `nexa-transport/roblox-legacy-font`          | ESM + types  | Portable legacy font data and lookup for native previews.        |
| `nexa-transport/roblox-particle-orientation` | ESM + types  | Portable native particle orientation calculations.               |
| `nexa-transport/roblox-keyboard-input`       | ESM + types  | Native keyboard phases and focused preview input.                |
| `nexa-transport/roblox-wheel-input`          | ESM + types  | Validated native wheel rotation and bounded pixel canvas travel. |
| `nexa-transport/roblox-text-edit`            | ESM + types  | Typed native text-edit actions for focused preview controls.     |

## Office and private company channels

| Import                            | Availability   | Contract                                                                                        |
| --------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `nexa-transport/company`          | ESM + types    | Private staffing NCO2 binary codec                                                              |
| `nexa-transport/company-hosts`    | ESM + types    | Passive execution-host report types and packet operations                                       |
| `nexa-transport/company-limits`   | **Types only** | Company budgets, concurrency, commands, and live limit packets                                  |
| `nexa-transport/company-types`    | ESM + types    | CompanyState, employees, departments, project briefs, CompanyOp, and commands                   |
| `nexa-transport/employee-results` | ESM + types    | Saved employee contributions, verification, costs, and report packets                           |
| `nexa-transport/office`           | ESM + types    | Public office and private layout framing, work projections, placement, and appearance utilities |
| `nexa-transport/project-types`    | ESM + types    | Project state, requests, packet operations, and chunks                                          |
| `nexa-transport/projects`         | ESM + types    | NCP2 project decision/state/file binary codec                                                   |
| `nexa-transport/work-types`       | **Types only** | Private project tasks, attempts, artifacts, proposals, and owner decisions                      |

## Portable workflow contracts

| Import                                        | Availability | Contract                                                                       |
| --------------------------------------------- | ------------ | ------------------------------------------------------------------------------ |
| `nexa-transport/workflow-application-models`  | ESM + types  | Installed terminal application model and effort metadata                       |
| `nexa-transport/workflow-applications`        | ESM + types  | Fixed terminal coding application definitions, including Mistral Vibe          |
| `nexa-transport/workflow-artifacts`           | ESM + types  | Bounded workflow artifact download with fragment and SHA-256 checks            |
| `nexa-transport/workflow-breakdown-codec`     | ESM + types  | Step/agent retained-usage attribution validation                               |
| `nexa-transport/workflow-calendar-codec`      | ESM + types  | Strict calendar-rule parsing                                                   |
| `nexa-transport/workflow-calendar-types`      | ESM + types  | Calendar rules, timezone and DST policies                                      |
| `nexa-transport/workflow-catalog`             | ESM + types  | Exact-version built-in catalog and default node construction                   |
| `nexa-transport/workflow-codec`               | ESM + types  | Bounded draft syntax validation                                                |
| `nexa-transport/workflow-component-types`     | ESM + types  | Roles, categories, ports, resources, and execution declarations                |
| `nexa-transport/workflow-each`                | ESM + types  | Repeated-item graph structure and validation                                   |
| `nexa-transport/workflow-graph-types`         | ESM + types  | Graph snapshots, diagnostics, and validated ordering                           |
| `nexa-transport/workflow-group-codec`         | ESM + types  | Hierarchy record and publication validation                                    |
| `nexa-transport/workflow-group-types`         | ESM + types  | Nested groups and published-port aliases                                       |
| `nexa-transport/workflow-http`                | ESM + types  | Portable HTTP request/header validation and method/response-format constants   |
| `nexa-transport/workflow-image-policy`        | ESM + types  | Strict image model selection policy/evidence validation                        |
| `nexa-transport/workflow-image-quote`         | ESM + types  | Exact image-price request/result and boundary codec                            |
| `nexa-transport/workflow-image-resolution`    | ESM + types  | Image policy preview request/result codecs                                     |
| `nexa-transport/workflow-json`                | ESM + types  | Portable typed JSON object/value parsing                                       |
| `nexa-transport/workflow-list-plan`           | ESM + types  | Bounded list plan validation                                                   |
| `nexa-transport/workflow-list-transform`      | ESM + types  | Portable list transformations                                                  |
| `nexa-transport/workflow-list-types`          | ESM + types  | List plan/transform types                                                      |
| `nexa-transport/workflow-loops`               | ESM + types  | Loop component contracts                                                       |
| `nexa-transport/workflow-mapping-codec`       | ESM + types  | Mapping request/configuration validation                                       |
| `nexa-transport/workflow-mapping-evaluator`   | ESM + types  | Portable deterministic mapping evaluation                                      |
| `nexa-transport/workflow-mapping-expressions` | ESM + types  | Expression validation and interpretation                                       |
| `nexa-transport/workflow-mapping-literal`     | ESM + types  | Literal mapping parsing                                                        |
| `nexa-transport/workflow-mapping-paths`       | ESM + types  | Safe structured value paths                                                    |
| `nexa-transport/workflow-mapping-types`       | ESM + types  | Typed mappings, expressions, and paths                                         |
| `nexa-transport/workflow-mapping-validation`  | ESM + types  | Schema-aware mapping validation                                                |
| `nexa-transport/workflow-mapping-values`      | ESM + types  | Mapping value validation/conversion                                            |
| `nexa-transport/workflow-model-effort`        | ESM + types  | Workflow effort choices and portable effort validation                         |
| `nexa-transport/workflow-model-policy`        | ESM + types  | Text model policy preview types/codecs and policy validation                   |
| `nexa-transport/workflow-models`              | ESM + types  | Model discovery filters, choices, price/capability metadata, and request codec |
| `nexa-transport/workflow-planning-alignment`  | ESM + types  | Semantic graph fingerprints and proposal anchors                               |
| `nexa-transport/workflow-planning-codec`      | ESM + types  | Strict planning request/reply parsing                                          |
| `nexa-transport/workflow-planning-edits`      | ESM + types  | Portable checked graph proposal edits                                          |
| `nexa-transport/workflow-planning-sources`    | ESM + types  | Owner-scoped planning source metadata and codecs                               |
| `nexa-transport/workflow-planning-types`      | ESM + types  | Planning requests, replies, and edit proposals                                 |
| `nexa-transport/workflow-ports`               | ESM + types  | Direction/schema compatibility for connections                                 |
| `nexa-transport/workflow-public-models`       | ESM + types  | Local public provider model catalog without discovery or credentials           |
| `nexa-transport/workflow-publication-codec`   | ESM + types  | Immutable publication checks, publication records, and request codecs          |
| `nexa-transport/workflow-request-codec`       | ESM + types  | Strict draft RPC request parsing                                               |
| `nexa-transport/workflow-requests`            | ESM + types  | Draft/catalog/validation/deletion requests and transport limits                |
| `nexa-transport/workflow-resource-codec`      | ESM + types  | Versioned resource-binding parsing                                             |
| `nexa-transport/workflow-resource-readiness`  | ESM + types  | Advisory resource readiness without I/O                                        |
| `nexa-transport/workflow-resources`           | ESM + types  | Bindings, descriptors, resource families, uses, modes, and readiness types     |
| `nexa-transport/workflow-run-codec`           | ESM + types  | Portable run snapshot/result validation                                        |
| `nexa-transport/workflow-run-request-codec`   | ESM + types  | Strict run and active-agent request parsing                                    |
| `nexa-transport/workflow-run-requests`        | ESM + types  | Run/attempt/output paging and exact agent input/control/session types          |
| `nexa-transport/workflow-run-types`           | ESM + types  | Run modes/status/events, immutable snapshots, steps, and results               |
| `nexa-transport/workflow-scalar-conversion`   | ESM + types  | Explicit scalar conversion helpers                                             |
| `nexa-transport/workflow-schedule-codec`      | ESM + types  | Strict schedule request/state parsing                                          |
| `nexa-transport/workflow-schedule-times`      | ESM + types  | Portable occurrence timing and bounded preview                                 |
| `nexa-transport/workflow-schedule-types`      | ESM + types  | Activation policy, schedule timing, state, and provenance types                |
| `nexa-transport/workflow-schema-types`        | ESM + types  | Schema fields, value shapes, and envelopes                                     |
| `nexa-transport/workflow-schemas`             | ESM + types  | Schema constructors and managed envelopes                                      |
| `nexa-transport/workflow-spending-codec`      | ESM + types  | Exact spending/classification and loop report validation                       |
| `nexa-transport/workflow-template-fields`     | ESM + types  | Safe named template paths, own-field lookup, and validation                    |
| `nexa-transport/workflow-template-inputs`     | ESM + types  | Trigger-input template preflight                                               |
| `nexa-transport/workflow-terminal-types`      | ESM + types  | Application readiness/setup and exact invocation terminal control types        |
| `nexa-transport/workflow-time-limits`         | ESM + types  | Workflow wait and time bounds                                                  |
| `nexa-transport/workflow-timed-trigger`       | ESM + types  | Timed Event output/trigger contract                                            |
| `nexa-transport/workflow-types`               | ESM + types  | Draft nodes/edges/patches, manifest references, and JSON values                |
| `nexa-transport/workflow-usage-codec`         | ESM + types  | Retained model usage request/report validation                                 |
| `nexa-transport/workflow-validation`          | ESM + types  | Portable structural graph validation                                           |
| `nexa-transport/workflow-values`              | ESM + types  | Bounded runtime value validation                                               |
| `nexa-transport/workflow-wait-codec`          | ESM + types  | Durable wait/timer data validation                                             |

`NexaClient` is the root runtime export. Connection options, stream types, and
most domain contracts have their own imports; they are not all re-exported at
the root. Project work/decision contracts use
`nexa-transport/work-types`. Use the current [client API](client.md) rather than
inventing convenience methods from an entry point name.

Browser applications use the same portable SDK as Node.js 22+ ESM consumers.
Build with a bundler for bare package specifiers, or supply an appropriate import
map. The SDK bundles its runtime dependencies and ships declarations and docs;
it does not supply browser renderers, authentication storage, an application
backend, or a provider-key vault.

## Design modules

| Import                                          | Format      | Purpose                                                                      |
| ----------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `nexa-transport/design-image-geometry`          | ESM + types | Intrinsic fit, rotation, reflection, tiling and affine image placement.      |
| `nexa-transport/design-blend-types`             | ESM + types | Layer blend modes and compositing group isolation.                           |
| `nexa-transport/design-image-transform-types`   | ESM + types | Original-image unit coordinates mapped into a paint box.                     |
| `nexa-transport/design-image-tile-types`        | ESM + types | Independent repeat-cell content transforms and original-image source crops.  |
| `nexa-transport/design-image-tile-codec`        | ESM + types | Closed repeat-cell and source-crop validation.                               |
| `nexa-transport/design-image-tile-geometry`     | ESM + types | Shared source-crop intersections and SVG sampling geometry.                  |
| `nexa-transport/design-image-transform-codec`   | ESM + types | Closed finite affine transform validation.                                   |
| `nexa-transport/design-image-sampling-types`    | ESM + types | Editable source-crop aspect and alignment.                                   |
| `nexa-transport/design-image-sampling-geometry` | ESM + types | Intrinsic source rectangles for SVG slice filtering.                         |
| `nexa-transport/design-svg-image-types`         | Types only  | Embedded raster data and host asset-admission callback.                      |
| `nexa-transport/design-asset-types`             | ESM + types | Design asset types.                                                          |
| `nexa-transport/design-asset-codec`             | ESM + types | Design asset codec.                                                          |
| `nexa-transport/design-asset-references`        | ESM + types | Design asset references.                                                     |
| `nexa-transport/design-types`                   | ESM + types | Design types.                                                                |
| `nexa-transport/design-defaults`                | ESM + types | Design defaults.                                                             |
| `nexa-transport/design-codec`                   | ESM + types | Design codec.                                                                |
| `nexa-transport/design-edits`                   | ESM + types | Design edits.                                                                |
| `nexa-transport/design-text-styles`             | ESM + types | Unicode-safe partial rich-range formatting and selected-style inspection.    |
| `nexa-transport/design-text-fills`              | ESM + types | Selected-range paint stack resolution and identity.                          |
| `nexa-transport/design-transfer-types`          | Types only  | Revision-pinned references for native copying between saved layouts.         |
| `nexa-transport/design-transfer-codec`          | ESM + types | Strict reference-only copy request validation.                               |
| `nexa-transport/design-clipboard-types`         | ESM + types | Native clipboard references, receipts and placement modes.                   |
| `nexa-transport/design-clipboard-codec`         | ESM + types | Strict copy/paste request validation without source uploads.                 |
| `nexa-transport/design-clipboard-snapshot`      | ESM + types | Portable copy-time capture for unsaved local examples.                       |
| `nexa-transport/design-clipboard-paste`         | ESM + types | Portable editable paste geometry and responsive sizing.                      |
| `nexa-transport/design-token-edits`             | ESM + types | Individual token editing, color detachment and bounded authored link counts. |
| `nexa-transport/design-operation-types`         | ESM + types | Design operation types.                                                      |
| `nexa-transport/design-operation-codec`         | ESM + types | Design operation codec.                                                      |
| `nexa-transport/design-scene`                   | ESM + types | Design scene.                                                                |
| `nexa-transport/design-layout`                  | ESM + types | Design layout.                                                               |
| `nexa-transport/design-flex`                    | ESM + types | Canonical logical flow lines and signed-gap placement.                       |
| `nexa-transport/design-grid-packing`            | ESM + types | Canonical dense cell ownership independent of visual track overlap.          |
| `nexa-transport/design-layout-types`            | ESM + types | Design layout types.                                                         |
| `nexa-transport/design-requests`                | ESM + types | Design requests.                                                             |
| `nexa-transport/design-record-codec`            | ESM + types | Design record codec.                                                         |
| `nexa-transport/design-records`                 | ESM + types | Design records.                                                              |
| `nexa-transport/design-request-codec`           | ESM + types | Design request codec.                                                        |
| `nexa-transport/design-change-codec`            | ESM + types | Design change codec.                                                         |
| `nexa-transport/design-paging`                  | ESM + types | Design paging.                                                               |
| `nexa-transport/design-tidy-geometry`           | ESM + types | Free-selection grid inference and signed spacing.                            |
| `nexa-transport/design-tidy-edits`              | ESM + types | Native tidy planning with parent transforms and constraint captures.         |
| `nexa-transport/design-selection`               | ESM + types | Design selection.                                                            |
| `nexa-transport/design-selection-types`         | ESM + types | Design selection types.                                                      |
| `nexa-transport/design-svg`                     | ESM + types | Design svg.                                                                  |
| `nexa-transport/design-svg-geometry`            | ESM + types | Design svg geometry.                                                         |
| `nexa-transport/design-svg-paints`              | ESM + types | Editable paint servers and bounded portable angular/diamond raster paint.    |
| `nexa-transport/design-gradient-sampling`       | ESM + types | Portable normalized gradient color sampling for angular and diamond paints.  |
| `nexa-transport/design-svg-types`               | ESM + types | Design svg types.                                                            |
| `nexa-transport/design-text-layout`             | ESM + types | Design text layout.                                                          |
| `nexa-transport/design-text-direction`          | ESM + types | Paragraph direction and resolved visual-run types.                           |
| `nexa-transport/design-text-bidi`               | ESM + types | Paragraph-aware visual ordering with logical source slices.                  |
| `nexa-transport/design-script-font-bytes`       | ESM + types | Original public Arabic and Hebrew font bytes.                                |
| `nexa-transport/design-paths`                   | ESM + types | Design paths.                                                                |
| `nexa-transport/design-polygons`                | ESM + types | Editable regular polygon and star geometry and validated compact settings.   |
| `nexa-transport/design-arcs`                    | ESM + types | Editable ellipse arcs, pie sectors and donuts with bounded native curves.    |
| `nexa-transport/design-recolor`                 | ESM + types | Scoped native subtree recoloring without source-body replacement.            |
| `nexa-transport/design-color-read-codec`        | ESM + types | Bounded selection-color read validation.                                     |
| `nexa-transport/design-color-read-types`        | ESM + types | Native selection-color request and response types.                           |
| `nexa-transport/design-comment-read-codec`      | ESM + types | Closed feedback-summary and selected body-window validation.                 |
| `nexa-transport/design-comment-read-types`      | ESM + types | Revision-pinned feedback scopes, excerpts and text continuations.            |
| `nexa-transport/design-components`              | ESM + types | Design components.                                                           |
| `nexa-transport/design-component-types`         | ESM + types | Design component types.                                                      |
| `nexa-transport/design-boolean-edits`           | ESM + types | Design boolean edits.                                                        |
| `nexa-transport/design-boolean-types`           | ESM + types | Design boolean types.                                                        |
| `nexa-transport/design-boolean-kernel`          | ESM + types | Design boolean kernel.                                                       |
| `nexa-transport/design-mask-types`              | ESM + types | Design mask types.                                                           |
| `nexa-transport/design-mask-geometry`           | ESM + types | Design mask geometry.                                                        |
| `nexa-transport/design-variants`                | ESM + types | Design variants.                                                             |
| `nexa-transport/design-variant-types`           | ESM + types | Design variant types.                                                        |
| `nexa-transport/design-font-run`                | ESM + types | Prepared glyph runs and logical source paint ranges.                         |
| `nexa-transport/design-text-shaping`            | ESM + types | Shared shaping groups across adjacent paint-only text ranges.                |
| `nexa-transport/design-text-glyphs`             | ESM + types | Paint-preserving glyphs and clipped outline pieces from prepared layout.     |
| `nexa-transport/design-font-engine`             | ESM + types | Design font engine.                                                          |
| `nexa-transport/design-builtin-fonts`           | ESM + types | Design builtin fonts.                                                        |
| `nexa-transport/design-inter-bytes`             | ESM + types | Design inter bytes.                                                          |
| `nexa-transport/design-inter-outline-bytes`     | ESM + types | Original Inter sfnt bytes for font shaping and browser consumers.            |
| `nexa-transport/design-text-outline`            | ESM + types | Design text outline.                                                         |
| `nexa-transport/design-svg-fonts`               | ESM + types | Design svg fonts.                                                            |
| `nexa-transport/design-shaped-text-metrics`     | ESM + types | Design shaped text metrics.                                                  |
| `nexa-transport/design-font-types`              | ESM + types | Design font types.                                                           |
| `nexa-transport/design-font-codec`              | ESM + types | Design font codec.                                                           |
| `nexa-transport/design-font-bindings`           | ESM + types | Design font bindings.                                                        |

## Windowed design canvases

| Import                                    | Availability | Contract                                                              |
| ----------------------------------------- | ------------ | --------------------------------------------------------------------- |
| `nexa-transport/design-flow-ordering`     | ESM + types  | Native sibling reordering from keyboard and drag geometry             |
| `nexa-transport/design-view-types`        | ESM + types  | Revision-pinned active-page projections and explicit forest selectors |
| `nexa-transport/design-view-codec`        | ESM + types  | Strict projection request validation                                  |
| `nexa-transport/design-font-glyph-types`  | ESM + types  | Saved-font glyph outline and metric records                           |
| `nexa-transport/design-text-window-types` | ESM + types  | Bounded native text and glyph window contracts                        |
| `nexa-transport/design-text-window-codec` | ESM + types  | Strict text-window request and page validation                        |
| `nexa-transport/design-canvas-types`      | ESM + types  | Canvas projections with deferred text and intrinsic metrics           |
| `nexa-transport/design-canvas-codec`      | ESM + types  | Strict paged canvas-metric request validation                         |

## Integrated scene support

| Import                                    | Availability | Contract                                                      |
| ----------------------------------------- | ------------ | ------------------------------------------------------------- |
| `nexa-transport/roblox-scene-hierarchy`   | ESM + types  | Bounded topology validation and forward/backward projection   |
| `nexa-transport/roblox-default-textures`  | ESM + types  | Original built-in sprite atlas and resource lookup            |
| `nexa-transport/roblox-scene-textures`    | ESM + types  | Validated scene image atlases and resource lookup             |
| `nexa-transport/roblox-gui-layout`        | ESM + types  | Portable Roblox gui layout support                            |
| `nexa-transport/roblox-gui-images`        | ESM + types  | Image patches, crop/scale modes and bounded tiling.           |
| `nexa-transport/roblox-gui-classes`       | ESM + types  | GUI object, button, image and text class identities.          |
| `nexa-transport/roblox-execution-context` | ESM + types  | Immutable native server/client VM side                        |
| `nexa-transport/roblox-live-descriptor`   | ESM + types  | Portable Roblox live descriptor support                       |
| `nexa-transport/roblox-live-state`        | ESM + types  | Portable Roblox live state support                            |
| `nexa-transport/roblox-part-geometry`     | ESM + types  | Portable Roblox part geometry support                         |
| `nexa-transport/roblox-mesh-geometry`     | ESM + types  | Indexed MeshPart geometry and decoded resource reuse          |
| `nexa-transport/roblox-scene-meshes`      | ESM + types  | Bounded original mesh resources and portable scene validation |
| `nexa-transport/roblox-particles`         | ESM + types  | Portable Roblox particles support                             |
| `nexa-transport/roblox-environment`       | ESM + types  | Bounded held world-wind observations and deterministic lookup |
| `nexa-transport/roblox-scene-codec`       | ESM + types  | Portable Roblox scene codec support                           |
| `nexa-transport/roblox-scene-diagnostics` | ESM + types  | Portable Roblox scene diagnostics support                     |
| `nexa-transport/roblox-scene-examples`    | ESM + types  | Portable Roblox scene examples support                        |
| `nexa-transport/roblox-scene-input`       | ESM + types  | Portable Roblox scene input support                           |
| `nexa-transport/roblox-scene-luau`        | ESM + types  | Portable Roblox scene luau support                            |
| `nexa-transport/roblox-scene-runtime`     | ESM + types  | Portable Roblox scene runtime support                         |
| `nexa-transport/roblox-scene-schema`      | ESM + types  | Portable Roblox scene schema support                          |
| `nexa-transport/roblox-scene-types`       | ESM + types  | Portable Roblox scene types support                           |
| `nexa-transport/roblox-scene-xml`         | ESM + types  | Portable Roblox scene xml support                             |

`nexa-transport/design-typography-styles` exposes strict saved typography definitions, overrides and link validation. Use compact token and typography-style operations through design.save.

Gradient geometry and compact edits are available through `nexa-transport/design-gradient-types` (types), `nexa-transport/design-gradient-geometry` and `nexa-transport/design-paint-gradient`.

Stroke cap and join choices are available through `nexa-transport/design-stroke-types`; conservative painted bounds use `nexa-transport/design-stroke-geometry`.

Editable SVG import uses `nexa-transport/design-svg-import` for portable layer conversion and undo, `nexa-transport/design-svg-import-types` for requests and limits, and `nexa-transport/design-svg-import-codec` for strict boundary validation. Saved imports use `client.call(Method.DesignSvgImport, request)`.

SVG imports retain local use/symbol references as independent editable copies, nested SVG viewport clips, clip paths and alpha/luminance masks. Mask regions and content coordinate systems remain independent; native source layers can be edited and undone through the usual document operations. External resources, SVG text, images and filters remain unsupported.

Metadata-only page ownership, locked ancestry and topmost selection are available through `nexa-transport/design-selection-index`. See [selection indexing](design-selection-index.md).

## Image color controls

| Import                                         | Availability | Contract                                                          |
| ---------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| `nexa-transport/design-image-adjustment-types` | ESM + types  | Typed non-destructive photo controls and shared color parameters. |
| `nexa-transport/design-image-adjustment-codec` | ESM + types  | Bounded canonical controls and partial edits.                     |
| `nexa-transport/design-image-color`            | ESM + types  | Shared sRGB color matrix, tone curve and SVG primitives.          |

`nexa-transport/design-effect-metrics` exports the shared native effect margin and influence calculations used by SVG export, graph import and the website renderer.

`nexa-transport/design-clipboard-cut` exposes the canonical local cut planner; saved documents use the atomic `design.clipboard.cut` gateway method.

- `nexa-transport/design-pattern-geometry`: DesignPatternGeometry.
- `nexa-transport/design-pattern-sources`: DesignPatternSources.
- `nexa-transport/design-pattern-tile-types`: DesignPatternTileTypes.
- `nexa-transport/design-pattern-tile-codec`: DesignPatternTileCodec.
- `nexa-transport/design-paint-pattern-edits`: DesignPaintPatternEdits.
- `nexa-transport/design-svg-selections`: DesignSvgSelections.

- `nexa-transport/design-pattern-references`: linked source dependency traversal and remapping.
