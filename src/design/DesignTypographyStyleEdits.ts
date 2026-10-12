// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignLayerAuthority } from './DesignLayerAuthority.js';
import type { DesignTypographyStyleOperation } from './DesignOperationTypes.js';
import type { DesignNode, DesignToken } from './DesignTypes.js';
import { DesignTypographyLinks } from './DesignTypographyLinks.js';

/** Linking and detaching styles preserves the source body, rich formatting and authored layer identity. */
export class DesignTypographyStyleEdits {
    /** Applying the same style again clears local overrides; null keeps the current rendered typography. */
    public static apply(
        authority: DesignLayerAuthority,
        tokens: readonly DesignToken[],
        operation: DesignTypographyStyleOperation,
    ): DesignNode {
        const node: DesignNode = authority.node(operation.id, operation.pageId);
        if (node.text === null) {
            throw new Error('Layer has no editable typography: ' + node.id);
        }
        if (operation.tokenId !== null) {
            DesignTypographyLinks.values(tokens, operation.tokenId);
        }
        const edited: DesignNode = {
            ...node,
            text: {
                ...node.text,
                typographyStyle: operation.tokenId === null ? null : { tokenId: operation.tokenId },
            },
        };
        const resolved: DesignNode | undefined = DesignTypographyLinks.resolve([edited], tokens)[0];
        if (resolved === undefined) {
            throw new Error('Missing linked typography layer');
        }
        return resolved;
    }
}
