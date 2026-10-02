import { formatCairoSlotRange } from '@/lib/i18n/format';
import type { VisitRequestSlot } from '@/types/domain';
import { cn } from '@/utils/cn';

export type SlotViewerProps = {
  slots: VisitRequestSlot[];
  className?: string;
};

export const SlotViewer = ({ slots, className }: SlotViewerProps) => {
  if (slots.length === 0) {
    return null;
  }

  return (
    <ul className={cn('space-y-1', className)}>
      {slots.map((slot) => (
        <li key={slot.id} className="text-sm tabular-nums">
          {formatCairoSlotRange(slot.starts_at, slot.ends_at)}
        </li>
      ))}
    </ul>
  );
};
