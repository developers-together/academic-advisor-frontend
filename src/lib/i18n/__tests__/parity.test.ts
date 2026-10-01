import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const localesDir = join(__dirname, '..', 'locales');

const flatten = (obj: Record<string, unknown>, prefix = ''): string[] => {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      return flatten(value as Record<string, unknown>, path);
    }
    return [path];
  });
};

// Plural keys collapse to their base key for parity purposes
// (courseCount_one and courseCount_other must exist in both).
const normalize = (keys: string[]) =>
  new Set(
    keys.map((key) => key.replace(/_(zero|one|two|few|many|other)$/, '')),
  );

describe('i18n key parity', () => {
  const namespaces = readdirSync(join(localesDir, 'en'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace('.json', ''));

  it.each(namespaces)('en and ar agree on the %s namespace', (ns) => {
    const en = JSON.parse(
      readFileSync(join(localesDir, 'en', `${ns}.json`), 'utf8'),
    );
    const ar = JSON.parse(
      readFileSync(join(localesDir, 'ar', `${ns}.json`), 'utf8'),
    );

    const enKeys = normalize(flatten(en));
    const arKeys = normalize(flatten(ar));

    const missingInAr = [...enKeys].filter((key) => !arKeys.has(key));
    const missingInEn = [...arKeys].filter((key) => !enKeys.has(key));

    expect(missingInAr, `keys missing in ar/${ns}.json`).toEqual([]);
    expect(missingInEn, `keys missing in en/${ns}.json`).toEqual([]);
  });
});
