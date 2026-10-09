import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import { routeTable } from '@/config/routes';
import {
  createUser,
  loginAsUser,
  screen,
  waitFor,
  within,
} from '@/testing/test-utils';

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

const student = () =>
  createUser({
    name: 'Sara Student',
    faculty: 'Engineering',
    student_id: '3020117',
  });

const openPaletteWithHotkey = async () => {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
  );
  return screen.findByRole('combobox');
};

describe('command palette', () => {
  test('the hotkey opens the palette with role-scoped page entries', async () => {
    await loginAsUser(await student());
    renderRealRouter('/app');
    await screen.findByRole('link', { name: 'Home' });

    const input = await openPaletteWithHotkey();

    expect(input).toBeInTheDocument();
    await userEvent.type(input, 'record');
    expect(
      await screen.findByRole('option', { name: /academic record/i }),
    ).toBeInTheDocument();
  });

  test('the palette navigates to the selected page and closes', async () => {
    await loginAsUser(await student());
    renderRealRouter('/app');
    await screen.findByRole('link', { name: 'Home' });

    await openPaletteWithHotkey();

    await userEvent.click(
      await screen.findByRole('option', { name: /my advisor/i }),
    );

    await waitFor(() => expect(window.location.pathname).toBe('/app/advisor'));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  test('the advisor palette carries the office-hours action', async () => {
    await loginAsUser(
      await createUser({ role: 'advisor', faculty: 'Engineering' }),
    );
    renderRealRouter('/advisor');
    await screen.findByRole('link', { name: 'Queue' });

    const input = await openPaletteWithHotkey();

    await userEvent.type(input, 'office');
    expect(
      await screen.findByRole('option', { name: /set office hours/i }),
    ).toBeInTheDocument();
  });

  test('the sidebar search button opens the palette', async () => {
    await loginAsUser(await student());
    renderRealRouter('/app');
    await screen.findByRole('link', { name: 'Home' });

    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });
});

describe('mobile sidebar navigation', () => {
  const matchDesktop = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });

  test('the mobile rail expands, exposes every page, and closes after navigation', async () => {
    const user = userEvent.setup();
    window.matchMedia = vi.fn().mockImplementation(
      (query: string) =>
        ({
          ...matchDesktop(),
          matches: query.includes('max-width: 767px'),
        }) as MediaQueryList,
    );
    try {
      await loginAsUser(await student());
      renderRealRouter('/app');
      const sidebar = await screen.findByRole('navigation', {
        name: 'Student',
      });
      for (const name of [
        'Home',
        'My Plan',
        'AI Advisor',
        'My Advisor',
        'Academic Record',
        'Account',
      ]) {
        expect(within(sidebar).getByRole('link', { name })).toBeInTheDocument();
      }
      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      await user.click(
        within(sidebar).getByRole('button', { name: 'Expand sidebar' }),
      );
      const expandedSidebar = screen.getByRole('navigation', {
        name: 'Student',
      });
      expect(
        within(expandedSidebar).getByRole('button', {
          name: 'Collapse sidebar',
        }),
      ).toHaveAttribute('aria-expanded', 'true');
      await user.click(
        within(expandedSidebar).getByRole('link', { name: 'Account' }),
      );
      await waitFor(() =>
        expect(window.location.pathname).toBe('/app/account'),
      );
      expect(
        within(screen.getByRole('navigation', { name: 'Student' })).getByRole(
          'button',
          { name: 'Expand sidebar' },
        ),
      ).toHaveAttribute('aria-expanded', 'false');
    } finally {
      vi.restoreAllMocks();
    }
  });
});

test('routes are unique and legacy links redirect to their current pages', () => {
  expect(new Set(routeTable.map((route) => route.path)).size).toBe(
    routeTable.length,
  );
  expect(
    routeTable.find((route) => route.path === '/app/profile')?.redirectTo,
  ).toBe('/app/account');
  expect(
    routeTable.find((route) => route.path === '/admin/settings')?.redirectTo,
  ).toBe('/admin');
});
