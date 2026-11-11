// SPDX-License-Identifier: Apache-2.0
import { WorkflowInput } from '../WorkflowInput.js';
import {
    TerminalAction,
    type WorkflowTerminalCommand,
    type WorkflowTerminalRequest,
} from './TerminalTypes.js';
export class WorkflowTerminalCodec {
    public static read(raw: unknown): WorkflowTerminalRequest {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, ['sessionId']);
        return { sessionId: WorkflowInput.id(value['sessionId']) };
    }
    public static command(raw: unknown): WorkflowTerminalCommand {
        const value: Readonly<Record<string, unknown>> = WorkflowInput.record(raw, [
            'sessionId',
            'commandId',
            'expectedRevision',
            'action',
            'input',
            'cols',
            'rows',
        ]);
        const action: string = WorkflowInput.text(value['action'], 16);
        if (
            action !== TerminalAction.Input &&
            action !== TerminalAction.Resize &&
            action !== TerminalAction.Stop
        ) {
            throw new Error('Unknown terminal action');
        }
        const cols: unknown = value['cols'];
        const rows: unknown = value['rows'];
        if (
            typeof cols !== 'number' ||
            !Number.isInteger(cols) ||
            cols < 20 ||
            cols > 240 ||
            typeof rows !== 'number' ||
            !Number.isInteger(rows) ||
            rows < 5 ||
            rows > 100
        ) {
            throw new Error('Terminal size must fit 20–240 columns and 5–100 rows');
        }
        const revision: string = WorkflowInput.text(value['expectedRevision'], 20);
        if (!/^(0|[1-9][0-9]*)$/.test(revision)) {
            throw new Error('Invalid terminal command revision');
        }
        return {
            sessionId: WorkflowInput.id(value['sessionId']),
            commandId: WorkflowInput.id(value['commandId']),
            expectedRevision: revision,
            action,
            input: WorkflowInput.text(value['input'], 16384, true),
            cols,
            rows,
        };
    }
}
