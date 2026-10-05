import { db } from '@/testing/mocks/db';
import { CURRENT_TERM, STALE_STALENESS } from '@/testing/mocks/mock-auth';
import { server } from '@/testing/mocks/server';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

import AccountRoute from '../account';
import MyAdvisorRoute from '../my-advisor';
import RecordRoute from '../record';

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

test('renders the read-only academic record with KPIs, map, enrollments, and history', async () => {
  const user = await createUser({
    advisor_id: 2,
    faculty: 'Engineering',
    student_id: '3020117',
  });
  seedRecord(user.id as number);

  await renderApp(<RecordRoute />, {
    user,
    path: '/app/record',
    url: '/app/record',
  });

  expect(await screen.findByText('3.2')).toBeInTheDocument();
  expect(screen.getByText('60 credit hours')).toBeInTheDocument();

  expect(screen.getByRole('group', { name: 'Course map' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /CS 101/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /CS 301/ })).toBeInTheDocument();
  expect(screen.getAllByText('1 of 4 courses completed').length).toBe(2);
  expect(screen.getByRole('img', { name: /25 percent/ })).toBeInTheDocument();
  expect(screen.getByText('Milestones')).toBeInTheDocument();
  expect(screen.getByText('First steps')).toBeInTheDocument();

  expect(screen.getAllByText('EE 210').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('Group G1, Section 01')).toBeInTheDocument();

  expect(screen.getByText('2025F')).toBeInTheDocument();
  expect(screen.getByText('A')).toBeInTheDocument();

  expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  expect(screen.queryAllByRole('combobox')).toHaveLength(0);
  expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
});

test('shows one stale banner listing the stale datasets and retries the record only', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedRecord(user.id as number, { staleness: JSON.stringify(STALE_STALENESS) });
  const reads = trackRequests();

  await renderApp(<RecordRoute />, {
    user,
    path: '/app/record',
    url: '/app/record',
  });

  const banners = await screen.findAllByRole('status');
  expect(banners).toHaveLength(1);
  expect(banners[0]).toHaveTextContent(/Data as of/);
  expect(banners[0]).toHaveTextContent('academic record');
  expect(banners[0]).toHaveTextContent('course catalog');
  expect(banners[0]).not.toHaveTextContent('identity');

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

  await renderApp(<RecordRoute />, {
    user,
    path: '/app/record',
    url: '/app/record',
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

test('renders the advisor identity, office hours, and the meetings empty state on My Advisor', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedAdvisor();

  await renderApp(<MyAdvisorRoute />, {
    user,
    path: '/app/advisor',
    url: '/app/advisor',
  });

  expect(await screen.findByText('Amr Advisor')).toBeInTheDocument();
  expect(screen.getByText('Sunday 10:00-12:00')).toBeInTheDocument();
  expect(screen.getByText('Meetings')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Request a meeting' }),
  ).toBeInTheDocument();
  expect(
    screen.getByText('No meetings with your advisor yet.'),
  ).toBeInTheDocument();
});

test('the student accepts a proposed slot and the meeting turns confirmed', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedAdvisor();
  const meeting = db.meetingRequest.create({
    studentId: user.id as number,
    advisorId: 2,
    requesterId: 2,
    direction: 'advisor_to_student',
    status: 'awaiting_response',
    reason: 'plan_review',
    note: 'Quick check before the window closes.',
    slots: JSON.stringify([
      {
        starts_at: '2026-11-08T08:00:00.000Z',
        ends_at: '2026-11-08T08:30:00.000Z',
      },
      {
        starts_at: '2026-11-08T08:30:00.000Z',
        ends_at: '2026-11-08T09:00:00.000Z',
      },
    ]),
    selectedSlotIndex: null,
    cancellationReason: null,
    term_code: CURRENT_TERM,
  });

  await renderApp(<MyAdvisorRoute />, {
    user,
    path: '/app/advisor',
    url: '/app/advisor',
  });

  const radios = await screen.findAllByRole('radio');
  await userEvent.click(radios[1]);
  await userEvent.click(screen.getByRole('button', { name: 'Accept time' }));

  await waitFor(() =>
    expect(
      db.meetingRequest.findFirst({
        where: { id: { equals: meeting.id as number } },
      })?.status,
    ).toBe('confirmed'),
  );
  expect(await screen.findByText('Confirmed')).toBeInTheDocument();
  expect(screen.getByText('Confirmed time')).toBeInTheDocument();
});

test('the student requests a meeting with a reason and an optional note', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedAdvisor();

  await renderApp(<MyAdvisorRoute />, {
    user,
    path: '/app/advisor',
    url: '/app/advisor',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Request a meeting' }),
  );

  const dialog = await screen.findByRole('dialog', {
    name: 'Request a meeting with your advisor',
  });
  await userEvent.selectOptions(
    within(dialog).getByLabelText('Reason'),
    'course_selection',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Add a note'),
    'Which electives fit my plan?',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Send request' }),
  );

  await waitFor(() =>
    expect(
      db.meetingRequest.findFirst({
        where: { studentId: { equals: user.id as number } },
      })?.reason,
    ).toBe('course_selection'),
  );
  expect(
    await screen.findByText('Request sent to your advisor.'),
  ).toBeInTheDocument();
});

test('renders the calm no-advisor line when no advisor is assigned', async () => {
  const user = await createUser();

  await renderApp(<MyAdvisorRoute />, {
    user,
    path: '/app/advisor',
    url: '/app/advisor',
  });

  expect(
    await screen.findByText(
      'You have no assigned advisor yet. The administration office assigns advisors.',
    ),
  ).toBeInTheDocument();
});

test('renders the identity and the sign-out action on Account', async () => {
  const user = await createUser({
    faculty: 'Engineering',
    student_id: '3020117',
  });
  seedRecord(user.id as number);

  await renderApp(<AccountRoute />, {
    user,
    path: '/app/account',
    url: '/app/account',
  });

  expect(await screen.findByText('Sara Student')).toBeInTheDocument();
  expect(screen.getByText('3020117')).toBeInTheDocument();
  expect(screen.getByText(user.email)).toBeInTheDocument();
  expect(screen.getByText('Engineering')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
});
