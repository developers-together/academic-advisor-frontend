import {
  render,
  screen,
  waitFor,
  within,
  userEvent,
} from '@/testing/test-utils';
import type { Plan } from '@/types/domain';

import { ReviewDrawer } from './review-drawer';

const plan: Plan = {
  id: 201,
  status: 'under_review',
  term_code: '2026F',
  summary: null,
  courses: [
    { course_code: 'CS 201', group: 'G1', section: '01', reason: null },
    { course_code: 'MATH 201', group: 'G2', section: '03', reason: null },
  ],
  total_credit_hours: 0,
  warnings: ['CS 201 sits outside the usual plan for this level.'],
  submitted_at: '2026-09-26T09:00:00.000Z',
  decided_at: null,
  return_reason: null,
};

const comments = [
  {
    id: 1,
    body: 'I picked up your plan for review.',
    author: { id: 2, name: 'Amr Advisor' },
    created_at: '2026-10-01T10:00:00.000Z',
  },
];

type Setup = {
  onApprove?: () => void;
  onReturn?: (reason: string) => void;
  onOpenChange?: (open: boolean) => void;
  onAddComment?: (body: string) => void;
  onRequestMeeting?: () => void;
  approveGate?: string[] | null;
  approveUnavailable?: { requestId: string | null } | null;
  returnError?: string | null;
  planOverrides?: Partial<Plan> | null;
  planUnavailable?: string | null;
  planReviewable?: boolean;
  cgpa?: number | null;
};

const renderDrawer = ({
  onApprove = () => {},
  onReturn = () => {},
  onOpenChange = () => {},
  onAddComment = () => {},
  onRequestMeeting,
  approveGate = null,
  approveUnavailable = null,
  returnError = null,
  planOverrides,
  planUnavailable = null,
  planReviewable = true,
  cgpa = 2.8,
}: Setup = {}) => {
  return render(
    <ReviewDrawer
      open
      onOpenChange={onOpenChange}
      student={{ id: 11, name: 'Lina Majors', student_id: '3020451' }}
      cgpa={cgpa}
      plan={planOverrides === null ? null : { ...plan, ...planOverrides }}
      planPending={false}
      planUnavailable={planUnavailable}
      planReviewable={planReviewable}
      onRequestMeeting={onRequestMeeting}
      comments={comments}
      onAddComment={onAddComment}
      approveGate={approveGate}
      approveUnavailable={approveUnavailable}
      onApprove={onApprove}
      returnError={returnError}
      onReturn={onReturn}
    />,
  );
};

const writeReason = async (text: string) => {
  await userEvent.type(
    screen.getByPlaceholderText('Write the return reason'),
    text,
  );
};

test('renders the student identity, CGPA line, and plan course lines', () => {
  renderDrawer();

  expect(
    screen.getByRole('heading', { name: 'Lina Majors' }),
  ).toBeInTheDocument();
  expect(screen.getByText('3020451')).toBeInTheDocument();
  expect(screen.getByText('CGPA 2.8')).toBeInTheDocument();
  expect(screen.getByText('Courses, 2026F')).toBeInTheDocument();
  expect(screen.getByText('CS 201')).toBeInTheDocument();
  expect(screen.getByText('MATH 201')).toBeInTheDocument();
  expect(screen.getByText('Advisory notes')).toBeInTheDocument();
});

test('renders the no-record line when the caseload carries no CGPA', () => {
  renderDrawer({ cgpa: null });

  expect(screen.getByText('No CGPA on record')).toBeInTheDocument();
});

test('approve opens a confirm that names the lock and focuses cancel', async () => {
  const onApprove = vi.fn();
  renderDrawer({ onApprove });

  await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

  const dialog = screen.getByRole('dialog', { name: 'Approve plan?' });
  expect(dialog).toHaveTextContent('Approval locks this plan.');
  expect(dialog).toHaveTextContent(
    'Lina Majors registers the courses in the SIS.',
  );
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Approve plan' }),
  );
  expect(onApprove).toHaveBeenCalledOnce();
});

test('return demands a reason before offering the confirm', async () => {
  const onReturn = vi.fn();
  renderDrawer({ onReturn });

  await userEvent.click(screen.getByRole('button', { name: 'Return plan' }));

  expect(
    screen.getByText('Write the reason so Lina Majors knows what to change.'),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('dialog', { name: 'Return plan?' }),
  ).not.toBeInTheDocument();
  expect(onReturn).not.toHaveBeenCalled();
});

test('return with a reason confirms and submits the text', async () => {
  const onReturn = vi.fn();
  renderDrawer({ onReturn });

  await writeReason('Please repeat CS 201 with a passing grade.');
  await userEvent.click(screen.getByRole('button', { name: 'Return plan' }));

  const dialog = screen.getByRole('dialog', { name: 'Return plan?' });
  expect(dialog).toHaveTextContent('The plan returns to the student');

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Return plan' }),
  );
  expect(onReturn).toHaveBeenCalledWith(
    'Please repeat CS 201 with a passing grade.',
  );
});

test('a server return error renders inline over the client error', () => {
  renderDrawer({ returnError: 'The plan was already decided.' });

  expect(screen.getByText('The plan was already decided.')).toHaveAttribute(
    'role',
    'alert',
  );
});

