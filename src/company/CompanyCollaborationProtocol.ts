// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { BinaryReader, BinaryWriter } from './CompanyBinary.js';
import {
    CompanyProjectOp,
    CompanyProjectProtocol,
    type CompanyProjectRequest,
    type CompanyProjectResponse,
} from './CompanyProjectProtocol.js';
import {
    OfficeGameOp,
    OfficeProtocol,
    type OfficeGamePacket,
    type OfficePlayer,
} from '../office/OfficeProtocol.js';
import type {
    CompanyCollaborationGrant,
    CompanyCollaborationCard,
    CompanyCollaborationContext,
    CompanyCollaboratorCode,
    CompanyCollaboratorInvite,
    CompanyCollaboratorDecision,
} from './CompanyCollaborationTypes.js';
export type {
    CompanyCollaborationGrant,
    CompanyCollaborationCard,
    CompanyCollaborationContext,
    CompanyCollaboratorCode,
    CompanyCollaboratorInvite,
    CompanyCollaboratorDecision,
    CompanyCollaboratorRole,
} from './CompanyCollaborationTypes.js';

/** Explicit account collaboration, separate from ordinary visitor capabilities. */
export const CollaborationOp = {
    Code: 1,
    List: 2,
    Invite: 3,
    Decide: 4,
    Context: 5,
    Project: 6,
    Watch: 7,
    Leave: 8,
    Move: 9,
    CodeResult: 128,
    Invitations: 129,
    ContextResult: 130,
    ProjectResult: 131,
    Office: 132,
    Error: 133,
} as const;
/** Delegated requests never contain an owner principal or a generic RPC method. */
export type CollaborationRequest =
    | {
          readonly op: typeof CollaborationOp.Code | typeof CollaborationOp.Leave;
          readonly id: string;
      }
    | { readonly op: typeof CollaborationOp.List; readonly id: string; readonly projectId: string }
    | ({ readonly op: typeof CollaborationOp.Invite } & CompanyCollaboratorInvite)
    | ({ readonly op: typeof CollaborationOp.Decide } & CompanyCollaboratorDecision)
    | { readonly op: typeof CollaborationOp.Context; readonly id: string; readonly grantId: string }
    | {
          readonly op: typeof CollaborationOp.Project;
          readonly id: string;
          readonly grantId: string;
          readonly request: CompanyProjectRequest & {
              readonly op:
                  | typeof CompanyProjectOp.Read
                  | typeof CompanyProjectOp.Command
                  | typeof CompanyProjectOp.Artifact;
          };
      }
    | {
          readonly op: typeof CollaborationOp.Watch;
          readonly id: string;
          readonly grantId: string;
          readonly channel: 'project' | 'office';
      }
    | {
          readonly op: typeof CollaborationOp.Move;
          readonly id: string;
          readonly grantId: string;
          readonly player: OfficePlayer;
      };
/** Private scoped responses and sanitized office state share the existing authenticated socket. */
export type CollaborationResponse =
    | ({
          readonly op: typeof CollaborationOp.CodeResult;
          readonly id: string;
      } & CompanyCollaboratorCode)
    | {
          readonly op: typeof CollaborationOp.Invitations;
          readonly id: string;
          readonly projectId: string;
          readonly entries: readonly CompanyCollaborationCard[];
      }
    | {
          readonly op: typeof CollaborationOp.ContextResult;
          readonly id: string;
          readonly context: CompanyCollaborationContext;
      }
    | {
          readonly op: typeof CollaborationOp.ProjectResult;
          readonly id: string;
          readonly grantId: string;
          readonly response: CompanyProjectResponse;
      }
    | {
          readonly op: typeof CollaborationOp.Office;
          readonly id: string;
          readonly grantId: string;
          readonly frame: OfficeGamePacket;
      }
    | { readonly op: typeof CollaborationOp.Error; readonly id: string; readonly message: string };
