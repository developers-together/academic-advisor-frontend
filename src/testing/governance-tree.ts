import type {
  GovernanceDean,
  GovernanceLevel,
  GovernanceMetrics,
  GovernanceNode,
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
  children?: GovernanceNode[];
};

export const governanceNode = ({
  level,
  code = null,
  nameEn = null,
  nameAr = null,
  deans = [],
  metrics,
  children = [],
}: GovernanceNodeInput): GovernanceNode => ({
  level,
  code,
  name_en: nameEn,
  name_ar: nameAr,
  term_code: '2026F',
  metrics: governanceMetrics(metrics),
  deans,
  children,
});

export const seedGovernanceTree = (root: GovernanceNode) => {
  db.governanceTree.deleteMany({ where: {} });
  db.governanceTree.create({ payload: JSON.stringify(root) });
};
