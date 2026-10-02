import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/form';
import type { AvailabilityWindowRow } from '@/types/domain';
import { cn } from '@/utils/cn';

const DAY_TOKENS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MAX_ROWS = 5;

export type SlotRowError = {
  key: 'rowIncomplete' | 'endBeforeStart' | 'overlap';
  day?: string;
};

export const slotRowErrors = (
  rows: AvailabilityWindowRow[],
  dayLabel: (day: string) => string,
): Array<SlotRowError | null> =>
  rows.map((row, index) => {
    if (!row.day || !row.from || !row.to) {
      return { key: 'rowIncomplete' };
    }
    if (row.to <= row.from) {
      return { key: 'endBeforeStart' };
    }
    const overlaps = rows.some(
      (other, otherIndex) =>
        otherIndex < index &&
        other.day === row.day &&
        other.from < row.to &&
        row.from < other.to,
    );
    return overlaps ? { key: 'overlap', day: dayLabel(row.day) } : null;
  });

export type SlotEditorProps = {
  initialRows: AvailabilityWindowRow[];
  onSubmit: (rows: AvailabilityWindowRow[]) => void;
  submitPending?: boolean;
};

export const SlotEditor = ({
  initialRows,
  onSubmit,
  submitPending = false,
}: SlotEditorProps) => {
  const { t } = useTranslation('advisor');
  const [rows, setRows] = useState<AvailabilityWindowRow[]>(initialRows);

  const dayLabel = (day: string) => t(`hours.days.${day.toLowerCase()}`);
  const errors = slotRowErrors(rows, dayLabel);
  const valid = errors.every((error) => error === null);

  const updateRow = (index: number, patch: Partial<AvailabilityWindowRow>) =>
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );

  const removeRow = (index: number) =>
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) {
          onSubmit(rows);
        }
      }}
      className="space-y-3"
    >
      <ul className="space-y-3">
        {rows.map((row, index) => {
          const error = errors[index];
          return (
            <li key={index} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <Label htmlFor={`slot-day-${index}`}>{t('hours.day')}</Label>
                  <select
                    id={`slot-day-${index}`}
                    value={row.day}
                    onChange={(event) =>
                      updateRow(index, { day: event.target.value })
                    }
                    className={cn(
                      'mt-1 block h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs',
                      'focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden',
                    )}
                  >
                    {DAY_TOKENS.map((token) => (
                      <option key={token} value={token}>
                        {dayLabel(token)}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label={t('hours.from')}
                  type="time"
                  value={row.from}
                  onChange={(event) =>
                    updateRow(index, { from: event.target.value })
                  }
                  className="w-28 text-sm"
                  id={`slot-from-${index}`}
                />
                <Input
                  label={t('hours.to')}
                  type="time"
                  value={row.to}
                  onChange={(event) =>
                    updateRow(index, { to: event.target.value })
                  }
                  className="w-28 text-sm"
                  id={`slot-to-${index}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('hours.removeRow')}
                  onClick={() => removeRow(index)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
              {error && (
                <p
                  role="alert"
                  className="mt-2 text-sm font-medium text-destructive"
                >
                  {t(`hours.errors.${error.key}`, {
                    ...(error.day ? { day: error.day } : {}),
                  })}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setRows((current) => [
              ...current,
              { day: 'Sunday', from: '', to: '' },
            ])
          }
          disabled={rows.length >= MAX_ROWS}
        >
          <Plus className="size-4" aria-hidden />
          {t('hours.addRow')}
        </Button>
        <p className="text-xs text-muted-foreground">{t('hours.maxRows')}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          isLoading={submitPending}
          aria-busy={submitPending}
          disabled={!valid || submitPending}
        >
          {t('hours.publish')}
        </Button>
        <p className="text-xs text-muted-foreground">{t('hours.timezone')}</p>
      </div>
    </form>
  );
};
