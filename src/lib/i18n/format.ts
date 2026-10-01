import dayjs from 'dayjs';

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

export const formatTime = (value: string | Date) => {
  return dayjs(value).format('HH:mm');
};

export const formatDateTime = (value: string | Date) => {
  return `${dayjs(value).format('DD MMM YYYY')} ${dayjs(value).format('HH:mm')}`;
};
