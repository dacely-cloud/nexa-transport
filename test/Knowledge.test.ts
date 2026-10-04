import { expect, it, vi } from 'vitest';
import { CompanyOp, type CompanyPacket } from '../src/company/CompanyTypes';
import { CompanyProtocol } from '../src/company/CompanyProtocol';
import { CompanyFormats } from '../src/networking/CompanyFormats';
import { CompanyChannel } from '../src/networking/CompanyChannel';
import { NexaClient } from '../src/networking/NexaClient';
import { TestGateway, hello } from './Support';

it('negotiates v3 library watches and preserves a draft ID without automatically replaying it', async () => {
    const channel = new CompanyChannel(CompanyFormats.staffing);
    const packets: CompanyPacket[] = [];
    const send = (bytes: Uint8Array<ArrayBuffer>): void => {
        packets.push(CompanyProtocol.decode(bytes));
    };
    channel.resume(send, CompanyFormats.departmentKnowledge);
    const listener = vi.fn(),
        error = vi.fn();
    const leave = channel.watch(listener, error);
    const id = packets[0]?.id ?? '';
    expect(packets[0]).toEqual({ op: CompanyOp.Subscribe, id, version: 3 });
    const state = {
        revision: 1n,
        name: 'Company',
        employees: [],
        projects: [],
        departments: [
            {
                id: 'team',
                name: 'Engineering',
                instructions: 'Private.',
                library: [
                    {
                        id: 'entry',
                        title: 'Release checklist',
                        body: 'Private procedure.',
                        kind: 'procedure' as const,
                        revision: 1,
                        reviewedAt: 0n,
                        archived: false,
                    },
                ],
            },
        ],
    };
    channel.receive({ op: CompanyOp.LiveSnapshot, id, sequence: 0n, state, version: 3 });
    expect(listener).toHaveBeenLastCalledWith(state);
    const command = {
        op: CompanyOp.KnowledgePublish,
        id: 'publish',
        revision: 1n,
        departmentId: 'team',
        entryId: 'entry',
    } as const;
    const pending = channel.request(command, send);
    expect(packets.at(-1)).toEqual({ ...command, version: 3 });
    channel.close(new Error('Disconnected'));
    await expect(pending).rejects.toThrow('Disconnected');
    channel.resume(send, CompanyFormats.departmentTools);
    expect(packets.at(-1)).toEqual({ op: CompanyOp.Subscribe, id, version: 2 });
    expect(packets.filter((packet) => packet.op === CompanyOp.KnowledgePublish)).toHaveLength(1);
    leave();
    channel.clear();
});

it('rejects unsupported knowledge commands locally before sending to an older gateway', async () => {
    const gateway = new TestGateway({
        ...hello,
        features: { ...hello.features, officeCompany: true, officeDepartmentTools: true },
    });
    const client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    try {
        expect(client.supportsDepartmentKnowledge).toBe(false);
        await expect(
            client.company({
                op: CompanyOp.KnowledgePublish,
                id: 'publish',
                revision: 1n,
                departmentId: 'team',
                entryId: 'entry',
            }),
        ).rejects.toThrow('Department knowledge');
        expect(gateway.requests).toHaveLength(1);
    } finally {
        client.close();
        await gateway.close();
    }
});
