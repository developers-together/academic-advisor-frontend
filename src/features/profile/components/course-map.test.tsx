import { i18n } from '@/lib/i18n/i18n-instance';
import { mapEntry } from '@/testing/mocks/map-entry';
import { render, screen, userEvent, within } from '@/testing/test-utils';
import type { PrerequisiteMapEntry } from '@/types/domain';

import { CourseMap } from './course-map';

const entries: PrerequisiteMapEntry[] = [
  mapEntry({
    course_code: 'CS 101',
    title: 'Introduction to Computing',
    level: 1,
    state: 'completed',
  }),
  mapEntry({
    course_code: 'CS 201',
    title: 'Data Structures',
    level: 1,
    state: 'eligible',
    prerequisites: ['CS 101'],
    missing_prerequisites: ['CS 101'],
  }),
  mapEntry({
    course_code: 'CS 301',
    title: 'Algorithms',
    level: 2,
    state: 'attempted',
  }),
];

test('keeps the level map keyboard operable from the cards to the detail panel', async () => {
  const user = userEvent.setup();
  render(<CourseMap entries={entries} />);

  const map = screen.getByRole('group', { name: 'Course map' });
  const cards = within(map).getAllByRole('button');
  expect(cards).toHaveLength(3);
  cards[0]!.focus();
  await user.tab();
  expect(cards[1]).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(cards[1]).toHaveAttribute('aria-pressed', 'true');

  const panel = screen.getByRole('group', { name: 'Course details' });
  expect(panel).toHaveTextContent('CS 201');
  await user.click(within(panel).getByRole('button', { name: 'CS 101' }));
  expect(
    within(map).getByRole('button', {
      name: 'CS 101 Introduction to Computing, Completed',
    }),
  ).toHaveAttribute('aria-pressed', 'true');

  const readerList = screen.getByRole('list', { name: 'Course map' });
  expect(readerList).toHaveTextContent('Attempted');
  expect(readerList).toHaveTextContent('Completed');
});

test('renders the Arabic course map chrome with RTL flow', async () => {
  await i18n.changeLanguage('ar');
  const arabicEntries: PrerequisiteMapEntry[] = [
    mapEntry({
      course_code: 'CS 101',
      title: 'مقدمة في الحاسوب',
      level: 1,
      state: 'completed',
    }),
    mapEntry({
      course_code: 'CS 201',
      title: 'هياكل البيانات',
      level: 1,
      state: 'attempted',
    }),
    mapEntry({
      course_code: 'CS 301',
      title: 'الخوارزميات',
      level: 2,
      state: 'locked',
    }),
  ];

  const { unmount } = render(
    <CourseMap entries={arabicEntries} currentLevel={2} />,
  );

  try {
    const map = screen.getByRole('group', { name: 'خريطة المقررات' });
    const headings = within(map).getAllByRole('heading');
    expect(headings.map((heading) => heading.textContent)).toEqual([
      'المستوى 1',
      'المستوى 2',
    ]);
    expect(within(map).getByText('مستواك الحالي')).toBeInTheDocument();
    expect(
      within(map).getByRole('button', {
        name: 'CS 101 مقدمة في الحاسوب, مكتمل',
      }),
    ).toBeInTheDocument();
    expect(within(map).getByText('محاولة سابقة')).toBeInTheDocument();
  } finally {
    unmount();
    await i18n.changeLanguage('en');
  }
});
