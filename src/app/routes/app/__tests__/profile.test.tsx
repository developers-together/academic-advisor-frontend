import { db } from '@/testing/mocks/db';
import { STALE_STALENESS } from '@/testing/mocks/mock-auth';
import { server } from '@/testing/mocks/server';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
} from '@/testing/test-utils';

import ProfileRoute from '../profile';

const fourStateMap = [
  {
    course_code: 'CS 101',
    title: 'Introduction to Programming',
    state: 'completed',
    prerequisites: [],
  },
  {
    course_code: 'EE 210',
    title: 'Circuits',
    state: 'planned',
    prerequisites: [],
  },
  {
    course_code: 'CS 201',
    title: 'Data Structures',
    state: 'eligible',
    prerequisites: ['CS 101'],
  },
  {
    course_code: 'CS 301',
    title: 'Algorithms',
    state: 'locked',
    prerequisites: ['CS 201'],
  },
];

const FRESH_STALENESS = {
  identity: false,
  academic_record: false,
  course_catalog: false,
};

const seedRecord = (
  userId: number,
  overrides: Record<string, unknown> = {},
) => {
  return db.academicRecord.create({
    userId,
    cgpa: 3.2,
    curriculum_year_level: 2,
    remaining_requirements: '60 credit hours',
    history: JSON.stringify([
      {
        course_code: 'CS 101',
        title: 'Introduction to Programming',
        term_code: '2025F',
        grade: 'A',
      },
    ]),
    current_enrollments: JSON.stringify([
      {
        course_code: 'EE 210',
        title: 'Circuits',
        group: 'G1',
        section: '01',
      },
    ]),
    prerequisite_map: JSON.stringify(fourStateMap),
    last_synced_at: '2026-10-01T12:00:00.000Z',
    staleness: JSON.stringify(FRESH_STALENESS),
    ...overrides,
  });
};

const seedAdvisor = () => {
  if (!db.user.findFirst({ where: { id: { equals: 2 as number } } })) {
    db.user.create({
      id: 2,
      name: 'Amr Advisor',
      email: 'advisor@ejust.edu.eg',
      password: 'password123',
      role: 'advisor',
    });
  }
  if (
    !db.advisorProfile.findFirst({
      where: { advisorId: { equals: 2 as number } },
    })
  ) {
    db.advisorProfile.create({
      advisorId: 2,
      rows: JSON.stringify([
        { day: 'Sunday', from: '10:00', to: '12:00' },
        { day: 'Tuesday', from: '13:00', to: '15:00' },
      ]),
    });
  }
};

const trackRequests = () => {
  let recordReads = 0;
  const otherRequestsAfterRecording: string[] = [];
  let recording = false;
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/academic-record')) {
      recordReads += 1;
    } else if (recording) {
      otherRequestsAfterRecording.push(url.pathname);
    }
  });
  return {
    get reads() {
      return recordReads;
    },
    startRecording() {
      recording = true;
    },
    others: otherRequestsAfterRecording,
  };
};

test('renders the read-only profile with identity, KPIs, map, enrollments, history, and advisor', async () => {
  const user = await createUser({
    advisor_id: 2,
    faculty: 'Engineering',
    student_id: '3020117',
  });
  seedAdvisor();
  seedRecord(user.id as number);

  await renderApp(<ProfileRoute />, {
    user,
    path: '/app/profile',
    url: '/app/profile',
  });

  expect(await screen.findByText('Sara Student')).toBeInTheDocument();
  expect(screen.getByText('3020117')).toBeInTheDocument();
  expect(screen.getByText(user.email)).toBeInTheDocument();
  expect(screen.getByText('Engineering')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();

  expect(screen.getByText('3.2')).toBeInTheDocument();
  expect(screen.getByText('60 credit hours')).toBeInTheDocument();

  expect(screen.getByText('Completed')).toBeInTheDocument();
  expect(screen.getByText('Planned')).toBeInTheDocument();
  expect(screen.getByText('Eligible')).toBeInTheDocument();
  expect(screen.getByText('Locked')).toBeInTheDocument();

  expect(screen.getAllByText('EE 210').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('Group G1, Section 01')).toBeInTheDocument();

  expect(screen.getByText('2025F')).toBeInTheDocument();
  expect(screen.getByText('A')).toBeInTheDocument();

  expect(await screen.findByText('Amr Advisor')).toBeInTheDocument();
  expect(screen.getByText('Sunday 10:00-12:00')).toBeInTheDocument();

  expect(screen.queryAllByRole('status')).toHaveLength(0);
  expect(screen.queryAllByRole('button')).toHaveLength(0);
  expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  expect(screen.queryAllByRole('combobox')).toHaveLength(0);
  expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
});

test('shows one stale banner listing the stale datasets and retries the record only', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedAdvisor();
  seedRecord(user.id as number, { staleness: JSON.stringify(STALE_STALENESS) });
  const reads = trackRequests();

  await renderApp(<ProfileRoute />, {
    user,
    path: '/app/profile',
    url: '/app/profile',
  });

  const banners = await screen.findAllByRole('status');
  expect(banners).toHaveLength(1);
  expect(banners[0]).toHaveTextContent(/Data as of/);
  expect(banners[0]).toHaveTextContent('academic record');
  expect(banners[0]).toHaveTextContent('course catalog');
  expect(banners[0]).not.toHaveTextContent('identity');

  expect(await screen.findByText('Amr Advisor')).toBeInTheDocument();

  reads.startRecording();
  await userEvent.click(screen.getByRole('button', { name: /retry/i }));

  await waitFor(() => expect(reads.reads).toBe(2));
  expect(reads.others).toEqual([]);
});

test('renders compact empty states for empty sections and the retry copy for an empty map', async () => {
  const user = await createUser();
  seedRecord(user.id as number, {
    history: '[]',
    current_enrollments: '[]',
    prerequisite_map: '[]',
  });
  const reads = trackRequests();

  await renderApp(<ProfileRoute />, {
    user,
    path: '/app/profile',
    url: '/app/profile',
  });

  expect(
    await screen.findByText('No current enrollments.'),
  ).toBeInTheDocument();
  expect(screen.getByText('No finished courses yet.')).toBeInTheDocument();
  expect(
    screen.getByText('Your course map is not available yet.'),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /retry/i }));

  await waitFor(() => expect(reads.reads).toBe(2));
});

test('renders the calm no-advisor line when no advisor is assigned', async () => {
  const user = await createUser();
  seedRecord(user.id as number);

  await renderApp(<ProfileRoute />, {
    user,
    path: '/app/profile',
    url: '/app/profile',
  });

  expect(
    await screen.findByText(
      'You have no assigned advisor yet. The administration office assigns advisors.',
    ),
  ).toBeInTheDocument();
});
