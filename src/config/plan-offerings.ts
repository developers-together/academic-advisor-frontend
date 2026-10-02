export const OFFERED_GROUPS = ['G1', 'G2', 'G3'] as const;

export const OFFERED_SECTIONS = ['01', '02', '03', '04', '05', '06'] as const;

export type OfferedGroup = (typeof OFFERED_GROUPS)[number];

export type OfferedSection = (typeof OFFERED_SECTIONS)[number];

export const DEFAULT_GROUP: OfferedGroup = 'G1';

export const DEFAULT_SECTION: OfferedSection = '01';

export const isOfferedGroup = (value: unknown): value is OfferedGroup =>
  typeof value === 'string' &&
  (OFFERED_GROUPS as readonly string[]).includes(value);

export const isOfferedSection = (value: unknown): value is OfferedSection =>
  typeof value === 'string' &&
  (OFFERED_SECTIONS as readonly string[]).includes(value);
