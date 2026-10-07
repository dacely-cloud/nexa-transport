import { describe, expect, expectTypeOf, it } from 'vitest';
import { NexaClient } from '../src/networking/NexaClient.js';
import { Method, type AskResult, type GatewayMethods } from '../src/protocol/Protocol.js';
import { methodValidators } from '../src/protocol/MethodValidators.js';

/** Compile-time contracts; never invokes a live client. */
function verifyMethodTypes(client: NexaClient): void {
    expectTypeOf(client.call(Method.AgentAsk, { message: 'Hello' })).toEqualTypeOf<
        Promise<AskResult>
    >();
    // @ts-expect-error Raw RPC strings must be rejected in favor of enum members.
    void client.call('agent.ask', { message: 'Hello' });
    // @ts-expect-error Enum members retain their method-specific parameter contract.
    void client.call(Method.AgentAsk, { id: 'wrong' });
    // @ts-expect-error Connect remains an internal handshake, not a callable public RPC.
    void client.call(Method.Connect, {});
    expectTypeOf<'ask'>().not.toExtend<keyof NexaClient>();
}

describe('Method enum', (): void => {
    it('validates terminal input, resize and incremental logs with session ownership fields', (): void => {
        const ref = { sessionId: 'owner::chat', processId: 'p_terminal' };
        expect(methodValidators[Method.ProcessesInput].params({ ...ref, data: '\u0003' })).toBe(
            true,
        );
        expect(
            methodValidators[Method.ProcessesInput].params({
                processId: 'p_terminal',
                data: 'hello',
            }),
        ).toBe(false);
        expect(methodValidators[Method.ProcessesInput].params({ ...ref, data: 42 })).toBe(false);
        expect(
            methodValidators[Method.ProcessesResize].params({ ...ref, cols: 80, rows: 12 }),
        ).toBe(true);
        expect(
            methodValidators[Method.ProcessesResize].params({ ...ref, cols: '80', rows: 12 }),
        ).toBe(false);
        expect(
            methodValidators[Method.ProcessesLog].params({ ...ref, offset: '9007199254740993' }),
        ).toBe(true);
        expect(
            methodValidators[Method.ProcessesLog].params({
                ...ref,
                offset: Number.MAX_SAFE_INTEGER + 2,
            }),
        ).toBe(false);
    });
    it('validates bounded soft execution targets in both contracts', (): void => {
        for (const method of [Method.AgentAsk, Method.AgentStream]) {
            for (const targetTimeSeconds of [120, 300, 900, 172800]) {
                expect(methodValidators[method].params({ message: 'Hi', targetTimeSeconds })).toBe(
                    true,
                );
            }
            for (const targetTimeSeconds of [null, '120', 0, -1, 1.5, 172801]) {
                expect(methodValidators[method].params({ message: 'Hi', targetTimeSeconds })).toBe(
                    false,
                );
            }
        }
    });
    it('validates optional per-turn effort in ask and stream contracts', (): void => {
        for (const reasoningEffort of ['off', 'low', 'medium', 'xhigh']) {
            expect(
                methodValidators[Method.AgentAsk].params({ message: 'Hi', reasoningEffort }),
            ).toBe(true);
            expect(
                methodValidators[Method.AgentStream].params({ message: 'Hi', reasoningEffort }),
            ).toBe(true);
        }
        for (const reasoningEffort of [null, 2, {}, 'ultra']) {
            expect(
                methodValidators[Method.AgentAsk].params({ message: 'Hi', reasoningEffort }),
            ).toBe(false);
            expect(
                methodValidators[Method.AgentStream].params({ message: 'Hi', reasoningEffort }),
            ).toBe(false);
        }
    });
    it('covers the complete gateway catalog without changing wire values', (): void => {
        expect(Object.values(Method).toSorted()).toEqual(Object.keys(methodValidators).toSorted());
        expect(Method.AgentAsk).toBe('agent.ask');
        expectTypeOf<Method>().toExtend<keyof GatewayMethods>();
        expectTypeOf(verifyMethodTypes).toBeFunction();
    });
});
