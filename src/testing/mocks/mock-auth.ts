import { db } from './db';
import { hash } from './utils';

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

export const CURRENT_TERM = '2026F';
