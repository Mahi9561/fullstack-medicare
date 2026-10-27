import type { DayOfWeek } from '../../src/config/constants';
import { addDays, dayOfWeekOf, todayLocal } from '../../src/utils/dateTime';

/** The first date, at least `minDaysAhead` days from today, that falls on the given weekday. */
export const nextDateOn = (day: DayOfWeek, minDaysAhead = 2): string => {
  let date = addDays(todayLocal(), minDaysAhead);
  while (dayOfWeekOf(date) !== day) date = addDays(date, 1);
  return date;
};

export const yesterday = (): string => addDays(todayLocal(), -1);
