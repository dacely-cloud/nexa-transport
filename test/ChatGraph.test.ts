import { expect, it } from 'vitest';
import { ChatGraphs, type ChatGraph } from '../src/graphs/ChatGraph';
import { isEventData } from '../src/protocol/Events';
import type { TurnEventData } from '../src/protocol/Protocol';
import { methodValidators } from '../src/protocol/MethodValidators';

const graph: ChatGraph = {
    id: 'map',
    title: 'Capabilities',
    description: '',
    nodes: [{ id: 'agent', label: 'Agent', color: 'purple', description: 'Can help' }],
    edges: [],
};

it('validates graph delivery in live tool outcomes and saved tool-result blocks', (): void => {
    const data: TurnEventData = {
        streamId: 'stream',
        event: {
            type: 'tool-finish',
            outcome: {
                call: { id: 'tool', name: 'render_graph', input: graph },
                durationMs: 1,
                result: { status: 'ok', content: 'Delivered', chatGraph: graph },
            },
        },
    };
    expect(isEventData('turn.event', JSON.parse(JSON.stringify(data)))).toBe(true);
    expect(ChatGraphs.parse(graph)).toEqual(graph);
    expect(
        methodValidators['sessions.messages'].result([
            {
                role: 'user',
                content: [
                    {
                        type: 'tool-result',
                        toolUseId: 'tool',
                        content: 'Delivered',
                        chatGraph: graph,
                    },
                ],
            },
        ]),
    ).toBe(true);
    expect(
        isEventData('turn.event', {
            ...data,
            event: {
                ...data.event,
                outcome: {
                    call: { id: 'tool', name: 'render_graph', input: {} },
                    durationMs: 1,
                    result: {
                        status: 'ok',
                        content: 'Delivered',
                        chatGraph: { ...graph, nodes: null },
                    },
                },
            },
        }),
    ).toBe(false);
});
it('rejects syntactically valid graphs with missing endpoints and protects bounds', (): void => {
    expect((): ChatGraph =>
        ChatGraphs.parse({
            ...graph,
            edges: [{ id: 'bad', from: 'agent', to: 'missing', label: '' }],
        }),
    ).toThrow(/missing node/);
    expect((): ChatGraph => ChatGraphs.parse({ ...graph, title: 'a'.repeat(161) })).toThrow(/text/);
});
