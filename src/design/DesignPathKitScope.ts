// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignPathKitPath } from './DesignPathKitTypes.js';

/** Owns native allocations across successful and failed vector operations. */
export class DesignPathKitScope {
    #paths: Set<DesignPathKitPath> = new Set();

    /** Registers a newly allocated handle and rejects native operation failure. */
    public own(path: DesignPathKitPath | null): DesignPathKitPath {
        if (path === null) {
            throw new Error('The vector operation could not produce valid geometry.');
        }
        this.#paths.add(path);
        return path;
    }

    /** Frees intermediates immediately to keep memory bounded during multi-layer operations. */
    public release(path: DesignPathKitPath): void {
        if (this.#paths.delete(path)) {
            path.delete();
        }
    }

    /** Every remaining handle is freed even when validation or conversion throws. */
    public close(): void {
        for (const path of this.#paths) {
            path.delete();
        }
        this.#paths.clear();
    }
}
