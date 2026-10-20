import { env } from '@/config/env';

export const microsoftSignInStartUrl = `${env.API_URL}/auth/microsoft/start`;

export const microsoftLandingKey = 'advaisor.microsoft.landing';

export const microsoftSignInFailures = [
  'wrong_tenant',
  'outside_staff_domains',
  'student_account',
  'identity_bound_elsewhere',
  'suspended',
  'cancelled',
  'expired_code',
  'exchange_failed',
] as const;

export type MicrosoftSignInFailure = (typeof microsoftSignInFailures)[number];

export const isMicrosoftSignInFailure = (
  value: string | null | undefined,
): value is MicrosoftSignInFailure =>
  typeof value === 'string' &&
  (microsoftSignInFailures as readonly string[]).includes(value);

const attempt = (operation: () => void): boolean => {
  try {
    operation();
    return true;
  } catch {
    return false;
  }
};

export const rememberMicrosoftLandingPath = (path: string | null): void => {
  attempt(() => {
    if (path) {
      sessionStorage.setItem(microsoftLandingKey, path);
      return;
    }
    sessionStorage.removeItem(microsoftLandingKey);
  });
};

export const readMicrosoftLandingPath = (): string | null => {
  let path: string | null = null;
  attempt(() => {
    path = sessionStorage.getItem(microsoftLandingKey);
  });
  return path;
};
