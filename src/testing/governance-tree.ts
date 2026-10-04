import type {
  GovernanceAdvisorRow,
  GovernanceDean,
  GovernanceLevel,
  GovernanceMetrics,
  GovernanceNode,
  GovernanceTrendPoint,
} from '@/types/domain';

import { db } from './mocks/db';

export const governanceMetrics = (
  overrides: Partial<GovernanceMetrics> = {},
): GovernanceMetrics => ({
  students: 100,
  caseload: 80,
  approved: 40,
  completion_rate: 50,
  completion_is_final: false,
  median_decision_hours: 24,
  aging_count: 3,
  funnel: {
    draft: 4,
    submitted: 6,
    under_review: 3,
    returned: 2,
    approved: 40,
    expired: 2,
    closed: 40,
    withdrawn: 1,
    discarded: 1,
  },
  ...overrides,
});

type GovernanceNodeInput = {
  level: GovernanceLevel;
  code?: string | null;
  nameEn?: string | null;
  nameAr?: string | null;
  deans?: GovernanceDean[];
  metrics?: Partial<GovernanceMetrics>;
  trends?: GovernanceTrendPoint[];
  advisors?: GovernanceAdvisorRow[];
  children?: GovernanceNode[];
};

const TERM_CODES = ['2024S', '2024F', '2025S', '2025F', '2026S', '2026F'];

const wobble = (seed: string, index: number, spread: number) => {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return (((hash + index * 37) % 21) - 10) * spread;
};

export const governanceTrends = (
  seed: string,
  completion: number | null,
  median: number | null,
  aging: number,
): GovernanceTrendPoint[] =>
  TERM_CODES.map((term_code, index) => ({
    term_code,
    completion_rate:
      completion === null
        ? null
        : Math.max(
            5,
            Math.min(
              95,
              Math.round(
                completion + wobble(seed, index, 2.5) - (5 - index) * 1.5,
              ),
            ),
          ),
    median_decision_hours:
      median === null
        ? null
        : Math.max(
            4,
            Math.round(median + wobble(`${seed}m`, index, 1.2) + (5 - index)),
          ),
    aging_count: Math.max(
      0,
      Math.round(aging + wobble(`${seed}a`, index, 0.8) - (5 - index) / 2),
    ),
  }));

export const governanceNode = ({
  level,
  code = null,
  nameEn = null,
  nameAr = null,
  deans = [],
  metrics,
  trends,
  advisors,
  children = [],
}: GovernanceNodeInput): GovernanceNode => ({
  level,
  code,
  name_en: nameEn,
  name_ar: nameAr,
  term_code: '2026F',
  metrics: governanceMetrics(metrics),
  trends:
    trends ??
    governanceTrends(
      code ?? nameEn ?? level,
      governanceMetrics(metrics).completion_rate,
      governanceMetrics(metrics).median_decision_hours,
      governanceMetrics(metrics).aging_count,
    ),
  ...(advisors ? { advisors } : {}),
  deans,
  children,
});

export const seedGovernanceTree = (
  root: GovernanceNode,
  advisors: GovernanceNode[] = [],
) => {
  db.governanceTree.deleteMany({ where: {} });
  db.governanceTree.create({ payload: JSON.stringify(root) });
  db.governanceAdvisor.deleteMany({ where: {} });
  for (const advisor of advisors) {
    db.governanceAdvisor.create({ payload: JSON.stringify(advisor) });
  }
};
