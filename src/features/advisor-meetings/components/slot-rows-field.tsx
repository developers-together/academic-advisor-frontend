import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';

import type { SlotInput } from '../api/slot-inputs';

export const emptySlotRow = (): SlotInput => ({
  date: '',
  start: '',
  end: '',
});

export type SlotRowError = 'rowIncomplete' | 'endBeforeStart' | null;

export const slotRowError = (row: SlotInput): SlotRowError => {
  if (!row.date || !row.start || !row.end) {
    return 'rowIncomplete';
  }
  return row.end <= row.start ? 'endBeforeStart' : null;
};

export type SlotRowsFieldProps = {
  rows: SlotInput[];
  onRowsChange: (rows: SlotInput[]) => void;
  maxRows?: number;
};

export const SlotRowsField = ({
  rows,
  onRowsChange,
  maxRows = 5,
}: SlotRowsFieldProps) => {
  const { t } = useTranslation('advisor');

  const updateRow = (index: number, patch: Partial<SlotInput>) =>
    onRowsChange(
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );

  const removeRow = (index: number) =>
    onRowsChange(rows.filter((_, rowIndex) => rowIndex !== index));

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const error = slotRowError(row);
        return (
          <div key={index} className="rounded-md border p-3">
            <div className="flex flex-wrap items-end gap-2">
              <Input
                label={t('meetings.slotDialog.date')}
                type="date"
                value={row.date}
                onChange={(event) =>
                  updateRow(index, { date: event.target.value })
                }
                className="text-sm"
              />
              <Input
                label={t('meetings.slotDialog.start')}
                type="time"
                value={row.start}
                onChange={(event) =>
                  updateRow(index, { start: event.target.value })
                }
                className="w-28 text-sm"
              />
              <Input
                label={t('meetings.slotDialog.end')}
                type="time"
                value={row.end}
                onChange={(event) =>
                  updateRow(index, { end: event.target.value })
                }
                className="w-28 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('meetings.slotDialog.removeRow')}
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
                {t(`meetings.slotDialog.errors.${error}`)}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRowsChange([...rows, emptySlotRow()])}
          disabled={rows.length >= maxRows}
        >
          <Plus className="size-4" aria-hidden />
          {t('meetings.slotDialog.addRow')}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t('meetings.slotDialog.maxRows')}
        </p>
      </div>
    </div>
  );
};
