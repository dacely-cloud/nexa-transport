// SPDX-License-Identifier: Apache-2.0

import { WorkflowApplication } from './Applications.js';
import {
    WorkflowModelEffort,
    WorkflowModelEfforts,
    type WorkflowModelEffort as Effort,
} from '../ModelEffort.js';
import { WorkflowModelsCodec } from '../WorkflowModels.js';

/** A documented CLI model preset; availability still depends on the signed-in application account. */
export interface WorkflowApplicationModel {
    readonly id: string;
    readonly name: string;
    readonly efforts: readonly Effort[];
}
/** Immutable launch overrides saved on one terminal component. */
export interface WorkflowApplicationSelection {
    readonly modelId: string | null;
    readonly effort: Effort | null;
}
/** Argument vectors and per-process environment overrides never become shell source or user config. */
export interface WorkflowApplicationLaunch {
    readonly argv: readonly string[];
    readonly env: Readonly<Record<string, string>>;
}
/** Documented native model controls shared by terminal launch and the component picker. */
export class WorkflowApplicationModels {
    /** A bounded starter list; configured custom model IDs remain selectable. */
    public static choices(application: WorkflowApplication): readonly WorkflowApplicationModel[] {
        const five: readonly Effort[] = [
            WorkflowModelEffort.Low,
            WorkflowModelEffort.Medium,
            WorkflowModelEffort.High,
            WorkflowModelEffort.XHigh,
            WorkflowModelEffort.Max,
        ];
        switch (application) {
            case WorkflowApplication.Codex:
                return [
                    { id: 'gpt-6.1-sol', name: 'GPT 6.1 Sol', efforts: five },
                    { id: 'gpt-6-astra', name: 'GPT 6 Astra', efforts: five },
                    {
                        id: 'gpt-6-sol',
                        name: 'GPT 6 Sol',
                        efforts: [WorkflowModelEffort.Off, ...five],
                    },
                    {
                        id: 'gpt-6-luna',
                        name: 'GPT 6 Luna',
                        efforts: [WorkflowModelEffort.Off, ...five],
                    },
                ];
            case WorkflowApplication.ClaudeCode:
                return [
                    { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', efforts: five },
                    { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', efforts: five },
                    { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', efforts: five },
                ];
            case WorkflowApplication.GrokBuild:
                return [
                    {
                        id: 'grok-4.6',
                        name: 'Grok 4.6',
                        efforts: Object.values(WorkflowModelEffort),
                    },
                    {
                        id: 'grok-4.5',
                        name: 'Grok 4.5',
                        efforts: Object.values(WorkflowModelEffort),
                    },
                    { id: 'grok-code-fast-1', name: 'Grok Code Fast 1', efforts: [] },
                ];
            case WorkflowApplication.NervaCode:
                return [
                    {
                        id: 'nerva/local',
                        name: 'Nerva engine',
                        efforts: [WorkflowModelEffort.Off, ...five],
                    },
                    {
                        id: 'nerva/qwen3',
                        name: 'Qwen3 via Nerva',
                        efforts: [WorkflowModelEffort.Off, ...five],
                    },
                    {
                        id: 'openai/custom',
                        name: 'Configured OpenAI compatible model',
                        efforts: [WorkflowModelEffort.Off, ...five],
                    },
                ];
            case WorkflowApplication.MistralVibe:
                return [
                    {
                        id: 'mistral-medium-3.5',
                        name: 'Mistral Medium 3.5',
                        efforts: [
                            WorkflowModelEffort.Low,
                            WorkflowModelEffort.Medium,
                            WorkflowModelEffort.High,
                            WorkflowModelEffort.Max,
                        ],
                    },
                    {
                        id: 'local',
                        name: 'Devstral (local)',
                        efforts: [
                            WorkflowModelEffort.Off,
                            WorkflowModelEffort.Low,
                            WorkflowModelEffort.Medium,
                            WorkflowModelEffort.High,
                            WorkflowModelEffort.Max,
                        ],
                    },
                ];
        }
    }
    /** Native CLIs validate custom models against their configured endpoint/account. */
    public static levels(
        application: WorkflowApplication,
        modelId: string | null,
    ): readonly Effort[] {
        const model: WorkflowApplicationModel | undefined = this.choices(application).find(
            (item: WorkflowApplicationModel): boolean => item.id === modelId,
        );
        if (model !== undefined) {
            return model.efforts;
        }
        switch (application) {
            case WorkflowApplication.ClaudeCode:
            case WorkflowApplication.Codex:
                return [
                    WorkflowModelEffort.Low,
                    WorkflowModelEffort.Medium,
                    WorkflowModelEffort.High,
                    WorkflowModelEffort.XHigh,
                    WorkflowModelEffort.Max,
                ];
            case WorkflowApplication.GrokBuild:
                return Object.values(WorkflowModelEffort);
            case WorkflowApplication.NervaCode:
                return Object.values(WorkflowModelEffort).filter(
                    (level: Effort): boolean => level !== WorkflowModelEffort.Minimal,
                );
            case WorkflowApplication.MistralVibe:
                return [];
        }
    }
    /** Validates overrides independently of graph schema and rejects incompatible explicit effort. */
    public static selection(
        application: WorkflowApplication,
        model: unknown,
        rawEffort: unknown,
    ): WorkflowApplicationSelection {
        const modelId: string | null =
            model === undefined || model === null || model === ''
                ? null
                : WorkflowModelsCodec.identity(model);
        const effort: Effort | null = WorkflowModelEfforts.parse(rawEffort);
        if (effort !== null && !this.levels(application, modelId).includes(effort)) {
            throw new Error('This CLI model does not support the selected effort');
        }
        return { modelId, effort };
    }
    /** Each application's documented override is scoped to the child process, including Vibe's layered environment. */
    public static launch(
        application: WorkflowApplication,
        selection: WorkflowApplicationSelection,
    ): WorkflowApplicationLaunch {
        const value: WorkflowApplicationSelection = this.selection(
            application,
            selection.modelId,
            selection.effort,
        );
        const argv: string[] = [];
        const env: Record<string, string> = {};
        if (application === WorkflowApplication.MistralVibe) {
            if (value.modelId !== null) {
                env['VIBE_ACTIVE_MODEL'] = value.modelId;
                if (value.effort !== null) {
                    env['VIBE_MODELS'] = JSON.stringify({
                        [value.modelId]: {
                            name:
                                value.modelId === 'local' ? 'devstral' : 'mistral-vibe-cli-latest',
                            provider: value.modelId === 'local' ? 'llamacpp' : 'mistral',
                            alias: value.modelId,
                            thinking: value.effort,
                        },
                    });
                }
            }
        } else {
            if (value.modelId !== null) {
                argv.push('--model', value.modelId);
            }
            if (value.effort !== null) {
                if (application === WorkflowApplication.Codex) {
                    argv.push(
                        '-c',
                        `model_reasoning_effort="${value.effort === WorkflowModelEffort.Off ? 'none' : value.effort}"`,
                    );
                } else if (application === WorkflowApplication.GrokBuild) {
                    argv.push(
                        '--reasoning-effort',
                        value.effort === WorkflowModelEffort.Off ? 'none' : value.effort,
                    );
                } else {
                    argv.push('--effort', value.effort);
                }
            }
        }
        return { argv, env };
    }
}
