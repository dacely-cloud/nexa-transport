import { expect, it } from 'vitest';
import { NexaClient } from '../src/networking/NexaClient';
import { CompanyOp } from '../src/company/CompanyTypes';
import { TestGateway, hello } from './Support';

it('rejects a department permission write before sending to an older gateway', async () => {
    const gateway = new TestGateway({
        ...hello,
        features: { ...hello.features, officeCompany: true },
    });
    const client = await NexaClient.connect({ url: await gateway.url(), reconnect: false });
    try {
        expect(client.supportsDepartmentTools).toBe(false);
        await expect(
            client.company({
                op: CompanyOp.DepartmentPolicy,
                id: 'policy',
                revision: 0n,
                departmentId: '',
                name: 'Engineering',
                instructions: 'Shared.',
                tools: [],
            }),
        ).rejects.toThrow('Department permissions');
        expect(gateway.requests).toHaveLength(1);
    } finally {
        client.close();
        await gateway.close();
    }
});
