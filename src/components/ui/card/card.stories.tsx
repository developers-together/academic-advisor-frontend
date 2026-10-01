import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card, CardBody, CardFooter, CardHeader, CardTitle } from './card';

const meta: Meta<typeof Card> = {
  title: 'ui/Card',
  component: Card,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Term 2026F</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-muted-foreground">4 courses planned</p>
      </CardBody>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Draft</p>
      </CardFooter>
    </Card>
  ),
};
