// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowInput } from '../WorkflowInput.js';
import { WorkflowJson } from '../WorkflowJson.js';
import type { WorkflowObject } from '../WorkflowTypes.js';
import { ResourceBindingCodec } from '../ResourceBindingCodec.js';
import {
    WorkflowApprovalChoice,
    type WorkflowApprovalConfiguration,
    type WorkflowApprovalContent,
    type WorkflowApprovalProposal,
    type WorkflowApprovalDecision,
} from './RunApprovalTypes.js';

/** Portable strict boundaries for exact proposals and explicit decisions. */
export class WorkflowApprovalCodec {
    /** Rejects incomplete material details and bounds one review's metadata. */
    public static content(raw: unknown): WorkflowApprovalContent {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'action',
            'destination',
            'content',
        ]);
        const action: string = WorkflowInput.text(value['action'], 240);
        const destination: string = WorkflowInput.text(value['destination'], 2000);
        const content: WorkflowObject = WorkflowJson.object(value['content']);
        if (
            action.trim() === '' ||
            destination.trim() === '' ||
            Object.keys(content).length === 0
        ) {
            throw new Error('Approval needs an action, destination and exact proposed content');
        }
        if (JSON.stringify(content).length > 32000) {
            throw new Error(
                'Approval content exceeds 32000 characters; use immutable artifact references',
            );
        }
        return { action, destination, content };
    }
    /** Validates the supported recipient and notification policy instead of silently ignoring it. */
    public static configuration(raw: unknown): WorkflowApprovalConfiguration {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'action',
            'destination',
            'content',
            'timeoutMs',
            'reviewer',
            'notification',
        ]);
        if (value['reviewer'] !== 'owner' || value['notification'] !== 'in-app') {
            throw new Error('This approval requires the run owner and in-app notification');
        }
        const timeoutMs: string = ResourceBindingCodec.decimal(value['timeoutMs']);
        if (BigInt(timeoutMs) < 1000n || BigInt(timeoutMs) > 86400000n) {
            throw new Error('Approval timeout must be between one second and one day');
        }
        return {
            ...this.content({
                action: value['action'],
                destination: value['destination'],
                content: value['content'],
            }),
            timeoutMs,
            reviewer: 'owner',
            notification: 'in-app',
        };
    }
    /** Validates recorded proposal shape; the server separately verifies its digest. */
    public static proposal(raw: unknown): WorkflowApprovalProposal {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'action',
            'destination',
            'content',
            'revision',
        ]);
        return {
            ...this.content({
                action: value['action'],
                destination: value['destination'],
                content: value['content'],
            }),
            revision: this.#revision(value['revision']),
        };
    }
    /** Never accepts a client-supplied actor, recipient, content replacement or timestamp. */
    public static command(raw: unknown): WorkflowApprovalDecision {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'nodeId',
            'invocationId',
            'commandId',
            'proposalRevision',
            'decision',
            'comment',
        ]);
        const decision: unknown = value['decision'];
        if (
            decision !== WorkflowApprovalChoice.Approve &&
            decision !== WorkflowApprovalChoice.Reject &&
            decision !== WorkflowApprovalChoice.RequestChanges &&
            decision !== WorkflowApprovalChoice.Cancel
        ) {
            throw new Error('Choose an explicit approval decision');
        }
        const comment: string = WorkflowInput.text(value['comment'], 8000, true);
        if (decision === WorkflowApprovalChoice.RequestChanges && comment.trim() === '') {
            throw new Error('Describe the changes you are requesting');
        }
        return {
            runId: WorkflowInput.id(value['runId']),
            nodeId: WorkflowInput.id(value['nodeId']),
            invocationId: WorkflowInput.id(value['invocationId']),
            commandId: WorkflowInput.id(value['commandId']),
            proposalRevision: this.#revision(value['proposalRevision']),
            decision,
            comment,
        };
    }
    static #revision(raw: unknown): string {
        const value: string = WorkflowInput.text(raw, 64);
        if (!/^[a-f0-9]{64}$/u.test(value)) {
            throw new Error('Invalid approval proposal revision');
        }
        return value;
    }
}
