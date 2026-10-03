// SPDX-FileCopyrightText: 2026 Nexa contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from 'vitest';
import { WebSocketServer } from 'ws';
import { NexaClient } from '../src/networking/NexaClient.js';
import { hello } from './Support.js';
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

it('round trips bounded department settings and rejects them on older versions', () => {
    for (const tools of [null, [], ['read_file']]) {
        const command = {
            op: CompanyOp.DepartmentSettings,
            id: 'shared',
            revision: 9n,
            departmentId: 'engineering',
            name: 'Engineering',
            settings: { instructions: '<script>literal text</script>', tools },
        } as const;
        expect(CompanyProtocol.decode(CompanyProtocol.encode(command))).toEqual(command);
        for (const version of [1, 2] as const) {
            expect(() => CompanyProtocol.encode(command, version)).toThrow('v3');
            const malformed = CompanyProtocol.encode(command);
            malformed[4] = version;
            expect(() => CompanyProtocol.decode(malformed)).toThrow('v3');
        }
    }
});

it.each([1, 2, 3, 4, 5, 6, 7, 8] as const)(
    'negotiates NCMP v%i and rejects unsupported department changes locally',
    async (version) => {
        const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
        const versions: number[] = [];
        server.on('connection', (socket) => {
            socket.send(
                JSON.stringify({
                    event: 'connect.challenge',
                    seq: 1,
                    data: { nonce: 'challenge', ts: 1, protocol: 1, minProtocol: 1 },
                }),
            );
            socket.on('message', (raw: Buffer, binary: boolean) => {
                if (binary) {
                    const packet = CompanyProtocol.decode(raw);
                    versions.push(raw[4] ?? 0);
                    socket.send(
                        CompanyProtocol.encode(
                            {
                                op: CompanyOp.Snapshot,
                                id: packet.id,
                                state: {
                                    procedures: [],
                                    name: 'Company',
                                    revision: 0n,
                                    employees: [],
                                    departments: [],
                                    projects: [],
                                },
                            },
                            version,
                        ),
                    );
                } else {
                    const request = JSON.parse(raw.toString()) as { readonly id: string };
                    socket.send(
                        JSON.stringify({
                            id: request.id,
                            ok: true,
                            result: {
                                ...hello,
                                features: {
                                    ...hello.features,
                                    officeCompany: true,
                                    ...(version >= 2 ? { officeCompanyVersion: 2 } : {}),
                                    ...(version >= 3 ? { companyDepartmentSettings: true } : {}),
                                    ...(version >= 4 ? { officeConstruction: true } : {}),
                                    ...(version >= 5 ? { companyFollowups: true } : {}),
                                    ...(version >= 6 ? { companyTeamAreas: true } : {}),
                                    ...(version >= 7 ? { companyProcedures: true } : {}),
                                    ...(version >= 8 ? { officeDeskPositions: true } : {}),
                                },
                            },
                        }),
                    );
                }
            });
        });
        await new Promise<void>((resolve) => server.once('listening', resolve));
        const address = server.address();
        if (address === null || typeof address === 'string') {
            throw new Error('Expected address');
        }
        const client = await NexaClient.connect({
            url: `ws://127.0.0.1:${address.port}`,
            reconnect: false,
        });
        try {
            expect(
                (await client.company({ op: CompanyOp.Read, id: 'read', revision: 0n })).name,
            ).toBe('Company');
            expect(versions).toEqual([version]);
            const edit = {
                op: CompanyOp.DepartmentSettings,
                id: 'edit',
                revision: 0n,
                departmentId: 'team',
                name: 'Engineering',
                settings: { instructions: 'Private guidance', tools: [] },
            } as const;
            if (version < 3) {
                await expect(client.company(edit)).rejects.toThrow('unavailable');
                expect(versions).toEqual([version]);
            } else {
                await client.company(edit);
                expect(versions).toEqual([version, version]);
            }
            const construction = {
                op: CompanyOp.Construction,
                id: 'build',
                revision: 0n,
                construction: [],
            } as const;
            if (version < 4) {
                await expect(client.company(construction)).rejects.toThrow('unavailable');
            } else {
                await client.company(construction);
                expect(versions).toEqual([version, version, version]);
            }
            const positioned = {
                ...construction,
                id: 'position',
                deskPositions: [{ desk: 0, x: 8, z: 3 }],
            };
            if (version < 8)
                {await expect(client.company(positioned)).rejects.toThrow('unavailable');}
            const followup = {
                op: CompanyOp.Draft,
                id: 'followup',
                revision: 0n,
                sourceProjectId: 'source',
                name: 'Maintenance',
                brief: 'Improve the accepted product',
                managerId: 'ada',
                team: ['ada', 'grace'],
            } as const;
            if (version < 5) {
                await expect(client.company(followup)).rejects.toThrow('unavailable');
                expect(() => CompanyProtocol.encode(followup, version)).toThrow('v5');
            } else {
                await client.company(followup);
                expect(versions).toEqual([version, version, version, version]);
            }
            const areas = {
                ...construction,
                teams: [{ departmentId: 'engineering', placementId: 0 }],
            };
            if (version < 6) {
                await expect(client.company(areas)).rejects.toThrow('unavailable');
            } else {
                await client.company(areas);
                expect(versions.at(-1)).toBe(version);
            }
            const procedure = {
                op: CompanyOp.Procedure,
                id: 'procedure',
                revision: 0n,
                procedureId: '',
                title: 'Verify keyboard access',
                instructions: 'Test tab order and visible focus.',
                scope: 'employee',
                targetId: 'ada',
                status: 'draft',
                source: { projectId: 'source', revision: 9007199254740993n },
            } as const;
            if (version < 7) {
                await expect(client.company(procedure)).rejects.toThrow('unavailable');
                expect(() => CompanyProtocol.encode(procedure, version)).toThrow('v7');
            } else {
                await client.company(procedure);
                expect(versions.at(-1)).toBe(version);
                expect(CompanyProtocol.decode(CompanyProtocol.encode(procedure))).toEqual(
                    procedure,
                );
            }
            if (version >= 8) {
                await client.company(positioned);
                expect(versions.at(-1)).toBe(8);
            }
        } finally {
            client.close();
            for (const socket of server.clients) {
                socket.terminate();
            }
            await new Promise<void>((resolve, reject) =>
                server.close((error) => (error ? reject(error) : resolve())),
            );
        }
    },
);

