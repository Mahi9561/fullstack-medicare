import type { AppointmentStatus } from '../config/constants';

/** The appointment state machine. Anything not listed here is an illegal change (409). */
const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  BOOKED: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export const canTransition = (from: AppointmentStatus, to: AppointmentStatus): boolean =>
  TRANSITIONS[from].includes(to);
