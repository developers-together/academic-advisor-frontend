import type { DeepLink, UserRole } from '@/types/domain';

import { deepLinkHref } from './deep-link';

describe('deepLinkHref', () => {
  test.each([
    ['student', '/app/plan'],
    ['advisor', '/advisor'],
    ['dean', '/dean'],
    ['vp', '/vp'],
    ['admin', '/admin/students'],
  ])('routes the plan screen for a %s recipient', (role, expected) => {
    const link: DeepLink = { screen: 'plan', plan_id: 11 };
    expect(deepLinkHref(link, role as UserRole)).toBe(expected);
  });

  test.each([
    ['student', '/app'],
    ['advisor', '/advisor/students'],
    ['dean', '/dean'],
  ])('routes the student screen for a %s recipient', (role, expected) => {
    const link: DeepLink = { screen: 'student', student_id: 11 };
    expect(deepLinkHref(link, role as UserRole)).toBe(expected);
  });

  test.each([
    ['student', '/app'],
    ['advisor', '/advisor'],
  ])('routes the advisor screen for a %s recipient', (role, expected) => {
    const link: DeepLink = { screen: 'advisor', advisor_id: 2 };
    expect(deepLinkHref(link, role as UserRole)).toBe(expected);
  });

  test('routes the visit screen by recipient role', () => {
    const link: DeepLink = { screen: 'visit', visit_request_id: 100 };
    expect(deepLinkHref(link, 'advisor')).toBe('/advisor/meetings');
    expect(deepLinkHref(link, 'student')).toBe('/app');
    expect(deepLinkHref(link, 'dean')).toBe('/dean');
  });

  test('falls back to the role landing for unknown, legacy, and missing links', () => {
    expect(deepLinkHref({ screen: 'dashboard' as never }, 'student')).toBe(
      '/app',
    );
    expect(deepLinkHref('app/plan/3', 'student')).toBe('/app');
    expect(deepLinkHref(null, 'advisor')).toBe('/advisor');
    expect(deepLinkHref('nope', 'admin')).toBe('/admin/students');
  });
});
