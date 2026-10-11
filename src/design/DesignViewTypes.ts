// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { DesignReadRequest, DesignRecordPage } from './DesignRequests.js';

/** A revision-pinned page view retains topology while deferring inactive text and vector bodies. */
export interface DesignViewRequest extends DesignReadRequest {
    /** Null or a removed preferred page selects the document's first page. */
    readonly pageId: string | null;
    /** Additional existing layers and their dependencies; removed identities are ignored during shared refresh. */
    readonly includeIds: readonly string[];
}

/** Deferred records are valid identity projections, never complete editable copies of their original bodies. */
export interface DesignViewPage extends DesignRecordPage {
    /** The resolved primary page is stable across all continuations. */
    readonly pageId: string;
    /** Only deferred node identities carried in this bounded record page or fragment. */
    readonly deferredIds: readonly string[];
}

/** The gateway advertises view support independently of the legacy complete-record read. */
export interface DesignViewMethod {
    readonly params: DesignViewRequest;
    readonly result: DesignViewPage;
}
