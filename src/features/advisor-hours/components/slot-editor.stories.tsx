import type { Meta, StoryObj } from '@storybook/react-vite';

import { SlotEditor } from './slot-editor';

const meta: Meta<typeof SlotEditor> = {
  title: 'domain/SlotEditor',
  component: SlotEditor,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof SlotEditor>;

export const PublishedRows: Story = {
  render: () => (
    <SlotEditor
      initialRows={[
        { day: 'Sunday', from: '10:00', to: '12:00' },
        { day: 'Tuesday', from: '13:00', to: '15:00' },
      ]}
      onSubmit={() => {}}
    />
  ),
};

export const EmptyEditor: Story = {
  render: () => (
    <SlotEditor
      initialRows={[{ day: 'Sunday', from: '', to: '' }]}
      onSubmit={() => {}}
    />
  ),
};

export const OverlappingRows: Story = {
  render: () => (
    <SlotEditor
      initialRows={[
        { day: 'Sunday', from: '10:00', to: '12:00' },
        { day: 'Sunday', from: '11:00', to: '13:00' },
      ]}
      onSubmit={() => {}}
    />
  ),
};
