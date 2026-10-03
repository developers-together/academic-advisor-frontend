import { i18n } from '@/lib/i18n/i18n-instance';
import { rtlRender, screen } from '@/testing/test-utils';

import { Notification } from '../notification';

const renderNotification = () =>
  rtlRender(
    <Notification
      notification={{
        id: '1',
        type: 'info',
        title: 'Plan saved',
        message: 'Your plan was saved.',
      }}
      onDismiss={() => {}}
    />,
  );

test('dismiss label follows the active language', async () => {
  await i18n.changeLanguage('en');
  const { unmount: unmountEn } = renderNotification();
  expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  unmountEn();

  await i18n.changeLanguage('ar');
  const { unmount: unmountAr } = renderNotification();
  expect(screen.getByRole('button', { name: 'إغلاق' })).toBeInTheDocument();
  unmountAr();

  await i18n.changeLanguage('en');
});
