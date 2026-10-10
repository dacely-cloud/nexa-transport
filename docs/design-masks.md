# Editable Design masks

The canonical Design model supports `DesignKind.Mask` with an optional `mask` record required on mask groups: `{mode: 'alpha' | 'vector' | 'luminance', sourceId: string | null}`. Ordinary nodes omit this field.

Import `DesignMaskMode` from `nexa-transport/design-mask-types`. The existing Design save/arrange RPCs carry masking edits over the authenticated WebSocket. `DesignSelectionAction.Mask` groups selected siblings using the bottom selected layer as source. `ReleaseMask` preserves the complete forest in an ordinary group. Native tooling exposes these as `design_arrange` actions `mask` and `release-mask`; `design_guide` explains exact calls.

Source IDs reference immediate children and are remapped on duplication and component detachment. Assign another child or release masking before removing an active source. An empty source hides the content. The existing transaction revision guard, command identities, paging and undo journal apply unchanged.

`DesignScene.paints(node)` excludes source artwork from ordinary painter passes. A mask-source render pass supplies its owning group ID as the optional second argument. Vector coverage can use the portable `DesignMaskGeometry.vector(node)` adapter from `nexa-transport/design-mask-geometry`; it retains geometry and glyph records without changing stored paints.

SVG export retains source definitions and masks rather than flattening editable artwork. Alpha and vector use alpha mask coverage; luminance explicitly uses sRGB luminance. Browser masking uses the existing editor renderer and a bounded render-target pool.
