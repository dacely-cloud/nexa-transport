// SPDX-License-Identifier: Apache-2.0
import type { WorkflowApplication } from './Applications.js';
export const ApplicationConnection = {
    Connected: 'connected',
    Setup: 'setup-required',
    Unavailable: 'unavailable',
} as const;
export type ApplicationConnection =
    (typeof ApplicationConnection)[keyof typeof ApplicationConnection];
export interface WorkflowApplicationStatus {
    readonly application: WorkflowApplication;
    readonly title: string;
    readonly status: ApplicationConnection;
}
export interface WorkflowApplicationRequest {
    readonly workflowId: string;
    readonly revision: string;
}
export interface WorkflowApplicationSetupRequest extends WorkflowApplicationRequest {
    readonly application: WorkflowApplication;
    readonly sessionId: string;
}
export interface WorkflowTerminalRequest {
    readonly sessionId: string;
}
export const TerminalAction = { Input: 'input', Resize: 'resize', Stop: 'stop' } as const;
export type TerminalAction = (typeof TerminalAction)[keyof typeof TerminalAction];
export interface WorkflowTerminalCommand extends WorkflowTerminalRequest {
    readonly commandId: string;
    readonly expectedRevision: string;
    readonly action: TerminalAction;
    readonly input: string;
    readonly cols: number;
    readonly rows: number;
}
export const TerminalStatus = {
    Starting: 'starting',
    Running: 'running',
    Exited: 'exited',
    Interrupted: 'interrupted',
} as const;
export type TerminalStatus = (typeof TerminalStatus)[keyof typeof TerminalStatus];
export interface WorkflowTerminalSnapshot extends WorkflowTerminalRequest {
    readonly application: WorkflowApplication;
    readonly status: TerminalStatus;
    readonly setup: boolean;
    readonly screen: string;
    readonly cols: number;
    readonly rows: number;
    readonly revision: string;
    readonly commandRevision: string;
    readonly commandId: string;
    readonly error: string;
}
