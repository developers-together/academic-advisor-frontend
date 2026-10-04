import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { formatCairoSlotRange } from '@/lib/i18n/format';
import type { MeetingOpenSlot } from '@/types/domain';
import { cn } from '@/utils/cn';

const slotKeyOf = (slot: { starts_at: string; ends_at: string }) =>
  `${dayjs(slot.starts_at).valueOf()}-${dayjs(slot.ends_at).valueOf()}`;

export type SlotPickerProps = {
  slots: MeetingOpenSlot[] | undefined;
  isPending?: boolean;
  /** 'single' picks one slot (confirm flows); 'multi' collects up to max. */
  mode?: 'single' | 'multi';
  selected: string[];
  onSelectedChange: (keys: string[]) => void;
  max?: number;
  className?: string;
};

export const SlotPicker = ({
  slots,
  isPending = false,
  mode = 'single',
  selected,
  onSelectedChange,
  max = 5,
  className,
}: SlotPickerProps) => {
  const { t } = useTranslation('advisor');

  if (isPending) {
    return (
      <div aria-busy="true" className={cn('space-y-2', className)}>
        <Skeleton className="h-8 w-full max-w-sm" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-8 w-full max-w-sm" />
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {t('meetings.slotPicker.empty')}
      </p>
    );
  }

  const byDay = new Map<string, MeetingOpenSlot[]>();
  for (const slot of slots) {
    const day = dayjs(slot.starts_at).format('dddd, DD MMM');
    const bucket = byDay.get(day) ?? [];
    bucket.push(slot);
    byDay.set(day, bucket);
  }

  const toggle = (key: string) => {
    if (mode === 'single') {
      onSelectedChange([key]);
      return;
    }
    if (selected.includes(key)) {
      onSelectedChange(selected.filter((entry) => entry !== key));
      return;
    }
    if (selected.length >= max) return;
    onSelectedChange([...selected, key]);
  };

  const fieldsetName =
    mode === 'single'
      ? t('meetings.slotPicker.singleLabel')
      : t('meetings.slotPicker.multiLabel');

  return (
    <fieldset className={cn('space-y-4', className)}>
      <legend className="sr-only">{fieldsetName}</legend>
      {[...byDay.entries()].map(([day, daySlots]) => (
        <div key={day} role="group" aria-label={day}>
          <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            {day}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {daySlots.map((slot) => {
              const key = slotKeyOf(slot);
              const isSelected = selected.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  role={mode === 'single' ? 'radio' : 'checkbox'}
                  aria-checked={isSelected}
                  disabled={slot.is_conflict && !isSelected}
                  onClick={() => (slot.is_conflict ? undefined : toggle(key))}
                  className={cn(
                    'flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                    slot.is_conflict
                      ? 'cursor-not-allowed border-border bg-muted text-muted-foreground line-through'
                      : 'hover:bg-accent',
                    isSelected &&
                      'border-primary bg-crimson-100 font-medium text-foreground',
                  )}
                >
                  {formatCairoSlotRange(slot.starts_at, slot.ends_at)}
                  {slot.is_conflict && (
                    <span className="text-2xs normal-case">
                      {t('meetings.slotPicker.booked')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
};

SlotPicker.displayName = 'SlotPicker';
