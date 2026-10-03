import { applyLanguage, useLanguageStore } from '@/lib/language';
import { db } from '@/testing/mocks/db';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
} from '@/testing/test-utils';

import { LoginForm } from '../login-form';

const signIn = async (email: string, password: string) => {
  await userEvent.type(screen.getByLabelText(/university email/i), email);
  await userEvent.type(screen.getByLabelText(/^password/i), password);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
};

afterEach(() => {
  useLanguageStore.setState({ language: 'en', languageTouched: false });
  applyLanguage('en');
  window.localStorage.removeItem('advaisor.token');
});

test('signing in applies the profile language until the user picks one', async () => {
  const user = await createUser();
  db.user.update({
    where: { id: { equals: user.id as number } },
    data: { language_preference: 'ar' },
  });
  const onSuccess = vi.fn();
  await renderApp(<LoginForm onSuccess={onSuccess} />, { user: null });

  await signIn(user.email, user.password);

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
  expect(document.documentElement.lang).toBe('ar');
});

test('a manually chosen language wins over the profile preference', async () => {
  const user = await createUser();
  db.user.update({
    where: { id: { equals: user.id as number } },
    data: { language_preference: 'ar' },
  });
  useLanguageStore.setState({ language: 'en', languageTouched: true });
  const onSuccess = vi.fn();
  await renderApp(<LoginForm onSuccess={onSuccess} />, { user: null });

  await signIn(user.email, user.password);

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  expect(document.documentElement.dir).toBe('ltr');
  expect(document.documentElement.lang).toBe('en');
});
