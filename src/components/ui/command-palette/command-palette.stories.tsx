import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, LayoutDashboard, MessagesSquare, Users } from 'lucide-react';
import * as React from 'react';

import { CommandPalette, type CommandGroup } from './command-palette';

const groups: CommandGroup[] = [
  {
    headingKey: 'commandPalette.sections.pages',
    entries: [
      { id: 'home', label: 'Home', icon: LayoutDashboard, onSelect: () => {} },
      { id: 'plan', label: 'My Plan', icon: FileText, onSelect: () => {} },
      {
        id: 'ai',
        label: 'AI Advisor',
        icon: MessagesSquare,
        onSelect: () => {},
      },
    ],
  },
  {
    headingKey: 'commandPalette.sections.students',
    entries: [
      {
        id: 'student',
        label: 'Lina Majors',
        icon: Users,
        meta: '3020111',
        onSelect: () => {},
      },
    ],
  },
];

const meta: Meta<typeof CommandPalette> = {
  title: 'ui/CommandPalette',
  component: CommandPalette,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof CommandPalette>;

const OpenPalette = () => {
  const [open, setOpen] = React.useState(true);
  return <CommandPalette open={open} onOpenChange={setOpen} groups={groups} />;
};

export const Open: Story = {
  render: () => <OpenPalette />,
};
