import { render, screen, userEvent } from '@/testing/test-utils';
import type { VisitRequest } from '@/types/domain';

import { VisitRequestCard } from './visit-request-card';

const proposedRequest: VisitRequest = {
  id: 7,
  status: 'proposed',
  term_code: '2026F',
  initiator_id: 11,
  student: { id: 11, name: 'Lina Majors', student_id: '3020451' },
  slots: [
    {
      id: 701,
      starts_at: '2026-11-05T12:00:00.000Z',
      ends_at: '2026-11-05T13:00:00.000Z',
    },
  ],
  created_at: '2026-10-01T09:00:00.000Z',
};

const doneRequest: VisitRequest = {
  ...proposedRequest,
  id: 8,
  status: 'done',
  initiator_id: 2,
  student: { id: 12, name: 'Omar Fathi', student_id: '3020452' },
  slots: [],
};

test('a proposed request renders identity, the direction line, Cairo slots, and both actions', async () => {
  const onMarkDone = vi.fn();
  const onProposeSlots = vi.fn();
  render(
    <VisitRequestCard
      request={proposedRequest}
      initiatedByMe={false}
      onMarkDone={onMarkDone}
      onProposeSlots={onProposeSlots}
    />,
  );

  expect(screen.getByText('Lina Majors')).toBeInTheDocument();
  expect(screen.getByText('3020451')).toBeInTheDocument();
  expect(screen.getByText('Requested by Lina Majors')).toBeInTheDocument();
  expect(screen.getByText('05 Nov 2026, 14:00-15:00')).toBeInTheDocument();
  expect(screen.getByText('Proposed')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Mark done' }));
  expect(onMarkDone).toHaveBeenCalledOnce();

  await userEvent.click(screen.getByRole('button', { name: 'Propose slots' }));
  expect(onProposeSlots).toHaveBeenCalledOnce();
});

test('a request raised by the advisor names the advisor as the requester', () => {
  render(
    <VisitRequestCard
      request={{ ...proposedRequest, initiator_id: 2 }}
      initiatedByMe
      onMarkDone={() => {}}
      onProposeSlots={() => {}}
    />,
  );

  expect(screen.getByText('Requested by you')).toBeInTheDocument();
});

test('a done request renders the done badge and no actions', () => {
  const onMarkDone = vi.fn();
  render(
    <VisitRequestCard
      request={doneRequest}
      initiatedByMe={false}
      onMarkDone={onMarkDone}
      onProposeSlots={() => {}}
    />,
  );

  expect(screen.getByText('Requested by Omar Fathi')).toBeInTheDocument();
  expect(screen.getByText('Done')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Mark done' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Propose slots' }),
  ).not.toBeInTheDocument();
});
