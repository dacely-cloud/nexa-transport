// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { CompanyOp, CompanyProtocol } from '../src/company/CompanyProtocol.js';

it('preserves empty and inherited employee permissions and gates settings on NCMP v2', () => {
    for (const tools of [null, [], ['read_file', 'company_review']]) {
        const command = {
            op: CompanyOp.Employee,
            id: 'configure',
            revision: 9007199254740993n,
            employeeId: 'employee:one',
            name: 'Ada',
            role: 'Reviewer',
            instructions: '<script>literal text</script>',
            settings: { provider: 'configured', model: 'model-v2', tools },
        } as const;
        expect(CompanyProtocol.decode(CompanyProtocol.encode(command))).toEqual(command);
        expect(() => CompanyProtocol.encode(command, 1)).toThrow('v2');
    }
    const legacy = { op: CompanyOp.Read, id: 'read', revision: 0n } as const;
    expect(CompanyProtocol.decode(CompanyProtocol.encode(legacy, 1))).toEqual({
        ...legacy,
        version: 1,
    });
});
