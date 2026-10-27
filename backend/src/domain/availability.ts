import type { DayOfWeek } from '../config/constants';
import { timeToMinutes } from '../utils/dateTime';

export interface AvailabilityWindow {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

/** Returns the first pair of windows on the same day that overlap, or null. Touching windows are fine. */
export const findOverlap = (windows: AvailabilityWindow[]): [AvailabilityWindow, AvailabilityWindow] | null => {
  const byDay = new Map<DayOfWeek, AvailabilityWindow[]>();
  for (const window of windows) {
    byDay.set(window.day_of_week, [...(byDay.get(window.day_of_week) ?? []), window]);
  }
  for (const dayWindows of byDay.values()) {
    const sorted = [...dayWindows].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    for (let i = 1; i < sorted.length; i += 1) {
      if (timeToMinutes(sorted[i].start_time) < timeToMinutes(sorted[i - 1].end_time)) {
        return [sorted[i - 1], sorted[i]];
      }
    }
  }
  return null;
};
