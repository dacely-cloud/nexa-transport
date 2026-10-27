import { describe, expect, it } from 'vitest';
import { RedTeamReportCodec } from '../src/redteam/RedTeamReportCodec.js';
import { RedTeamCodec } from '../src/redteam/RedTeamCodec.js';
import type {
    RedTeamFinding,
    RedTeamFindingReport,
    RedTeamReportReference,
} from '../src/redteam/RedTeamTypes.js';

const finding: RedTeamFinding = {
    findingId: 'finding-1',
    title: 'A clear custom title',
    severity: 'high',
    status: 'pending',
    cvssScore: null,
    description: 'A problem being checked.',
    affectedComponent: 'Example component',
    agentId: null,
    evidence: [],
    reproduction: [],
    updatedAtMs: '1',
};
const report: RedTeamFindingReport = {
    impact: 'Someone could see information they should not see.',
    affectedVersions: 'Example versions 1 and 2',
    prerequisites: ['A user account is needed.'],
    expectedBehavior: 'Keep each account’s information private.',
    actualBehavior: 'The wrong account could see the information.',
    remediation: 'Check who may read the information.',
    technicalDetails: 'The detailed explanation belongs here.',
    cveIds: [],
    cweIds: ['CWE-200'],
    references: [{ title: 'Owner documentation', url: 'https://example.com/help' }],
};

describe('plain-language red team reports', (): void => {
    it('preserves complete report details and the custom finding title', (): void => {
        const decoded: RedTeamFinding = RedTeamCodec.finding({ ...finding, report });
        expect(decoded).toEqual({ ...finding, report });
        expect(decoded.title).toBe('A clear custom title');
    });
    it('preserves historical findings and missing details without fabricating defaults', (): void => {
        expect(RedTeamCodec.finding(finding)).toEqual(finding);
        expect(Object.hasOwn(RedTeamCodec.finding(finding), 'report')).toBe(false);
        expect(RedTeamReportCodec.parse({})).toEqual({});
        const partial: RedTeamFindingReport = RedTeamReportCodec.parse({ impact: report.impact });
        expect(partial).toEqual({ impact: report.impact });
        expect(Object.hasOwn(partial, 'cveIds')).toBe(false);
        expect(RedTeamReportCodec.parse({ cveIds: [], cweIds: [] })).toEqual({
            cveIds: [],
            cweIds: [],
        });
    });
    it('accepts reported CVE and CWE formats while retaining exact identifiers', (): void => {
        expect(
            RedTeamReportCodec.parse({ cveIds: ['CVE-2026-12345'], cweIds: ['CWE-79'] }),
        ).toEqual({ cveIds: ['CVE-2026-12345'], cweIds: ['CWE-79'] });
    });
    it.each(['CVE-pending', 'CVE-2026-123', 'cve-2026-12345', 'CVE-2026-12345 extra'])(
        'rejects invalid CVE identifier %s',
        (id: string): void => {
            expect((): void => {
                RedTeamReportCodec.parse({ cveIds: [id] });
            }).toThrow('identifier');
        },
    );
    it.each(['CWE-0', 'CWE-079', '79', 'CWE-79 extra'])(
        'rejects invalid CWE identifier %s',
        (id: string): void => {
            expect((): void => {
                RedTeamReportCodec.parse({ cweIds: [id] });
            }).toThrow('identifier');
        },
    );
    it('rejects duplicate identifiers and bounds every list and long text', (): void => {
        expect((): void => {
            RedTeamReportCodec.parse({ cweIds: ['CWE-79', 'CWE-79'] });
        }).toThrow('Duplicate');
        expect((): void => {
            RedTeamReportCodec.parse({ prerequisites: new Array<string>(101).fill('A condition') });
        }).toThrow();
        expect((): void => {
            RedTeamReportCodec.parse({ prerequisites: ['x'.repeat(4097)] });
        }).toThrow();
        expect((): void => {
            RedTeamReportCodec.parse({ cveIds: new Array<string>(33).fill('CVE-2026-12345') });
        }).toThrow();
        expect((): void => {
            RedTeamReportCodec.parse({
                references: new Array<RedTeamReportReference>(65).fill({
                    title: 'Reference',
                    url: 'https://example.com/report',
                }),
            });
        }).toThrow();
        expect((): void => {
            RedTeamReportCodec.parse({ technicalDetails: 'x'.repeat(64_001) });
        }).toThrow();
        for (const field of [
            'impact',
            'affectedVersions',
            'expectedBehavior',
            'actualBehavior',
            'remediation',
        ]) {
            expect((): void => {
                RedTeamReportCodec.parse({ [field]: 'x'.repeat(16_385) });
            }).toThrow();
        }
    });
    it.each([
        'javascript:alert(1)',
        'data:text/html,test',
        'file:///tmp/report',
        '//example.com/report',
        'https:example.com/report',
        'https://user:secret@example.com',
        'https://example.com/\nreport',
    ])('rejects unsafe or ambiguous reference URL %s', (url: string): void => {
        expect((): void => {
            RedTeamReportCodec.reference({ title: 'Reference', url });
        }).toThrow();
    });
    it('keeps HTTP and HTTPS reference titles and links without rewriting them', (): void => {
        for (const url of ['https://example.com/report#details', 'http://example.com/report']) {
            expect(RedTeamReportCodec.reference({ title: 'Owner report', url })).toEqual({
                title: 'Owner report',
                url,
            });
        }
    });
    it('rejects unknown fields, accessors and invalid present values', (): void => {
        expect((): void => {
            RedTeamReportCodec.parse({ assignedCve: 'invented' });
        }).toThrow();
        expect((): void => {
            RedTeamReportCodec.parse({ impact: undefined });
        }).toThrow();
        expect((): void => {
            RedTeamReportCodec.parse({ cveIds: null });
        }).toThrow();
        expect((): void => {
            RedTeamCodec.finding({ ...finding, report: undefined });
        }).toThrow();
        expect((): void => {
            RedTeamReportCodec.reference({ title: '', url: 'https://example.com' });
        }).toThrow();
        const accessor: Record<string, unknown> = {};
        Object.defineProperty(accessor, 'impact', {
            get: (): string => {
                throw new Error('Do not execute');
            },
        });
        expect((): void => {
            RedTeamReportCodec.parse(accessor);
        }).toThrow('accessors');
    });
});
