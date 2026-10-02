import { useState } from 'react';

import { rtlRender, screen, userEvent } from '@/testing/test-utils';

import { ConfirmDialog } from '../confirm-dialog';

const ControlledConfirmDialog = ({
  onConfirm,
  onCancel,
  destructive = false,
  pending = false,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  pending?: boolean;
}) => {
  const [open, setOpen] = useState(true);

  return (
    <ConfirmDialog
      open={open}
      onCancel={() => {
        setOpen(false);
        onCancel();
      }}
      onConfirm={() => {
        setOpen(false);
        onConfirm();
      }}
      title="Return the plan?"
      body="The student sees your reason and can edit again."
      confirmLabel="Return plan"
      destructive={destructive}
      pending={pending}
    />
  );
};

test('renders nothing when closed and the dialog content when open', async () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  const { rerender } = rtlRender(
    <ConfirmDialog
      open={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Return the plan?"
      body="The student sees your reason."
      confirmLabel="Return plan"
    />,
  );

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  rerender(
    <ConfirmDialog
      open
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Return the plan?"
      body="The student sees your reason."
      confirmLabel="Return plan"
    />,
  );

  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Return the plan?')).toBeInTheDocument();
  expect(screen.getByText('The student sees your reason.')).toBeInTheDocument();
});

test('focus starts on the cancel button', async () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  rtlRender(
    <ControlledConfirmDialog onConfirm={onConfirm} onCancel={onCancel} />,
  );

  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
});

test('cancel closes the dialog without confirming', async () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  rtlRender(
    <ControlledConfirmDialog onConfirm={onConfirm} onCancel={onCancel} />,
  );

  await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('confirm fires the confirm callback', async () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  rtlRender(
    <ControlledConfirmDialog onConfirm={onConfirm} onCancel={onCancel} />,
  );

  await userEvent.click(
    await screen.findByRole('button', { name: 'Return plan' }),
  );

  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(onCancel).not.toHaveBeenCalled();
});

test('pending disables the confirm button', async () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  rtlRender(
    <ControlledConfirmDialog
      onConfirm={onConfirm}
      onCancel={onCancel}
      pending
    />,
  );

  const confirm = await screen.findByRole('button', {
    name: /return plan/i,
  });
  expect(confirm).toBeDisabled();

  await userEvent.click(confirm);
  expect(onConfirm).not.toHaveBeenCalled();
});

test('destructive renders the confirm button with the destructive variant', async () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  rtlRender(
    <ControlledConfirmDialog
      onConfirm={onConfirm}
      onCancel={onCancel}
      destructive
    />,
  );

  const confirm = await screen.findByRole('button', { name: 'Return plan' });
  expect(confirm).toHaveClass('bg-destructive');
});
