// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type {
    DesignCreateRequest,
    DesignSaveRequest,
    DesignUndoRequest,
    DesignReadRequest,
    DesignListRequest,
    DesignEventsRequest,
    DesignChangesRequest,
    DesignLayoutRequest,
    DesignReceipt,
    DesignRecordPage,
    DesignListPage,
    DesignEventsPage,
    DesignLayoutPage,
} from './DesignRequests.js';

/** Create-document RPC contract. */
export interface DesignCreateMethod {
    readonly params: DesignCreateRequest;
    readonly result: DesignReceipt;
}
/** Atomic editing RPC contract. */
export interface DesignSaveMethod {
    readonly params: DesignSaveRequest;
    readonly result: DesignReceipt;
}
/** Conflict-safe undo RPC contract. */
export interface DesignUndoMethod {
    readonly params: DesignUndoRequest;
    readonly result: DesignReceipt;
}
/** Bounded snapshot RPC contract. */
export interface DesignReadMethod {
    readonly params: DesignReadRequest;
    readonly result: DesignRecordPage;
}
/** Owner-scoped library RPC contract. */
export interface DesignListMethod {
    readonly params: DesignListRequest;
    readonly result: DesignListPage;
}
/** Revision-journal RPC contract. */
export interface DesignEventsMethod {
    readonly params: DesignEventsRequest;
    readonly result: DesignEventsPage;
}
/** Forward delta RPC contract. */
export interface DesignChangesMethod {
    readonly params: DesignChangesRequest;
    readonly result: DesignRecordPage;
}
/** Computed-geometry RPC contract. */
export interface DesignLayoutMethod {
    readonly params: DesignLayoutRequest;
    readonly result: DesignLayoutPage;
}
