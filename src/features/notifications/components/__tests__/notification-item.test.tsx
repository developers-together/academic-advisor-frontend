import { i18n } from '@/lib/i18n/i18n-instance';
import { rtlRender, screen } from '@/testing/test-utils';

import { NotificationItem } from '../notification-item';

const TITLE = 'A staff account is waiting for a role';
const BODY =
  'Karim Newly Registered (karim.newly@ejust.edu.eg) registered with a Microsoft 365 account and is waiting for a role.';

test('the staff registration notification renders the title and body the backend sends', async () => {
  await i18n.changeLanguage('en');

  rtlRender(
    <ul>
      <NotificationItem
        notification={{
          id: 'notification-1',
          slug: 'staff_registered',
          title: TITLE,
          body: BODY,
          deep_link: { screen: 'staff', role: 'awaiting_role' },
          read_at: null,
          created_at: '2026-10-20T09:00:00.000Z',
        }}
        onOpen={() => {}}
      />
    </ul>,
  );

  expect(screen.getByText(TITLE)).toBeInTheDocument();
  expect(screen.getByText(BODY)).toBeInTheDocument();
});
