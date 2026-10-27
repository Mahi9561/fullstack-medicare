import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SlotPicker } from './SlotPicker';

const slots = [
  { start_time: '09:00', end_time: '09:30' },
  { start_time: '09:30', end_time: '10:00' },
  { start_time: '14:00', end_time: '14:30' },
];

describe('SlotPicker', () => {
  it('shows every free time on a 12-hour clock', () => {
    render(<SlotPicker slots={slots} value={null} loading={false} onChange={() => undefined} />);

    expect(screen.getByRole('radio', { name: '9:00 AM' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2:00 PM' })).toBeInTheDocument();
  });

  it('reports the chosen start time', async () => {
    const onChange = vi.fn();
    render(<SlotPicker slots={slots} value={null} loading={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: '9:30 AM' }));

    expect(onChange).toHaveBeenCalledWith('09:30');
  });

  it('marks the selected time for assistive technology', () => {
    render(<SlotPicker slots={slots} value="14:00" loading={false} onChange={() => undefined} />);

    expect(screen.getByRole('radio', { name: '2:00 PM' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '9:00 AM' })).toHaveAttribute('aria-checked', 'false');
  });

  it('explains an empty day instead of showing nothing', () => {
    render(<SlotPicker slots={[]} value={null} loading={false} onChange={() => undefined} />);

    expect(screen.getByText('No free times on this day')).toBeInTheDocument();
  });
});
