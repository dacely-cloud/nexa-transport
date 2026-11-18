// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { expect, it } from 'vitest';
import { Method } from 'nexa-protocol/gateway/Method.js';
import type { WorkspacePage, Workspace } from 'nexa-protocol/workspace/Types.js';
import { SchemaValidator } from 'nexa-protocol/schema/Schema.js';
import { schema } from 'nexa-protocol/schema/SchemaData.js';
import { methodValidators } from 'nexa-protocol/schema/MethodValidators.js';

const workspace: Workspace = {
    id: 'saved-project',
    name: 'Saved project',
    root: '/private/project',
    kind: 'managed',
    createdAt: 1,
    updatedAt: 2,
    lastUsedAtMs: '9007199254740991',
    owner: { userId: 'owner' },
};
const page: WorkspacePage = {
    entries: [workspace],
    nextCursor: 'v2:2:saved-project',
    titles: [{ workspaceId: workspace.id, title: 'My project' }],
    presence: [
        {
            workspaceId: workspace.id,
            assignment: 'a'.repeat(64),
            modifiedAtNs: '9007199254740991000',
            state: 'nonempty',
        },
    ],
};
const validator: SchemaValidator = new SchemaValidator(schema);
it('round-trips precise activity and presence metadata through the generated page decoder', (): void => {
    expect(methodValidators[Method.WorkspacesPage].result(page)).toBe(true);
    expect(
        validator.validate('#/definitions/WorkspacePageParams', {
            limit: 6,
            includePresence: true,
        }),
    ).toBe(true);
    expect(
        validator.validate('#/definitions/WorkspacePageParams', {
            limit: 6,
            includePresence: 'true',
        }),
    ).toBe(false);
});
it('rejects malformed activity and presence rather than dropping new fields silently', (): void => {
    expect(
        methodValidators[Method.WorkspacesPage].result({
            ...page,
            entries: [{ ...workspace, lastUsedAtMs: 1 }],
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.WorkspacesPage].result({
            ...page,
            presence: [{ ...page.presence?.[0], state: 'not-checked' }],
        }),
    ).toBe(false);
    expect(
        methodValidators[Method.WorkspacesPage].result({
            ...page,
            presence: [{ ...page.presence?.[0], modifiedAtNs: 1 }],
        }),
    ).toBe(false);
});
it('accepts older bounded page responses while retaining a typed explicit-visit method', (): void => {
    expect(
        methodValidators[Method.WorkspacesPage].result({ entries: [workspace], nextCursor: null }),
    ).toBe(true);
    expect(Method.WorkspacesVisit).toBe('workspaces.visit');
    expect(methodValidators[Method.WorkspacesVisit].result({ ok: true })).toBe(true);
    expect(methodValidators[Method.WorkspacesVisit].result({ ok: 'true' })).toBe(false);
});
