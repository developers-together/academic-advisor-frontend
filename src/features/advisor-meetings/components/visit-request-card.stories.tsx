import type { Meta, StoryObj } from '@storybook/react-vite';

import type { VisitRequest } from '@/types/domain';

import { VisitRequestCard } from './visit-request-card';

const meta: Meta<typeof VisitRequestCard> = {
  title: 'domain/VisitRequestCard',
  component: VisitRequestCard,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof VisitRequestCard>;

const baseRequest: VisitRequest = {
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

export const ProposedFromStudent: Story = {
  render: () => (
    <VisitRequestCard
      request={baseRequest}
      initiatedByMe={false}
      onMarkDone={() => {}}
      onProposeSlots={() => {}}
    />
  ),
};

export const ProposedWithoutTimes: Story = {
  render: () => (
    <VisitRequestCard
      request={{ ...baseRequest, slots: [] }}
      initiatedByMe
      onMarkDone={() => {}}
      onProposeSlots={() => {}}
    />
  ),
};

export const Done: Story = {
  render: () => (
    <VisitRequestCard
      request={{ ...baseRequest, status: 'done' }}
      initiatedByMe={false}
      onMarkDone={() => {}}
      onProposeSlots={() => {}}
    />
  ),
};
