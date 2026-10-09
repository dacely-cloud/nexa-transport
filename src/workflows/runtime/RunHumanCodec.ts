import { WorkflowTimeLimits } from '../TimeLimits.js';
// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowApprovalCodec } from './RunApprovalCodec.js';
import { WorkflowInput } from '../WorkflowInput.js';
import {
    WorkflowAnswerType,
    type WorkflowHumanQuestion,
    type WorkflowHumanAnswer,
    type WorkflowHumanIdentity,
} from './RunHumanTypes.js';

/** Portable boundary validation for owner questions and explicit answer commands. */
export class WorkflowHumanCodec {
    /** Accepts only supported bounded questions; recipients cannot be configured through text. */
    public static question(raw: unknown): WorkflowHumanQuestion {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'question',
            'answerType',
            'choices',
            'timeoutMs',
            ...(Object.hasOwn(WorkflowInput.object(raw), 'approval') ? ['approval'] : []),
        ]);
        const answerType: unknown = value['answerType'];
        if (
            answerType !== WorkflowAnswerType.Text &&
            answerType !== WorkflowAnswerType.Choice &&
            answerType !== WorkflowAnswerType.Boolean
        ) {
            throw new Error('Unsupported question answer type');
        }
        const choices: readonly string[] = WorkflowInput.list(
            value['choices'],
            20,
            (entry: unknown): string => WorkflowInput.text(entry, 160),
        );
        if (
            new Set(choices).size !== choices.length ||
            choices.some((entry: string): boolean => entry.trim() === '') ||
            (answerType === WorkflowAnswerType.Choice && choices.length < 2)
        ) {
            throw new Error('A choice question needs distinct nonempty choices');
        }
        const timeoutMs: string = WorkflowTimeLimits.timeout(value['timeoutMs'], 'Question');
        const question: string = WorkflowInput.text(value['question'], 8000);
        if (question.trim() === '') {
            throw new Error('Question text is required');
        }
        return {
            question,
            answerType,
            choices,
            timeoutMs,
            ...(value['approval'] === undefined
                ? {}
                : { approval: WorkflowApprovalCodec.proposal(value['approval']) }),
        };
    }
    /** Strict exact request identity with no owner override. */
    public static identity(raw: unknown): WorkflowHumanIdentity {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'nodeId',
            'invocationId',
        ]);
        return {
            runId: WorkflowInput.id(value['runId']),
            nodeId: WorkflowInput.id(value['nodeId']),
            invocationId: WorkflowInput.id(value['invocationId']),
        };
    }
    /** Parses a command without granting it permission to answer any request. */
    public static command(raw: unknown): WorkflowHumanAnswer {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'runId',
            'nodeId',
            'invocationId',
            'commandId',
            'answer',
        ]);
        const answer: unknown = value['answer'];
        if (typeof answer !== 'string' && typeof answer !== 'boolean') {
            throw new Error('An answer must be text or a boolean');
        }
        if (typeof answer === 'string') {
            WorkflowInput.text(answer, 16000);
        }
        return {
            ...this.identity({
                runId: value['runId'],
                nodeId: value['nodeId'],
                invocationId: value['invocationId'],
            }),
            commandId: WorkflowInput.id(value['commandId']),
            answer,
        };
    }
    /** Validates the answer against the immutable question, including exact choice identity. */
    public static answer(question: WorkflowHumanQuestion, value: string | boolean): void {
        if (question.answerType === WorkflowAnswerType.Boolean) {
            if (typeof value !== 'boolean') {
                throw new Error('This question requires a boolean answer');
            }
        } else {
            if (typeof value !== 'string' || value.trim() === '' || value.length > 16000) {
                throw new Error(
                    'This question requires a nonempty text answer of at most 16000 characters',
                );
            }
            if (
                question.answerType === WorkflowAnswerType.Choice &&
                !question.choices.includes(value)
            ) {
                throw new Error('Select one of the recorded choices');
            }
        }
    }
}
