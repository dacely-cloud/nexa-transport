// SPDX-License-Identifier: Apache-2.0

export const WorkflowApplication = {
    Codex: 'codex',
    ClaudeCode: 'claude-code',
    GrokBuild: 'grok-build',
    NervaCode: 'nerva-code',
} as const;
export type WorkflowApplication = (typeof WorkflowApplication)[keyof typeof WorkflowApplication];
export interface WorkflowApplicationDefinition {
    readonly id: WorkflowApplication;
    readonly title: string;
    readonly executable: string;
    readonly login: readonly string[];
    readonly docs: string;
}
/** Fixed application commands. Workflow JSON cannot choose a host executable or login command. */
export class WorkflowApplications {
    public static readonly all: readonly WorkflowApplicationDefinition[] = Object.freeze([
        {
            id: WorkflowApplication.Codex,
            title: 'Codex',
            executable: 'codex',
            login: ['login', '--device-auth'],
            docs: 'https://developers.openai.com/codex/auth',
        },
        {
            id: WorkflowApplication.ClaudeCode,
            title: 'Claude Code',
            executable: 'claude',
            login: ['auth', 'login'],
            docs: 'https://code.claude.com/docs/en/authentication',
        },
        {
            id: WorkflowApplication.GrokBuild,
            title: 'Grok Build',
            executable: 'grok',
            login: ['login', '--device-auth'],
            docs: 'https://x.ai/build',
        },
        {
            id: WorkflowApplication.NervaCode,
            title: 'Nerva Code',
            executable: 'nerva-code',
            login: [],
            docs: '',
        },
    ]);
    public static get(id: string): WorkflowApplicationDefinition {
        const found: WorkflowApplicationDefinition | undefined = this.all.find(
            (app: WorkflowApplicationDefinition): boolean => app.id === id,
        );
        if (found === undefined) {
            throw new Error('Unknown workflow application');
        }
        return found;
    }
    public static fromComponent(component: string): WorkflowApplicationDefinition | null {
        return (
            this.all.find(
                (app: WorkflowApplicationDefinition): boolean => component === `terminal.${app.id}`,
            ) ?? null
        );
    }
}
