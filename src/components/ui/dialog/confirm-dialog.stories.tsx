import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { ConfirmDialog } from './confirm-dialog';

const DemoConfirmDialog = ({
  destructive = false,
  pending = false,
  title = 'Return the plan?',
  body = 'The student sees your reason and can edit the plan again.',
  confirmLabel = 'Return plan',
}: {
  destructive?: boolean;
  pending?: boolean;
  title?: string;
  body?: string;
  confirmLabel?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open confirm dialog</Button>
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        title={title}
        body={body}
        confirmLabel={confirmLabel}
        destructive={destructive}
        pending={pending}
      />
    </>
  );
};

const meta: Meta<typeof ConfirmDialog> = {
  title: 'ui/ConfirmDialog',
  component: ConfirmDialog,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

export const Default: Story = {
  render: () => <DemoConfirmDialog />,
};

export const Destructive: Story = {
  render: () => (
    <DemoConfirmDialog
      destructive
      title="Discard this plan?"
      body="All courses in the plan are removed. This cannot be undone."
      confirmLabel="Discard plan"
    />
  ),
};

export const Pending: Story = {
  render: () => (
    <DemoConfirmDialog
      destructive
      pending
      title="Discard this plan?"
      body="All courses in the plan are removed. This cannot be undone."
      confirmLabel="Discard plan"
    />
  ),
};
