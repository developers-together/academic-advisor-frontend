import { render as rtlRender } from '@testing-library/react';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import { env } from '@/config/env';
import { i18n } from '@/lib/i18n/i18n-instance';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
} from '@/testing/test-utils';

import LoginRoute from '../login';

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

const stubLocation = () => {
  const original = window.location;
  const assign = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...original, assign },
  });
  return {
    assign,
    restore: () =>
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: original,
      }),
  };
};

test('the sign-in screen shows the password form and the Microsoft 365 button', async () => {
  await renderApp(<LoginRoute />, {
    user: null,
    path: '/login',
    url: '/login',
  });

  expect(screen.getByLabelText(/university email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
  expect(screen.getByRole('separator')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /sign in with microsoft 365/i }),
  ).toBeInTheDocument();
});

test('the Microsoft 365 button label is in Arabic', async () => {
  await i18n.changeLanguage('ar');
  try {
    await renderApp(<LoginRoute />, {
      user: null,
      path: '/login',
      url: '/login',
    });

    expect(
      screen.getByRole('button', {
        name: 'تسجيل الدخول باستخدام Microsoft 365',
      }),
    ).toBeInTheDocument();
  } finally {
    await i18n.changeLanguage('en');
  }
});

test('the Microsoft 365 button sends the browser to the start endpoint in the same tab', async () => {
  const location = stubLocation();
  try {
    await renderApp(<LoginRoute />, {
      user: null,
      path: '/login',
      url: '/login',
    });

    await userEvent.click(
      screen.getByRole('button', { name: /sign in with microsoft 365/i }),
    );

    expect(location.assign).toHaveBeenCalledTimes(1);
    expect(location.assign).toHaveBeenCalledWith(
      `${env.API_URL}/auth/microsoft/start`,
    );
  } finally {
    location.restore();
  }
});

test('the Microsoft 365 button hands the path the person was trying to reach to the callback', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const location = stubLocation();
  try {
    const { unmount } = await renderApp(<LoginRoute />, {
      user: null,
      path: '/login',
      url: '/login?redirectTo=%2Fadvisor%2Fstudents',
    });

    await userEvent.click(
      screen.getByRole('button', { name: /sign in with microsoft 365/i }),
    );

    expect(location.assign).toHaveBeenCalledTimes(1);
    expect(location.assign).toHaveBeenCalledWith(
      `${env.API_URL}/auth/microsoft/start`,
    );
    location.restore();
    unmount();
  } finally {
    location.restore();
  }

  renderRealRouter(`/auth/microsoft/callback?code=${advisor.id}`);

  await waitFor(() =>
    expect(window.location.pathname).toBe('/advisor/students'),
  );
});

test('the Microsoft 365 button drops a path that leaves the platform', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const location = stubLocation();
  try {
    const { unmount } = await renderApp(<LoginRoute />, {
      user: null,
      path: '/login',
      url: '/login?redirectTo=%2F%2Fevil.example',
    });

    await userEvent.click(
      screen.getByRole('button', { name: /sign in with microsoft 365/i }),
    );

    expect(location.assign).toHaveBeenCalledTimes(1);
    expect(location.assign).toHaveBeenCalledWith(
      `${env.API_URL}/auth/microsoft/start`,
    );
    location.restore();
    unmount();
  } finally {
    location.restore();
  }

  renderRealRouter(`/auth/microsoft/callback?code=${advisor.id}`);

  await waitFor(() => expect(window.location.pathname).toBe('/advisor'));
});

test('the password sign-in still signs the person in and lands on the role landing', async () => {
  const student = await createUser();

  renderRealRouter('/login');

  await userEvent.type(
    await screen.findByLabelText(/university email/i),
    student.email,
  );
  await userEvent.type(screen.getByLabelText(/^password/i), student.password);
  await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

  await waitFor(() => expect(window.location.pathname).toBe('/app'));
});
