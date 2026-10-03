import * as React from 'react';

import { Button } from '@/components/ui/button';
import { useDisclosure } from '@/hooks/use-disclosure';
import { i18n } from '@/lib/i18n/i18n-instance';
import { rtlRender, screen, userEvent, waitFor } from '@/testing/test-utils';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../dialog';

const openButtonText = 'Open Modal';
const cancelButtonText = 'Cancel';
const titleText = 'Modal Title';

const TestDialog = () => {
  const { close, open, isOpen } = useDisclosure();
  const cancelButtonRef = React.useRef(null);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          close();
        } else {
          open();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">{openButtonText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
        </DialogHeader>

        <DialogFooter>
          <Button type="submit">Submit</Button>
          <Button ref={cancelButtonRef} variant="outline" onClick={close}>
            {cancelButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

test('should handle basic dialog flow', async () => {
  rtlRender(<TestDialog />);

  expect(screen.queryByText(titleText)).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: openButtonText }));

  expect(await screen.findByText(titleText)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: cancelButtonText }));

  await waitFor(() =>
    expect(screen.queryByText(titleText)).not.toBeInTheDocument(),
  );
});

test('built-in close label follows the active language', async () => {
  await i18n.changeLanguage('en');
  const { unmount: unmountEn } = rtlRender(<TestDialog />);

  await userEvent.click(screen.getByRole('button', { name: openButtonText }));
  expect(
    await screen.findByRole('button', { name: 'Close' }),
  ).toBeInTheDocument();
  unmountEn();

  await i18n.changeLanguage('ar');
  const { unmount: unmountAr } = rtlRender(<TestDialog />);

  await userEvent.click(screen.getByRole('button', { name: openButtonText }));
  expect(
    await screen.findByRole('button', { name: 'إغلاق' }),
  ).toBeInTheDocument();
  unmountAr();

  await i18n.changeLanguage('en');
});
