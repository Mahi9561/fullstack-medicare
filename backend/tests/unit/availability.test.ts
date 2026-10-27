import { findOverlap } from '../../src/domain/availability';

describe('findOverlap', () => {
  it('finds overlapping windows on the same day', () => {
    const overlap = findOverlap([
      { day_of_week: 'MONDAY', start_time: '09:00', end_time: '12:00' },
      { day_of_week: 'MONDAY', start_time: '11:30', end_time: '13:00' },
    ]);
    expect(overlap).not.toBeNull();
  });

  it('accepts windows that only touch', () => {
    expect(
      findOverlap([
        { day_of_week: 'MONDAY', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'MONDAY', start_time: '12:00', end_time: '13:00' },
      ]),
    ).toBeNull();
  });

  it('ignores identical times on different days', () => {
    expect(
      findOverlap([
        { day_of_week: 'MONDAY', start_time: '09:00', end_time: '12:00' },
        { day_of_week: 'TUESDAY', start_time: '09:00', end_time: '12:00' },
      ]),
    ).toBeNull();
  });

  it('does not depend on input order', () => {
    expect(
      findOverlap([
        { day_of_week: 'FRIDAY', start_time: '14:00', end_time: '16:00' },
        { day_of_week: 'FRIDAY', start_time: '09:00', end_time: '15:00' },
      ]),
    ).not.toBeNull();
  });
});
