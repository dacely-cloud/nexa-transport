import { expect, it } from 'vitest';
import { OfficeWork, type OfficeAgent } from '../src/office/OfficeProtocol.js';

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
