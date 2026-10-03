// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import type { CompanyProject } from './CompanyProtocol.js';

/** Project access is explicitly delegated; it never changes Chat or company ownership. */
export type CompanyCollaboratorRole = 'reviewer' | 'coordinator';
/** Invitations require the named account to accept before private project access is granted. */
export type CompanyInvitationState = 'pending' | 'active' | 'declined' | 'revoked';
/** A durable, narrowly scoped delegation. Expiration is checked against server time on every use. */
export interface CompanyCollaborationGrant {
    readonly id: string;
    readonly revision: bigint;
    readonly owner: string;
    readonly recipient: string;
    readonly projectId: string;
    /** Owner-supplied label, never an authentication identity. */
    readonly label: string;
    readonly role: CompanyCollaboratorRole;
    readonly state: CompanyInvitationState;
    readonly createdAt: bigint;
    readonly expiresAt: bigint;
    readonly decidedAt: bigint;
}
/** The recipient shares this short-lived code with the owner; it cannot authorize work itself. */
export interface CompanyCollaboratorCode {
    readonly code: string;
    readonly expiresAt: bigint;
}
/** Owner invitation requires a current recipient code and an owned project. */
export interface CompanyCollaboratorInvite {
    readonly id: string;
    readonly projectId: string;
    readonly code: string;
    readonly label: string;
    readonly role: CompanyCollaboratorRole;
    readonly durationMs: bigint;
}
/** Account decisions use a stable ID and optimistic concurrency on the exact grant. */
export interface CompanyCollaboratorDecision {
    readonly id: string;
    readonly grantId: string;
    readonly revision: bigint;
    readonly decision: 'accept' | 'decline' | 'revoke';
}
/** Only these actions may run through a delegated project context. */
export type CompanyCollaboratorAction =
    'read' | 'artifact' | 'accept' | 'assign' | 'schedule' | 'office';

/** Invite cards expose only the names needed to decide whether to join. */
export interface CompanyCollaborationCard {
    readonly grant: CompanyCollaborationGrant;
    readonly companyName: string;
    readonly projectName: string;
}
/** Active collaborators receive only their project's roster, without employee configuration. */
export interface CompanyCollaborationContext extends CompanyCollaborationCard {
    readonly project: CompanyProject;
    readonly employees: readonly {
        readonly id: string;
        readonly name: string;
        readonly role: string;
    }[];
}
