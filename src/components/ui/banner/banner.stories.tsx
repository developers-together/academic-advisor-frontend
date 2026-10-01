import type { Meta, StoryObj } from '@storybook/react-vite';

import { Banner, ErrorState } from './banner';

const meta: Meta<typeof Banner> = {
  title: 'ui/Banner',
  component: Banner,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Banner>;

export const Info: Story = {
  render: () => (
    <div className="space-y-4">
      <Banner variant="info" title="These are the default hours.">
        Publish to make them yours.
      </Banner>
      <Banner variant="warning" title="Data as of 01 Oct 2026 12:00.">
        The university data service was last reachable then. Retry when you are
        back online.
      </Banner>
      <Banner variant="destructive" title="Could not load your plan.">
        The connection dropped. Retry in a moment.
      </Banner>
      <Banner variant="window-closed" title="Registration is closed.">
        Your approved plan waits for the next window.
      </Banner>
    </div>
  ),
};

export const Error: Story = {
  render: () => <ErrorState onRetry={() => {}} requestId="req-8f14e2" />,
};
