import type { Meta, StoryObj } from '@storybook/react-vite';

import { ReviewDrawer } from './review-drawer';

const meta: Meta<typeof ReviewDrawer> = {
  title: 'domain/ReviewDrawer',
  component: ReviewDrawer,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof ReviewDrawer>;

const plan = {
  id: 201,
  status: 'under_review' as const,
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

const student = { id: 11, name: 'Lina Majors', student_id: '3020451' };

export const UnderReview: Story = {
  render: () => (
    <div className="h-dvh bg-background p-6">
      <ReviewDrawer
        open
        onOpenChange={() => {}}
        student={student}
        cgpa={2.8}
        plan={plan}
        planPending={false}
        comments={comments}
        onAddComment={() => {}}
        onApprove={() => {}}
        onReturn={() => {}}
      />
    </div>
  ),
};

export const ApproveGateFailures: Story = {
  render: () => (
    <div className="h-dvh bg-background p-6">
      <ReviewDrawer
        open
        onOpenChange={() => {}}
        student={student}
        cgpa={2.8}
        plan={plan}
        planPending={false}
        comments={comments}
        onAddComment={() => {}}
        approveGate={[
          "CS 201 is not in the student's course map.",
          'MATH 201 requires MATH 101 first.',
        ]}
        onApprove={() => {}}
        onReturn={() => {}}
      />
    </div>
  ),
};

export const SisUnavailable: Story = {
  render: () => (
    <div className="h-dvh bg-background p-6">
      <ReviewDrawer
        open
        onOpenChange={() => {}}
        student={student}
        cgpa={2.8}
        plan={plan}
        planPending={false}
        comments={comments}
        onAddComment={() => {}}
        approveUnavailable={{ requestId: 'req-503' }}
        onApprove={() => {}}
        onReturn={() => {}}
      />
    </div>
  ),
};

export const PlanLoading: Story = {
  render: () => (
    <div className="h-dvh bg-background p-6">
      <ReviewDrawer
        open
        onOpenChange={() => {}}
        student={student}
        cgpa={null}
        plan={null}
        planPending
        comments={[]}
        onAddComment={() => {}}
        onApprove={() => {}}
        onReturn={() => {}}
      />
    </div>
  ),
};
