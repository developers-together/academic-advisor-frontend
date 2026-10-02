import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone';
import utcPlugin from 'dayjs/plugin/utc';

dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

export const CAIRO_TIMEZONE = 'Africa/Cairo';

export const dayjsInCairo = (value: string | Date) =>
  dayjs(value).tz(CAIRO_TIMEZONE);

export const toCairoInstant = (date: string, time: string) =>
  dayjs.tz(`${date} ${time}`, CAIRO_TIMEZONE).toISOString();