/** Both directions of the NCLB channel. */
export type CollaborationPacket = CollaborationRequest | CollaborationResponse;
/** One-shot account operations; subscriptions have an explicit lifecycle. */
export type CollaborationCall = Exclude<
    CollaborationRequest,
    {
        readonly op: typeof CollaborationOp.Watch | typeof CollaborationOp.Move;
    }
> & { readonly op: Exclude<CollaborationRequest['op'], typeof CollaborationOp.Leave> };
/** Successful one-shot responses. Stream frames and failures are handled separately. */
export type CollaborationReply = Exclude<
    CollaborationResponse,
    {
        readonly op: typeof CollaborationOp.Office | typeof CollaborationOp.Error;
    }
>;

/** NCLB v1: explicit operations, bounded UTF-8 fields, and nested existing binary project/office codecs. */
export class CompanyCollaborationProtocol {
    /** Inspect the family before decoding, without interpreting unrelated Chat or game frames. */
    public static isFrame(bytes: Uint8Array): boolean {
        return (
            bytes.length >= 4 &&
            bytes[0] === 78 &&
            bytes[1] === 67 &&
            bytes[2] === 76 &&
            bytes[3] === 66
        );
    }
    /** Encode only the fixed contract; validation is identical for direct callers and incoming frames. */
    public static encode(packet: CollaborationPacket): Uint8Array<ArrayBuffer> {
        const w: BinaryWriter = new BinaryWriter(1024);
        w.u32(0x424c434e).u8(1).u8(packet.op).str(packet.id);
        const blob = (bytes: Uint8Array): void => {
            w.u32(bytes.length).bytes(bytes);
        };
        const card = (value: CompanyCollaborationCard): void => {
            const g: CompanyCollaborationGrant = value.grant;
            w.str(g.id)
                .u64(g.revision)
                .str(g.owner)
                .str(g.recipient)
                .str(g.projectId)
                .str(g.label)
                .str(g.role)
                .str(g.state)
                .u64(g.createdAt)
                .u64(g.expiresAt)
                .u64(g.decidedAt)
                .str(value.companyName)
                .str(value.projectName);
        };
        switch (packet.op) {
            case CollaborationOp.Code:
            case CollaborationOp.Leave:
                break;
            case CollaborationOp.List:
                w.str(packet.projectId);
                break;
            case CollaborationOp.Invite:
                w.str(packet.projectId)
                    .str(packet.code)
                    .str(packet.label)
                    .str(packet.role)
                    .u64(packet.durationMs);
                break;
            case CollaborationOp.Decide:
                w.str(packet.grantId).u64(packet.revision).str(packet.decision);
                break;
            case CollaborationOp.Context:
                w.str(packet.grantId);
                break;
            case CollaborationOp.Project:
                w.str(packet.grantId);
                blob(CompanyProjectProtocol.encode(packet.request, 5));
                break;
            case CollaborationOp.Watch:
                w.str(packet.grantId).str(packet.channel);
                break;
            case CollaborationOp.Move:
                w.str(packet.grantId);
                blob(
                    OfficeProtocol.encode(
                        { ...OfficeProtocol.control(OfficeGameOp.Player), player: packet.player },
                        8,
                    ),
                );
                break;
            case CollaborationOp.CodeResult:
                w.str(packet.code).u64(packet.expiresAt);
                break;
            case CollaborationOp.Invitations:
                w.str(packet.projectId).u32(packet.entries.length);
                for (const entry of packet.entries) {
                    card(entry);
                }
                break;
            case CollaborationOp.ContextResult: {
                const context: CompanyCollaborationContext = packet.context;
                card(context);
                w.str(context.project.id)
                    .str(context.project.name)
                    .str(context.project.brief)
                    .str(context.project.managerId)
                    .u8(context.project.team.length);
                for (const employee of context.project.team) {
                    w.str(employee);
                }
                w.u8(context.employees.length);
                for (const employee of context.employees) {
                    w.str(employee.id).str(employee.name).str(employee.role);
                }
                break;
            }
            case CollaborationOp.ProjectResult:
                w.str(packet.grantId);
                blob(CompanyProjectProtocol.encode(packet.response, 5));
                break;
            case CollaborationOp.Office:
                w.str(packet.grantId);
                blob(OfficeProtocol.encode(packet.frame, 8));
                break;
            case CollaborationOp.Error:
                w.str(packet.message);
                break;
        }
        const bytes: Uint8Array<ArrayBuffer> = w.toBytes();
        this.decode(bytes);
        return bytes;
    }
    /** Reject mixed identities, nested forbidden operations, truncation, and trailing data. */
    public static decode(bytes: Uint8Array): CollaborationPacket {
        if (!this.isFrame(bytes) || bytes.length > 3 * 1024 * 1024) {
            throw new Error('Invalid collaboration packet');
        }
        const r: BinaryReader = new BinaryReader(bytes);
        r.u32();
        if (r.u8() !== 1) {
            throw new Error('Unsupported collaboration protocol');
        }
        const op: number = r.u8();
        const text = (max: number, empty = false): string => {
            const value: string = r.str();
            if ((!empty && !value) || value.length > max) {
                throw new Error('Invalid collaboration text');
            }
            return value;
        };
        const id = (): string => {
            const value: string = text(64);
            if (!/^[a-zA-Z0-9-]+$/.test(value)) {
                throw new Error('Invalid collaboration identity');
            }
            return value;
        };
        const big = (): bigint => {
            const value: bigint = r.u64();
            if (value > 0x7fffffffffffffffn) {
                throw new Error('Invalid collaboration integer');
            }
            return value;
        };
        const choice = <T extends string>(values: readonly T[]): T => {
            const raw: string = text(32),
                value: T | undefined = values.find((item) => item === raw);
            if (!value) {
                throw new Error('Invalid collaboration choice');
            }
            return value;
        };
        const blob = (): Uint8Array => {
            const length: number = r.u32();
            if (length > 2 * 1024 * 1024 + 65536) {
                throw new Error('Collaboration payload too large');
            }
            return r.bytes(length);
        };
        const card = (): CompanyCollaborationCard => ({
            grant: {
                id: id(),
                revision: big(),
                owner: text(256),
                recipient: text(256),
                projectId: id(),
                label: text(160),
                role: choice(['reviewer', 'coordinator']),
                state: choice(['pending', 'active', 'declined', 'revoked']),
                createdAt: big(),
                expiresAt: big(),
                decidedAt: big(),
            },
            companyName: text(160),
            projectName: text(160),
        });
        const requestId: string = id();
        let packet: CollaborationPacket;
        switch (op) {
            case CollaborationOp.Code:
            case CollaborationOp.Leave:
                packet = { op, id: requestId };
                break;
            case CollaborationOp.List:
                packet = { op, id: requestId, projectId: text(64, true) };
                break;
            case CollaborationOp.Invite: {
                const projectId: string = id(),
                    code: string = text(32),
                    label: string = text(160),
                    role = choice(['reviewer', 'coordinator'] as const),
                    durationMs: bigint = big();
                if (
                    !/^[a-f0-9]{32}$/.test(code) ||
                    durationMs < 3600000n ||
                    durationMs > 90n * 86400000n
                ) {
                    throw new Error('Invalid invitation limits');
                }
                packet = { op, id: requestId, projectId, code, label, role, durationMs };
                break;
            }
            case CollaborationOp.Decide:
                packet = {
                    op,
                    id: requestId,
                    grantId: id(),
                    revision: big(),
                    decision: choice(['accept', 'decline', 'revoke']),
                };
                break;
            case CollaborationOp.Context:
                packet = { op, id: requestId, grantId: id() };
                break;
            case CollaborationOp.Project: {
                const grantId: string = id(),
                    request = CompanyProjectProtocol.decode(blob());
                if (
                    request.id !== requestId ||
                    (request.op !== CompanyProjectOp.Read &&
                        request.op !== CompanyProjectOp.Command &&
                        request.op !== CompanyProjectOp.Artifact)
                ) {
                    throw new Error('Invalid delegated project request');
                }
                if (request.op === CompanyProjectOp.Read) {
                    packet = {
                        op,
                        id: requestId,
                        grantId,
                        request: {
                            op: CompanyProjectOp.Read,
                            id: request.id,
                            projectId: request.projectId,
                        },
                    };
                } else if (
                    request.op === CompanyProjectOp.Command ||
                    request.op === CompanyProjectOp.Artifact
                ) {
                    packet = { op, id: requestId, grantId, request };
                } else {
                    throw new Error('Invalid delegated project request');
                }
                break;
            }
            case CollaborationOp.Watch:
                packet = {
                    op,
                    id: requestId,
                    grantId: id(),
                    channel: choice(['project', 'office']),
                };
                break;
            case CollaborationOp.Move: {
                const grantId: string = id(),
                    frame: OfficeGamePacket = OfficeProtocol.decode(blob());
                if (frame.op !== OfficeGameOp.Player || !frame.player) {
                    throw new Error('Invalid collaborator movement');
                }
                packet = { op, id: requestId, grantId, player: frame.player };
                break;
            }
            case CollaborationOp.CodeResult: {
                const code: string = text(32),
                    expiresAt: bigint = big();
                if (!/^[a-f0-9]{32}$/.test(code)) {
                    throw new Error('Invalid recipient code');
                }
                packet = { op, id: requestId, code, expiresAt };
                break;
            }
            case CollaborationOp.Invitations: {
                const projectId: string = text(64, true),
                    count: number = r.u32();
                if (count > 256) {
                    throw new Error('Too many collaboration invitations');
                }
                packet = {
                    op,
                    id: requestId,
                    projectId,
                    entries: Array.from({ length: count }, card),
                };
                break;
            }
            case CollaborationOp.ContextResult: {
                const base: CompanyCollaborationCard = card();
                const projectId: string = id(),
                    name: string = text(160),
                    brief: string = text(16000),
                    managerId: string = text(128),
                    teamCount: number = r.u8();
                if (projectId !== base.grant.projectId || teamCount > 128) {
                    throw new Error('Invalid scoped project roster');
                }
                const team: readonly string[] = Array.from({ length: teamCount }, () => text(128)),
                    count: number = r.u8();
                if (count > 128) {
                    throw new Error('Invalid scoped employee roster');
                }
                const employees = Array.from({ length: count }, () => ({
                    id: text(128),
                    name: text(160),
                    role: text(160),
                }));
                if (employees.some((employee) => !team.includes(employee.id))) {
                    throw new Error('Employee outside collaboration scope');
                }
                packet = {
                    op,
                    id: requestId,
                    context: {
                        ...base,
                        project: { id: projectId, name, brief, managerId, team },
                        employees,
                    },
                };
                break;
            }
            case CollaborationOp.ProjectResult: {
                const grantId: string = id(),
                    response = CompanyProjectProtocol.decode(blob());
                if (
                    response.id !== requestId ||
                    (response.op !== CompanyProjectOp.Snapshot &&
                        response.op !== CompanyProjectOp.File &&
                        response.op !== CompanyProjectOp.Error)
                ) {
                    throw new Error('Invalid delegated project response');
                }
                packet = { op, id: requestId, grantId, response };
                break;
            }
            case CollaborationOp.Office:
                packet = { op, id: requestId, grantId: id(), frame: OfficeProtocol.decode(blob()) };
                break;
            case CollaborationOp.Error:
                packet = { op, id: requestId, message: text(2000) };
                break;
            default:
                throw new Error('Unknown collaboration operation');
        }
        if (r.remaining !== 0) {
            throw new Error('Trailing collaboration data');
        }
        return packet;
    }
}
