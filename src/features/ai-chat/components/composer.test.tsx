import { useState } from 'react';

import { render, screen, userEvent } from '@/testing/test-utils';

import { Composer } from './composer';

const ComposerHarness = () => {
  const [value, setValue] = useState('');
  return (
    <Composer
      value={value}
      onChange={setValue}
      onSend={() => {}}
      onStop={() => {}}
      replying={false}
      quotaExhausted={false}
    />
  );
};

const renderComposer = () => render(<ComposerHarness />);

const getTextarea = () => screen.getByLabelText('Message your AI advisor');

const setContentBox = (element: HTMLElement, scrollHeight: number) => {
  element.style.borderStyle = 'solid';
  element.style.borderTopWidth = '1px';
  element.style.borderBottomWidth = '1px';
  Object.defineProperty(element, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  });
};

test('sizes an at-rest field to its content plus its borders so no scrollbar shows', async () => {
  renderComposer();
  const textarea = getTextarea();
  setContentBox(textarea, 44);

  await userEvent.type(textarea, 'a');

  expect(textarea).toHaveStyle({ height: '46px' });
});

test('keeps growing with multi-line input until the 160px cap', async () => {
  renderComposer();
  const textarea = getTextarea();
  setContentBox(textarea, 120);

  await userEvent.type(textarea, 'a');

  expect(textarea).toHaveStyle({ height: '122px' });
});

test('caps the height at 160px once content passes the cap', async () => {
  renderComposer();
  const textarea = getTextarea();
  setContentBox(textarea, 300);

  await userEvent.type(textarea, 'a');

  expect(textarea).toHaveStyle({ height: '160px' });
});