test('ESC with drafted text survives through a discard confirm', async () => {
  const onOpenChange = vi.fn();
  renderDrawer({ onOpenChange });

  await writeReason('Not yet final.');
  await userEvent.keyboard('{Escape}');

  const dialog = screen.getByRole('dialog', {
    name: 'Discard the return reason?',
  });
  expect(dialog).toHaveTextContent('Discard the return reason?');
  expect(onOpenChange).not.toHaveBeenCalledWith(false);

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Discard reason' }),
  );
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test('keeping the drafted reason closes the discard confirm and stays open', async () => {
  const onOpenChange = vi.fn();
  renderDrawer({ onOpenChange });

  await writeReason('Not yet final.');
  await userEvent.keyboard('{Escape}');
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(onOpenChange).not.toHaveBeenCalledWith(false);
  expect(screen.getByDisplayValue('Not yet final.')).toBeInTheDocument();
});

test('ESC with an empty reason closes clean', async () => {
  const onOpenChange = vi.fn();
  renderDrawer({ onOpenChange });

  await userEvent.keyboard('{Escape}');

  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(
    screen.queryByRole('dialog', { name: 'Discard the return reason?' }),
  ).not.toBeInTheDocument();
});

test('approve gate failures render as a destructive validation section and return stays available', () => {
  renderDrawer({
    approveGate: [
      "CS 201 is not in the student's course map.",
      'MATH 201 requires MATH 101 first.',
    ],
  });

  expect(screen.getByText('Validation results')).toBeInTheDocument();
  expect(
    screen.getByText("CS 201 is not in the student's course map."),
  ).toBeInTheDocument();
  expect(
    screen.getByText('MATH 201 requires MATH 101 first.'),
  ).toBeInTheDocument();
  const footer = screen
    .getByRole('button', { name: 'Approve' })
    .closest('div[class*="border-t"]') as HTMLElement;
  expect(
    within(footer).getByRole('button', { name: 'Return plan' }),
  ).toBeInTheDocument();
});

test('a 503 approval renders the retry banner with retry', async () => {
  const onApprove = vi.fn();
  renderDrawer({
    onApprove,
    approveUnavailable: { requestId: 'req-503' },
  });

  expect(
    screen.getByText('The university data service is unavailable.'),
  ).toBeInTheDocument();
  expect(screen.getByText('Request reference: req-503')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(onApprove).toHaveBeenCalled();
});

test('a pending plan renders the skeleton instead of the body', () => {
  render(
    <ReviewDrawer
      open
      onOpenChange={() => {}}
      student={{ id: 11, name: 'Lina Majors', student_id: '3020451' }}
      cgpa={2.8}
      plan={null}
      planPending
      comments={[]}
      onAddComment={() => {}}
      onApprove={() => {}}
      onReturn={() => {}}
    />,
  );

  expect(screen.queryByText('Courses, 2026F')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Approve' })).toBeDisabled();
});

test('a failed plan load renders the retry banner for the plan', async () => {
  const onRetryPlan = vi.fn();
  render(
    <ReviewDrawer
      open
      onOpenChange={() => {}}
      student={{ id: 11, name: 'Lina Majors', student_id: '3020451' }}
      cgpa={2.8}
      plan={null}
      planPending={false}
      planFailed
      onRetryPlan={onRetryPlan}
      comments={[]}
      onAddComment={() => {}}
      onApprove={() => {}}
      onReturn={() => {}}
    />,
  );

  expect(screen.getByText('Could not load this content.')).toBeInTheDocument();
  await userEvent.click(screen.getAllByRole('button', { name: 'Retry' })[0]);
  expect(onRetryPlan).toHaveBeenCalledOnce();
});

test('adding a comment posts through the thread composer', async () => {
  const onAddComment = vi.fn();
  renderDrawer({ onAddComment });

  await userEvent.type(
    screen.getByPlaceholderText('Write a comment for the student'),
    'Noted.',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Add comment' }));

  expect(onAddComment).toHaveBeenCalledWith('Noted.');
});

test('the footer actions stay reachable while the plan renders', async () => {
  renderDrawer();

  const approve = screen.getByRole('button', { name: 'Approve' });
  expect(approve).toBeEnabled();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Return plan' })).toBeEnabled(),
  );
});

test('the request meeting entry fires its callback when wired and stays absent otherwise', async () => {
  const onRequestMeeting = vi.fn();
  renderDrawer({ onRequestMeeting });

  await userEvent.click(
    screen.getByRole('button', { name: 'Request meeting' }),
  );
  expect(onRequestMeeting).toHaveBeenCalledOnce();
});

test('a student without a plan renders the no-plan message with the request meeting entry only', () => {
  const onRequestMeeting = vi.fn();
  renderDrawer({
    planOverrides: null,
    planUnavailable: 'Lina Majors has not created a plan this term.',
    onRequestMeeting,
  });

  expect(
    screen.getByText('Lina Majors has not created a plan this term.'),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Approve' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Return plan' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Request meeting' }),
  ).toBeInTheDocument();
});

test('a plan outside the review states hides the decision actions and names the queue', () => {
  renderDrawer({
    planOverrides: { status: 'approved' },
    planReviewable: false,
    onRequestMeeting: () => {},
  });

  expect(
    screen.getByText(
      'This plan is not waiting for review. Plans you can act on appear in the queue.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Approve' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Return plan' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Request meeting' }),
  ).toBeInTheDocument();
  expect(screen.getByText('CS 201')).toBeInTheDocument();
});
