import type { Meta, StoryObj } from '@storybook/react-vite';

import type { PrerequisiteMapEntry } from '@/types/domain';

import { PrereqMap } from './prereq-map';

const meta: Meta<typeof PrereqMap> = {
  title: 'domain/PrereqMap',
  component: PrereqMap,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof PrereqMap>;

const entries: PrerequisiteMapEntry[] = [
  {
    course_code: 'CS 101',
    title: 'Introduction to Programming',
    state: 'completed',
    prerequisites: [],
  },
  {
    course_code: 'EE 210',
    title: 'Circuits',
    state: 'planned',
    prerequisites: [],
  },
  {
    course_code: 'MATH 101',
    title: 'Calculus I',
    state: 'completed',
    prerequisites: [],
  },
  {
    course_code: 'CS 201',
    title: 'Data Structures',
    state: 'eligible',
    prerequisites: ['CS 101'],
  },
  {
    course_code: 'MATH 201',
    title: 'Calculus II',
    state: 'eligible',
    prerequisites: ['MATH 101'],
  },
  {
    course_code: 'CS 301',
    title: 'Algorithms',
    state: 'locked',
    prerequisites: ['CS 201'],
  },
];

export const FourStates: Story = {
  render: () => <PrereqMap entries={entries} />,
};

export const Empty: Story = {
  render: () => <PrereqMap entries={[]} onRetry={() => {}} />,
};
