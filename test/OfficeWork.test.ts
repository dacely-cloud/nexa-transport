import { expect, it } from 'vitest';
import { OfficeWork, type OfficeAgent, type OfficeReaction } from '../src/office/OfficeProtocol.js';

it('selects the active external employee turn independently of company waiting, old history, and packet order', () => {
    const active: OfficeAgent = {
        id: 'discord',
        streamId: 'discord',
        agentId: 'employee',
        name: 'Developer',
        source: 'discord',
        state: 'working',
        activity: 'Using a tool',
        goal: 'External work',
    };
    const waiting: OfficeAgent = {
        ...active,
        id: 'company',
        streamId: 'company',
        source: 'company project',
        state: 'waiting',
    };
    const old: OfficeAgent = { ...active, id: 'old', streamId: 'old', state: 'idle' };
    const worker: OfficeAgent = { ...active, id: 'discord:worker', workerId: 'worker' };
    for (const input of [
        [active, waiting, old, worker],
        [worker, old, waiting, active],
        [waiting, active, old],
    ]) {
        expect(OfficeWork.roots(input).get('employee')).toBe(active);
    }
    expect(OfficeWork.roots([old, waiting]).get('employee')).toBe(waiting);
    expect(OfficeWork.roots([waiting, old]).get('employee')).toBe(waiting);
    expect(OfficeWork.roots([worker]).size).toBe(0);
    const otherWorking: OfficeAgent = { ...waiting, state: 'working' };
    expect(OfficeWork.roots([active, otherWorking]).get('employee')).toBe(active);
    expect(OfficeWork.roots([otherWorking, active]).get('employee')).toBe(active);
    expect(OfficeWork.status(active)).toBe('active');
    expect(OfficeWork.status(waiting)).toBe('waiting');
    const desk: OfficeAgent = {
        id: 'desk',
        agentId: 'employee',
        name: 'Developer',
        desk: 71,
        state: 'waiting',
        activity: 'Waiting',
        goal: '',
    };
    expect(OfficeWork.roots([desk, active]).get('employee')).toBe(active);
    expect(OfficeWork.roots([desk]).get('employee')).toBe(desk);
    expect(OfficeWork.task('waiting')).toBe('waiting');
    expect(OfficeWork.task('PRIVATE PROMPT')).toBeUndefined();
    const failed: OfficeAgent = { ...active, state: 'failed' };
    const recovered: OfficeAgent = { ...old, id: 'recovered', streamId: 'recovered' };
    expect(OfficeWork.roots([failed, recovered]).get('employee')).toBe(recovered);
});

it('orders employee reactions by server event time while keeping delegated workers and other employees separate', () => {
    const failed: OfficeReaction = {
        id: 'failed-project',
        reason: 'error',
        phrase: 'WTF?!',
        startedAt: 1000n,
        expiresAt: 16000n,
    };
    const accepted: OfficeReaction = {
        ...failed,
        id: 'accepted-project',
        reason: 'accepted',
        phrase: 'WE DID IT!',
        startedAt: 2000n,
        expiresAt: 17000n,
    };
    const root: OfficeAgent = {
        id: 'company',
        streamId: 'company',
        agentId: 'employee',
        name: 'Developer',
        state: 'working',
        activity: 'Working',
        goal: '',
        reaction: failed,
    };
    const external: OfficeAgent = {
        ...root,
        id: 'discord',
        streamId: 'discord',
        reaction: accepted,
    };
    const worker: OfficeAgent = {
        ...root,
        id: 'company:worker',
        workerId: 'worker',
        reaction: { ...failed, id: 'worker-event', startedAt: 3000n },
    };
    const other: OfficeAgent = { ...root, id: 'other', streamId: 'other', agentId: 'other' };
    for (const input of [
        [root, worker, external, other],
        [other, external, worker, root],
    ]) {
        const reactions: ReadonlyMap<string, OfficeReaction> =
            OfficeWork.reactions<OfficeReaction>(input);
        expect(reactions.get('employee')).toBe(accepted);
        expect(reactions.get('other')).toBe(failed);
        expect(reactions.size).toBe(2);
    }
    expect(OfficeWork.reactions<OfficeReaction>([worker]).size).toBe(0);
    expect(OfficeWork.reaction(failed, undefined)).toBe(failed);
    expect(OfficeWork.reaction(undefined, accepted)).toBe(accepted);
    expect(OfficeWork.reaction(undefined, undefined)).toBeUndefined();
    const tie: OfficeReaction = { ...accepted, id: 'a-tie' };
    expect(OfficeWork.reaction(accepted, tie)).toBe(tie);
    expect(OfficeWork.reaction(tie, accepted)).toBe(tie);
    const browserFailure = {
        ...failed,
        startedAt: Number(failed.startedAt),
        expiresAt: Number(failed.expiresAt),
    };
    const browserAcceptance = {
        ...accepted,
        startedAt: Number(accepted.startedAt),
        expiresAt: Number(accepted.expiresAt),
    };
    expect(OfficeWork.reaction(browserFailure, browserAcceptance)).toBe(browserAcceptance);
    expect(OfficeWork.reaction(browserAcceptance, browserFailure)).toBe(browserAcceptance);
});
