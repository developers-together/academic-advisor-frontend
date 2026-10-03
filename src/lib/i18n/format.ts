import dayjs from 'dayjs';

import { dayjsInCairo } from './cairo';

export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions,
) => {
  const locale =
    document.documentElement.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(value);
};

export const formatDate = (value: string | Date) => {
  return dayjs(value).format('DD MMM YYYY');
};

export const formatDateTime = (value: string | Date) => {
  return `${dayjs(value).format('DD MMM YYYY')} ${dayjs(value).format('HH:mm')}`;
};

export const formatCairoSlotRange = (startsAt: string, endsAt: string) => {
  const start = dayjsInCairo(startsAt);
  const end = dayjsInCairo(endsAt);
  return `${start.format('DD MMM YYYY')}, ${start.format('HH:mm')}-${end.format('HH:mm')}`;
};
