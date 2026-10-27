import { DAYS_OF_WEEK, type DayOfWeek } from '../config/constants';

export interface TimeWindow {
  start_time: string;
  end_time: string;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m);
};

export const minutesToTime = (minutes: number): string => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** "09:30:00" -> "09:30" */
export const normalizeTime = (time: string): string => time.slice(0, 5);

export const addMinutes = (time: string, minutes: number): string => minutesToTime(timeToMinutes(time) + minutes);

export const isValidDateString = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

/** Day name for a YYYY-MM-DD string, computed in UTC so the server time zone cannot shift it. */
export const dayOfWeekOf = (date: string): DayOfWeek => {
  const [y, m, d] = date.split('-').map(Number);
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return DAYS_OF_WEEK[(jsDay + 6) % 7];
};

export const addDays = (date: string, days: number): string => {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
};

/** Clinic-local "today" (the server and the clinic share a clock in this local-only app). */
export const toLocalDateString = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

export const toLocalTimeString = (now: Date = new Date()): string => `${pad(now.getHours())}:${pad(now.getMinutes())}`;

export const todayLocal = (): string => toLocalDateString();

/** True when the given date and start time are at or before "now". */
export const isInPast = (date: string, startTime: string, now: Date = new Date()): boolean =>
  `${date} ${normalizeTime(startTime)}` <= `${toLocalDateString(now)} ${toLocalTimeString(now)}`;

/**
 * Cuts availability windows into fixed-length slots. A slot is only produced when it fits
 * completely inside a window, and duplicates from overlapping windows are removed.
 */
export const generateSlots = (windows: TimeWindow[], slotMinutes: number): TimeWindow[] => {
  const starts = new Set<number>();
  for (const window of windows) {
    const end = timeToMinutes(window.end_time);
    for (let start = timeToMinutes(window.start_time); start + slotMinutes <= end; start += slotMinutes) {
      starts.add(start);
    }
  }
  return [...starts]
    .sort((a, b) => a - b)
    .map((start) => ({ start_time: minutesToTime(start), end_time: minutesToTime(start + slotMinutes) }));
};
