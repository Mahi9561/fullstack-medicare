import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  ageFrom,
  blankToNull,
  compact,
  formatBloodPressure,
  formatTime,
  hasStarted,
  recordTypeLabel,
  toISODate,
} from './format';

describe('formatTime', () => {
  it('converts 24-hour times to 12-hour clock', () => {
    expect(formatTime('09:30')).toBe('9:30 AM');
    expect(formatTime('13:05')).toBe('1:05 PM');
  });

  it('handles midnight and noon', () => {
    expect(formatTime('00:00')).toBe('12:00 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
  });

  it('returns an empty string for missing values', () => {
    expect(formatTime(null)).toBe('');
    expect(formatTime(undefined)).toBe('');
  });
});

describe('date helpers', () => {
  it('adds days across month and year boundaries without time zone drift', () => {
    expect(addDaysISO('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('formats a Date as a local YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('computes age and respects birthdays that have not happened yet', () => {
    const today = new Date(2026, 9, 1); // 1 Oct 2026
    expect(ageFrom('1990-10-01', today)).toBe(36);
    expect(ageFrom('1990-10-02', today)).toBe(35);
    expect(ageFrom('2026-01-01', today)).toBe(0);
  });

  it('knows whether an appointment has started', () => {
    const now = new Date(2026, 9, 1, 10, 0);
    expect(hasStarted('2026-10-01', '09:30', now)).toBe(true);
    expect(hasStarted('2026-10-01', '10:00', now)).toBe(true);
    expect(hasStarted('2026-10-01', '10:30', now)).toBe(false);
    expect(hasStarted('2026-10-02', '08:00', now)).toBe(false);
  });
});

describe('small formatters', () => {
  it('formats blood pressure only when both values exist', () => {
    expect(formatBloodPressure(120, 80)).toBe('120/80');
    expect(formatBloodPressure(120, null)).toBe('');
  });

  it('labels record types readably', () => {
    expect(recordTypeLabel('LAB_REPORT')).toBe('Lab report');
    expect(recordTypeLabel('VACCINATION')).toBe('Vaccination');
  });

  it('turns blank form input into null', () => {
    expect(blankToNull('  ')).toBeNull();
    expect(blankToNull(undefined)).toBeNull();
    expect(blankToNull(' hello ')).toBe('hello');
  });

  it('drops empty query params but keeps zero and false', () => {
    expect(compact({ a: '', b: undefined, c: null, d: 0, e: false, f: 'x' })).toEqual({ d: 0, e: false, f: 'x' });
  });
});
