import { toCairoInstant } from '@/lib/i18n/cairo';

export type SlotInput = { date: string; start: string; end: string };

export const slotInputsToInstants = (slots: SlotInput[]) =>
  slots.map(({ date, start, end }) => ({
    starts_at: toCairoInstant(date, start),
    ends_at: toCairoInstant(date, end),
  }));
