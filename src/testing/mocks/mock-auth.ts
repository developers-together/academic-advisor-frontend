import { db } from './db';
import { hash } from './utils';

export type AdvaisorUser = {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  language_preference: 'en' | 'ar' | null;
  student_id: string | null;
  advisor_id: number | null;
  email_verified_at: string | null;
  pending_admin_at: string | null;
  suspended_at: string | null;
  faculty: string | null;
};

export const sanitizeUser = <O extends object>(user: O) => {
  const result = { ...user } as Record<string, unknown>;
  delete result.password;
  return result as Omit<O, 'password'>;
};

export const tokenFor = (userId: number) => `advaisor-mock-${userId}`;

export const userFromAuthHeader = (request: Request) => {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer advaisor-mock-(\d+)$/.exec(header);
  if (!match) {
    return null;
  }
  const id = Number(match[1]);
  const user = db.user.findFirst({ where: { id: { equals: id as number } } });
  if (!user || user.suspended_at) {
    return null;
  }
  return user;
};

export const unauthorized = () =>
  Response.json({ message: 'Unauthenticated.' }, { status: 401 });

export const requireAuth = (request: Request) => {
  const user = userFromAuthHeader(request);
  if (!user) {
    throw unauthorized();
  }
  return user;
};

export const verifyCredentials = ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const user = db.user.findFirst({
    where: { email: { equals: email.toLowerCase() } },
  });
  if (!user || user.password !== hash(password)) {
    return null;
  }
  return user;
};

// The stale-sis scenario stamps these onto the academic record seed.
export const STALE_STALENESS = {
  identity: false,
  academic_record: true,
  course_catalog: true,
};

export const FRESH_STALENESS = {
  identity: false,
  academic_record: false,
  course_catalog: false,
};

export const CURRENT_TERM = '2026F';
