import type { AppointmentStatus, DayOfWeek, Gender, RecordType } from '../types';

const pad = (n: number): string => String(n).padStart(2, '0');

/** "2026-10-05" -> "Mon, 5 Oct 2026". Built from parts, so the time zone can never shift the day. */
export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  );
};

/** "14:30" -> "2:30 PM" */
export const formatTime = (hhmm: string | null | undefined): string => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const formatTimeRange = (start: string, end: string): string => `${formatTime(start)} to ${formatTime(end)}`;

/** Full timestamp from the API ("2026-10-01T06:13:00.000Z") in the viewer's own zone. */
export const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

/** The calendar date of an API timestamp, in the viewer's own time zone. */
export const formatTimestampDate = (iso: string): string => formatDate(toISODate(new Date(iso)));

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const fullName = (person?: { first_name: string; last_name: string } | null): string =>
  person ? `${person.first_name} ${person.last_name}` : '';

export const doctorName = (doctor?: { first_name: string; last_name: string } | null): string =>
  doctor ? `Dr. ${fullName(doctor)}` : '';

export const toISODate = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayISO = (): string => toISODate(new Date());

export const addDaysISO = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d + days));
};

/** True once the appointment's start time has passed, in the viewer's local time. */
export const hasStarted = (dateISO: string, startTime: string, now: Date = new Date()): boolean => {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [hh, mm] = startTime.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm) <= now;
};

export const ageFrom = (dateOfBirth: string, today: Date = new Date()): number => {
  const [y, m, d] = dateOfBirth.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
};

/** "120/80" from the two stored integers. */
export const formatBloodPressure = (systolic: number | null, diastolic: number | null): string =>
  systolic != null && diastolic != null ? `${systolic}/${diastolic}` : '';

const titleCase = (value: string): string => value.charAt(0) + value.slice(1).toLowerCase();

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  BOOKED: 'Booked',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};

export const dayLabel = (day: DayOfWeek): string => titleCase(day);
export const genderLabel = (gender: Gender): string => titleCase(gender);
export const recordTypeLabel = (type: RecordType): string => titleCase(type.replace('_', ' '));

/** Drops empty values so they are not sent as "?search=" query params. */
export const compact = <T extends object>(params: T): Partial<T> =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Partial<T>;

/** Turns '' into undefined / null for optional form fields before they are sent. */
export const blankToNull = (value: string | undefined | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};
