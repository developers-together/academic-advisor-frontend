import type { Meta, StoryObj } from '@storybook/react-vite';

import { StaleSisBanner } from './stale-sis-banner';

const meta: Meta<typeof StaleSisBanner> = {
  title: 'domain/StaleSisBanner',
  component: StaleSisBanner,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof StaleSisBanner>;

export const RecordAndCatalogStale: Story = {
  render: () => (
    <StaleSisBanner
      staleness={{
        identity: false,
        academic_record: true,
        course_catalog: true,
      }}
      lastSyncedAt="2026-10-01T12:00:00.000Z"
      onRetry={() => {}}
    />
  ),
};

export const Fresh: Story = {
  render: () => (
    <StaleSisBanner
      staleness={{
        identity: false,
        academic_record: false,
        course_catalog: false,
      }}
      lastSyncedAt="2026-10-01T12:00:00.000Z"
      onRetry={() => {}}
    />
  ),
};
