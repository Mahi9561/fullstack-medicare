import { APPOINTMENT_STATUSES, type AppointmentStatus } from '../../src/config/constants';
import { canTransition } from '../../src/domain/appointmentStatus';

const LEGAL: [AppointmentStatus, AppointmentStatus][] = [
  ['BOOKED', 'CONFIRMED'],
  ['BOOKED', 'CANCELLED'],
  ['BOOKED', 'NO_SHOW'],
  ['CONFIRMED', 'COMPLETED'],
  ['CONFIRMED', 'CANCELLED'],
  ['CONFIRMED', 'NO_SHOW'],
];

describe('appointment status transitions', () => {
  it.each(LEGAL)('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it('allows nothing else', () => {
    const legal = new Set(LEGAL.map(([from, to]) => `${from}>${to}`));
    for (const from of APPOINTMENT_STATUSES) {
      for (const to of APPOINTMENT_STATUSES) {
        if (!legal.has(`${from}>${to}`)) expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  it('treats completed, cancelled and no-show as final', () => {
    for (const final of ['COMPLETED', 'CANCELLED', 'NO_SHOW'] as const) {
      for (const to of APPOINTMENT_STATUSES) expect(canTransition(final, to)).toBe(false);
    }
  });

  it('does not allow skipping confirmation to complete a booked appointment', () => {
    expect(canTransition('BOOKED', 'COMPLETED')).toBe(false);
  });
});
