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
    it('covers the complete gateway catalog without changing wire values', (): void => {
        expect(Object.values(Method).toSorted()).toEqual(Object.keys(methodValidators).toSorted());
        expect(Method.AgentAsk).toBe('agent.ask');
        expectTypeOf<Method>().toExtend<keyof GatewayMethods>();
        expectTypeOf(verifyMethodTypes).toBeFunction();
    });
});
