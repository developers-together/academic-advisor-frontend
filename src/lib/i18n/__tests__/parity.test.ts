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

describe('Microsoft sign-in strings', () => {
  const failureReasons = [
    'wrong_tenant',
    'outside_staff_domains',
    'student_account',
    'identity_bound_elsewhere',
    'suspended',
    'cancelled',
    'expired_code',
    'exchange_failed',
  ];

  const keys = [
    'microsoft.title',
    'microsoft.signIn',
    'microsoft.divider',
    'microsoft.processing',
    'microsoft.backToSignIn',
    'microsoft.genericFailure',
    'microsoft.awaitingRole.title',
    'microsoft.awaitingRole.body',
    'microsoft.awaitingRole.emailLabel',
    'microsoft.awaitingRole.signOut',
    ...failureReasons.map((reason) => `microsoft.failures.${reason}`),
  ];

  const read = (locale: 'en' | 'ar') =>
    JSON.parse(
      readFileSync(join(localesDir, locale, 'auth.json'), 'utf8'),
    ) as Record<string, unknown>;

  const readKey = (dictionary: Record<string, unknown>, key: string) =>
    key
      .split('.')
      .reduce<unknown>(
        (value, part) =>
          value && typeof value === 'object'
            ? (value as Record<string, unknown>)[part]
            : undefined,
        dictionary,
      );

  it.each(keys)('%s exists in English and in Arabic', (key) => {
    const en = readKey(read('en'), key);
    const ar = readKey(read('ar'), key);

    expect(typeof en, `en ${key}`).toBe('string');
    expect(typeof ar, `ar ${key}`).toBe('string');
    expect(String(en).trim().length).toBeGreaterThan(0);
    expect(String(ar).trim().length).toBeGreaterThan(0);
  });

  it('keeps the numerals in the Arabic strings Latin', () => {
    const ar = read('ar');
    const body = readKey(ar, 'microsoft.awaitingRole.body');

    expect(String(body)).not.toMatch(/[٠-٩]/);
  });
});

describe('Staff registration strings', () => {
  const keys = [
    ['admin', 'staff.filter.awaiting_role'],
    ['admin', 'staff.roles.awaiting_role'],
    ['notifications', 'slugs.staff_registered'],
  ] as const;

  const readNamespace = (locale: 'en' | 'ar', namespace: string) =>
    JSON.parse(
      readFileSync(join(localesDir, locale, `${namespace}.json`), 'utf8'),
    ) as Record<string, unknown>;

  const readKey = (dictionary: Record<string, unknown>, key: string) =>
    key
      .split('.')
      .reduce<unknown>(
        (value, part) =>
          value && typeof value === 'object'
            ? (value as Record<string, unknown>)[part]
            : undefined,
        dictionary,
      );

  it.each(keys)('%s.%s exists in English and in Arabic', (namespace, key) => {
    const en = readKey(readNamespace('en', namespace), key);
    const ar = readKey(readNamespace('ar', namespace), key);

    expect(typeof en, `en ${key}`).toBe('string');
    expect(typeof ar, `ar ${key}`).toBe('string');
    expect(String(en).trim().length).toBeGreaterThan(0);
    expect(String(ar).trim().length).toBeGreaterThan(0);
  });
});
