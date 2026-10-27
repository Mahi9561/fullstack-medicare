import type { Slot } from '../../types';
import { cx } from '../../utils/cx';
import { formatTime } from '../../utils/format';
import { EmptyState } from './EmptyState';

interface SlotPickerProps {
  slots: Slot[];
  value: string | null;
  loading: boolean;
  onChange: (startTime: string) => void;
}

export function SlotPicker({ slots, value, loading, onChange }: SlotPickerProps) {
  if (loading && slots.length === 0) return <p className="text-sm text-ink-soft">Loading available times...</p>;
  if (slots.length === 0) {
    return <EmptyState title="No free times on this day" description="The doctor is not working, or every slot is taken. Try another date." />;
  }
  return (
    <div role="radiogroup" aria-label="Available times" className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {slots.map((slot) => {
        const selected = value === slot.start_time;
        return (
          <button
            key={slot.start_time}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(slot.start_time)}
            className={cx(
              'h-10 rounded-md border text-sm tabular-nums transition-colors',
              selected ? 'border-pine-600 bg-pine-600 text-white' : 'border-rule bg-white hover:border-pine-400 hover:bg-pine-50',
            )}
          >
            {formatTime(slot.start_time)}
          </button>
        );
      })}
    </div>
  );
}
