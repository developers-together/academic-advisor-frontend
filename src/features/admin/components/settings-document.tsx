import { QueueAgingCard } from '@/features/admin/components/queue-aging-card';
import { StaffCreateCard } from '@/features/admin/components/staff-create-card';

export const SettingsDocument = () => {
  return (
    <div className="max-w-3xl space-y-6">
      <StaffCreateCard />
      <QueueAgingCard />
    </div>
  );
};
