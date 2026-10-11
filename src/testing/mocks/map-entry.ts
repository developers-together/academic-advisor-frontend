import type { PrerequisiteMapEntry } from '@/types/domain';

export const mapEntry = (
  overrides: Partial<PrerequisiteMapEntry> &
    Pick<PrerequisiteMapEntry, 'course_code'>,
): PrerequisiteMapEntry => ({
  title: null,
  level: null,
  state: 'eligible',
  prerequisites: [],
  missing_prerequisites: [],
  active: true,
  available: true,
  reasons: [],
  warnings: [],
  ...overrides,
});
