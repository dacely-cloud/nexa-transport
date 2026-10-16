# Editable selected-text fills

`DesignTextRun.fills` and `DesignTextStyleChanges.fills` use the same canonical paint records as layer fills. A range can have up to eight paints, ordered bottom to top: solid, linear, radial, angular, diamond or an owner-scoped image. Text remains editable. Source offsets count UTF-16 units and cannot split surrogate pairs.

A supplied stack replaces the layer paints for that range. `[]` leaves the selected characters unfilled; `null` restores layer paints. Omitted fields preserve existing formatting. A non-null stack requires a null range `color`; a compact patch can omit `color`. Setting `color` replaces any existing range stack. Gradient coordinates and image framing use the entire text box, including wrapped lines and viewport windows.

```ts
import { DesignDefaults } from 'nexa-transport/design-defaults';
import { DesignTextStyles } from 'nexa-transport/design-text-styles';
import {
    DesignPaintKind,
    type DesignNode,
    type DesignPaint,
    type DesignText,
} from 'nexa-transport/design-types';

const template: DesignNode = DesignDefaults.node('caption', 'text');
if (template.text === null) {
    throw new Error('Missing text defaults');
}
const gradient: DesignPaint = {
    ...DesignDefaults.paint(),
    kind: DesignPaintKind.Linear,
    stops: [
        { offset: 0, color: '#CC3366' },
        { offset: 1, color: '#97D9B7' },
    ],
};
const text: DesignText = { ...template.text, content: 'Find your next idea' };
const styled: DesignText = DesignTextStyles.apply(text, 0, 4, {
    fills: [gradient],
    weight: 700,
    underline: true,
});
console.log(styled.content === text.content);
```

For saved documents, send a compact `text-style` operation through the authenticated client and pin `expectedRevision`. Verify with `design.text-style`: it returns original intersecting ranges and full-source fingerprints, without paragraph text. Pages normally stay within 12,000 bytes. A single first range with a stack can use up to 65,536 bytes, retaining every legal stop; continue with the exact `nextOffset` at the same revision and source range.

Connected editors expose the stack controls only when `hello.features.designTextRangeFills === true`. A glyph window carries `rangeFills: true` when the complete layer uses range stacks, even if its visible glyphs inherit layer paint. It includes only visible range styles and glyph positions. Image references from other ranges are not sent. Shared image caches retain each renderer's active window demand independently.

SVG export preserves logical text and emits paint servers for the stacks. Angular and diamond colors embed only the paint, with existing per-paint and document limits. Additional text sampling uses only remaining export headroom; it does not reduce the set of exports accepted at ordinary density. SVG import accepts independent linear and radial tspan fills. Patterned text and independent rich strokes still reject explicitly; exported stack patterns do not yet imply universal editable SVG reimport.
