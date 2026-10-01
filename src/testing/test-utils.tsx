import {
  render as rtlRender,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';

import { AppProvider } from '@/app/provider';

import { db } from './mocks/db';
import { tokenFor } from './mocks/mock-auth';
import { hash } from './mocks/utils';

export type MockUser = {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: string;
  student_id?: string | null;
  advisor_id?: number | null;
  email_verified_at?: string | null;
  faculty?: string | null;
};

export const createUser = async (
  userProperties?: Partial<MockUser>,
): Promise<MockUser> => {
  const user: MockUser = {
    name: 'Sara Student',
    email: `sara-${Math.random().toString(36).slice(2)}@ejust.edu.eg`,
    password: 'password123',
    role: 'student',
    email_verified_at: '2026-09-01T09:00:00.000Z',
    ...userProperties,
  };
  const created = db.user.create({
    ...(user.id !== undefined ? { id: user.id } : {}),
    name: user.name,
    email: user.email.toLowerCase(),
    password: hash(user.password),
    role: user.role,
    language_preference: 'en',
    student_id: user.student_id ?? `302${Math.floor(Math.random() * 1000000)}`,
    advisor_id: user.advisor_id ?? undefined,
    email_verified_at: user.email_verified_at ?? undefined,
    faculty: user.faculty ?? undefined,
  });
  return { ...user, id: created.id as number };
};

export const loginAsUser = async (user: MockUser) => {
  window.localStorage.setItem('advaisor.token', tokenFor(user.id as number));
  return user;
};

export const waitForLoadingToFinish = () =>
  waitForElementToBeRemoved(
    () => [
      ...screen.queryAllByTestId(/loading/i),
      ...screen.queryAllByText(/loading/i),
    ],
    { timeout: 4000 },
  );

const initializeUser = async (user: MockUser | null | undefined) => {
  if (typeof user === 'undefined') {
    const newUser = await createUser();
    return loginAsUser(newUser);
  }
  if (user) {
    return loginAsUser(user);
  }
  return null;
};

export const renderApp = async (
  ui: React.ReactElement,
  {
    user,
    url = '/',
    path = '/',
    ...renderOptions
  }: { user?: MockUser | null; url?: string; path?: string } = {},
) => {
  const initializedUser = await initializeUser(user);

  const router = createMemoryRouter(
    [
      {
        path: path,
        element: ui,
      },
    ],
    {
      initialEntries: url ? ['/', url] : ['/'],
      initialIndex: url ? 1 : 0,
    },
  );

  const returnValue = {
    ...rtlRender(ui, {
      wrapper: () => {
        return (
          <AppProvider>
            <RouterProvider router={router} />
          </AppProvider>
        );
      },
      ...renderOptions,
    }),
    user: initializedUser,
  };

  await waitForLoadingToFinish();

  return returnValue;
};

export * from '@testing-library/react';
export { userEvent, rtlRender };
