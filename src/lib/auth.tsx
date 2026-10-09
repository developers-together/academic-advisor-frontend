import { useMutation } from '@tanstack/react-query';
import { configureAuth } from 'react-query-auth';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';

import { paths } from '@/config/paths';
import type { LanguagePreference, User, UserRole } from '@/types/domain';

import { api } from './api-client';
import { unwrap } from './api-envelope';
import { ApiError } from './api-error';
import { seedLanguageFromProfile } from './language';
import { tokenStorage } from './token-storage';

export const roleLanding: Record<UserRole, string> = {
  student: paths.app.root.getHref(),
  advisor: paths.advisor.root.getHref(),
  dean: paths.dean.root.getHref(),
  vp: paths.vp.root.getHref(),
  admin: paths.admin.root.getHref(),
};

export const sanitizeRedirectTo = (
  value: string | null | undefined,
): string | null => {
  if (!value) {
    return null;
  }
  if (!value.startsWith('/') || value.startsWith('//')) {
    return null;
  }
  return value;
};

const getUser = async (): Promise<User> => {
  if (!tokenStorage.get()) {
    return null as unknown as User;
  }
  try {
    const user = await unwrap<User>(api.get('/me'));
    seedLanguageFromProfile(user.language_preference);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null as unknown as User;
    }
    throw error;
  }
};

export const loginInputSchema = z.object({
  email: z
    .string()
    .min(1, 'auth:errors.emailRequired')
    .email('auth:errors.emailInvalid'),
  password: z.string().min(1, 'auth:errors.passwordRequired'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

const loginWithEmailAndPassword = async (data: LoginInput): Promise<User> => {
  const response = (await api.post('/login', data)) as { token: string };
  tokenStorage.set(response.token);
  try {
    return await getUser();
  } catch (error) {
    tokenStorage.clear();
    throw error;
  }
};

export const registerInputSchema = z
  .object({
    email: z
      .string()
      .min(1, 'auth:errors.emailRequired')
      .email('auth:errors.emailInvalid')
      .refine(
        (value) => value.toLowerCase().endsWith('@ejust.edu.eg'),
        'auth:errors.universityEmail',
      ),
    studentId: z.string().min(1, 'auth:errors.studentIdRequired'),
    nationalId: z
      .string()
      .min(1, 'auth:errors.nationalIdRequired')
      .regex(/^\d{14}$/, 'auth:errors.nationalIdInvalid'),
    password: z.string().min(8, 'auth:errors.passwordMin'),
    passwordConfirmation: z.string().min(1, 'auth:errors.passwordConfirmation'),
    language_preference: z.enum(['en', 'ar']),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'auth:errors.passwordMismatch',
    path: ['passwordConfirmation'],
  });

export type RegisterInput = z.infer<typeof registerInputSchema>;

export type RegisterResult = { kind: 'pending-verification'; email: string };

const registerWithEmailAndPassword = async (
  data: RegisterInput,
): Promise<RegisterResult> => {
  await api.post('/register', {
    email: data.email,
    password: data.password,
    password_confirmation: data.passwordConfirmation,
    student_id: data.studentId,
    national_id: data.nationalId,
    language_preference: data.language_preference satisfies LanguagePreference,
  });
  return { kind: 'pending-verification', email: data.email };
};

export const useRegister = () =>
  useMutation({ mutationFn: registerWithEmailAndPassword });

const logout = async (): Promise<void> => {
  try {
    await api.post('/logout');
  } finally {
    tokenStorage.clear();
  }
};

const authConfig = {
  userFn: getUser,
  loginFn: loginWithEmailAndPassword,
  logoutFn: logout,
  registerFn: registerWithEmailAndPassword as unknown as (
    data: RegisterInput,
  ) => Promise<User>,
};

export const { useUser, useLogin, useLogout, AuthLoader } =
  configureAuth(authConfig);

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUser();
  const location = useLocation();

  if (!user.data) {
    return (
      <Navigate
        to={paths.auth.login.getHref(`${location.pathname}${location.search}`)}
        replace
      />
    );
  }

  return children;
};
