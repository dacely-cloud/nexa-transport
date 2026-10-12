# Metadata-only selection

`nexa-transport/design-selection-index` exports `DesignSelectionIndex`. Pass a validated native document, page ID and selected authored IDs. It checks page membership and locked ancestry, removes descendants covered by a selected ancestor, and returns roots in painter order. It retains the original node references and reads identity/parent/child/lock metadata. It does not measure text or solve geometry.

`DesignSelectionContext` uses this same index before adding its geometry solver. Use it for alignment, measured bounds and reparenting. Use the lighter index for scalar property commands and other metadata-only selection work, including documents whose source text is deferred. Source replacement operations still require the corresponding complete body and normal validation.

```ts
import { DesignSelectionIndex } from 'nexa-transport/design-selection-index';
import { DesignDefaults } from 'nexa-transport/design-defaults';
import type { DesignDocument, DesignNode } from 'nexa-transport/design-types';

const layer: DesignNode = DesignDefaults.node('card', 'frame');
const document: DesignDocument = {
    ...DesignDefaults.document('example'),
    nodes: [layer],
    pages: [{ id: 'page-1', name: 'Page', background: '#FFFFFF', roots: ['card'] }],
};
const index: DesignSelectionIndex = new DesignSelectionIndex(document, 'page-1', ['card']);
console.log(index.roots.map((node: DesignNode): string => node.id));
```

The index validates structure and selection metadata. Native write handlers remain the authorization and revision boundary; client checks do not grant access.
