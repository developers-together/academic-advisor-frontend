import type { Meta, StoryObj } from '@storybook/react-vite';

import { Combobox } from './combobox';

const meta: Meta<typeof Combobox> = {
  title: 'ui/Combobox',
  component: Combobox,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Combobox>;

const options = [
  {
    value: 'CS 101',
    label: 'CS 101 Introduction to Programming',
    hint: 'Completed',
  },
  { value: 'MATH 101', label: 'MATH 101 Calculus I', hint: 'Completed' },
  { value: 'CS 201', label: 'CS 201 Data Structures', hint: 'Eligible' },
  { value: 'MATH 201', label: 'MATH 201 Calculus II', hint: 'Eligible' },
  { value: 'CS 301', label: 'CS 301 Algorithms', hint: 'Locked' },
];

export const Default: Story = {
  render: () => (
    <div className="max-w-sm">
      <Combobox
        options={options}
        placeholder="Add a course"
        ariaLabel="Add a course"
        emptyMessage={(query) => `No courses match "${query}".`}
        onSelect={() => {}}
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="max-w-sm">
      <Combobox
        options={options}
        placeholder="Add a course"
        ariaLabel="Add a course"
        emptyMessage={(query) => `No courses match "${query}".`}
        onSelect={() => {}}
        disabled
      />
    </div>
  ),
};
