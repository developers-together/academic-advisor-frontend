import dayjs from 'dayjs';

import AdvisorMeetingsRoute from '@/app/routes/advisor/meetings';
import { db } from '@/testing/mocks/db';
import { CURRENT_TERM } from '@/testing/mocks/mock-auth';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
  type MockUser,
} from '@/testing/test-utils';

const seedStudent = async (advisor: MockUser, name: string, id: string) =>
  createUser({ name, student_id: id, advisor_id: advisor.id as number });

const seedMeeting = (
  studentId: number,
  advisorId: number,
  overrides: Record<string, unknown> = {},
) =>
  db.meetingRequest.create({
    studentId,
    advisorId,
    requesterId: studentId,
    direction: 'student_to_advisor',
    status: 'requested',
    reason: 'plan_review',
    note: null,
    slots: JSON.stringify([]),
    selectedSlotIndex: null,
    cancellationReason: null,
    term_code: CURRENT_TERM,
    createdAt: dayjs().toISOString(),
    completedAt: null,
    ...overrides,
  });

test('a student request lands in Needs action with the decision actions', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const student = await seedStudent(advisor, 'Lina Majors', '3020451');
  seedMeeting(student.id as number, advisor.id as number);

  await renderApp(<AdvisorMeetingsRoute />, {
    user: advisor,
    path: '/advisor/meetings',
    url: '/advisor/meetings',
  });

  expect(await screen.findByText('Lina Majors')).toBeInTheDocument();
  expect(screen.getByText('Requested')).toBeInTheDocument();
  expect(
    screen.getByRole('tab', { name: /Needs action \(1\)/ }),
  ).toHaveAttribute('aria-selected', 'true');
  expect(
    screen.getByRole('button', { name: 'Confirm time' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Propose another time' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
});

test('confirming picks an availability slot and the card turns confirmed', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const student = await seedStudent(advisor, 'Omar Fathi', '3020452');
  const meeting = seedMeeting(student.id as number, advisor.id as number, {
    reason: 'academic_standing',
  });

  await renderApp(<AdvisorMeetingsRoute />, {
    user: advisor,
    path: '/advisor/meetings',
    url: '/advisor/meetings',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Confirm time' }),
  );

  const dialog = await screen.findByRole('dialog', {
    name: 'Confirm a time with Omar Fathi',
  });
  const firstRadio = await within(dialog).findAllByRole('radio');
  expect(firstRadio.length).toBeGreaterThan(0);

  await userEvent.click(firstRadio[0]);
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Confirm time' }),
  );

  await waitFor(() =>
    expect(
      db.meetingRequest.findFirst({
        where: { id: { equals: meeting.id as number } },
      })?.status,
    ).toBe('confirmed'),
  );
  await userEvent.click(await screen.findByRole('tab', { name: /Scheduled/ }));
  expect(await screen.findByText('Confirmed')).toBeInTheDocument();
  expect(screen.getByText('Confirmed time')).toBeInTheDocument();
});

test('decline moves the request to history with the reason attached', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const student = await seedStudent(advisor, 'Nour Adel', '3020453');
  const meeting = seedMeeting(student.id as number, advisor.id as number);

  await renderApp(<AdvisorMeetingsRoute />, {
    user: advisor,
    path: '/advisor/meetings',
    url: '/advisor/meetings',
  });

  await userEvent.click(await screen.findByRole('button', { name: 'Decline' }));

  const dialog = await screen.findByRole('dialog', {
    name: 'Decline this request?',
  });
  await userEvent.type(
    within(dialog).getByLabelText('Reason for the student'),
    'Bring your transcript to the office first.',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Decline' }),
  );

  await waitFor(() =>
    expect(
      db.meetingRequest.findFirst({
        where: { id: { equals: meeting.id as number } },
      })?.status,
    ).toBe('declined'),
  );

  await userEvent.click(await screen.findByRole('tab', { name: /History/ }));
  expect(await screen.findByText('Declined')).toBeInTheDocument();
  expect(
    await screen.findByText(
      'Reason: Bring your transcript to the office first.',
    ),
  ).toBeInTheDocument();
});

test('the advisor can invite a caseload student with proposed times', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const student = await seedStudent(advisor, 'Lina Majors', '3020451');

  await renderApp(<AdvisorMeetingsRoute />, {
    user: advisor,
    path: '/advisor/meetings',
    url: '/advisor/meetings',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Invite student' }),
  );

  const dialog = await screen.findByRole('dialog', {
    name: 'Invite a student to a meeting',
  });
  const combo = within(dialog).getByRole('combobox', { name: 'Student' });
  await userEvent.click(combo);
  await userEvent.type(combo, 'Lina');
  await userEvent.click(
    await screen.findByRole('option', { name: /Lina Majors/ }),
  );

  const slots = await within(dialog).findAllByRole('checkbox');
  expect(slots.length).toBeGreaterThan(0);
  await userEvent.click(slots[0]);

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Send invitation' }),
  );

  await waitFor(() =>
    expect(
      db.meetingRequest.findFirst({
        where: { studentId: { equals: student.id as number } },
      })?.status,
    ).toBe('awaiting_response'),
  );
  expect(
    await screen.findByText('Invitation sent to Lina Majors.'),
  ).toBeInTheDocument();
});
