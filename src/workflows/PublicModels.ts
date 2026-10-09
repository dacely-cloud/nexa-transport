// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { WorkflowModelEffort, type WorkflowModelEffort as Effort } from './ModelEffort.js';
import type {
    WorkflowModelChoice,
    WorkflowModelsPage,
    WorkflowModelsRequest,
} from './WorkflowModels.js';

/** Public API models shipped with the editor. Account access is checked by the provider when used. */
export class WorkflowPublicModels {
    /** Direct API providers that accept account-owned keys. */
    public static readonly providers: readonly string[] = ['anthropic', 'openai', 'xai', 'mistral'];
    /** Public catalog metadata never depends on deployment credentials or NCAP discovery. */
    public static readonly models: readonly WorkflowModelChoice[] = [
        ...['opus', 'sonnet', 'haiku'].map((family: string): WorkflowModelChoice =>
            WorkflowPublicModels.choice(
                'anthropic',
                `claude-${family}-5-5`,
                `Claude ${family[0]?.toUpperCase()}${family.slice(1)} 5.5`,
                [
                    WorkflowModelEffort.Low,
                    WorkflowModelEffort.Medium,
                    WorkflowModelEffort.High,
                    WorkflowModelEffort.XHigh,
                    WorkflowModelEffort.Max,
                ],
                1_000_000,
                128_000,
            ),
        ),
        WorkflowPublicModels.choice('openai', 'gpt-6-astra', 'GPT 6 Astra', [
            WorkflowModelEffort.Low,
            WorkflowModelEffort.Medium,
            WorkflowModelEffort.High,
            WorkflowModelEffort.XHigh,
            WorkflowModelEffort.Max,
        ]),
        WorkflowPublicModels.choice('openai', 'gpt-6.1-sol', 'GPT 6.1 Sol', [
            WorkflowModelEffort.Low,
            WorkflowModelEffort.Medium,
            WorkflowModelEffort.High,
            WorkflowModelEffort.XHigh,
            WorkflowModelEffort.Max,
        ]),
        WorkflowPublicModels.choice('openai', 'gpt-6-sol', 'GPT 6 Sol', [
            WorkflowModelEffort.Off,
            WorkflowModelEffort.Low,
            WorkflowModelEffort.Medium,
            WorkflowModelEffort.High,
            WorkflowModelEffort.XHigh,
            WorkflowModelEffort.Max,
        ]),
        WorkflowPublicModels.choice('openai', 'gpt-6-luna', 'GPT 6 Luna', [
            WorkflowModelEffort.Off,
            WorkflowModelEffort.Low,
            WorkflowModelEffort.Medium,
            WorkflowModelEffort.High,
            WorkflowModelEffort.XHigh,
            WorkflowModelEffort.Max,
        ]),
        WorkflowPublicModels.choice(
            'xai',
            'grok-4.7',
            'Grok 4.7',
            [
                WorkflowModelEffort.Low,
                WorkflowModelEffort.Medium,
                WorkflowModelEffort.High,
                WorkflowModelEffort.XHigh,
            ],
            500_000,
        ),
        ...['small', 'medium', 'large'].map((family: string): WorkflowModelChoice =>
            WorkflowPublicModels.choice(
                'mistral',
                `mistral-${family}-latest`,
                `Mistral ${family[0]?.toUpperCase()}${family.slice(1)}`,
                [WorkflowModelEffort.Off, WorkflowModelEffort.High],
            ),
        ),
    ];
    /** One selectable public model, with unknown limits/prices kept visibly unknown. */
    public static choice(
        provider: string,
        id: string,
        name: string,
        efforts: readonly Effort[],
        contextWindow: number | null = null,
        maxOutputTokens: number | null = null,
    ): WorkflowModelChoice {
        return {
            provider,
            id,
            name,
            efforts,
            input: ['text', 'image'],
            reasoning: true,
            source: 'public-provider',
            status: 'available',
            compatible: true,
            reason: null,
            maxOutputTokens,
            contextWindow,
            price: null,
            availableAtCheck: null,
        };
    }
    /** Search, favorites and provider filters operate locally, including before an API key is linked. */
    public static list(request: WorkflowModelsRequest): WorkflowModelsPage {
        const query: string = request.query.trim().toLowerCase();
        const items: readonly WorkflowModelChoice[] = this.models.filter(
            (model: WorkflowModelChoice): boolean =>
                (request.provider === null || request.provider === model.provider) &&
                `${model.id} ${model.name} ${model.provider}`.toLowerCase().includes(query) &&
                (request.favorites === null || request.favorites.includes(model.id)) &&
                (request.after === null || `${model.provider}:${model.id}` > request.after),
        );
        return {
            providers: [...this.providers, 'nerva'],
            items,
            next: null,
            freshness: 'not-reported',
            observation: { checkedAt: null, refreshAvailable: false, refreshFailed: false },
        };
    }
    /** Exact public metadata for native execution, without an endpoint listing round trip. */
    public static find(provider: string, id: string): WorkflowModelChoice | null {
        return (
            this.models.find(
                (model: WorkflowModelChoice): boolean =>
                    model.provider === provider && model.id === id,
            ) ?? null
        );
    }
}