it('round trips private accepted lineage without silently downgrading follow-up commands', () => {
    const command = {
        op: CompanyOp.Draft,
        id: 'followup',
        revision: 3n,
        sourceProjectId: 'accepted-project',
        name: 'Maintenance',
        brief: 'Keep the original behavior.',
        managerId: 'ada',
        team: ['ada', 'grace'],
    } as const;
    expect(CompanyProtocol.decode(CompanyProtocol.encode(command))).toEqual(command);
    const packet = {
        op: CompanyOp.Snapshot,
        id: 'snapshot',
        state: {
            procedures: [],
            name: 'Company',
            revision: 4n,
            employees: [],
            departments: [],
            construction: [],
            projects: [
                {
                    id: 'child',
                    name: command.name,
                    brief: command.brief,
                    managerId: command.managerId,
                    team: command.team,
                    source: { projectId: 'accepted-project', revision: 9007199254740993n },
                },
            ],
        },
    } as const;
    expect(CompanyProtocol.decode(CompanyProtocol.encode(packet))).toEqual(packet);
    for (const version of [1, 2, 3, 4] as const) {
        expect(() => CompanyProtocol.encode(command, version)).toThrow('v5');
        const old = CompanyProtocol.decode(CompanyProtocol.encode(packet, version));
        expect(old.op === CompanyOp.Snapshot && old.state.projects[0]?.source).toBeUndefined();
    }
});

it('round trips area zero and distinguishes preserved from cleared department assignments', () => {
    for (const teams of [undefined, [], [{ departmentId: 'engineering', placementId: 0 }]]) {
        const command = {
            op: CompanyOp.Construction,
            id: 'areas',
            revision: 4n,
            construction: [],
            ...(teams === undefined ? {} : { teams }),
        } as const;
        expect(CompanyProtocol.decode(CompanyProtocol.encode(command))).toEqual(command);
    }
    const packet = {
        op: CompanyOp.Snapshot,
        id: 'areas',
        state: {
            procedures: [],
            name: 'Company',
            revision: 1n,
            employees: [],
            projects: [],
            construction: [],
            departments: [
                {
                    id: 'engineering',
                    name: 'Engineering',
                    settings: { instructions: 'PRIVATE', tools: null },
                    area: 0,
                },
            ],
        },
    } as const;
    expect(CompanyProtocol.decode(CompanyProtocol.encode(packet))).toEqual(packet);
    for (const placementId of [-1, 256, 0.5, NaN]) {
        expect(() =>
            CompanyProtocol.encode({
                op: CompanyOp.Construction,
                id: 'bad',
                revision: 0n,
                construction: [],
                teams: [{ departmentId: 'engineering', placementId }],
            }),
        ).toThrow('area');
    }
});

it('round trips private procedure evidence and approval timestamps without losing bigint precision', () => {
    const source = { projectId: 'accepted-project', revision: 9007199254740993n };
    for (const status of ['draft', 'approved', 'retired'] as const) {
        const packet = {
            op: CompanyOp.Snapshot,
            id: 'procedures',
            state: {
                name: 'Company',
                revision: 1n,
                employees: [],
                departments: [],
                projects: [],
                construction: [],
                procedures: [
                    {
                        id: 'method',
                        title: '<img src=x> 🚀',
                        instructions: 'Private method',
                        scope: 'department',
                        targetId: 'engineering',
                        source,
                        status,
                        approvedAt: 9007199254740995n,
                    },
                ],
            },
        } as const;
        expect(CompanyProtocol.decode(CompanyProtocol.encode(packet))).toEqual(packet);
        for (const version of [1, 2, 3, 4, 5, 6] as const) {
            const legacy = CompanyProtocol.decode(CompanyProtocol.encode(packet, version));
            expect(legacy.op === CompanyOp.Snapshot && legacy.state.procedures).toBeUndefined();
        }
    }
});
