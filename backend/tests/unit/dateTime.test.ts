import {
  addDays,
  dayOfWeekOf,
  generateSlots,
  isInPast,
  isValidDateString,
  minutesToTime,
  normalizeTime,
  timeToMinutes,
} from '../../src/utils/dateTime';

describe('time helpers', () => {
  it('converts between HH:mm and minutes', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(minutesToTime(570)).toBe('09:30');
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('drops seconds from MySQL TIME values', () => {
    expect(normalizeTime('09:30:00')).toBe('09:30');
  });
});

describe('date helpers', () => {
  it('validates real calendar dates only', () => {
    expect(isValidDateString('2026-02-28')).toBe(true);
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('05/10/2026')).toBe(false);
  });

  it('finds the weekday without depending on the server time zone', () => {
    expect(dayOfWeekOf('2026-10-05')).toBe('MONDAY');
    expect(dayOfWeekOf('2026-10-04')).toBe('SUNDAY');
    expect(dayOfWeekOf('2026-10-01')).toBe('THURSDAY');
  });

  it('adds days across month boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('knows what is in the past, treating "right now" as past', () => {
    const now = new Date(2026, 9, 1, 10, 0); // 1 Oct 2026, 10:00 local
    expect(isInPast('2026-10-01', '09:30', now)).toBe(true);
    expect(isInPast('2026-10-01', '10:00', now)).toBe(true);
    expect(isInPast('2026-10-01', '10:30', now)).toBe(false);
    expect(isInPast('2026-10-02', '08:00', now)).toBe(false);
    expect(isInPast('2026-09-30', '23:59', now)).toBe(true);
  });
});

describe('generateSlots', () => {
  it('cuts a window into fixed-length slots', () => {
    expect(generateSlots([{ start_time: '09:00', end_time: '11:00' }], 30)).toEqual([
      { start_time: '09:00', end_time: '09:30' },
      { start_time: '09:30', end_time: '10:00' },
      { start_time: '10:00', end_time: '10:30' },
      { start_time: '10:30', end_time: '11:00' },
    ]);
  });

  it('drops a final slot that does not fit inside the window', () => {
    const slots = generateSlots([{ start_time: '09:00', end_time: '10:15' }], 30);
    expect(slots.map((s) => s.start_time)).toEqual(['09:00', '09:30']);
  });

  it('merges several windows and removes duplicates from overlaps', () => {
    const slots = generateSlots(
      [
        { start_time: '14:00', end_time: '15:00' },
        { start_time: '09:00', end_time: '10:00' },
        { start_time: '09:30', end_time: '10:30' },
      ],
      30,
    );
    expect(slots.map((s) => s.start_time)).toEqual(['09:00', '09:30', '10:00', '14:00', '14:30']);
  });

  it('returns nothing when there are no windows', () => {
    expect(generateSlots([], 30)).toEqual([]);
  });
});
