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
  is_available: true,
  availability_reasons: [],
  warnings: [],
  ...overrides,
});
